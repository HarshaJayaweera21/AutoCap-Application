# Keywords that often indicate a failed or low-quality caption
PROBLEMATIC_KEYWORDS = [
    "unknown",
    "blurry",
    "loading",
    "not sure",
    "error",
    "failed",
    "undefined",
    "nan",
    "null",
    "placeholder",
    "example caption",
    "test",
]

# Patterns that might indicate repetitive or broken output
PROBLEMATIC_PATTERNS = [
    r"(.)\1{4,}",  # 5+ repeated characters (e.g. "aaaaa")
    r"(\b\w+\b\s+)\1{2,}",  # 3+ repeated words (e.g. "the the the")
]
