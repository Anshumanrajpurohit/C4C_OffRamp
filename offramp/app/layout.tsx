import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Plant-Based Swap Guide",
  description: "Guided flow to discover vegan swaps and personal impact.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,600,0,0"
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${sans.variable} ${mono.variable} antialiased bg-[#f7f3ee] text-[#131614]`}
      >
        {children}
      </body>
    </html>
  );
}
