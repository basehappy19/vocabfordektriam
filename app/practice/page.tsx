import React, { Suspense } from "react";
import Link from "next/link";
import PracticeSessionWrapper from "./practice-wrapper";

export const metadata = {
  title: "โหมดเขียนคัดและท่องจำคำศัพท์ | VocabForDekTriam",
  description: "โหมดฝึกเขียนคำศัพท์ภาษาอังกฤษบน iPad ด้วย Apple Pencil และระบบตรวจคำตอบอัตโนมัติเมื่อพิมพ์ถูกต้อง",
};

export default function PracticePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8fafc] text-slate-900 font-sans">
      {/* Sleek Minimalist Navbar for Practice Screen (Removes TCAS 2026 and Guest Mode badges as requested) */}
      <header className="sticky top-2 sm:top-3 z-50 w-full max-w-6xl mx-auto px-3 sm:px-6">
        <nav className="flex items-center justify-between py-2.5 px-4 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="กลับไปเลือก Collection คำศัพท์"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors border border-slate-200/80"
            >
              <span>⬅️</span>
              <span className="hidden sm:inline">เปลี่ยน Collection</span>
            </Link>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-1">
              VocabForDekTriam <span className="text-sm">✍️</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200/60">
            <span>🚀 โหมดฝึกเขียนเต็มหน้าจอ</span>
          </div>
        </nav>
      </header>

      {/* Main Full-Screen Practice Session */}
      <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col items-center px-3 sm:px-6 py-3">
        <Suspense
          fallback={
            <div className="w-full flex-1 flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 shadow-xs animate-pulse">
              <div className="h-8 w-64 bg-slate-200 rounded-xl" />
            </div>
          }
        >
          <PracticeSessionWrapper />
        </Suspense>
      </main>

      {/* Ultra-compact bottom note */}
      <footer className="w-full max-w-6xl mx-auto py-3 px-4 text-center text-[11px] text-slate-400 font-medium">
        เขียนคำศัพท์ลงบนตารางด้วย Apple Pencil หรือพิมพ์ลงในช่องด้านบน • ตรวจคำตอบและเฉลยอัตโนมัติ 100%
      </footer>
    </div>
  );
}
