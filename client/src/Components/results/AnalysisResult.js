import React, { useEffect, useRef } from "react";
import ScoreCircle from "./ScoreCircle";
import TopImprovements from "./TopImprovements";
import SkillsMatchBar from "./SkillsMatchBar";
import KeywordGroups from "./KeywordGroups";
import SectionFeedback from "./SectionFeedback";
import FormattingWarnings from "./FormattingWarnings";
import ChecklistCard from "./ChecklistCard";
import WeakBullets from "./WeakBullets";

import StickyReportActions from "./StickyReportActions";
import InterviewQuestions from "./InterviewQuestions";
import CoverLetter from "./CoverLetter";

function atsBarClass(atsScore) {
  if (atsScore == null || Number.isNaN(Number(atsScore))) return null;
  const n = Number(atsScore);
  if (n >= 70) return "good";
  if (n >= 45) return "medium";
  return "poor";
}

// Staggered animation helper: injects inline animation-delay
function stagger(idx, base = 0.08) {
  return { style: { animationDelay: `${idx * base}s` } };
}

const AnalysisResult = ({ result, onReset, jobDescription, resumeText, meta }) => {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [result]);

  if (!result) return null;

  const ats = result.atsScore;
  const atsClass = atsBarClass(ats);
  const hasAts = ats != null && !Number.isNaN(Number(ats));
  const hasMatch = result.matchScore != null && !Number.isNaN(Number(result.matchScore));

  const mdMeta = {
    ...meta,
    generatedAt: new Date().toISOString(),
  };

  return (
    <div className="results-wrapper print-root">
      <StickyReportActions result={result} meta={mdMeta} />

      <div className="results-header">
        <h2 ref={headingRef} tabIndex={-1} className="results-title">
          Analysis report
        </h2>
        <button
          type="button"
          className="reset-btn"
          onClick={onReset}
          id="analyze-again-btn"
        >
          <span aria-hidden="true">↩</span>
          <span>New analysis</span>
        </button>
      </div>

      {/* ── Score hero ── */}
      <div className="score-section">
        <ScoreCircle score={result.score} color={["#0d9488", "#6366f1"]} />
        <div className="score-info">
          <h3>Resume score</h3>
          {result.summary && <p className="score-summary">{result.summary}</p>}
          <div className="score-badges">
            {result.experienceLevel && (
              <span className="badge badge-blue">Level: {result.experienceLevel}</span>
            )}
            <span className="badge badge-purple">AI-assisted review</span>
            {hasAts && (
              <span className="badge badge-cyan">ATS {Math.round(Number(ats))}%</span>
            )}
            {hasMatch && (
              <span className="badge badge-green">
                Match {Math.round(Number(result.matchScore))}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Job match banner ── */}
      {hasMatch && (
        <div className="match-banner">
          <div className="match-banner-inner">
            <span className="match-banner-label">Job match</span>
            <span className="match-banner-score">{Math.round(Number(result.matchScore))}</span>
            <span className="match-banner-denom">/ 100</span>
          </div>
          {result.matchExplanation && (
            <p className="match-banner-text">{result.matchExplanation}</p>
          )}
        </div>
      )}

      <TopImprovements items={result.topImprovements} />

      {/* ── Main grid ── */}
      <div className="results-grid">
        {result.skills && result.skills.length > 0 && (
          <div className="result-card result-card-full" {...stagger(0)}>
            <div className="card-header">
              <div className="card-icon icon-blue">◇</div>
              <span className="card-title">Detected skills</span>
            </div>
            <div className="skills-grid">
              {result.skills.map((skill, i) => (
                <span key={i} className="skill-tag">{skill}</span>
              ))}
            </div>
          </div>
        )}

        <SkillsMatchBar skillsMatch={result.skillsMatch} />

        {result.strengths && result.strengths.length > 0 && (
          <div className="result-card" {...stagger(1)}>
            <div className="card-header">
              <div className="card-icon icon-green">✓</div>
              <span className="card-title">Strengths</span>
            </div>
            <ul className="result-list">
              {result.strengths.map((s, i) => (
                <li key={i}>
                  <span className="list-dot dot-green" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.suggestions && result.suggestions.length > 0 && (
          <div className="result-card" {...stagger(2)}>
            <div className="card-header">
              <div className="card-icon icon-orange">→</div>
              <span className="card-title">Improvements</span>
            </div>
            <ul className="result-list">
              {result.suggestions.map((s, i) => (
                <li key={i}>
                  <span className="list-dot dot-orange" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasAts && (
          <div className="result-card" {...stagger(3)}>
            <div className="card-header">
              <div className="card-icon icon-cyan">▤</div>
              <span className="card-title">ATS readiness</span>
            </div>
            <div className="ats-bar-wrapper">
              <div className="ats-bar-labels">
                <span className="ats-score-text">{Math.round(Number(ats))}%</span>
                <span className="ats-label">
                  {atsClass === "good" && "Strong for parsers"}
                  {atsClass === "medium" && "Room to optimize"}
                  {atsClass === "poor" && "Needs structure & keywords"}
                </span>
              </div>
              <div className="ats-bar-track">
                <div
                  className={`ats-bar-fill ${atsClass}`}
                  style={{ width: `${Math.min(100, Math.max(0, Number(ats)))}%` }}
                />
              </div>
              {result.atsExplanation && (
                <p className="ats-tip">{result.atsExplanation}</p>
              )}
            </div>
          </div>
        )}

        <FormattingWarnings items={result.formattingWarnings} />
      </div>

      <KeywordGroups keywordsMissing={result.keywordsMissing} />

      <SectionFeedback sectionFeedback={result.sectionFeedback} />

      <div className="results-grid">
        <ChecklistCard checklist={result.checklist} />
      </div>

      <WeakBullets weakBullets={result.weakBullets} jobDescription={jobDescription} />



      <InterviewQuestions resumeText={resumeText} jobDescription={jobDescription} />

      <CoverLetter resumeText={resumeText} jobDescription={jobDescription} />

      {result.topRoles && result.topRoles.length > 0 && (
        <div className="result-card result-card-full">
          <div className="card-header">
            <div className="card-icon icon-purple">◎</div>
            <span className="card-title">Role ideas</span>
          </div>
          <div className="roles-list">
            {result.topRoles.map((role, i) => (
              <div key={i} className="role-item">
                <div className="role-num">{i + 1}</div>
                {role}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisResult;
