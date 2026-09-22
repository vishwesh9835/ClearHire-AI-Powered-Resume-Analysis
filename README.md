# ClearHire — AI-Powered Resume Analysis & Career Intelligence 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-000000.svg?logo=express&logoColor=white)](https://expressjs.com/)
[![Groq](https://img.shields.io/badge/AI-Groq%20Llama%203.3-f55036.svg)](https://console.groq.com/)

**ClearHire** is a modern, privacy-first career intelligence platform that gives job seekers recruiter-grade resume critiques, ATS compatibility evaluations, tailored keyword gap analysis, AI bullet enhancements, summary rewrites, interview preparation, and custom cover letters in seconds.

Powered by Groq's high-throughput Llama 3.3 70B inference engine.

---

## 🎯 Features

- **Multi-Format Resume Ingestion**: Upload text-based PDF or DOCX files with automatic layout-aware text extraction, or paste plain text directly.
- **ATS Readiness Scoring & Rubric**: Strict 0–100 ATS scoring with checks for parsing obstacles (tables, multi-column layouts, unconventional headers, and keyword densities).
- **Targeted Job Match & Keyword Gap Analysis**: Compare resumes against job descriptions to discover missing technical skills, tools & platforms, and soft skills.
- **Section-by-Section Feedback**: Structured evaluation of Summary, Work Experience, Education, and Projects with specific strengths and areas for improvement.
- **Weak Bullet Point Rewriter**: Identifies underperforming resume bullets (lacking metrics or action verbs) and rewrites them for measurable impact.
- **Summary Improver**: Automatically extracts the candidate's existing summary or accepts pasted text, tightening it into 3–5 high-impact opening lines.
- **Personalized Interview Preparation**: Generates STAR-method behavioral questions, technical probes, role-specific questions, and personalized prep tips.
- **Tailored Cover Letter Generator**: Writes natural, human-sounding cover letters tailored to the target job description across multiple selectable tones (*Professional*, *Enthusiastic*, *Concise*).
- **Fast Same-Origin PDF Processing**: Zero external CDN runtime dependencies — PDF.js web workers are automatically vendored at build time to comply with strict Content Security Policies.
- **Local History & Markdown Export**: Save up to 20 past runs in browser `localStorage` and copy full Markdown audit reports to your clipboard with a single click.
- **Clean Design System**: Premium dark/light theme switching with custom CSS design tokens, smooth canvas-rendered score animations, and stroke icon graphics.
- **Privacy by Default**: Resume files are never stored on any server. Analysis runs ephemerally, API keys stay on the backend, and history remains strictly local.

---

## 🛠️ Tech Stack

### Frontend
- **React 19.2** — Modern component architecture and reactive state management.
- **PDF.js (`pdfjs-dist`) 5.7** — Client-side PDF text extraction with custom baseline-grouping algorithms that preserve layout and token boundaries.
- **Mammoth.js** — Word (.docx) raw document text extractor.
- **Axios** — Robust API client with environment-aware baseURL resolution.
- **Vanilla CSS** — Custom design tokens, dark/light theme variables, micro-animations, and zero framework overhead.
- **Jest & React Testing Library** — Comprehensive frontend unit and component test suites.

### Backend
- **Node.js (v20+ / v24.x)** — High-performance JavaScript runtime.
- **Express 5.2** — Next-generation HTTP routing framework.
- **Groq SDK 1.5** — Ultra-fast inference with intelligent fallback model chaining (`groq/compound`, `llama-3.3-70b-versatile`, `llama3-70b-8192`).
- **Helmet 8.0** — Advanced HTTP security headers including strict Content-Security-Policy (CSP).
- **express-rate-limit 7.5** — Tiered rate limiting protecting AI endpoints against abuse.
- **CORS 2.8** — Configurable origin protection for standalone or decoupled architectures.
- **Node Test Runner (`node:test`)** — Built-in native unit test runner.

---

## 📁 Repository Structure

```text
ClearHire/
├── .gitignore                     # Git ignore rules (deps, builds, env, vendored workers)
├── LICENSE                        # MIT License
├── Procfile                       # Process configuration for Heroku/Dokku
├── README.md                      # Project documentation
├── package.json                   # Root workspace scripts & dev dependencies
├── vercel.json                    # Vercel serverless routing & build configuration
│
├── api/                           # Serverless Adapter
│   └── index.js                   # Vercel serverless export for Express backend
│
├── client/                        # React Frontend Application
│   ├── public/                    # Static public assets (HTML, favicon, manifest)
│   ├── scripts/
│   │   └── copy-pdf-worker.js     # Build hook to vendor pdf.worker.min.mjs
│   ├── src/
│   │   ├── Components/            # Reusable UI components
│   │   │   ├── ErrorBoundary.js   # Client error boundary
│   │   │   ├── HistoryPanel.js    # Local analysis history drawer
│   │   │   ├── Icon.js            # Unified SVG icon library
│   │   │   ├── ResumeUpload.js    # Primary drag-and-drop & paste interface
│   │   │   └── results/           # Analysis presentation components
│   │   │       ├── AnalysisResult.js
│   │   │       ├── ChecklistCard.js
│   │   │       ├── CoverLetter.js
│   │   │       ├── FormattingWarnings.js
│   │   │       ├── InterviewQuestions.js
│   │   │       ├── KeywordGroups.js
│   │   │       ├── ScoreCircle.js
│   │   │       ├── SectionFeedback.js
│   │   │       ├── SkillsMatchBar.js
│   │   │       ├── StickyReportActions.js
│   │   │       ├── SummaryImprover.js
│   │   │       ├── TopImprovements.js
│   │   │       └── WeakBullets.js
│   │   ├── hooks/
│   │   │   └── useTheme.js        # Theme state & localStorage synchronization
│   │   ├── pages/
│   │   │   └── Home.js            # Main view & header
│   │   ├── services/
│   │   │   └── api.js             # Client API service
│   │   ├── utils/
│   │   │   ├── buildMarkdownReport.js
│   │   │   ├── historyStorage.js
│   │   │   ├── pdfTextExtraction.js
│   │   │   ├── PdfParser.js
│   │   │   └── sampleResume.js
│   │   ├── App.js
│   │   ├── index.css
│   │   ├── index.js
│   │   └── styles.css             # Unified application styles & design tokens
│   └── package.json
│
└── server/                        # Express Backend Application
    ├── lib/
    │   ├── normalizeAnalysis.js   # Response sanitization, clamping & schema normalization
    │   └── normalizeAnalysis.test.js
    ├── prompts/
    │   ├── analyze.js             # Structured prompt for full resume review
    │   └── rewrite.js             # Prompts for bullets, summaries, questions & letters
    ├── index.js                   # Express server, route definitions, fallbacks & static SPA server
    ├── .env.example               # Environment variables template
    └── package.json
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v24.x recommended)
- **npm**: v9.0.0 or higher
- **Groq API Key**: Free API key with no credit card required. Obtain one at [console.groq.com](https://console.groq.com/).

### 2. Installation
Clone the repository and install all dependencies across workspace packages:
```bash
git clone https://github.com/vishwesh9835/ClearHire-AI-Powered-Resume-Analysis.git
cd ClearHire
npm run install:all
```

### 3. Environment Configuration
Create your server environment file from the template:
```bash
cp server/.env.example server/.env
```

Open `server/.env` and set your key:
```env
PORT=5000
NODE_ENV=development
GROQ_API_KEY=gsk_your_groq_api_key_here
CLIENT_ORIGIN=http://localhost:3000
```

### 4. Running the Development Server
Run backend and frontend concurrently:
```bash
npm run dev
```

Alternatively, run each in separate terminals:
```bash
# Terminal 1: Backend API (:5000)
npm start --prefix server

# Terminal 2: React Dev Server (:3000)
npm start --prefix client
```

Navigate to **http://localhost:3000** in your browser.

---

## 🔌 API Reference

All requests and responses use JSON. Sensitive endpoints are rate-limited.

| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| `POST` | `/api/analyze` | Full resume review, scoring, keyword gaps, and feedback | 5 req / min |
| `POST` | `/api/rewrite-bullet` | Rewrites an individual bullet point for impact & metrics | 30 req / 15 min |
| `POST` | `/api/improve-summary` | Rewrites a candidate's professional opening summary | 30 req / 15 min |
| `POST` | `/api/interview-questions`| Generates STAR behavioral, technical, and role questions | 5 req / min |
| `POST` | `/api/cover-letter` | Generates a tailored cover letter (custom tone) | 5 req / min |
| `GET` | `/api/health` | Health check, API key presence, and active model check | 30 req / 15 min |

### Example Request (`POST /api/analyze`)
```json
{
  "resumeText": "Alex Mercer\nSenior Software Engineer\n- Developed web services...",
  "jobDescription": "Looking for a Senior Full Stack Engineer with React, Node.js, and AWS experience...",
  "tailorMode": true
}
```

---

## 🧪 Testing

Both client and server include isolated, automated test suites.

```bash
# Run all client tests (Jest / React Testing Library)
npm test --prefix client -- --watchAll=false

# Run all server tests (Native Node.js test runner)
npm test --prefix server
```

---

## 🚢 Production Deployment

ClearHire is architected to support both single-service unified deployments and separated micro-deployments.

### Option 1: Unified Single-Service Deployment (Render / Railway / Heroku)
In this mode, the Express server builds the React app and serves the compiled static bundle from `client/build` alongside `/api/*`.

1. **Build command**: `npm run build`
2. **Start command**: `npm start`
3. **Environment variables**:
   - `GROQ_API_KEY`: Your production Groq API key
   - `NODE_ENV`: `production`
   - `CLIENT_ORIGIN`: Your production application URL (e.g. `https://clearhire.onrender.com`)

### Option 2: Decoupled Deployment (Vercel / Netlify + Render API)
1. **Frontend**: Deploy `client/` to Vercel/Netlify. Set `REACT_APP_API_URL=https://your-backend-api.com/api`.
2. **Backend**: Deploy `server/` to Render/Railway. Set `CLIENT_ORIGIN=https://your-frontend-domain.com`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Copyright © 2026 Vishwesh Rajopadhye.
