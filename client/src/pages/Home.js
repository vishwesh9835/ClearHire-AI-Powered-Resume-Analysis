import React, { useState, useCallback } from "react";
import ResumeUpload from "../Components/ResumeUpload";
import HistoryPanel from "../Components/HistoryPanel";
import Icon from "../Components/Icon";
import { useTheme } from "../hooks/useTheme";
import { JOB_TEMPLATES } from "../data/jobTemplates";

const FEATURES = [
  { label: "ATS Score", color: "chip-teal" },
  { label: "Job Match %", color: "chip-indigo" },
  { label: "Weak Bullet Rewriter", color: "chip-violet" },
  { label: "Cover Letter AI", color: "chip-emerald" },
  { label: "Interview Questions", color: "chip-amber" },
  { label: "Section Feedback", color: "chip-indigo" },
  { label: "Keyword Gaps", color: "chip-teal" },
];

const PrivacyModal = ({ onClose }) => {
  // Escape closes the dialog, matching the backdrop click.
  React.useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      onClick={onClose}
    >
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title" id="privacy-modal-title">
          <Icon name="lock" size={18} />
          <span>Privacy</span>
        </div>
        <div className="modal-body">
          <p>
            <strong>What we send:</strong> Your resume text and optional job description
            are sent to the Groq API for analysis. No files are stored on our servers.
          </p>
          <p>
            <strong>Local history:</strong> Analysis results can be saved to your browser's
            <code> localStorage</code>. This data stays local to your device.
          </p>
          <p>
            <strong>API keys:</strong> The Groq API key is stored only on the backend server
            and is never exposed to the browser.
          </p>
          <p>
            <strong>No tracking:</strong> We do not use analytics, cookies, or any third-party
            tracking services.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary modal-close"
          onClick={onClose}
          autoFocus
        >
          Got it
        </button>
      </div>
    </div>
  );
};

const Home = () => {
  const { theme, toggle } = useTheme();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [bootstrap, setBootstrap] = useState(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const handleLoadEntry = useCallback((entry) => {
    const p = entry.payload || {};
    if (!p.analysis) return;
    setBootstrap({
      id: entry.id,
      analysis: p.analysis,
      jobDescription: p.jobDescription || "",
      tailorMode: Boolean(p.tailorMode),
      resumeText: p.resumeText || "",
    });
    setHistoryOpen(false);
  }, []);

  return (
    <div className="app-wrapper">
      <nav className="navbar no-print">
        <div className="navbar-brand">
          <div className="navbar-logo-icon" aria-hidden="true">
            <Icon name="check-circle" size={19} strokeWidth={2.4} />
          </div>
          <span className="navbar-brand-text">ClearHire</span>
        </div>
        <div className="navbar-actions">
          <button
            type="button"
            className="nav-text-btn"
            onClick={() => setHistoryOpen(true)}
            aria-label="Open analysis history"
          >
            <Icon name="history" size={15} />
            <span>History</span>
          </button>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggle}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={15} />
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
          <span className="navbar-badge">AI-assisted</span>
        </div>
      </nav>

      <main className="container">
        <section className="hero">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" aria-hidden="true" />
            Resume intelligence
          </div>

          <h1>
            A smarter, clearer resume review —{" "}
            <span className="gradient-text">built for recruiters and ATS</span>
          </h1>

          <p className="hero-subtitle">
            Upload or paste your resume, add a job description for match scoring, and get
            structured feedback: ATS signals, keyword gaps, section notes, and rewrites you control.
          </p>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-number">ATS + Match</span>
              <span className="hero-stat-label">Dual scores</span>
            </div>
            <div className="hero-divider" aria-hidden="true" />
            <div className="hero-stat">
              <span className="hero-stat-number">~30–60s</span>
              <span className="hero-stat-label">Typical run</span>
            </div>
            <div className="hero-divider" aria-hidden="true" />
            <div className="hero-stat">
              <span className="hero-stat-number">Markdown</span>
              <span className="hero-stat-label">Copy report</span>
            </div>
          </div>

          <div className="features-strip" aria-label="Features">
            {FEATURES.map((f) => (
              <span key={f.label} className="feature-chip">
                <span className={`feature-chip-dot ${f.color}`} aria-hidden="true" />
                {f.label}
              </span>
            ))}
          </div>
        </section>

        <ResumeUpload bootstrap={bootstrap} jobTemplates={JOB_TEMPLATES} />
      </main>

      <footer className="footer no-print">
        <p>
          ClearHire — AI-powered resume analysis.{" "}
          <button
            type="button"
            className="footer-link-btn"
            onClick={() => setPrivacyOpen(true)}
          >
            Privacy
          </button>
        </p>
      </footer>

      <HistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onLoadEntry={handleLoadEntry}
      />

      {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
    </div>
  );
};

export default Home;
