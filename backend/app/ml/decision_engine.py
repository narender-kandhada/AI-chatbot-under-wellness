"""
Smart Decision Engine — Context-Aware Response Generator.

Generates natural, human-like responses by:
1. Detecting greetings and short messages with dedicated handlers
2. Using topic + emotion combos for rich, specific responses
3. Routing complex messages to the hosted AI provider when available
4. Falling back to deep, empathetic generic responses

The hosted-AI fallback when templates are used should NEVER feel cold or robotic.
"""
import random
from app.ml.keyword_extractor import get_topic_summary

# ═══════════════════════════════════════════════════════════════════════
# TOPIC-AWARE RESPONSE TEMPLATES
# Rich, human-like, empathetic responses per topic+emotion combo
# ═══════════════════════════════════════════════════════════════════════

TOPIC_RESPONSES = {
    "relationship": {
        "happy": [
            "That's so exciting! Love hearing good news about you two. 💚 What happened?",
            "Aww! That must feel amazing. Tell me everything — what did they do?",
            "Oh wow, that sounds so sweet. You must be over the moon right now! 😊",
            "I love that for you! This is just the beginning of something great. How are you feeling?",
        ],
        "sad": [
            "That's really painful, and I'm so sorry you're going through this. 💙 Relationships can hurt so deeply.",
            "I hear you. Heartbreak is one of the hardest things to carry. You don't have to pretend you're fine.",
            "That must feel so heavy right now. It's okay to not be okay. What happened, if you feel like sharing?",
            "I'm sorry. Whatever you're feeling right now — it's valid. I'm here with you.",
        ],
        "anxious": [
            "Relationship worries can keep you up at night, I get it. What's making you most anxious about it?",
            "That kind of uncertainty is really hard. What is your gut feeling about the situation?",
            "It's so normal to overthink this stuff. What's the thing you're most scared of right now?",
        ],
        "angry": [
            "That does sound really unfair. Your frustration makes complete sense. What happened?",
            "I'd feel the same way. That's not okay, and you have every right to be upset.",
            "Yeah, that would make me angry too. Do you want to vent about it, or figure out what to do next?",
        ],
        "calm": [
            "That's really nice! Sounds like things are good. How long has this been going on? 😊",
            "Aww, I love hearing that. What do you like most about them?",
        ],
    },
    "studies": {
        "happy": [
            "YES! That's amazing! 🎉 You worked so hard for this — you deserve it! What subject?",
            "Look at you! I knew you could do it! How does it feel to have that off your plate?",
            "That's such a relief, right? All that studying finally paid off! What's next for you?",
        ],
        "sad": [
            "I'm really sorry. One bad result doesn't define you at all — not even close. What happened?",
            "That's tough, and it's okay to be upset about it. Grades can feel so high-stakes. How are you holding up?",
            "Hey, this isn't the end. Seriously. What do you think went wrong — is there anything you can do now?",
        ],
        "anxious": [
            "Exam stress is genuinely awful. Your brain is working overtime right now. What are you most worried about?",
            "That kind of pressure is so real. Have you been able to take any breaks between studying?",
            "One exam at a time. You've gotten through things like this before. What would help you right now?",
        ],
        "tired": [
            "Studying is exhausting and your mind needs rest too. How long have you been at it?",
            "Please don't burn yourself out. Sleep is actually part of studying — your brain needs it.",
        ],
        "angry": [
            "School stuff can be so frustrating, especially when you've put in the work. What's going on?",
            "That sounds really unfair. Is it the grade, or something that happened with a teacher?",
        ],
    },
    "work": {
        "happy": [
            "That's great news! Work wins feel so good, especially when you've been grinding. What happened?",
            "Love it! You deserve recognition for your work. How does your team feel about it?",
            "Congrats! That kind of thing can really boost your motivation. How are you feeling? 🎉",
        ],
        "sad": [
            "Work stuff can really wear you down. I'm sorry you're dealing with that. What's been going on?",
            "That sounds really heavy. A toxic workplace or a bad moment with your boss can shake you for days.",
            "That must have stung. You deserved better than that. How long has this been building up?",
        ],
        "anxious": [
            "Work anxiety is so draining. It follows you everywhere, doesn't it? What's stressing you most right now?",
            "That sounds like a lot of pressure. Are you feeling overwhelmed by the work itself, or something else?",
            "One thing at a time — you don't have to solve it all today. What's the most urgent thing on your mind?",
        ],
        "angry": [
            "Your frustration is completely valid — that sounds really unfair. Was this your boss or a coworker?",
            "I would be upset too. Being treated like that at work is not okay. What do you want to do about it?",
            "That kind of disrespect is infuriating. You deserve a workplace where you feel valued.",
        ],
        "tired": [
            "Work burnout is serious. It creeps up slowly and then hits hard. How long have you been feeling this way?",
            "You've been carrying a lot. It's okay to admit that work is draining you right now.",
        ],
    },
    "family": {
        "happy": [
            "Family moments like that are so special 💚 What made it so nice?",
            "That's really heartwarming. Family can be such a source of joy when things align.",
            "Aww, I love that! What happened?",
        ],
        "sad": [
            "Family pain hits differently — it's supposed to be the safe place. I'm sorry. What's going on?",
            "That sounds really hard. Home should feel safe, and when it doesn't, it's exhausting. How are you doing?",
            "I hear you. Family stuff is complicated and messy. You don't have to figure it all out right now.",
        ],
        "angry": [
            "Family conflict is so emotionally draining because you can't just walk away. What happened?",
            "That sounds infuriating. Family should support you, not make it harder. Are you okay?",
        ],
        "anxious": [
            "Family situations can be really stressful to navigate. What's worrying you most right now?",
        ],
    },
    "achievement": {
        "happy": [
            "OH WOW! 🎉 That's HUGE! You should be so incredibly proud — tell me everything!",
            "YESSS! You worked so hard for this! How are you celebrating?!",
            "This is amazing! You did that! Who was the first person you told?",
            "Look at you!! What an accomplishment. How does it feel to have actually done it? 🌟",
        ],
        "calm": [
            "That's really impressive! You seem so calm about it — you believed in yourself all along 😊",
            "Look at you, achieving things! That's a big deal. What's the next goal?",
        ],
        "tired": [
            "You did it even through the exhaustion. That's actually the hardest kind of success. Be proud of yourself.",
        ],
    },
    "social": {
        "happy": [
            "That sounds like so much fun! Who were you with? 😊",
            "I love that! Good times with good people are the best. What was the highlight?",
            "That sounds amazing — those are the memories you look back on. What happened?",
        ],
        "sad": [
            "Social stuff can be really painful, especially when it involves people you care about. What happened?",
            "I'm sorry. Feeling left out or hurt by friends can be just as painful as anything else.",
        ],
        "lonely": [
            "It can feel really isolating when social situations don't go the way you hoped. I'm here.",
            "Loneliness in a crowd is one of the worst feelings. What happened?",
        ],
    },
    "health": {
        "sad": [
            "Health worries are really scary, and it's okay to feel overwhelmed. Are you getting support?",
            "I'm sorry you're not feeling well 💚 Your body and mind need rest. Are you taking care of yourself?",
        ],
        "anxious": [
            "Health anxiety is so real — the uncertainty is often the worst part. What's worrying you?",
            "It makes complete sense to feel scared about health stuff. Have you been able to talk to a doctor?",
        ],
        "tired": [
            "Your body is telling you something. Please listen to it — rest is not laziness right now.",
            "Being sick or rundown is exhausting. Give yourself full permission to just rest today.",
        ],
    },
}

# ═══════════════════════════════════════════════════════════════════════
# GENERIC EMOTION RESPONSES — Much more empathetic and human
# Used when no specific topic is detected and hosted AI is unavailable
# ═══════════════════════════════════════════════════════════════════════

GENERIC_RESPONSES = {
    "happy": [
        "I can feel the good energy through the screen! 😊 What happened? Tell me everything.",
        "That's so good to hear! What's got you feeling this way?",
        "Love hearing this from you! What's the story?",
        "This made me smile. You deserve good things. What happened?",
    ],
    "sad": [
        "I can hear that you're hurting right now. 💙 I'm right here — you don't have to go through this alone.",
        "That sounds really painful. Thank you for trusting me with this. What's going on?",
        "I'm sorry you're feeling this way. Your feelings make complete sense. Want to talk about it?",
        "Hey, I see you. Whatever you're going through right now, I'm not going anywhere. 💜",
        "That sounds really heavy. It's okay to not be okay. Can you tell me more about what happened?",
    ],
    "anxious": [
        "I can feel the stress in your words. Let's slow down together for a second. 🌊 What's making you most anxious?",
        "That sounds really overwhelming. You don't have to figure it all out right now — one thing at a time.",
        "Anxiety is exhausting. What's the thing your brain keeps coming back to?",
        "I hear you. It's okay to feel scared or worried. What happened?",
        "Your worry is valid. Let's talk through it — sometimes saying it out loud helps. What's going on?",
    ],
    "angry": [
        "Your anger is completely valid right now. Something clearly wasn't right. What happened?",
        "I would feel the same way. That sounds really unfair. Tell me what happened.",
        "It's okay to be angry about this. I'm listening — get it all out.",
        "That sounds infuriating. You deserved better. What's the situation?",
    ],
    "tired": [
        "I can hear how drained you are. You've been carrying a lot. What's been going on?",
        "That kind of exhaustion goes deep. You don't have to keep pushing right now — it's okay to rest.",
        "Being this tired usually means you've been giving too much. What's been weighing on you?",
        "You've been through a lot, haven't you? What can I do to help right now? 💤",
    ],
    "lonely": [
        "I'm really glad you reached out. You're not alone right now — I'm here with you. 💜",
        "That feeling of loneliness is so hard. I want you to know that you matter and you're seen.",
        "Reaching out when you feel alone takes courage. I see you. What's making you feel this way?",
        "I'm here. You're not invisible to me. What's going on?",
    ],
    "calm": [
        "I'm glad you're in a decent headspace. What's on your mind today?",
        "Good to hear from you! What would you like to talk about? 😊",
        "I'm here to chat. What's been going on with you lately?",
        "Hey! How's your day going? What's on your mind?",
    ],
    "hopeful": [
        "That positive energy is contagious! What's got you feeling hopeful? 🌟",
        "I love this side of you! What's the exciting thing ahead?",
        "That's such a great mindset. What are you looking forward to?",
        "You're glowing from here! What's happening? 💪",
    ],
}

# ═══════════════════════════════════════════════════════════════════════
# GREETING PATTERNS
# ═══════════════════════════════════════════════════════════════════════

GREETING_PATTERNS = {"hi", "hey", "hello", "hii", "hiii", "yo", "sup", "heya", "heyy", "hiya"}
HOW_ARE_YOU_PATTERNS = {
    "how are you", "how r u", "how are u", "hows it going", "what's up",
    "whats up", "wassup", "how you doing", "how are you doing",
}

GREETING_RESPONSES = [
    "Hey! 💚 I'm glad you're here. How are you feeling today?",
    "Hi! I'm here and listening. What's on your mind? 🌿",
    "Hello! How's your day going? I'm all yours.",
    "Hey there! 💚 What's going on? Talk to me.",
    "Hi! It's good to see you. What would you like to talk about today?",
]

HOW_ARE_YOU_RESPONSES = [
    "I'm doing great, thanks for asking! More importantly — how are YOU doing? 😊",
    "I'm here and ready to listen! How are you feeling today?",
    "Good, thank you! 💚 But I'd rather hear about you — what's going on?",
]

SHORT_AFFIRM_PATTERNS = {"yes", "yeah", "yep", "yea", "ya", "yup", "mhm", "correct", "right", "true"}
SHORT_DENY_PATTERNS = {"no", "nah", "nope", "not really", "na"}
SHORT_OK_PATTERNS = {"ok", "okay", "k", "fine", "good", "nice", "cool", "great", "alright"}

# ═══════════════════════════════════════════════════════════════════════
# SITUATION-AWARE ADDITIONS
# These add depth on top of topic/emotion responses
# ═══════════════════════════════════════════════════════════════════════

SITUATION_ADDITIONS = {
    "academic_stress": [
        "Academic pressure is so real — your worth is NOT your grades.",
        "School stress can make everything feel high stakes. Remember — this is just one moment.",
    ],
    "work_stress": [
        "Work can really take a toll on your whole wellbeing, not just your time.",
        "Your mental health matters more than any job. Don't forget that.",
    ],
    "relationship_issues": [
        "Whatever happens, you deserve someone who treats you well.",
        "Relationship pain is real pain. Don't let anyone tell you to 'just get over it'.",
    ],
    "loneliness": [
        "Connection is a real human need. You reaching out matters.",
        "Even small moments of being heard can make a difference. I'm here.",
    ],
    "grief": [
        "Grief has no timeline. Be patient and gentle with yourself.",
        "Losing someone is one of the hardest things. I'm so sorry.",
    ],
    "financial_stress": [
        "Financial stress affects everything. You're dealing with a lot.",
        "Money worries don't define you, even when they feel overwhelming.",
    ],
    "health_anxiety": [
        "Health concerns are scary, especially when things feel uncertain.",
        "Taking care of yourself also means acknowledging when you're scared.",
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

    Returns:
        tuple: (reply, actions, needs_hosted_ai)
        needs_hosted_ai = True if message is complex enough for the hosted AI provider
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

    # ─── 2. "HOW ARE YOU" ─────────────────────────────────────────
    for pattern in HOW_ARE_YOU_PATTERNS:
        if pattern in text_lower and is_short:
            return random.choice(HOW_ARE_YOU_RESPONSES), ["mindfulness"], False

    # ─── 3. SHORT AFFIRMATIONS (yes/no/ok) ────────────────────────
    if is_short and (words & SHORT_AFFIRM_PATTERNS or words & SHORT_DENY_PATTERNS or words & SHORT_OK_PATTERNS):
        return _handle_short_response(text_lower, words, history, emotion), EMOTION_ACTIONS.get(emotion, []), False

    # ─── 4. TOPIC-SPECIFIC RESPONSE ───────────────────────────────
    if topics:
        primary_topic = topics[0]
        topic_templates = TOPIC_RESPONSES.get(primary_topic, {})
        emotion_templates = topic_templates.get(emotion, [])

        if emotion_templates and not is_short:
            reply = random.choice(emotion_templates)
            # Maybe append a situation-based addition
            additions = SITUATION_ADDITIONS.get(situation, [])
            if additions and situation != "general" and random.random() > 0.6:
                reply = f"{reply}\n\n{random.choice(additions)}"
            actions = EMOTION_ACTIONS.get(emotion, [])
            return reply, actions, False

    # ─── 5. CHECK IF MESSAGE SHOULD GO TO HOSTED AI ──────────────
    word_count = len(user_message.split())
    conversation_is_going = len(history) >= 4
    has_any_substance = word_count > 2
    is_not_just_ok = not (words & SHORT_OK_PATTERNS or words & SHORT_AFFIRM_PATTERNS or words & SHORT_DENY_PATTERNS)

    needs_hosted_ai = (
        (has_any_substance and is_not_just_ok) or
        (conversation_is_going and word_count > 1) or
        (emotion in ("sad", "lonely", "anxious", "angry") and word_count > 1)
    )

    if needs_hosted_ai:
        # Return a meaningful fallback while the hosted AI responds (or as the response if it fails)
        fallback = _get_empathetic_fallback(emotion, situation, user_message)
        actions = EMOTION_ACTIONS.get(emotion, [])
        return fallback, actions, True

    # ─── 6. GENERIC EMOTION RESPONSE (simple messages) ───────────
    responses = GENERIC_RESPONSES.get(emotion, GENERIC_RESPONSES["calm"])
    reply = random.choice(responses)

    additions = SITUATION_ADDITIONS.get(situation, [])
    if additions and situation != "general" and random.random() > 0.5:
        reply = f"{reply}\n\n{random.choice(additions)}"

    actions = EMOTION_ACTIONS.get(emotion, [])
    return reply, actions, False


def _get_empathetic_fallback(emotion: str, situation: str, user_message: str) -> str:
    """
    Get an empathetic fallback reply when hosted AI is unavailable.

    This is the response the user sees if the hosted AI fails — it must be
    genuinely warm and contextual, not generic filler.
    """
    # Situation-specific fallbacks (better than pure emotion)
    situation_fallbacks = {
        "work_stress": {
            "angry": "That sounds really unfair. Being treated like that at work is not okay — your frustration makes complete sense. What happened?",
            "sad": "Work can really bring you down, especially when you're not being treated well. I'm sorry you're going through this. Want to talk about it?",
            "anxious": "Work anxiety follows you everywhere, doesn't it. What's the thing that's stressing you most right now?",
            "tired": "Work burnout is so real, and it tends to sneak up on you. How long have you been feeling this drained?",
            "_default": "Work stress can affect everything. I'm here — what's been going on?",
        },
        "academic_stress": {
            "anxious": "Exam stress is one of the worst feelings — it's constant and exhausting. What's the subject or situation you're most worried about?",
            "sad": "Academic setbacks hurt, especially when you've put in the work. One result doesn't define you. What happened?",
            "tired": "Study fatigue is very real. Your brain needs rest too. How long have you been grinding?",
            "_default": "School pressure is a lot to carry. What's going on right now?",
        },
        "relationship_issues": {
            "sad": "Relationship pain is some of the deepest pain there is. I'm really sorry you're going through this. Want to talk about what happened?",
            "angry": "Being hurt or disrespected by someone you care about is infuriating. Your feelings are valid. What's the situation?",
            "anxious": "Relationship uncertainty is so hard to sit with. What's worrying you most right now?",
            "_default": "Relationship stuff is complicated and messy. I'm here — what's going on?",
        },
        "grief": {
            "_default": "Grief is one of the heaviest things to carry. I'm so sorry for what you're going through. There's no right way to feel right now.",
        },
        "loneliness": {
            "_default": "Loneliness is such a hard feeling. I'm really glad you reached out — you're not alone right now. What's going on?",
        },
    }

    # Check if we have a situation-specific fallback
    if situation in situation_fallbacks:
        situation_map = situation_fallbacks[situation]
        fallback = situation_map.get(emotion, situation_map.get("_default", ""))
        if fallback:
            return fallback

    # Fall back to emotion-based generic responses
    responses = GENERIC_RESPONSES.get(emotion, GENERIC_RESPONSES["calm"])
    return random.choice(responses)


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
            return random.choice([
                "Tell me more! I'm all ears. 😊",
                "Go ahead, I'm listening. What happened?",
                "I'd love to hear more — take your time.",
                "Okay, I'm here. Tell me everything.",
            ])
        return random.choice([
            "I'm glad to hear that! What else is on your mind? 😊",
            "That's nice! Anything else you'd like to talk about?",
            "Great! I'm here if you want to chat more. 💚",
        ])

    if words & SHORT_DENY_PATTERNS:
        return random.choice([
            "That's totally okay. No pressure at all. 💚 What would you like to talk about?",
            "No worries! I'm here whenever you're ready. Is there something else on your mind?",
            "That's fine. Take your time. I'm here. 😊",
        ])

    # "ok", "fine", "good", etc.
    # Check if "fine" or "good" might be negative in context (e.g., "not good")
    if "not" in text or "not really" in text:
        return random.choice([
            "I can hear that things aren't great right now. Want to talk about it? 💙",
            "It sounds like you might be going through something. I'm here if you want to share.",
            "That's okay — you don't have to be fine. What's actually going on?",
        ])

    return random.choice([
        "I'm glad! 😊 What else is going on?",
        "Good to hear! Anything on your mind you'd like to chat about?",
        "That's great! Tell me more about your day if you like. 💚",
        "Glad you're okay! What's on your mind?",
    ])
