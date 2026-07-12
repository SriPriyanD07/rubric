"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useReview } from "@/lib/context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export default function ResultsPage() {
  const router = useRouter();
  const { result } = useReview();

  // Redirect back to submit if no results data exists in context
  useEffect(() => {
    if (!result) {
      router.push("/submit");
    }
  }, [result, router]);

  if (!result) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#A855F7] border-t-transparent" />
      </div>
    );
  }

  const { meta, rubric, claims, consistency, evaluation } = result;
  const { scores = [], gaps = [], fixes = [] } = evaluation;

  // Sort fixes by priority: high -> medium -> low
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  const sortedFixes = [...fixes].sort((a, b) => {
    return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
  });

  // Score helper styling classes
  const getScoreColorClass = (score: number) => {
    if (score >= 7) return "text-emerald-400 border-emerald-900/50 hover:border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.02)]";
    if (score >= 4) return "text-amber-400 border-amber-900/50 hover:border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.02)]";
    return "text-red-400 border-red-900/50 hover:border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.02)]";
  };

  const getBarColorClass = (score: number) => {
    if (score >= 7) return "bg-emerald-500";
    if (score >= 4) return "bg-amber-500";
    return "bg-red-500";
  };

  const getStepFriendlyName = (stepKey: string) => {
    const mapping: Record<string, string> = {
      step0: "Initialize Browser Session",
      step1: "Extract Deck Elements",
      step2: "Visual Screenshot Capture",
      step3: "AI Claim Extraction",
      step4: "Visual Consistency Check",
      step5: "Generate Grading Metrics"
    };
    return mapping[stepKey] || stepKey;
  };

  return (
    <div className="relative flex-grow w-full max-w-[1600px] mx-auto px-4 md:px-8 py-10 space-y-8 font-sans z-10">
      
      {/* ── HEADER DETAILS ────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#232329]/60 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#A855F7] font-mono font-bold">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span>Dashboard</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-[#F2F1ED]">Evaluation Dashboard</h1>
          <p className="text-sm text-[#9C9B96] font-sans">
            Comprehensive analysis and criteria consistency checks.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/submit">
            <Button className="bg-[#A855F7] hover:bg-[#9333EA] text-black hover:text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)] border-0">
              Start new review
            </Button>
          </Link>
        </div>
      </div>

      {/* ── MAIN DASHBOARD GRID ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: CRITERION, GAPS, & RECOMMENDATIONS (8/12 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Criterion Scores */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-bold text-[#F2F1ED] tracking-wide">Criterion Scores</h2>
              <span className="text-xs font-mono text-[#9C9B96] bg-[#131318] py-1 px-3 border border-[#232329] rounded-full">
                {scores.length} Criteria Evaluated
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
              {scores.map((s, idx) => (
                <Card key={idx} className={`bg-[#131318]/50 backdrop-blur-xl border p-5 rounded-2xl flex flex-col justify-between hover:bg-[#131318]/70 hover:-translate-y-1 transition-all duration-300 group ${getScoreColorClass(s.score)}`}>
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono tracking-widest uppercase text-[#9C9B96]/60">Criterion {String(idx + 1).padStart(2, '0')}</div>
                    <CardTitle className="text-sm font-heading font-bold leading-snug text-[#F2F1ED] line-clamp-2 min-h-[40px] group-hover:text-[#A855F7] transition-colors" title={s.criterion}>
                      {s.criterion}
                    </CardTitle>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-4xl font-bold font-mono tracking-tight text-[#F2F1ED]">{s.score}</span>
                      <span className="text-xs text-[#9C9B96] font-mono">/ 10</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-[#0A0A0F] rounded-full overflow-hidden">
                      <div className={`h-full ${getBarColorClass(s.score)} rounded-full transition-all duration-500`} style={{ width: `${s.score * 10}%` }} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Contradiction Gaps */}
          <div className="space-y-4">
            <h2 className="text-xl font-heading font-bold text-[#F2F1ED] tracking-wide">Consistency Gaps</h2>
            {gaps.length > 0 ? (
              <div className="space-y-4">
                {gaps.map((gap, idx) => (
                  <div key={idx} className="bg-[#1C1318]/30 backdrop-blur-md border border-red-950/40 rounded-2xl p-5 flex items-start gap-4 hover:border-red-900/40 transition-all duration-200 shadow-[0_4px_20px_rgba(239,68,68,0.02)]">
                    <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-900/60 text-red-400 mt-0.5">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="space-y-2 flex-grow">
                      <h4 className="font-heading font-bold text-red-200 text-base leading-snug">
                        Mismatched Claim: &ldquo;{gap.claim}&rdquo;
                      </h4>
                      <p className="text-sm text-[#9C9B96] font-sans leading-relaxed">
                        <span className="font-bold text-red-400/90 mr-1.5">Identified Issue:</span> {gap.issue}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#131C18]/30 backdrop-blur-md border border-emerald-950/40 rounded-2xl p-6 flex items-start gap-4 shadow-[0_4px_20px_rgba(16,185,129,0.02)]">
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-heading font-bold text-emerald-200 text-base">Perfect Consistency Detected</h4>
                  <p className="text-sm text-[#9C9B96] font-sans mt-1">No contradiction gaps were found between your pitch deck and the live web page.</p>
                </div>
              </div>
            )}
          </div>

          {/* Recommended Fixes */}
          <div className="space-y-4">
            <h2 className="text-xl font-heading font-bold text-[#F2F1ED] tracking-wide">Recommended Fixes</h2>
            {sortedFixes.length > 0 ? (
              <div className="space-y-3">
                {sortedFixes.map((fix, idx) => {
                  const priorityColor = 
                    fix.priority === "high" 
                      ? "text-red-400 bg-red-950/30 border-red-900/50 shadow-[0_0_10px_rgba(239,68,68,0.03)]" 
                      : fix.priority === "medium" 
                      ? "text-amber-400 bg-amber-950/30 border-amber-900/50 shadow-[0_0_10px_rgba(245,158,11,0.03)]" 
                      : "text-[#9C9B96] bg-neutral-800/40 border-neutral-700/50";
                  return (
                    <div key={idx} className="bg-[#131318]/40 backdrop-blur-xl border border-[#232329]/80 p-5 rounded-2xl flex items-start gap-4 hover:border-[#A855F7]/30 transition-all duration-200 group">
                      <div className="mt-1 flex items-center justify-center h-5 w-5 rounded-full border border-[#232329] group-hover:border-[#A855F7]/50 text-transparent group-hover:text-[#A855F7] transition-all">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-grow space-y-1">
                        <p className="text-sm font-medium text-[#F2F1ED] leading-relaxed font-sans">{fix.action}</p>
                      </div>
                      <Badge className={`border font-mono text-[9px] uppercase tracking-widest py-0.5 px-2 rounded-md ${priorityColor}`}>
                        {fix.priority}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[#9C9B96] italic font-sans">No recommendations found.</p>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: RUN METADATA & LATENCY PIPELINE (4/12 cols) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Metadata Card */}
          <Card className="bg-[#131318]/50 backdrop-blur-xl border border-[#232329]/80 p-6 rounded-3xl space-y-6">
            <h3 className="text-sm font-mono tracking-widest uppercase text-[#A855F7] font-bold">Review Specifications</h3>
            
            <div className="space-y-4 font-sans text-sm">
              <div className="space-y-1">
                <span className="text-xs text-[#9C9B96] block">Live Website URL</span>
                <a href={meta.siteUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-[#F2F1ED] hover:text-[#A855F7] transition-colors truncate block">
                  {meta.siteUrl}
                </a>
              </div>

              {meta.deckLink && (
                <div className="space-y-1">
                  <span className="text-xs text-[#9C9B96] block">Pitch Slide Deck</span>
                  <a href={meta.deckLink} target="_blank" rel="noopener noreferrer" className="font-bold text-[#F2F1ED] hover:text-[#A855F7] transition-colors truncate block">
                    {meta.deckLink}
                  </a>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#232329]/60">
                <div className="space-y-1">
                  <span className="text-xs text-[#9C9B96] block">Execution Mode</span>
                  <span className="font-bold text-[#F2F1ED] text-xs">
                    {meta.deckLink ? "Slides + Website" : "Website-Only"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-[#9C9B96] block">Evaluation Date</span>
                  <span className="font-bold text-[#F2F1ED] text-xs">
                    {new Date(meta.runAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#232329]/60">
                <div className="space-y-1">
                  <span className="text-xs text-[#9C9B96] block">Rubric Source</span>
                  <span className="font-bold text-[#F2F1ED] text-xs capitalize">
                    {meta.rubricSource || "custom"}
                  </span>
                </div>
              </div>

              {meta.problemStatement && (
                <div className="space-y-1 pt-2 border-t border-[#232329]/60">
                  <span className="text-xs text-[#9C9B96] block">Problem Statement</span>
                  <p className="font-bold text-[#F2F1ED] text-xs leading-relaxed italic">
                    &ldquo;{meta.problemStatement}&rdquo;
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-[#232329]/60 text-[10px] text-[#9C9B96]/60 font-mono">
                RUN ID: {meta.runAt}
              </div>
            </div>
          </Card>

          {/* Stepper Pipeline Performance */}
          <Card className="bg-[#131318]/50 backdrop-blur-xl border border-[#232329]/80 p-6 rounded-3xl space-y-6">
            <h3 className="text-sm font-mono tracking-widest uppercase text-[#A855F7] font-bold">Execution Latency</h3>
            
            <div className="relative pl-6 space-y-6 border-l-2 border-[#232329]/80 ml-3 font-sans">
              {Object.entries(meta.timings).map(([step, time], idx) => (
                <div key={step} className="relative">
                  {/* Timeline bullet dot */}
                  <div className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-[#131318] border-2 border-[#A855F7] shadow-[0_0_10px_rgba(168,85,247,0.3)]" />
                  
                  <div className="space-y-1">
                    <div className="text-xs font-heading font-bold text-[#F2F1ED] flex items-center justify-between">
                      <span>{step.replace("step", "Phase ")}</span>
                      <span className="text-xs font-mono font-bold text-[#A855F7] bg-[#1a0f2b] px-2 py-0.5 rounded border border-[#A855F7]/20">{time}</span>
                    </div>
                    <div className="text-[11px] text-[#9C9B96] capitalize">
                      {getStepFriendlyName(step)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>

      </div>

    </div>
  );
}
