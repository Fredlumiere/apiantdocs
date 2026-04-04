import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ChatPanel } from "@/components/chat-panel";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "APIANT Docs",
  description: "Documentation for APIANT — the AI-first integration platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        style={{
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
        }}
      >
        {children}
        <ChatPanel />
      </body>
    </html>
  );
}
