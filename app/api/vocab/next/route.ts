import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateExampleForVocab } from "@/lib/ai";
import { getCefrFromNumber } from "@/lib/cefr";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const isGuest = !userId;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const collectionId = searchParams.get("collectionId");

    const whereFilter: any = collectionId
      ? { collections: { some: { id: collectionId } } }
      : category && category !== "all"
      ? { category }
      : {};

    let selectedVocab: any = null;
    let userProgressData: any = null;

    if (!isGuest && userId) {
      // 1. LOGGED-IN USER LOGIC (Spaced Repetition System - Leitner Box Level 1-5)
      const now = new Date();

      const dueProgress = await prisma.userProgress.findFirst({
        where: {
          userId,
          nextReview: { lte: now },
          ...(Object.keys(whereFilter).length > 0 ? { vocabulary: whereFilter } : {}),
        },
        orderBy: { nextReview: "asc" },
        include: { vocabulary: true },
      });

      if (dueProgress && dueProgress.vocabulary) {
        selectedVocab = dueProgress.vocabulary;
        userProgressData = {
          boxLevel: dueProgress.boxLevel,
          nextReview: dueProgress.nextReview,
          reviewCount: dueProgress.reviewCount,
          streak: dueProgress.streak,
          isDueReview: true,
        };
      } else {
        const existingProgressIds = await prisma.userProgress.findMany({
          where: { userId },
          select: { vocabId: true },
        });

        const excludedIds = existingProgressIds.map((p) => p.vocabId);

        selectedVocab = await prisma.vocabulary.findFirst({
          where: {
            id: { notIn: excludedIds },
            ...whereFilter,
          },
          orderBy: { id: "asc" },
        });

        if (selectedVocab) {
          userProgressData = {
            boxLevel: 1,
            nextReview: now,
            reviewCount: 0,
            streak: 0,
            isNewWord: true,
          };
        } else {
          const earliestReview = await prisma.userProgress.findFirst({
            where: {
              userId,
              ...(Object.keys(whereFilter).length > 0 ? { vocabulary: whereFilter } : {}),
            },
            orderBy: { nextReview: "asc" },
            include: { vocabulary: true },
          });

          if (earliestReview && earliestReview.vocabulary) {
            selectedVocab = earliestReview.vocabulary;
            userProgressData = {
              boxLevel: earliestReview.boxLevel,
              nextReview: earliestReview.nextReview,
              reviewCount: earliestReview.reviewCount,
              streak: earliestReview.streak,
              isEarlyPractice: true,
            };
          }
        }
      }
    } else {
      // 2. GUEST USER LOGIC (Random Vocabulary Practice - Fast response)
      const totalCount = await prisma.vocabulary.count({
        where: whereFilter,
      });

      if (totalCount > 0) {
        const skip = Math.floor(Math.random() * totalCount);
        selectedVocab = await prisma.vocabulary.findFirst({
          where: whereFilter,
          skip,
        });
      }
    }

    if (!selectedVocab) {
      return NextResponse.json(
        { error: "No vocabulary items found in the database for the selected criteria." },
        { status: 404 }
      );
    }

    // Calculate Total Count & Completed Count for Progress Bar
    const totalCount = await prisma.vocabulary.count({
      where: whereFilter,
    });

    let completedCount = 0;
    if (!isGuest && userId) {
      completedCount = await prisma.userProgress.count({
        where: {
          userId,
          ...(Object.keys(whereFilter).length > 0 ? { vocabulary: whereFilter } : {}),
        },
      });
    }

    // 3. FAST AI / FALLBACK FOR EXAMPLE SENTENCES (Max 1.2s timeout to prevent iPad LAN connection lag)
    let exampleSentence = selectedVocab.exampleSentence;
    let exampleTarget = selectedVocab.exampleTarget;
    let wasAiGenerated = false;

    if (!exampleSentence || !exampleTarget) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("AI generation timeout after 1200ms")), 1200)
        );

        const generated: any = await Promise.race([
          generateExampleForVocab(
            selectedVocab.word,
            selectedVocab.meaning,
            selectedVocab.partOfSpeech,
            selectedVocab.category
          ),
          timeoutPromise,
        ]);

        exampleSentence = generated.exampleSentence;
        exampleTarget = generated.exampleTarget;
        wasAiGenerated = true;

        // Save asynchronously in background without delaying response
        prisma.vocabulary
          .update({
            where: { id: selectedVocab.id },
            data: { exampleSentence, exampleTarget },
          })
          .catch((e) => console.error("Background AI save error:", e));
      } catch (aiErr) {
        // Fast instant fallback so iPad LAN connection never hangs
        exampleSentence = `An example of using "${selectedVocab.word}" in academic context.`;
        exampleTarget = `ตัวอย่างการใช้คำว่า ${selectedVocab.meaning}`;
      }
    }

    return NextResponse.json(
      {
        status: "success",
        mode: isGuest ? "GUEST" : "AUTHENTICATED",
        data: {
          id: selectedVocab.id,
          word: selectedVocab.word,
          meaning: selectedVocab.meaning,
          synonyms: selectedVocab.synonyms || [],
          partOfSpeech: selectedVocab.partOfSpeech,
          category: selectedVocab.category,
          collectionId: collectionId || null,
          difficultyLevel: selectedVocab.difficultyLevel,
          cefrLevel: selectedVocab.cefrLevel || getCefrFromNumber(selectedVocab.difficultyLevel),
          phonetic: selectedVocab.phonetic,
          exampleSentence,
          exampleTarget,
          meta: {
            wasAiGenerated,
            servedFromDbDirectly: !wasAiGenerated,
            userProgress: userProgressData,
            progress: {
              totalWords: totalCount || 1,
              completedWords: completedCount || 0,
            },
          },
        },
      },
      {
        headers: {
          "Cache-Control": isGuest
            ? "no-store, max-age=0"
            : "private, no-cache, no-store, max-age=0, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("[API Error /api/vocab/next]:", error);
    return NextResponse.json(
      { error: "Failed to fetch next vocabulary item", details: error.message },
      { status: 500 }
    );
  }
}
