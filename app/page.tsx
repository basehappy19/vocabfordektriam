import React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CollectionCard from "@/components/collection/collection-card";

export default async function Home() {
  const session = await auth();
  const user = session?.user;
  const isGuest = !user?.id;

  // Fetch all collections with total vocabulary counts
  const collections = await prisma.collection.findMany({
    include: {
      _count: {
        select: { vocabulary: true },
      },
    },
    orderBy: { id: "asc" },
  });

  // Calculate DB progress per collection if logged in
  let dbProgressMap: Record<string, number> = {};
  if (!isGuest && user?.id) {
    const userProgress = await prisma.userProgress.findMany({
      where: { userId: user.id },
      include: {
        vocabulary: {
          select: { collectionId: true },
        },
      },
    });
    userProgress.forEach((p) => {
      if (p.vocabulary?.collectionId) {
        dbProgressMap[p.vocabulary.collectionId] = (dbProgressMap[p.vocabulary.collectionId] || 0) + 1;
      }
    });
  }

  const categories = [
    {
      id: "TGAT-Eng",
      title: "📘 หมวดหมู่ TGAT English Core (การสื่อสารและคำศัพท์หลัก)",
      description: "รวมชุดฝึก (Collections) สำหรับเตรียมสอบ TGAT 1 ความสามารถในการสื่อสารภาษาอังกฤษและการใช้คำศัพท์ในชีวิตประจำวัน",
      badgeText: "TGAT 1",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      buttonColor: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20",
    },
    {
      id: "A-Level",
      title: "📙 หมวดหมู่ A-Level 82 Vocabulary (วิเคราะห์โจทย์และบทความยาก)",
      description: "รวมชุดฝึกคำศัพท์ระดับสูง (CEFR B2-C2) สำหรับโจทย์ Reading Comprehension & Academic Passages ในข้อสอบ A-Level 82",
      badgeText: "A-Level 82",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      buttonColor: "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20",
    },
    {
      id: "TCAS-Academic",
      title: "📗 หมวดหมู่ TCAS Academic Core (คำเชื่อมและศัพท์ทางการ)",
      description: "รวมชุดฝึกคำเชื่อม (Transitions/Connectors) และคำศัพท์ทางการสำหรับความเรียงระดับมหาวิทยาลัยและข้อสอบยาก",
      badgeText: "Academic Core",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      buttonColor: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8fafc] text-slate-900 font-sans pb-16">
      {/* Modern Floating Glass Navbar */}
      <header className="sticky top-3 sm:top-4 z-50 w-full max-w-6xl mx-auto px-3 sm:px-6">
        <nav className="flex items-center justify-between py-3.5 px-5 bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-sm transition-all">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
              <span>VocabForDekTriam</span> <span className="text-lg">✍️</span>
            </Link>
            <span className="hidden md:inline-block px-3 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-full text-xs font-bold uppercase tracking-wide">
              🎯 TCAS 2026 Collections System
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-semibold">
            {!isGuest ? (
              <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-xl flex items-center gap-1.5 shadow-2xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>บันทึกคลาวด์ ({user?.name || "Student"})</span>
              </span>
            ) : (
              <span className="px-3.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-xl flex items-center gap-1.5 shadow-2xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>บันทึก LocalStorage (Guest Mode)</span>
              </span>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Header Section */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-12 items-center">
        <div className="text-center max-w-2xl flex flex-col gap-3 pt-2">
          <span className="inline-block px-3.5 py-1 bg-indigo-100/80 text-indigo-800 rounded-full text-xs sm:text-sm font-bold tracking-wide border border-indigo-200 mx-auto shadow-2xs">
            📚 ระบบ Collection คำศัพท์แยกหมวดหมู่สำหรับ Apple Pencil & iPad
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            เลือกคลังข้อสอบตามหมวดหมู่ <br className="hidden sm:inline" />
            <span className="text-indigo-600">หรือฝึกคัดศัพท์ในชุด Collection</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
            สามารถกดดูรายการคำศัพท์ในแต่ละ Collection ก่อนฝึกได้ หรือคลิกที่ปุ่มประจำหมวดหมู่เพื่อสุ่มฝึกทุกคำในหมวดนั้น พร้อมบันทึกความคืบหน้าเรียลไทม์
          </p>
        </div>

        {/* Categories and Collections Sections */}
        <div className="w-full flex flex-col gap-10">
          {categories.map((cat) => {
            const catCollections = collections.filter((c) => c.category === cat.id);

            return (
              <section
                key={cat.id}
                className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6"
              >
                {/* Category Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${cat.badgeColor}`}>
                        {cat.badgeText}
                      </span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Category ID: {cat.id}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {cat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  {/* Category Practice CTA Button */}
                  <Link
                    href={`/practice?category=${cat.id}`}
                    className={`shrink-0 px-5 py-3 rounded-2xl font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${cat.buttonColor} active:scale-98`}
                  >
                    <span>🎯 ฝึกสุ่มทุกคำในหมวดหมู่ {cat.id}</span>
                    <span>➡️</span>
                  </Link>
                </div>

                {/* Collections Grid in this Category */}
                {catCollections.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm font-medium">
                    ยังไม่มี Collection ในหมวดหมู่นี้
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {catCollections.map((col) => (
                      <CollectionCard
                        key={col.id}
                        collection={{
                          id: col.id,
                          title: col.title,
                          description: col.description,
                          category: col.category,
                          cefrLevel: col.cefrLevel,
                          icon: col.icon,
                          color: col.color,
                          badge: col.badge,
                          badgeColor: col.badgeColor,
                          totalWordsCount: col._count.vocabulary,
                        }}
                        isGuest={isGuest}
                        dbCompletedCount={dbProgressMap[col.id] || 0}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}

          {/* Random All Challenge Section */}
          <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 bg-white border-2 border-amber-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl p-3 bg-white/95 rounded-2xl shadow-2xs border border-slate-100">
                ⚡
              </span>
              <div>
                <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                  Challenge Mode
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  🎯 สุ่มทุกคลังคำศัพท์รวม (All Categories Challenge)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                  ท้าทายความจำขั้นสุดโดยสุ่มคำศัพท์จากทุกหมวดหมู่ (TGAT + A-Level + TCAS Core) แบบไร้ขีดจำกัด
                </p>
              </div>
            </div>

            <Link
              href="/practice?category=all"
              className="w-full sm:w-auto shrink-0 px-6 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-amber-600/25 transition-all flex items-center justify-center gap-2"
            >
              <span>🔥 เริ่มสุ่มทุกคำเลย</span>
              <span>➡️</span>
            </Link>
          </section>
        </div>
      </main>

      {/* Minimalist Footer */}
      <footer className="w-full max-w-6xl mx-auto py-6 px-4 border-t border-slate-200/60 text-center text-xs text-slate-400 font-medium">
        © {new Date().getFullYear()} VocabForDekTriam • Spaced Repetition Leitner Box System for iPad & Apple Pencil
      </footer>
    </div>
  );
}
