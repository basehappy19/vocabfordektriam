"use client";

import React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { User, LogOut, LogIn } from "lucide-react";

export function AuthNavButtons({ user }: { user?: { name?: string | null; email?: string | null } | null }) {
  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/profile"
          className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border border-indigo-200/80 rounded-xl flex items-center gap-1.5 font-bold text-xs transition-all shadow-2xs cursor-pointer"
          title="ดูและจัดการข้อมูลส่วนตัว"
        >
          <User className="w-3.5 h-3.5 text-indigo-600" />
          <span>{user.name || "บัญชีผู้ใช้"}</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="cursor-pointer px-3 py-1.5 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          title="ออกจากระบบ"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
        title="เข้าสู่ระบบ หรือ สมัครสมาชิกใหม่"
      >
        <LogIn className="w-4 h-4 shrink-0" />
        <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
      </Link>
    </div>
  );
}
