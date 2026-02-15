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
    default: "FantaMusiké - Dimostra di essere il miglior Talent Scout della scena musicale!",
    template: "%s | FantaMusiké",
  },
  description: "Crea la tua squadra, scala le classifiche e ottieni le prime MysteryBox della musica italiana!",
  keywords: ["fantamusica", "musica italiana", "talent scout", "gaming", "scommesse musicali", "mysterybox", "fantasanremo", "sanremo"],
  authors: [{ name: "MusiKé" }],
  openGraph: {
    title: "FantaMusiké - Dimostra di essere il miglior Talent Scout della scena musicale!",
    description: "Crea la tua squadra e scala le classifiche.",
    url: "https://fanta.musike.fm",
    siteName: "FantaMusiké",
    locale: "it_IT",
    type: "website",
    images: [
      {
        url: "/landing_boxes.png", // Or a dedicated OG image if available
        width: 1200,
        height: 630,
        alt: "FantaMusiké Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FantaMusiké",
    description: "Crea la tua squadra e scala le classifiche.",
    images: ["/landing_boxes.png"],
  },
  icons: {
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
