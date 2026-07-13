import React from "react";
import PracticeSession from "@/components/practice/practice-session";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8fafc]">
      {/* Modern Floating Glass Navbar ("Navbar ลอยใส ๆ โปร่งมองทะลุได้เบลอ ๆ") */}
      <header className="sticky top-3 sm:top-4 z-50 w-full max-w-6xl mx-auto px-3 sm:px-6">
        <nav className="flex items-center justify-between py-2.5 px-4 sm:px-5 bg-white/75 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-sm transition-all">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
              VocabForDekTriam <span className="text-base">✍️</span>
            </h1>
            <span className="hidden sm:inline-block px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-full text-[11px] font-bold uppercase tracking-wide">
              🎯 TCAS / TGAT 2026
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            {user ? (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-xl flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{user.name || "Student"}</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200/60 rounded-xl flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Guest Mode</span>
              </span>
            )}
          </div>
        </nav>
      </header>

      {/* Main Interactive Practice Component (Expanded to Full Screen Width & Height) */}
      <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col items-center px-3 sm:px-6 py-4">
        <PracticeSession />
      </main>

      {/* Ultra-compact minimalist footer */}
      <footer className="w-full max-w-6xl mx-auto py-4 px-4 border-t border-slate-200/60 text-center text-[11px] text-slate-400">
        © {new Date().getFullYear()} VocabForDekTriam • Spaced Repetition Leitner Box System for iPad & Apple Pencil
      </footer>
    </div>
  );
}
