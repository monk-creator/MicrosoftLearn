import type { GuideState, RecommendationPayload } from "./guideEngine";

export interface RemoteGuideResponse {
  assistantText: string;
  nextState: GuideState;
  kind: "ok" | "clarify" | "oos" | "escalate";
  recommendation?: RecommendationPayload;
}

function getApiBase(): string {
  const configured = import.meta.env.VITE_GUIDE_API_BASE as string | undefined;
  return configured?.trim() || "";
}

export async function askRemoteGuide(message: string, state: GuideState): Promise<RemoteGuideResponse> {
  const base = getApiBase();
  if (!base) {
    throw new Error("VITE_GUIDE_API_BASE not configured");
  }

  const res = await fetch(`${base.replace(/\/$/, "")}/api/guide/answer`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, state }),
  });

  if (!res.ok) {
    throw new Error(`Remote guide failed: ${res.status}`);
  }

  return (await res.json()) as RemoteGuideResponse;
}

