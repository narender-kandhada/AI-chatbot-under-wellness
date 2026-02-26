"""Quick test script to verify emotion detection and decision engine."""
import sys
sys.path.insert(0, ".")

from app.ml.emotion_model import predict_emotion
from app.ml.decision_engine import decide_response

print("=== Emotion Detection Tests ===")
tests = [
    ("not good", "sad"),
    ("not good at all", "sad"),
    ("I am not good today", "sad"),
    ("I had a really bad day at work today, my boss yelled at me", "angry"),
    ("not feeling well", "sad"),
    ("I am so happy today", "happy"),
    ("feeling anxious about my exam", "anxious"),
    ("hi", "calm"),
    ("you are very boring someone told you that", "angry"),
    ("I want to talk about my family", "calm"),
]

all_pass = True
for text, expected in tests:
    emotion, conf = predict_emotion(text)
    ok = "PASS" if emotion in expected else "FAIL"
    if emotion not in expected:
        all_pass = False
    print(f"  [{ok}] [{emotion} {conf:.0%}] \"{text}\" (expected: {expected})")

print()
print("=== Decision Engine Response Tests ===")
response_tests = [
    ("not good", "sad", "general"),
    ("I am not good today", "sad", "general"),
    ("bad day at work, boss yelled at me", "angry", "work_stress"),
    ("I feel really sad and anxious today, everything is falling apart", "sad", "general"),
    ("hi", "calm", "general"),
    ("how are you", "calm", "general"),
]

for msg, emotion, situation in response_tests:
    reply, actions, needs_gemini = decide_response(emotion=emotion, situation=situation, user_message=msg)
    print(f'  [{emotion}] "{msg}"')
    print(f"    -> {reply[:120]}")
    print(f"    -> needs_gemini={needs_gemini}")
    print()

status = "ALL PASS" if all_pass else "SOME EMOTION TESTS FAILED"
print(f"Tests complete. {status}")
