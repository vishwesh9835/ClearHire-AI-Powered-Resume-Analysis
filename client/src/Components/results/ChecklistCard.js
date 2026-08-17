import React from "react";

const statusClass = {
  pass: "checklist-pass",
  warn: "checklist-warn",
  fail: "checklist-fail",
};

const ChecklistCard = ({ checklist }) => {
  if (!checklist || checklist.length === 0) return null;
  return (
    <div className="result-card result-card-full">
      <div className="card-header">
        <div className="card-icon icon-green">✓</div>
        <span className="card-title">Resume quality checklist</span>
      </div>
      <ul className="checklist-list">
        {checklist.map((item, i) => (
          <li key={i} className={`checklist-row ${statusClass[item.status] || "checklist-warn"}`}>
            <span className="checklist-status" aria-hidden="true">
              {item.status === "pass" ? "✓" : item.status === "fail" ? "!" : "•"}
            </span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChecklistCard;
