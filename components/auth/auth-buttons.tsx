"use client";

import React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { User, LogOut, LogIn, UserPlus } from "lucide-react";

export function AuthNavButtons({ user }: { user?: { name?: string | null; email?: string | null } | null }) {
  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200/80 rounded-xl flex items-center gap-1.5 font-bold text-xs">
          <User className="w-3.5 h-3.5 text-indigo-600" />
          <span>{user.name || "บัญชีผู้ใช้"}</span>
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="px-3 py-1.5 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
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
        className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
      >
        <LogIn className="w-3.5 h-3.5 text-slate-500" />
        <span>เข้าสู่ระบบ</span>
      </Link>
      <Link
        href="/register"
        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
      >
        <UserPlus className="w-3.5 h-3.5" />
        <span>สมัครสมาชิก</span>
      </Link>
    </div>
  );
}
