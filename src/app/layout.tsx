import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import PlexusBackground from "@/components/PlexusBackground";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wanderers",
  description: "Find your people. Start something.",
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
        <PlexusBackground />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
