import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

const DESCRIPTION =
  "Wanderers is a campus social app for University of Waterloo students - discover and join real-time activities, chat, meet up, and capture moments together.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.wanderers.space"),
  title: {
    default: "Wanderers",
    template: "%s · Wanderers",
  },
  description: DESCRIPTION,
  openGraph: {
    title: "Wanderers",
    description: DESCRIPTION,
    siteName: "Wanderers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wanderers",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
