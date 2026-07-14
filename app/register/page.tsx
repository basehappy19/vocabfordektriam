"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { UserPlus, User, Lock, Loader2, AlertCircle, ArrowLeft, GraduationCap } from "lucide-react";

const GENERATION_OPTIONS = [
  { value: "DEK69", label: "DEK 69 (สอบ TCAS 69)" },
  { value: "DEK70", label: "DEK 70 (สอบ TCAS 70)" },
  { value: "DEK71", label: "DEK 71 (สอบ TCAS 71)" },
  { value: "DEK72", label: "DEK 72 (สอบ TCAS 72)" },
  { value: "เด็กซิ่ว", label: "เด็กซิ่ว (TCAS ปีก่อน ๆ)" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [generation, setGeneration] = useState("DEK69");
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
        body: JSON.stringify({ name: username.trim(), password, generation }),
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
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#f8fafc] px-0 sm:px-4 py-0 sm:py-16 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white p-6 sm:p-12 rounded-none sm:rounded-3xl border-x-0 border-y sm:border border-slate-200/80 shadow-none sm:shadow-xl flex flex-col justify-center min-h-screen sm:min-h-0 gap-8">
        <div className="text-center flex flex-col items-center gap-3 mb-1">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs mb-1">
            <UserPlus className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            สมัครสมาชิกใหม่
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-sm">
            สร้างบัญชีด้วยชื่อผู้ใช้เพื่อบันทึกสถิติและความคืบหน้าการท่องศัพท์
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2.5">
            <label className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide">
              ชื่อผู้ใช้
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoFocus
                placeholder="เช่น somchai_dek68"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-4 pl-12 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium transition-all"
              />
              <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide">
              เด็กรุ่นไหน (รุ่นที่เตรียมสอบ TCAS)
            </label>
            <div className="relative">
              <select
                value={generation}
                onChange={(e) => setGeneration(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-4 pl-12 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-bold text-slate-800 transition-all appearance-none cursor-pointer"
              >
                {GENERATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <GraduationCap className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide">
              ตั้งรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-4 pl-12 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium transition-all"
              />
              <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide">
              ยืนยันรหัสผ่าน
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-4 pl-12 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium transition-all"
              />
              <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-3 w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2.5 active:scale-98 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
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

        <div className="pt-6 mt-2 border-t border-slate-100 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:text-slate-600 font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>กลับไปหน้าหลัก</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
