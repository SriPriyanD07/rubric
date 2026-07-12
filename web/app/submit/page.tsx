"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useReview } from "@/lib/context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

const loadingSteps = [
  "Reading your deck...",
  "Checking your live site (can take up to 15 seconds)...",
  "Comparing claims against evidence...",
  "Scoring your submission..."
];

export default function SubmitPage() {
  const router = useRouter();
  const { setResult, setLastSubmitData } = useReview();

  // Form states
  const [rubricText, setRubricText] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [deckLink, setDeckLink] = useState("");
  const [siteUrl, setSiteUrl] = useState("");

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Rotate loading text every 3 seconds when loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % loadingSteps.length);
      }, 3000);
    } else {
      setCurrentStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    // Save submit parameters locally for results display referencing
    setLastSubmitData({ siteUrl, deckLink: deckLink.trim() || null });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

    try {
      const response = await fetch(`${API_URL}/api/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          rubricText: rubricText.trim() || null,
          problemStatement: problemStatement.trim() || null,
          deckLink: deckLink.trim() || null,
          siteUrl
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }

      // Save output result contextually and transition to results view
      setResult(data);
      router.push("/results");
    } catch (err: any) {
      console.error("API submission error:", err);
      setErrorMsg(err.message || "An unexpected error occurred while communicating with the pipeline.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex-grow w-full max-w-[1400px] mx-auto px-4 md:px-8 py-12 flex flex-col justify-center">
      
      {/* Ambient background glow bubble */}
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-[#A855F7]/5 blur-[120px] pointer-events-none z-0" />

      {/* Main split-column submission layout wrapper */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* LEFT COLUMN: Guidance & Info Block (5/12 cols) */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4">
            <Link 
              href="/" 
              className="text-xs uppercase tracking-widest text-[#9C9B96] hover:text-[#A855F7] transition-colors font-mono font-bold flex items-center gap-2"
            >
              <span>←</span> Back to Home
            </Link>
            <h1 className="text-4xl font-heading font-bold text-[#F2F1ED] tracking-tight pt-2">
              Evaluate <br />
              <span className="text-[#A855F7]">Submission</span>
            </h1>
            <p className="text-sm text-[#9C9B96] leading-relaxed font-sans max-w-md">
              Trigger our automated visual consistency and scoring pipeline. We cross-check slides, screenshots, and live code to grade your submission.
            </p>
          </div>

          {/* Stepper info card */}
          <Card className="bg-[#131318]/50 backdrop-blur-xl border border-[#232329]/80 p-6 rounded-3xl space-y-6">
            <h3 className="text-xs font-mono tracking-widest uppercase text-[#A855F7] font-bold">What runs in the background</h3>
            <div className="space-y-4 font-sans text-xs text-[#9C9B96]">
              <div className="flex gap-4">
                <span className="text-[#A855F7] font-mono font-bold text-sm">01.</span>
                <p className="leading-relaxed"><strong className="text-[#F2F1ED] block mb-0.5">Rubric Parsing</strong> Extracts criteria and structures grading weightages proportionally.</p>
              </div>
              <div className="flex gap-4 border-t border-[#232329]/50 pt-4">
                <span className="text-[#A855F7] font-mono font-bold text-sm">02.</span>
                <p className="leading-relaxed"><strong className="text-[#F2F1ED] block mb-0.5">Visual Web Crawling</strong> Playwright opens your live site, gathers layout coordinates, and snaps high-resolution images.</p>
              </div>
              <div className="flex gap-4 border-t border-[#232329]/50 pt-4">
                <span className="text-[#A855F7] font-mono font-bold text-sm">03.</span>
                <p className="leading-relaxed"><strong className="text-[#F2F1ED] block mb-0.5">Consistency Evaluation</strong> Gemini matches slide pitch assertions against visual site elements to index scores and contradiction gaps.</p>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Submission Form Card (7/12 cols) */}
        <div className="lg:col-span-7">
          <Card className="bg-[#131318]/60 backdrop-blur-xl border border-[#232329]/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl">
            <CardHeader className="border-b border-[#232329]/50 pb-6">
              <CardTitle className="text-2xl font-heading font-bold text-foreground">Project Credentials</CardTitle>
              <CardDescription className="text-[#9C9B96] mt-1 font-sans">
                Input your hackathon submission details below to begin the audit.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6 pt-6">
                {errorMsg && (
                  <div className="p-4 bg-red-950/20 border border-red-800/50 rounded-xl text-red-200 text-sm font-sans">
                    <span className="font-bold">Error:</span> {errorMsg}
                  </div>
                )}

                {/* Rubric Criteria */}
                <div className="space-y-2">
                  <Label htmlFor="rubric" className="text-sm font-bold text-[#F2F1ED] font-sans flex items-center justify-between">
                    <span>Judging Rubric (Optional)</span>
                  </Label>
                  <Textarea
                    id="rubric"
                    value={rubricText}
                    onChange={(e) => setRubricText(e.target.value)}
                    placeholder="Leave blank to use our default hackathon rubric (Innovation, Tech Implementation, Feasibility, Design, presentation...)"
                    disabled={isLoading}
                    rows={5}
                    className="bg-[#0A0A0F]/80 border-[#232329] text-foreground placeholder-[#9C9B96]/30 focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7] focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl font-sans"
                  />
                </div>

                {/* Problem Statement */}
                <div className="space-y-2">
                  <Label htmlFor="problemStatement" className="text-sm font-bold text-[#F2F1ED] font-sans flex items-center justify-between">
                    <span>Problem Statement (Optional)</span>
                    <span className="text-xs font-normal text-[#9C9B96]/60">Weighs feasibility against this specific prompt</span>
                  </Label>
                  <Input
                    id="problemStatement"
                    value={problemStatement}
                    onChange={(e) => setProblemStatement(e.target.value)}
                    placeholder="Describe the specific problem statement or prompt to align Impact scoring..."
                    disabled={isLoading}
                    className="bg-[#0A0A0F]/80 border-[#232329] text-foreground placeholder-[#9C9B96]/30 focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7] focus-visible:ring-0 focus-visible:ring-offset-0 h-11 rounded-xl font-sans"
                  />
                </div>

                {/* Site URL */}
                <div className="space-y-2">
                  <Label htmlFor="site" className="text-sm font-bold text-[#F2F1ED] font-sans">
                    Live Website URL (Required)
                  </Label>
                  <Input
                    id="site"
                    type="url"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    placeholder="https://myproject.com"
                    required
                    disabled={isLoading}
                    className="bg-[#0A0A0F]/80 border-[#232329] text-foreground placeholder-[#9C9B96]/30 focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7] focus-visible:ring-0 focus-visible:ring-offset-0 h-11 rounded-xl font-sans"
                  />
                </div>

                {/* Deck Link */}
                <div className="space-y-2">
                  <Label htmlFor="deck" className="text-sm font-bold text-[#F2F1ED] font-sans flex items-center justify-between">
                    <span>Pitch Deck Link (Optional)</span>
                    <span className="text-xs font-normal text-[#9C9B96]/60">Google Slides or Gamma web deck</span>
                  </Label>
                  <Input
                    id="deck"
                    type="url"
                    value={deckLink}
                    onChange={(e) => setDeckLink(e.target.value)}
                    placeholder="https://docs.google.com/presentation/d/.../edit"
                    disabled={isLoading}
                    className="bg-[#0A0A0F]/80 border-[#232329] text-foreground placeholder-[#9C9B96]/30 focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7] focus-visible:ring-0 focus-visible:ring-offset-0 h-11 rounded-xl font-sans"
                  />
                </div>
              </CardContent>

              <CardFooter className="pt-2 pb-6">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 text-base font-bold bg-[#A855F7] hover:bg-[#9333EA] text-black hover:text-[#F2F1ED] rounded-xl transition-all border-0 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      <span>{loadingSteps[currentStep]}</span>
                    </div>
                  ) : (
                    "Run Pipeline Review"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

      </div>
    </div>
  );
}
