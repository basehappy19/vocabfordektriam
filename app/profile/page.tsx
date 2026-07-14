"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { User, Mail, Lock, ArrowLeft, Loader2, CheckCircle2, AlertCircle, ShieldCheck, Calendar, GraduationCap, Trash2 } from "lucide-react";
import { clearAllGuestAndLocalData } from "@/lib/progress";

const GENERATION_OPTIONS = [
  { value: "DEK70", label: "DEK 70" },
  { value: "DEK71", label: "DEK 71" },
  { value: "DEK72", label: "DEK 72" },
  { value: "DEK73", label: "DEK 73" },
  { value: "เด็กซิ่ว", label: "เด็กซิ่ว" },
];

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  generation?: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Email & Generation form state
  const [email, setEmail] = useState("");
  const [generation, setGeneration] = useState("DEK70");
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoMsg, setInfoMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delete account state
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setEmail(data.user.email || "");
        setGeneration(data.user.generation || "DEK70");
      } else {
        router.push("/login");
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInfo(true);
    setInfoMsg(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), generation }),
      });

      const data = await res.json();
      if (!res.ok) {
        setInfoMsg({ type: "error", text: data.error || "ไม่สามารถบันทึกข้อมูลได้" });
      } else {
        setUser(data.user);
        setInfoMsg({ type: "success", text: "บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว" });
      }
    } catch (err) {
      setInfoMsg({ type: "error", text: "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง" });
    } finally {
      setSavingInfo(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (res.ok) {
        clearAllGuestAndLocalData();
        await signOut({ callbackUrl: "/" });
      } else {
        const data = await res.json();
        alert(data.error || "ไม่สามารถลบบัญชีผู้ใช้ได้");
        setDeleting(false);
        setShowDeleteModal(false);
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร" });
      setSavingPassword(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน" });
      setSavingPassword(false);
      return;
    }

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordMsg({ type: "error", text: data.error || "ไม่สามารถเปลี่ยนรหัสผ่านได้" });
      } else {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordMsg({ type: "success", text: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
      }
    } catch (err) {
      setPasswordMsg({ type: "error", text: "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง" });
    } finally {
      setSavingPassword(false);
    }
  };

  const formatThaiDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#f8fafc] p-6 text-slate-600 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <span className="text-sm font-bold">กำลังโหลดข้อมูลส่วนตัว...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-4 sm:py-10 px-0 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 sm:gap-8">
        {/* Navigation & Header */}
        <div className="flex flex-col gap-4">
          <div className="px-4 sm:px-0">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับไปหน้าหลัก</span>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 bg-white rounded-none sm:rounded-3xl border-x-0 border-y sm:border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <User className="w-7 h-7 stroke-[2.2]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  ข้อมูลส่วนตัวและการตั้งค่า
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  จัดการอีเมลและความปลอดภัยของบัญชีผู้ใช้
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 self-start sm:self-center">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>สมัครเมื่อ {formatThaiDate(user.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Card 1: Basic Information (Username immutable, Email editable) */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                ข้อมูลบัญชี
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                ชื่อผู้ใช้ระบบและอีเมลสำหรับรับข่าวสารหรือกู้คืนบัญชี
              </p>
            </div>
          </div>

          {infoMsg && (
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-3 animate-fade-in ${
                infoMsg.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-700"
              }`}
            >
              {infoMsg.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              )}
              <span>{infoMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveInfo} className="flex flex-col gap-6">
            {/* Username Field - READONLY / IMMUTABLE */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide">
                  ชื่อผู้ใช้
                </label>
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-amber-600" />
                  <span>ไม่สามารถแก้ไขได้</span>
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={user.name || ""}
                  readOnly
                  disabled
                  className="w-full bg-slate-100/90 border border-slate-200/80 rounded-2xl px-4 py-4 pl-12 text-sm sm:text-base font-bold text-slate-600 cursor-not-allowed select-none"
                />
                <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Generation Field - EDITABLE */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide">
                เด็กรุ่นไหน
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

            {/* Email Field - EDITABLE */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide">
                อีเมล
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="เช่น somchai@example.com (ไม่บังคับ)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-4 pl-12 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium transition-all"
                />
                <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-xs text-slate-400 font-medium pl-1">
                * ระบุอีเมลเพื่อความปลอดภัย หรือใช้สำหรับการแจ้งเตือนและการตั้งค่าในอนาคต
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingInfo || (email.trim() === (user.email || "") && generation === (user.generation || "DEK70"))}
                className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                {savingInfo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <span>บันทึกข้อมูลส่วนตัว</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Card 2: Password Change */}
        <div className="bg-white p-6 sm:p-10 rounded-none sm:rounded-3xl border-x-0 border-y sm:border border-slate-200/80 shadow-xs flex flex-col gap-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                เปลี่ยนรหัสผ่าน
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                เพื่อความปลอดภัย กรุณากรอกรหัสผ่านปัจจุบันก่อนตั้งรหัสผ่านใหม่
              </p>
            </div>
          </div>

          {passwordMsg && (
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-3 animate-fade-in ${
                passwordMsg.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-700"
              }`}
            >
              {passwordMsg.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide">
                รหัสผ่านปัจจุบัน
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-4 pl-12 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium transition-all"
                />
                <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1 flex flex-col gap-2.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide">
                  ตั้งรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-4 pl-12 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium transition-all"
                  />
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-2.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide">
                  ยืนยันรหัสผ่านใหม่
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

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingPassword || !currentPassword || !newPassword}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-slate-900/10 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                {savingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังเปลี่ยนรหัสผ่าน...</span>
                  </>
                ) : (
                  <span>เปลี่ยนรหัสผ่านทันที</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Card 3: Account Deletion (Danger Zone) */}
        <div className="bg-white p-6 sm:p-10 rounded-none sm:rounded-3xl border-x-0 border-y sm:border border-rose-200/80 shadow-xs flex flex-col gap-6">
          <div className="flex items-center gap-3 pb-4 border-b border-rose-100">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                ลบบัญชีผู้ใช้
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                การดำเนินการที่ส่งผลถาวรและไม่สามารถยกเลิกหรือกู้คืนได้
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-5 rounded-2xl bg-rose-50/50 border border-rose-100">
            <div className="flex flex-col gap-1.5 max-w-xl">
              <span className="text-sm font-extrabold text-rose-900">
                ต้องการลบบัญชีและข้อมูลทั้งหมดของคุณหรือไม่?
              </span>
              <span className="text-xs text-rose-700 font-medium leading-relaxed">
                เมื่อลบบัญชี ข้อมูลคำศัพท์ที่เคยฝึกฝน สถิติความจำ ประวัติการเรียนรู้ และข้อมูลส่วนตัวทั้งหมดจะถูกลบออกจากระบบอย่างถาวร
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={deleting}
              className="cursor-pointer px-6 py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>ลบบัญชีผู้ใช้ถาวร</span>
            </button>
          </div>
        </div>

        {/* Custom Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-2xl flex flex-col gap-6 animate-scale-up">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <AlertCircle className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    ยืนยันการลบบัญชีผู้ใช้ถาวร?
                  </h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 text-rose-800 text-xs sm:text-sm font-semibold leading-relaxed">
                ข้อมูลสถิติ ประวัติการท่องศัพท์ ความคืบหน้า และบัญชีผู้ใช้นี้จะสูญหายทันทีและไม่สามารถกู้คืนกลับมาได้อีก คุณแน่ใจหรือไม่ที่จะดำเนินการต่อ?
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setShowDeleteModal(false)}
                  className="cursor-pointer w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl transition-all active:scale-95"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteAccount}
                  className="cursor-pointer w-full sm:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังลบบัญชี...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>ยืนยันลบบัญชีถาวร</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
