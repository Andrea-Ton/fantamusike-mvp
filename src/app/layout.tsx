import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleTagManager } from '@next/third-parties/google';
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
  metadataBase: new URL("https://fanta.musike.fm"),
  title: {
    default: "FantaMusiké - Il Fantasy Game della musica",
    template: "%s | FantaMusiké",
  },
  description: "Scova talenti, crea la tua etichetta musicale e scala la classifica. Entra nel gioco che sta rivoluzionando la musica!",
  keywords: ["fantamusica", "musica italiana", "talent scout", "gaming", "scommesse musicali", "mysterybox", "fantasanremo", "sanremo"],
  authors: [{ name: "MusiKé" }],
  other: {
    "thumbnail": "https://fanta.musike.fm/landing_boxes.png",
  },
  openGraph: {
    title: "FantaMusiké - Il Fantasy Game della musica",
    description: "Scova talenti, crea la tua etichetta musicale e scala la classifica. Entra nel gioco che sta rivoluzionando la musica!",
    url: "https://fanta.musike.fm",
    siteName: "FantaMusiké",
    locale: "it_IT",
    type: "website",
    images: [
      {
        url: "/landing_boxes.png",
        width: 1200,
        height: 630,
        alt: "FantaMusiké Preview",
      },
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "FantaMusiké Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FantaMusiké",
    description: "Crea la tua etichetta, scova talenti e scala la classifica.",
    images: ["/landing_boxes.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/ios-icon.png",
  },
  alternates: {
    canonical: "https://fanta.musike.fm",
  },
};

import CookieBanner from "@/components/cookie-banner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://Schema.org",
              "@type": "WebSite",
              "name": "FantaMusiké",
              "url": "https://fanta.musike.fm",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://fanta.musike.fm/dashboard/talent?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'analytics_storage': 'denied'
              });
            `,
          }}
        />
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
        )}
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
