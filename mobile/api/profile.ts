import { fetchApi } from "@/api/client";

export type UpdateProfilePayload = {
  vibe?: string | null;
  interests?: string[];
  personality_traits?: string[];
};

export function updateProfile(payload: UpdateProfilePayload) {
  return fetchApi<{ success: boolean; data?: unknown; error?: string }>("/api/profile", {
    method: "PATCH",
    body: payload,
  });
}
