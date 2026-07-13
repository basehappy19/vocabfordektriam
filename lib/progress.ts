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
  return map[key]?.completedWordIds || [];
}
