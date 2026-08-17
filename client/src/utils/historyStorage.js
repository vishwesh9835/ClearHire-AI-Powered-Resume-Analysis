const STORAGE_KEY = "clearhire-history-v1";
const MAX_ENTRIES = 20;

function safeParse(raw) {
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function loadHistory() {
  if (typeof localStorage === "undefined") return [];
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

// Wraps localStorage.setItem so a full quota (common once a few dozen full
// analyses pile up) or a blocked store (private/incognito mode in some
// browsers) degrades gracefully instead of throwing mid-analysis. On quota
// errors we retry once with a smaller slice before giving up silently —
// saving history is a nice-to-have, never worth breaking the main flow over.
function safeSetItem(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
    return true;
  } catch (err) {
    if (list.length > 5) {
      try {
        localStorage.setItem(key, JSON.stringify(list.slice(0, 5)));
        return true;
      } catch {
        /* storage unavailable even for a small payload — give up quietly */
      }
    }
    console.warn("Could not save analysis history (storage full or unavailable).", err);
    return false;
  }
}

export function saveHistoryEntry(entry) {
  if (typeof localStorage === "undefined") return;
  const list = loadHistory();
  const next = [
    {
      id: entry.id || `h-${Date.now()}`,
      savedAt: entry.savedAt || new Date().toISOString(),
      preview: (entry.preview || "").slice(0, 120),
      scores: entry.scores || {},
      payload: entry.payload,
    },
    ...list.filter((x) => x.id !== entry.id),
  ].slice(0, MAX_ENTRIES);
  safeSetItem(STORAGE_KEY, next);
}

export function deleteHistoryEntry(id) {
  if (typeof localStorage === "undefined") return;
  const list = loadHistory().filter((x) => x.id !== id);
  safeSetItem(STORAGE_KEY, list);
}

export function clearHistory() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
