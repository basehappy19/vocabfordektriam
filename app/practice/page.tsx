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
      <header className="sticky top-2 sm:top-3 z-50 w-full max-w-7xl mx-auto px-2 sm:px-4">
        <nav className="flex items-center justify-between py-2 px-3 sm:px-4 bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-2xs">
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
        </nav>
      </header>

      {/* Main Full-Screen Practice Session */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col items-center px-2 sm:px-4 py-2">
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
