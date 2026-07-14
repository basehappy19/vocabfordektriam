/**
 * LocalStorage & Client progress helper for VocabForDekTriam.
 * Manages guest progress (`completedWordIds`) per Collection and per Category.
 */

export interface GuestProgressMap {
  [key: string]: {
    completedWordIds: string[];
    lastUpdated: string;
  };
}

const STORAGE_KEY = "vocab_progress_guest";

export function getGuestProgressMap(): GuestProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function clearAllGuestAndLocalData() {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("vocab_") ||
          key.includes("progress") ||
          key.includes("session") ||
          key.includes("history") ||
          key.includes("practice") ||
          key.includes("guest"))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Explicitly remove primary keys just in case
    localStorage.removeItem("vocab_progress_guest");
    localStorage.removeItem("vocab_sessions_history_guest");
    localStorage.removeItem("vocab_play_counts_guest");
  } catch (e) {
    console.error("Failed to clear guest and local data from localStorage:", e);
  }
}

export function recordGuestWordCompletion(wordId: string, collectionId?: string | null, category?: string | null) {
  if (typeof window === "undefined" || !wordId) return;
  try {
    const map = getGuestProgressMap();
    const now = new Date().toISOString();

    if (collectionId) {
      if (!map[collectionId]) {
        map[collectionId] = { completedWordIds: [], lastUpdated: now };
      }
      if (!map[collectionId].completedWordIds.includes(wordId)) {
        map[collectionId].completedWordIds.push(wordId);
        map[collectionId].lastUpdated = now;
      }
    }

    if (category) {
      if (!map[category]) {
        map[category] = { completedWordIds: [], lastUpdated: now };
      }
      if (!map[category].completedWordIds.includes(wordId)) {
        map[category].completedWordIds.push(wordId);
        map[category].lastUpdated = now;
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error("Failed to save guest progress to localStorage:", e);
  }
}

export function getCompletedWordIds(key: string): string[] {
  const map = getGuestProgressMap();
  const ids = map[key]?.completedWordIds || [];
  return Array.from(new Set(ids));
}

export interface GuestSessionHistoryItem {
  id: string;
  collectionId: string | null;
  category: string | null;
  totalWords: number;
  correctCount: number;
  wrongCount: number;
  durationSeconds: number;
  createdAt: string;
  answers: {
    vocabId?: string | null;
    word: string;
    meaning: string;
    userTypedInput: string;
    correctAnswerText: string;
    isCorrect: boolean;
  }[];
}

const HISTORY_STORAGE_KEY = "vocab_sessions_history_guest";
const PLAY_COUNT_STORAGE_KEY = "vocab_play_counts_guest";

export function getGuestSessionHistory(collectionId?: string): GuestSessionHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    const list: GuestSessionHistoryItem[] = raw ? JSON.parse(raw) : [];
    if (collectionId) {
      return list.filter((item) => item.collectionId === collectionId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    return [];
  }
}

export function getCollectionPlayCount(collectionId: string): number {
  if (typeof window === "undefined" || !collectionId) return 0;
  try {
    const raw = localStorage.getItem(PLAY_COUNT_STORAGE_KEY);
    const counts: { [key: string]: number } = raw ? JSON.parse(raw) : {};
    return counts[collectionId] || 0;
  } catch (e) {
    return 0;
  }
}

export function recordCollectionPlaySession(collectionId: string | null, session: GuestSessionHistoryItem) {
  if (typeof window === "undefined") return;
  try {
    // 1. Save Session History
    const historyList = getGuestSessionHistory();
    historyList.unshift(session);
    // Keep last 100 sessions to avoid storage overflow
    const trimmedList = historyList.slice(0, 100);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmedList));

    // 2. Increment Play Count
    if (collectionId) {
      const rawCount = localStorage.getItem(PLAY_COUNT_STORAGE_KEY);
      const counts: { [key: string]: number } = rawCount ? JSON.parse(rawCount) : {};
      counts[collectionId] = (counts[collectionId] || 0) + 1;
      localStorage.setItem(PLAY_COUNT_STORAGE_KEY, JSON.stringify(counts));
    }

    // 3. Mark all practiced words in this round as completed inside vocab_progress_guest
    const map = getGuestProgressMap();
    const now = new Date().toISOString();
    const targetKey = collectionId || session.category || "GENERAL";
    if (!map[targetKey]) {
      map[targetKey] = { completedWordIds: [], lastUpdated: now };
    }
    session.answers.forEach((ans) => {
      if (ans.vocabId && !map[targetKey].completedWordIds.includes(ans.vocabId)) {
        map[targetKey].completedWordIds.push(ans.vocabId);
      }
    });
    map[targetKey].lastUpdated = now;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error("Failed to save session history and play count to localStorage:", e);
  }
}
