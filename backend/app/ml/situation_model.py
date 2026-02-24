"""
Situation Model Module.

Comprehensive keyword+pattern scoring engine for situation detection.
Covers 8 situations: academic_stress, work_stress, relationship_issues,
loneliness, grief, financial_stress, health_anxiety, general
"""

SITUATION_KEYWORDS = {
    "academic_stress": [
        "exam", "exams", "test", "homework", "assignment", "study", "studying",
        "grades", "grade", "school", "college", "university", "class", "classes",
        "professor", "teacher", "gpa", "deadline", "paper", "thesis",
        "dissertation", "lecture", "semester", "failing", "fail", "dropout",
        "drop out", "academic", "education", "coursework", "project due",
        "presentation", "midterm", "final exam",
    ],
    "work_stress": [
        "work", "job", "boss", "manager", "coworker", "colleague", "office",
        "workplace", "promotion", "fired", "layoff", "laid off", "career",
        "meeting", "meetings", "deadline", "project", "client", "salary",
        "overworked", "underpaid", "workload", "commute", "performance review",
        "toxic workplace", "burnout", "corporate", "resignation", "quit my job",
        "interview", "work life balance",
    ],
    "relationship_issues": [
        "boyfriend", "girlfriend", "partner", "spouse", "husband", "wife",
        "breakup", "broke up", "broke up with", "divorce", "separation",
        "cheating", "argument", "fight", "fighting", "toxic relationship",
        "trust issues", "jealous", "jealousy", "love life", "dating",
        "single", "ghosted", "blocked", "ex", "relationship", "marriage",
        "commitment", "long distance", "betrayed", "heartbreak",
    ],
    "loneliness": [
        "lonely", "alone", "isolated", "no friends", "no one to talk",
        "nobody understands", "feel invisible", "left out", "excluded",
        "dont belong", "outcast", "abandoned", "rejected", "disconnected",
        "by myself", "all alone", "no social life", "no one cares",
        "forgotten", "ignored", "unwanted", "miss my friends",
    ],
    "grief": [
        "death", "died", "passed away", "funeral", "loss", "lost someone",
        "mourning", "grieving", "bereavement", "gone forever", "miss them",
        "miss her", "miss him", "passed on", "rest in peace", "rip",
        "terminal", "cancer", "diagnosis", "deceased", "memorial",
    ],
    "financial_stress": [
        "money", "broke", "debt", "bills", "rent", "mortgage", "loan",
        "loans", "credit card", "savings", "bankrupt", "bankruptcy",
        "afford", "expensive", "financial", "income", "paycheck",
        "unemployed", "unemployment", "budget", "struggling financially",
        "cant pay", "overdraft", "eviction", "homeless",
    ],
    "health_anxiety": [
        "sick", "illness", "disease", "symptoms", "doctor", "hospital",
        "diagnosis", "medication", "medicine", "surgery", "pain",
        "chronic pain", "therapy", "therapist", "counselor", "treatment",
        "mental health", "physical health", "condition", "disability",
        "disorder", "infection", "injury", "health issue", "checkup",
    ],
    "general": [],
}


def detect_situation(text: str) -> str:
    """
    Detect the user's situation using keyword scoring.

    Returns:
        str: Detected situation label
    """
    text_lower = text.lower()
    scores: dict[str, int] = {}

    for situation, keywords in SITUATION_KEYWORDS.items():
        if situation == "general":
            continue
        score = 0
        for keyword in keywords:
            if keyword in text_lower:
                weight = 2 if " " in keyword else 1
                score += weight
        scores[situation] = score

    max_score = max(scores.values()) if scores else 0

    if max_score == 0:
        return "general"

    return max(scores, key=scores.get)  # type: ignore
