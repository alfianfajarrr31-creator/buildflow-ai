# BuildFlow AI — Construction Timelapse Prompt Generator

BuildFlow AI is an advanced, high-performance web utility built specifically for construction content creators, visual layout artists, and general site planners. It automates the generation of sequential, locked-perspective camera blueprints ready to feed visual diffusion architectures like Kling AI, Luma Dream Machine, Runaway Gen-3, or Sora.

The prompt engine is structurally optimized to maintain identical background elements and consistent ambient daylight while demonstrating gradual, step-by-step progressive building milestones driven by real physical workers.

---

## 🚀 Key Deployment Architecture

BuildFlow AI is a high-performance full-stack application. It can be deployed across container architectures, server environments, and natively on serverless platforms:

### ⚡ 1. Serverless Deployment via Vercel (Recommended)
BuildFlow AI is fully compatible with **Vercel Serverless Functions**. All endpoints are declared under the `/api` directory using edge-ready Node.js APIs to prevent any 404 router issues:
- **Set Environment Variables on Vercel Dashboard:**
  - `GEMINI_API_KEY`: *(Required for live generation)*
  - `GEMINI_MODEL`: `gemini-2.5-flash` or `gemini-1.5-pro`
- **Verification Links on Vercel:**
  - Health check: `https://your-domain.vercel.app/api/health` (returns `{ "ok": true, "service": "BuildFlow AI", "mode": "vercel-function" }`)
  - Live AI packaging: `https://your-domain.vercel.app/api/generate` (handles POST requests safely)

### 🐋 2. Standard Container or Dedicated Server
For standard runtime servers that maintain a single Node process (e.g., Google Cloud Run, Railway, Render, Heroku):
- Set environment variables as required.
- Standard ports bind dynamically. No heavy setup needed.

---

## 🔒 Security & API Safety
1. **No Client Leakage:** The secret generative credentials are kept strictly server-side. No API keys are leaked into browser network trunks or client console frames. There are **zero** instances of `import.meta.env.VITE_GEMINI_API_KEY` or client exposure.
2. **Dynamic Configuration:** The API and frontend communicate solely using JSON bodies via `/api/generate`, validating parameters before calling the generative provider.

---

## 🛠️ Local Development & Scripts

### 1. Prerequisites
Ensure you have Node.js (18+) installed.

### 2. Configure Environment Secrets
Duplicate the template file to declare your model configurations:
```bash
cp .env.example .env
```
Open `.env` and fill in your Gemini API Key:
```env
GEMINI_API_KEY=your_actual_key_here
GEMINI_MODEL=gemini-3.5-flash
```

### 3. Core Commands
Run the following tasks locally:
* **Install Dependencies:**
  ```bash
  npm install
  ```
* **Run in Development Mode:**
  ```bash
  npm run dev
  ```
  *(Launches the custom Node server with on-the-fly Vite middleware binding to port `3000`)*
* **Lint Code & Check Types:**
  ```bash
  npm run lint
  ```
* **Build for Production:**
  ```bash
  npm run build
  ```
  *(Compiles the static frontend into `dist/` and bundles `server.ts` into a self-contained production file at `dist/server.cjs`)*
* **Start Production Built Application:**
  ```bash
  npm run start
  ```

---

## ✅ Functional Verification Testing Guide

### Test Generative Flow (With API Key Loaded)
1. Set a valid `GEMINI_API_KEY` in your `.env` file.
2. Restart the app using `npm run dev`.
3. Provide a site description (e.g., *"A red A-frame modern forestry cabin built on rock slabs"*).
4. Select your preferred camera view and click **Generate Prompt Package**.
5. Receive structured 5-scene prompt outputs directly from Gemini.

### Test Safe Generation Fallback (Without API Key / Network Failures)
1. Wipe or omit `GEMINI_API_KEY` from your local configuration.
2. Trigger the generator. The client detects the missing configuration from the endpoint response and shows a clean, elegant visual alert: **"Live Gemini Generation Failed"**.
3. Underneath the warning, click the **Run Local Offline Builder** or use the **Instant Offline Generator** buttons.
4. The offline engine takes over, animating simulated physical milestones and returning robust locked-POV prompt templates customized to your inputs immediately.

### Test Export & Multi-copy Tools
* **Copy All Output:** Click the *Copy All Output* button. It structures all 5 scenes, parameters, and social captions into a beautifully indented plain text file in your clipboard.
* **Export to Markdown (.md):** Click *Export as Markdown*. The utility packages all parameters, camera guidelines, structural steps, code blocks, and social copy into an immediate `.md` document download without any heavy dependencies.
