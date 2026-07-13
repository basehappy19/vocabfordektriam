import React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  const user = session?.user;

  const collections = [
    {
      id: "TGAT-Eng",
      title: "TGAT English Core",
      badge: "TGAT 1",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      description: "คลังคำศัพท์หลักที่ออกสอบบ่อยที่สุดในข้อสอบ TGAT 1 การสื่อสารภาษาอังกฤษ เน้นคำศัพท์ระดับ B1-B2",
      icon: "📘",
      color: "from-blue-500/10 to-indigo-500/10 border-blue-200/80 hover:border-blue-400",
    },
    {
      id: "A-Level",
      title: "A-Level Vocabulary",
      badge: "A-Level 82",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      description: "คำศัพท์ขั้นสูงและศัพท์ยากระดับ B2-C2 สำหรับทำโจทย์ Reading Comprehension และ Vocab ในข้อสอบ A-Level",
      icon: "📙",
      color: "from-purple-500/10 to-pink-500/10 border-purple-200/80 hover:border-purple-400",
    },
    {
      id: "TCAS-Academic",
      title: "TCAS Academic Idioms",
      badge: "Academic Core",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: "สำนวนภาษาอังกฤษ ศัพท์เชิงวิชาการ และวลีสำคัญที่มักพบในบทความความเรียงของมหาวิทยาลัย",
      icon: "📗",
      color: "from-emerald-500/10 to-teal-500/10 border-emerald-200/80 hover:border-emerald-400",
    },
    {
      id: "all",
      title: "สุ่มทุกคลังคำศัพท์ (All Collections)",
      badge: "Random Mixed",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      description: "ท้าทายความจำขั้นสุดโดยสุ่มคำศัพท์จากทุกคลังข้อสอบ TCAS/TGAT/A-Level รวมกันแบบไร้ขีดจำกัด",
      icon: "🎯",
      color: "from-amber-500/10 to-orange-500/10 border-amber-200/80 hover:border-amber-400",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8fafc] text-slate-900 font-sans">
      {/* Modern Floating Glass Navbar */}
      <header className="sticky top-3 sm:top-4 z-50 w-full max-w-6xl mx-auto px-3 sm:px-6">
        <nav className="flex items-center justify-between py-3 px-5 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-sm transition-all">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
              VocabForDekTriam <span className="text-lg">✍️</span>
            </h1>
            <span className="hidden md:inline-block px-3 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-full text-xs font-bold uppercase tracking-wide">
              🎯 TCAS 2026 Collections
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            {user ? (
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-xl flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{user.name || "Student"}</span>
              </span>
            ) : (
              <span className="px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200/60 rounded-xl flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Guest Mode</span>
              </span>
            )}
          </div>
        </nav>
      </header>

      {/* Hero & Collection Grid Section */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col items-center justify-center gap-8">
        <div className="text-center max-w-2xl flex flex-col gap-3">
          <span className="inline-block px-3.5 py-1 bg-indigo-100/80 text-indigo-800 rounded-full text-xs sm:text-sm font-bold tracking-wide border border-indigo-200 mx-auto shadow-2xs">
            📚 เลือกคลังคำศัพท์สำหรับฝึกเขียนและท่องจำ
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            คอลเลกชันข้อสอบจริง <br className="hidden sm:inline" />
            <span className="text-indigo-600">พร้อมโหมดเขียนเต็มหน้าจอ</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
            เลือก Collection ที่ต้องการเพื่อเข้าสู่โหมดฝึกฝนทันที สามารถเขียนคัดศัพท์ด้วย Apple Pencil บน iPad หรือพิมพ์ตอบบน PC/มือถือ ตรวจคำตอบอัตโนมัติแม่นยำ 100%
          </p>
        </div>

        {/* Collection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-4xl mt-2">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/practice?category=${col.id}`}
              className={`group relative flex flex-col justify-between gap-4 p-6 rounded-3xl bg-gradient-to-br ${col.color} bg-white border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 active:translate-y-0`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-4xl p-2.5 bg-white/90 rounded-2xl shadow-2xs border border-slate-100 group-hover:scale-110 transition-transform">
                    {col.icon}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${col.badgeColor}`}>
                    {col.badge}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                  {col.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                  {col.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-indigo-700 group-hover:translate-x-1 transition-transform">
                <span>⚡ เริ่มฝึกเขียนคำศัพท์ทันที</span>
                <span className="text-lg">➡️</span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Minimalist Footer */}
      <footer className="w-full max-w-6xl mx-auto py-5 px-4 border-t border-slate-200/60 text-center text-xs text-slate-400 font-medium">
        © {new Date().getFullYear()} VocabForDekTriam • Spaced Repetition Leitner Box System for iPad & Apple Pencil
      </footer>
    </div>
  );
}
