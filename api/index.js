/**
 * Vercel serverless entry point.
 * Re-exports the Express app from server/index.js so Vercel can treat it
 * as a serverless function at /api/*.
 */
const app = require("../server/index");
module.exports = app;
