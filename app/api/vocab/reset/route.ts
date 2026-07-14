import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ status: "guest_local_reset" });
    }

    const body = await request.json().catch(() => ({}));
    const { collectionId, category } = body;

    if (!collectionId && !category) {
      return NextResponse.json(
        { error: "กรุณาระบุ collectionId หรือ category ที่ต้องการรีเซ็ต" },
        { status: 400 }
      );
    }

    const whereFilter: any = {
      userId,
    };

    if (collectionId) {
      whereFilter.vocabulary = {
        collections: {
          some: { id: collectionId },
        },
      };
    } else if (category && category !== "all") {
      whereFilter.vocabulary = {
        category,
      };
    }

    await prisma.userProgress.deleteMany({
      where: whereFilter,
    });

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("[API Error /api/vocab/reset]:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการรีเซ็ตความคืบหน้า" },
      { status: 500 }
    );
  }
}
