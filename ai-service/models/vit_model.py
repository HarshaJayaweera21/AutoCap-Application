"""
ViT 1.1 Multi-Modal Captioning Model
Architecture: CLIP ViT-B/16 (frozen) → Q-Former → LLaMA-3-8B (frozen, quantized)

The checkpoint (ViT_1_4_model.pt) stores only the trainable weights:
  - qformer state_dict
  - projection layer state_dict
"""

import os
import math
import torch
import torch.nn as nn
from transformers import CLIPModel, AutoModelForCausalLM, AutoTokenizer
import torchvision.transforms.v2 as T


# ── CLIP ViT-B/16 normalization ─────────────────────────────────────
vit_transform = T.Compose([
    T.Resize(224, interpolation=T.InterpolationMode.BICUBIC),
    T.CenterCrop(224),
    T.ToImage(),
    T.ToDtype(torch.float32, scale=True),
    T.Normalize(
        mean=[0.48145466, 0.4578275, 0.40821073],
        std=[0.26862954, 0.26130258, 0.27577711]
    )
])


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Vision Encoder (frozen CLIP ViT-B/16)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class ViTEncoder(nn.Module):
    def __init__(self, clip_vision_model, device=None):
        """
        Args:
            clip_vision_model: The vision_model component of an already-loaded CLIPModel.
                               Injected externally so the CLIP weights are shared and not
                               duplicated in memory.
            device: Target torch device for inference.
        """
        super().__init__()
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")

        # Use the injected vision encoder directly (no separate CLIP load)
        self.vision_encoder = clip_vision_model

        # Freeze all parameters
        for param in self.vision_encoder.parameters():
            param.requires_grad = False

        self.vision_encoder.eval()
        self.vision_encoder.to(self.device)

    @torch.no_grad()
    def forward(self, image_tensor):
        """
        image_tensor: (B, 3, 224, 224)
        returns: (B, 197, 768)
        """
        outputs = self.vision_encoder(pixel_values=image_tensor.to(self.device))
        return outputs.last_hidden_state


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Multi-Head Attention
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class MultiHeadAttention(nn.Module):
    def __init__(self, dim, num_heads, dropout=0.1):
        super().__init__()
        assert dim % num_heads == 0

        self.num_heads = num_heads
        self.head_dim = dim // num_heads

        self.q_proj = nn.Linear(dim, dim)
        self.k_proj = nn.Linear(dim, dim)
        self.v_proj = nn.Linear(dim, dim)

        self.out_proj = nn.Linear(dim, dim)
        self.dropout = nn.Dropout(dropout)

    def forward(self, query, key, value):
        B, Nq, D = query.shape
        Nk = key.size(1)

        Q = self.q_proj(query)
        K = self.k_proj(key)
        V = self.v_proj(value)

        # Reshape for multi-head
        Q = Q.view(B, Nq, self.num_heads, self.head_dim).transpose(1, 2)
        K = K.view(B, Nk, self.num_heads, self.head_dim).transpose(1, 2)
        V = V.view(B, Nk, self.num_heads, self.head_dim).transpose(1, 2)

        attn = (Q @ K.transpose(-2, -1)) / math.sqrt(self.head_dim)
        attn = torch.softmax(attn, dim=-1)
        attn = self.dropout(attn)

        out = attn @ V
        out = out.transpose(1, 2).contiguous().view(B, Nq, D)

        return self.out_proj(out)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Feed-Forward Network
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class FeedForward(nn.Module):
    def __init__(self, dim, hidden_dim, dropout=0.1):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(dim, hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, dim),
            nn.Dropout(dropout)
        )

    def forward(self, x):
        return self.net(x)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Q-Former Block (self-attn → cross-attn → FFN)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class QFormerBlock(nn.Module):
    def __init__(self, dim=768, num_heads=12, mlp_ratio=4.0, dropout=0.1):
        super().__init__()

        self.self_attn = MultiHeadAttention(dim, num_heads, dropout)
        self.cross_attn = MultiHeadAttention(dim, num_heads, dropout)

        self.ffn = FeedForward(dim, int(dim * mlp_ratio), dropout)

        self.norm1 = nn.LayerNorm(dim)
        self.norm2 = nn.LayerNorm(dim)
        self.norm3 = nn.LayerNorm(dim)

    def forward(self, queries, image_tokens):
        # Self attention
        q = self.norm1(queries)
        queries = queries + self.self_attn(q, q, q)

        # Cross attention
        q = self.norm2(queries)
        queries = queries + self.cross_attn(q, image_tokens, image_tokens)

        # Feed Forward
        q = self.norm3(queries)
        queries = queries + self.ffn(q)

        return queries


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Q-Former (32 learnable queries, 6 transformer layers)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class QFormer(nn.Module):
    def __init__(
        self,
        num_queries=32,
        dim=768,
        depth=6,
        num_heads=12,
        mlp_ratio=4.0,
        dropout=0.1
    ):
        super().__init__()

        self.num_queries = num_queries
        self.dim = dim

        # Learnable query embeddings
        self.query_embed = nn.Parameter(torch.randn(1, num_queries, dim))

        # Learnable positional embeddings
        self.pos_embed = nn.Parameter(torch.randn(1, num_queries, dim))

        # Transformer blocks
        self.layers = nn.ModuleList([
            QFormerBlock(dim, num_heads, mlp_ratio, dropout)
            for _ in range(depth)
        ])

        self.norm = nn.LayerNorm(dim)

        self._init_weights()

    def _init_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Linear):
                nn.init.xavier_uniform_(m.weight)
                if m.bias is not None:
                    nn.init.zeros_(m.bias)

    def forward(self, image_tokens):
        B = image_tokens.size(0)

        queries = self.query_embed.expand(B, -1, -1)
        queries = queries + self.pos_embed

        for layer in self.layers:
            queries = layer(queries, image_tokens)

        return self.norm(queries)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Multi-Modal Model (ViT + Q-Former + LLaMA-3-8B)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class MultiModalModel(nn.Module):
    def __init__(
        self,
        vit_encoder,
        q_former,
        llama_model_name="meta-llama/Meta-Llama-3-8B",
        device=None
    ):
        super().__init__()

        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")

        self.vit = vit_encoder
        self.qformer = q_former

        hf_token = os.environ.get("HF_TOKEN")

        # ── Load LLaMA with graceful quantization fallback ──
        self.llama = None

        # Strategy 1: 4-bit quantization (best for limited VRAM)
        try:
            from transformers import BitsAndBytesConfig
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True,
            )
            
            # Force all layers to the primary device to prevent 'accelerate' from 
            # splitting 4-bit weights across CPU/Disk, which triggers the uint8 bug.
            target_device = self.device if isinstance(self.device, str) else str(self.device)
            custom_device_map = {"": target_device} if "cuda" in target_device else "auto"

            self.llama = AutoModelForCausalLM.from_pretrained(
                llama_model_name,
                quantization_config=bnb_config,
                device_map=custom_device_map,
                token=hf_token,
                low_cpu_mem_usage=True,
                trust_remote_code=True
            )
            print("  LLaMA-3 loaded with 4-bit quantization.")
        except Exception as e:
            print(f"  4-bit loading failed ({e}), trying 8-bit...")

        # Strategy 2: 8-bit quantization
        if self.llama is None:
            try:
                from transformers import BitsAndBytesConfig
                bnb_config = BitsAndBytesConfig(
                    load_in_8bit=True,
                    llm_int8_enable_fp32_cpu_offload=True  # Allow offloading to CPU RAM
                )
                self.llama = AutoModelForCausalLM.from_pretrained(
                    llama_model_name,
                    quantization_config=bnb_config,
                    device_map="auto",
                    token=hf_token,
                    trust_remote_code=True
                )
                print("  LLaMA-3 loaded with 8-bit quantization.")
            except Exception as e:
                print(f"  8-bit loading failed ({e}), trying float16...")

        # Strategy 3: float16 (no quantization, needs ~16 GB VRAM)
        if self.llama is None:
            self.llama = AutoModelForCausalLM.from_pretrained(
                llama_model_name,
                dtype=torch.float16,
                device_map="auto",
                token=hf_token,
                use_safetensors=True
            )
            print("  LLaMA-3 loaded with float16 (no quantization).")

        self.tokenizer = AutoTokenizer.from_pretrained(llama_model_name, token=hf_token)
        self.tokenizer.pad_token = self.tokenizer.eos_token

        # Freeze LLaMA
        for param in self.llama.parameters():
            param.requires_grad = False

        self.llama.eval()

        self.llama_dim = self.llama.config.hidden_size

        self.projection = nn.Linear(768, self.llama_dim)

    @property
    def input_device(self):
        """Device where LLaMA's embedding layer lives. 
        If offloaded to 'meta' (SSD), fallback to a real device (CPU or GPU)."""
        device = self.llama.get_input_embeddings().weight.device
        if device.type == 'meta':
            # Fallback to the first parameter's device if it's not meta, otherwise CPU
            for param in self.llama.parameters():
                if param.device.type != 'meta':
                    return param.device
            return torch.device("cpu")
        return device

    def forward(self, image_tensor, input_ids, attention_mask, labels=None):
        """
        image_tensor: (B, 3, 224, 224)
        input_ids: (B, T)
        attention_mask: (B, T)
        labels: (B, T) or None
        """
        # Resolve the device where LLaMA's embedding layer actually lives
        embed_device = self.input_device

        with torch.no_grad():
            image_tokens = self.vit(image_tensor)

        queries = self.qformer(image_tokens)
        visual_embeds = self.projection(queries)

        # Ensure we use float16 for computation, even if model weights are uint8 (quantized)
        compute_dtype = getattr(self.llama, "dtype", torch.float16)
        if compute_dtype == torch.uint8:
            compute_dtype = torch.float16

        visual_embeds = visual_embeds.to(device=embed_device, dtype=compute_dtype)

        input_ids = input_ids.to(embed_device)
        text_embeds = self.llama.get_input_embeddings()(input_ids)
        text_embeds = text_embeds.to(dtype=compute_dtype)

        # Combine (all tensors now on embed_device)
        inputs_embeds = torch.cat([visual_embeds, text_embeds], dim=1)

        # Attention mask
        B = input_ids.size(0)
        visual_mask = torch.ones(B, visual_embeds.size(1), device=embed_device)
        combined_attention_mask = torch.cat([visual_mask, attention_mask.to(embed_device)], dim=1)

        if labels is not None:
            visual_labels = torch.full(
                (B, visual_embeds.size(1)),
                -100,
                device=embed_device,
                dtype=torch.long
            )
            combined_labels = torch.cat([visual_labels, labels.to(embed_device)], dim=1)
        else:
            combined_labels = None

        outputs = self.llama(
            inputs_embeds=inputs_embeds,
            attention_mask=combined_attention_mask,
            labels=combined_labels
        )

        return outputs


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Factory: build entire model and load trained weights
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def load_vit_model_for_inference(checkpoint_path: str, device: torch.device, clip_model=None):
    """
    Build the full MultiModalModel and load the trained Q-Former
    and projection weights from the checkpoint.

    Args:
        checkpoint_path: Path to ViT_1_4_model.pt
        device:          Target torch device
        clip_model:      Optional pre-loaded CLIPModel whose vision_model will be shared.
                         If None, the ViTEncoder will raise an error (CLIP must be provided).

    Returns:
        Fully initialised MultiModalModel in eval mode.
    """
    print(f"Building ViT 1.1 model (device={device}) ...")

    if clip_model is None:
        raise ValueError(
            "A shared CLIPModel must be passed to load_vit_model_for_inference via the "
            "'clip_model' argument. Load CLIP once in CaptionService and share it."
        )

    vit = ViTEncoder(clip_vision_model=clip_model.vision_model, device=str(device))
    qformer = QFormer()

    model = MultiModalModel(
        vit_encoder=vit,
        q_former=qformer,
        device=str(device)
    )

    # Load the trained weights (Q-Former + projection only)
    print(f"Loading ViT 1.1 checkpoint from {checkpoint_path} ...")
    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=False)

    model.qformer.load_state_dict(checkpoint["qformer"])
    model.projection.load_state_dict(checkpoint["projection"])

    # Move trainable components to the correct device & dtype
    model.qformer.to(device)
    model.projection.to(device)

    model.eval()
    print("ViT 1.1 model loaded successfully.")
    return model


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Caption generation (single)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@torch.no_grad()
def generate_caption_vit(
    model,
    image_tensor,
    prompt="Describe the image:",
    max_new_tokens=50,
    temperature=1.0,
    top_p=0.9,
    repetition_penalty=1.0,
    num_beams=1,
    do_sample=False
):
    """
    Generate a single caption for an image using the ViT 1.1 model.

    Args:
        model: MultiModalModel instance.
        image_tensor: (1, 3, 224, 224) tensor on the correct device.
        prompt: Text prompt to condition generation.
        max_new_tokens: Maximum tokens to generate.
        temperature: Sampling temperature.
        top_p: Nucleus sampling threshold.
        repetition_penalty: Penalty for repeated tokens.
        num_beams: Beam search width (1 = greedy/sampling).
        do_sample: Whether to use sampling vs greedy.

    Returns:
        Caption string.
    """
    model.eval()
    device = model.device
    embed_device = model.input_device  # where LLaMA's embeddings actually live

    # ── Vision (runs on cuda) ──
    image_tensor = image_tensor.to(device)
    image_tokens = model.vit(image_tensor)          # (1, 197, 768)
    queries = model.qformer(image_tokens)            # (1, 32, 768)
    visual_embeds = model.projection(queries)        # (1, 32, llama_dim)

    # Move to LLaMA's embedding device and cast to compute dtype (avoid uint8 weights dtype)
    compute_dtype = getattr(model.llama, "dtype", torch.float16)
    if compute_dtype == torch.uint8:
        compute_dtype = torch.float16
        
    visual_embeds = visual_embeds.to(device=embed_device, dtype=compute_dtype)

    # ── Text Prompt ──
    tokenizer = model.tokenizer
    inputs = tokenizer(prompt, return_tensors="pt").to(embed_device)
    input_ids = inputs.input_ids

    text_embeds = model.llama.get_input_embeddings()(input_ids)
    text_embeds = text_embeds.to(dtype=compute_dtype)

    # ── Combine (all on embed_device) ──
    inputs_embeds = torch.cat([visual_embeds, text_embeds], dim=1)
    attention_mask = torch.ones(inputs_embeds.size()[:2], device=embed_device)

    # ── Generate ──
    gen_kwargs = dict(
        inputs_embeds=inputs_embeds,
        attention_mask=attention_mask,
        max_new_tokens=max_new_tokens,
        pad_token_id=tokenizer.eos_token_id,
    )

    if do_sample or temperature != 1.0:
        gen_kwargs.update(
            do_sample=True,
            temperature=temperature,
            top_p=top_p,
            repetition_penalty=repetition_penalty,
        )
    else:
        gen_kwargs.update(
            do_sample=False,
            num_beams=num_beams,
            repetition_penalty=repetition_penalty,
        )

    outputs = model.llama.generate(**gen_kwargs)

    # ── Decode ──
    generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return generated_text


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Multiple caption generation (for CLIP ranking)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@torch.no_grad()
def generate_multiple_captions_vit(
    model,
    image_tensor,
    num_captions=4,
    prompt="Describe the image:",
    max_new_tokens=50,
    min_new_tokens=5,
    temperature=0.7,
    top_p=0.9,
    repetition_penalty=1.2,
    num_beams=1,
):
    """
    Generate multiple diverse captions for an image using sampling.

    Args:
        model: MultiModalModel instance.
        image_tensor: (1, 3, 224, 224) tensor on the correct device.
        num_captions: Number of candidate captions to generate.
        prompt: Text prompt to condition generation.
        max_new_tokens: Maximum tokens to generate per caption.
        min_new_tokens: Minimum tokens to generate per caption.
        temperature: Sampling temperature (higher = more diverse).
        top_p: Nucleus sampling threshold.
        repetition_penalty: Penalty for repeated tokens.
        num_beams: Beam search width.

    Returns:
        List of caption strings.
    """
    model.eval()
    device = model.device
    embed_device = model.input_device  # where LLaMA's embeddings actually live

    # ── Vision (runs on cuda) ──
    image_tensor = image_tensor.to(device)
    image_tokens = model.vit(image_tensor)          # (1, 197, 768)
    queries = model.qformer(image_tokens)            # (1, 32, 768)
    visual_embeds = model.projection(queries)        # (1, 32, llama_dim)

    # Move to LLaMA's embedding device and cast to compute dtype (avoid uint8 weights dtype)
    compute_dtype = getattr(model.llama, "dtype", torch.float16)
    if compute_dtype == torch.uint8:
        compute_dtype = torch.float16
        
    visual_embeds = visual_embeds.to(device=embed_device, dtype=compute_dtype)

    # ── Text Prompt ──
    tokenizer = model.tokenizer
    inputs = tokenizer(prompt, return_tensors="pt").to(embed_device)
    input_ids = inputs.input_ids

    text_embeds = model.llama.get_input_embeddings()(input_ids)
    text_embeds = text_embeds.to(dtype=compute_dtype)

    # ── Combine (all on embed_device) ──
    inputs_embeds = torch.cat([visual_embeds, text_embeds], dim=1)
    attention_mask = torch.ones(inputs_embeds.size()[:2], device=embed_device)

    # ── Generate multiple sequences ──
    # For beam search: num_beams must be >= num_return_sequences
    effective_beams = max(num_beams, num_captions) if num_beams > 1 else 1

    gen_kwargs = dict(
        inputs_embeds=inputs_embeds,
        attention_mask=attention_mask,
        max_new_tokens=max_new_tokens,
        min_new_tokens=min_new_tokens,
        temperature=temperature,
        top_p=top_p,
        repetition_penalty=repetition_penalty,
        num_return_sequences=num_captions,
        pad_token_id=tokenizer.eos_token_id,
        do_sample=True,
    )

    if effective_beams > 1:
        gen_kwargs["num_beams"] = effective_beams

    outputs = model.llama.generate(**gen_kwargs)

    # ── Decode all sequences ──
    captions = []
    for i in range(num_captions):
        caption = tokenizer.decode(outputs[i], skip_special_tokens=True)
        captions.append(caption.strip())

    return captions
