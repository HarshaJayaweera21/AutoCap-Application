from models.baseline import Vocabulary # Needed for torch to unpickle properly if Vocabulary is referenced inside the checkpoint
import sys
sys.modules['__main__'].Vocabulary = Vocabulary # Hack to load custom objects pickled in main script
import os
import io
import gc
import time
import traceback
import torch
from PIL import Image
from fastapi import HTTPException
from transformers import CLIPModel, CLIPProcessor
from models.baseline import EncoderCNN, DecoderRNN, generate_caption, toTensor
from models.caption import CaptionModel, get_tokenizer, generate_caption_greedy, generate_multiple_captions, caption_transform
from models.vit_model import load_vit_model_for_inference, generate_multiple_captions_vit, vit_transform
from models.clip_evaluator import ClipEvaluator
from flagging.flag_engine import default_engine

# Number of candidate captions to generate for multi-caption models
NUM_CANDIDATE_CAPTIONS = 4

# Shared CLIP model name (used by both ViT encoder and CLIP evaluator)
SHARED_CLIP_MODEL_NAME = "openai/clip-vit-base-patch32"

# Canonical variant names
VARIANT_BASELINE = "baseline_model"
VARIANT_CAPTION  = "caption_model"
VARIANT_VIT      = "vit_model"

# Map every accepted alias -> canonical name
_VARIANT_ALIASES = {
    "baseline_model":   VARIANT_BASELINE,
    "base_line_model":  VARIANT_BASELINE,
    "baseline":         VARIANT_BASELINE,
    "caption_model":    VARIANT_CAPTION,
    "caption":          VARIANT_CAPTION,
    "vit_model":        VARIANT_VIT,
    "vit":              VARIANT_VIT,
    "vit_1_1":          VARIANT_VIT,
}


def _normalize_variant(raw: str) -> str:
    """Resolve a user-supplied variant string to its canonical name."""
    key = raw.strip().lower().replace("-", "_")
    canonical = _VARIANT_ALIASES.get(key)
    if canonical is None:
        raise ValueError(
            f"Unknown model variant '{raw}'. "
            f"Accepted values: {sorted(_VARIANT_ALIASES.keys())}"
        )
    return canonical


def _vram_mb() -> str:
    """Return a short VRAM usage string (allocated / reserved)."""
    if not torch.cuda.is_available():
        return "N/A (CPU mode)"
    alloc = torch.cuda.memory_allocated() / (1024 ** 2)
    reserved = torch.cuda.memory_reserved() / (1024 ** 2)
    return f"{alloc:.0f} MB allocated / {reserved:.0f} MB reserved"


class CaptionService:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"\n{'='*60}", flush=True)
        print(f"  CaptionService initializing  |  device: {self.device}", flush=True)
        print(f"  VRAM at init: {_vram_mb()}", flush=True)
        print(f"{'='*60}\n", flush=True)

        # -- Model References (Only ONE will be populated at a time) --
        self.baseline_encoder = None
        self.baseline_decoder = None
        self.baseline_vocab = None

        self.caption_model = None
        self.tokenizer = None

        self.vit_model = None

        # -- Shared CLIP (Always resident in VRAM ? very small, ~600 MB) --
        self.shared_clip_model = None
        self.shared_clip_processor = None
        self.clip_evaluator = None

        # -- Active variant tracking --
        self.active_variant = None          # canonical name, or None

        # Load the shared CLIP once at startup
        self._load_shared_clip()

    # ------------------------------------------------------------------
    #  Shared CLIP loader (runs once at startup)
    # ------------------------------------------------------------------
    def _load_shared_clip(self):
        hf_token = os.environ.get("HF_TOKEN")
        print(f"  -> Loading shared CLIP model: {SHARED_CLIP_MODEL_NAME} ...", flush=True)
        self.shared_clip_model = CLIPModel.from_pretrained(
            SHARED_CLIP_MODEL_NAME,
            use_safetensors=True,
            token=hf_token
        ).to(self.device)
        self.shared_clip_model.eval()

        self.shared_clip_processor = CLIPProcessor.from_pretrained(SHARED_CLIP_MODEL_NAME)

        self.clip_evaluator = ClipEvaluator(
            device=self.device,
            model=self.shared_clip_model,
            processor=self.shared_clip_processor
        )
        print(f"  [OK] Shared CLIP model loaded successfully.  VRAM: {_vram_mb()}", flush=True)

    # ------------------------------------------------------------------
    #  Helper: is the model for a given canonical variant actually loaded?
    # ------------------------------------------------------------------
    def _is_model_loaded(self, variant: str) -> bool:
        """Return True only if the model OBJECTS for `variant` are non-None."""
        if variant == VARIANT_BASELINE:
            return self.baseline_encoder is not None and self.baseline_decoder is not None
        if variant == VARIANT_CAPTION:
            return self.caption_model is not None
        if variant == VARIANT_VIT:
            return self.vit_model is not None
        return False

    # ------------------------------------------------------------------
    #  Verbose "True" Lazy Loaders (Construct on CPU -> Move to GPU)
    # ------------------------------------------------------------------
    def _load_baseline_model(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        checkpoint_path = os.path.join(current_dir, '..', 'models', 'caption_model_baseline.pth')

        if not os.path.exists(checkpoint_path):
            raise FileNotFoundError(f"Baseline checkpoint not found at {checkpoint_path}")

        print("  -> Baseline: Reading weights from disk to CPU RAM...", flush=True)
        checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=False)
        self.baseline_vocab = checkpoint["vocab"]

        print("  -> Baseline: Constructing models in CPU RAM...", flush=True)
        self.baseline_encoder = EncoderCNN(encoded_img_size=7)
        self.baseline_decoder = DecoderRNN(
            vocab_size=len(self.baseline_vocab),
            enc_dim=2048,
            emb_dim=512,
            dec_dim=512,
            attn_dim=512
        )

        print("  -> Baseline: Applying weights...", flush=True)
        self.baseline_encoder.load_state_dict(checkpoint["encoder_state_dict"])
        self.baseline_decoder.load_state_dict(checkpoint["decoder_state_dict"])

        print(f"  -> Baseline: Moving fully built model into VRAM (GPU)...  VRAM before: {_vram_mb()}", flush=True)
        self.baseline_encoder = self.baseline_encoder.to(self.device)
        self.baseline_decoder = self.baseline_decoder.to(self.device)

        self.baseline_encoder.eval()
        self.baseline_decoder.eval()
        print(f"  [OK] Baseline model fully loaded and active.  VRAM after: {_vram_mb()}", flush=True)

    def _load_caption_model(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        checkpoint_path = os.path.join(current_dir, '..', 'models', 'caption_model.pth')

        if not os.path.exists(checkpoint_path):
            raise FileNotFoundError(f"Caption model checkpoint not found at {checkpoint_path}")

        print("  -> Caption Model: Constructing GPT-2 architecture in CPU RAM...", flush=True)
        self.caption_model = CaptionModel() 

        print("  -> Caption Model: Reading weights from disk...", flush=True)
        state_dict = torch.load(checkpoint_path, map_location="cpu", weights_only=False)
        
        print("  -> Caption Model: Applying weights...", flush=True)
        self.caption_model.load_state_dict(state_dict)
        
        print(f"  -> Caption Model: Moving fully built model into VRAM (GPU)...  VRAM before: {_vram_mb()}", flush=True)
        self.caption_model = self.caption_model.to(self.device)
        self.caption_model.eval()
        
        print("  -> Caption Model: Loading tokenizer...", flush=True)
        self.tokenizer = get_tokenizer()
        print(f"  [OK] Caption model fully loaded and active.  VRAM after: {_vram_mb()}", flush=True)

    def _load_vit_model(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        checkpoint_path = os.path.join(current_dir, '..', 'models', 'ViT_1_1_model.pt')

        if not os.path.exists(checkpoint_path):
            raise FileNotFoundError(f"ViT 1.1 checkpoint not found at {checkpoint_path}")

        print(f"  -> ViT 1.1: Building model & LLaMA architecture...  VRAM before: {_vram_mb()}", flush=True)
        # load_vit_model_for_inference handles internal placement
        self.vit_model = load_vit_model_for_inference(
            checkpoint_path,
            self.device,
            clip_model=self.shared_clip_model
        )
        print(f"  [OK] ViT 1.1 model fully loaded and active.  VRAM after: {_vram_mb()}", flush=True)

    # ------------------------------------------------------------------
    #  Nuclear VRAM Eviction
    # ------------------------------------------------------------------
    def _evict_active_model(self):
        if self.active_variant is None:
            print("[VRAM MANAGER] No model currently active, nothing to evict.", flush=True)
            return

        print(f"\n[VRAM MANAGER] +== Destroying '{self.active_variant}' to free memory ==+", flush=True)
        print(f"[VRAM MANAGER]   VRAM before eviction: {_vram_mb()}", flush=True)

        # 1. Sever all Python references
        self.baseline_encoder = None
        self.baseline_decoder = None
        self.baseline_vocab = None
        self.caption_model = None
        self.tokenizer = None
        self.vit_model = None

        # 2. Force garbage collection twice to ensure nested cycles are cleared
        gc.collect()
        gc.collect()

        # 3. Empty the CUDA cache
        torch.cuda.empty_cache()
        
        # 4. Optional sync so PyTorch is explicitly done
        if torch.cuda.is_available():
            torch.cuda.synchronize()

        old_variant = self.active_variant
        self.active_variant = None
        print(f"[VRAM MANAGER]   VRAM after eviction:  {_vram_mb()}", flush=True)
        print(f"[VRAM MANAGER] +== '{old_variant}' destroyed. GPU memory cleared. ==+\n", flush=True)

    def _activate_model(self, variant: str):
        """Ensure `variant` (canonical name) is loaded and ready in VRAM."""
        # Fast path: already loaded AND model objects exist
        if self.active_variant == variant and self._is_model_loaded(variant):
            print(f"[VRAM MANAGER] '{variant}' is already active and verified. Skipping load.", flush=True)
            return

        # If variants match but model is gone (shouldn't happen, but be safe)
        if self.active_variant == variant and not self._is_model_loaded(variant):
            print(f"[VRAM MANAGER] [WARN]  '{variant}' was marked active but model objects are None! Forcing reload.", flush=True)
            self.active_variant = None  # reset so eviction doesn't try to clear nothing

        print(f"\n[VRAM MANAGER] === Swap Requested ===  incoming: '{variant}'  current: '{self.active_variant}'", flush=True)

        # Evict old occupant
        self._evict_active_model()

        # Load new occupant ? catch and log any crash
        try:
            t0 = time.time()
            if variant == VARIANT_BASELINE:
                self._load_baseline_model()
            elif variant == VARIANT_CAPTION:
                self._load_caption_model()
            elif variant == VARIANT_VIT:
                self._load_vit_model()
            else:
                raise ValueError(f"Unknown variant requested: {variant}")
            elapsed = time.time() - t0
            print(f"[VRAM MANAGER] [OK] '{variant}' loaded in {elapsed:.1f}s", flush=True)
        except Exception as e:
            print(f"\n{'!'*60}", flush=True)
            print(f"  [FATAL] Failed to load '{variant}': {e}", flush=True)
            traceback.print_exc()
            print(f"  VRAM at failure: {_vram_mb()}", flush=True)
            print(f"{'!'*60}\n", flush=True)
            # Make sure we don't leave a half-set active_variant
            self.active_variant = None
            raise

        # Post-load sanity check
        if not self._is_model_loaded(variant):
            msg = f"Load function for '{variant}' returned without error but model objects are still None!"
            print(f"[VRAM MANAGER] [FAIL] {msg}", flush=True)
            self.active_variant = None
            raise RuntimeError(msg)

        self.active_variant = variant

    # ------------------------------------------------------------------
    #  Public inference entry point
    # ------------------------------------------------------------------
    def get_caption(self, image_bytes: bytes, model_variant: str = "caption_model", **kwargs) -> tuple:
        # Normalize the variant name once up-front
        variant = _normalize_variant(model_variant)

        print(f"\n{'-'*60}", flush=True)
        print(f"  [REQUEST] get_caption  variant='{model_variant}' -> canonical='{variant}'", flush=True)
        print(f"  [REQUEST] active_variant='{self.active_variant}'  "
              f"model_loaded={self._is_model_loaded(variant) if self.active_variant == variant else 'N/A'}", flush=True)
        print(f"{'-'*60}", flush=True)

        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        print(f"  Image opened: {pil_image.size[0]}x{pil_image.size[1]} px", flush=True)

        # -- Ensure the right model is loaded into VRAM --
        self._activate_model(variant)

        t_gen = time.time()

        if variant == VARIANT_BASELINE:
            if not self._is_model_loaded(VARIANT_BASELINE):
                raise HTTPException(status_code=503, detail="Baseline model is not loaded.")

            print("  -> Generating Baseline caption...", flush=True)
            image_tensor = toTensor(pil_image)
            caption, _ = generate_caption(
                self.baseline_encoder,
                self.baseline_decoder,
                image_tensor,
                self.baseline_vocab,
                self.device
            )

            similarity_score = 0.0
            if self.clip_evaluator is not None:
                scores = self.clip_evaluator.score_captions(pil_image, [caption])
                similarity_score = round(scores[0], 4)

            elapsed = time.time() - t_gen
            print(f"  [OK] Baseline caption generated in {elapsed:.2f}s  CLIP={similarity_score:.4f}", flush=True)
            print(f"    \"{caption}\"", flush=True)
            
            # Run flagging
            is_flagged = default_engine.process(pil_image, caption, similarity_score)
            
            return (caption, similarity_score, is_flagged)

        elif variant == VARIANT_VIT:
            if not self._is_model_loaded(VARIANT_VIT):
                raise HTTPException(status_code=503, detail="ViT 1.1 model is not loaded.")

            print("  -> Generating ViT 1.1 candidates...", flush=True)
            image_tensor = vit_transform(pil_image).unsqueeze(0).to(self.device)

            candidates = generate_multiple_captions_vit(
                self.vit_model,
                image_tensor,
                num_captions=NUM_CANDIDATE_CAPTIONS,
                max_new_tokens=kwargs.get("max_length", 50),
                min_new_tokens=kwargs.get("min_length", 5),
                temperature=kwargs.get("temperature", 0.7),
                top_p=kwargs.get("top_p", 0.9),
                repetition_penalty=kwargs.get("repetition_penalty", 1.2),
                num_beams=kwargs.get("num_beams", 1),
            )

            print(f"  -> Generated {len(candidates)} candidates. Judging with CLIP...", flush=True)
            if self.clip_evaluator is not None and len(candidates) > 0:
                best_caption, similarity_score = self.clip_evaluator.select_best(pil_image, candidates)
                elapsed = time.time() - t_gen
                print(f"  [OK] ViT caption generated in {elapsed:.2f}s  CLIP={similarity_score:.4f}", flush=True)
                print(f"    \"{best_caption}\"", flush=True)
                
                # Run flagging
                is_flagged = default_engine.process(pil_image, best_caption, similarity_score)
                
                return (best_caption, similarity_score, is_flagged)
            else:
                elapsed = time.time() - t_gen
                print(f"  [OK] ViT caption generated in {elapsed:.2f}s  (no CLIP ranking)", flush=True)
                caption = candidates[0] if candidates else ""
                is_flagged = default_engine.process(pil_image, caption, 0.0)
                return (caption, 0.0, is_flagged)

        elif variant == VARIANT_CAPTION:
            if not self._is_model_loaded(VARIANT_CAPTION):
                raise HTTPException(status_code=503, detail="Caption model is not loaded.")

            print("  -> Generating Caption (GPT-2) candidates...", flush=True)
            image_tensor = caption_transform(pil_image).unsqueeze(0).to(self.device)

            candidates = generate_multiple_captions(
                self.caption_model,
                image_tensor,
                self.tokenizer,
                num_captions=NUM_CANDIDATE_CAPTIONS,
                **kwargs
            )

            print(f"  -> Generated {len(candidates)} candidates. Judging with CLIP...", flush=True)
            if self.clip_evaluator is not None and len(candidates) > 0:
                best_caption, similarity_score = self.clip_evaluator.select_best(pil_image, candidates)
                elapsed = time.time() - t_gen
                print(f"  [OK] Caption (GPT-2) generated in {elapsed:.2f}s  CLIP={similarity_score:.4f}", flush=True)
                print(f"    \"{best_caption}\"", flush=True)
                
                # Run flagging
                is_flagged = default_engine.process(pil_image, best_caption, similarity_score)
                
                return (best_caption, similarity_score, is_flagged)
            else:
                elapsed = time.time() - t_gen
                print(f"  [OK] Caption (GPT-2) generated in {elapsed:.2f}s  (no CLIP ranking)", flush=True)
                caption = candidates[0] if candidates else ""
                is_flagged = default_engine.process(pil_image, caption, 0.0)
                return (caption, 0.0, is_flagged)

        else:
            # Should never reach here because _normalize_variant already validates
            raise HTTPException(status_code=400, detail=f"Unsupported model variant: {model_variant}")


# Create a singleton instance
caption_service = CaptionService()
