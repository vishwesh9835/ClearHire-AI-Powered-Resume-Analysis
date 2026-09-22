import { groupTextItemsIntoLines } from "./pdfTextExtraction";

/**
 * Builds a pdf.js-shaped TextItem.
 *
 * transform is the 6-element text matrix [a, b, c, d, e, f] where e = x and
 * f = y, and d carries the vertical scale (font size).
 */
function item(str, { x = 0, y = 0, fontSize = 10, width } = {}) {
  return {
    str,
    width: width === undefined ? str.length * fontSize * 0.5 : width,
    height: fontSize,
    transform: [fontSize, 0, 0, fontSize, x, y],
  };
}

test("returns an empty string for missing or non-array input", () => {
  expect(groupTextItemsIntoLines(undefined)).toBe("");
  expect(groupTextItemsIntoLines(null)).toBe("");
  expect(groupTextItemsIntoLines("nonsense")).toBe("");
  expect(groupTextItemsIntoLines([])).toBe("");
});

test("separates runs that are visually apart with a space", () => {
  const text = groupTextItemsIntoLines([
    item("Hello", { x: 0, y: 100, width: 30 }),
    item("world", { x: 40, y: 100, width: 30 }),
  ]);
  expect(text).toBe("Hello world");
});

// The core regression this module exists for: pdf.js splits some single words
// into multiple runs (font changes, kerning, justified text). Blindly joining
// with a space produced corrupted tokens in the text sent to the model.
test("does not insert a space between runs that are contiguous", () => {
  const text = groupTextItemsIntoLines([
    item("Man", { x: 0, y: 100, width: 30 }),
    item("agement", { x: 30, y: 100, width: 70 }),
  ]);
  expect(text).toBe("Management");
});

test("falls back to inserting a space when a run reports no width", () => {
  const text = groupTextItemsIntoLines([
    item("Hello", { x: 0, y: 100, width: 0 }),
    item("world", { x: 0, y: 100, width: 0 }),
  ]);
  expect(text).toBe("Hello world");
});

test("preserves line breaks instead of collapsing the page into one line", () => {
  const text = groupTextItemsIntoLines([
    item("Jane Doe", { x: 0, y: 200, width: 40 }),
    item("Experience", { x: 0, y: 180, width: 40 }),
    item("Education", { x: 0, y: 160, width: 40 }),
  ]);
  expect(text).toBe("Jane Doe\nExperience\nEducation");
});

test("orders runs left-to-right regardless of the order pdf.js reports them", () => {
  const text = groupTextItemsIntoLines([
    item("world", { x: 40, y: 100, width: 30 }),
    item("Hello", { x: 0, y: 100, width: 30 }),
  ]);
  expect(text).toBe("Hello world");
});

test("orders lines top-to-bottom regardless of the order pdf.js reports them", () => {
  const text = groupTextItemsIntoLines([
    item("Bottom", { x: 0, y: 80, width: 40 }),
    item("Top", { x: 0, y: 100, width: 40 }),
  ]);
  expect(text).toBe("Top\nBottom");
});

test("keeps runs on the same visual line together despite sub-pixel Y drift", () => {
  const text = groupTextItemsIntoLines([
    item("Staff", { x: 0, y: 100.0, width: 25 }),
    item("Engineer", { x: 30, y: 99.7, width: 40 }),
  ]);
  expect(text).toBe("Staff Engineer");
});

test("ignores entries that are not positioned text runs", () => {
  const text = groupTextItemsIntoLines([
    null,
    "junk",
    { str: "No transform" },
    { str: "", transform: [10, 0, 0, 10, 0, 100] },
    { str: "Malformed", transform: [10, 0] },
    item("Real text", { x: 0, y: 100, width: 45 }),
  ]);
  expect(text).toBe("Real text");
});

test("collapses redundant whitespace within and around runs", () => {
  const text = groupTextItemsIntoLines([
    item("  Hello  ", { x: 0, y: 100, width: 40 }),
    item("   world  ", { x: 50, y: 100, width: 40 }),
  ]);
  expect(text).toBe("Hello world");
});
