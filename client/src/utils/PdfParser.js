import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// CRA uses Webpack, which does not support import.meta.url for dynamic module
// resolution. Point workerSrc to the CDN build that exactly matches the
// installed pdfjs-dist version so the worker loads correctly in both dev and
// production builds without ejecting or custom Webpack config.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const extractTextFromPDF = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    text += pageText + "\n";
  }
  return text;
};

export const extractTextFromDOCX = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

export const extractTextFromFile = async (file) => {
  if (file.type === "application/pdf") {
    return extractTextFromPDF(file);
  }
  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")
  ) {
    return extractTextFromDOCX(file);
  }
  throw new Error("Unsupported file type. Please upload a PDF or DOCX file.");
};