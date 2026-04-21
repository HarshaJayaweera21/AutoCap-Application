import torch
from transformers import CLIPModel, CLIPProcessor
from PIL import Image
from typing import List, Tuple


class ClipEvaluator:
    """
    CLIP-based evaluator to score and rank captions against an image.
    Uses cosine similarity between normalized image and text embeddings.
    """

    def __init__(self, device: torch.device, model: CLIPModel, processor: CLIPProcessor):
        """
        Args:
            device: torch.device (cuda or cpu)
            model: Preloaded CLIPModel (already moved to device)
            processor: CLIPProcessor for preprocessing
        """
        self.device = device
        self.model = model
        self.processor = processor
        self.model.eval()

    @torch.no_grad()
    def score_captions(self, image: Image.Image, captions: List[str]) -> List[float]:
        """
        Compute cosine similarity scores between an image and captions.

        Args:
            image: PIL Image
            captions: List of caption strings

        Returns:
            List of cosine similarity scores (-1 to 1)
        """
        if not captions:
            return []

        # Preprocess inputs
        inputs = self.processor(
            text=captions,
            images=image,
            return_tensors="pt",
            padding=True,
            truncation=True
        )

        # Move to GPU/CPU
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        # Forward pass
        outputs = self.model(**inputs)

        # Extract embeddings
        image_embeds = outputs.image_embeds  # shape: (1, D)
        text_embeds = outputs.text_embeds    # shape: (N, D)

        # Normalize embeddings (CRITICAL for cosine similarity)
        image_embeds = image_embeds / image_embeds.norm(p=2, dim=-1, keepdim=True)
        text_embeds = text_embeds / text_embeds.norm(p=2, dim=-1, keepdim=True)

        # Cosine similarity
        similarities = (image_embeds @ text_embeds.T).squeeze(0)  # (N,)

        return similarities.detach().cpu().tolist()

    @torch.no_grad()
    def select_best(
        self,
        image: Image.Image,
        captions: List[str],
        threshold: float = 0.27
    ) -> Tuple[str, float, bool]:
        """
        Select best caption based on similarity score.

        Args:
            image: PIL Image
            captions: List of captions
            threshold: Minimum acceptable raw cosine similarity score

        Returns:
            (best_caption, normalized_score, is_flagged)
        """
        if not captions:
            return ("", 0.0, True)

        scores = self.score_captions(image, captions)

        best_idx = scores.index(max(scores))
        best_caption = captions[best_idx]
        best_raw_score = scores[best_idx]

        # Debug logging (useful for development)
        print("\n🔍 CLIP Evaluation Results:")
        for i, (cap, score) in enumerate(zip(captions, scores)):
            normalized = self.normalize_score(score)
            marker = " <-- BEST" if i == best_idx else ""
            print(f"[{i+1}] Raw: {score:.4f} | Normalized: {normalized:.4f} | {cap}{marker}")

        # Flag if raw score is below threshold
        is_flagged = best_raw_score < threshold

        # Return normalized score for UI display
        normalized_best = self.normalize_score(best_raw_score)

        return (best_caption, normalized_best, is_flagged)

    @staticmethod
    def normalize_score(score: float, min_score: float = 0.10, max_score: float = 0.35) -> float:
        """
        Convert cosine similarity to a 0-1 scale stretched over the
        realistic CLIP score range for image-text pairs (0.10-0.45).

        This makes low scores (e.g. 0.21) read as genuinely low (~0.31)
        and good scores (e.g. 0.32) read as clearly higher (~0.63),
        unlike the naive (score + 1) / 2 approach which compresses
        everything into a narrow band around 0.60.

        Args:
            score:     Raw cosine similarity from CLIP (-1 to 1)
            min_score: Lower bound of expected real-world score range
            max_score: Upper bound of expected real-world score range

        Returns:
            Normalized score clamped to [0.0, 1.0]
        """
        normalized = (score - min_score) / (max_score - min_score)
        return round(max(0.0, min(1.0, normalized)), 4)