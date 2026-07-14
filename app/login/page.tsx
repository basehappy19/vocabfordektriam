"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#f8fafc] px-4 py-12 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl flex flex-col gap-6">
        <div className="text-center flex flex-col items-center gap-2">
          <Link href="/" className="inline-block p-3 bg-indigo-50 text-indigo-600 rounded-2xl text-3xl shadow-2xs border border-indigo-100">
            ✍️
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-2">
            เข้าสู่ระบบ VocabForDekTriam
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            ซิงค์ประวัติการท่องศัพท์และ Spaced Repetition ลงคลาวด์
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              อีเมล (Email Address)
            </label>
            <input
              type="email"
              required
              placeholder="student@dektriam.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              รหัสผ่าน (Password)
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            {loading ? <span>กำลังเข้าสู่ระบบ...</span> : <span>เข้าสู่ระบบทันที</span>}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs sm:text-sm text-slate-600 font-medium">
          ยังไม่มีบัญชีผู้ใช้?{" "}
          <Link href="/register" className="text-indigo-600 font-extrabold hover:underline">
            สมัครสมาชิกใหม่ที่นี่
          </Link>
        </div>

        <div className="text-center">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 font-bold">
            กลับไปใช้แบบ Guest Mode โดยไม่ต้องล็อกอิน
          </Link>
        </div>
      </div>
    </div>
  );
}
