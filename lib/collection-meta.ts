export interface CollectionMeta {
  title: string;
  cefrLevel: string;
  category?: string;
}

export const COLLECTION_META_MAP: Record<string, CollectionMeta> = {
  "tgat1-68": { title: "TGAT 1 ปี 2568", cefrLevel: "B2", category: "TGAT1" },
  "tgat1-67": { title: "TGAT 1 ปี 2567", cefrLevel: "B1-B2", category: "TGAT1" },
  "tgat1-66": { title: "TGAT 1 ปี 2566", cefrLevel: "B1-B2", category: "TGAT1" },
  "alevel-68": { title: "A-Level ปี 2568", cefrLevel: "C1", category: "A-Level" },
  "alevel-67": { title: "A-Level ปี 2567", cefrLevel: "C1", category: "A-Level" },
  "alevel-66": { title: "A-Level ปี 2566", cefrLevel: "C1-C2", category: "A-Level" },
};

export function getCollectionMeta(idOrCategory?: string | null): CollectionMeta | null {
  if (!idOrCategory) return null;
  const cleanId = idOrCategory.trim().toLowerCase();
  if (COLLECTION_META_MAP[cleanId]) {
    return COLLECTION_META_MAP[cleanId];
  }
  // Try finding case insensitive match
  const matchKey = Object.keys(COLLECTION_META_MAP).find(
    (k) => k.toLowerCase() === cleanId
  );
  if (matchKey) {
    return COLLECTION_META_MAP[matchKey];
  }
  return null;
}
