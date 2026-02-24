"""
Emotion Model Module.

Comprehensive keyword+pattern scoring engine for emotion detection.
Covers 8 emotions: happy, sad, anxious, angry, tired, lonely, calm, hopeful
"""
import random

# Keyword dictionaries for each emotion
EMOTION_KEYWORDS = {
    "happy": [
        "happy", "joy", "joyful", "glad", "excited", "wonderful", "fantastic",
        "amazing", "great", "love", "loving", "cheerful", "delighted", "thrilled",
        "ecstatic", "blissful", "content", "pleased", "grateful", "thankful",
        "blessed", "smile", "smiling", "laughing", "fun", "celebrate", "proud",
        "accomplished", "successful", "bright", "sunshine", "beautiful day",
    ],
    "sad": [
        "sad", "unhappy", "depressed", "down", "miserable", "heartbroken",
        "crying", "tears", "grief", "grieving", "loss", "lost", "hopeless",
        "despair", "devastated", "broken", "shattered", "empty", "numb",
        "pain", "painful", "suffering", "hurting", "hurt", "sorrow",
        "mourning", "melancholy", "gloomy", "worthless", "useless",
        "disappointed", "crushed", "defeated", "giving up",
    ],
    "anxious": [
        "anxious", "anxiety", "worried", "worry", "nervous", "scared",
        "fear", "fearful", "afraid", "panic", "panicking", "stressed",
        "stress", "overwhelmed", "overthinking", "restless", "uneasy",
        "tense", "dread", "dreading", "terrified", "freak out", "freaking",
        "cant breathe", "racing thoughts", "what if", "uncertain",
        "insecure", "pressured", "on edge", "frightened",
    ],
    "angry": [
        "angry", "anger", "mad", "furious", "rage", "raging", "frustrated",
        "frustration", "annoyed", "irritated", "hate", "hating", "livid",
        "outraged", "fed up", "sick of", "tired of", "cant stand",
        "infuriated", "pissed", "resentful", "bitter", "hostile",
        "aggressive", "fuming", "disgusted", "unfair", "injustice",
    ],
    "tired": [
        "tired", "exhausted", "drained", "burnt out", "burnout", "fatigue",
        "fatigued", "sleepy", "cant sleep", "insomnia", "no energy",
        "worn out", "weary", "lethargic", "sluggish", "unmotivated",
        "no motivation", "lazy", "heavy", "running on empty", "wiped out",
        "overworked", "depleted", "spent", "drowsy",
    ],
    "lonely": [
        "lonely", "alone", "isolated", "isolation", "no friends", "no one",
        "nobody cares", "abandoned", "rejected", "left out", "excluded",
        "invisible", "ignored", "disconnected", "distant", "apart",
        "misunderstood", "dont belong", "outcast", "unwanted", "forgotten",
        "by myself", "on my own", "miss someone", "missing people",
    ],
    "calm": [
        "calm", "peaceful", "relaxed", "serene", "tranquil", "at peace",
        "comfortable", "safe", "secure", "okay", "fine", "alright",
        "steady", "grounded", "centered", "balanced", "still", "quiet",
        "mindful", "present", "breathing", "resting", "settled",
        "in control", "composed", "collected",
    ],
    "hopeful": [
        "hopeful", "hope", "optimistic", "positive", "better", "improving",
        "looking forward", "excited about", "new beginning", "fresh start",
        "motivated", "inspired", "determined", "strong", "confident",
        "courage", "brave", "resilient", "getting through", "moving on",
        "growing", "learning", "progress", "faith", "brighter",
        "bright future", "looking up", "turning around",
    ],
}


def predict_emotion(text: str) -> tuple[str, float]:
    """
    Predict emotion using keyword scoring.

    Scores each emotion category by counting keyword matches,
    returns the highest-scoring emotion with confidence.

    Returns:
        tuple: (emotion_label, confidence)
    """
    text_lower = text.lower()
    scores: dict[str, int] = {}

    for emotion, keywords in EMOTION_KEYWORDS.items():
        score = 0
        for keyword in keywords:
            if keyword in text_lower:
                # Multi-word phrases get higher weight
                weight = 2 if " " in keyword else 1
                score += weight
        scores[emotion] = score

    # Find best match
    max_score = max(scores.values())

    if max_score == 0:
        # No keywords matched — default to calm with low confidence
        return "calm", 0.35

    # Get top emotion
    best_emotion = max(scores, key=scores.get)  # type: ignore

    # Calculate confidence (normalize by max possible score)
    max_possible = len(EMOTION_KEYWORDS[best_emotion])
    confidence = min(0.95, 0.4 + (max_score / max_possible) * 1.5)

    # If multiple emotions score the same, pick one but lower confidence
    tied = [e for e, s in scores.items() if s == max_score]
    if len(tied) > 1:
        best_emotion = random.choice(tied)
        confidence *= 0.8

    return best_emotion, round(confidence, 2)
