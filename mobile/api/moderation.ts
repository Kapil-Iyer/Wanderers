import { fetchApi } from "@/api/client";

export function reportContent(
  targetType: "message" | "photo" | "user",
  targetId: string,
  reason?: string
) {
  return fetchApi<{ success: boolean; error?: string }>("/api/reports", {
    method: "POST",
    body: { target_type: targetType, target_id: targetId, reason },
  });
}

export function blockUser(userId: string) {
  return fetchApi<{ success: boolean; error?: string }>(`/api/blocks/${userId}`, {
    method: "POST",
  });
}

export function unblockUser(userId: string) {
  return fetchApi<{ success: boolean; error?: string }>(`/api/blocks/${userId}`, {
    method: "DELETE",
  });
}

export function listBlockedUserIds() {
  return fetchApi<{ success: boolean; data: string[] }>("/api/blocks");
}
