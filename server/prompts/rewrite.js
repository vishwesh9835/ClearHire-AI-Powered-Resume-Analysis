const MAX_TEXT = 4000;

function buildRewriteBulletPrompt(bulletText, jobDescription, contextSection) {
  const jd = (jobDescription || "").trim().slice(0, MAX_TEXT);
  const bullet = (bulletText || "").trim().slice(0, 2000);
  const section = (contextSection || "Experience").slice(0, 80);

  return `You improve resume bullet points. Rewrite for impact: strong verb, quantified outcome, clarity, no first person.

Section: ${section}
${jd ? `Job context (optional): ${jd}\n` : ""}
Original bullet:
"""
${bullet}
"""

Reply with JSON only: {"before": string (echo original), "after": string (rewritten bullet, one line)}`;
}

function buildImproveSummaryPrompt(summaryText, jobDescription) {
  const jd = (jobDescription || "").trim().slice(0, MAX_TEXT);
  const summary = (summaryText || "").trim().slice(0, 2000);

  return `You write concise professional resume summaries (3-5 lines max, no buzzword stuffing).

${jd ? `Target role context:\n${jd}\n\n` : ""}
Current summary:
"""
${summary}
"""

Reply with JSON only: {"improved": string (rewritten summary)}`;
}

function buildInterviewQuestionsPrompt(resumeText, jobDescription) {
  const resume = (resumeText || "").trim().slice(0, 6000);
  const jd = (jobDescription || "").trim().slice(0, 3000);

  return `You are an expert interview coach. Based on the candidate's resume${jd ? " and the job description" : ""}, generate targeted interview questions they should prepare for.

${jd ? `Job description:\n"""\n${jd}\n"""\n` : ""}
Resume:
"""
${resume}
"""

Reply with JSON only (no markdown):
{
  "behavioral": string[] (4-5 behavioral/STAR questions based on their experience),
  "technical": string[] (3-4 technical or domain-specific questions from their skills),
  "roleSpecific": string[] (3-4 questions specific to the role or industry${jd ? " from the JD" : ""}),
  "tips": string[] (2-3 short preparation tips personalized to their profile)
}`;
}

function buildCoverLetterPrompt(resumeText, jobDescription, tone) {
  const resume = (resumeText || "").trim().slice(0, 6000);
  const jd = (jobDescription || "").trim().slice(0, 3000);
  const toneStr = ["professional", "enthusiastic", "concise"].includes(tone)
    ? tone
    : "professional";

  return `You write compelling, human cover letters. Tone: ${toneStr}. No generic phrases like "I am writing to express my interest". No clichés. Be specific to the candidate's actual experience.

${jd ? `Job description:\n"""\n${jd}\n"""\n` : "Target role: general application\n"}
Resume:
"""
${resume}
"""

Write a cover letter that:
- Opens with a strong, specific hook (not "I am applying for...")
- Highlights 2-3 concrete achievements from the resume
- Connects skills to the role requirements${jd ? " from the JD" : ""}
- Closes with a confident call to action
- Is 3-4 paragraphs, under 350 words

Reply with JSON only: {"subjectLine": string (email subject line), "letter": string (the cover letter, use \\n for paragraph breaks)}`;
}

module.exports = {
  buildRewriteBulletPrompt,
  buildImproveSummaryPrompt,
  buildInterviewQuestionsPrompt,
  buildCoverLetterPrompt,
};
