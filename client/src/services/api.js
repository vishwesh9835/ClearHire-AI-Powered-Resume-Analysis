import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  headers: { "Content-Type": "application/json" },
});

export function getApiErrorMessage(err) {
  if (!err) return "An unknown error occurred.";

  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (data != null) {
      if (typeof data === "string") {
        if (data.includes("<html") || data.includes("<!DOCTYPE")) {
          return `Server returned status ${err.response?.status || 500}. Please check server status.`;
        }
        return data;
      }
      if (typeof data === "object") {
        if (typeof data.error === "string") {
          return data.error;
        }
        if (data.error != null && typeof data.error === "object") {
          return data.error.message || data.error.code || JSON.stringify(data.error);
        }
        if (typeof data.message === "string") {
          return data.message;
        }
      }
    }
    if (err.response?.status === 429) {
      return "You're sending requests too fast. Please wait a moment and try again.";
    }
    if (err.response?.status === 413) {
      return "Request too large. Try a shorter resume or job description.";
    }
    if (err.response?.status === 500) {
      return "Server error (500). Please check backend logs or API configuration.";
    }
    if (err.code === "ECONNABORTED") {
      return "Request timed out. Please try again.";
    }
    if (!err.response) {
      return "Cannot reach the server. Is the API running?";
    }
    return err.message || "Request failed";
  }

  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (typeof err === "object") {
    return err.message || err.error || JSON.stringify(err);
  }
  return String(err) || "Something went wrong. Please try again.";
}

export async function analyzeResume(resumeText, options = {}) {
  const { jobDescription = "", tailorMode = false } = options;
  const { data } = await client.post("/analyze", {
    resumeText,
    jobDescription: jobDescription || "",
    tailorMode: Boolean(tailorMode),
  });
  return data;
}

export async function rewriteBullet(bulletText, options = {}) {
  const { jobDescription = "", contextSection = "Experience" } = options;
  const { data } = await client.post("/rewrite-bullet", {
    bulletText,
    jobDescription: jobDescription || undefined,
    contextSection,
  });
  return data;
}


export async function getInterviewQuestions(resumeText, options = {}) {
  const { jobDescription = "" } = options;
  const { data } = await client.post("/interview-questions", {
    resumeText,
    jobDescription: jobDescription || undefined,
  });
  return data;
}

export async function generateCoverLetter(resumeText, options = {}) {
  const { jobDescription = "", tone = "professional" } = options;
  const { data } = await client.post("/cover-letter", {
    resumeText,
    jobDescription: jobDescription || undefined,
    tone,
  });
  return data;
}

