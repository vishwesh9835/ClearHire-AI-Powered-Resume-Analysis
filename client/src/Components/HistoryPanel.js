import React, { useState, useCallback } from "react";
import {
  loadHistory,
  deleteHistoryEntry,
  clearHistory,
} from "../utils/historyStorage";

const HistoryPanel = ({ open, onClose, onLoadEntry }) => {
  const [list, setList] = useState([]);

  const refresh = useCallback(() => {
    setList(loadHistory());
  }, []);

  React.useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  if (!open) return null;

  return (
    <div className="history-overlay" role="dialog" aria-modal="true" aria-labelledby="history-title">
      <div className="history-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="history-panel">
        <div className="history-header">
          <h2 id="history-title">Saved analyses</h2>
          <button type="button" className="icon-close" onClick={onClose} aria-label="Close history">
            ×
          </button>
        </div>
        <p className="history-sub">
          Stored in this browser only ({list.length} / 20).
        </p>
        {list.length === 0 ? (
          <p className="history-empty">No saved runs yet. Run an analysis to populate history.</p>
        ) : (
          <ul className="history-list">
            {list.map((entry) => (
              <li key={entry.id} className="history-item">
                <button
                  type="button"
                  className="history-item-main"
                  onClick={() => {
                    onLoadEntry(entry);
                    onClose();
                  }}
                >
                  <span className="history-date">
                    {new Date(entry.savedAt).toLocaleString()}
                  </span>
                  <span className="history-preview">{entry.preview}</span>
                  {entry.scores && (
                    <span className="history-scores">
                      Score {entry.scores.score ?? "—"}
                      {entry.scores.ats != null && ` · ATS ${entry.scores.ats}`}
                      {entry.scores.match != null && ` · Match ${entry.scores.match}`}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  className="history-delete"
                  aria-label="Delete entry"
                  onClick={() => {
                    deleteHistoryEntry(entry.id);
                    refresh();
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
        {list.length > 0 && (
          <button
            type="button"
            className="btn-secondary history-clear"
            onClick={() => {
              clearHistory();
              refresh();
            }}
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
