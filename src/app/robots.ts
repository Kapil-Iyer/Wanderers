import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/home",
          "/map",
          "/messages",
          "/my-bubbles",
          "/profile",
          "/chat/",
          "/onboarding",
          "/auth/",
          "/change-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: "https://www.wanderers.space/sitemap.xml",
  };
}
