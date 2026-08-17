# ClearHire — AI-Powered Resume Analysis

AI-powered resume analysis using Groq's Llama 3.3 70B. Upload a resume (PDF or DOCX), get section-by-section feedback, keyword matching, summary rewrites, suggested bullet improvements, and a downloadable report.

## 🎯 Features

- **Resume Upload & Parsing**: Upload resumes as PDF or DOCX with automatic text extraction
- **AI-Powered Analysis**: Uses Groq's Llama 3.3 70B to analyze resume content comprehensively
- **Skills Matching**: Identifies and matches skills against job requirements
- **Keyword Analysis**: Groups and analyzes keyword density and relevance
- **Formatting Feedback**: Detects formatting issues and provides suggestions
- **Weak Bullet Optimization**: Identifies weak resume bullets and suggests improvements
- **Summary Rewriting**: AI-generated improvements for resume summaries
- **Score Visualization**: Get a visual score breakdown across multiple categories
- **Report Generation**: Export analysis results as markdown reports
- **Analysis History**: Track and manage previous resume analyses locally
- **Try a Sample Resume**: One click fills in a fictional resume + matching job description — lets anyone (including recruiters trying a live demo link) see a full analysis with no file needed
- **Keyboard Shortcut**: Ctrl/Cmd+Enter while typing runs the analysis

## 🛠️ Tech Stack

### Frontend

- **React** 19.2.4 - UI framework (Create React App / react-scripts 5.0.1)
- **Axios** 1.14.0 - HTTP client for API calls
- **pdf.js** 5.6.205 - PDF parsing and rendering
- **Mammoth** 1.8.0 - DOCX text extraction
- **Plain CSS** (custom properties, no framework) - theming for dark/light mode

### Backend

- **Node.js** (18+) - JavaScript runtime
- **Express** 5.2.1 - Web framework
- **Groq SDK** 1.5.0 - Llama 3.3 70B API integration
- **Helmet** 8.0.0 - Security headers
- **express-rate-limit** 7.5.0 - API rate limiting
- **CORS** 2.8.6 - Cross-origin resource sharing
- **dotenv** 17.4.0 - Environment variable management

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Groq API Key** — free, no card required ([get one here](https://console.groq.com/))

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm run install:all
```

This command installs dependencies for both the server and client applications.

### 2. Configure Environment Variables (secure)

You can store the Groq API key either in `server/.env` (for local development) or as an environment variable in your shell/CI. Do NOT commit secrets into the repository.

Option A — copy the example file and edit it (local development):

```bash
cp server/.env.example server/.env
# then edit server/.env and set GROQ_API_KEY
```

Option B — set the variable in your shell (recommended):

PowerShell (current shell only):

```powershell
$env:GROQ_API_KEY="YOUR_KEY"
npm start --prefix server
```

PowerShell (persist across sessions):

```powershell
setx GROQ_API_KEY "YOUR_KEY"
# Restart your terminal for the value to take effect
```

Bash / macOS / WSL:

```bash
export GROQ_API_KEY="YOUR_KEY"
npm start --prefix server
```

CI / Production: Use your provider's secrets store (GitHub Actions secrets, Vercel/Netlify/Heroku config vars, AWS Secrets Manager, etc.).

### 3. Run the Application

**Option A — Run separately in two terminals (recommended)**

Backend:

```bash
npm start --prefix server
```

Frontend:

```bash
npm start --prefix client
```

**Option B — Run both concurrently (single command)**

```bash
npm run dev
```

If `npm run dev` shows `spawn cmd.exe ENOENT` on Windows in some shells, run the two commands separately as in Option A.

### 4. Access the Application

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

## 📁 Project Structure

```
ClearHire/
├── client/                      # React Frontend
│   ├── public/                  # Static files
│   ├── src/
│   │   ├── Components/
│   │   │   ├── HistoryPanel.js         # History management UI
│   │   │   ├── ResumeUpload.js         # File upload component
│   │   │   └── results/                # Analysis result components
│   │   │       ├── AnalysisResult.js       # Main results display
│   │   │       ├── ChecklistCard.js        # Checklist items
│   │   │       ├── KeywordGroups.js        # Keyword analysis
│   │   │       ├── SkillsMatchBar.js       # Skills matching UI
│   │   │       ├── SectionFeedback.js      # Section-wise feedback
│   │   │       ├── TopImprovements.js      # Key improvements
│   │   │       ├── WeakBullets.js          # Weak bullet detection
│   │   │       ├── FormattingWarnings.js   # Formatting issues
│   │   │       └── ScoreCircle.js          # Score visualization
│   │   ├── pages/
│   │   │   └── Home.js                 # Main page
│   │   ├── services/
│   │   │   └── api.js                  # API service layer
│   │   ├── utils/
│   │   │   ├── buildMarkdownReport.js  # Report generation
│   │   │   ├── historyStorage.js       # Local storage management
│   │   │   ├── PdfParser.js            # PDF/DOCX text extraction
│   │   │   └── sampleResume.js         # "Try a sample" demo data
│   │   ├── hooks/
│   │   │   └── useTheme.js             # Theme management
│   │   ├── App.js
│   │   ├── index.js
│   │   └── styles.css
│   └── package.json
│
├── server/                      # Express Backend
│   ├── index.js                 # Main entry — API routes + serves client/build in production
│   ├── .env                     # Environment variables (not in repo)
│   ├── .env.example             # Environment template
│   ├── lib/
│   │   └── normalizeAnalysis.js # Response normalization
│   ├── prompts/
│   │   ├── analyze.js           # Resume analysis prompt
│   │   └── rewrite.js           # Content rewriting prompts
│   └── package.json
│
├── package.json                 # Root workspace configuration
├── LICENSE
└── README.md                    # This file
```

## 🔌 API Endpoints

### `POST /api/analyze`

Analyzes a resume and returns detailed feedback.

**Request Body:**

```json
{
  "resumeText": "Full resume text content",
  "jobDescription": "Job description (optional)"
}
```

**Response:**

```json
{
  "score": 85,
  "atsScore": 78,
  "matchScore": 82,
  "summary": "...",
  "strengths": [],
  "suggestions": [],
  "weakBullets": []
}
```

### `POST /api/rewrite-bullet`

Improves a specific resume bullet point.

### `POST /api/improve-summary`

Suggests improvements to the resume summary section.

### `POST /api/interview-questions`

Generates tailored interview questions based on the resume.

### `POST /api/cover-letter`

Generates a cover letter based on resume and job description.

### `GET /api/health`

Health check — returns model name and API key status.

## 🔐 Security & Secrets

- **Rotate keys if exposed**: If an API key is accidentally committed, shared, or pasted anywhere outside your own machine, revoke it immediately in the [Groq console](https://console.groq.com/) and create a new key.
- **Do not commit `.env`**: `server/.env` is present in `.gitignore` in this repo. Keep secrets out of version control.
- **Use environment variables or secret managers**: For production, provide `GROQ_API_KEY` via your cloud provider or CI secrets.
- **CLIENT_ORIGIN**: In production, set `CLIENT_ORIGIN` to your frontend URL. The server will reject requests with an undefined origin if this isn't set.

## 🧪 Testing

```bash
npm test --prefix client    # React component / utility tests (Jest + React Testing Library)
npm test --prefix server    # Server-side unit tests (Node's built-in test runner, no extra deps)
```

## 📊 Available Scripts

### Root Level

```bash
npm run install:all     # Install dependencies for server and client
npm run dev              # Run both server and client concurrently (separate dev servers)
npm run build            # Install client deps and build client/ (for single-service deploys)
npm start                 # Run the server, serving client/build if present
```

### Server

```bash
npm start               # Start the backend server
npm run dev             # Start backend (same as npm start)
npm test                 # Run server-side unit tests
```

### Client

```bash
npm start               # Start React development server
npm run build           # Build for production
npm test                # Run tests
npm run eject           # Eject from Create React App (one-way operation)
```

## 🚀 Deployment

As of this version, the Express server can serve the built React client itself.
Single service deployment:

### Option A — Render / Railway / Heroku (single service)

These platforms run `npm install` then a build/start script — the root
`package.json` is already set up for this:

- **Build command**: `npm run build` (installs client deps and builds it)
- **Start command**: `npm start` (runs `node server/index.js`, which serves
  both the API and the built client)
- Set `GROQ_API_KEY` and `CLIENT_ORIGIN` as environment variables in your
  platform's dashboard — never in a committed file
- Heroku specifically will run `heroku-postbuild` automatically, so no extra
  config is needed beyond setting the env vars

### Option B — Separate frontend/backend hosting

If you'd rather host the client and server separately (e.g. client on
Vercel/Netlify, server on Render):

```bash
npm run build --prefix client
```

This creates an optimized production build in `client/build` — deploy that
directory as a static site. For the backend: set `NODE_ENV=production`,
set `CLIENT_ORIGIN` to your frontend's URL (for CORS), and deploy
`server/` to your preferred Node.js host.

## 🐛 Troubleshooting

Issue: `GROQ_API_KEY is not set`

```text
Check /api/health — if hasApiKey=false, set GROQ_API_KEY in your shell or server/.env
```

Issue: Port 3000 or 5000 already in use

```bash
PORT=3001 npm start --prefix client
```

Issue: `spawn cmd.exe ENOENT` when running `npm run dev` on Windows

Run the server and client in separate terminals (see Option A above).

Issue: PDF/DOCX parsing fails

Try with a different file and check the browser console for parsing errors.

## 📚 Additional Resources

- [Groq API Documentation](https://console.groq.com/docs)
- [Create React App Documentation](https://create-react-app.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)

## 📄 License

ISC — see [LICENSE](./LICENSE).

---

Made with ❤️ — ClearHire, AI-powered resume analysis.
