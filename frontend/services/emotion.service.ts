// frontend/services/emotion.service.ts

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

export interface EmotionRequest {
  text: string;
}

export interface EmotionResponse {
  sentiment: "positive" | "neutral" | "negative";
  emotion: string;          // sad, anxious, calm, etc.
  confidence: number;
}

export async function analyzeEmotion(
  data: EmotionRequest
): Promise<EmotionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/emotion/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Emotion analysis failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Emotion Service Error:", error);
    throw error;
  }
}
