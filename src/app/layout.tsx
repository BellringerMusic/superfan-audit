import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Superfan Audit | Free Artist Audience Intelligence Report",
  description: "Discover who your superfans really are. Get a free personalized report analyzing your online presence, audience engagement, and monetization potential.",
  openGraph: {
    title: "Superfan Audit | Free Artist Audience Intelligence Report",
    description: "Discover who your superfans really are. Get a free personalized report.",
    url: "https://superfanaudit.com",
    siteName: "Superfan Audit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Superfan Audit | Free Artist Audience Intelligence Report",
    description: "Discover who your superfans really are. Get a free personalized report.",
  },
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
      <body className="min-h-full flex flex-col bg-[#0A0A0F] text-[#E5E5E5]">
        {children}
      </body>
    </html>
  );
}
