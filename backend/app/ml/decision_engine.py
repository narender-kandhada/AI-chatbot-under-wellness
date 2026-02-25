"""
Smart Decision Engine — Context-Aware Response Generator.

Generates natural, human-like responses by:
1. Extracting topics and keywords from the user's message
2. Referencing conversation history for continuity
3. Using topic-specific response templates with {topic} placeholders
4. Asking natural follow-up questions about what the user actually said

This handles ~80% of messages offline. The remaining ~20% (complex/deep
emotional conversations) get routed to Gemini via the hybrid router.
"""
import random
from app.ml.keyword_extractor import get_topic_summary

# ═══════════════════════════════════════════════════════════════════════
# TOPIC-AWARE RESPONSE TEMPLATES
# These reference what the user said via {phrase} placeholder
# ═══════════════════════════════════════════════════════════════════════

TOPIC_RESPONSES = {
    "relationship": {
        "happy": [
            "Oh wow, that's a big deal! 💚 Tell me more, how did it go?",
            "That's so exciting! I'm really happy for you! How are you feeling about it?",
            "Aww that's amazing! 😊 What happened next?",
            "Love hearing this! Sounds like things are going well for you!",
            "That's wonderful! I can tell this means a lot to you. How did they react?",
        ],
        "sad": [
            "That sounds really painful. Relationships can hurt so much. 💙 I'm here.",
            "I'm sorry you're going through that. That takes a lot of courage to share.",
            "Breakups are one of the hardest things. You don't have to be strong right now.",
            "That must feel so heavy. How are you holding up?",
            "I hear you. That kind of pain is real. Take your time.",
        ],
        "anxious": [
            "Relationships can bring up so many worries. What's on your mind most?",
            "That's totally normal to feel nervous about. What's your biggest concern?",
            "I get that anxiety. One step at a time — you'll figure it out. 💚",
            "It's natural to overthink these things. What does your gut tell you?",
        ],
        "calm": [
            "That's really nice! Sounds like things are good between you two. 😊",
            "Aww, that's lovely to hear. How long has this been going on?",
            "That sounds healthy and peaceful. I'm glad you shared that!",
        ],
    },
    "studies": {
        "happy": [
            "That's awesome! You must have worked so hard for this! 🎉 What subject?",
            "Congratulations! All that effort paid off! How does it feel?",
            "That's great news! I knew you could do it! 😊 What's next?",
            "Wow, you should be really proud of yourself! Tell me more!",
        ],
        "sad": [
            "I'm sorry about that. Exams can be really stressful. 💙 One bad result doesn't define you.",
            "That's tough, but this isn't the end. What are you thinking about doing next?",
            "I hear you. Academic pressure is real. Remember — grades aren't everything.",
            "That must be disappointing. But you know what? You learned from it. That counts.",
        ],
        "anxious": [
            "Exam stress is the worst. Have you been able to take any breaks?",
            "That's a lot of pressure. What subject are you most worried about?",
            "I totally get that. Would it help to talk about a study plan?",
            "One exam at a time. You've got through tough things before. 💪",
        ],
        "tired": [
            "Studying is exhausting. Please make sure you're sleeping enough. 😴",
            "You've been working so hard. It's okay to take a break, you know?",
            "Don't burn yourself out. Rest is part of the process.",
        ],
    },
    "work": {
        "happy": [
            "That's great news about work! 🎉 What happened exactly?",
            "Wow, sounds like things are going well! You deserve it!",
            "That's amazing! I can tell you're proud of this. How does it feel?",
        ],
        "sad": [
            "Work stuff can really get to you. I'm sorry you're dealing with that.",
            "That sounds frustrating. You deserve better than that.",
            "I hear you. Work pressure is no joke. What's been the hardest part?",
        ],
        "anxious": [
            "Work anxiety is so common and totally valid. What's stressing you most?",
            "That does sound overwhelming. Have you been able to talk to anyone about it?",
            "One thing at a time. You don't have to solve everything today.",
        ],
        "angry": [
            "That does sound really unfair. Your frustration is completely valid.",
            "I'd be upset too. That's not okay. Have you thought about what you want to do?",
            "I hear you. It's okay to be angry about this. What happened?",
        ],
    },
    "family": {
        "happy": [
            "Family moments like that are so special. 💚 What made it so nice?",
            "That sounds really lovely! Family can be such a source of warmth.",
            "Aww, that's heartwarming! Tell me more about it!",
        ],
        "sad": [
            "Family issues hit different. I'm really sorry you're going through this. 💙",
            "That sounds so hard. Home should feel safe. How are you coping?",
            "I hear you. Family stuff is complicated. You don't have to face it alone.",
        ],
    },
    "achievement": {
        "happy": [
            "THAT'S AMAZING! 🎉 You should be so proud! How did it happen?",
            "Wow, congratulations!! That's a huge deal! How are you celebrating?",
            "I'm genuinely so happy for you! You earned this! Tell me everything!",
            "What an accomplishment! Hard work really does pay off! 🌟",
        ],
        "calm": [
            "That's really impressive! You don't even seem surprised — you knew you could do it! 😊",
            "Look at you! That's a big achievement. What's your next goal?",
        ],
    },
    "social": {
        "happy": [
            "That sounds like so much fun! Who did you go with? 😊",
            "I love that! Good times with friends are the best. What was the highlight?",
            "That sounds amazing! Tell me more about it!",
        ],
        "sad": [
            "Social stuff can be tricky. What happened?",
            "I'm sorry you're feeling that way. Did something happen with your friends?",
        ],
    },
    "health": {
        "sad": [
            "I'm sorry you're not feeling well. Are you taking care of yourself? 💚",
            "That sounds tough. Health worries are really scary. Have you seen a doctor?",
        ],
        "anxious": [
            "Health anxiety is so valid. The uncertainty is the hardest part, isn't it?",
            "That must be really worrying. Have you been able to talk to someone about it?",
        ],
        "tired": [
            "Your body is telling you to rest. Please listen to it. 😴",
            "Being sick is exhausting. Give yourself permission to just rest.",
        ],
    },
}

# ═══════════════════════════════════════════════════════════════════════
# GENERIC EMOTION RESPONSES (when no specific topic is detected)
# ═══════════════════════════════════════════════════════════════════════

GENERIC_RESPONSES = {
    "happy": [
        "That sounds wonderful! I'm really glad to hear about that. 😊 What made it so special?",
        "I love that! It's so great when good things happen. Tell me more!",
        "That's amazing! You sound really happy about this. 🎉 What happened?",
        "What a lovely thing to share! I can tell this means a lot to you. ✨",
        "That's so nice! I'm happy for you. What's the story behind it?",
    ],
    "sad": [
        "I'm sorry you're going through that. That sounds really tough. 💙 I'm here for you.",
        "That must be really hard. Thank you for trusting me with this. What happened?",
        "I hear you, and your feelings are completely valid. Want to tell me more?",
        "That sounds painful. You don't have to go through this alone. 💜",
        "I'm really sorry to hear that. It takes courage to talk about difficult things.",
    ],
    "anxious": [
        "I can understand why that would make you feel anxious. Let's take a breath. 🌊",
        "It's natural to feel worried about that. What part concerns you most?",
        "That sounds stressful. You don't have to figure it all out right now.",
        "I hear your worry. One step at a time — you've handled tough things before. 💪",
        "That's a lot to deal with. Would a breathing exercise help right now?",
    ],
    "angry": [
        "I can see why that would be frustrating. Your feelings are completely valid.",
        "That does sound unfair. It makes sense to feel upset about this.",
        "I hear your frustration. Would it help to talk through what happened?",
        "That sounds really annoying. You have every right to feel this way.",
        "I understand that anger. What happened?",
    ],
    "tired": [
        "It sounds like you've been going through a lot. It's okay to rest. 😴",
        "That sounds exhausting. Please be gentle with yourself today.",
        "You've been carrying a lot. You don't have to do everything at once.",
        "I can hear how drained you feel. What would help you recharge?",
        "That's a lot on your plate. It's okay to take things slowly. 💤",
    ],
    "lonely": [
        "I'm really glad you reached out. You're not alone right now — I'm here. 💜",
        "That sounds really isolating. I want you to know that you matter.",
        "Feeling disconnected is so hard. I'm here to listen, always.",
        "I hear you. Reaching out like this is brave. 🤗",
        "That must feel heavy. You deserve to feel seen and heard.",
    ],
    "calm": [
        "That's nice! I'm glad you're in a good space. What's been going on? 😊",
        "Sounds like things are going well! Tell me about your day.",
        "That's great! What's on your mind? I'm here to chat.",
        "I'm glad you're sharing with me. How has your day been going? ☺️",
        "That's lovely! What would you like to talk about?",
    ],
    "hopeful": [
        "I love that positive energy! You've got this. 🌟",
        "That's such a great attitude! What are you most excited about?",
        "Your optimism is inspiring! Tell me more about what's ahead.",
        "That sounds really promising! I'm cheering you on. 💪",
        "What a wonderful outlook! Keep believing in yourself. ✨",
    ],
}

# ═══════════════════════════════════════════════════════════════════════
# CONTEXT-AWARE FOLLOW-UP QUESTIONS
# Asked when the conversation needs a natural continuation
# ═══════════════════════════════════════════════════════════════════════

FOLLOW_UP_QUESTIONS = {
    "relationship": [
        "How long have you two been together?",
        "What do you like most about them?",
        "How did you two meet?",
        "What happened next?",
    ],
    "studies": [
        "What are you studying?",
        "Which subject was it?",
        "When's your next exam?",
        "What's your favorite subject?",
    ],
    "work": [
        "What do you do for work?",
        "How long have you been there?",
        "What's the team like?",
    ],
    "achievement": [
        "How did you celebrate?",
        "Who was the first person you told?",
        "What's your next goal?",
    ],
    "social": [
        "Who were you with?",
        "What was the highlight?",
        "When's the next hangout?",
    ],
    "general": [
        "Tell me more about that.",
        "How does that make you feel?",
        "What happened next?",
        "Is there more to the story?",
        "What's on your mind right now?",
    ],
}

# ═══════════════════════════════════════════════════════════════════════
# GREETING/SHORT MESSAGE RESPONSES
# For messages like "hi", "hey", "hello", "how are you"
# ═══════════════════════════════════════════════════════════════════════

GREETING_PATTERNS = {"hi", "hey", "hello", "hii", "hiii", "yo", "sup", "heya", "heyy"}
HOW_ARE_YOU_PATTERNS = {"how are you", "how r u", "how are u", "hows it going", "what's up", "whats up", "wassup"}

GREETING_RESPONSES = [
    "Hey there! 💚 How's your day going?",
    "Hi! I'm glad you're here. What's on your mind today? 🌿",
    "Hello! How are you feeling today? I'm here to listen. 😊",
    "Hey! 💚 What's going on? Tell me about your day.",
    "Hi! 🌿 It's good to see you. How are things?",
]

SHORT_AFFIRM_PATTERNS = {"yes", "yeah", "yep", "yea", "ya", "yup", "mhm", "correct", "right", "true"}
SHORT_DENY_PATTERNS = {"no", "nah", "nope", "not really", "na"}
SHORT_OK_PATTERNS = {"ok", "okay", "k", "fine", "good", "nice", "cool", "great", "alright"}

# ═══════════════════════════════════════════════════════════════════════
# SITUATION-AWARE FOLLOW-UPS (from original decision engine)
# ═══════════════════════════════════════════════════════════════════════

SITUATION_FOLLOWUPS = {
    "academic_stress": [
        "School pressure is real. Remember — your worth isn't defined by grades.",
        "Take it one step at a time. You're doing better than you think.",
    ],
    "work_stress": [
        "Work can really take a toll. Don't forget to take care of yourself too.",
        "It's okay to set boundaries at work. Your wellbeing matters.",
    ],
    "relationship_issues": [
        "Relationships can bring up a lot of emotions. How are you feeling about it?",
        "That's a big moment. Whatever happens, you deserve to be happy.",
    ],
    "loneliness": [
        "Connection is a basic human need. I'm glad you're talking to me.",
        "Even small moments of connection matter. You're not alone right now.",
    ],
    "grief": [
        "Grief has no timeline. Be patient with yourself through this.",
        "I'm sorry for what you're going through. Your feelings are valid.",
    ],
    "financial_stress": [
        "Financial worries are incredibly stressful. You're doing your best.",
        "Money problems don't define you. One step at a time.",
    ],
    "health_anxiety": [
        "Health concerns can be scary. Have you been able to talk to someone about it?",
        "It's okay to feel worried about your health. Taking care of yourself matters.",
    ],
    "general": [],
}

# ═══════════════════════════════════════════════════════════════════════
# ACTION SUGGESTIONS
# ═══════════════════════════════════════════════════════════════════════

EMOTION_ACTIONS = {
    "happy": ["journaling", "gratitude"],
    "sad": ["reflection", "breathing", "journaling"],
    "anxious": ["breathing", "grounding", "meditation"],
    "angry": ["breathing", "grounding", "journaling"],
    "tired": ["rest", "breathing", "gentle_movement"],
    "lonely": ["reflection", "journaling", "reaching_out"],
    "calm": ["mindfulness", "journaling"],
    "hopeful": ["journaling", "gratitude", "goal_setting"],
}


# ═══════════════════════════════════════════════════════════════════════
# MAIN RESPONSE FUNCTION
# ═══════════════════════════════════════════════════════════════════════

def decide_response(
    emotion: str,
    situation: str,
    user_message: str = "",
    history: list[dict] | None = None,
) -> tuple[str, list[str], bool]:
    """
    Generate a smart, context-aware response.

    Args:
        emotion: Detected emotion label
        situation: Detected situation
        user_message: The user's original message
        history: Conversation history [{role, text, emotion}, ...]

    Returns:
        tuple: (reply, actions, needs_gemini)
        needs_gemini = True if message is too complex for templates
    """
    history = history or []
    text_lower = user_message.lower().strip()
    words = set(text_lower.split())
    analysis = get_topic_summary(user_message)
    topics = analysis["topics"]
    is_short = analysis["is_short"]

    # ─── 1. GREETINGS ─────────────────────────────────────────────
    if words & GREETING_PATTERNS and is_short:
        return random.choice(GREETING_RESPONSES), ["mindfulness"], False

    # ─── 2. SHORT AFFIRMATIONS (yes/no/ok) ────────────────────────
    if is_short and (words & SHORT_AFFIRM_PATTERNS or words & SHORT_DENY_PATTERNS or words & SHORT_OK_PATTERNS):
        return _handle_short_response(text_lower, words, history, emotion), EMOTION_ACTIONS.get(emotion, []), False

    # ─── 3. TOPIC-SPECIFIC RESPONSE ───────────────────────────────
    if topics:
        primary_topic = topics[0]
        topic_templates = TOPIC_RESPONSES.get(primary_topic, {})
        emotion_templates = topic_templates.get(emotion, [])

        # Only use topic templates if we have HIGH confidence in the emotion
        if emotion_templates and not is_short:
            reply = random.choice(emotion_templates)
            actions = EMOTION_ACTIONS.get(emotion, [])
            return reply, actions, False

    # ─── 4. CHECK IF MESSAGE SHOULD GO TO GEMINI ─────────────────
    # Route to Gemini aggressively for better contextual responses
    word_count = len(user_message.split())
    conversation_is_going = len(history) >= 4
    has_any_substance = word_count > 3
    is_not_just_ok = not (words & SHORT_OK_PATTERNS or words & SHORT_AFFIRM_PATTERNS or words & SHORT_DENY_PATTERNS)

    # Route to Gemini if:
    # - Message has substance (>3 words) and isn't a simple greeting, OR
    # - Conversation has been going for a while (context matters), OR
    # - Message has any emotional indicators
    needs_gemini = (
        (has_any_substance and is_not_just_ok) or
        (conversation_is_going and word_count > 2) or
        (emotion in ("sad", "lonely", "anxious", "angry") and word_count > 2)
    )

    if needs_gemini:
        fallback = random.choice(GENERIC_RESPONSES.get(emotion, GENERIC_RESPONSES["calm"]))
        actions = EMOTION_ACTIONS.get(emotion, [])
        return fallback, actions, True

    # ─── 5. GENERIC EMOTION RESPONSE (only for very short/simple) ─
    responses = GENERIC_RESPONSES.get(emotion, GENERIC_RESPONSES["calm"])
    reply = random.choice(responses)

    # Add situation follow-up sometimes
    followups = SITUATION_FOLLOWUPS.get(situation, [])
    if followups and situation != "general" and random.random() > 0.5:
        reply = f"{reply}\n\n{random.choice(followups)}"

    actions = EMOTION_ACTIONS.get(emotion, [])
    return reply, actions, False


def _handle_short_response(text: str, words: set, history: list, emotion: str) -> str:
    """Handle short replies like 'yes', 'no', 'okay' with context."""
    # Look at what the AI asked last
    last_ai_msg = ""
    for msg in reversed(history):
        if msg.get("role") == "ai":
            last_ai_msg = msg.get("text", "")
            break

    if words & SHORT_AFFIRM_PATTERNS:
        if "?" in last_ai_msg:
            # The AI asked a question and user said yes
            return random.choice([
                "Tell me more about that! I'd love to hear the details. 😊",
                "That's great! I'm all ears. What happened?",
                "Awesome! Go ahead, I'm listening. 💚",
                "I'd love to hear more! Take your time.",
            ])
        return random.choice([
            "I'm glad to hear that! What else is on your mind? 😊",
            "That's nice! Anything else you'd like to talk about?",
            "Great! I'm here if you want to chat more. 💚",
        ])

    if words & SHORT_DENY_PATTERNS:
        return random.choice([
            "That's okay! No pressure at all. 💚 What would you like to talk about instead?",
            "Totally fine! Is there something else on your mind?",
            "No worries! I'm here whenever you're ready. 😊",
        ])

    # "ok", "fine", "good", etc.
    return random.choice([
        "I'm glad to hear that! 😊 Anything else you'd like to share?",
        "That's good! What else is going on? I'm here to listen. 💚",
        "Nice! Tell me more about your day if you'd like.",
        "That's great! Is there anything on your mind? 🌿",
    ])
