import React, { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getCefrFromNumber } from "@/lib/cefr";
import PracticeSessionWrapper from "./practice-wrapper";

export const metadata = {
  title: "โหมดเขียนคัดและท่องจำคำศัพท์ | VocabForDekTriam",
  description: "โหมดฝึกเขียนคำศัพท์ภาษาอังกฤษบน iPad ด้วย Apple Pencil เต็มหน้าจอ 100%",
};

interface PracticePageProps {
  searchParams: Promise<{
    collectionId?: string;
    category?: string;
    reset?: string;
    currentWordId?: string;
  }>;
}

export default async function PracticePage({ searchParams }: PracticePageProps) {
  const params = await searchParams;
  const { collectionId = "", category = "", reset, currentWordId } = params;
  const session = await auth();
  const userId = session?.user?.id;
  const isGuest = !userId;

  // Server-side fetch initial vocabulary data (SSR)
  let whereClause: any = {};
  if (collectionId && collectionId.trim() !== "") {
    whereClause.collections = { some: { id: collectionId } };
  } else if (category && category.trim() !== "") {
    whereClause.category = category;
  }

  const allWords = await prisma.vocabulary.findMany({
    where: whereClause,
    orderBy: { id: "asc" },
    include: {
      collections: { select: { id: true, title: true, cefrLevel: true } },
    },
  });

  let initialVocab: any = null;
  if (allWords.length > 0) {
    let targetIndex = 0;
    if (currentWordId) {
      const idx = allWords.findIndex((w) => w.id === currentWordId);
      if (idx >= 0) targetIndex = idx;
    }
    const selected = allWords[targetIndex];
    let completedWordsCount = 0;
    if (!isGuest && userId) {
      completedWordsCount = await prisma.userProgress.count({
        where: {
          userId,
          vocabId: { in: allWords.map((w) => w.id) },
        },
      });
    }

    initialVocab = {
      id: selected.id,
      word: selected.word,
      meaning: selected.meaning,
      synonyms: selected.synonyms || [],
      partOfSpeech: selected.partOfSpeech,
      category: selected.category,
      difficultyLevel: selected.difficultyLevel,
      collectionId: collectionId || (selected.collections[0]?.id ?? null),
      cefrLevel: selected.cefrLevel || getCefrFromNumber(selected.difficultyLevel),
      phonetic: selected.phonetic || null,
      exampleSentence: selected.exampleSentence || null,
      exampleTarget: selected.exampleTarget || null,
      meta: {
        wasAiGenerated: false,
        servedFromDbDirectly: true,
        progress: {
          completedWords: completedWordsCount,
          totalWords: allWords.length,
          wordIndex: targetIndex + 1,
        },
      },
    };
  }

  return (
    <div className="w-screen h-screen fixed inset-0 overflow-hidden bg-white text-slate-900 font-sans">
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
              <span className="text-sm font-bold text-slate-500">กำลังเปิดกระดานเขียนคำศัพท์เต็มหน้าจอ...</span>
            </div>
          </div>
        }
      >
        <PracticeSessionWrapper
          initialVocab={initialVocab}
          initialCategory={category}
          initialCollectionId={collectionId}
          initialMode={isGuest ? "GUEST" : "AUTHENTICATED"}
        />
      </Suspense>
    </div>
  );
}
