// frontend/services/companion.service.ts

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

export interface ChatRequest {
  message: string;
  mood?: string;        // optional user-selected mood
  timestamp?: string;
}

export interface ChatResponse {
  reply: string;
  emotion: string;
  confidence: number;
  actions?: string[];   // breathing, reflection, music, etc.
}

export async function sendMessageToCompanion(
  data: ChatRequest
): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to get response from companion");
    }

    return await response.json();
  } catch (error) {
    console.error("Companion Service Error:", error);
    throw error;
  }
}
