import React, { useState } from "react";
import { exportReportAsPdf } from "../../utils/buildPdfReport";

const StickyReportActions = ({ result, meta }) => {
  const [exporting, setExporting] = useState(false);

  const handleExportPdf = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportReportAsPdf(result, {
        ...meta,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="sticky-report-actions no-print" role="toolbar" aria-label="Report actions">
      <button
        type="button"
        className="sticky-btn sticky-btn-pdf"
        onClick={handleExportPdf}
        disabled={exporting}
        aria-label="Export analysis report as PDF"
        id="export-pdf-btn"
      >
        {exporting ? (
          <>
            <span className="sticky-btn-spinner" aria-hidden="true" />
            Generating…
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export PDF
          </>
        )}
      </button>
    </div>
  );
};

export default StickyReportActions;
