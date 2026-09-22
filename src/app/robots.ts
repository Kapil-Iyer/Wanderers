import type { MetadataRoute } from "next";

/**
 * Keeps crawlers on the marketing page and out of the signed-in app. None of
 * the authenticated routes render anything useful to a bot (they redirect or
 * return null until a session resolves), and chat URLs contain bubble ids.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/chat/",
        "/home",
        "/messages",
        "/my-bubbles",
        "/profile",
        "/onboarding",
        "/map",
        "/auth/",
        "/change-password",
        "/reset-password",
      ],
    },
  };
}
