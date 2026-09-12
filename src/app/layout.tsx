import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { SessionProvider } from "@/components/SessionProvider";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AdStudio — Product Advertisement Platform for Video Creators",
    template: "%s | AdStudio",
  },
  description:
    "Connect brands with talented video creators. Influencers apply for free product samples, create authentic ad videos, and earn commission. Brands get real content.",
  openGraph: {
    type: "website",
    siteName: "AdStudio",
    images: [
      {
        url: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "AdStudio — Product Advertisement Platform",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
