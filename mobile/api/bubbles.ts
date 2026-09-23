import { fetchApi } from "@/api/client";

export type MyBubble = {
  id: string;
  activity: string | null;
  zone: string | null;
  emoji: string | null;
  start_time: string | null;
  duration_minutes: number | null;
  max_members: number | null;
  status: string | null;
  expires_at: string | null;
  creator_id: string | null;
  members_count: number;
  starred: boolean;
};

export function myBubbles() {
  return fetchApi<{ success: boolean; data: MyBubble[]; error?: string }>(
    "/api/bubbles/mine"
  );
}

export type ListBubble = {
  id: string;
  creator_id: string | null;
  activity: string | null;
  zone: string | null;
  exact_location: string | null;
  emoji: string | null;
  description: string | null;
  time_window: string | null;
  start_time: string | null;
  duration_minutes: number | null;
  max_members: number | null;
  status: string | null;
  expires_at: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string | null;
  creator_name: string | null;
  members_count: number;
};

export function listBubbles() {
  return fetchApi<{ success: boolean; data: ListBubble[]; error?: string }>(
    "/api/bubbles/list"
  );
}

export type BubbleMessage = {
  id: string;
  bubble_id: string;
  user_id: string;
  content: string;
  created_at: string;
  sender_name: string;
  sender_avatar: string;
};

export function bubbleMessages(bubbleId: string) {
  return fetchApi<{ success: boolean; data: BubbleMessage[]; members_count: number; error?: string }>(
    `/api/bubbles/${bubbleId}/messages`
  );
}

export function sendBubbleMessage(bubbleId: string, content: string) {
  return fetchApi<{ success: boolean; data: BubbleMessage; members_count: number; error?: string }>(
    `/api/bubbles/${bubbleId}/messages`,
    { method: "POST", body: { content } }
  );
}

export type CreateBubblePayload = {
  activity: string;
  zone: string;
  duration_minutes?: number;
  max_members?: number;
  description?: string;
  emoji?: string;
};

export function createBubble(payload: CreateBubblePayload) {
  return fetchApi<{ success: boolean; data: MyBubble; error?: string }>("/api/bubbles", {
    method: "POST",
    body: payload,
  });
}

export function joinBubble(bubbleId: string) {
  return fetchApi<{ success: boolean; data: { members_count: number; already_member?: boolean }; error?: string }>(
    "/api/bubbles/join",
    { method: "POST", body: { bubble_id: bubbleId } }
  );
}

export function starBubble(bubbleId: string) {
  return fetchApi<{ success: boolean; error?: string }>(`/api/bubbles/${bubbleId}/star`, { method: "POST" });
}

export function unstarBubble(bubbleId: string) {
  return fetchApi<{ success: boolean; error?: string }>(`/api/bubbles/${bubbleId}/star`, { method: "DELETE" });
}

/** End event - marks the bubble expired. No photo logic; pair with uploadMoment (api/moments.ts) for the Wander Moment itself. */
export function confirmBubble(bubbleId: string) {
  return fetchApi<{ success: boolean; error?: string }>(`/api/bubbles/${bubbleId}/confirm`, { method: "POST" });
}
