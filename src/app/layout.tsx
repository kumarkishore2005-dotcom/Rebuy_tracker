
'use client';
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { GameProvider } from "@/contexts/game-context";

const fontBody = Inter({ subsets: ["latin"], variable: "--font-body" });
const fontHeadline = Space_Grotesk({ subsets: ["latin"], variable: "--font-headline" });

// Note: Metadata export is not supported in client components.
// If you need to set metadata, consider moving it to a server component parent layout
// or handle it on a per-page basis. For now, it's commented out to allow 'use client'.
//
// export const metadata: Metadata = {
//   title: "Rebuy Tracker",
//   description: "Track poker re-buys with ease.",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Rebuy Tracker</title>
        <meta name="description" content="Track poker re-buys with ease." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased", fontBody.variable, fontHeadline.variable)} suppressHydrationWarning>
        <GameProvider>
          {children}
          <Toaster />
        </GameProvider>
      </body>
    </html>
  );
}
