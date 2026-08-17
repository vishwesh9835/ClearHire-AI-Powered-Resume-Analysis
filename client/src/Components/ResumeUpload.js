import React, { useState, useRef, useCallback, useEffect } from "react";
import { extractTextFromFile } from "../utils/PdfParser";
import { analyzeResume, getApiErrorMessage } from "../services/api";
import { saveHistoryEntry } from "../utils/historyStorage";
import { SAMPLE_RESUME, SAMPLE_JOB_DESCRIPTION } from "../utils/sampleResume";
import AnalysisResult from "./results/AnalysisResult";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MIN_TEXT_CHARS = 50;
const MAX_PASTE_CHARS = 12000;

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/* ── SVG Icons ── */
const IconUpload = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IconFile = ({ isPdf }) => isPdf ? (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="15" y2="17" />
    <line x1="9" y1="9" x2="11" y2="9" />
  </svg>
) : (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M16 13H8M16 17H8M10 9H8" />
  </svg>
);

const IconSample = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
  </svg>
);

const IconStar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const LOADING_MESSAGES = [
  "Extracting resume content…",
  "Reading sections and skills…",
  "Running AI review…",
  "Scoring ATS and match…",
  "Almost done…",
];

const ResumeUpload = ({ bootstrap }) => {
  const [inputMode, setInputMode] = useState("file");
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tailorMode, setTailorMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");

  const fileInputRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    if (!bootstrap?.analysis) return;
    setResult(bootstrap.analysis);
    setJobDescription(bootstrap.jobDescription || "");
    setTailorMode(Boolean(bootstrap.tailorMode));
    setError(null);
    setFile(null);
    setPastedText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrap?.id]);

  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      resultsRef.current.focus({ preventScroll: true });
    }
  }, [result]);

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) {
      setError("File must be under 5 MB.");
      return;
    }
    const isDocx = f.name.toLowerCase().endsWith(".docx");
    // Extension check covers DOCX uploads where the OS/browser doesn't
    // report the expected MIME type; ACCEPTED_TYPES is the source of truth
    // for what the type-based check accepts.
    if (!ACCEPTED_TYPES.includes(f.type) && !isDocx) {
      setError("Only PDF and DOCX (Word) files are supported.");
      return;
    }
    setFile(f);
    setResult(null);
    setResumeText("");
    setError(null);
  }, []);

  const handleFileChange = (e) => handleFile(e.target.files?.[0]);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      handleFile(e.dataTransfer.files?.[0]);
    },
    [handleFile]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);

  const getResumeText = async () => {
    if (inputMode === "paste") {
      const t = pastedText.trim();
      if (t.length < MIN_TEXT_CHARS) {
        throw new Error(`Paste at least ${MIN_TEXT_CHARS} characters of resume text.`);
      }
      return t.slice(0, MAX_PASTE_CHARS);
    }
    if (!file) throw new Error("Choose a PDF or DOCX file, or switch to paste text.");
    const text = await extractTextFromFile(file);
    if (!text || text.trim().length < MIN_TEXT_CHARS) {
      throw new Error(
        "Could not extract enough text from this file. Use a text-based PDF/DOCX or paste your resume."
      );
    }
    return text.slice(0, MAX_PASTE_CHARS);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    let idx = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[idx]);
    }, 2200);

    try {
      const text = await getResumeText();
      setResumeText(text);
      const analysis = await analyzeResume(text, { jobDescription, tailorMode });
      setResult(analysis);
      saveHistoryEntry({
        id: `run-${Date.now()}`,
        savedAt: new Date().toISOString(),
        preview: text.slice(0, 120),
        scores: { score: analysis.score, ats: analysis.atsScore, match: analysis.matchScore },
        payload: { analysis, jobDescription, tailorMode },
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPastedText("");
    setResult(null);
    setResumeText("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Fills in a fictional sample resume + matching job description so anyone
  // trying the app (e.g. a recruiter opening a live demo link) can see a
  // full analysis in one click, without needing their own resume on hand.
  const handleUseSample = useCallback(() => {
    setInputMode("paste");
    setPastedText(SAMPLE_RESUME);
    setJobDescription(SAMPLE_JOB_DESCRIPTION);
    setTailorMode(false);
    setFile(null);
    setResult(null);
    setResumeText("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleShortcutKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canAnalyze) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const canAnalyze =
    !loading &&
    (inputMode === "paste"
      ? pastedText.trim().length >= MIN_TEXT_CHARS
      : Boolean(file));

  const isPdf = file?.type === "application/pdf";

  return (
    <div className="resume-upload-root">
      <div className="upload-card">
        <section className="input-panel" aria-labelledby="inputs-heading">
          <div className="input-panel-header">
            <h2 id="inputs-heading" className="input-panel-title">
              Resume &amp; job context
            </h2>
            <button
              type="button"
              className="sample-trigger-btn"
              onClick={handleUseSample}
              title="Fill in a fictional sample resume and job description"
            >
              <IconSample /> Try a sample resume
            </button>
          </div>

          <div className="input-mode-toggle" role="group" aria-label="Resume input mode">
            <button
              type="button"
              className={`mode-btn ${inputMode === "file" ? "active" : ""}`}
              onClick={() => { setInputMode("file"); setError(null); }}
            >
              📎 Upload PDF / DOCX
            </button>
            <button
              type="button"
              className={`mode-btn ${inputMode === "paste" ? "active" : ""}`}
              onClick={() => { setInputMode("paste"); setError(null); }}
            >
              📋 Paste text
            </button>
          </div>

          {inputMode === "file" ? (
            <div
              className={`upload-zone ${dragOver ? "drag-over" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !file && fileInputRef.current?.click()}
              style={{ cursor: file ? "default" : "pointer" }}
              role="button"
              tabIndex={file ? -1 : 0}
              aria-label="Drop zone for resume file"
              onKeyDown={(e) => e.key === "Enter" && !file && fileInputRef.current?.click()}
            >
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                ref={fileInputRef}
                className="sr-only"
                onChange={handleFileChange}
              />
              <div className="upload-zone-icon" aria-hidden="true">
                <IconUpload />
              </div>
              <div className="upload-zone-title">
                {dragOver ? "Release to upload" : "Drop your resume here"}
              </div>
              <div className="upload-zone-subtitle">
                PDF or DOCX · max 5 MB
              </div>
              {!file && (
                <button
                  type="button"
                  className="upload-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <IconUpload /> Choose file
                </button>
              )}
            </div>
          ) : (
            <div className="paste-panel">
              <label className="field-label" htmlFor="resume-paste">
                Resume text
              </label>
              <textarea
                id="resume-paste"
                className="paste-textarea"
                rows={10}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                onKeyDown={handleShortcutKeyDown}
                placeholder="Paste your full resume text here…"
                maxLength={MAX_PASTE_CHARS}
              />
              <p className="field-hint">
                {pastedText.length.toLocaleString()} / {MAX_PASTE_CHARS.toLocaleString()} characters
                {pastedText.length < MIN_TEXT_CHARS && pastedText.length > 0 && (
                  <span style={{ color: "var(--accent-orange)", marginLeft: 6 }}>
                    (need {MIN_TEXT_CHARS - pastedText.length} more)
                  </span>
                )}
                <span className="shortcut-hint"> · Ctrl/Cmd+Enter to run</span>
              </p>
            </div>
          )}

          {file && inputMode === "file" && (
            <div className="file-selected-banner">
              <div className="file-icon-box" aria-hidden="true">
                <IconFile isPdf={isPdf} />
              </div>
              <div className="file-details">
                <div className="file-name">{file.name}</div>
                <div className="file-size">
                  {formatBytes(file.size)} · {isPdf ? "PDF" : "DOCX"}
                </div>
              </div>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Remove
              </button>
            </div>
          )}

          <div className="job-field">
            <label className="field-label" htmlFor="job-description">
              Job description{" "}
              <span className="optional">(optional — unlocks match score &amp; keyword gaps)</span>
            </label>
            <textarea
              id="job-description"
              className="paste-textarea job-textarea"
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              onKeyDown={handleShortcutKeyDown}
              placeholder="Paste the job posting to unlock match score and tailored gaps…"
            />
          </div>

          <label className="tailor-row">
            <input
              type="checkbox"
              checked={tailorMode}
              onChange={(e) => setTailorMode(e.target.checked)}
              disabled={!jobDescription.trim()}
            />
            <span>Tailor analysis for this specific job</span>
          </label>
          {!jobDescription.trim() && (
            <p className="field-hint">Add a job description above to enable tailoring.</p>
          )}
        </section>
      </div>

      {error && (
        <div className="error-card" role="alert">
          <div className="error-icon" aria-hidden="true">⚠</div>
          <div>
            <div className="error-title">Something went wrong</div>
            <div className="error-msg">
              {typeof error === "string" ? error : (error?.message || JSON.stringify(error))}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="loader-overlay" role="status" aria-live="polite" aria-busy="true">
          <div className="loader-ring" aria-hidden="true" />
          <div className="loader-dots" aria-hidden="true">
            <span className="loader-dot" />
            <span className="loader-dot" />
            <span className="loader-dot" />
          </div>
          <div className="loader-text">{loadingMsg}</div>
          <div className="loader-subtext">This may take up to a minute — Llama is thinking.</div>
        </div>
      )}

      {result && (
        <div ref={resultsRef} tabIndex={-1} className="results-scroll-anchor">
          <AnalysisResult
            result={result}
            onReset={handleReset}
            jobDescription={jobDescription}
            resumeText={resumeText || pastedText}
            meta={{ tailorMode, hasJobDescription: Boolean(jobDescription.trim()) }}
          />
        </div>
      )}

      {!result && (
        <div className="sticky-analyze-bar no-print">
          <button
            type="button"
            className="analyze-btn analyze-btn-sticky"
            onClick={handleAnalyze}
            disabled={!canAnalyze || loading}
            id="analyze-resume-btn"
            title={!canAnalyze ? (inputMode === "file" ? "Upload a file first" : `Paste at least ${MIN_TEXT_CHARS} characters`) : ""}
          >
            <IconStar /> Run analysis
          </button>
        </div>
      )}

      <p className="privacy-note">
        Analysis runs via our API; optional history is stored only in this browser.
      </p>
    </div>
  );
};

export default ResumeUpload;
