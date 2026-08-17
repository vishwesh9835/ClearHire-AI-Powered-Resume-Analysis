import React, { useState } from "react";
import { buildMarkdownReport } from "../../utils/buildMarkdownReport";

const StickyReportActions = ({ result, meta }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const md = buildMarkdownReport(result, meta);
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="sticky-report-actions no-print" role="toolbar" aria-label="Report actions">
      <button type="button" className="sticky-btn" onClick={handleCopy}>
        {copied ? "Copied" : "Copy report"}
      </button>
    </div>
  );
};

export default StickyReportActions;
