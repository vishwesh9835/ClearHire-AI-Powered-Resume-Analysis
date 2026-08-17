import React, { useState, useMemo, useEffect } from "react";

const blocks = [
  { key: "summary", title: "Summary / profile" },
  { key: "experience", title: "Experience" },
  { key: "education", title: "Education" },
  { key: "projects", title: "Projects" },
];

function SectionBlock({ title, data }) {
  const strengths = data?.strengths || [];
  const improvements = data?.improvements || [];
  if (strengths.length === 0 && improvements.length === 0) return null;

  return (
    <div className="section-feedback-block">
      <h4 className="section-feedback-heading">{title}</h4>
      {strengths.length > 0 && (
        <div className="section-feedback-col">
          <span className="section-feedback-label">What works</span>
          <ul className="result-list">
            {strengths.map((s, i) => (
              <li key={i}>
                <span className="list-dot dot-green" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
      {improvements.length > 0 && (
        <div className="section-feedback-col">
          <span className="section-feedback-label">Improve</span>
          <ul className="result-list">
            {improvements.map((s, i) => (
              <li key={i}>
                <span className="list-dot dot-orange" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const SectionFeedback = ({ sectionFeedback }) => {
  const defaultTab = useMemo(() => {
    if (!sectionFeedback) return "summary";
    const found = blocks.find((b) => {
      const d = sectionFeedback[b.key];
      return (
        d &&
        ((d.strengths && d.strengths.length > 0) ||
          (d.improvements && d.improvements.length > 0))
      );
    });
    return found?.key || "summary";
  }, [sectionFeedback]);

  const [open, setOpen] = useState(defaultTab);
  useEffect(() => {
    setOpen(defaultTab);
  }, [defaultTab]);

  if (!sectionFeedback) return null;

  const hasContent = blocks.some((b) => {
    const d = sectionFeedback[b.key];
    return (
      d &&
      ((d.strengths && d.strengths.length > 0) ||
        (d.improvements && d.improvements.length > 0))
    );
  });
  if (!hasContent) return null;

  return (
    <div className="result-card result-card-full section-feedback-card">
      <div className="card-header">
        <div className="card-icon icon-purple">📑</div>
        <span className="card-title">Section-by-section feedback</span>
      </div>
      <div className="section-feedback-tabs" role="tablist" aria-label="Resume sections">
        {blocks.map(({ key, title }) => {
          const d = sectionFeedback[key];
          const empty =
            !d ||
            ((!d.strengths || d.strengths.length === 0) &&
              (!d.improvements || d.improvements.length === 0));
          if (empty) return null;
          const active = open === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`section-feedback-tab ${active ? "active" : ""}`}
              onClick={() => setOpen(key)}
            >
              {title}
            </button>
          );
        })}
      </div>
      {blocks.map(({ key, title }) => {
        if (open !== key) return null;
        const d = sectionFeedback[key];
        return <SectionBlock key={key} title={title} data={d} />;
      })}
    </div>
  );
};

export default SectionFeedback;
