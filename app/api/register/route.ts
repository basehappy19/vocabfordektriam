import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกสมัครสมาชิกไปแล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name || email.split("@")[0],
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      status: "success",
      message: "สมัครสมาชิกสำเร็จ! สามารถเข้าสู่ระบบได้ทันที",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
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
