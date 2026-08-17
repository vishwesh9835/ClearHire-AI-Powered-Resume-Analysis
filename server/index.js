require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const Groq = require("groq-sdk");

const { buildAnalyzePrompt, MAX_RESUME } = require("./prompts/analyze");
const {
  buildRewriteBulletPrompt,
  buildImproveSummaryPrompt,
  buildInterviewQuestionsPrompt,
  buildCoverLetterPrompt,
} = require("./prompts/rewrite");
const { normalizeAnalysis } = require("./lib/normalizeAnalysis");

const PORT = Number(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const FALLBACK_MODELS = Array.from(new Set([
  GROQ_MODEL,
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
  "openai/gpt-oss-20b",
  "groq/compound",
]));

const app = express();

// ✅ Security headers
app.use(helmet());

// In production require an explicit CLIENT_ORIGIN so we never open CORS to *
if (NODE_ENV === "production" && (!CLIENT_ORIGIN || CLIENT_ORIGIN === "*") && !process.env.VERCEL) {
  console.error(
    "\n❌ FATAL: CLIENT_ORIGIN env var must be set to your frontend URL in production.\n" +
    "   Example: CLIENT_ORIGIN=https://myapp.onrender.com\n"
  );
  process.exit(1);
}

const corsOptions =
  CLIENT_ORIGIN && CLIENT_ORIGIN !== "*"
    ? { origin: CLIENT_ORIGIN, credentials: true }
    : { origin: true };

app.use(cors(corsOptions));
app.use(express.json({ limit: "5mb" }));

// ✅ Rate limiting — prevents abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please wait a few minutes and try again." },
});
const heavyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { error: "Slow down — you can run 5 analyses per minute." },
});
app.use("/api/", limiter);
app.use("/api/analyze", heavyLimiter);
app.use("/api/interview-questions", heavyLimiter);
app.use("/api/cover-letter", heavyLimiter);

function clientErrorMessage(err) {
  return err?.message || "Something went wrong. Please try again.";
}

function parseJsonFromModel(raw) {
  const trimmed = (raw || "").trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Invalid JSON from model");
  }
}

if (!GROQ_API_KEY) {
  console.error("\n❌ WARNING: GROQ_API_KEY is not set. Get a free key at: https://console.groq.com\n");
  if (!process.env.VERCEL) {
    process.exit(1);
  }
}
const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

async function createCompletionWithFallback(params) {
  if (!groq) {
    throw new Error("GROQ_API_KEY is missing on the server. Please configure GROQ_API_KEY environment variable.");
  }
  let lastError;
  for (const model of FALLBACK_MODELS) {
    try {
      const result = await groq.chat.completions.create({
        ...params,
        model,
      });
      return result;
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} failed (${err.message}). Trying fallback model...`);
    }
  }
  throw lastError;
}

// POST /api/analyze
app.post("/api/analyze", async (req, res) => {
  const { resumeText, jobDescription, tailorMode } = req.body || {};
  const text = typeof resumeText === "string" ? resumeText.trim() : "";

  if (!text) {
    return res.status(400).json({ error: "resumeText is required" });
  }

  if (text.length > MAX_RESUME) {
    return res.status(400).json({
      error: `Resume text is too long (max ${MAX_RESUME} characters)`,
    });
  }

  const jd =
    typeof jobDescription === "string" ? jobDescription.trim() : "";
  const hasJobDescription = jd.length > 0;
  const tailor = Boolean(tailorMode) && hasJobDescription;

  try {
    const prompt = buildAnalyzePrompt(text, jd, tailor);

    const result = await createCompletionWithFallback({
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
      response_format: { type: "json_object" },
    });
    const raw = result.choices[0]?.message?.content || "{}";
    const parsed = parseJsonFromModel(raw);
    const analysis = normalizeAnalysis(parsed, { hasJobDescription });
    res.json(analysis);
  } catch (error) {
    console.error("Analyze error:", error);
    res.status(500).json({ error: clientErrorMessage(error) });
  }
});

// POST /api/rewrite-bullet
app.post("/api/rewrite-bullet", async (req, res) => {
  const { bulletText, jobDescription, contextSection } = req.body || {};
  const bullet = typeof bulletText === "string" ? bulletText.trim() : "";

  if (!bullet || bullet.length < 10) {
    return res
      .status(400)
      .json({ error: "bulletText is required (min 10 chars)" });
  }

  try {
    const prompt = buildRewriteBulletPrompt(
      bullet,
      jobDescription,
      contextSection
    );

    const result = await createCompletionWithFallback({
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      response_format: { type: "json_object" },
    });
    const raw = result.choices[0]?.message?.content || "{}";
    const parsed = parseJsonFromModel(raw);

    res.json({
      before: String(parsed.before || bullet),
      after:
        String(parsed.after || "").trim() ||
        String(parsed.before || bullet),
    });
  } catch (error) {
    console.error("Rewrite bullet error:", error);
    res.status(500).json({ error: clientErrorMessage(error) });
  }
});

// POST /api/improve-summary
app.post("/api/improve-summary", async (req, res) => {
  const { summaryText, jobDescription } = req.body || {};
  const summary =
    typeof summaryText === "string" ? summaryText.trim() : "";

  if (!summary || summary.length < 20) {
    return res.status(400).json({
      error: "summaryText is required (min 20 chars)",
    });
  }

  try {
    const prompt = buildImproveSummaryPrompt(
      summary,
      jobDescription
    );

    const result = await createCompletionWithFallback({
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      response_format: { type: "json_object" },
    });
    const raw = result.choices[0]?.message?.content || "{}";
    const parsed = parseJsonFromModel(raw);

    res.json({
      improved: String(parsed.improved || "").trim() || summary,
    });
  } catch (error) {
    console.error("Improve summary error:", error);
    res.status(500).json({ error: clientErrorMessage(error) });
  }
});

// health check
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", model: GROQ_MODEL, fallbackModels: FALLBACK_MODELS, hasApiKey: Boolean(GROQ_API_KEY) })
);

// ─── POST /api/interview-questions ───────────────────────────────────────────
app.post("/api/interview-questions", async (req, res) => {
  const { resumeText, jobDescription } = req.body || {};
  const text = typeof resumeText === "string" ? resumeText.trim() : "";

  if (!text || text.length < 50) {
    return res.status(400).json({ error: "resumeText is required (min 50 chars)" });
  }

  try {
    const prompt = buildInterviewQuestionsPrompt(text, jobDescription);

    const result = await createCompletionWithFallback({
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });
    const raw = result.choices[0]?.message?.content || "{}";
    const parsed = parseJsonFromModel(raw);

    res.json({
      behavioral: Array.isArray(parsed.behavioral) ? parsed.behavioral : [],
      technical: Array.isArray(parsed.technical) ? parsed.technical : [],
      roleSpecific: Array.isArray(parsed.roleSpecific) ? parsed.roleSpecific : [],
      tips: Array.isArray(parsed.tips) ? parsed.tips : [],
    });
  } catch (error) {
    console.error("Interview questions error:", error);
    res.status(500).json({ error: clientErrorMessage(error) });
  }
});

// ─── POST /api/cover-letter ───────────────────────────────────────────────────
app.post("/api/cover-letter", async (req, res) => {
  const { resumeText, jobDescription, tone } = req.body || {};
  const text = typeof resumeText === "string" ? resumeText.trim() : "";

  if (!text || text.length < 50) {
    return res.status(400).json({ error: "resumeText is required (min 50 chars)" });
  }

  try {
    const prompt = buildCoverLetterPrompt(text, jobDescription, tone);

    const result = await createCompletionWithFallback({
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });
    const raw = result.choices[0]?.message?.content || "{}";
    const parsed = parseJsonFromModel(raw);

    res.json({
      letter: String(parsed.letter || "").trim(),
      subjectLine: String(parsed.subjectLine || "").trim(),
    });
  } catch (error) {
    console.error("Cover letter error:", error);
    res.status(500).json({ error: clientErrorMessage(error) });
  }
});

// ─── 404 handler for unknown API routes ────────────────────────────────────
app.use("/api/", (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// ─── Global error handler ───────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({ error: clientErrorMessage(err) });
});

// ─── Serve the built frontend (single-service deployment) ──────────────────
// When client/build exists (e.g. after `npm run build --prefix client`, or
// as produced by the Dockerfile), this lets one server process handle both
// the API and the UI — no separate static host needed on Render/Railway/
// Heroku/Docker. In local dev, client/build won't exist, so this is skipped
// and CRA's own dev server on :3000 (proxied via CORS) is used instead.
const clientBuildPath = path.join(__dirname, "../client/build");
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  // SPA fallback: any non-API, non-file route serves index.html so client-side
  // routing (and hard refreshes) work correctly.
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
  console.log("Serving client build from", clientBuildPath);
} else if (NODE_ENV === "production") {
  console.warn(
    "client/build not found — API-only mode. Build the client or use the Docker image to serve the UI."
  );
}

if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} (model: ${GROQ_MODEL})`);
  });

  // ─── Graceful shutdown (SIGTERM from cloud platforms / containers) ──────────
  function shutdown(signal) {
    console.log(`\nReceived ${signal}. Closing server gracefully…`);
    server.close(() => {
      console.log("Server closed.");
      process.exit(0);
    });
    // Force exit if graceful close takes too long
    setTimeout(() => {
      console.error("Forced exit after timeout.");
      process.exit(1);
    }, 10_000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

module.exports = app;