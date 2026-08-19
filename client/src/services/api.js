import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  headers: { "Content-Type": "application/json" },
});

export function getApiErrorMessage(err) {
  if (!err) return "An unknown error occurred.";

  const extractString = (val) => {
    if (typeof val === "string") {
      if (val === "[object Object]") return null;
      return val;
    }
    if (val && typeof val === "object") {
      try {
        const s = JSON.stringify(val);
        if (s !== "{}" && s !== "[]") return s;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (data != null) {
      if (typeof data === "string") {
        if (data.includes("<html") || data.includes("<!DOCTYPE")) {
          return `Server returned status ${err.response?.status || 500}. Please check server status.`;
        }
        return data !== "[object Object]" ? data : "Unexpected object response from server";
      }
      if (typeof data === "object") {
        if (typeof data.error === "string") {
          return data.error !== "[object Object]" ? data.error : "Unexpected error object";
        }
        if (data.error != null && typeof data.error === "object") {
          return extractString(data.error.message) || extractString(data.error.code) || extractString(data.error) || "Server error";
        }
        if (typeof data.message === "string") {
          return data.message !== "[object Object]" ? data.message : "Unexpected message object";
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
    if (!err.response) {
      return "Cannot reach the server. Is the API running?";
    }
    return err.message !== "[object Object]" ? err.message : "Request failed";
  }

  if (err instanceof Error) {
    if (err.message && err.message !== "[object Object]") return err.message;
  }
  
  if (typeof err === "string" && err !== "[object Object]") return err;
  
  if (typeof err === "object") {
    const msg = extractString(err.message) || extractString(err.error) || extractString(err);
    if (msg) return msg;
  }
  
  const str = String(err);
  return str === "[object Object]" ? "Something went wrong. Please try again." : str;
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

