/**
 * ClearHire – Express API Server
 *
 * Endpoints:
 *   POST /api/analyze            – Full resume analysis
 *   POST /api/rewrite-bullet     – AI-powered bullet point rewrite
 *   POST /api/improve-summary    – Professional summary improvement
 *   POST /api/interview-questions – Personalised interview prep questions
 *   POST /api/cover-letter       – Tailored cover letter generation
 *   GET  /api/health             – Server & API key status
 *
 * AI provider: Groq (https://console.groq.com)
 * Requires GROQ_API_KEY in server/.env
 */

const path = require("path");
const fs   = require("fs");

// Load .env from the server directory, then fall back to the repo root.
// This supports both `node server/index.js` (root) and `node index.js` (server/).
require("dotenv").config();
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const express   = require("express");
const cors      = require("cors");
const helmet    = require("helmet");
const rateLimit = require("express-rate-limit");
const Groq      = require("groq-sdk");

const { buildAnalyzePrompt, MAX_RESUME } = require("./prompts/analyze");
const {
  buildRewriteBulletPrompt,
  buildImproveSummaryPrompt,
  buildInterviewQuestionsPrompt,
  buildCoverLetterPrompt,
} = require("./prompts/rewrite");
const { normalizeAnalysis } = require("./lib/normalizeAnalysis");

// ─── Config ──────────────────────────────────────────────────────────────────

const PORT        = Number(process.env.PORT) || 5000;
const NODE_ENV    = process.env.NODE_ENV || "development";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;

// ─── App setup ───────────────────────────────────────────────────────────────

const app = express();

// Security headers (X-Frame-Options, CSP, etc.)
app.use(helmet());

// In production, CLIENT_ORIGIN must be set explicitly to avoid open CORS.
// Exception: Vercel sets its own origin headers.
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

// ─── Rate limiting ────────────────────────────────────────────────────────────
// General limiter: 30 requests per 15 minutes across all API routes.
// Heavy limiter: 5 requests per minute for AI-intensive endpoints.

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please wait a few minutes and try again." },
});

const heavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Slow down — you can run 5 analyses per minute." },
});

app.use("/api/", limiter);
app.use("/api/analyze", heavyLimiter);
app.use("/api/interview-questions", heavyLimiter);
app.use("/api/cover-letter", heavyLimiter);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extracts a clean, human-readable error message from any error value.
 *
 * The Groq SDK surfaces errors in a nested shape:
 *   err.error.error.message  (API-level message, most specific)
 *   err.error.message        (SDK-level message)
 *   err.message              (may be '400 {"error":{...}}' — parsed below)
 *
 * Falls back to a generic message if nothing readable is found.
 */
function clientErrorMessage(err) {
  if (!err) return "Something went wrong. Please try again.";

  // 1. Groq SDK nested error object
  try {
    const inner = err?.error?.error?.message || err?.error?.message;
    if (inner && typeof inner === "string" && inner !== "[object Object]") {
      return inner;
    }
  } catch (_) { /* ignore */ }

  // 2. err.message may look like: '400 {"error":{"message":"..."}}'
  const msg = err.message;
  if (typeof msg === "string") {
    const jsonMatch = msg.match(/^\d{3}\s+(\{[\s\S]*\})$/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        const inner  = parsed?.error?.message || parsed?.message;
        if (inner && typeof inner === "string") return inner;
      } catch (_) { /* fall through */ }
    }
    if (msg !== "[object Object]") return msg;
  }

  // 3. Plain string on err.error
  if (typeof err.error === "string" && err.error !== "[object Object]") return err.error;

  // 4. Last resort
  const str = String(err);
  if (str !== "[object Object]" && str !== "Error" && str !== "Error: [object Object]") return str;

  return "Something went wrong. Please try again.";
}

/**
 * Parses JSON from raw model output, handling common model quirks:
 * - <think>...</think> reasoning blocks (Qwen / DeepSeek thinking models)
 * - Markdown code fences (```json ... ```)
 * - JSON embedded in surrounding prose
 */
function parseJsonFromModel(raw) {
  // Strip reasoning blocks produced by thinking models
  let text = (raw || "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  if (!text) return {};

  // Strip markdown code fences
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  try {
    return JSON.parse(text);
  } catch {
    // Last resort: extract the first {...} block from the text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    throw new Error("Invalid JSON from model");
  }
}

/**
 * Returns a Groq SDK client if GROQ_API_KEY is set, otherwise null.
 */
function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

/**
 * Calls the Groq API with automatic model fallback.
 *
 * Why no response_format?
 *   The gpt-oss-* models return HTTP 400 when response_format: json_object is
 *   sent. We instead rely on parseJsonFromModel() to extract JSON from any raw
 *   model output, which handles all current Groq models uniformly.
 *
 * Model order:
 *   groq/compound is tried first — it reliably produces JSON for all prompts.
 *   The others are fallbacks in case compound is unavailable or rate-limited.
 */
async function createCompletionWithFallback(params) {
  const groq = getGroqClient();
  if (!groq) {
    throw new Error(
      "GROQ_API_KEY is missing. Add it in server/.env or in your cloud platform's environment variables."
    );
  }

  // Strip response_format — not supported by all models (see JSDoc above)
  const { response_format, ...safeParams } = params; // eslint-disable-line no-unused-vars

  const mainModel = process.env.GROQ_MODEL || "groq/compound";
  const fallbackModels = Array.from(new Set([
    mainModel,
    "groq/compound",
    "openai/gpt-oss-120b",
    "qwen/qwen3.6-27b",
    "openai/gpt-oss-20b",
  ]));

  let lastError;
  for (const model of fallbackModels) {
    try {
      const result = await groq.chat.completions.create({ ...safeParams, model });

      // Some models return an empty string — treat as a soft failure and try the next
      const content = result.choices?.[0]?.message?.content;
      if (!content || !content.trim()) {
        console.warn(`Model ${model} returned empty content. Trying fallback...`);
        continue;
      }

      return result;
    } catch (err) {
      lastError = err;
      const errMsg = err?.error?.error?.message || err?.error?.message || err.message || String(err);
      console.warn(`Model ${model} failed (${errMsg}). Trying fallback...`);
    }
  }

  throw lastError || new Error("All models returned empty responses.");
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/** GET /api/health – Returns server status and active model name. */
app.get("/api/health", (req, res) =>
  res.json({
    status: "ok",
    model: process.env.GROQ_MODEL || "groq/compound",
    hasApiKey: Boolean(process.env.GROQ_API_KEY),
  })
);

/** POST /api/analyze – Full resume analysis with optional job description. */
app.post("/api/analyze", async (req, res) => {
  const { resumeText, jobDescription, tailorMode } = req.body || {};
  const text = typeof resumeText === "string" ? resumeText.trim() : "";

  if (!text) {
    return res.status(400).json({ error: "resumeText is required" });
  }
  if (text.length > MAX_RESUME) {
    return res.status(400).json({ error: `Resume text is too long (max ${MAX_RESUME} characters)` });
  }

  const jd             = typeof jobDescription === "string" ? jobDescription.trim() : "";
  const hasJobDescription = jd.length > 0;
  const tailor         = Boolean(tailorMode) && hasJobDescription;

  try {
    const prompt   = buildAnalyzePrompt(text, jd, tailor);
    const result   = await createCompletionWithFallback({
      messages:   [{ role: "user", content: prompt }],
      max_tokens: 4096,
    });
    const raw      = result.choices[0]?.message?.content || "{}";
    const parsed   = parseJsonFromModel(raw);
    const analysis = normalizeAnalysis(parsed, { hasJobDescription });
    res.json(analysis);
  } catch (error) {
    console.error("Analyze error:", error);
    res.status(500).json({ error: clientErrorMessage(error) });
  }
});

/** POST /api/rewrite-bullet – Rewrites a single resume bullet point for impact. */
app.post("/api/rewrite-bullet", async (req, res) => {
  const { bulletText, jobDescription, contextSection } = req.body || {};
  const bullet = typeof bulletText === "string" ? bulletText.trim() : "";

  if (!bullet || bullet.length < 10) {
    return res.status(400).json({ error: "bulletText is required (min 10 chars)" });
  }

  try {
    const prompt = buildRewriteBulletPrompt(bullet, jobDescription, contextSection);
    const result = await createCompletionWithFallback({
      messages:   [{ role: "user", content: prompt }],
      max_tokens: 500,
    });
    const raw    = result.choices[0]?.message?.content || "{}";
    const parsed = parseJsonFromModel(raw);

    res.json({
      before: String(parsed.before || bullet),
      after:  String(parsed.after  || "").trim() || String(parsed.before || bullet),
    });
  } catch (error) {
    console.error("Rewrite bullet error:", error);
    res.status(500).json({ error: clientErrorMessage(error) });
  }
});

/** POST /api/improve-summary – Rewrites the professional summary section. */
app.post("/api/improve-summary", async (req, res) => {
  const { summaryText, jobDescription } = req.body || {};
  const summary = typeof summaryText === "string" ? summaryText.trim() : "";

  if (!summary || summary.length < 20) {
    return res.status(400).json({ error: "summaryText is required (min 20 chars)" });
  }

  try {
    const prompt = buildImproveSummaryPrompt(summary, jobDescription);
    const result = await createCompletionWithFallback({
      messages:   [{ role: "user", content: prompt }],
      max_tokens: 800,
    });
    const raw    = result.choices[0]?.message?.content || "{}";
    const parsed = parseJsonFromModel(raw);

    res.json({ improved: String(parsed.improved || "").trim() || summary });
  } catch (error) {
    console.error("Improve summary error:", error);
    res.status(500).json({ error: clientErrorMessage(error) });
  }
});

/** POST /api/interview-questions – Generates personalised interview prep questions. */
app.post("/api/interview-questions", async (req, res) => {
  const { resumeText, jobDescription } = req.body || {};
  const text = typeof resumeText === "string" ? resumeText.trim() : "";

  if (!text || text.length < 50) {
    return res.status(400).json({ error: "resumeText is required (min 50 chars)" });
  }

  try {
    const prompt = buildInterviewQuestionsPrompt(text, jobDescription);
    const result = await createCompletionWithFallback({
      messages:   [{ role: "user", content: prompt }],
      max_tokens: 2000,
    });
    const raw    = result.choices[0]?.message?.content || "{}";
    const parsed = parseJsonFromModel(raw);

    res.json({
      behavioral:   Array.isArray(parsed.behavioral)   ? parsed.behavioral   : [],
      technical:    Array.isArray(parsed.technical)     ? parsed.technical    : [],
      roleSpecific: Array.isArray(parsed.roleSpecific)  ? parsed.roleSpecific : [],
      tips:         Array.isArray(parsed.tips)          ? parsed.tips         : [],
    });
  } catch (error) {
    console.error("Interview questions error:", error);
    res.status(500).json({ error: clientErrorMessage(error) });
  }
});

/** POST /api/cover-letter – Generates a tailored cover letter. */
app.post("/api/cover-letter", async (req, res) => {
  const { resumeText, jobDescription, tone } = req.body || {};
  const text = typeof resumeText === "string" ? resumeText.trim() : "";

  if (!text || text.length < 50) {
    return res.status(400).json({ error: "resumeText is required (min 50 chars)" });
  }

  try {
    const prompt = buildCoverLetterPrompt(text, jobDescription, tone);
    const result = await createCompletionWithFallback({
      messages:   [{ role: "user", content: prompt }],
      max_tokens: 1500,
    });
    const raw    = result.choices[0]?.message?.content || "{}";
    const parsed = parseJsonFromModel(raw);

    res.json({
      letter:      String(parsed.letter      || "").trim(),
      subjectLine: String(parsed.subjectLine || "").trim(),
    });
  } catch (error) {
    console.error("Cover letter error:", error);
    res.status(500).json({ error: clientErrorMessage(error) });
  }
});

// ─── Error handlers ───────────────────────────────────────────────────────────

// 404 for unknown API routes
app.use("/api/", (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler (Express 4-argument signature required)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({ error: clientErrorMessage(err) });
});

// ─── Static frontend (single-service deployment) ──────────────────────────────
// When client/build exists, the Express server also serves the React app.
// In local development, the CRA dev server on :3000 is used instead.

const clientBuildPath = path.join(__dirname, "../client/build");
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  // SPA fallback: serve index.html for any non-API route so client-side
  // routing and direct URL refreshes work correctly.
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
  console.log("Serving client build from", clientBuildPath);
} else if (NODE_ENV === "production") {
  console.warn("client/build not found — API-only mode.");
}

// ─── Start server ─────────────────────────────────────────────────────────────
// Skipped on Vercel (serverless), which manages its own lifecycle.

if (!process.env.VERCEL) {
  const activeModel = process.env.GROQ_MODEL || "groq/compound";
  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} (model: ${activeModel})`);
  });

  // Graceful shutdown on SIGTERM (cloud platforms) and SIGINT (Ctrl+C)
  function shutdown(signal) {
    console.log(`\nReceived ${signal}. Closing server gracefully…`);
    server.close(() => {
      console.log("Server closed.");
      process.exit(0);
    });
    // Force-exit if the server takes too long to drain connections
    setTimeout(() => {
      console.error("Forced exit after timeout.");
      process.exit(1);
    }, 10_000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));
}

module.exports = app;