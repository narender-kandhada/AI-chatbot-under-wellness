"""
Keyword & Topic Extractor — Offline, zero-dependency.

Extracts meaningful topics, subjects, and activities from user messages
so the response engine can reference what the user actually said.
"""
import re

# ─── Topic keyword maps ─────────────────────────────────────────────
# Maps keywords → human-readable topic labels

RELATIONSHIP_WORDS = {
    "proposed", "propose", "proposal", "girlfriend", "boyfriend", "crush",
    "love", "date", "dating", "relationship", "partner", "married", "marriage",
    "breakup", "broke up", "dumped", "divorce", "ex", "confession", "confess",
    "kiss", "hug", "engagement", "engaged", "wedding", "anniversary",
    "said yes", "said no", "rejected", "friendzone", "friend zone",
}

ACADEMIC_WORDS = {
    "exam", "test", "study", "studying", "finals", "grade", "grades",
    "homework", "assignment", "college", "university", "school", "class",
    "professor", "teacher", "lecture", "passed", "failed", "marks",
    "cgpa", "gpa", "semester", "degree", "thesis", "project", "lab",
    "tuition", "scholarship", "topper", "backlog",
}

WORK_WORDS = {
    "job", "work", "boss", "office", "salary", "promotion", "fired",
    "hired", "interview", "resume", "career", "meeting", "deadline",
    "client", "project", "manager", "colleague", "internship", "intern",
    "startup", "company", "business", "raise", "overtime",
}

FAMILY_WORDS = {
    "mom", "mother", "dad", "father", "parents", "family", "brother",
    "sister", "sibling", "grandma", "grandpa", "uncle", "aunt",
    "cousin", "home", "house",
}

HEALTH_WORDS = {
    "sick", "ill", "hospital", "doctor", "medicine", "pain", "headache",
    "fever", "cold", "injury", "surgery", "therapy", "therapist",
    "counselor", "counseling", "mental health", "depression", "anxiety",
    "panic", "insomnia", "sleep", "sleeping",
}

ACHIEVEMENT_WORDS = {
    "won", "win", "achieved", "achievement", "success", "successful",
    "completed", "finished", "accomplished", "milestone", "proud",
    "promoted", "accepted", "selected", "qualified", "cleared",
}

SOCIAL_WORDS = {
    "friend", "friends", "party", "hangout", "hanging out", "trip",
    "travel", "vacation", "holiday", "concert", "movie", "outing",
    "celebration", "birthday", "festival",
}

TOPIC_MAP = {
    "relationship": RELATIONSHIP_WORDS,
    "studies": ACADEMIC_WORDS,
    "work": WORK_WORDS,
    "family": FAMILY_WORDS,
    "health": HEALTH_WORDS,
    "achievement": ACHIEVEMENT_WORDS,
    "social": SOCIAL_WORDS,
}


def extract_topics(text: str) -> list[str]:
    """Extract topic categories from text."""
    text_lower = text.lower()
    words = set(re.findall(r'\b\w+\b', text_lower))

    # Also check 2-word phrases
    bigrams = set()
    word_list = text_lower.split()
    for i in range(len(word_list) - 1):
        bigrams.add(f"{word_list[i]} {word_list[i+1]}")

    all_tokens = words | bigrams
    found_topics = []

    for topic, keywords in TOPIC_MAP.items():
        if all_tokens & keywords:
            found_topics.append(topic)

    return found_topics


def extract_key_phrases(text: str) -> list[str]:
    """Extract the most meaningful short phrases from user's message."""
    text_lower = text.lower().strip()

    # Remove filler words to identify key content
    fillers = {
        "i", "me", "my", "am", "is", "are", "was", "were", "be", "been",
        "have", "has", "had", "do", "does", "did", "will", "would", "could",
        "should", "can", "may", "might", "shall", "the", "a", "an", "and",
        "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
        "it", "its", "this", "that", "these", "those", "just", "very",
        "really", "so", "too", "also", "im", "ive", "dont", "didnt",
        "today", "yesterday", "tomorrow", "now", "like", "um", "uh",
        "well", "yeah", "yes", "no", "ok", "okay", "hey", "hi", "hello",
        "hii", "hiii", "lol", "haha", "oh", "gonna", "wanna", "gotta",
        "thing", "things", "something", "nothing", "everything", "got",
    }

    words = re.findall(r'\b\w+\b', text_lower)
    meaningful = [w for w in words if w not in fillers and len(w) > 1]

    return meaningful


def get_topic_summary(text: str) -> dict:
    """
    Full analysis of a message.

    Returns:
        {
            "topics": ["relationship", "achievement"],
            "key_phrases": ["proposed", "girl"],
            "is_question": True/False,
            "is_short": True/False,
            "mentions_person": True/False,
        }
    """
    text_lower = text.lower().strip()

    # Person detection
    person_words = {"he", "she", "him", "her", "they", "them", "friend",
                    "mom", "dad", "boss", "teacher", "girlfriend", "boyfriend",
                    "brother", "sister", "partner", "wife", "husband"}
    words = set(re.findall(r'\b\w+\b', text_lower))

    return {
        "topics": extract_topics(text),
        "key_phrases": extract_key_phrases(text),
        "is_question": text.strip().endswith("?"),
        "is_short": len(text.split()) <= 4,
        "mentions_person": bool(words & person_words),
    }
