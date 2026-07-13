"use client";

import React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

export function AuthNavButtons({ user }: { user?: { name?: string | null; email?: string | null } | null }) {
  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-xl flex items-center gap-1.5 shadow-2xs font-bold text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>👤 {user.name || "Student"}</span>
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-all"
          title="ออกจากระบบ"
        >
          🚪 ออกจากระบบ
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1"
      >
        <span>🔐 เข้าสู่ระบบ</span>
      </Link>
      <Link
        href="/register"
        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1"
      >
        <span>🚀 สมัครสมาชิก</span>
      </Link>
    </div>
  );
}
