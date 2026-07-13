import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateExampleForVocab } from "@/lib/ai";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const isGuest = !userId;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let selectedVocab: any = null;
    let userProgressData: any = null;

    if (!isGuest && userId) {
      // =========================================================================
      // 1. LOGGED-IN USER LOGIC (Spaced Repetition System - Leitner Box Level 1-5)
      // =========================================================================
      const now = new Date();

      // First, check for due review items where `nextReview <= now` using compound index [userId, nextReview]
      const dueProgress = await prisma.userProgress.findFirst({
        where: {
          userId,
          nextReview: { lte: now },
          ...(category ? { vocabulary: { category } } : {}),
        },
        orderBy: { nextReview: "asc" },
        include: { vocabulary: true },
      });

      if (dueProgress) {
        selectedVocab = dueProgress.vocabulary;
        userProgressData = {
          boxLevel: dueProgress.boxLevel,
          nextReview: dueProgress.nextReview,
          reviewCount: dueProgress.reviewCount,
          streak: dueProgress.streak,
          isDueReview: true,
        };
      } else {
        // If no due reviews, fetch a new vocabulary item that this user has NOT reviewed yet
        const existingProgressIds = await prisma.userProgress.findMany({
          where: { userId },
          select: { vocabId: true },
        });

        const excludedIds = existingProgressIds.map((p) => p.vocabId);

        selectedVocab = await prisma.vocabulary.findFirst({
          where: {
            id: { notIn: excludedIds },
            ...(category ? { category } : {}),
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
          // If all words have been encountered and none due right now, pick the word with earliest review date
          const earliestReview = await prisma.userProgress.findFirst({
            where: { userId, ...(category ? { vocabulary: { category } } : {}) },
            orderBy: { nextReview: "asc" },
            include: { vocabulary: true },
          });

          if (earliestReview) {
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
      // =========================================================================
      // 2. GUEST USER LOGIC (Random Vocabulary Practice - No Progress Saved)
      // =========================================================================
      const totalCount = await prisma.vocabulary.count({
        where: category ? { category } : {},
      });

      if (totalCount > 0) {
        const skip = Math.floor(Math.random() * totalCount);
        selectedVocab = await prisma.vocabulary.findFirst({
          where: category ? { category } : {},
          skip,
        });
      }
    }

    // Handle edge case if database is empty
    if (!selectedVocab) {
      return NextResponse.json(
        { error: "No vocabulary items found in the database for the selected criteria." },
        { status: 404 }
      );
    }

    // =========================================================================
    // 3. COST-SAVING AI INTEGRATION (Lazy-Generation for Example Sentence)
    // =========================================================================
    let exampleSentence = selectedVocab.exampleSentence;
    let exampleTarget = selectedVocab.exampleTarget;
    let wasAiGenerated = false;

    // Check if `exampleSentence` is null or missing in DB
    if (!exampleSentence || !exampleTarget) {
      console.log(`[Lazy AI Generation] Triggered for word: "${selectedVocab.word}"`);
      
      const generated = await generateExampleForVocab(
        selectedVocab.word,
        selectedVocab.meaning,
        selectedVocab.partOfSpeech,
        selectedVocab.category
      );

      exampleSentence = generated.exampleSentence;
      exampleTarget = generated.exampleTarget;
      wasAiGenerated = true;

      // IMMEDIATELY save this generated sentence back to the Vocabulary table in DB
      await prisma.vocabulary.update({
        where: { id: selectedVocab.id },
        data: {
          exampleSentence,
          exampleTarget,
        },
      });

      console.log(`[Lazy AI Generation] Successfully saved to DB for word: "${selectedVocab.word}"`);
    }

    // Return final structured response
    return NextResponse.json({
      status: "success",
      mode: isGuest ? "GUEST" : "AUTHENTICATED",
      data: {
        id: selectedVocab.id,
        word: selectedVocab.word,
        meaning: selectedVocab.meaning,
        partOfSpeech: selectedVocab.partOfSpeech,
        category: selectedVocab.category,
        difficultyLevel: selectedVocab.difficultyLevel,
        phonetic: selectedVocab.phonetic,
        exampleSentence,
        exampleTarget,
        meta: {
          wasAiGenerated,
          servedFromDbDirectly: !wasAiGenerated,
          userProgress: userProgressData,
        },
      },
    }, {
      headers: {
        "Cache-Control": isGuest
          ? "no-store, max-age=0"
          : "private, no-cache, no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("[API Error /api/vocab/next]:", error);
    return NextResponse.json(
      { error: "Failed to fetch next vocabulary item", details: error.message },
      { status: 500 }
    );
  }
}
