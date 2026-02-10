// frontend/services/safety.service.ts

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

export interface SafetyRequest {
  text: string;
}

export interface SafetyResponse {
  riskLevel: "low" | "medium" | "high";
  flags: string[];        // self-harm, hopelessness, isolation
  recommendation?: string;
}

export async function checkSafety(
  data: SafetyRequest
): Promise<SafetyResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/safety/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Safety check failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Safety Service Error:", error);
    throw error;
  }
}
