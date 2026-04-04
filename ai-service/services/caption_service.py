from models.baseline import Vocabulary # Needed for torch to unpickle properly if Vocabulary is referenced inside the checkpoint
import sys
sys.modules['__main__'].Vocabulary = Vocabulary # Hack to load custom objects pickled in main script
import os
import io
import torch
from PIL import Image
from fastapi import HTTPException
from models.baseline import EncoderCNN, DecoderRNN, generate_caption, toTensor
from models.caption import CaptionModel, get_tokenizer, generate_caption_greedy, generate_multiple_captions, caption_transform
from models.clip_evaluator import ClipEvaluator

# Number of candidate captions to generate for multi-caption models
NUM_CANDIDATE_CAPTIONS = 4

class CaptionService:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"CaptionService initialized using device: {self.device}")
        self.baseline_encoder = None
        self.baseline_decoder = None
        self.baseline_vocab = None
        
        self.caption_model = None
        self.tokenizer = None

        self.clip_evaluator = None
        
        self._load_baseline_model()
        self._load_caption_model()
        self._load_clip_model()

    def _load_baseline_model(self):
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            checkpoint_path = os.path.join(current_dir, '..', 'models', 'caption_model_baseline.pth')

            if not os.path.exists(checkpoint_path):
                print(f"Warning: Model checkpoint not found at {checkpoint_path}")
                return

            checkpoint = torch.load(checkpoint_path, map_location=self.device, weights_only=False)
            self.baseline_vocab = checkpoint["vocab"]

            self.baseline_encoder = EncoderCNN(encoded_img_size=7).to(self.device)
            self.baseline_decoder = DecoderRNN(
                vocab_size=len(self.baseline_vocab),
                enc_dim=2048,
                emb_dim=512,
                dec_dim=512,
                attn_dim=512
            ).to(self.device)

            self.baseline_encoder.load_state_dict(checkpoint["encoder_state_dict"])
            self.baseline_decoder.load_state_dict(checkpoint["decoder_state_dict"])
            
            self.baseline_encoder.eval()
            self.baseline_decoder.eval()
            print("Baseline model loaded successfully.")
        except Exception as e:
            print(f"Error loading baseline model: {e}")
            self.baseline_encoder = None
            self.baseline_decoder = None

    def _load_caption_model(self):
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            checkpoint_path = os.path.join(current_dir, '..', 'models', 'caption_model.pth')

            if not os.path.exists(checkpoint_path):
                print(f"Warning: Model checkpoint not found at {checkpoint_path}")
                return

            self.caption_model = CaptionModel().to(self.device)
            self.caption_model.load_state_dict(torch.load(checkpoint_path, map_location=self.device, weights_only=False))
            self.caption_model.eval()
            
            self.tokenizer = get_tokenizer()
            print("Caption Model loaded successfully.")
        except Exception as e:
            print(f"Error loading caption_model: {e}")
            self.caption_model = None

    def _load_clip_model(self):
        try:
            self.clip_evaluator = ClipEvaluator(self.device)
        except Exception as e:
            print(f"Error loading CLIP model: {e}")
            self.clip_evaluator = None

    def get_caption(self, image_bytes: bytes, model_variant: str = "caption_model", **kwargs) -> tuple:
        """
        Generate caption(s) for an image and evaluate with CLIP.
        
        For baseline model: generates 1 caption (greedy), scores with CLIP.
        For caption_model: generates 4 candidates, CLIP picks the best.
        
        Returns:
            Tuple of (caption_text: str, similarity_score: float)
        """
        # Open the image once for CLIP evaluation later
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        if model_variant in ["base_line_model", "baseline_model"]:
            if self.baseline_encoder is None or self.baseline_decoder is None:
                raise HTTPException(status_code=503, detail="Baseline model is not loaded.")
                
            try:
                image_tensor = toTensor(pil_image)
                
                caption, _ = generate_caption(
                    self.baseline_encoder, 
                    self.baseline_decoder, 
                    image_tensor, 
                    self.baseline_vocab, 
                    self.device
                )

                # Score single caption with CLIP
                similarity_score = 0.0
                if self.clip_evaluator is not None:
                    scores = self.clip_evaluator.score_captions(pil_image, [caption])
                    similarity_score = round(scores[0], 4)
                    print(f"  Baseline caption CLIP score: {similarity_score:.4f}")

                return (caption, similarity_score)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error generating baseline caption: {e}")
        else:
            if self.caption_model is None:
                raise HTTPException(status_code=503, detail="Caption model is not loaded.")
                
            try:
                image_tensor = caption_transform(pil_image).unsqueeze(0).to(self.device)
                
                # Generate multiple candidate captions
                candidates = generate_multiple_captions(
                    self.caption_model,
                    image_tensor,
                    self.tokenizer,
                    num_captions=NUM_CANDIDATE_CAPTIONS,
                    **kwargs
                )
                
                print(f"  Generated {len(candidates)} candidate captions")

                # Use CLIP to select the best caption
                if self.clip_evaluator is not None and len(candidates) > 0:
                    best_caption, similarity_score = self.clip_evaluator.select_best(pil_image, candidates)
                    return (best_caption, similarity_score)
                else:
                    # Fallback: return first candidate if CLIP is not available
                    print("  Warning: CLIP not available, returning first candidate")
                    return (candidates[0] if candidates else "", 0.0)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error generating caption: {e}")

# Create a singleton instance
caption_service = CaptionService()
