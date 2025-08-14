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
  title: "PIIxelate - AI-Powered Privacy Protection",
  description: "Protect your personal information with AI-powered pixelation technology. Automatically detect and blur PII in images.",
  keywords: ["privacy", "PII", "pixelation", "AI", "security", "image processing"],
  authors: [{ name: "PIIxelate Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    title: "PIIxelate - AI-Powered Privacy Protection",
    description: "Protect your personal information with AI-powered pixelation technology",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
