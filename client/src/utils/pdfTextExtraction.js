/**
 * Rebuilds readable text from pdf.js TextItems.
 *
 * Why this exists as its own module:
 *   `getTextContent()` returns a PDF page as a FLAT array of positioned text
 *   runs — it has no concept of lines. A naive `.map(i => i.str).join(" ")`
 *   therefore (a) loses every line break, collapsing the resume into one wall
 *   of text, and (b) inserts a space between runs that are actually two halves
 *   of the same word, producing corrupted tokens like "Man agement" or
 *   "Java Script" in the text we hand to the model.
 *
 *   Both problems degrade the analysis, so runs are regrouped into lines using
 *   the Y position and joined using the measured horizontal gap.
 */

/** Runs closer than this fraction of the font size are the same line. */
const LINE_Y_TOLERANCE_RATIO = 0.6;

/** A horizontal gap above this fraction of the font size means a new word. */
const WORD_GAP_RATIO = 0.25;

/**
 * Drops anything that is not a positioned text run with content.
 * pdf.js emits non-text markers too, and mixing them in corrupts the geometry.
 */
function normalizeRuns(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter(
      (item) =>
        item &&
        typeof item.str === "string" &&
        item.str.length > 0 &&
        Array.isArray(item.transform) &&
        item.transform.length >= 6
    )
    .map((item) => {
      const fontSize =
        Math.abs(Number(item.transform[3])) || Number(item.height) || 10;
      const width = Number(item.width);
      return {
        text: item.str,
        x: Number(item.transform[4]) || 0,
        y: Number(item.transform[5]) || 0,
        fontSize,
        width: Number.isFinite(width) && width > 0 ? width : 0,
      };
    });
}

/** Groups runs that share a baseline into lines. */
function groupIntoLines(runs) {
  // Top-to-bottom. Runs sharing a line end up adjacent, and their exact
  // left-to-right order is restored per line below, so a tiny Y difference
  // between runs on the same visual line cannot scramble the word order.
  const sorted = [...runs].sort((a, b) => b.y - a.y);

  const lines = [];
  let current = null;

  for (const run of sorted) {
    if (!current) {
      current = { y: run.y, fontSize: run.fontSize, runs: [run] };
      lines.push(current);
      continue;
    }
    const tolerance =
      Math.max(run.fontSize, current.fontSize) * LINE_Y_TOLERANCE_RATIO;
    if (Math.abs(run.y - current.y) > tolerance) {
      current = { y: run.y, fontSize: run.fontSize, runs: [run] };
      lines.push(current);
      continue;
    }
    current.runs.push(run);
    current.fontSize = Math.max(current.fontSize, run.fontSize);
  }

  return lines;
}

/** Joins one line's runs, inserting a space only where there really is one. */
function joinLineRuns(runs) {
  const ordered = [...runs].sort((a, b) => a.x - b.x);
  let text = "";
  let previous = null;

  for (const run of ordered) {
    if (previous) {
      // Only skip the space when the measured geometry proves the two runs are
      // contiguous. If the width is unknown we cannot prove it, so we fall back
      // to inserting a space rather than risk welding two words together.
      const previousEnd = previous.x + previous.width;
      const gap = run.x - previousEnd;
      const threshold =
        Math.max(run.fontSize, previous.fontSize) * WORD_GAP_RATIO;
      const contiguous = previous.width > 0 && gap <= threshold;
      if (!contiguous && !text.endsWith(" ")) text += " ";
    }
    text += run.text;
    previous = run;
  }

  return text.replace(/\s+/g, " ").trim();
}

/**
 * @param {Array} items - `TextContent.items` from a pdf.js page.
 * @returns {string} Page text with line breaks preserved.
 */
export function groupTextItemsIntoLines(items) {
  const runs = normalizeRuns(items);
  if (runs.length === 0) return "";

  return groupIntoLines(runs)
    .map((line) => joinLineRuns(line.runs))
    .filter((line) => line.length > 0)
    .join("\n");
}
