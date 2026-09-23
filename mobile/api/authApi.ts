import { fetchApi } from "@/api/client";
import type { Session, User } from "@supabase/supabase-js";

type AuthSuccess = {
  success: true;
  session?: Session;
  user?: User;
  requiresOtp?: boolean;
  skippedOtp?: boolean;
  isOwner?: boolean;
};
type AuthFailure = { success: false; error: string };
export type AuthResponse = AuthSuccess | AuthFailure;

export function signup(email: string, password: string, name?: string) {
  return fetchApi<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: { email, password, name },
    auth: false,
  });
}

export function login(email: string, password: string, rememberDevice = false) {
  return fetchApi<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password, rememberDevice },
    auth: false,
  });
}

export function verifyOtp(email: string, token: string, rememberDevice = false) {
  return fetchApi<AuthResponse>("/api/auth/verify", {
    method: "POST",
    body: { email, token, rememberDevice },
    auth: false,
  });
}

export function forgotPassword(email: string) {
  return fetchApi<AuthResponse>("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
    auth: false,
  });
}

export function deleteAccount() {
  return fetchApi<{ success: boolean; error?: string }>("/api/account", {
    method: "DELETE",
  });
}
