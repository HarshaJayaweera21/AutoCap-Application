import torch
from transformers import CLIPModel, CLIPProcessor
from PIL import Image
from typing import List, Tuple


class ClipEvaluator:
    """
    Uses a shared OpenAI CLIP instance to score and rank candidate captions
    against an image. The model and processor are injected externally so that
    a single CLIP instance can be shared across all model variants.
    """

    def __init__(self, device: torch.device, model: CLIPModel, processor: CLIPProcessor):
        """
        Args:
            device:    The torch device (cuda/cpu) to run inference on.
            model:     A pre-loaded CLIPModel instance (already on device).
            processor: The matching CLIPProcessor for tokenisation/preprocessing.
        """
        self.device = device
        self.model = model
        self.processor = processor
        self.model.eval()

    @torch.no_grad()
    def score_captions(self, image: Image.Image, captions: List[str]) -> List[float]:
        """
        Compute CLIP cosine similarity scores between an image and
        a list of candidate captions.

        Args:
            image: A PIL RGB image.
            captions: List of candidate caption strings.

        Returns:
            List of similarity scores (floats between 0 and 1), one per caption.
        """
        inputs = self.processor(
            text=captions,
            images=image,
            return_tensors="pt",
            padding=True,
            truncation=True
        )
        # Move all tensors to the correct device
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        outputs = self.model(**inputs)

        # logits_per_image shape: (1, num_captions)
        # Apply softmax-like normalization via cosine similarity
        logits = outputs.logits_per_image.squeeze(0)  # (num_captions,)

        # Convert logits to 0-1 similarity scores
        # CLIP logits are scaled cosine similarities (multiplied by temperature)
        # We normalize them to a 0-1 range using sigmoid for interpretability
        scores = torch.sigmoid(logits / 10.0).cpu().tolist()

        return scores

    @torch.no_grad()
    def select_best(self, image: Image.Image, captions: List[str]) -> Tuple[str, float]:
        """
        Score all candidate captions and return the best one.

        Args:
            image: A PIL RGB image.
            captions: List of candidate caption strings.

        Returns:
            Tuple of (best_caption_text, similarity_score).
        """
        if len(captions) == 0:
            return ("", 0.0)

        if len(captions) == 1:
            scores = self.score_captions(image, captions)
            return (captions[0], round(scores[0], 4))

        scores = self.score_captions(image, captions)

        # Log all candidates and their scores for debugging
        print("  CLIP Evaluation:")
        for i, (cap, score) in enumerate(zip(captions, scores)):
            marker = " <-- BEST" if score == max(scores) else ""
            print(f"    [{i+1}] ({score:.4f}) {cap}{marker}")

        best_idx = scores.index(max(scores))
        return (captions[best_idx], round(scores[best_idx], 4))
