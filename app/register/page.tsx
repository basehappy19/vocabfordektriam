"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { UserPlus, User, Lock, Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!username.trim()) {
      setError("กรุณาระบุชื่อผู้ใช้");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
      } else {
        // Automatically sign in after success
        const loginRes = await signIn("credentials", {
          username: username.trim(),
          password,
          redirect: false,
        });

        if (loginRes?.error) {
          router.push("/login");
        } else {
          router.push("/");
          router.refresh();
        }
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#f8fafc] px-4 py-12 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl flex flex-col gap-6">
        <div className="text-center flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <UserPlus className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
            สมัครสมาชิกใหม่
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            สร้างบัญชีด้วยชื่อผู้ใช้เพื่อบันทึกสถิติและความคืบหน้าการท่องศัพท์
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              ชื่อผู้ใช้ (USERNAME)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoFocus
                placeholder="เช่น somchai_dek68"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium transition-all"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              ตั้งรหัสผ่าน (PASSWORD อย่างน้อย 6 ตัวอักษร)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              ยืนยันรหัสผ่าน (CONFIRM PASSWORD)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังสร้างบัญชี...</span>
              </>
            ) : (
              <span>สมัครสมาชิกและเริ่มฝึกทันที</span>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs sm:text-sm text-slate-600 font-medium">
          มีบัญชีผู้ใช้แล้ว?{" "}
          <Link href="/login" className="text-indigo-600 font-extrabold hover:underline">
            เข้าสู่ระบบที่นี่
          </Link>
        </div>

        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 font-bold transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับไปหน้าหลัก (Guest Mode)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
