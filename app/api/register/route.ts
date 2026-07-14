import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { name, username, email, password, generation } = await request.json();
    const finalUsername = (name || username || "").trim();

    if (!finalUsername && !email) {
      return NextResponse.json(
        { error: "กรุณาระบุชื่อผู้ใช้หรืออีเมลเพื่อสมัครสมาชิก" },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" },
        { status: 400 }
      );
    }

    const cleanEmail = email && typeof email === "string" && email.trim() ? email.trim() : null;
    const cleanGeneration = generation && typeof generation === "string" ? generation.trim() : "DEK69";

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(finalUsername ? [{ name: finalUsername }] : []),
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.name && existingUser.name === finalUsername) {
        return NextResponse.json(
          { error: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว กรุณาเลือกชื่ออื่นหรือเข้าสู่ระบบ" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "อีเมลหรือชื่อผู้ใช้นี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบ" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: finalUsername || (cleanEmail ? cleanEmail.split("@")[0] : `user_${Date.now()}`),
        email: cleanEmail,
        password: hashedPassword,
        generation: cleanGeneration,
      },
    });

    return NextResponse.json({
      status: "success",
      message: "สมัครสมาชิกสำเร็จ! สามารถเข้าสู่ระบบได้ทันที",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        generation: newUser.generation,
      },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
