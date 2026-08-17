const MAX_RESUME = 12000;
const MAX_JD = 8000;

function buildAnalyzePrompt(resumeText, jobDescription, tailorMode) {
  const resume = resumeText.slice(0, MAX_RESUME);
  const jd = (jobDescription || "").trim().slice(0, MAX_JD);
  const hasJD = jd.length > 0;

  const jdBlock = hasJD
    ? `Job description (for match analysis):
"""
${jd}
"""
`
    : "No job description was provided. Set matchScore to null, matchExplanation to empty string, and focus on general resume quality.";

  const tailor = tailorMode && hasJD
    ? "Prioritize tailoring advice to this job: align keywords, reorder emphasis, and surface gaps vs the JD."
    : "Give balanced, role-agnostic advice.";

  const userContent = `You are an expert recruiter and ATS-savvy resume coach. ${tailor}

${jdBlock}

Resume text:
"""
${resume}
"""

Respond with a single JSON object only (no markdown fences). Use this schema:
{
  "score": number (0-100) overall resume quality,
  "summary": string (2-4 sentences),
  "skills": string[] (detected skills, up to 20),
  "strengths": string[] (3-6),
  "suggestions": string[] (4-8 actionable improvements),
  "atsScore": number (0-100),
  "atsExplanation": string (1-2 sentences why this ATS score),
  "matchScore": number | null (0-100 vs job if JD provided, else null),
  "matchExplanation": string (if JD: 1-2 sentences; else empty string),
  "keywordsMissing": {
    "technical": string[],
    "tools": string[],
    "softSkills": string[]
  } (important terms from the JD or typical role not present — empty arrays if no JD),
  "experienceLevel": "Entry" | "Mid" | "Senior" | "Unknown",
  "topRoles": string[] (up to 5 suggested titles),
  "formattingWarnings": string[] (ATS-friendly formatting issues: columns, tables, headers, etc.),
  "sectionFeedback": {
    "summary": { "strengths": string[], "improvements": string[] },
    "experience": { "strengths": string[], "improvements": string[] },
    "education": { "strengths": string[], "improvements": string[] },
    "projects": { "strengths": string[], "improvements": string[] }
  },
  "weakBullets": [
    { "id": string, "text": string, "section": string, "severity": "low"|"medium"|"high" }
  ] (up to 8 weak bullets),
  "topImprovements": string[] (exactly 3 short headlines — fastest wins),
  "checklist": [
    { "label": string, "status": "pass"|"warn"|"fail" }
  ] (6-10 items: clarity, metrics, keywords, length, sections, etc.),
  "skillsMatch": {
    "overlapPercent": number (0-100),
    "matched": string[],
    "gap": string[]
  } (compare skills to JD if present; else reasonable overlap vs detected skills)
}`;

  return userContent;
}

module.exports = { buildAnalyzePrompt, MAX_RESUME, MAX_JD };
