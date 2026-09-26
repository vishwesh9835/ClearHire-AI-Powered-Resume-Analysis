import html2pdf from "html2pdf.js";

// ── Colour helpers ─────────────────────────────────────────────────────────

function scoreColor(score) {
  if (score == null) return "#6366f1";
  const n = Number(score);
  if (n >= 75) return "#10b981";
  if (n >= 50) return "#f59e0b";
  return "#ef4444";
}

function scoreLabel(score) {
  if (score == null) return "";
  const n = Number(score);
  if (n >= 75) return "Strong";
  if (n >= 50) return "Average";
  return "Needs Work";
}

// ── Small UI primitives ────────────────────────────────────────────────────

function chip(text, bg, color, border) {
  return `<span style="
    display:inline-block;padding:4px 11px;border-radius:20px;
    font-size:11.5px;font-weight:600;letter-spacing:.2px;
    background:${bg};color:${color};margin:3px 4px 3px 0;
    border:1px solid ${border};line-height:1.4;
  ">${text}</span>`;
}

function sectionHeader(emoji, label) {
  return `
    <div style="
      display:flex;align-items:center;gap:10px;
      margin-top:28px;margin-bottom:14px;padding-bottom:10px;
      border-bottom:2px solid #e2e8f0;
      break-after:avoid;page-break-after:avoid;
    ">
      <span style="font-size:17px;line-height:1">${emoji}</span>
      <span style="font-size:15px;font-weight:800;color:#0f172a;letter-spacing:.3px">${label}</span>
    </div>`;
}

function card(content, extraStyle = "") {
  return `<div style="
    background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;
    padding:16px 18px;margin-bottom:10px;
    break-inside:avoid;page-break-inside:avoid;
    ${extraStyle}
  ">${content}</div>`;
}

function bulletItem(text, dotColor) {
  return `<div style="
    display:flex;align-items:flex-start;gap:9px;
    font-size:13px;color:#334155;line-height:1.6;margin-bottom:7px;
  ">
    <span style="
      margin-top:6px;width:7px;height:7px;border-radius:50%;
      flex-shrink:0;background:${dotColor};display:block;
    "></span>
    <span>${text}</span>
  </div>`;
}

// ── Score circle SVG ───────────────────────────────────────────────────────

function scoreCircleSvg(score, color) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - (Number(score) || 0) / 100);
  return `
    <div style="position:relative;width:90px;height:90px;flex-shrink:0">
      <svg width="90" height="90" viewBox="0 0 90 90" style="transform:rotate(-90deg)">
        <circle cx="45" cy="45" r="${r}" fill="none" stroke="#334155" stroke-width="8"/>
        <circle cx="45" cy="45" r="${r}" fill="none" stroke="${color}" stroke-width="8"
          stroke-linecap="round"
          stroke-dasharray="${circ.toFixed(1)}"
          stroke-dashoffset="${offset.toFixed(1)}"/>
      </svg>
      <div style="
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-50%);text-align:center;
      ">
        <div style="font-size:21px;font-weight:800;color:${color};line-height:1">${score ?? "—"}</div>
        <div style="font-size:9px;color:#94a3b8;font-weight:600;letter-spacing:.5px">/100</div>
      </div>
    </div>`;
}

// ── ATS progress bar ───────────────────────────────────────────────────────

function atsBar(score, explanation) {
  const color = scoreColor(score);
  const pct = Math.min(100, Math.max(0, Number(score)));
  return card(`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <span style="font-size:15px;font-weight:800;color:${color}">${Math.round(pct)}%</span>
      <span style="font-size:11.5px;color:#64748b;font-weight:600">${scoreLabel(score)}</span>
    </div>
    <div style="background:#e2e8f0;border-radius:6px;height:9px;overflow:hidden">
      <div style="height:100%;border-radius:6px;background:${color};width:${pct}%"></div>
    </div>
    ${explanation ? `<p style="margin:10px 0 0;font-size:12.5px;color:#475569;line-height:1.5">${explanation}</p>` : ""}
  `);
}

// ── Score stat boxes ───────────────────────────────────────────────────────

function statBox(value, label, color) {
  return `
    <div style="
      background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;
      padding:14px 18px;text-align:center;flex:1;min-width:100px;
    ">
      <div style="font-size:24px;font-weight:800;color:${color};line-height:1">${value}</div>
      <div style="font-size:10px;color:#64748b;font-weight:700;letter-spacing:.7px;
        text-transform:uppercase;margin-top:4px">${label}</div>
    </div>`;
}




// ── Checklist item ─────────────────────────────────────────────────────────

function checklistRow(item) {
  // API shape: { label: string, status: "pass" | "warn" | "fail" }
  const passed = item.status === "pass";
  const warn   = item.status === "warn";
  const icon   = passed ? "✓" : warn ? "!" : "✗";
  const color  = passed ? "#10b981" : warn ? "#f59e0b" : "#ef4444";
  return `
    <div style="
      display:flex;align-items:center;gap:10px;
      font-size:13px;color:#334155;padding:7px 0;
      border-bottom:1px solid #f1f5f9;
    ">
      <span style="font-weight:800;color:${color};font-size:14px;width:16px;flex-shrink:0">${icon}</span>
      <span>${item.label || item.text || ""}</span>
    </div>`;
}

// ── Main HTML builder ──────────────────────────────────────────────────────

export function buildPdfReportHtml(result, meta = {}) {
  const sc    = scoreColor(result.score);
  const atsC  = scoreColor(result.atsScore);
  const matC  = scoreColor(result.matchScore);
  const now   = meta.generatedAt
    ? new Date(meta.generatedAt).toLocaleString()
    : new Date().toLocaleString();

  const hasAts   = result.atsScore  != null && !Number.isNaN(Number(result.atsScore));
  const hasMatch = result.matchScore != null && !Number.isNaN(Number(result.matchScore));

  // ── HEADER ──────────────────────────────────────────────────────────────
  const header = `
    <div style="
      background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);
      border-radius:14px;padding:28px 32px;margin-bottom:24px;
      display:flex;align-items:center;justify-content:space-between;
      break-inside:avoid;page-break-inside:avoid;
    ">
      <div>
        <div style="font-size:10.5px;font-weight:700;letter-spacing:2.5px;
          color:#0d9488;text-transform:uppercase;margin-bottom:8px">
          ClearHire • AI Resume Analysis
        </div>
        <div style="font-size:26px;font-weight:800;color:#fff;line-height:1.15">
          Analysis Report
        </div>
        <div style="font-size:11.5px;color:#94a3b8;margin-top:8px">Generated: ${now}</div>
      </div>
      ${scoreCircleSvg(result.score, sc)}
    </div>`;

  // ── SUMMARY ─────────────────────────────────────────────────────────────
  const summary = result.summary ? `
    <div style="
      background:#f8fafc;border:1px solid #e2e8f0;
      border-left:4px solid #6366f1;border-radius:8px;
      padding:14px 18px;margin-bottom:20px;
      break-inside:avoid;page-break-inside:avoid;
    ">
      <div style="font-size:10px;font-weight:800;color:#6366f1;
        letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Summary</div>
      <p style="font-size:13.5px;color:#334155;line-height:1.65;margin:0">${result.summary}</p>
    </div>` : "";

  // ── SCORE STATS ──────────────────────────────────────────────────────────
  const scoreStats = `
    <div style="
      display:flex;flex-wrap:wrap;gap:10px;margin-bottom:24px;
      break-inside:avoid;page-break-inside:avoid;
    ">
      ${statBox(result.score ?? "—", "Overall Score", sc)}
      ${hasAts   ? statBox(Math.round(Number(result.atsScore)), "ATS Score", atsC) : ""}
      ${hasMatch ? statBox(Math.round(Number(result.matchScore)), "Job Match", matC) : ""}
      ${result.experienceLevel ? statBox(result.experienceLevel, "Level", "#6366f1") : ""}
    </div>`;

  // ── JOB MATCH EXPLANATION ────────────────────────────────────────────────
  const matchBanner = hasMatch && result.matchExplanation ? `
    <div style="
      background:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid #10b981;
      border-radius:8px;padding:13px 16px;margin-bottom:20px;
      break-inside:avoid;page-break-inside:avoid;
    ">
      <div style="font-size:10px;font-weight:800;color:#15803d;
        letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Job Match Explanation</div>
      <p style="font-size:13px;color:#166534;line-height:1.55;margin:0">${result.matchExplanation}</p>
    </div>` : "";

  // ── TOP IMPROVEMENTS ─────────────────────────────────────────────────────
  const topImprovements = result.topImprovements?.length ? `
    ${sectionHeader("⚡", "Top Improvements")}
    ${card(`
      <ol style="padding-left:22px;margin:0;display:flex;flex-direction:column;gap:8px">
        ${result.topImprovements.map((t) =>
          `<li style="font-size:13px;color:#334155;line-height:1.6;font-weight:500">${t}</li>`
        ).join("")}
      </ol>
    `)}` : "";

  // ── STRENGTHS ────────────────────────────────────────────────────────────
  const strengths = result.strengths?.length ? `
    ${sectionHeader("✅", "Strengths")}
    ${card(`
      <div style="font-size:10.5px;font-weight:700;color:#15803d;
        letter-spacing:.8px;text-transform:uppercase;margin-bottom:10px">What's working well</div>
      ${result.strengths.map((s) => bulletItem(s, "#10b981")).join("")}
    `)}` : "";

  // ── IMPROVEMENTS ─────────────────────────────────────────────────────────
  const improvements = result.suggestions?.length ? `
    ${sectionHeader("💡", "Improvements")}
    ${card(`
      <div style="font-size:10.5px;font-weight:700;color:#b45309;
        letter-spacing:.8px;text-transform:uppercase;margin-bottom:10px">Areas to fix</div>
      ${result.suggestions.map((s) => bulletItem(s, "#f59e0b")).join("")}
    `)}` : "";

  // ── ATS READINESS ────────────────────────────────────────────────────────
  const ats = hasAts ? `
    ${sectionHeader("🛡️", "ATS Readiness")}
    ${atsBar(result.atsScore, result.atsExplanation)}` : "";

  // ── DETECTED SKILLS ──────────────────────────────────────────────────────
  const skills = result.skills?.length ? `
    ${sectionHeader("💎", "Detected Skills")}
    ${card(`
      <div style="display:flex;flex-wrap:wrap;gap:4px">
        ${result.skills.map((s) => chip(s, "#f0f9ff", "#0369a1", "#bae6fd")).join("")}
      </div>
    `)}` : "";

  // ── SKILLS MATCH ────────────────────────────────────────────────────────
  // skillsMatch shape: { overlapPercent, matched: string[], gap: string[] }
  const sm = result.skillsMatch;
  const hasSkillsMatch = sm && (sm.matched?.length > 0 || sm.gap?.length > 0);
  const skillsMatch = hasSkillsMatch ? `
    ${sectionHeader("🎯", "Skills Match")}
    ${card(`
      ${sm.overlapPercent != null ? `
        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:12px;color:#64748b">Overlap with role signals</span>
            <span style="font-size:14px;font-weight:800;color:#6366f1">${sm.overlapPercent}%</span>
          </div>
          <div style="background:#e2e8f0;border-radius:6px;height:7px;overflow:hidden">
            <div style="height:100%;border-radius:6px;background:#6366f1;width:${Math.min(100,sm.overlapPercent)}%"></div>
          </div>
        </div>` : ""}
      ${sm.matched?.length > 0 ? `
        <div style="margin-bottom:8px">
          <div style="font-size:10.5px;font-weight:700;color:#15803d;letter-spacing:.6px;text-transform:uppercase;margin-bottom:6px">Matched</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            ${sm.matched.map((s) => chip(s, "#f0fdf4", "#15803d", "#bbf7d0")).join("")}
          </div>
        </div>` : ""}
      ${sm.gap?.length > 0 ? `
        <div>
          <div style="font-size:10.5px;font-weight:700;color:#b45309;letter-spacing:.6px;text-transform:uppercase;margin-bottom:6px">Gaps to consider</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            ${sm.gap.map((s) => chip(s, "#fffbeb", "#b45309", "#fde68a")).join("")}
          </div>
        </div>` : ""}
    `)}` : "";

  // ── MISSING KEYWORDS ────────────────────────────────────────────────────
  // keywordsMissing shape: { technical: string[], tools: string[], softSkills: string[] }
  const km = result.keywordsMissing;
  const allKw = [
    ...(km?.technical || []),
    ...(km?.tools || []),
    ...(km?.softSkills || []),
  ];
  const keywords = allKw.length > 0 ? `
    ${sectionHeader("🔍", "Missing Keywords")}
    ${card(`
      ${km?.technical?.length > 0 ? `
        <div style="margin-bottom:8px">
          <div style="font-size:10.5px;font-weight:700;color:#64748b;letter-spacing:.6px;text-transform:uppercase;margin-bottom:5px">Technical</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">${km.technical.map((k) => chip(k, "#fff1f2", "#be123c", "#fecdd3")).join("")}</div>
        </div>` : ""}
      ${km?.tools?.length > 0 ? `
        <div style="margin-bottom:8px">
          <div style="font-size:10.5px;font-weight:700;color:#64748b;letter-spacing:.6px;text-transform:uppercase;margin-bottom:5px">Tools & Platforms</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">${km.tools.map((k) => chip(k, "#fff1f2", "#be123c", "#fecdd3")).join("")}</div>
        </div>` : ""}
      ${km?.softSkills?.length > 0 ? `
        <div>
          <div style="font-size:10.5px;font-weight:700;color:#64748b;letter-spacing:.6px;text-transform:uppercase;margin-bottom:5px">Soft Skills</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">${km.softSkills.map((k) => chip(k, "#fff1f2", "#be123c", "#fecdd3")).join("")}</div>
        </div>` : ""}
    `)}` : "";

  // ── SECTION FEEDBACK ────────────────────────────────────────────────────
  // sectionFeedback shape: { summary, experience, education, projects }
  //   each value: { strengths: string[], improvements: string[] }
  const sfBlocks = [
    { key: "summary",    label: "Summary / Profile" },
    { key: "experience", label: "Experience" },
    { key: "education",  label: "Education" },
    { key: "projects",   label: "Projects" },
  ];
  const sfObj = result.sectionFeedback;
  const hasSF = sfObj && typeof sfObj === "object" && sfBlocks.some((b) => {
    const d = sfObj[b.key];
    return d && ((d.strengths?.length > 0) || (d.improvements?.length > 0));
  });
  const sectionFeedback = hasSF ? `
    ${sectionHeader("📋", "Section Feedback")}
    ${sfBlocks.map(({ key, label }) => {
        const d = sfObj[key];
        if (!d || (!d.strengths?.length && !d.improvements?.length)) return "";
        return card(`
          <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e2e8f0">${label}</div>
          ${d.strengths?.length > 0 ? `
            <div style="margin-bottom:8px">
              <div style="font-size:10.5px;font-weight:700;color:#15803d;letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px">✅ What works</div>
              ${d.strengths.map((s) => bulletItem(s, "#10b981")).join("")}
            </div>` : ""}
          ${d.improvements?.length > 0 ? `
            <div>
              <div style="font-size:10.5px;font-weight:700;color:#b45309;letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px">💡 Improve</div>
              ${d.improvements.map((s) => bulletItem(s, "#f59e0b")).join("")}
            </div>` : ""}
        `);
      }).join("")}` : "";

  // ── CHECKLIST ───────────────────────────────────────────────────────────
  // checklist shape: [{ label: string, status: "pass"|"warn"|"fail" }]
  const checklist = result.checklist?.length ? `
    ${sectionHeader("☑️", "Resume Checklist")}
    ${card(`
      ${result.checklist.map((item) => checklistRow(item)).join("")}
    `)}` : "";

  // ── SUGGESTED ROLES ─────────────────────────────────────────────────────
  const topRoles = result.topRoles?.length ? `
    ${sectionHeader("🎯", "Suggested Roles")}
    ${result.topRoles.map((role, i) => card(`
      <div style="display:flex;align-items:center;gap:12px">
        <div style="
          width:28px;height:28px;border-radius:50%;flex-shrink:0;
          background:linear-gradient(135deg,#6366f1,#0d9488);
          display:flex;align-items:center;justify-content:center;
          font-size:12px;font-weight:800;color:#fff;
        ">${i + 1}</div>
        <span style="font-size:13.5px;font-weight:600;color:#0f172a">${role}</span>
      </div>
    `)).join("")}` : "";

  // ── FOOTER ──────────────────────────────────────────────────────────────
  const footer = `
    <div style="
      margin-top:40px;padding-top:16px;
      border-top:1px solid #e2e8f0;text-align:center;
    ">
      <div style="font-size:11px;color:#94a3b8;letter-spacing:.3px">
        Generated by ClearHire — AI-Powered Resume Analysis
      </div>
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Segoe UI',Arial,sans-serif; background:#fff; color:#0f172a; -webkit-print-color-adjust:exact; }
    .pdf-root { max-width:740px; margin:0 auto; padding:36px 36px 24px; }
  </style>
</head>
<body>
<div class="pdf-root">
  ${header}
  ${summary}
  ${scoreStats}
  ${matchBanner}
  ${topImprovements}
  ${strengths}
  ${improvements}
  ${ats}
  ${skills}
  ${skillsMatch}
  ${keywords}
  ${sectionFeedback}
  ${checklist}
  ${topRoles}
  ${footer}
</div>
</body>
</html>`;
}

// ── Export trigger ─────────────────────────────────────────────────────────

export async function exportReportAsPdf(result, meta = {}) {
  const html = buildPdfReportHtml(result, {
    ...meta,
    generatedAt: new Date().toISOString(),
  });

  const container = document.createElement("div");
  container.innerHTML = html;
  container.style.cssText =
    "position:fixed;left:-9999px;top:0;width:794px;background:#fff;z-index:-1";
  document.body.appendChild(container);

  const filename = `ClearHire-Report-${new Date().toISOString().slice(0, 10)}.pdf`;

  try {
    await html2pdf()
      .set({
        margin:   [10, 10, 10, 10],
        filename,
        image:    { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale:   2.5,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "avoid-all"] },
      })
      .from(container.querySelector(".pdf-root"))
      .save();
  } finally {
    document.body.removeChild(container);
  }
}
