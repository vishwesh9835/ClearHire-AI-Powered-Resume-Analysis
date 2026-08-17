import React from "react";

const SkillsMatchBar = ({ skillsMatch }) => {
  if (!skillsMatch) return null;
  const pct = Math.max(0, Math.min(100, Number(skillsMatch.overlapPercent) || 0));
  const hasLists =
    (skillsMatch.matched && skillsMatch.matched.length > 0) ||
    (skillsMatch.gap && skillsMatch.gap.length > 0);
  if (pct <= 0 && !hasLists) return null;
  return (
    <div className="result-card result-card-full">
      <div className="card-header">
        <div className="card-icon icon-blue">📈</div>
        <span className="card-title">Skills match</span>
      </div>
      <div className="skills-match-meter" role="group" aria-label="Skills overlap">
        <div className="skills-match-labels">
          <span>Overlap with role signals</span>
          <span className="skills-match-pct">{pct}%</span>
        </div>
        <div className="skills-match-track">
          <div
            className="skills-match-fill"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {skillsMatch.matched && skillsMatch.matched.length > 0 && (
        <div className="skills-match-section">
          <span className="skills-match-subtitle">Matched</span>
          <div className="skills-grid">
            {skillsMatch.matched.slice(0, 12).map((s, i) => (
              <span key={i} className="skill-tag skill-tag-match">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
      {skillsMatch.gap && skillsMatch.gap.length > 0 && (
        <div className="skills-match-section">
          <span className="skills-match-subtitle">Gaps to consider</span>
          <div className="skills-grid">
            {skillsMatch.gap.slice(0, 12).map((s, i) => (
              <span key={i} className="skill-tag skill-tag-gap">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillsMatchBar;
