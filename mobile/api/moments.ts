import { supabase } from "@/lib/supabase";
import { fetchApi, ApiError } from "@/api/client";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export type Moment = {
  id: string;
  bubble_id: string | null;
  user_id: string | null;
  cloudinary_url: string | null;
  image_url?: string | null;
  caption: string | null;
  created_at: string;
  activity?: string;
  zone?: string | null;
  username?: string;
  user_avatar?: string;
};

export function listMoments() {
  return fetchApi<{ success: boolean; data: Moment[]; error?: string }>("/api/moments");
}

/**
 * Uploads a Wander Moment (photo optional - caption-only is allowed, same as
 * web). Goes around fetchApi since that always sends JSON - a multipart body
 * needs its own fetch call with no Content-Type set (fetch/RN fills in the
 * correct multipart boundary automatically; setting it manually breaks it).
 */
export async function uploadMoment(
  bubbleId: string,
  caption: string,
  photo?: { uri: string; name: string; type: string }
) {
  if (!BASE_URL) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not set - see mobile/.env.example");
  }

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const formData = new FormData();
  formData.append("bubble_id", bubbleId);
  formData.append("caption", caption);
  if (photo) {
    // RN's fetch/FormData polyfill expects this {uri, name, type} shape for files.
    formData.append("photo", photo as unknown as Blob);
  }

  const res = await fetch(`${BASE_URL}/api/moments`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new ApiError((json && json.error) || `Request failed (${res.status})`, res.status);
  }
  return json as { success: true; data: Moment };
}
