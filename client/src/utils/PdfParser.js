import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { groupTextItemsIntoLines } from "./pdfTextExtraction";

/**
 * The pdf.js worker is vendored into `public/` at build time by
 * `scripts/copy-pdf-worker.js` (wired to the prestart/prebuild hooks).
 *
 * It must be SAME-ORIGIN. pdf.js checks the worker URL against the page origin
 * and, for a cross-origin URL, rewrites it to a `blob:` URL that `import`s the
 * remote script — both of which the backend's Content-Security-Policy
 * (`default-src 'self'`, with no `worker-src`/`script-src` exceptions) blocks,
 * breaking every PDF upload in production while working fine on the dev server.
 *
 * PUBLIC_URL is "" for a root-hosted build and "/subpath" when hosted under a
 * path prefix, so this resolves correctly in both cases.
 */
pdfjsLib.GlobalWorkerOptions.workerSrc = `${
  process.env.PUBLIC_URL || ""
}/pdf.worker.min.mjs`;

const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Identifies a file by MIME type, falling back to its extension.
 *
 * Browsers frequently report an empty or generic type for PDFs depending on
 * the OS file association, so the extension is the more reliable signal and
 * both are checked. Exported so the upload UI validates files the same way the
 * parser does, instead of duplicating the rules.
 *
 * @returns {"pdf" | "docx" | "unsupported-doc" | null}
 */
export function detectFileKind(file) {
  if (!file) return null;
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();

  if (type === PDF_MIME || name.endsWith(".pdf")) return "pdf";
  if (type === DOCX_MIME || name.endsWith(".docx")) return "docx";
  // Legacy Word format: a distinct message is far more helpful than "unsupported".
  if (name.endsWith(".doc")) return "unsupported-doc";
  return null;
}

function describePdfError(err) {
  if (err?.name === "PasswordException") {
    return new Error(
      "This PDF is password-protected. Remove the password, or switch to paste text."
    );
  }
  if (err?.name === "InvalidPDFException") {
    return new Error(
      "That file could not be read as a PDF — it may be corrupt. Try re-exporting it, or switch to paste text."
    );
  }
  return err;
}

/** Extracts per-page text, preserving line breaks. */
export const extractTextFromPDF = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  let pdf;
  try {
    pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  } catch (err) {
    throw describePdfError(err);
  }

  const pages = [];
  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = groupTextItemsIntoLines(content.items);
      if (pageText) pages.push(pageText);
      // Release the page's canvas/operator lists — a 10-page resume otherwise
      // holds every page in memory until the document is torn down.
      page.cleanup();
    }
  } finally {
    pdf.destroy();
  }

  return pages.join("\n");
};

export const extractTextFromDOCX = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch {
    throw new Error(
      "That file could not be read as a Word document — it may be corrupt. Try re-saving it as .docx, or switch to paste text."
    );
  }
};

export const extractTextFromFile = async (file) => {
  const kind = detectFileKind(file);

  if (kind === "pdf") return extractTextFromPDF(file);
  if (kind === "docx") return extractTextFromDOCX(file);
  if (kind === "unsupported-doc") {
    throw new Error(
      "Legacy .doc files aren't supported. Save it as .docx or PDF, or switch to paste text."
    );
  }
  throw new Error("Unsupported file type. Please upload a PDF or DOCX file.");
};
