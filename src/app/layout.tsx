import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ChatPanel } from "@/components/chat-panel";
import { AuthProvider } from "@/components/auth-provider";
import { isApiantAiSite } from "@/lib/site";
import {
  APIANT_AI_CSS,
  APIANT_AI_FONTS_URL,
  APIANT_AI_ICONS,
  APIANT_AI_THEME_COLOR,
} from "@/lib/apiant-ai-brand";
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

// Shared APIANT GA4 property. apiant.com reports into this same property, so the
// docs subdomain rolls up with the marketing site instead of a separate one.
// The apiant.ai docs zone reports into apiant.ai's own property (the one
// apiant.ai's pages load), keeping the same consent-denied bootstrap below.
const GA_MEASUREMENT_ID = isApiantAiSite() ? "G-H3NKMZB63S" : "G-G902ZQ3PZZ";

export const metadata: Metadata = isApiantAiSite()
  ? {
      metadataBase: new URL("https://apiant.ai"),
      title: "APIANT.ai Docs",
      description: "Documentation for APIANT.ai, the AI-first integration platform",
      icons: APIANT_AI_ICONS,
    }
  : {
      title: "APIANT Docs",
      description: "Documentation for APIANT — the AI-first integration platform",
    };

// apiant.ai's theme-color. Classic exports no viewport fields, so Next keeps
// its default viewport tag there.
export const viewport: Viewport = isApiantAiSite() ? { themeColor: APIANT_AI_THEME_COLOR } : {};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiantAi = isApiantAiSite();

  // Google tag (gtag.js). Mirrors the Consent Mode v2 bootstrap that apiant.com
  // loads from /js/gtag-consent.js: every storage type starts denied, so Google
  // receives only cookieless modeled pings until a consent banner promotes it
  // with gtag('consent','update',...). This subdomain has no banner yet, so
  // measurement stays cookieless. Adding one is a separate decision.
  //
  // The loader is appended from inside this block rather than written as
  // <script async src>, because React hoists async scripts above the inline
  // ones and a cached gtag.js can then execute before the consent defaults are
  // queued. Appending it here keeps "defaults first" guaranteed, and the
  // googletagmanager.com URL still appears in the server HTML.
  const googleTag = (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){var g='${GA_MEASUREMENT_ID}';window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments)}window.gtag=gtag;gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'denied',personalization_storage:'denied',security_storage:'granted',wait_for_update:500});gtag('set','url_passthrough',true);gtag('set','ads_data_redaction',true);var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+g;document.head.appendChild(s);gtag('js',new Date());gtag('config',g,{anonymize_ip:true})})();`,
      }}
    />
  );

  return (
    <html
      lang="en"
      data-theme="dark"
      {...(apiantAi ? { "data-site": "apiant-ai" } : {})}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {apiantAi ? (
        <head>
          {/* apiant.ai's fonts and theme (src/lib/apiant-ai-brand.ts). The
              zone is dark only and its sidebar has a fixed width, so the
              classic theme and sidebar-width restore script is not loaded. */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="stylesheet" href={APIANT_AI_FONTS_URL} />
          <style dangerouslySetInnerHTML={{ __html: APIANT_AI_CSS }} />
          {googleTag}
        </head>
      ) : (
        // Classic: exactly the two scripts it had before site modes.
        <head>
          {googleTag}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);var w=localStorage.getItem('sidebar-width');if(w&&!isNaN(+w)&&+w>=180&&+w<=600)document.documentElement.style.setProperty('--sidebar-width',w+'px')}catch(e){}})();`,
            }}
          />
        </head>
      )}
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
