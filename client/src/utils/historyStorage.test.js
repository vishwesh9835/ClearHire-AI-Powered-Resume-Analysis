import {
  loadHistory,
  saveHistoryEntry,
  deleteHistoryEntry,
  clearHistory,
} from "./historyStorage";

beforeEach(() => {
  window.localStorage.clear();
});

test("loadHistory returns an empty array when nothing has been saved", () => {
  expect(loadHistory()).toEqual([]);
});

test("saveHistoryEntry makes the entry retrievable via loadHistory", () => {
  saveHistoryEntry({ id: "a1", preview: "Software Engineer resume", scores: { overall: 82 } });
  const history = loadHistory();
  expect(history).toHaveLength(1);
  expect(history[0].id).toBe("a1");
  expect(history[0].preview).toBe("Software Engineer resume");
  expect(history[0].scores).toEqual({ overall: 82 });
});

test("newest entry is placed first", () => {
  saveHistoryEntry({ id: "first", preview: "First" });
  saveHistoryEntry({ id: "second", preview: "Second" });
  const history = loadHistory();
  expect(history.map((h) => h.id)).toEqual(["second", "first"]);
});

test("saving an entry with an existing id replaces it instead of duplicating it", () => {
  saveHistoryEntry({ id: "dup", preview: "Original" });
  saveHistoryEntry({ id: "dup", preview: "Updated" });
  const history = loadHistory();
  expect(history).toHaveLength(1);
  expect(history[0].preview).toBe("Updated");
});

test("preview text longer than 120 characters is truncated", () => {
  const longPreview = "x".repeat(200);
  saveHistoryEntry({ id: "long", preview: longPreview });
  expect(loadHistory()[0].preview).toHaveLength(120);
});

test("history is capped at 20 entries, dropping the oldest", () => {
  for (let i = 0; i < 25; i++) {
    saveHistoryEntry({ id: `entry-${i}`, preview: `Entry ${i}` });
  }
  const history = loadHistory();
  expect(history).toHaveLength(20);
  // Most recent (entry-24) should be present, oldest (entry-0..4) should be dropped
  expect(history[0].id).toBe("entry-24");
  expect(history.find((h) => h.id === "entry-0")).toBeUndefined();
});

test("deleteHistoryEntry removes only the matching entry", () => {
  saveHistoryEntry({ id: "keep", preview: "Keep me" });
  saveHistoryEntry({ id: "remove", preview: "Remove me" });
  deleteHistoryEntry("remove");
  const history = loadHistory();
  expect(history).toHaveLength(1);
  expect(history[0].id).toBe("keep");
});

test("clearHistory empties the stored history", () => {
  saveHistoryEntry({ id: "a", preview: "A" });
  saveHistoryEntry({ id: "b", preview: "B" });
  clearHistory();
  expect(loadHistory()).toEqual([]);
});

test("loadHistory recovers gracefully from corrupted JSON in storage", () => {
  window.localStorage.setItem("resumeai-history-v1", "{not valid json");
  expect(loadHistory()).toEqual([]);
});

test("loadHistory recovers gracefully when stored data isn't an array", () => {
  window.localStorage.setItem("resumeai-history-v1", JSON.stringify({ not: "an array" }));
  expect(loadHistory()).toEqual([]);
});
