import React, { useState } from "react";
import { getInterviewQuestions, getApiErrorMessage } from "../../services/api";

const CATEGORIES = [
  { key: "behavioral", label: "Behavioral", icon: "◈", color: "icon-blue" },
  { key: "technical", label: "Technical", icon: "◇", color: "icon-cyan" },
  { key: "roleSpecific", label: "Role-specific", icon: "◎", color: "icon-purple" },
];

const InterviewQuestions = ({ resumeText, jobDescription }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!resumeText) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await getInterviewQuestions(resumeText, { jobDescription });
      setData(result);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!data) return;
    const lines = [
      "INTERVIEW PREPARATION\n",
      ...CATEGORIES.flatMap(({ key, label }) =>
        data[key]?.length
          ? [`\n${label.toUpperCase()}\n`, ...data[key].map((q, i) => `${i + 1}. ${q}`)]
          : []
      ),
      data.tips?.length ? ["\nTIPS\n", ...data.tips.map((t) => `• ${t}`)] : [],
    ].flat();
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const totalQuestions = data
    ? CATEGORIES.reduce((sum, { key }) => sum + (data[key]?.length || 0), 0)
    : 0;

  return (
    <div className="result-card result-card-full interview-card">
      <div className="card-header">
        <div className="card-icon icon-purple">❓</div>
        <span className="card-title">Interview preparation</span>
        {data && (
          <button
            type="button"
            className="btn-secondary btn-sm copy-btn"
            onClick={handleCopy}
          >
            {copied ? "✓ Copied" : "Copy all"}
          </button>
        )}
      </div>

      {!data && !loading && (
        <>
          <p className="improve-summary-hint">
            Generate {jobDescription ? "role-tailored" : "resume-based"} interview questions
            to prepare for your next interview.
          </p>
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={handleGenerate}
          >
            Generate questions
          </button>
        </>
      )}

      {loading && (
        <div className="inline-loading">
          <div className="loader-ring loader-ring-sm" aria-hidden="true" />
          <span>Generating {jobDescription ? "tailored" : ""} questions…</span>
        </div>
      )}

      {error && (
        <div className="inline-error" role="alert">
          {error}
        </div>
      )}

      {data && (
        <>
          <p className="improve-summary-hint">
            {totalQuestions} questions generated. Prepare answers using the STAR method
            (Situation, Task, Action, Result).
          </p>

          <div className="interview-categories">
            {CATEGORIES.map(({ key, label, icon, color }) =>
              data[key]?.length ? (
                <div key={key} className="interview-category">
                  <div className="card-header">
                    <div className={`card-icon ${color}`}>{icon}</div>
                    <span className="card-subtitle">{label}</span>
                  </div>
                  <ol className="interview-questions-list">
                    {data[key].map((q, i) => (
                      <li key={i} className="interview-question-item">
                        {q}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null
            )}
          </div>

          {data.tips?.length > 0 && (
            <div className="interview-tips">
              <div className="card-header">
                <div className="card-icon icon-green">✦</div>
                <span className="card-subtitle">Preparation tips</span>
              </div>
              <ul className="result-list">
                {data.tips.map((tip, i) => (
                  <li key={i}>
                    <span className="list-dot dot-green" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            className="btn-secondary btn-sm"
            style={{ marginTop: "1rem" }}
            onClick={handleGenerate}
          >
            Regenerate
          </button>
        </>
      )}
    </div>
  );
};

export default InterviewQuestions;
