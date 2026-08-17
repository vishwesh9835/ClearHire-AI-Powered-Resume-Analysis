import { buildMarkdownReport } from "./buildMarkdownReport";

test("includes the report header and overall score", () => {
  const md = buildMarkdownReport({ score: 82 });
  expect(md).toContain("# Resume analysis report");
  expect(md).toContain("## Overall score: 82/100");
});

test("shows an em dash for the score when it is missing", () => {
  const md = buildMarkdownReport({});
  expect(md).toContain("## Overall score: —/100");
});

test("includes a Generated line only when meta.generatedAt is provided", () => {
  const withDate = buildMarkdownReport({ score: 50 }, { generatedAt: "2026-01-01" });
  expect(withDate).toContain("Generated: 2026-01-01");

  const withoutDate = buildMarkdownReport({ score: 50 });
  expect(withoutDate).not.toContain("Generated:");
});

test("includes a Summary section only when result.summary is present", () => {
  const withSummary = buildMarkdownReport({ score: 70, summary: "Solid resume overall." });
  expect(withSummary).toContain("### Summary");
  expect(withSummary).toContain("Solid resume overall.");

  const withoutSummary = buildMarkdownReport({ score: 70 });
  expect(withoutSummary).not.toContain("### Summary");
});

test("includes a Job match section only when both matchScore and matchExplanation are present", () => {
  const full = buildMarkdownReport({
    score: 70,
    matchScore: 60,
    matchExplanation: "Good overlap with the role.",
  });
  expect(full).toContain("### Job match: 60/100");
  expect(full).toContain("Good overlap with the role.");

  // matchScore with no explanation should not render the section
  const noExplanation = buildMarkdownReport({ score: 70, matchScore: 60 });
  expect(noExplanation).not.toContain("### Job match");

  // explanation with no score should not render the section
  const noScore = buildMarkdownReport({ score: 70, matchExplanation: "Some text" });
  expect(noScore).not.toContain("### Job match");
});

test("includes an ATS section when atsScore is present, with explanation if given", () => {
  const withExplanation = buildMarkdownReport({
    score: 70,
    atsScore: 90,
    atsExplanation: "Clean single-column layout.",
  });
  expect(withExplanation).toContain("### ATS: 90/100");
  expect(withExplanation).toContain("Clean single-column layout.");

  const withoutExplanation = buildMarkdownReport({ score: 70, atsScore: 90 });
  expect(withoutExplanation).toContain("### ATS: 90/100");

  const withoutAts = buildMarkdownReport({ score: 70 });
  expect(withoutAts).not.toContain("### ATS");
});

test("renders topImprovements as a numbered list", () => {
  const md = buildMarkdownReport({
    score: 70,
    topImprovements: ["Add metrics to bullets", "Tighten the summary"],
  });
  expect(md).toContain("### Fastest improvements");
  expect(md).toContain("1. Add metrics to bullets");
  expect(md).toContain("2. Tighten the summary");
});

test("renders strengths and suggestions as bulleted lists", () => {
  const md = buildMarkdownReport({
    score: 70,
    strengths: ["Strong technical skills"],
    suggestions: ["Quantify impact where possible"],
  });
  expect(md).toContain("### Strengths");
  expect(md).toContain("- Strong technical skills");
  expect(md).toContain("### Suggestions");
  expect(md).toContain("- Quantify impact where possible");
});

test("omits list sections entirely when their arrays are empty or absent", () => {
  const md = buildMarkdownReport({ score: 70, strengths: [], suggestions: [] });
  expect(md).not.toContain("### Strengths");
  expect(md).not.toContain("### Suggestions");
  expect(md).not.toContain("### Fastest improvements");
});
