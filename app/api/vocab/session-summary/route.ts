import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;

    const body = await request.json();
    const { collectionId = null, category = "GENERAL", durationSeconds = 0, answers = [] } = body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: "No answers provided for session summary" }, { status: 400 });
    }

    const totalWords = answers.length;
    const correctCount = answers.filter((a: any) => a.isCorrect).length;
    const wrongCount = totalWords - correctCount;

    const safeCategory = typeof category === "string" && category.trim() !== "" ? category : "GENERAL";

    const practiceSession = await prisma.practiceSession.create({
      data: {
        user: userId ? { connect: { id: userId } } : undefined,
        collectionId: collectionId || null,
        category: safeCategory,
        totalWords,
        correctCount,
        wrongCount,
        durationSeconds: Number(durationSeconds) || 0,
        answers: {
          create: answers.map((a: any) => ({
            vocabId: a.vocabId || null,
            word: a.word || "",
            meaning: a.meaning || "",
            userTypedInput: a.userTypedInput || (a.isCorrect ? (a.word || "") : "- ไม่ได้ระบุ -"),
            correctAnswerText: a.correctAnswerText || a.meaning || "",
            isCorrect: Boolean(a.isCorrect),
          })),
        },
      },
      include: {
        answers: true,
      },
    });

    return NextResponse.json({
      status: "success",
      sessionSummary: practiceSession,
    });
  } catch (error: any) {
    console.error("[API Error /api/vocab/session-summary POST]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save practice session summary" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      const practiceSession = await prisma.practiceSession.findUnique({
        where: { id: sessionId },
        include: { answers: { orderBy: { createdAt: "asc" } } },
      });
      if (!practiceSession) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
      return NextResponse.json({ status: "success", sessionSummary: practiceSession });
    }

    const session = await auth();
    const userId = session?.user?.id || null;

    const limit = Number(searchParams.get("limit")) || 10;
    const recentSessions = await prisma.practiceSession.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        answers: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({ status: "success", sessions: recentSessions });
  } catch (error: any) {
    console.error("[API Error /api/vocab/session-summary GET]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve practice sessions" },
      { status: 500 }
    );
  }
}
