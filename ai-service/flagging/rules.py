import re
from flagging.domain_vocab import PROBLEMATIC_KEYWORDS, PROBLEMATIC_PATTERNS

class BaseRule:
    def __init__(self, name: str):
        self.name = name

    def evaluate(self, image, caption: str, score: float) -> bool:
        raise NotImplementedError("Subclasses must implement evaluate()")

class LowAlignmentRule(BaseRule):
    """Flags captions with a CLIP score below the specified threshold."""
    def __init__(self, threshold: float = 0.9):
        super().__init__("LOW_ALIGNMENT")
        self.threshold = threshold

    def evaluate(self, image, caption: str, score: float) -> bool:
        return score < self.threshold

class VocabRule(BaseRule):
    """Flags captions containing problematic keywords or patterns."""
    def __init__(self):
        super().__init__("VOCAB_MATCH")

    def evaluate(self, image, caption: str, score: float) -> bool:
        caption_lower = caption.lower()
        
        # Check keywords
        for word in PROBLEMATIC_KEYWORDS:
            if word in caption_lower:
                return True
                
        # Check patterns
        for pattern in PROBLEMATIC_PATTERNS:
            if re.search(pattern, caption_lower):
                return True
                
        return False
