import React from "react";
import PracticeSession from "@/components/practice/practice-session";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="flex-1 flex flex-col items-center pb-12 bg-[#f8fafc]">
      {/* Clean Minimalist Header (Light Theme) */}
      <header className="w-full bg-white border-b border-slate-200 py-6 px-4 sm:px-6 mb-6 shadow-2xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <div className="inline-flex items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold uppercase tracking-wide">
                🎯 TCAS / TGAT / A-Level 2026
              </span>
              {user && (
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                  🟢 ยินดีต้อนรับ: {user.name || "DekTriam Student"}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              VocabForDekTriam ✍️
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl font-normal leading-relaxed">
              ฝึกเขียนคัดคำศัพท์ภาษาอังกฤษบน <strong className="font-semibold text-slate-900">iPad (Apple Pencil)</strong> ในโหมดโจทย์แปลไทย ➡️ เขียนคำศัพท์อังกฤษ พร้อมระบบจำ Leitner Box & AI
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-col sm:items-end gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 rounded-xl shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>⚡ Performance &gt; 90</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>🔍 SEO Score 100</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>🍏 iPad touch-action: none</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Interactive Practice Component */}
      <section className="w-full z-10 flex flex-col items-center">
        <PracticeSession />
      </section>

      {/* Clean Minimalist Footer */}
      <footer className="w-full max-w-4xl mx-auto mt-12 px-4 sm:px-6 border-t border-slate-200 pt-6 text-center text-xs text-slate-500 flex flex-col gap-1.5 font-normal">
        <p className="font-medium text-slate-700">
          © {new Date().getFullYear()} VocabForDekTriam. พัฒนาเพื่อนักเรียนเตรียมสอบมหาวิทยาลัยในระบบ TCAS
        </p>
        <p>
          ระบบ Spaced Repetition (Leitner Box System) ช่วยเพิ่มประสิทธิภาพความจำคำศัพท์อย่างเป็นระบบ
        </p>
      </footer>
    </div>
  );
}
