# Rubric

**Know your score before the judges do.**

Rubric is an AI-powered evaluation pipeline that checks whether a hackathon (or pitch deck) submission's *claims* actually match its *live, deployed reality* — automatically extracting factual claims from a pitch deck, screenshotting the live site, and running a visual consistency check between what was promised and what was shipped.

🔗 **Live app:** [rubric-one.vercel.app](https://rubric-one.vercel.app/)  
👤 **Built by:** [Sri Priyan D](https://sripriyand-portfolio.vercel.app/) · [LinkedIn](https://www.linkedin.com/in/sripriyandandayuthapani) · [GitHub](https://github.com/SriPriyanD07)

---

## Why this exists

Hackathon judges (and VCs, for that matter) routinely score submissions against criteria under serious time pressure — and decks frequently claim more than the live product actually delivers. Manually verifying "does the deck's claim match the deployed site" doesn't scale across dozens of submissions.

Rubric automates that verification step: paste the judging rubric, provide a deck link and a live URL, and get back a scored breakdown of exactly where claims and reality diverge — before a human judge finds the gap for you.

This is the same underlying pattern (claim extraction → verification against real artifacts → structured scoring) used by AI-powered VC due-diligence tooling, applied here at hackathon scale. Validated with a pre-build user survey before development started; the input model is intentionally link-only to keep submission friction and privacy exposure minimal.

---

## How it works — a 6-step pipeline

| Step | What happens |
|---|---|
| 1. Rubric parsing | Paste judging criteria — the pipeline splits criteria and distributes point weights evenly if not explicitly specified (Groq, `llama-3.3-70b-versatile`) |
| 2. Deck + live site ingestion | Submit a pitch deck link and a live site URL |
| 3. Screenshot capture | Playwright (headless Chromium) renders and screenshots the live site instantly |
| 4. Claim extraction | Gemini extracts factual, checkable claims from the deck |
| 5. Visual consistency check | Gemini cross-verifies extracted claims against the live-site screenshot |
| 6. Scoring & gaps | A three-state consistency schema — **supported / contradicted / unverifiable** — scores the submission and surfaces actionable gaps |

---

## Repository Structure

This repository is a monorepo with two apps:

- **`/api`** — Express.js backend scoring engine. Runs the 6-step AI pipeline using Playwright (Chromium screenshot capture), Groq (rubric parsing), and Gemini (claim extraction, visual consistency verification, and evaluation).
- **`/web`** — Next.js (App Router, Tailwind CSS, shadcn/ui) frontend dashboard. Includes an interactive canvas grid background (`DotField`), ribbon cursor trails (`Ribbons`), a submission flow page, and a full-width results analytics console.

---

## Tech Stack

- **Backend:** Node.js, Express, Playwright, Groq (`llama-3.3-70b-versatile`), Gemini (`gemini-3.1-flash-lite`)
- **Frontend:** React 19, Next.js 16 (Turbopack), Tailwind CSS, Framer Motion, OGL (cursor trails)
- **Deployment:** Vercel

---

## Fresh Setup Guide

Follow these steps to run the complete Rubric stack locally.

### 1. Configure Environment Variables

Copy the `.env.example` templates to `.env` in both application folders:

**Backend (`/api`):**
```bash
cp api/.env.example api/.env
```
Open `api/.env` and supply your API keys:
- `GROQ_API_KEY` — from [Groq Console](https://console.groq.com)
- `GEMINI_API_KEY` — from [Google AI Studio](https://aistudio.google.com/app/apikey)
- `PORT` — `3001` (default backend port)
- `FRONTEND_URL` — `http://localhost:3000` (default frontend URL)

**Frontend (`/web`):**
```bash
cp web/.env.example web/.env.local
```
Open `web/.env.local` and configure:
- `NEXT_PUBLIC_API_URL` — `http://localhost:3001` (points to the backend service)

### 2. Install Dependencies

**Backend (`/api`):**
```bash
cd api
npm install
npx playwright install chromium   # downloads the Playwright Chromium binary
```

**Frontend (`/web`):**
```bash
cd ../web
npm install
```

### 3. Start the Application

**Launch the backend API server:**
```bash
cd api
npm start
```
Boots on port `3001` (`🚀 Server running on port 3001`).

**Launch the Next.js web dev server:**
```bash
cd web
npm run dev
```
Boots on port `3000` (`http://localhost:3000`).

---

## Roadmap

- **v1.0 (current):** Participant-facing self-check tool — link-only submission, single-user scoring flow.
- **v2.0 (planned):** Organizer-facing layer — batch submission review, leaderboard/analytics dashboard for hackathon organizers. Deferred pending further traction on v1.

---

## License

MIT — see [LICENSE](LICENSE) for details.
