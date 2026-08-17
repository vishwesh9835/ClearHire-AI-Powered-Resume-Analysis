import React from "react";

const FormattingWarnings = ({ items }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="result-card">
      <div className="card-header">
        <div className="card-icon icon-cyan">📐</div>
        <span className="card-title">ATS formatting notes</span>
      </div>
      <ul className="result-list">
        {items.map((s, i) => (
          <li key={i}>
            <span className="list-dot dot-blue" />
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FormattingWarnings;
