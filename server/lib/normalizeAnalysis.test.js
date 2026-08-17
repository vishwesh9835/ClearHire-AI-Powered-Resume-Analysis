const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeAnalysis, clampScore } = require("./normalizeAnalysis");

test("clampScore", async (t) => {
  await t.test("clamps values above 100 down to 100", () => {
    assert.equal(clampScore(150), 100);
  });

  await t.test("clamps negative values up to 0", () => {
    assert.equal(clampScore(-20), 0);
  });

  await t.test("rounds decimals", () => {
    assert.equal(clampScore(72.6), 73);
  });

  await t.test("treats non-numeric input as 0", () => {
    assert.equal(clampScore("not a number"), 0);
    assert.equal(clampScore(undefined), 0);
    assert.equal(clampScore(null), 0);
  });

  await t.test("accepts numeric strings", () => {
    assert.equal(clampScore("85"), 85);
  });
});

test("normalizeAnalysis - garbage / missing input", async (t) => {
  await t.test("never throws on null input", () => {
    const result = normalizeAnalysis(null, { hasJobDescription: false });
    assert.equal(result.score, 0);
    assert.deepEqual(result.skills, []);
    assert.equal(result.summary, "");
  });

  await t.test("never throws when raw is an array instead of an object", () => {
    const result = normalizeAnalysis(["oops"], { hasJobDescription: false });
    assert.equal(result.score, 0);
    assert.deepEqual(result.strengths, []);
  });

  await t.test("never throws when raw is a plain string", () => {
    const result = normalizeAnalysis("not json", { hasJobDescription: false });
    assert.equal(result.score, 0);
  });
});

test("normalizeAnalysis - matchScore depends on hasJobDescription", async (t) => {
  await t.test("matchScore is null when no job description was supplied, even if the model returned one", () => {
    const result = normalizeAnalysis({ score: 80, matchScore: 55 }, { hasJobDescription: false });
    assert.equal(result.matchScore, null);
    assert.equal(result.matchExplanation, "");
  });

  await t.test("matchScore uses raw.matchScore when a job description was supplied", () => {
    const result = normalizeAnalysis({ score: 80, matchScore: 55 }, { hasJobDescription: true });
    assert.equal(result.matchScore, 55);
  });

  await t.test("matchScore falls back to overall score if matchScore is missing but a job description was supplied", () => {
    const result = normalizeAnalysis({ score: 80 }, { hasJobDescription: true });
    assert.equal(result.matchScore, 80);
  });
});

test("normalizeAnalysis - atsScore", async (t) => {
  await t.test("is null when absent", () => {
    const result = normalizeAnalysis({ score: 80 }, { hasJobDescription: false });
    assert.equal(result.atsScore, null);
  });

  await t.test("is clamped when present", () => {
    const result = normalizeAnalysis({ atsScore: 140 }, { hasJobDescription: false });
    assert.equal(result.atsScore, 100);
  });
});

test("normalizeAnalysis - topImprovements", async (t) => {
  await t.test("caps at 3 items even if more are supplied", () => {
    const result = normalizeAnalysis(
      { topImprovements: ["a", "b", "c", "d", "e"] },
      { hasJobDescription: false }
    );
    assert.equal(result.topImprovements.length, 3);
    assert.deepEqual(result.topImprovements, ["a", "b", "c"]);
  });

  await t.test("backfills from suggestions when fewer than 3 topImprovements are given", () => {
    const result = normalizeAnalysis(
      { topImprovements: ["a"], suggestions: ["b", "c", "d"] },
      { hasJobDescription: false }
    );
    assert.deepEqual(result.topImprovements, ["a", "b", "c"]);
  });

  await t.test("does not duplicate a suggestion that already appears in topImprovements", () => {
    const result = normalizeAnalysis(
      { topImprovements: ["a"], suggestions: ["a", "b"] },
      { hasJobDescription: false }
    );
    assert.deepEqual(result.topImprovements, ["a", "b"]);
  });
});

test("normalizeAnalysis - keywordsMissing", async (t) => {
  await t.test("passes through the expected object shape", () => {
    const result = normalizeAnalysis(
      { keywordsMissing: { technical: ["React"], tools: ["Git"], softSkills: ["Leadership"] } },
      { hasJobDescription: true }
    );
    assert.deepEqual(result.keywordsMissing, {
      technical: ["React"],
      tools: ["Git"],
      softSkills: ["Leadership"],
    });
  });

  await t.test("splits a flat array roughly into thirds", () => {
    const result = normalizeAnalysis(
      { keywordsMissing: ["a", "b", "c", "d", "e", "f"] },
      { hasJobDescription: true }
    );
    assert.equal(result.keywordsMissing.technical.length, 2);
    assert.equal(result.keywordsMissing.tools.length, 2);
    assert.equal(result.keywordsMissing.softSkills.length, 2);
  });

  await t.test("defaults to empty groups on unexpected shapes", () => {
    const result = normalizeAnalysis({ keywordsMissing: "nonsense" }, { hasJobDescription: true });
    assert.deepEqual(result.keywordsMissing, { technical: [], tools: [], softSkills: [] });
  });
});

test("normalizeAnalysis - weakBullets", async (t) => {
  await t.test("filters out bullets with no text", () => {
    const result = normalizeAnalysis(
      { weakBullets: [{ text: "Did stuff" }, { text: "" }, { text: "   " }] },
      { hasJobDescription: false }
    );
    // Only bullets that end up with non-empty text survive
    assert.equal(result.weakBullets.length, 2);
    assert.equal(result.weakBullets[0].text, "Did stuff");
  });

  await t.test("defaults severity to medium when invalid or missing", () => {
    const result = normalizeAnalysis(
      { weakBullets: [{ text: "Managed things", severity: "extreme" }] },
      { hasJobDescription: false }
    );
    assert.equal(result.weakBullets[0].severity, "medium");
  });

  await t.test("keeps a valid severity as-is", () => {
    const result = normalizeAnalysis(
      { weakBullets: [{ text: "Managed things", severity: "high" }] },
      { hasJobDescription: false }
    );
    assert.equal(result.weakBullets[0].severity, "high");
  });
});

test("normalizeAnalysis - checklist", async (t) => {
  await t.test("defaults status to warn when invalid or missing", () => {
    const result = normalizeAnalysis(
      { checklist: [{ label: "Has contact info" }, { label: "Uses action verbs", status: "nonsense" }] },
      { hasJobDescription: false }
    );
    assert.equal(result.checklist[0].status, "warn");
    assert.equal(result.checklist[1].status, "warn");
  });

  await t.test("keeps a valid status as-is", () => {
    const result = normalizeAnalysis(
      { checklist: [{ label: "Has contact info", status: "pass" }] },
      { hasJobDescription: false }
    );
    assert.equal(result.checklist[0].status, "pass");
  });
});

test("normalizeAnalysis - skillsMatch", async (t) => {
  await t.test("defaults safely when missing", () => {
    const result = normalizeAnalysis({}, { hasJobDescription: true });
    assert.deepEqual(result.skillsMatch, { overlapPercent: 0, matched: [], gap: [] });
  });

  await t.test("clamps overlapPercent and passes through matched/gap arrays", () => {
    const result = normalizeAnalysis(
      { skillsMatch: { overlapPercent: 120, matched: ["React"], gap: ["Go"] } },
      { hasJobDescription: true }
    );
    assert.equal(result.skillsMatch.overlapPercent, 100);
    assert.deepEqual(result.skillsMatch.matched, ["React"]);
    assert.deepEqual(result.skillsMatch.gap, ["Go"]);
  });
});
