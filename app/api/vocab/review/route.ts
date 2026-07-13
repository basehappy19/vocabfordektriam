import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Leitner Box Spaced Repetition System intervals in days
const BOX_INTERVALS_DAYS: Record<number, number> = {
  1: 1,  // Review tomorrow
  2: 3,  // Review in 3 days
  3: 7,  // Review in 1 week
  4: 14, // Review in 2 weeks
  5: 30, // Review in 1 month (Mastered)
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required to save progress in SRS." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { vocabId, rating, durationSeconds = 30 } = body;
    // rating can be: 'again' (Box 1), 'hard' (Box Level), 'good' (Box + 1), 'easy' (Box + 2 or 5)

    if (!vocabId || !rating) {
      return NextResponse.json(
        { error: "Missing required fields: vocabId and rating" },
        { status: 400 }
      );
    }

    const now = new Date();
    const existingProgress = await prisma.userProgress.findUnique({
      where: {
        userId_vocabId: { userId, vocabId },
      },
    });

    let currentBox = existingProgress ? existingProgress.boxLevel : 1;
    let streak = existingProgress ? existingProgress.streak : 0;
    let correctCount = existingProgress ? existingProgress.correctCount : 0;

    // Calculate new Box Level according to Leitner SRS algorithm
    if (rating === "again") {
      currentBox = 1; // Reset to Box 1
      streak = 0;
    } else if (rating === "hard") {
      // Keep same box level or at least Box 1
      currentBox = Math.max(1, currentBox);
    } else if (rating === "good") {
      currentBox = Math.min(5, currentBox + 1);
      streak += 1;
      correctCount += 1;
    } else if (rating === "easy") {
      currentBox = Math.min(5, currentBox + 2);
      streak += 1;
      correctCount += 1;
    }

    const intervalDays = BOX_INTERVALS_DAYS[currentBox] || 1;
    const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    // Upsert UserProgress record
    const updatedProgress = await prisma.userProgress.upsert({
      where: {
        userId_vocabId: { userId, vocabId },
      },
      update: {
        boxLevel: currentBox,
        nextReview,
        lastReviewed: now,
        reviewCount: { increment: 1 },
        correctCount,
        streak,
      },
      create: {
        userId,
        vocabId,
        boxLevel: currentBox,
        nextReview,
        lastReviewed: now,
        reviewCount: 1,
        correctCount: rating === "good" || rating === "easy" ? 1 : 0,
        streak: rating === "good" || rating === "easy" ? 1 : 0,
      },
    });

    // Update Daily ActivityLog
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.activityLog.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      update: {
        wordsPracticed: { increment: 1 },
        wordsMastered: currentBox === 5 ? { increment: 1 } : undefined,
        durationSeconds: { increment: durationSeconds },
      },
      create: {
        userId,
        date: today,
        wordsPracticed: 1,
        wordsMastered: currentBox === 5 ? 1 : 0,
        durationSeconds,
        deviceType: "iPad",
      },
    });

    return NextResponse.json({
      status: "success",
      progress: updatedProgress,
    });
  } catch (error: any) {
    console.error("[API Error /api/vocab/review]:", error);
    return NextResponse.json(
      { error: "Failed to update review progress", details: error.message },
      { status: 500 }
    );
  }
}
