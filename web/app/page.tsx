"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Ribbons from "@/components/ui/Ribbons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SplineScene } from "@/components/ui/spline";
import { Spotlight } from "@/components/ui/spotlight";
import { DecryptedText } from "@/components/ui/decrypted-text";

export default function Home() {
  const router = useRouter();
  const splineRef = React.useRef<any>(null);
  const [showIntro, setShowIntro] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSeen = sessionStorage.getItem("hasSeenIntro");
      const urlParams = new URLSearchParams(window.location.search);
      const forceIntro = urlParams.get("intro") === "true";

      if (hasSeen && !forceIntro) {
        setShowIntro(false);
      } else {
        const timer = setTimeout(() => {
          setShowIntro(false);
          sessionStorage.setItem("hasSeenIntro", "true");
        }, 9000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleLoad = (splineApp: any) => {
    splineRef.current = splineApp;
    console.log("🤖 [Spline] Loaded instance:", splineApp);
    try {
      if (splineApp._scene) {
        console.log("🤖 [Spline] Scene exposed children:", splineApp._scene.children.map((c: any) => c.name));
      }
    } catch (e) {
      console.log("🤖 [Spline] Could not inspect scene children:", e);
    }
  };

  const handleScoreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("🤖 [Spline] CTA clicked. Emitting events...");

    if (splineRef.current) {
      const spline = splineRef.current;
      const events = ["thumbsUp", "wave", "click", "greet", "trigger", "mouseHover", "mouseDown"];
      
      // Emit globally
      events.forEach(evt => {
        try { spline.emitEvent(evt); } catch (err) {}
      });

      // Target common objects
      try {
        const targetNames = ["robot", "Robot", "Group", "Character", "Arm", "Hand"];
        targetNames.forEach(name => {
          const obj = spline.findObjectByName(name);
          if (obj) {
            console.log(`🤖 [Spline] Found target object: ${name}, triggering events...`);
            events.forEach(evt => {
              try { spline.emitEvent(evt, name); } catch (err) {}
            });
          }
        });
      } catch (err) {
        console.warn("🤖 [Spline] Emit event error:", err);
      }
    }

    // Delay navigation by 500ms to allow animation play context
    setTimeout(() => {
      router.push("/submit");
    }, 500);
  };

  const handleScoreHover = () => {
    if (splineRef.current) {
      const spline = splineRef.current;
      const events = ["mouseHover", "wave", "greet"];
      
      // Emit globally
      events.forEach(evt => {
        try { spline.emitEvent(evt); } catch (err) {}
      });

      // Target common objects
      try {
        const targetNames = ["robot", "Robot", "Group", "Character"];
        targetNames.forEach(name => {
          const obj = spline.findObjectByName(name);
          if (obj) {
            events.forEach(evt => {
              try { spline.emitEvent(evt, name); } catch (err) {}
            });
          }
        });
      } catch (err) {}
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col items-center select-none font-sans">
      
      {/* Splash intro overlay */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0A0A0F]"
          >
            <div className="text-center flex flex-col items-center justify-center">
              <DecryptedText
                text="Rubric"
                speed={40}
                maxIterations={6}
                sequential={true}
                revealDirection="center"
                animateOn="view"
                className="text-6xl sm:text-7xl md:text-8xl font-heading font-bold tracking-tight text-[#F2F1ED]"
                encryptedClassName="text-[#A855F7] font-mono"
              />
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-xs md:text-sm text-[#9C9B96] font-sans mt-3 tracking-[0.2em] uppercase font-bold"
              >
                Your AI review
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ── HERO SECTION ───────────────────── */}
      <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center px-4 md:px-8 py-16 overflow-hidden bg-transparent">
        {/* Ambient light sweep effect */}
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#A855F7" />

        {/* Hero split-layout container */}
        <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-12 items-center bg-transparent">
          
          {/* Left Column: Heading, Subtext, & CTA */}
          <div className="space-y-8 flex flex-col justify-center text-left bg-transparent md:col-span-6 lg:col-span-5">
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
              <Link href="/submit" className="relative z-10" onClick={handleScoreClick} onMouseEnter={handleScoreHover}>
                <Button className="h-12 px-8 text-sm font-bold bg-[#A855F7] hover:bg-[#9333EA] text-black hover:text-white rounded-xl transition-all shadow-[0_0_25px_rgba(168,85,247,0.35)] hover:shadow-[0_0_35px_rgba(168,85,247,0.55)] border-0">
                  Score my submission
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: 3D Spline Scene (Hidden on mobile for loading performance) */}
          <div className="hidden md:block md:col-span-6 lg:col-span-7 h-[480px] lg:h-[560px] w-full relative bg-transparent overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center scale-95 lg:scale-105 translate-y-2 lg:translate-y-4">
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full bg-transparent"
                onLoad={handleLoad}
              />
            </div>
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
