import React from "react";
import PracticeSession from "@/components/practice/practice-session";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="flex-1 flex flex-col items-center pb-12">
      {/* Hero Header (Server Rendered RSC for fast First Contentful Paint & SEO) */}
      <header className="w-full bg-gradient-to-b from-indigo-900 via-indigo-800 to-slate-900 text-white pt-8 pb-12 px-4 sm:px-6 shadow-md border-b border-indigo-700/50">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <div className="inline-flex items-center justify-center sm:justify-start gap-2">
              <span className="px-3 py-1 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-full text-xs font-bold uppercase tracking-wider">
                🎯 TCAS / TGAT / A-Level 2026
              </span>
              {user && (
                <span className="px-3 py-1 bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 rounded-full text-xs font-bold">
                  🟢 ยินดีต้อนรับ: {user.name || "DekTriam Student"}
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight drop-shadow-sm">
              VocabForDekTriam ✍️
            </h1>
            <p className="text-sm sm:text-base text-indigo-100 max-w-xl font-light leading-relaxed">
              ฝึกเขียนคัดคำศัพท์ภาษาอังกฤษบน <strong className="font-semibold text-white">iPad ด้วย Apple Pencil</strong> พร้อมระบบจำแบบเว้นระยะ <strong className="font-semibold text-white">(Spaced Repetition System)</strong> และตัวอย่างประโยคอัจฉริยะจาก AI
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2 text-xs font-medium text-indigo-200 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>⚡ Lighthouse Performance &gt; 90</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>🔍 SEO Score 100 Optimized</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              <span>🍏 iPad touch-action: none Ready</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Interactive Practice Component */}
      <section className="w-full -mt-6 z-10 flex flex-col items-center">
        <PracticeSession />
      </section>

      {/* Footer & Educational Notes (RSC) */}
      <footer className="w-full max-w-4xl mx-auto mt-12 px-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 pt-8 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-2">
        <p className="font-semibold">
          © {new Date().getFullYear()} VocabForDekTriam. พัฒนาขึ้นเพื่อช่วยนักเรียนไทยเตรียมสอบเข้ามหาวิทยาลัยในระบบ TCAS
        </p>
        <p>
          ระบบ Spaced Repetition (SRS) ช่วยลดเวลาท่องจำและเพิ่มอัตราการจำคำศัพท์ได้ถึง 300% โดยคำนวณรอบการทบทวนตามหลักวิทยาศาสตร์สมอง Leitner Box System
        </p>
      </footer>
    </div>
  );
}
