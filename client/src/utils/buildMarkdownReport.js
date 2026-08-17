export function buildMarkdownReport(result, meta = {}) {
  const lines = [];
  lines.push("# Resume analysis report");
  if (meta.generatedAt) {
    lines.push(`Generated: ${meta.generatedAt}`);
  }
  lines.push("");
  lines.push(`## Overall score: ${result.score ?? "—"}/100`);
  if (result.summary) {
    lines.push("");
    lines.push("### Summary");
    lines.push(result.summary);
  }
  if (result.matchScore != null && result.matchExplanation) {
    lines.push("");
    lines.push(`### Job match: ${result.matchScore}/100`);
    lines.push(result.matchExplanation);
  }
  if (result.atsScore != null) {
    lines.push("");
    lines.push(`### ATS: ${result.atsScore}/100`);
    if (result.atsExplanation) lines.push(result.atsExplanation);
  }
  if (result.topImprovements?.length) {
    lines.push("");
    lines.push("### Fastest improvements");
    result.topImprovements.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
  }
  if (result.strengths?.length) {
    lines.push("");
    lines.push("### Strengths");
    result.strengths.forEach((s) => lines.push(`- ${s}`));
  }
  if (result.suggestions?.length) {
    lines.push("");
    lines.push("### Suggestions");
    result.suggestions.forEach((s) => lines.push(`- ${s}`));
  }
  return lines.join("\n");
}
