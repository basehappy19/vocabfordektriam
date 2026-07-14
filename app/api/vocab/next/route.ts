import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateExampleForVocab } from "@/lib/ai";
import { getCefrFromNumber } from "@/lib/cefr";

export async function GET(request: NextRequest) {
  try {
    // 1. Check if user actually has a NextAuth session cookie before running auth() across LAN
    const hasSessionCookie =
      request.cookies.has("authjs.session-token") ||
      request.cookies.has("__Secure-authjs.session-token") ||
      request.cookies.has("next-auth.session-token") ||
      request.cookies.has("__Secure-next-auth.session-token");

    let userId: string | undefined = undefined;
    if (hasSessionCookie) {
      try {
        const sessionTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 300));
        const session = await Promise.race([auth(), sessionTimeout]);
        userId = session?.user?.id;
      } catch (authErr) {
        console.error("[Fast auth check error]:", authErr);
      }
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

    // Safety timeout wrapper for DB queries to prevent LAN/Postgres hangs
    const dbTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("ฐานข้อมูลใช้เวลานานเกินกำหนด (Timeout)")), 3500)
    );

    // Query all stable IDs for this filter to get exact 1-based order (wordIndex) and support sequential practice
    const allIdsQuery = await Promise.race([
      prisma.vocabulary.findMany({
        where: whereFilter,
        select: { id: true },
        orderBy: { id: "asc" },
      }),
      dbTimeout,
    ]);

    const totalCount: number = allIdsQuery.length;
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

      const dueProgress = await Promise.race([
        prisma.userProgress.findFirst({
          where: {
            userId,
            nextReview: { lte: now },
            ...(Object.keys(whereFilter).length > 0 ? { vocabulary: whereFilter } : {}),
          },
          orderBy: { nextReview: "asc" },
          include: { vocabulary: true },
        }),
        dbTimeout,
      ]);

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
        const existingProgressIds = await Promise.race([
          prisma.userProgress.findMany({
            where: { userId },
            select: { vocabId: true },
          }),
          dbTimeout,
        ]);

        const excludedIds = existingProgressIds.map((p: any) => p.vocabId);

        selectedVocab = await Promise.race([
          prisma.vocabulary.findFirst({
            where: {
              id: { notIn: excludedIds },
              ...whereFilter,
            },
            orderBy: { id: "asc" },
          }),
          dbTimeout,
        ]);

        if (selectedVocab) {
          userProgressData = {
            boxLevel: 1,
            nextReview: now,
            reviewCount: 0,
            streak: 0,
            isNewWord: true,
          };
        } else {
          const earliestReview = await Promise.race([
            prisma.userProgress.findFirst({
              where: {
                userId,
                ...(Object.keys(whereFilter).length > 0 ? { vocabulary: whereFilter } : {}),
              },
              orderBy: { nextReview: "asc" },
              include: { vocabulary: true },
            }),
            dbTimeout,
          ]);

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

    // Fallback or Guest mode handling: Sequential progress ("ทำต่อไม่สุ่ม") vs Reset / Random ("สุ่มเฉพาะคนที่ไม่เคยทำ หรือกดเริ่มใหม่")
    if (!selectedVocab) {
      const currentWordId = searchParams.get("currentWordId");
      const excludeIdsParam = searchParams.get("excludeIds");
      const excludeIds = excludeIdsParam ? excludeIdsParam.split(",").filter(Boolean) : [];
      const isResetOrRandom = searchParams.get("reset") === "true" || searchParams.get("random") === "true";

      if (!isResetOrRandom && (currentWordId || excludeIds.length > 0)) {
        let targetId: string | null = null;
        if (currentWordId) {
          const currIdx = allIdsQuery.findIndex((v: any) => v.id === currentWordId);
          if (currIdx !== -1 && currIdx + 1 < allIdsQuery.length) {
            targetId = allIdsQuery[currIdx + 1].id;
          }
        }
        if (!targetId) {
          const firstUnvisited = allIdsQuery.find((v: any) => !excludeIds.includes(v.id));
          targetId = firstUnvisited ? firstUnvisited.id : allIdsQuery[0].id;
        }

        selectedVocab = await Promise.race([
          prisma.vocabulary.findUnique({ where: { id: targetId } }),
          dbTimeout,
        ]);
      } else {
        // First time or reset: if reset=true pick exact first word (skip=0), if random=true pick random word
        const isExactReset = searchParams.get("reset") === "true";
        const skip = isExactReset ? 0 : Math.floor(Math.random() * totalCount);
        selectedVocab = await Promise.race([
          prisma.vocabulary.findFirst({
            where: whereFilter,
            orderBy: { id: "asc" },
            skip,
          }),
          dbTimeout,
        ]);
      }
    }

    if (!selectedVocab) {
      return NextResponse.json(
        { error: "เกิดข้อผิดพลาดในการดึงคำศัพท์ กรุณาลองใหม่อีกครั้ง" },
        { status: 404 }
      );
    }

    const wordIndex = allIdsQuery.findIndex((v: any) => v.id === selectedVocab.id) + 1;

    let completedCount = 0;
    if (!isGuest && userId) {
      completedCount = await Promise.race([
        prisma.userProgress.count({
          where: {
            userId,
            ...(Object.keys(whereFilter).length > 0 ? { vocabulary: whereFilter } : {}),
          },
        }),
        dbTimeout,
      ]);
    }

    // 2. INSTANT ZERO-LATENCY AI HANDLING (< 1ms)
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
              wordIndex: wordIndex || 1,
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
      { error: "ไม่สามารถโหลดคำศัพท์ได้ในขณะนี้: " + (error.message || "Unknown error") },
      { status: 500 }
    );
  }
}
