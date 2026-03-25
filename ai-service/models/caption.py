import torch
import torch.nn as nn
import torchvision.models as models
from transformers import GPT2Config, GPT2LMHeadModel, GPT2Tokenizer
import torchvision.transforms.v2 as T

caption_transform = T.Compose([
    T.Resize((224, 224)),
    T.ToImage(),
    T.ToDtype(torch.float32, scale=True),
    T.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

def get_tokenizer():
    tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
    tokenizer.pad_token = tokenizer.eos_token
    return tokenizer

class CNNEncoder(nn.Module):
    def __init__(self):
        super().__init__()
        resnet = models.resnet152(weights=models.ResNet152_Weights.IMAGENET1K_V2)
        # removing avgpool and classification layer
        self.backbone = nn.Sequential(*list(resnet.children())[:-2])
        # freeze params
        for param in self.backbone.parameters():
            param.requires_grad = False
            
    def forward(self, x):
        x = self.backbone(x)
        B, C, H, W = x.shape
        x = x.view(B, C, -1).permute(0, 2, 1)
        return x

class QFormerLayer(nn.Module):
    def __init__(self, embed_dim=768, num_heads=8, mlp_ratio=4.0):
        super().__init__()
        self.self_attn = nn.MultiheadAttention(embed_dim, num_heads, batch_first=True)
        self.cross_attn = nn.MultiheadAttention(embed_dim, num_heads, batch_first=True)
        hidden_dim = int(embed_dim * mlp_ratio)
        self.mlp = nn.Sequential(
            nn.Linear(embed_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, embed_dim)
        )
        self.norm1 = nn.LayerNorm(embed_dim)
        self.norm2 = nn.LayerNorm(embed_dim)
        self.norm3 = nn.LayerNorm(embed_dim)

    def forward(self, queries, img_features):
        q = self.norm1(queries)
        attn_out, _ = self.self_attn(q, q, q)
        queries = queries + attn_out
        
        q = self.norm2(queries)
        attn_out, _ = self.cross_attn(q, img_features, img_features)
        queries = queries + attn_out
        
        q = self.norm3(queries)
        queries = queries + self.mlp(q)
        return queries

class QFormer(nn.Module):
    def __init__(self, num_queries=32, embed_dim=768, img_dim=2048, num_layers=6, num_heads=8):
        super().__init__()
        self.query_tokens = nn.Parameter(torch.randn(1, num_queries, embed_dim))
        self.img_proj = nn.Linear(img_dim, embed_dim)
        
        # NOTE: the original notebook used num_heads instead of num_layers in this loop
        self.layers = nn.ModuleList([
            QFormerLayer(embed_dim, num_heads)
            for _ in range(num_heads)
        ])
        self.norm = nn.LayerNorm(embed_dim)

    def forward(self, img_features):
        B = img_features.size(0)
        img_features = self.img_proj(img_features)
        queries = self.query_tokens.expand(B, -1, -1)
        for layer in self.layers:
            queries = layer(queries, img_features)
        return self.norm(queries)

class CaptionModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.cnn = CNNEncoder()
        self.qformer = QFormer()
        config = GPT2Config.from_pretrained("gpt2")
        config.add_cross_attention = True
        self.llm = GPT2LMHeadModel.from_pretrained("gpt2", config=config)
        
        for param in self.llm.parameters():
            param.requires_grad = False
            
        for name, param in self.llm.named_parameters():
            if "crossattention" in name or "cross_attention" in name:
                param.requires_grad = True
                
        self.proj = nn.Linear(768, self.llm.config.n_embd)

    def forward(self, images, input_ids, attention_mask=None, labels=None):
        img_feat = self.cnn(images)
        visual_tokens = self.qformer(img_feat)
        visual_tokens = self.proj(visual_tokens)
        
        encoder_mask = torch.ones(
            visual_tokens.size()[:-1],
            dtype=torch.long,
            device=visual_tokens.device
        )
        outputs = self.llm(
            input_ids=input_ids,
            attention_mask=attention_mask,
            encoder_hidden_states=visual_tokens,
            encoder_attention_mask=encoder_mask,
            labels=labels
        )
        return outputs

def generate_caption_greedy(model, image, tokenizer, max_length=50, min_length=5, temperature=1.0, num_beams=4, repetition_penalty=1.0, top_p=0.9):
    model.eval()
    with torch.no_grad():
        img_feat = model.cnn(image)
        visual_tokens = model.qformer(img_feat)
        visual_tokens = model.proj(visual_tokens)
        
        encoder_mask = torch.ones(
            visual_tokens.size()[:-1],
            dtype=torch.long,
            device=image.device
        )
        
        start_token_id = tokenizer.bos_token_id or tokenizer.eos_token_id
        input_ids = torch.tensor([[start_token_id]], device=image.device)
        
        do_sample = temperature > 0.0 and top_p < 1.0
        outputs = model.llm.generate(
            input_ids=input_ids,
            encoder_hidden_states=visual_tokens,
            encoder_attention_mask=encoder_mask,
            max_new_tokens=max_length,
            min_length=min_length,
            temperature=temperature,
            num_beams=num_beams,
            repetition_penalty=repetition_penalty,
            top_p=top_p,
            pad_token_id=tokenizer.eos_token_id,
            do_sample=do_sample
        )
        
        # Strip the input_ids from the output
        generated_ids = outputs[0][1:]
        caption = tokenizer.decode(generated_ids, skip_special_tokens=True)
        return caption
