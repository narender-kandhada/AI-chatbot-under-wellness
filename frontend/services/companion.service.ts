// frontend/services/companion.service.ts

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "1",
};

export interface HistoryMessage {
  role: "user" | "ai";
  text: string;
}

export interface ChatRequest {
  message: string;
  mood?: string;
  session_id?: string;
  history?: HistoryMessage[];
}

export interface ChatResponse {
  reply: string;
  emotion: string;
  confidence: number;
  actions?: string[];
  source?: string;  // "smart_templates" or "gemini"
}

export async function sendMessageToCompanion(
  data: ChatRequest
): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/`, {
      method: "POST",
      headers: DEFAULT_HEADERS,
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

export async function checkBackendConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      headers: DEFAULT_HEADERS,
    });

    if (!response.ok) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

console.log("API_BASE_URL:", API_BASE_URL);