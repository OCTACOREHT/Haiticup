import type { Metadata } from "next";
import { Rajdhani, Teko } from "next/font/google";
import "./globals.css";

const sportSans = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sport-sans",
  display: "swap",
});

const sportDisplay = Teko({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-sport-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gran Panpan Haiti Cup 2026",
  description:
    "Official page for the 2026 Gran Panpan Haiti Cup. Professional tournament details, registration timeline, prizes, and contact.",
  keywords: [
    "Gran Panpan Haiti Cup",
    "football tournament",
    "soccer championship",
    "Haiti cup 2026",
    "team registration",
  ],
  authors: [{ name: "Gran Panpan Haiti Cup" }],
  openGraph: {
    title: "Gran Panpan Haiti Cup 2026",
    description:
      "Compete in a professionally organized international football championship.",
    type: "website",
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
      data-scroll-behavior="smooth"
      className={`${sportSans.variable} ${sportDisplay.variable} antialiased`}
    >
      <body className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
        {children}
      </body>
    </html>
  );
}
