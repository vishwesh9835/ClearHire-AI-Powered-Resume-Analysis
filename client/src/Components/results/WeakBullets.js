import React, { useState } from "react";
import { rewriteBullet, getApiErrorMessage } from "../../services/api";

const WeakBullets = ({ weakBullets, jobDescription }) => {
  const [loadingId, setLoadingId] = useState(null);
  // Store all rewrites keyed by bullet id
  const [rewrites, setRewrites] = useState({});
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState(null);

  if (!weakBullets || weakBullets.length === 0) return null;

  const handleRewrite = async (b) => {
    setLoadingId(b.id);
    setError(null);
    try {
      const data = await rewriteBullet(b.text, {
        jobDescription,
        contextSection: b.section,
      });
      setRewrites((prev) => ({ ...prev, [b.id]: { before: data.before, after: data.after } }));
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoadingId(null);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="result-card result-card-full">
      <div className="card-header">
        <div className="card-icon icon-orange">✎</div>
        <span className="card-title">Bullets to strengthen</span>
      </div>
      <p className="weak-bullets-hint">
        Rewrite adds impact; review so it stays truthful.
      </p>
      {error && (
        <div className="inline-error" role="alert">
          {error}
        </div>
      )}
      <ul className="weak-bullets-list">
        {weakBullets.map((b) => {
          const rewrite = rewrites[b.id];
          return (
            <li key={b.id} className="weak-bullet-item">
              <div className="weak-bullet-meta">
                <span className={`severity-badge severity-${b.severity || "medium"}`}>
                  {b.severity || "medium"}
                </span>
                <span className="weak-bullet-section">{b.section}</span>
              </div>
              <p className="weak-bullet-text">{b.text}</p>
              <button
                type="button"
                className="btn-secondary btn-sm"
                disabled={loadingId === b.id}
                onClick={() => handleRewrite(b)}
              >
                {loadingId === b.id ? "Rewriting…" : rewrite ? "Rewrite again" : "Rewrite this bullet"}
              </button>
              {rewrite && (
                <div className="rewrite-preview" role="region" aria-label="Before and after">
                  <div className="rewrite-col">
                    <span className="rewrite-label">Before</span>
                    <p>{rewrite.before}</p>
                  </div>
                  <div className="rewrite-col rewrite-after">
                    <div className="rewrite-after-header">
                      <span className="rewrite-label">After</span>
                      <button
                        type="button"
                        className="copy-inline-btn"
                        onClick={() => handleCopy(b.id, rewrite.after)}
                      >
                        {copied === b.id ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                    <p>{rewrite.after}</p>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default WeakBullets;
