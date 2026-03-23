from models.baseline import Vocabulary # Needed for torch to unpickle properly if Vocabulary is referenced inside the checkpoint
import sys
sys.modules['__main__'].Vocabulary = Vocabulary # Hack to load custom objects pickled in main script
import os
import io
import torch
from PIL import Image
from fastapi import HTTPException
from models.baseline import EncoderCNN, DecoderRNN, generate_caption, toTensor

class CaptionService:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.encoder = None
        self.decoder = None
        self.vocab = None
        self._load_model()

    def _load_model(self):
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            checkpoint_path = os.path.join(current_dir, '..', 'models', 'caption_model_baseline.pth')

            if not os.path.exists(checkpoint_path):
                print(f"Warning: Model checkpoint not found at {checkpoint_path}")
                return

            checkpoint = torch.load(checkpoint_path, map_location=self.device, weights_only=False)
            self.vocab = checkpoint["vocab"]

            self.encoder = EncoderCNN(encoded_img_size=7).to(self.device)
            self.decoder = DecoderRNN(
                vocab_size=len(self.vocab),
                enc_dim=2048,
                emb_dim=512,
                dec_dim=512,
                attn_dim=512
            ).to(self.device)

            self.encoder.load_state_dict(checkpoint["encoder_state_dict"])
            self.decoder.load_state_dict(checkpoint["decoder_state_dict"])
            
            self.encoder.eval()
            self.decoder.eval()
            print("Model loaded successfully.")
        except Exception as e:
            print(f"Error loading model: {e}")
            self.encoder = None
            self.decoder = None

    def get_caption(self, image_bytes: bytes) -> str:
        if self.encoder is None or self.decoder is None:
            raise HTTPException(status_code=503, detail="Model is not loaded.")
            
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            image_tensor = toTensor(image)
            
            caption, _ = generate_caption(
                self.encoder, 
                self.decoder, 
                image_tensor, 
                self.vocab, 
                self.device
            )
            return caption
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error generating caption: {e}")

# Create a singleton instance
caption_service = CaptionService()
