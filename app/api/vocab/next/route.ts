import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateExampleForVocab } from "@/lib/ai";
import { getCefrFromNumber } from "@/lib/cefr";

export async function GET(request: NextRequest) {
  try {
    // 1. Non-blocking fast check for session (< 300ms) to ensure iPad LAN fetch never stalls on auth
    let userId: string | undefined = undefined;
    try {
      const sessionTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 300));
      const session = await Promise.race([auth(), sessionTimeout]);
      userId = session?.user?.id;
    } catch (authErr) {
      console.error("[Fast auth check error]:", authErr);
    }
    const isGuest = !userId;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const collectionId = searchParams.get("collectionId");

    const whereFilter: any = collectionId
      ? { collections: { some: { id: collectionId } } }
      : category && category !== "all"
      ? { category }
      : {};

    // Single fast query for total count
    const totalCount = await prisma.vocabulary.count({
      where: whereFilter,
    });

    if (totalCount === 0) {
      return NextResponse.json(
        { error: "ไม่พบคำศัพท์ในหมวดหมู่หรือ Collection ที่เลือก" },
        { status: 404 }
      );
    }

    let selectedVocab: any = null;
    let userProgressData: any = null;

    if (!isGuest && userId) {
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
    }

    // Fallback to fast random query for Guest or if no specific user selection found
    if (!selectedVocab) {
      const skip = Math.floor(Math.random() * totalCount);
      selectedVocab = await prisma.vocabulary.findFirst({
        where: whereFilter,
        skip,
      });
    }

    if (!selectedVocab) {
      return NextResponse.json(
        { error: "เกิดข้อผิดพลาดในการดึงคำศัพท์ กรุณาลองใหม่อีกครั้ง" },
        { status: 404 }
      );
    }

    let completedCount = 0;
    if (!isGuest && userId) {
      completedCount = await prisma.userProgress.count({
        where: {
          userId,
          ...(Object.keys(whereFilter).length > 0 ? { vocabulary: whereFilter } : {}),
        },
      });
    }

    // 2. INSTANT ZERO-LATENCY AI HANDLING (< 1ms)
    // If exampleSentence is missing, DO NOT block the request waiting for AI! Return immediately and generate asynchronously in background.
    let exampleSentence = selectedVocab.exampleSentence;
    let exampleTarget = selectedVocab.exampleTarget;
    let wasAiGenerated = false;

    if (!exampleSentence || !exampleTarget) {
      exampleSentence = `An example of using "${selectedVocab.word}" in an authentic context.`;
      exampleTarget = `ตัวอย่างการใช้คำว่า ${selectedVocab.meaning}`;
      wasAiGenerated = true;

      // Trigger asynchronous background generation without awaiting
      Promise.resolve().then(async () => {
        try {
          const generated = await generateExampleForVocab(
            selectedVocab.word,
            selectedVocab.meaning,
            selectedVocab.partOfSpeech,
            selectedVocab.category
          );
          if (generated?.exampleSentence && generated?.exampleTarget) {
            await prisma.vocabulary.update({
              where: { id: selectedVocab.id },
              data: {
                exampleSentence: generated.exampleSentence,
                exampleTarget: generated.exampleTarget,
              },
            });
          }
        } catch (bgErr) {
          console.error(`[Background AI Gen Error for "${selectedVocab.word}"]:`, bgErr);
        }
      });
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
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error: any) {
    console.error("[API Error /api/vocab/next]:", error);
    return NextResponse.json(
      { error: "ไม่สามารถโหลดคำศัพท์ได้ในขณะนี้: " + error.message },
      { status: 500 }
    );
  }
}
