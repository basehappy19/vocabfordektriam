import React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CollectionCard from "@/components/collection/collection-card";
import { AuthNavButtons } from "@/components/auth/auth-buttons";

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
    orderBy: { id: "desc" }, // Show latest years (68 -> 67 -> 66) first
  });

  // Calculate DB progress per collection if logged in
  let dbProgressMap: Record<string, number> = {};
  if (!isGuest && user?.id) {
    const userProgress = await prisma.userProgress.findMany({
      where: { userId: user.id },
      include: {
        vocabulary: {
          select: {
            collections: {
              select: { id: true },
            },
          },
        },
      },
    });
    userProgress.forEach((p) => {
      p.vocabulary?.collections.forEach((col) => {
        dbProgressMap[col.id] = (dbProgressMap[col.id] || 0) + 1;
      });
    });
  }

  const recommendedCollections = collections.filter((c) => c.isRecommended);

  const categories = [
    {
      id: "TGAT1",
      title: "📘 TGAT 1 ความสามารถในการสื่อสารภาษาอังกฤษ (ปี 2566-2568)",
      description: "คลังข้อสอบจริงและชุดคำศัพท์สำหรับการสื่อสารรอบด้าน (Vocabulary & Everyday Communication)",
      badgeText: "TGAT 1 Core",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      buttonColor: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20",
    },
    {
      id: "A-Level",
      title: "📙 A-Level 82 ภาษาอังกฤษ (ปี 2566-2568)",
      description: "เจาะลึกคำศัพท์ยากระดับ B2-C2 สำหรับวิเคราะห์บทความวิชาการ (Academic & Reading Comprehension)",
      badgeText: "A-Level 82",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      buttonColor: "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20",
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
              🎯 TCAS 67-68 Collections
            </span>
          </div>

          <AuthNavButtons user={user} />
        </nav>
      </header>

      {/* Hero Header Section */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-12 items-center">
        <div className="text-center max-w-2xl flex flex-col gap-3 pt-2">
          <span className="inline-block px-3.5 py-1 bg-indigo-100/80 text-indigo-800 rounded-full text-xs sm:text-sm font-bold tracking-wide border border-indigo-200 mx-auto shadow-2xs">
            📚 ตะลุยโจทย์คำศัพท์ TGAT 1 และ A-Level ตามปีข้อสอบจริง
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            คลังคำศัพท์ข้อสอบจริง <br className="hidden sm:inline" />
            <span className="text-indigo-600">พร้อมระบบเฉลยพ้องความหมาย (Synonyms)</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
            เลือกฝึกตามปีข้อสอบที่ต้องการหรือสุ่มทั้งหมวดหมู่ รองรับการเขียนเต็มจอด้วย Apple Pencil และการตรวจคำตอบอัตโนมัติที่ให้คะแนนแม้ออกเสียงหรือตอบความหมายใกล้เคียง
          </p>
        </div>

        {/* 🌟 Recommended Collections Showcase Section */}
        {recommendedCollections.length > 0 && (
          <section className="w-full bg-gradient-to-br from-amber-500/10 via-indigo-500/5 to-purple-500/10 p-6 sm:p-8 rounded-3xl border-2 border-amber-300/80 shadow-md flex flex-col gap-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl p-2 bg-amber-100 text-amber-800 rounded-2xl border border-amber-300">
                  🌟
                </span>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    แนะนำ Collection สำหรับคุณ (Featured & Latest Exams)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                    ชุดคำศัพท์ที่ออกสอบล่าสุดและมีความสำคัญสูงสุด แนะนำให้เริ่มฝึกคัดจากคอลเลกชันเหล่านี้ก่อน
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-500 text-white text-xs font-black rounded-full uppercase tracking-wider shadow-2xs animate-pulse">
                🔥 Hot Pick
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {recommendedCollections.map((col) => (
                <CollectionCard
                  key={col.id}
                  collection={{
                    id: col.id,
                    title: col.title,
                    description: col.description,
                    category: col.category,
                    cefrLevel: col.cefrLevel,
                    icon: col.icon,
                    color: "from-white to-amber-50/50 border-amber-200 hover:border-amber-400 shadow-sm",
                    badge: col.badge,
                    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
                    totalWordsCount: col._count.vocabulary,
                  }}
                  isGuest={isGuest}
                  dbCompletedCount={dbProgressMap[col.id] || 0}
                />
              ))}
            </div>
          </section>
        )}

        {/* Major Categories: TGAT1 & A-Level */}
        <div className="w-full flex flex-col gap-10">
          <div className="flex items-center gap-2 px-2">
            <span className="text-2xl">📚</span>
            <h3 className="text-2xl font-black tracking-tight text-slate-900">
              เลือก Collection ตามหมวดหมู่ใหญ่และปีข้อสอบ (TGAT1 / A-Level)
            </h3>
          </div>

          {categories.map((cat) => {
            const catCollections = collections.filter((c) => c.category === cat.id);

            return (
              <section
                key={cat.id}
                className="bg-white/85 backdrop-blur-sm p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6"
              >
                {/* Category Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${cat.badgeColor}`}>
                        {cat.badgeText}
                      </span>
                    </div>
                    <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                      {cat.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  {/* Category Practice CTA Button */}
                  <Link
                    href={`/practice?category=${cat.id}`}
                    className={`shrink-0 px-5 py-3.5 rounded-2xl font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${cat.buttonColor} active:scale-98`}
                  >
                    <span>🎯 ฝึกสุ่มทุกคำใน {cat.id}</span>
                    <span>➡️</span>
                  </Link>
                </div>

                {/* Collections Grid in this Category */}
                {catCollections.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm font-medium">
                    ยังไม่มี Collection ในหมวดหมู่นี้
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
          <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl p-3 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md">
                ⚡
              </span>
              <div>
                <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-white/20 text-white border border-white/30">
                  Ultimate Challenge Mode
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                  🎯 สุ่มทุกคลังข้อสอบรวม (All Collections & Years Challenge)
                </h3>
                <p className="text-xs sm:text-sm text-indigo-100 font-medium mt-1 max-w-lg">
                  ท้าทายความจำขั้นสุดโดยสุ่มคำศัพท์จากทุกคอลเลกชัน TGAT 1 และ A-Level 66-68 รวมกันแบบไร้ขีดจำกัด
                </p>
              </div>
            </div>

            <Link
              href="/practice?category=all"
              className="w-full sm:w-auto shrink-0 px-6 py-3.5 bg-white hover:bg-slate-100 text-indigo-900 font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
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
