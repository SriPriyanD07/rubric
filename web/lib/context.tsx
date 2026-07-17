"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// Matches the exact API JSON shape
export interface ScoreEntry {
  criterion: string;
  score: number;
}

export interface GapEntry {
  claim: string;
  issue: string;
}

export interface FixEntry {
  priority: "high" | "medium" | "low";
  action: string;
}

export interface EvaluationResult {
  scores: ScoreEntry[];
  gaps: GapEntry[];
  fixes: FixEntry[];
}

export interface ConsistencyEntry {
  claim: string;
  status: "supported" | "contradicted" | "unverifiable";
  evidence: string;
}

export interface PipelineResponse {
  meta: {
    deckLink: string | null;
    siteUrl: string;
    runAt: string;
    timings: Record<string, string>;
    rubricSource?: string;
    problemStatement?: string | null;
    deckMode?: string;
    deckFileName?: string | null;
  };
  rubric: { criterion: string; weight: number }[];
  claims: string[];
  consistency: ConsistencyEntry[];
  evaluation: EvaluationResult;
}

interface ReviewContextType {
  result: PipelineResponse | null;
  setResult: (res: PipelineResponse | null) => void;
  lastSubmitData: { siteUrl: string; deckLink: string | null; deckFileName?: string | null } | null;
  setLastSubmitData: (data: { siteUrl: string; deckLink: string | null; deckFileName?: string | null } | null) => void;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<PipelineResponse | null>(null);
  const [lastSubmitData, setLastSubmitData] = useState<{ siteUrl: string; deckLink: string | null; deckFileName?: string | null } | null>(null);

  return (
    <ReviewContext.Provider value={{ result, setResult, lastSubmitData, setLastSubmitData }}>
      {children}
    </ReviewContext.Provider>
  );
}

export function useReview() {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error("useReview must be used within a ReviewProvider");
  }
  return context;
}
