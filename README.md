# Resume Analyzer

AI-powered resume analysis using Anthropic Claude. Upload a resume (PDF), get section-by-section feedback, keyword matching, summary rewrites, suggested bullet improvements, and a downloadable report.

## 🎯 Features

- **Resume Upload & PDF Parsing**: Upload resumes in PDF format with automatic text extraction
- **AI-Powered Analysis**: Uses Anthropic Claude to analyze resume content comprehensively
- **Skills Matching**: Identifies and matches skills against job requirements
- **Keyword Analysis**: Groups and analyzes keyword density and relevance
- **Formatting Feedback**: Detects formatting issues and provides suggestions
- **Weak Bullet Optimization**: Identifies weak resume bullets and suggests improvements
- **Summary Rewriting**: AI-generated improvements for resume summaries
- **Score Visualization**: Get a visual score breakdown across multiple categories
- **Report Generation**: Export analysis results as markdown reports
- **Analysis History**: Track and manage previous resume analyses locally

## 🛠️ Tech Stack

### Frontend

- **React** 19.2.4 - UI framework
- **Axios** 1.14.0 - HTTP client for API calls
- **pdf.js** 5.6.205 - PDF parsing and rendering
- **React Scripts** 5.0.1 - Create React App tooling

### Backend

- **Node.js** - JavaScript runtime
- **Express** 5.2.1 - Web framework
- **Anthropic SDK** 0.82.0 - Claude AI API integration
- **CORS** 2.8.6 - Cross-origin resource sharing
- **dotenv** 17.4.0 - Environment variable management

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **Anthropic API Key** for Claude access ([Get one here](https://console.anthropic.com/))

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm run install:all
```

This command installs dependencies for both the server and client applications.

### 2. Configure Environment Variables (secure)

You can store the Anthropic API key either in `server/.env` (for local development) or as an environment variable in your shell/CI. Do NOT commit secrets into the repository.

Option A — copy the example file and edit it (local development):

```bash
cp server/.env.example server/.env
# then edit server/.env and set ANTHROPIC_API_KEY
```

Option B — set the variable in your shell (recommended):

PowerShell (current shell only):

```powershell
$env:ANTHROPIC_API_KEY="YOUR_KEY"
npm start --prefix server
```

PowerShell (persist across sessions):

```powershell
setx ANTHROPIC_API_KEY "YOUR_KEY"
# Restart your terminal for the value to take effect
```

Bash / macOS / WSL:

```bash
export ANTHROPIC_API_KEY="YOUR_KEY"
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
resume-analyzer/
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
│   │   │   └── PdfParser.js            # PDF text extraction
│   │   ├── hooks/
│   │   │   └── useTheme.js             # Theme management
│   │   ├── App.js
│   │   ├── index.js
│   │   └── styles.css
│   └── package.json
│
├── server/                      # Express Backend
│   ├── index.js                 # Main server entry point
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
  "score": {
    "overall": 85,
    "formatting": 90,
    "content": 85,
    "impact": 75
  },
  "keywordAnalysis": { ... },
  "sections": { ... },
  "improvementSuggestions": [],
  "weakBullets": []
}
```

### `POST /api/rewrite-bullet`

Improves a specific resume bullet point.

### `POST /api/improve-summary`

Suggests improvements to the resume summary section.

## 🔐 Security & Secrets

- **Rotate keys if exposed**: If an API key is accidentally committed or pasted into chat, revoke it immediately in the Anthropic console and create a new key.
- **Do not commit `.env`**: `server/.env` is present in `.gitignore` in this repo. Keep secrets out of version control.
- **Use environment variables or secret managers**: For production, provide `ANTHROPIC_API_KEY` via your cloud provider or CI secrets.
- **Removing secrets from git history**: If you accidentally committed a secret and need to erase it from history, use a history-rewriting tool such as `git filter-repo` or BFG. This is destructive; coordinate with collaborators.

Example (BFG — destructive):

```bash
# Remove the file from history
bfg --delete-files server/.env
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

Only run the above after rotating keys and understanding the impact.

## 📊 Available Scripts

### Root Level

```bash
npm run install:all     # Install dependencies for server and client
npm run dev             # Run both server and client concurrently
```

### Server

```bash
npm start               # Start the backend server
npm run dev             # Start backend (same as npm start)
```

### Client

```bash
npm start               # Start React development server
npm run build           # Build for production
npm test                # Run tests
npm run eject           # Eject from Create React App (one-way operation)
```

## 🚀 Deployment

### Frontend (Client)

```bash
npm run build --prefix client
```

This creates an optimized production build in the `client/build` directory.

### Backend (Server)

1. Set `NODE_ENV=production` in your `.env`
2. Update `CLIENT_ORIGIN` to your production frontend URL
3. Deploy using your preferred Node.js hosting (Heroku, AWS, DigitalOcean, etc.)

## 🐛 Troubleshooting

Issue: `ANTHROPIC_API_KEY is not set`

```text
Check /api/health — if hasApiKey=false, set ANTHROPIC_API_KEY in your shell or server/.env
```

Issue: Port 3000 or 5000 already in use

```bash
PORT=3001 npm start --prefix client
```

Issue: `spawn cmd.exe ENOENT` when running `npm run dev` on Windows

Run the server and client in separate terminals (see Option A above).

Issue: PDF parsing fails

Try with a different PDF and check browser console for parsing errors.

## 📚 Additional Resources

- [Anthropic Claude API Documentation](https://docs.anthropic.com/)
- [Create React App Documentation](https://create-react-app.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)

## 📝 Notes

- The application stores analysis history in browser local storage
- Markdown reports can be exported for external use
- The AI analysis quality depends on resume clarity and Claude model capabilities
- Rate limits apply based on your Anthropic API plan

## 📄 License

ISC

## 🤝 Support

If you need help I can:

- Revoke or rotate an exposed key (show steps)
- Remove any remaining secrets from files in this repo
- Help configure CI secrets for deployment

---

Happy Resume Analyzing! 📄✨
