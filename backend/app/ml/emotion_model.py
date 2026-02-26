"""
Emotion Model Module.

Keyword + pattern scoring + negation-aware detection.
Covers 8 emotions: happy, sad, anxious, angry, tired, lonely, calm, hopeful
"""
import re

# Keyword dictionaries for each emotion
EMOTION_KEYWORDS = {
    "happy": [
        "happy", "joy", "joyful", "glad", "excited", "wonderful", "fantastic",
        "amazing", "great", "love", "loving", "cheerful", "delighted", "thrilled",
        "ecstatic", "blissful", "content", "pleased", "grateful", "thankful",
        "blessed", "smile", "smiling", "laughing", "fun", "celebrate", "proud",
        "accomplished", "successful", "bright", "sunshine", "beautiful day",
        "yay", "woohoo", "awesome", "incredible", "thriving", "pumped",
    ],
    "sad": [
        "sad", "unhappy", "depressed", "down", "miserable", "heartbroken",
        "crying", "tears", "grief", "grieving", "loss", "lost", "hopeless",
        "despair", "devastated", "broken", "shattered", "empty", "numb",
        "pain", "painful", "suffering", "hurting", "hurt", "sorrow",
        "mourning", "melancholy", "gloomy", "worthless", "useless",
        "disappointed", "crushed", "defeated", "giving up", "not okay",
        "not good", "not well", "not fine", "not great", "not happy",
        "feel bad", "feeling bad", "feel low", "feeling low", "feeling down",
        "fell apart", "falling apart", "not doing well", "not doing good",
        "not feeling good", "not feeling well", "not feeling okay",
        "terrible", "horrible", "awful", "dreadful", "unbearable",
        "cant handle", "cant cope", "can't handle", "can't cope",
        "miss", "missing", "wish things", "wish it was",
    ],
    "anxious": [
        "anxious", "anxiety", "worried", "worry", "nervous", "scared",
        "fear", "fearful", "afraid", "panic", "panicking", "stressed",
        "stress", "overwhelmed", "overthinking", "restless", "uneasy",
        "tense", "dread", "dreading", "terrified", "freak out", "freaking",
        "cant breathe", "racing thoughts", "what if", "uncertain",
        "insecure", "pressured", "on edge", "frightened", "nervous wreck",
        "cant sleep", "can't sleep", "mind racing", "spiraling",
    ],
    "angry": [
        "angry", "anger", "mad", "furious", "rage", "raging", "frustrated",
        "frustration", "annoyed", "irritated", "hate", "hating", "livid",
        "outraged", "fed up", "sick of", "tired of", "cant stand",
        "infuriated", "pissed", "resentful", "bitter", "hostile",
        "aggressive", "fuming", "disgusted", "unfair", "injustice",
        "yelled at", "yelling", "shouted", "screamed", "bullied",
        "disrespected", "unappreciated", "not fair", "so unfair",
    ],
    "tired": [
        "tired", "exhausted", "drained", "burnt out", "burnout", "fatigue",
        "fatigued", "sleepy", "cant sleep", "insomnia", "no energy",
        "worn out", "weary", "lethargic", "sluggish", "unmotivated",
        "no motivation", "lazy", "heavy", "running on empty", "wiped out",
        "overworked", "depleted", "spent", "drowsy", "so tired",
        "really tired", "extremely tired", "dead tired", "beyond tired",
    ],
    "lonely": [
        "lonely", "alone", "isolated", "isolation", "no friends", "no one",
        "nobody cares", "abandoned", "rejected", "left out", "excluded",
        "invisible", "ignored", "disconnected", "distant", "apart",
        "misunderstood", "dont belong", "outcast", "unwanted", "forgotten",
        "by myself", "on my own", "miss someone", "missing people",
        "no one to talk", "no one listens", "nobody understands",
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

# Negation patterns: if these precede an emotion word, flip the emotion
NEGATION_WORDS = {
    "not", "no", "never", "dont", "don't", "didn't", "didnt",
    "cannot", "can't", "cant", "isnt", "isn't", "wasn't", "wasnt",
    "aren't", "arent", "won't",
}

# Phrases that indicate negativity regardless of individual keywords
NEGATIVE_PHRASES = [
    "not good", "not well", "not okay", "not ok", "not fine", "not great",
    "not happy", "not feeling good", "not feeling well", "not feeling okay",
    "not doing well", "not doing good", "not at all", "not really good",
    "nothing is going right", "everything is wrong", "everything fell apart",
    "everything is falling apart", "really bad", "so bad", "very bad",
    "had a bad", "having a bad", "bad day", "worst day", "horrible day",
    "terrible day", "rough day", "tough day",
    "yelled at me", "shouted at me", "screamed at me", "bullied",
    "no one cares", "nobody cares", "feel like crying", "want to cry",
    "want to disappear", "cant anymore", "can't anymore",
]


def predict_emotion(text: str) -> tuple[str, float]:
    """
    Predict emotion using keyword scoring with negation handling.

    Returns:
        tuple: (emotion_label, confidence)
    """
    text_lower = text.lower()

    # ─── 1. Check explicit negative phrases first ─────────────────
    for phrase in NEGATIVE_PHRASES:
        if phrase in text_lower:
            # Found a direct negative phrase — lean toward sad
            scores = _keyword_scores(text_lower)
            scores["sad"] += 3  # boost sad score
            return _pick_emotion(scores, boosted=True)

    # ─── 2. Keyword scoring ────────────────────────────────────────
    scores = _keyword_scores(text_lower)

    # ─── 3. Negation detection ─────────────────────────────────────
    words = text_lower.split()
    for i, word in enumerate(words):
        # Clean punctuation
        word_clean = re.sub(r"[^\w]", "", word)
        if word_clean in NEGATION_WORDS:
            # Look at next 1-2 words and check if they match a positive emotion
            context_window = " ".join(words[i + 1:i + 3])
            for pos_emotion in ("happy", "calm", "hopeful"):
                for keyword in EMOTION_KEYWORDS[pos_emotion]:
                    if keyword in context_window:
                        # Negate the positive emotion word — boost sad instead
                        scores[pos_emotion] = max(0, scores[pos_emotion] - 2)
                        scores["sad"] += 2
                        break

    # ─── 4. Pick winner ────────────────────────────────────────────
    return _pick_emotion(scores)


def _keyword_scores(text_lower: str) -> dict[str, int]:
    """Score each emotion by keyword matches."""
    scores: dict[str, int] = {}
    for emotion, keywords in EMOTION_KEYWORDS.items():
        score = 0
        for keyword in keywords:
            if keyword in text_lower:
                weight = 2 if " " in keyword else 1
                score += weight
        scores[emotion] = score
    return scores


def _pick_emotion(scores: dict[str, int], boosted: bool = False) -> tuple[str, float]:
    """Pick the winning emotion and compute confidence."""
    max_score = max(scores.values())

    if max_score == 0:
        # No keywords matched — default to sad with low confidence if text is short negative
        return "calm", 0.35

    best_emotion = max(scores, key=scores.get)  # type: ignore

    # Calculate confidence
    max_possible = len(EMOTION_KEYWORDS[best_emotion])
    confidence = min(0.95, 0.4 + (max_score / max_possible) * 1.5)
    if boosted:
        confidence = min(0.95, confidence + 0.1)

    # If tied, lower confidence
    tied = [e for e, s in scores.items() if s == max_score]
    if len(tied) > 1:
        import random
        best_emotion = random.choice(tied)
        confidence *= 0.8

    return best_emotion, round(confidence, 2)
