/**
 * rubric-phase0 — AI scoring pipeline API service
 *
 * Runs the 6-step AI pipeline as a stateless Express server.
 * Requires: GROQ_API_KEY, GEMINI_API_KEY in .env or environment.
 */

import "dotenv/config";
import https from "https";
import http from "http";
import { chromium } from "playwright";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import express from "express";
import cors from "cors";

// ── API clients ──────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Helpers ──────────────────────────────────

/** Pretty timer label */
function fmtMs(ms) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

/** Wrap a step with timing + error boundary */
async function timed(label, stepName, fn) {
  const t0 = Date.now();
  console.error(`\n⏳  [${label}] starting…`);
  try {
    const result = await fn();
    const elapsed = Date.now() - t0;
    console.error(`✅  [${label}] done in ${fmtMs(elapsed)}`);
    return { result, elapsed };
  } catch (err) {
    const elapsed = Date.now() - t0;
    console.error(`❌  [${label}] FAILED after ${fmtMs(elapsed)}: ${err.message}`);
    err.step = stepName; // Attach step name for error handler
    throw err;
  }
}

/**
 * Download a URL and return a Buffer.
 * Follows up to `maxRedirects` redirects.
 */
function fetchBuffer(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const follow = (currentUrl, remaining) => {
      const lib = currentUrl.startsWith("https") ? https : http;
      lib
        .get(currentUrl, { headers: { "User-Agent": "rubric-phase0/1.0" } }, (res) => {
          if (
            [301, 302, 303, 307, 308].includes(res.statusCode) &&
            res.headers.location &&
            remaining > 0
          ) {
            return follow(res.headers.location, remaining - 1);
          }
          if (res.statusCode !== 200) {
            return reject(
              new Error(`HTTP ${res.statusCode} fetching ${currentUrl}`)
            );
          }
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => resolve(Buffer.concat(chunks)));
          res.on("error", reject);
        })
        .on("error", reject);
    };
    follow(url, maxRedirects);
  });
}

/**
 * Parse JSON that may be wrapped in a markdown code fence.
 * Throws with the raw text if parsing fails.
 */
function parseJsonResponse(raw, stepName) {
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) text = fenceMatch[1].trim();
  try {
    return JSON.parse(text);
  } catch {
    console.error(`\n🔴 [${stepName}] Raw response that failed JSON parse:\n`, raw);
    throw new Error(`[${stepName}] Response is not valid JSON.`);
  }
}

// ─────────────────────────────────────────────
// STEP 1 — Fetch / screenshot the deck
//   Returns: { pdfBuffer, deckScreenshot, mode }
//     mode: "pdf" | "screenshot" | "none"
// ─────────────────────────────────────────────
async function step1_fetchDeck(link) {
  if (!link) {
    console.error("   → No deck link — claims will come from the site screenshot.");
    return { pdfBuffer: null, deckScreenshot: null, mode: "none" };
  }

  // Helper validation for downloaded PDF buffer
  const validatePdf = (buffer, sourceLabel) => {
    if (!buffer || buffer.length < 10240) {
      console.warn(`⚠️ ${sourceLabel} PDF buffer is suspiciously small (${buffer ? buffer.length : 0}B). Falling back to mode: none.`);
      return false;
    }
    if (buffer.slice(0, 4).toString() !== "%PDF") {
      console.warn(`⚠️ ${sourceLabel} PDF buffer failed to parse (invalid magic bytes header). Falling back to mode: none.`);
      return false;
    }
    return true;
  };

  // ── Google Slides → PDF export ──────────────
  const isGoogleSlides = link.includes("docs.google.com/presentation");
  if (isGoogleSlides) {
    const idMatch = link.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
    if (!idMatch) {
      console.warn("⚠️ Could not extract Google Slides presentation ID from URL. Falling back to mode: none.");
      return { pdfBuffer: null, deckScreenshot: null, mode: "none" };
    }
    const exportUrl = `https://docs.google.com/presentation/d/${idMatch[1]}/export/pdf`;
    console.error(`   → Google Slides detected. Export URL: ${exportUrl}`);
    try {
      const pdfBuffer = await fetchBuffer(exportUrl);
      if (!validatePdf(pdfBuffer, "Google Slides")) {
        return { pdfBuffer: null, deckScreenshot: null, mode: "none" };
      }
      return { pdfBuffer, deckScreenshot: null, mode: "pdf" };
    } catch (err) {
      console.warn(`⚠️ Google Slides PDF export failed: ${err.message}. Falling back to mode: none.`);
      return { pdfBuffer: null, deckScreenshot: null, mode: "none" };
    }
  }

  // ── Direct PDF check ────────────────────────
  let isDirectPdf = false;
  try {
    const parsed = new URL(link);
    if (parsed.pathname.toLowerCase().endsWith(".pdf")) {
      isDirectPdf = true;
    }
  } catch (e) {}

  if (!isDirectPdf) {
    isDirectPdf = await new Promise((resolve) => {
      const lib = link.startsWith("https") ? https : http;
      const req = lib.request(link, { method: "HEAD", headers: { "User-Agent": "rubric-phase0/1.0" } }, (res) => {
        const contentType = res.headers["content-type"] || "";
        resolve(contentType.toLowerCase().includes("application/pdf"));
      });
      req.on("error", () => resolve(false));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    });
  }

  if (isDirectPdf) {
    console.error(`   → Direct PDF detected. Downloading directly…`);
    try {
      const pdfBuffer = await fetchBuffer(link);
      if (!validatePdf(pdfBuffer, "Direct PDF")) {
        return { pdfBuffer: null, deckScreenshot: null, mode: "none" };
      }
      return { pdfBuffer, deckScreenshot: null, mode: "directPdf" };
    } catch (err) {
      console.warn(`⚠️ Direct PDF download failed: ${err.message}. Falling back to mode: none.`);
      return { pdfBuffer: null, deckScreenshot: null, mode: "none" };
    }
  }

  // ── Gamma / Canva / any web deck → Playwright screenshot ──
  console.error(`   → Web deck detected (${new URL(link).hostname}). Screenshotting with Playwright…`);

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.setExtraHTTPHeaders({
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    });

    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    await page.goto(link, { waitUntil: "load", timeout: 60_000 });

    try {
      await page.waitForFunction(
        () => document.body && document.body.innerText.trim().length > 100,
        { timeout: 15_000 }
      );
    } catch {
      console.error("   ⚠️  Text-ready timeout — page may require login or JS is blocked.");
      console.error("   ⚠️  Make sure the deck is set to 'Anyone with the link can view'.");
    }

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    const deckScreenshot = await page.screenshot({ fullPage: true });

    const sizeKB = deckScreenshot.length / 1024;
    if (deckScreenshot.length < 50_000) {
      console.error(`   ⚠️  Deck screenshot tiny (${sizeKB.toFixed(1)} KB) — Gamma is serving a bot-gate/login page.`);
      console.error("   ⚠️  Switching to mode:none — claims will be extracted from the live site instead.");
      return { pdfBuffer: null, deckScreenshot: null, mode: "none" };
    }

    console.error(`   ✓  Deck screenshot OK (${sizeKB.toFixed(1)} KB).`);
    return { pdfBuffer: null, deckScreenshot, mode: "screenshot" };
  } finally {
    await browser.close();
  }
}

// ─────────────────────────────────────────────
// STEP 2 — Screenshot the live site
// ─────────────────────────────────────────────
async function step2_screenshotSite(url) {
  const tBrowser0 = Date.now();
  const browser = await chromium.launch({ headless: true });
  const browserLaunchMs = Date.now() - tBrowser0;
  console.error(`      [step2] Browser launch took ${browserLaunchMs}ms`);

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });

    const tGoto0 = Date.now();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    const gotoMs = Date.now() - tGoto0;
    console.error(`      [step2] page.goto (domcontentloaded) took ${gotoMs}ms`);

    const tWait0 = Date.now();
    await page.waitForTimeout(2000);
    const waitMs = Date.now() - tWait0;
    console.error(`      [step2] Fixed delay wait took ${waitMs}ms`);

    // Inject CSS to pause animations/transitions to optimize screenshot capture speed
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-play-state: paused !important;
          transition: none !important;
          animation-delay: 0s !important;
          transition-delay: 0s !important;
        }
      `
    }).catch(() => {});

    // Measure page scroll height to track tall renders
    const pageHeight = await page.evaluate(() => {
      return document.documentElement.scrollHeight || document.body.scrollHeight;
    }).catch(() => 900);
    console.error(`      [step2] Page scroll height is ${pageHeight}px`);

    const tScreenshot0 = Date.now();
    const screenshotBuffer = await page.screenshot({ fullPage: true });
    const screenshotMs = Date.now() - tScreenshot0;
    console.error(`      [step2] Screenshot capture took ${screenshotMs}ms`);

    return {
      buffer: screenshotBuffer,
      browserLaunchMs,
      gotoMs,
      waitMs,
      screenshotMs
    };
  } finally {
    await browser.close();
  }
}

// ─────────────────────────────────────────────
// STEP 3 — Parse rubric via Groq → JSON array
// ─────────────────────────────────────────────
async function step3_parseRubric(rubric) {
  const prompt = `You are a judging-criteria parser.

Given the rubric text below, return ONLY a JSON array with no extra text.
Each element must be: { "criterion": "<name>", "weight": <number 0-100> }

Rules:
- Weights must sum to 100.
- If explicit weights are given, normalize them to sum to 100.
- If no weights are given, distribute evenly.
- Do NOT include any explanation outside the JSON array.

RUBRIC:
${rubric}`;

  const chat = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
    max_tokens: 1024,
  });

  const raw = chat.choices[0]?.message?.content ?? "";
  return parseJsonResponse(raw, "step3_parseRubric");
}

// ─────────────────────────────────────────────
// STEP 4 — Extract claims from deck
// ─────────────────────────────────────────────
async function step4_extractClaims({ pdfBuffer, deckScreenshot, mode }, siteScreenshot) {
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

  const deckPrompt = `You are analyzing a hackathon project pitch deck.

Extract all factual claims the deck makes about the product.
Return ONLY a JSON array of plain strings — the claims.
Examples: "processes data in real time", "supports 10,000 concurrent users", "reduces cost by 40%", "built with React and Node.js".

Rules:
- Only include claims verifiable by looking at the live product or its source.
- Omit vague marketing language ("is the best solution", "revolutionary").
- Do NOT include any text outside the JSON array.`;

  const sitePrompt = `You are evaluating a project website with no separate pitch deck.

From the screenshot, extract all verifiable factual claims the site makes about the product or team.
Return ONLY a JSON array of plain strings — the claims.
Examples: "processes data in real time", "built with React", "has 500 active users".

Rules:
- Only include claims that can be independently verified.
- Omit subjective/vague statements.
- Extract at least 8 claims if visible.
- Do NOT include any text outside the JSON array.`;

  if (mode === "pdf" || mode === "directPdf") {
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: deckPrompt },
          { inlineData: { mimeType: "application/pdf", data: pdfBuffer.toString("base64") } },
        ],
      }],
    });
    return parseJsonResponse(result.response.text(), `step4[${mode}]`);
  }

  if (mode === "screenshot") {
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: deckPrompt },
          { inlineData: { mimeType: "image/png", data: deckScreenshot.toString("base64") } },
        ],
      }],
    });
    const deckClaims = parseJsonResponse(result.response.text(), "step4[deck-screenshot]");

    if (deckClaims.length === 0) {
      console.error("   ⚠️  Deck screenshot yielded 0 claims — falling back to site screenshot.");
      const fallback = await model.generateContent({
        contents: [{
          role: "user",
          parts: [
            { text: sitePrompt },
            { inlineData: { mimeType: "image/png", data: siteScreenshot.toString("base64") } },
          ],
        }],
      });
      return parseJsonResponse(fallback.response.text(), "step4[site-fallback]");
    }

    return deckClaims;
  }

  const result = await model.generateContent({
    contents: [{
      role: "user",
      parts: [
        { text: sitePrompt },
        { inlineData: { mimeType: "image/png", data: siteScreenshot.toString("base64") } },
      ],
    }],
  });
  return parseJsonResponse(result.response.text(), "step4[site-fallback]");
}

// ─────────────────────────────────────────────
// STEP 5 — Check claim consistency via Gemini (vision)
// ─────────────────────────────────────────────
async function step5_checkConsistency(screenshotBuffer, claims) {
  if (!claims || claims.length === 0) {
    console.error("   ⚠️  No claims to check — skipping consistency step.");
    return [];
  }

  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

  const prompt = `You are a fact-checker for a hackathon submission.

You are given:
1. A full-page screenshot of the live product website.
2. A list of claims the pitch deck makes about the product.

For each claim, determine whether the live website visually confirms it, contradicts it, or if it is unverifiable from a static screenshot.

Return ONLY a JSON array with no extra text.
Each element must have exactly these three fields:
  { "claim": "<exact claim text>", "status": "supported" | "contradicted" | "unverifiable", "evidence": "<one sentence about what you saw>" }

Status definitions:
- "supported": The claim is visibly confirmed by content, widgets, text, or elements in the screenshot.
- "contradicted": The screenshot directly conflicts with the claim (e.g., page says 91 problems but claim says over 100 problems, or site states a different framework than claimed).
- "unverifiable": The claim cannot be confirmed or denied from a static screenshot alone.

Critical Rules for "unverifiable" vs "contradicted":
- BEFORE marking any claim "unverifiable", first check whether the site screenshot contains its OWN explicit text stating something on the same topic (e.g. check "Skills", "Tech Stack", "Frameworks", or "About Me" sections for named technologies).
- If the site's own visible text lists a specific technology/framework and the deck claims a DIFFERENT one for that same role, mark it "contradicted" (this is a direct textual conflict, not an unverifiable backend detail).
- Example: If the site's visible frameworks section lists "React, Next.js" and the deck claims "built using Angular 18", this is "contradicted" (a conflict exists), NOT "unverifiable".
- Only mark a claim "unverifiable" if the site provides NO visible text or clues on that specific topic at all (meaning there is nothing to check it against).

Claims to check:
${JSON.stringify(claims, null, 2)}

Rules:
- Base your judgment ONLY on what is visible in the screenshot.
- Return one object per claim — same count as the input list.
- Do NOT include any text outside the JSON array.`;

  const result = await model.generateContent({
    contents: [{
      role: "user",
      parts: [
        { text: prompt },
        { inlineData: { mimeType: "image/png", data: screenshotBuffer.toString("base64") } },
      ],
    }],
  });

  return parseJsonResponse(result.response.text(), "step5_checkConsistency");
}

// ─────────────────────────────────────────────
// STEP 6 — Score the submission via Gemini
// ─────────────────────────────────────────────
async function step6_score(parsedRubric, claims, consistency, problemStatement = null) {
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

  const exampleOutput = JSON.stringify({
    scores: [
      { criterion: "Innovation & Originality", score: 7 },
      { criterion: "Technical Implementation", score: 8 }
    ],
    gaps: [
      { claim: "has solved over 100 problems", issue: "The live website displays exactly 91 solved problems, which contradicts the claim." }
    ],
    fixes: [
      { priority: "low", action: "Add a way to verify the claim 'implements server-side rendering' (e.g., repository links or technical documentation)." }
    ]
  }, null, 2);

  let prompt = `You are an expert hackathon judge.

You have been given:
1. The judging rubric (criteria with weights out of 100).
2. The factual claims the team's pitch deck makes.
3. A consistency check showing whether each claim is "supported", "contradicted", or "unverifiable" on the live site.

Return ONLY a valid JSON object — no markdown, no explanation, no text before or after.
The object must match this exact shape (field names must be exact):

${exampleOutput}

Scoring and Feedback Rules:
1. "scores": EXACTLY one entry per rubric criterion below. Score 0-10 based on evidence.
   - DEDUCT points for "contradicted" claims (representing active mismatches/failures).
   - Do NOT deduct points for "unverifiable" claims (infra, SSR, etc.). Treat these neutrally.
   - Each entry MUST have "criterion" (string) and "score" (integer 0-10).
2. "gaps": ONLY include claims that are "contradicted". Do NOT include "unverifiable" or "supported" claims here. Empty array [] if none.
3. "fixes":
   - For every "unverifiable" claim, generate a "low" priority fix suggesting how they can verify it (e.g., "Add a way to verify the claim '<claim text>' (e.g., repository link, architecture badge, or docs)").
   - For "contradicted" claims, generate "high" or "medium" priority fixes.
   - Each entry MUST have "priority" ("high"|"medium"|"low") and "action" (string).

RUBRIC:
${JSON.stringify(parsedRubric, null, 2)}

CLAIMS FROM DECK:
${JSON.stringify(claims, null, 2)}

CONSISTENCY RESULTS:
${JSON.stringify(consistency, null, 2)}`;

  if (problemStatement) {
    prompt += `\n\nADDITIONAL CONTEXT:\nThis submission is responding to the following problem statement:\n"${problemStatement}"\nWeigh Impact & Feasibility against how well the submission actually addresses this specific problem, not generically.`;
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      return parseJsonResponse(result.response.text(), "step6_score");
    } catch (err) {
      if (attempt === 2) throw err;
      console.error(`   ⚠️  step6 attempt ${attempt} failed (${err.message}) — retrying…`);
    }
  }
}

// ─────────────────────────────────────────────
// PIPELINE RUNNER
// ─────────────────────────────────────────────
async function runPipeline(rubricText, deckLink, siteUrl, problemStatement = null, rubricSource = "custom", deckFileBuffer = null, deckFileName = null, isColdStart = false) {
  const timings = {};
  timings["coldStart"] = isColdStart ? "true" : "false";

  // Step 1
  let deck;
  if (deckFileBuffer) {
    if (deckFileBuffer.length < 10240 || deckFileBuffer.slice(0, 4).toString() !== "%PDF") {
      console.warn(`⚠️ Uploaded PDF failed validation (size: ${deckFileBuffer.length}B). Falling back to mode: none.`);
      deck = { pdfBuffer: null, deckScreenshot: null, mode: "none" };
    } else {
      deck = { pdfBuffer: deckFileBuffer, deckScreenshot: null, mode: "directPdf" };
    }
    timings["step1_fetchDeck"] = "0ms (uploaded PDF)";
  } else {
    const { result: d, elapsed: t1 } = await timed(
      "Step 1 – Fetch/Screenshot Deck",
      "step1_fetchDeck",
      () => step1_fetchDeck(deckLink)
    );
    deck = d;
    timings["step1_fetchDeck"] = fmtMs(t1);
  }

  // Step 2
  const { result: screenshotData, elapsed: t2 } = await timed(
    "Step 2 – Screenshot Site",
    "step2_screenshotSite",
    () => step2_screenshotSite(siteUrl)
  );
  const screenshotBuffer = screenshotData.buffer;
  timings["step2_screenshotSite"] = fmtMs(t2);
  timings["step2_browserLaunch"] = `${screenshotData.browserLaunchMs}ms`;
  timings["step2_navigate"] = `${screenshotData.gotoMs}ms`;
  timings["step2_wait"] = `${screenshotData.waitMs}ms`;
  timings["step2_capture"] = `${screenshotData.screenshotMs}ms`;

  // Step 3
  let parsedRubric;
  if (rubricSource === "default") {
    parsedRubric = [
      { criterion: "Innovation & Originality", weight: 25 },
      { criterion: "Technical Implementation", weight: 30 },
      { criterion: "Impact & Feasibility", weight: 20 },
      { criterion: "Design & UX", weight: 15 },
      { criterion: "Presentation & Demo", weight: 10 }
    ];
    timings["step3_parseRubric"] = "0ms (cached default)";
  } else {
    const { result: pr, elapsed: t3 } = await timed(
      "Step 3 – Parse Rubric (Groq)",
      "step3_parseRubric",
      () => step3_parseRubric(rubricText)
    );
    parsedRubric = pr;
    timings["step3_parseRubric"] = fmtMs(t3);
  }

  // Step 4
  const { result: claims, elapsed: t4 } = await timed(
    `Step 4 – Extract Claims (Gemini) [${deck.mode}]`,
    "step4_extractClaims",
    () => step4_extractClaims(deck, screenshotBuffer)
  );
  timings["step4_extractClaims"] = fmtMs(t4);

  // Step 5
  const { result: consistency, elapsed: t5 } = await timed(
    "Step 5 – Check Consistency (Gemini Vision)",
    "step5_checkConsistency",
    () => step5_checkConsistency(screenshotBuffer, claims)
  );
  timings["step5_checkConsistency"] = fmtMs(t5);

  // Step 6
  const { result: scoreResult, elapsed: t6 } = await timed(
    "Step 6 – Score Submission (Gemini)",
    "step6_score",
    () => step6_score(parsedRubric, claims, consistency, problemStatement)
  );
  timings["step6_score"] = fmtMs(t6);

  return {
    meta: {
      deckLink,
      siteUrl,
      runAt: new Date().toISOString(),
      timings,
      rubricSource,
      problemStatement: problemStatement || null,
      deckMode: deck.mode,
      deckFileName: deckFileName || null,
      siteScreenshot: screenshotBuffer ? `data:image/png;base64,${screenshotBuffer.toString("base64")}` : null,
      deckScreenshot: deck.deckScreenshot ? `data:image/png;base64,${deck.deckScreenshot.toString("base64")}` : null,
      deckPdf: deck.pdfBuffer ? `data:application/pdf;base64,${deck.pdfBuffer.toString("base64")}` : null,
      coldStart: isColdStart
    },
    rubric: parsedRubric,
    claims,
    consistency,
    evaluation: scoreResult,
  };
}

// ─────────────────────────────────────────────
// EXPRESS SETUP
// ─────────────────────────────────────────────
const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// GET /api/health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Cold start tracking variables
let lastRequestTime = null;
let requestCount = 0;

// POST /api/review
app.post("/api/review", async (req, res) => {
  requestCount++;
  const currentTime = Date.now();
  const processUptime = process.uptime(); // uptime in seconds

  const isColdStart = (
    requestCount === 1 || 
    processUptime < 45 || 
    (lastRequestTime !== null && (currentTime - lastRequestTime) > 900_000)
  );

  lastRequestTime = currentTime;

  const { rubricText, deckLink, siteUrl, problemStatement, deckFile, deckFileName } = req.body;

  // Basic Validation
  if (rubricText !== undefined && rubricText !== null && typeof rubricText !== "string") {
    return res.status(400).json({
      error: "rubricText must be a string.",
      step: "validation"
    });
  }

  if (problemStatement !== undefined && problemStatement !== null && typeof problemStatement !== "string") {
    return res.status(400).json({
      error: "problemStatement must be a string.",
      step: "validation"
    });
  }

  if (!siteUrl || typeof siteUrl !== "string") {
    return res.status(400).json({
      error: "siteUrl is required.",
      step: "validation"
    });
  }

  try {
    new URL(siteUrl);
  } catch {
    return res.status(400).json({
      error: "siteUrl must be a valid absolute URL.",
      step: "validation"
    });
  }

  // Decode base64 deck file if uploaded
  let deckFileBuffer = null;
  if (deckFile && typeof deckFile === "string") {
    try {
      const matches = deckFile.match(/^data:.+;base64,(.*)$/);
      const base64Data = matches ? matches[1] : deckFile;
      deckFileBuffer = Buffer.from(base64Data, "base64");
    } catch (e) {
      return res.status(400).json({
        error: "deckFile could not be parsed as valid base64.",
        step: "validation"
      });
    }
  }

  const isRubricEmpty = !rubricText || !rubricText.trim();
  const rubricSource = isRubricEmpty ? "default" : "custom";
  const finalRubricText = isRubricEmpty
    ? "Innovation & Originality (25), Technical Implementation (30), Impact & Feasibility (20), Design & UX (15), Presentation & Demo (10)"
    : rubricText;

  // Optional deckLink normalization & validation
  let normalizedDeckLink = null;
  if (deckLink !== undefined && deckLink !== null) {
    const val = String(deckLink).trim();
    if (val && val.toLowerCase() !== "null") {
      try {
        new URL(val);
        normalizedDeckLink = val;
      } catch {
        return res.status(400).json({
          error: "deckLink must be a valid absolute URL, or null.",
          step: "validation"
        });
      }
    }
  }

  // Ensure keys are set before running
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({
      error: "GROQ_API_KEY is not configured on the server.",
      step: "configuration"
    });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured on the server.",
      step: "configuration"
    });
  }

  // 90-second timeout handling
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new Error("Pipeline execution timed out (exceeded 90 seconds limit).");
      err.statusCode = 504;
      err.step = "timeout";
      reject(err);
    }, 90_000);
  });

  try {
    const result = await Promise.race([
      runPipeline(finalRubricText, normalizedDeckLink, siteUrl, problemStatement || null, rubricSource, deckFileBuffer, deckFileName || null, isColdStart),
      timeoutPromise
    ]);
    clearTimeout(timeoutId);
    res.json(result);
  } catch (err) {
    clearTimeout(timeoutId);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      error: err.message || "An unexpected error occurred during review pipeline processing.",
      step: err.step || "unknown_pipeline_step"
    });
  }
});

// START SERVER
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`👉 CORS configured to allow origin: ${FRONTEND_URL}`);
});
