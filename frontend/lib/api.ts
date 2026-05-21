import type { Identity, RoomSnapshot } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    }
  });

  if (!response.ok) {
    let message = "Request failed.";
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export function createIdentity(displayName: string, email?: string) {
  return request<Identity>("/api/identity", {
    method: "POST",
    body: JSON.stringify({ display_name: displayName, email })
  });
}

export function createRoom(hostUserId: string, title: string, challengePrompt: string) {
  return request<RoomSnapshot>("/api/rooms", {
    method: "POST",
    body: JSON.stringify({ host_user_id: hostUserId, title, challenge_prompt: challengePrompt })
  });
}

export function joinRoom(code: string, userId: string) {
  return request<RoomSnapshot>(`/api/rooms/${code.trim().toUpperCase()}/join`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId })
  });
}

export function getRoom(code: string) {
  return request<RoomSnapshot>(`/api/rooms/${code.trim().toUpperCase()}`);
}

export function startRound(roomId: string, hostUserId: string) {
  return request<RoomSnapshot>(`/api/rooms/${roomId}/rounds/start`, {
    method: "POST",
    body: JSON.stringify({ host_user_id: hostUserId })
  });
}

export function submitPrompt(roundId: string, userId: string, prompt: string) {
  return request(`/api/rounds/${roundId}/submissions`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId, prompt })
  });
}

export function scoreSubmission(
  submissionId: string,
  hostUserId: string,
  score: number,
  decision: string,
  comment?: string
) {
  return request<RoomSnapshot>(`/api/submissions/${submissionId}/score`, {
    method: "POST",
    body: JSON.stringify({ host_user_id: hostUserId, score, decision, comment })
  });
}

export function retryGenerationJob(jobId: string, userId: string) {
  return request<RoomSnapshot>(`/api/generation-jobs/${jobId}/retry`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId })
  });
}

export const WS_BASE = process.env.NEXT_PUBLIC_WS_BASE_URL || "ws://localhost:8000";
