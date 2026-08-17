import React from "react";

const TopImprovements = ({ items }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="result-card result-card-full top-improvements-card">
      <div className="card-header">
        <div className="card-icon icon-orange">⚡</div>
        <span className="card-title">Top 3 fastest improvements</span>
      </div>
      <ol className="top-improvements-list">
        {items.slice(0, 3).map((text, i) => (
          <li key={i}>
            <span className="top-improvements-num">{i + 1}</span>
            <span>{text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default TopImprovements;
