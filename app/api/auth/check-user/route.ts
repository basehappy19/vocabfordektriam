import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username || typeof username !== "string" || !username.trim()) {
      return NextResponse.json(
        { error: "กรุณาระบุชื่อผู้ใช้" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { name: cleanUsername },
          { email: cleanUsername },
        ],
      },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({
      exists: !!user,
      username: user?.name || cleanUsername,
    });
  } catch (error) {
    console.error("Error checking user:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการตรวจสอบชื่อผู้ใช้" },
      { status: 500 }
    );
  }
}
