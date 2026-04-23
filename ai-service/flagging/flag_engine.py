from flagging.rules import LowAlignmentRule, VocabRule

class FlagEngine:
    def __init__(self, clip_threshold: float = 0.70):
        self.rules = [
            LowAlignmentRule(threshold=clip_threshold),
            VocabRule()
        ]

    def process(self, image, caption: str, score: float) -> bool:
        """
        Runs all rules and returns True if ANY rule triggers.
        """
        for rule in self.rules:
            if rule.evaluate(image, caption, score):
                print(f"  [FLAGGING] Triggered rule: {rule.name}")
                return True
        return False

# Singleton instance
default_engine = FlagEngine()
