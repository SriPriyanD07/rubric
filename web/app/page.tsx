"use client";

import React from "react";
import Link from "next/link";
import Ribbons from "@/components/ui/Ribbons";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col items-center select-none font-sans">
      
      {/* ── HERO SECTION ───────────────────── */}
      <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center px-4 md:px-8 py-16">
        
        {/* Hero container */}
        <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-12 py-12">
          
          {/* Left Column: Heading, Subtext, & CTA */}
          <div className="lg:w-1/2 w-full text-left space-y-8 flex flex-col justify-center">
            <div className="space-y-4">
              <div className="inline-block">
                <span className="text-[10px] font-mono font-bold text-[#A855F7] uppercase tracking-widest bg-[#A855F7]/10 py-1.5 px-4 rounded-full border border-[#A855F7]/20">
                  Next-Gen Hackathon Analytics
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold leading-[1.1] tracking-tight text-[#F2F1ED]">
                Know your score <br />
                <span className="text-[#A855F7]">before the judges do.</span>
              </h1>
              
              <p className="text-base sm:text-lg text-[#9C9B96] font-normal max-w-xl leading-relaxed font-sans">
                Evaluate your hackathon submission against real criteria using AI claim validation and visual live-site consistency checks.
              </p>
            </div>

            <div className="relative flex items-center pt-4 min-h-[140px] w-full max-w-sm">
              {/* Constrained Ribbons container behind the button */}
              <div className="absolute -left-10 h-[160px] w-[320px] pointer-events-none overflow-hidden z-0 opacity-40 rounded-2xl">
                <Ribbons
                  colors={["#A855F7", "#C084FC", "#E9D5FF"]}
                  baseSpring={0.06}
                  baseFriction={0.88}
                  baseThickness={12}
                  pointCount={60}
                  maxAge={450}
                  enableFade={true}
                />
              </div>

              {/* Action Button */}
              <Link href="/submit" className="relative z-10">
                <Button className="h-12 px-8 text-sm font-bold bg-[#A855F7] hover:bg-[#9333EA] text-black hover:text-white rounded-xl transition-all shadow-[0_0_25px_rgba(168,85,247,0.35)] hover:shadow-[0_0_35px_rgba(168,85,247,0.55)] border-0">
                  Score my submission
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: High fidelity dashboard preview mockup card */}
          <div className="lg:w-1/2 w-full">
            <Card className="bg-[#131318]/50 backdrop-blur-xl border border-[#232329]/80 shadow-2xl p-6 md:p-8 rounded-3xl space-y-6 hover:border-[#A855F7]/20 transition-all duration-300">
              <div className="flex items-center justify-between border-b border-[#232329]/50 pb-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-500/80" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <span className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-[10px] font-mono text-[#9C9B96]/60">Rubric Pipeline Preview</span>
              </div>

              <div className="space-y-4">
                {/* Mock Criterion 1 */}
                <div className="bg-[#0A0A0F]/60 p-4 rounded-2xl border border-[#232329]/40 space-y-3">
                  <div className="flex justify-between text-xs items-center">
                    <span className="font-heading font-bold text-[#F2F1ED]">Innovation & Originality</span>
                    <span className="font-mono text-[#A855F7] font-bold text-sm">9/10</span>
                  </div>
                  <div className="w-full h-1 bg-[#131318] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "90%" }} />
                  </div>
                </div>

                {/* Mock Criterion 2 */}
                <div className="bg-[#0A0A0F]/60 p-4 rounded-2xl border border-[#232329]/40 space-y-3">
                  <div className="flex justify-between text-xs items-center">
                    <span className="font-heading font-bold text-[#F2F1ED]">Technical Implementation</span>
                    <span className="font-mono text-[#A855F7] font-bold text-sm">8/10</span>
                  </div>
                  <div className="w-full h-1 bg-[#131318] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "80%" }} />
                  </div>
                </div>

                {/* Mock Gap warning */}
                <div className="bg-[#1C1318]/40 border border-red-950/40 p-4 rounded-2xl flex gap-3 text-xs">
                  <span className="text-red-400 text-sm mt-0.5">⚠️</span>
                  <div className="text-red-200/90 font-sans leading-relaxed">
                    <span className="font-bold text-red-400">Mismatch:</span> Claimed 3D rendering functionality in deck slides, but live site source only contains static flat SVGs.
                  </div>
                </div>
              </div>
            </Card>
          </div>

        </div>
      </section>

      {/* ── PLAIN "HOW IT WORKS" SECTION ────── */}
      <section className="relative w-full max-w-5xl px-4 md:px-8 py-24 border-t border-border/20 z-10">
        
        {/* Glow element underneath */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-[#A855F7]/5 blur-[100px] pointer-events-none z-0" />

        <div className="relative z-10 space-y-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-center text-foreground">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <Card className="bg-[#131318]/40 backdrop-blur-md border border-[#232329] hover:border-[#A855F7]/30 hover:bg-[#131318]/60 hover:shadow-[0_12px_40px_rgba(168,85,247,0.05)] transition-all duration-300 hover:-translate-y-1.5 p-6 rounded-2xl">
              <CardHeader className="p-0 mb-4">
                <div className="h-1 w-8 bg-[#A855F7] rounded-full mb-4" />
                <span className="text-xs font-mono font-bold text-[#A855F7]/80 uppercase tracking-widest">Step 01</span>
                <CardTitle className="text-xl font-heading font-bold mt-2 text-[#F2F1ED]">The Rubric</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-[#9C9B96] text-sm leading-relaxed font-sans">
                  Paste the hackathon judging criteria. Our pipeline splits the criteria and distributes point weights evenly if they are not explicitly specified.
                </p>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="bg-[#131318]/40 backdrop-blur-md border border-[#232329] hover:border-[#A855F7]/30 hover:bg-[#131318]/60 hover:shadow-[0_12px_40px_rgba(168,85,247,0.05)] transition-all duration-300 hover:-translate-y-1.5 p-6 rounded-2xl">
              <CardHeader className="p-0 mb-4">
                <div className="h-1 w-8 bg-[#A855F7] rounded-full mb-4" />
                <span className="text-xs font-mono font-bold text-[#A855F7]/80 uppercase tracking-widest">Step 02</span>
                <CardTitle className="text-xl font-heading font-bold mt-2 text-[#F2F1ED]">Deck & Live Site</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-[#9C9B96] text-sm leading-relaxed font-sans">
                  Provide your pitch deck link (Google Slides or web deck) and live website URL. We render and screenshot them instantly.
                </p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="bg-[#131318]/40 backdrop-blur-md border border-[#232329] hover:border-[#A855F7]/30 hover:bg-[#131318]/60 hover:shadow-[0_12px_40px_rgba(168,85,247,0.05)] transition-all duration-300 hover:-translate-y-1.5 p-6 rounded-2xl">
              <CardHeader className="p-0 mb-4">
                <div className="h-1 w-8 bg-[#A855F7] rounded-full mb-4" />
                <span className="text-xs font-mono font-bold text-[#A855F7]/80 uppercase tracking-widest">Step 03</span>
                <CardTitle className="text-xl font-heading font-bold mt-2 text-[#F2F1ED]">Scores & Gaps</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-[#9C9B96] text-sm leading-relaxed font-sans">
                  Gemini extracts factual claims, runs a visual consistency check on your live site, and scores your project with actionable improvements.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Proof of Work Footer */}
      <footer className="relative z-10 w-full max-w-5xl px-4 py-20 border-t border-border/20 flex flex-col items-center justify-center space-y-8">
        
        {/* Avatar & Name */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-[#A855F7] to-[#4F46E5] p-[2px] shadow-[0_0_20px_rgba(168,85,247,0.2)]">
            <div className="h-full w-full rounded-full bg-[#0A0A0F] flex items-center justify-center overflow-hidden">
              <img 
                src="/profile.png" 
                alt="Sri Priyan D" 
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center space-y-1">
            <span className="text-[10px] font-mono tracking-widest uppercase text-[#9C9B96]/60">Built & Designed By</span>
            <span className="text-lg font-heading font-bold text-[#F2F1ED] tracking-wide">Sri Priyan D</span>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <a href="https://sripriyand-portfolio.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-[#A855F7] hover:text-[#C084FC] transition-colors font-mono text-xs uppercase tracking-widest flex items-center gap-1">
            Portfolio ↗
          </a>
          <span className="text-[#232329] hidden sm:inline">|</span>
          <a href="https://github.com/SriPriyanD07" target="_blank" rel="noopener noreferrer" className="text-[#A855F7] hover:text-[#C084FC] transition-colors font-mono text-xs uppercase tracking-widest flex items-center gap-1">
            GitHub ↗
          </a>
          <span className="text-[#232329] hidden sm:inline">|</span>
          <a href="https://www.linkedin.com/in/sripriyandandayuthapani" target="_blank" rel="noopener noreferrer" className="text-[#A855F7] hover:text-[#C084FC] transition-colors font-mono text-xs uppercase tracking-widest flex items-center gap-1">
            LinkedIn ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
