import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const userName = session?.user?.name;

    if (!userId && !userName) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบเพื่อดูข้อมูลส่วนตัว" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { name: userName as string },
      select: {
        id: true,
        name: true,
        email: true,
        generation: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[GET /api/profile Error]:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลส่วนตัว" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const userName = session?.user?.name;

    if (!userId && !userName) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบเพื่อแก้ไขข้อมูลส่วนตัว" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { name: userName as string },
    });

    if (!user) {
      return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้" }, { status: 404 });
    }

    const body = await request.json();
    const { name, username, email, generation, currentPassword, newPassword } = body;

    // Strict rule: Username cannot be edited
    if ((name && name.trim() !== user.name) || (username && username.trim() !== user.name)) {
      return NextResponse.json(
        { error: "ไม่สามารถแก้ไขชื่อผู้ใช้ได้ ระบบอนุญาตให้แก้ไขเฉพาะอีเมลและรหัสผ่านเท่านั้น" },
        { status: 400 }
      );
    }

    // 1. Update Email if provided
    if (email !== undefined) {
      if (typeof email === "string" && email.trim()) {
        const cleanEmail = email.trim();
        // Check if another account is already using this email
        const existing = await prisma.user.findFirst({
          where: {
            email: cleanEmail,
            NOT: { id: user.id },
          },
        });

        if (existing) {
          return NextResponse.json({ error: "อีเมลนี้ถูกใช้งานโดยบัญชีอื่นแล้ว กรุณาใช้อีเมลอื่น" }, { status: 400 });
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { email: cleanEmail },
        });
      } else {
        // Allow clearing email
        await prisma.user.update({
          where: { id: user.id },
          data: { email: null },
        });
      }
    }

    // 2. Update Generation if provided
    if (generation !== undefined && typeof generation === "string") {
      await prisma.user.update({
        where: { id: user.id },
        data: { generation: generation.trim() },
      });
    }

    // 3. Update Password if requested
    if (newPassword !== undefined && newPassword !== "") {
      if (typeof newPassword !== "string" || newPassword.length < 6) {
        return NextResponse.json({ error: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
      }

      if (!currentPassword) {
        return NextResponse.json({ error: "กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยันการเปลี่ยนรหัสผ่าน" }, { status: 400 });
      }

      if (!user.password) {
        return NextResponse.json({ error: "บัญชีของคุณไม่มีรหัสผ่านในระบบ ไม่สามารถเปลี่ยนรหัสผ่านได้" }, { status: 400 });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง" }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
    }

    // Fetch updated user
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        generation: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว",
      user: updatedUser,
    });
  } catch (error) {
    console.error("[PATCH /api/profile Error]:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const userName = session?.user?.name;

    if (!userId && !userName) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบเพื่อดำเนินการลบบัญชี" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { name: userName as string },
    });

    if (!user) {
      return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้" }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: user.id },
    });

    return NextResponse.json({
      success: true,
      message: "ลบบัญชีผู้ใช้เรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("[DELETE /api/profile Error]:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบบัญชีผู้ใช้" }, { status: 500 });
  }
}
