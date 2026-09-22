import React, { useState, useEffect } from "react";
import Icon from "../Icon";
import { improveSummary, getApiErrorMessage } from "../../services/api";

/** Server-side minimum for /api/improve-summary. */
const MIN_SUMMARY_CHARS = 20;

/** Attempts to extract an existing candidate summary/profile from resume text. */
export function extractCandidateSummary(resumeText) {
  if (!resumeText || typeof resumeText !== "string") return "";
  const match = resumeText.match(
    /(?:^|\n)\s*(?:PROFESSIONAL\s+SUMMARY|EXECUTIVE\s+SUMMARY|SUMMARY\s+OF\s+QUALIFICATIONS|CAREER\s+SUMMARY|SUMMARY|ABOUT\s+ME|PROFILE)\s*[:\-–—]?\s*\n+([\s\S]{20,800}?)(?=\n\s*(?:EXPERIENCE|WORK\s+EXPERIENCE|EMPLOYMENT|SKILLS|EDUCATION|PROJECTS|CERTIFICATIONS)|$)/i
  );
  return match ? match[1].trim() : "";
}

/**
 * Rewrites the resume's professional summary.
 *
 * Pre-filled with the candidate's summary from the resume or the analysis summary,
 * but editable so the user can paste or iterate on any version.
 */
const SummaryImprover = ({ summary, resumeText, jobDescription }) => {
  const getInitial = () => extractCandidateSummary(resumeText) || summary || "";
  const [text, setText] = useState(getInitial);
  const [loading, setLoading] = useState(false);
  const [improved, setImproved] = useState("");
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // A new analysis replaces the source summary, so drop any previous rewrite.
  useEffect(() => {
    setText(extractCandidateSummary(resumeText) || summary || "");
    setImproved("");
    setError(null);
  }, [summary, resumeText]);

  const trimmed = text.trim();
  const canImprove = !loading && trimmed.length >= MIN_SUMMARY_CHARS;

  const handleImprove = async () => {
    setLoading(true);
    setError(null);
    setImproved("");
    try {
      const data = await improveSummary(trimmed, { jobDescription });
      setImproved(data.improved || "");
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(improved).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="result-card result-card-full summary-improver-card">
      <div className="card-header">
        <div className="card-icon icon-purple">
          <Icon name="paragraph" />
        </div>
        <span className="card-title">Summary rewriting</span>
        {improved && (
          <button
            type="button"
            className="btn-secondary btn-sm copy-btn"
            onClick={handleCopy}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        )}
      </div>

      <p className="card-hint">
        Tighten your opening summary into 3–5 lines that lead with your strongest
        evidence.
      </p>

      <label className="field-label" htmlFor="summary-improver-input">
        Your summary
      </label>
      <textarea
        id="summary-improver-input"
        className="paste-textarea improve-summary-textarea"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your professional summary here…"
      />

      <p className="field-hint">
        {trimmed.length.toLocaleString()} characters
        {trimmed.length > 0 && trimmed.length < MIN_SUMMARY_CHARS && (
          <span style={{ color: "var(--accent-amber)", marginLeft: 6 }}>
            (need {MIN_SUMMARY_CHARS - trimmed.length} more)
          </span>
        )}
      </p>

      {error && (
        <div className="inline-error" role="alert">
          {error}
        </div>
      )}

      {loading && (
        <div className="inline-loading">
          <div className="loader-ring loader-ring-sm" aria-hidden="true" />
          <span>Rewriting your summary…</span>
        </div>
      )}

      {!loading && (
        <button
          type="button"
          className="btn-primary btn-sm improve-summary-submit"
          onClick={handleImprove}
          disabled={!canImprove}
          title={
            canImprove
              ? ""
              : `Enter at least ${MIN_SUMMARY_CHARS} characters to improve`
          }
        >
          {improved ? "Rewrite again" : "Improve summary"}
        </button>
      )}

      {improved && (
        <div className="improve-summary-output">
          <span className="rewrite-label">Improved summary</span>
          <p>{improved}</p>
        </div>
      )}
    </div>
  );
};

export default SummaryImprover;
