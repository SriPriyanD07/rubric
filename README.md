# Rubrics

AI-powered judging pipeline and interactive dashboard to validate pitch deck claims and check visual live-site consistency for hackathon submissions.

---

## Repository Structure

This repository is set up as a monorepo consisting of two key directories:

*   **`/api`**: Express.js backend scoring engine. It runs the 6-step AI pipeline using Playwright (Chromium screenshot capture), Groq (Rubric parser), and Gemini (Claims extraction, visual consistency verification, and evaluation).
*   **`/web`**: Next.js (App Router, Tailwind CSS, shadcn/ui) frontend dashboard. Features a global interactive canvas grid background (`DotField`), ribbon trails (`Ribbons`), a submission flow page, and a full-width results analytics console.

---

## Fresh Setup Guide

Follow these steps to run the complete Rubrics stack locally:

### 1. Configure Environment Variables
Copy the `.env.example` templates to `.env` in both application folders:

*   **For the Backend (`/api`):**
    ```bash
    cp api/.env.example api/.env
    ```
    Open `api/.env` and supply your API keys:
    *   `GROQ_API_KEY`: Get your key from [Groq Console](https://console.groq.com).
    *   `GEMINI_API_KEY`: Get your key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   `PORT`: `3001` (default backend port).
    *   `FRONTEND_URL`: `http://localhost:3000` (default frontend URL).

*   **For the Frontend (`/web`):**
    ```bash
    cp web/.env.example web/.env.local
    ```
    Open `web/.env.local` and configure:
    *   `NEXT_PUBLIC_API_URL`: `http://localhost:3001` (pointing to the backend service).

---

### 2. Install Dependencies
Run `npm install` inside both directories to pull down dependencies:

*   **Backend (`/api`):**
    ```bash
    cd api
    npm install
    # Download Playwright Chromium binary
    npx playwright install chromium
    ```

*   **Frontend (`/web`):**
    ```bash
    cd ../web
    npm install
    ```

---

### 3. Start the Application

To run the full stack locally:

1.  **Launch the Backend API Server:**
    ```bash
    cd api
    npm start
    ```
    The server will boot on port `3001` (`🚀 Server running on port 3001`).

2.  **Launch the Next.js Web Dev Server:**
    ```bash
    cd web
    npm run dev
    ```
    The frontend will boot on port `3000` (`http://localhost:3000`).

---

## 🛠️ Tech Stack Details

*   **Backend:** Node.js, Express, Playwright, Groq (`llama-3.3-70b-versatile`), Gemini (`gemini-3.1-flash-lite`).
*   **Frontend:** React 19, Next.js 16 (Turbopack), Tailwind CSS, Framer Motion, OGL (for Ribbon cursor trails).
