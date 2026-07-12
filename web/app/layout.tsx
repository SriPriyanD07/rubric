import type { Metadata } from "next";
import Link from "next/link";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ReviewProvider } from "@/lib/context";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "Rubric — Know your hackathon score before the judges do",
  description: "AI-powered rubric pipeline to evaluate deck claims and visually fact-check live sites for hackathon submissions.",
};

import DotField from "@/components/ui/DotField";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-neutral-950 text-neutral-50 selection:bg-primary selection:text-primary-foreground relative"
        suppressHydrationWarning
      >
        {/* Global ambient dot field background */}
        <div className="fixed inset-0 w-full h-full z-[-1] pointer-events-auto">
          <DotField
            dotRadius={3.8}
            dotSpacing={16}
            bulgeStrength={60}
            glowRadius={180}
            gradientFrom="rgba(168, 85, 247, 0.35)"
            gradientTo="rgba(168, 85, 247, 0.15)"
            glowColor="#0A0A0F"
          />
        </div>

        <ReviewProvider>
          {/* Global Branding Navigation Header */}
          <header className="relative z-50 w-full max-w-[1600px] mx-auto px-4 md:px-8 py-6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#A855F7] to-[#4F46E5] flex items-center justify-center font-heading font-bold text-black text-base transition-transform group-hover:scale-105">
                R
              </div>
              <span className="font-heading font-bold text-xl text-[#F2F1ED] tracking-wide transition-colors group-hover:text-[#A855F7]">
                Rubrics
              </span>
            </Link>
            
            <nav className="flex items-center gap-6 font-mono text-xs font-bold uppercase tracking-wider">
              <Link href="/submit" className="text-[#9C9B96] hover:text-[#A855F7] transition-colors">
                Run Review
              </Link>
              <a 
                href="https://sripriyand-portfolio.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#9C9B96] hover:text-[#A855F7] transition-colors hidden sm:inline"
              >
                Portfolio
              </a>
            </nav>
          </header>

          {children}
        </ReviewProvider>
      </body>
    </html>
  );
}
