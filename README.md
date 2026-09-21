# ClearHire — AI-Powered Resume Analysis 🚀

AI-powered resume analysis using Groq's Llama 3.3. Upload a resume (PDF or DOCX), get section-by-section feedback, keyword matching, summary rewrites, suggested bullet improvements, and a downloadable report.

## 🎯 Features

- **Resume Upload & Parsing**: Upload resumes as PDF or DOCX with automatic text extraction.
- **AI-Powered Analysis**: Leverages Groq's Llama 3.3 for comprehensive resume content analysis.
- **Skills Matching**: Identifies and matches skills against job requirements.
- **Keyword Analysis**: Groups and analyzes keyword density and relevance.
- **Formatting Feedback**: Detects formatting issues and provides actionable suggestions.
- **Weak Bullet Optimization**: Identifies weak resume bullets and suggests improvements.
- **Summary Rewriting**: Generates AI-powered improvements for resume summaries.
- **Score Visualization**: Provides a visual breakdown of scores across multiple categories.
- **Report Generation**: Exports analysis results as downloadable Markdown reports.
- **Analysis History**: Tracks and manages previous resume analyses locally in the browser.
- **Sample Resume Demo**: One-click functionality to populate with a fictional resume and job description for immediate analysis.
- **Keyboard Shortcut**: Analyze with `Ctrl/Cmd+Enter` while typing.

## 🛠️ Tech Stack

### Frontend

- **React** 19.2.4 - UI framework (Create React App / `react-scripts` 5.0.1)
- **Axios** 1.14.0 - HTTP client for API calls
- **pdf.js** 5.6.205 - PDF parsing and rendering
- **Mammoth** 1.8.0 - DOCX text extraction
- **Plain CSS** (custom properties, no framework) - Theming for dark/light mode support.

### Backend

- **Node.js** (v24.x) - JavaScript runtime
- **Express** 5.2.1 - Web framework
- **Groq SDK** 1.5.0 - Integration with Llama 3.3 70B API
- **Helmet** 8.0.0 - Security headers for Express
- **express-rate-limit** 7.5.0 - API rate limiting
- **CORS** 2.8.6 - Cross-origin resource sharing middleware
- **dotenv** 17.4.0 - Environment variable management

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Groq API Key**: Free, no card required. ([Get yours here](https://console.groq.com/))

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm run install:all
```

This command installs dependencies for both the server and client applications.

### 2. Configure Environment Variables (Securely!)

Store your `GROQ_API_KEY` either in `server/.env` (for local development) or as an environment variable in your deployment environment. **Never commit secrets into the repository.**

**Option A: Local Development (`server/.env`)**

```bash
cp server/.env.example server/.env
# Then edit server/.env and set GROQ_API_KEY
```

**Option B: Shell Export (Recommended for quick testing)**

*   **Bash / macOS / WSL:**
    ```bash
    export GROQ_API_KEY="YOUR_KEY"
    npm start --prefix server
    ```
*   **PowerShell (current shell only):**
    ```powershell
    $env:GROQ_API_KEY="YOUR_KEY"
    npm start --prefix server
    ```

**Production / CI:** Use your platform's secrets management (e.g., GitHub Actions secrets, Vercel/Netlify/Heroku config vars).

### 3. Run the Application

**Option A: Separate Terminals (Recommended)**

*   **Backend:**
    ```bash
    npm start --prefix server
    ```
*   **Frontend:**
    ```bash
    npm start --prefix client
    ```

**Option B: Concurrent Execution**

```bash
npm run dev
```

*(Note: If `npm run dev` fails with `spawn cmd.exe ENOENT` on Windows, use Option A.)*

### 4. Access the Application

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

## 📁 Project Structure

```
ClearHire/
├── client/                      # React Frontend
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── Components/          # Reusable UI components
│   │   │   ├── HistoryPanel.js
│   │   │   ├── ResumeUpload.js
│   │   │   └── results/          # Analysis result components
│   │   │       ├── AnalysisResult.js
│   │   │       ├── ChecklistCard.js
│   │   │       ├── KeywordGroups.js
│   │   │       ├── SkillsMatchBar.js
│   │   │       ├── SectionFeedback.js
│   │   │       ├── TopImprovements.js
│   │   │       ├── WeakBullets.js
│   │   │       ├── FormattingWarnings.js
│   │   │       └── ScoreCircle.js
│   │   ├── pages/
│   │   │   └── Home.js                 # Main application page
│   │   ├── services/
│   │   │   └── api.js                  # API interaction layer
│   │   ├── utils/
│   │   │   ├── buildMarkdownReport.js
│   │   │   ├── historyStorage.js
│   │   │   ├── PdfParser.js
│   │   │   └── sampleResume.js
│   │   ├── hooks/
│   │   │   └── useTheme.js             # Theme management hook
│   │   ├── App.js
│   │   ├── index.js
│   │   └── styles.css
│   └── package.json
│
├── server/                      # Express Backend
│   ├── index.js                 # API entry point & static server
│   ├── .env                     # Environment variables (local, not committed)
│   ├── .env.example             # Environment variable template
│   ├── lib/
│   │   └── normalizeAnalysis.js # Normalizes AI response structure
│   ├── prompts/
│   │   ├── analyze.js           # Prompt generation for analysis
│   │   └── rewrite.js           # Prompts for other AI tasks
│   └── package.json
│
├── package.json                 # Root workspace config & scripts
├── LICENSE
└── README.md                    # This file
```

## 🔌 API Endpoints

| Method | Path                  | Description                                  |
|--------|-----------------------|----------------------------------------------|
| `POST` | `/api/analyze`        | Analyzes resume text with optional job description. |
| `POST` | `/api/rewrite-bullet` | Rewrites a specific resume bullet point.       |
| `POST` | `/api/improve-summary`| Improves the professional summary section.     |
| `POST` | `/api/interview-questions` | Generates personalized interview questions.    |
| `POST` | `/api/cover-letter`   | Generates a tailored cover letter.           |
| `GET`  | `/api/health`         | Returns server status and API key validation. |

**Example Request Body (`/api/analyze`)**

```json
{
  "resumeText": "Full resume text content...",
  "jobDescription": "Job description (optional)..."
}
```

## 🔐 Security & Secrets

- **API Key Rotation**: If your `GROQ_API_KEY` is accidentally exposed, revoke it immediately in the [Groq console](https://console.groq.com/) and generate a new one.
- **`.env` File**: Ensure `server/.env` is included in your `.gitignore` to prevent committing secrets.
- **Production Secrets**: Provide `GROQ_API_KEY` and `CLIENT_ORIGIN` via your hosting provider's environment variable or secrets management system.

## 🧪 Testing

- **Client-side**: `npm test --prefix client` (React components, utilities using Jest & React Testing Library)
- **Server-side**: `npm test --prefix server` (Node.js built-in test runner for backend logic)

## 📊 Available Scripts

### Root

- `npm run install:all`: Installs dependencies for both server and client.
- `npm run dev`: Runs both server and client development servers concurrently.
- `npm run build`: Installs client dependencies and builds the client for production.
- `npm start`: Runs the backend server, which can also serve the built client.

### Server Specific

- `npm start` / `npm run dev`: Starts the backend server.
- `npm test`: Runs server-side unit tests.

### Client Specific

- `npm start`: Starts the React development server.
- `npm run build`: Creates an optimized production build in `client/build`.
- `npm test`: Runs client-side tests.

## 🚀 Deployment

This application supports single-service deployments where the Express server serves the built React client.

### Option A: Single Service Hosting (Render, Railway, Heroku)

1.  **Build Command**: `npm run build` (installs deps and builds client).
2.  **Start Command**: `npm start` (runs `node server/index.js`).
3.  **Environment Variables**: Set `GROQ_API_KEY` and `CLIENT_ORIGIN` in your platform's dashboard.

### Option B: Separate Frontend/Backend Hosting

1.  **Build Client**: Run `npm run build --prefix client` to generate the `client/build` directory.
2.  **Deploy Client**: Deploy the `client/build` folder as a static site (e.g., Vercel, Netlify).
3.  **Deploy Server**: Deploy the `server/` directory as a Node.js application, ensuring `NODE_ENV=production` and `CLIENT_ORIGIN` are set correctly for CORS.

## 🐛 Troubleshooting

- **`GROQ_API_KEY is not set`**: Verify the key in your `.env` file or environment variables. Check the `/api/health` endpoint.
- **Port Conflict**: If ports 3000 or 5000 are in use, specify alternative ports: `PORT=3001 npm start --prefix client`.
- **Windows `cmd.exe ENOENT`**: Use separate terminal windows for server and client (`npm start --prefix server` and `npm start --prefix client`).
- **PDF/DOCX Parsing Issues**: Try different files; check browser console logs for specific errors.

## 📚 Additional Resources

- [Groq API Documentation](https://console.groq.com/docs)
- [Create React App Documentation](https://create-react-app.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)

## 📄 License

This project is licensed under the [ISC License](./LICENSE). © 2024 ClearHire

---

---
**<p align="center">Generated by [ReadmeCodeGen](https://www.readmecodegen.com/)</p>**
