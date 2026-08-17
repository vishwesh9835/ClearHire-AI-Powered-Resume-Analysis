import React from "react";

const groups = [
  { key: "technical", title: "Technical" },
  { key: "tools", title: "Tools & platforms" },
  { key: "softSkills", title: "Soft skills" },
];

const KeywordGroups = ({ keywordsMissing }) => {
  if (!keywordsMissing) return null;
  const hasAny = groups.some(
    (g) => keywordsMissing[g.key] && keywordsMissing[g.key].length > 0
  );
  if (!hasAny) return null;

  return (
    <div className="result-card result-card-full">
      <div className="card-header">
        <div className="card-icon icon-red">🔑</div>
        <span className="card-title">Keyword gaps</span>
      </div>
      <p className="keyword-groups-hint">
        Terms to weave into your bullets where honest — grouped for clarity.
      </p>
      <div className="keyword-groups-grid">
        {groups.map(({ key, title }) => {
          const list = keywordsMissing[key] || [];
          if (list.length === 0) return null;
          return (
            <div key={key} className="keyword-group">
              <h4 className="keyword-group-title">{title}</h4>
              <div className="keyword-tags">
                {list.map((kw, i) => (
                  <span key={i} className="keyword-tag">
                    + {kw}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KeywordGroups;
