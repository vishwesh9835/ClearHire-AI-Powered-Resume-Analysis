/**
 * Coerce API / model output into a stable shape for the client.
 * @param {unknown} raw
 * @param {{ hasJobDescription: boolean }} ctx
 */
function clampScore(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function asStringArray(v) {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x)).filter(Boolean);
}

function normalizeKeywordsMissing(raw) {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return {
      technical: asStringArray(raw.technical),
      tools: asStringArray(raw.tools),
      softSkills: asStringArray(raw.softSkills),
    };
  }
  if (Array.isArray(raw)) {
    const flat = asStringArray(raw);
    const third = Math.ceil(flat.length / 3) || 1;
    return {
      technical: flat.slice(0, third),
      tools: flat.slice(third, third * 2),
      softSkills: flat.slice(third * 2),
    };
  }
  return { technical: [], tools: [], softSkills: [] };
}

function normalizeSectionBlock(raw) {
  if (!raw || typeof raw !== "object") {
    return { strengths: [], improvements: [] };
  }
  return {
    strengths: asStringArray(raw.strengths),
    improvements: asStringArray(raw.improvements),
  };
}

function normalizeSectionFeedback(raw) {
  const d = raw && typeof raw === "object" ? raw : {};
  return {
    summary: normalizeSectionBlock(d.summary),
    experience: normalizeSectionBlock(d.experience),
    education: normalizeSectionBlock(d.education),
    projects: normalizeSectionBlock(d.projects),
  };
}

function normalizeWeakBullets(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((b, i) => {
    const o = b && typeof b === "object" ? b : {};
    return {
      id: String(o.id || `bullet-${i}`),
      text: String(o.text || ""),
      section: String(o.section || "Experience"),
      severity: ["low", "medium", "high"].includes(o.severity) ? o.severity : "medium",
    };
  }).filter((b) => b.text.length > 0);
}

function normalizeChecklist(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((c) => {
    const o = c && typeof c === "object" ? c : {};
    const status = ["pass", "warn", "fail"].includes(o.status) ? o.status : "warn";
    return { label: String(o.label || "Item"), status };
  });
}

function normalizeSkillsMatch(raw) {
  if (!raw || typeof raw !== "object") {
    return { overlapPercent: 0, matched: [], gap: [] };
  }
  return {
    overlapPercent: clampScore(raw.overlapPercent),
    matched: asStringArray(raw.matched),
    gap: asStringArray(raw.gap),
  };
}

function normalizeAnalysis(raw, ctx) {
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};

  const hasJD = ctx.hasJobDescription;
  let matchScore = null;
  if (hasJD) {
    const ms = o.matchScore;
    matchScore = ms === undefined || ms === null ? clampScore(o.score) : clampScore(ms);
  }
  const atsScore = o.atsScore === undefined || o.atsScore === null ? null : clampScore(o.atsScore);

  let topImprovements = asStringArray(o.topImprovements).slice(0, 3);
  if (topImprovements.length < 3) {
    const sug = asStringArray(o.suggestions);
    for (const s of sug) {
      if (topImprovements.length >= 3) break;
      if (s && !topImprovements.includes(s)) topImprovements.push(s);
    }
  }

  return {
    score: clampScore(o.score),
    summary: String(o.summary || ""),
    skills: asStringArray(o.skills),
    strengths: asStringArray(o.strengths),
    suggestions: asStringArray(o.suggestions),
    atsScore,
    atsExplanation: String(o.atsExplanation || ""),
    matchScore,
    matchExplanation: hasJD ? String(o.matchExplanation || "") : "",
    keywordsMissing: normalizeKeywordsMissing(o.keywordsMissing),
    experienceLevel: String(o.experienceLevel || ""),
    topRoles: asStringArray(o.topRoles),
    formattingWarnings: asStringArray(o.formattingWarnings),
    sectionFeedback: normalizeSectionFeedback(o.sectionFeedback),
    weakBullets: normalizeWeakBullets(o.weakBullets),
    topImprovements: topImprovements.slice(0, 3),
    checklist: normalizeChecklist(o.checklist),
    skillsMatch: normalizeSkillsMatch(o.skillsMatch),
  };
}

module.exports = { normalizeAnalysis, clampScore };
