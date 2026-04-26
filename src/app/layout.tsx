import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ChatPanel } from "@/components/chat-panel";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";
import "@/styles/gallery.css";

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
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);var w=localStorage.getItem('sidebar-width');if(w&&!isNaN(+w)&&+w>=180&&+w<=600)document.documentElement.style.setProperty('--sidebar-width',w+'px')}catch(e){}})();`,
          }}
        />
      </head>
      <body
        style={{
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
        }}
      >
        <AuthProvider>
          <a href="#main-content" className="skip-to-content">Skip to content</a>
          {children}
          <ChatPanel />
        </AuthProvider>
      </body>
    </html>
  );
}
