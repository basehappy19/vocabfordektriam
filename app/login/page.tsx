"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { User, Lock, ArrowRight, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"CHECK" | "LOGIN" | "REGISTER">("CHECK");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  // Step 1: Check if username exists
  const handleCheckUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("กรุณาระบุชื่อผู้ใช้เพื่อดำเนินการต่อ");
      return;
    }

    setChecking(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "ไม่สามารถตรวจสอบชื่อผู้ใช้ได้");
      } else if (data.exists) {
        setMode("LOGIN");
      } else {
        setMode("REGISTER");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setChecking(false);
    }
  };

  // Step 2A: Login with Username + Password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("กรุณากรอกรหัสผ่าน");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  // Step 2B: Register with Username + Password (No email required)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาดในการสร้างบัญชี");
      } else {
        // Automatically sign in
        const loginRes = await signIn("credentials", {
          username: username.trim(),
          password,
          redirect: false,
        });

        if (loginRes?.error) {
          setError("สร้างบัญชีสำเร็จ แต่ไม่สามารถเข้าสู่ระบบอัตโนมัติได้ กรุณาลองเข้าสู่ระบบใหม่");
          setMode("LOGIN");
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
        {/* Header - Minimalist, Clean, and Spacious without Emojis */}
        <div className="text-center flex flex-col items-center gap-3 mb-1">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs mb-1">
            <User className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {mode === "CHECK" && "เข้าสู่ระบบ / สมัครสมาชิก"}
            {mode === "LOGIN" && "ยินดีต้อนรับกลับมา"}
            {mode === "REGISTER" && "สร้างบัญชีใหม่"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-sm">
            {mode === "CHECK" && "ระบุชื่อผู้ใช้เพื่อเข้าสู่ระบบหรือเริ่มต้นสร้างบัญชีใหม่"}
            {mode === "LOGIN" && "กรุณากรอกรหัสผ่านเพื่อเข้าสู่ระบบ"}
            {mode === "REGISTER" && "ไม่พบชื่อผู้ใช้นี้ในระบบ สร้างบัญชีใหม่และเริ่มใช้งานได้ทันที"}
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1 Form: Username Check */}
        {mode === "CHECK" && (
          <form onSubmit={handleCheckUsername} className="flex flex-col gap-6 animate-fade-in">
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

            <button
              type="submit"
              disabled={checking}
              className="mt-3 w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2.5 active:scale-98 cursor-pointer"
            >
              {checking ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>กำลังตรวจสอบ...</span>
                </>
              ) : (
                <>
                  <span>ดำเนินการต่อ</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2A Form: Login */}
        {mode === "LOGIN" && (
          <form onSubmit={handleLogin} className="flex flex-col gap-6 animate-fade-in">
            {/* Readonly Username Display with Edit Button */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700">
              <div className="flex items-center gap-3 overflow-hidden">
                <User className="w-5 h-5 text-indigo-600 shrink-0" />
                <span className="font-bold truncate text-base">{username}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode("CHECK");
                  setPassword("");
                  setError(null);
                }}
                className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors shrink-0 cursor-pointer"
              >
                เปลี่ยนชื่อผู้ใช้
              </button>
            </div>

            {/* Password Field - Animated Entrance */}
            <div className="flex flex-col gap-2.5 animate-fade-in">
              <label className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide">
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  <span>กำลังเข้าสู่ระบบ...</span>
                </>
              ) : (
                <span>เข้าสู่ระบบทันที</span>
              )}
            </button>
          </form>
        )}

        {/* Step 2B Form: Seamless Register (No Email Required) */}
        {mode === "REGISTER" && (
          <form onSubmit={handleRegister} className="flex flex-col gap-6 animate-fade-in">
            {/* Readonly Username Display with Edit Button */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-sm font-medium text-indigo-900">
              <div className="flex items-center gap-3 overflow-hidden">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
                <span className="text-xs sm:text-sm">ชื่อผู้ใช้ใหม่:</span>
                <span className="font-bold truncate text-base">{username}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode("CHECK");
                  setPassword("");
                  setConfirmPassword("");
                  setError(null);
                }}
                className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors shrink-0 cursor-pointer"
              >
                เปลี่ยน
              </button>
            </div>

            {/* Password Fields - Animated Entrance */}
            <div className="flex flex-col gap-4 animate-fade-in">
              <div className="flex flex-col gap-2.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide">
                  ตั้งรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    autoFocus
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
                <span>สร้างบัญชีและเริ่มใช้งานทันที</span>
              )}
            </button>
          </form>
        )}

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
