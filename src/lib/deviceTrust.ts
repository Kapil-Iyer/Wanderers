/**
 * Signed "remember this device" cookie — skips OTP for 7 days after a
 * successful OTP (or trusted password login).
 */

import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";

export const DEVICE_TRUST_COOKIE = "wanderers_device_trust";
export const DEVICE_TRUST_DAYS = 7;
export const DEVICE_TRUST_MAX_AGE = DEVICE_TRUST_DAYS * 24 * 60 * 60; // seconds

type TrustPayload = {
  e: string; // email
  u: string; // user id
  exp: number; // unix ms
};

function signingSecret(): string {
  return (
    process.env.DEVICE_TRUST_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "wanderers-dev-device-trust"
  );
}

function b64url(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

function sign(payloadB64: string): string {
  return b64url(createHmac("sha256", signingSecret()).update(payloadB64).digest());
}

export function createDeviceTrustToken(email: string, userId: string): string {
  const payload: TrustPayload = {
    e: email.trim().toLowerCase(),
    u: userId,
    exp: Date.now() + DEVICE_TRUST_MAX_AGE * 1000,
  };
  const payloadB64 = b64url(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function parseDeviceTrustToken(
  token: string | undefined | null
): TrustPayload | null {
  if (!token || typeof token !== "string") return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  const expected = sign(payloadB64);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(fromB64url(payloadB64).toString("utf8")) as TrustPayload;
    if (!payload?.e || !payload?.u || !payload?.exp) return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function readDeviceTrust(request: NextRequest): TrustPayload | null {
  return parseDeviceTrustToken(request.cookies.get(DEVICE_TRUST_COOKIE)?.value);
}

export function isDeviceTrustedForEmail(
  request: NextRequest,
  email: string,
  userId?: string
): boolean {
  const trust = readDeviceTrust(request);
  if (!trust) return false;
  if (trust.e !== email.trim().toLowerCase()) return false;
  if (userId && trust.u !== userId) return false;
  return true;
}

export function setDeviceTrustCookie(
  response: NextResponse,
  email: string,
  userId: string
): void {
  const token = createDeviceTrustToken(email, userId);
  response.cookies.set(DEVICE_TRUST_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DEVICE_TRUST_MAX_AGE,
  });
}

export function clearDeviceTrustCookie(response: NextResponse): void {
  response.cookies.set(DEVICE_TRUST_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
