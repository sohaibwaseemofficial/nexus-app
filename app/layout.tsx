import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nexus — The Intent-Driven Information Engine",
  description:
    "Your information streams. One question. Zero noise. Nexus uses AI to transform hundreds of information items into a single, calm narrative briefing.",
  keywords: ["information overload", "AI briefing", "productivity", "focus", "nexus"],
  openGraph: {
    title: "Nexus — One question. Zero noise.",
    description: "AI-powered information briefing that filters by your personal intention.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070b14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#070b14]">{children}</body>
    </html>
  );
}
