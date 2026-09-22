import bundleAnalyzer from "@next/bundle-analyzer";

/**
 * Baseline response headers. Deliberately conservative: no
 * Content-Security-Policy yet, because the app loads Google Maps, Google
 * Fonts, Supabase, and Cloudinary, and a CSP written without being able to
 * watch a real session tends to break one of them silently.
 *
 * The four below carry no such risk.
 */
const securityHeaders = [
  // Don't let browsers second-guess our content types.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // No reason for any page here to be framed.
  { key: "X-Frame-Options", value: "DENY" },
  // Send the origin but not the full path to third parties.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing in the app uses these.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@react-google-maps/api", "gsap", "@gsap/react"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// Inspect what is actually in the bundle with `npm run analyze`. Off unless
// ANALYZE=true, so normal and production builds are unaffected.
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

export default withBundleAnalyzer(nextConfig);
