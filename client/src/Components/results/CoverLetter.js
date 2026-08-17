import React, { useState } from "react";
import { generateCoverLetter, getApiErrorMessage } from "../../services/api";

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "enthusiastic", label: "Enthusiastic" },
  { value: "concise", label: "Concise" },
];

const CoverLetter = ({ resumeText, jobDescription }) => {
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState("professional");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!resumeText) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await generateCoverLetter(resumeText, { jobDescription, tone });
      setData(result);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!data) return;
    const text = [
      data.subjectLine ? `Subject: ${data.subjectLine}\n\n` : "",
      data.letter,
    ].join("");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="result-card result-card-full cover-letter-card">
      <div className="card-header">
        <div className="card-icon icon-blue">✉</div>
        <span className="card-title">Cover letter generator</span>
        {data && (
          <button
            type="button"
            className="btn-secondary btn-sm copy-btn"
            onClick={handleCopy}
          >
            {copied ? "✓ Copied" : "Copy letter"}
          </button>
        )}
      </div>

      {!data && (
        <>
          <p className="improve-summary-hint">
            Generate a tailored cover letter from your resume
            {jobDescription ? " and the job description" : ""}.
          </p>

          <div className="tone-selector" role="group" aria-label="Letter tone">
            <span className="field-label" style={{ marginBottom: "0.5rem" }}>Tone</span>
            <div className="input-mode-toggle">
              {TONES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`mode-btn ${tone === value ? "active" : ""}`}
                  onClick={() => setTone(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {!data && !loading && (
        <button
          type="button"
          className="btn-primary btn-sm"
          onClick={handleGenerate}
          style={{ marginTop: "1rem" }}
        >
          Generate cover letter
        </button>
      )}

      {loading && (
        <div className="inline-loading">
          <div className="loader-ring loader-ring-sm" aria-hidden="true" />
          <span>Writing your cover letter…</span>
        </div>
      )}

      {error && (
        <div className="inline-error" role="alert">
          {error}
        </div>
      )}

      {data && (
        <div className="cover-letter-output">
          {data.subjectLine && (
            <div className="cover-letter-subject">
              <span className="rewrite-label">Email subject line</span>
              <p className="cover-letter-subject-text">{data.subjectLine}</p>
            </div>
          )}
          <div className="cover-letter-body">
            <span className="rewrite-label">Cover letter</span>
            <div className="cover-letter-text">
              {data.letter.split("\n").map((para, i) =>
                para.trim() ? <p key={i}>{para}</p> : <br key={i} />
              )}
            </div>
          </div>
          <div className="cover-letter-actions">
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={handleGenerate}
            >
              Regenerate
            </button>
            <div className="tone-selector-inline">
              {TONES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`mode-btn mode-btn-sm ${tone === value ? "active" : ""}`}
                  onClick={() => setTone(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverLetter;
