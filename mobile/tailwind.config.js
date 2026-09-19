/**
 * Color values are hex/rgba equivalents of the web app's HSL design tokens
 * (src/app/globals.css :root, tailwind.config.ts) - flattened because RN
 * can't resolve CSS custom properties like `hsl(var(--background))`.
 */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        border: "#301C28",
        input: "#181115",
        ring: "#E1339E",
        background: "#0B0710",
        foreground: "#FAFAFA",
        primary: {
          DEFAULT: "#FF5A36",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#261C20",
          foreground: "#E5E5E5",
        },
        destructive: {
          DEFAULT: "#EF4343",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#2B2225",
          foreground: "#9C8B92",
        },
        accent: {
          DEFAULT: "#43142F",
          foreground: "#F3AFD9",
        },
        card: {
          DEFAULT: "#201318",
          foreground: "#FAFAFA",
        },
        brand: {
          start: "#FF5A36",
          mid: "#E0339E",
          end: "#8B5CF6",
        },
      },
      borderRadius: {
        lg: 16,
        md: 14,
        sm: 12,
        xl: 20,
        "2xl": 24,
      },
    },
  },
  plugins: [],
};
