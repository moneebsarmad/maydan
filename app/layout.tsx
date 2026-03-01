import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const sansFont = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Maydan",
    template: "%s | Maydan",
  },
  description: "School event management for BHA Prep.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sansFont.variable} ${displayFont.variable} min-h-screen bg-stone-50 text-slate-950`}
      >
        {children}
      </body>
    </html>
  );
}
