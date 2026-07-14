"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getCefrBadgeProps } from "@/lib/cefr";
import { getCompletedWordIds } from "@/lib/progress";
import { ArrowLeft, CheckCircle2, Search, X, BookOpen, PenTool } from "lucide-react";

interface VocabItem {
  id: string;
  word: string;
  meaning: string;
  partOfSpeech: string;
  category: string;
  cefrLevel: string;
  difficultyLevel: number;
  phonetic?: string | null;
  exampleSentence?: string | null;
  exampleTarget?: string | null;
}

interface CollectionDetailProps {
  collection: {
    id: string;
    title: string;
    description: string;
    category: string;
    cefrLevel: string;
    icon: string;
    color: string;
    badge: string;
    badgeColor: string;
  };
  words: VocabItem[];
  isGuest: boolean;
  initialDbProgressIds?: string[];
  userName?: string | null;
}

export default function CollectionDetail({
  collection,
  words,
  isGuest,
  initialDbProgressIds = [],
  userName,
}: CollectionDetailProps) {
  const [completedIds, setCompletedIds] = useState<string[]>(initialDbProgressIds);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isGuest) {
      const guestIds = getCompletedWordIds(collection.id);
      setCompletedIds(guestIds);
    } else {
      setCompletedIds(initialDbProgressIds);
    }
  }, [isGuest, collection.id, initialDbProgressIds]);

  const totalWords = words.length;
  const completedCount = words.filter((w) => completedIds.includes(w.id)).length;
  const progressPercent = totalWords > 0 ? Math.round((completedCount / totalWords) * 100) : 0;

  const filteredWords = words.filter((w) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      w.word.toLowerCase().includes(q) ||
      w.meaning.toLowerCase().includes(q) ||
      (w.phonetic && w.phonetic.toLowerCase().includes(q))
    );
  });

  const cefrInfo = getCefrBadgeProps(collection.cefrLevel || "B2");

  const cleanTitle = collection.title.replace(/\s*\([^)]*\)/g, "").replace(/[\u10000-\u10FFFF]/g, "").trim();
  const cleanDesc = collection.description.replace(/\s*\([^)]*\)/g, "").replace(/[\u10000-\u10FFFF]/g, "").trim();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-16">
      {/* Navbar */}
      <header className="sticky top-3 sm:top-4 z-40 w-full max-w-5xl mx-auto px-4">
        <nav className="flex items-center justify-between py-3 px-5 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-sm">
          <Link href="/" className="cursor-pointer flex items-center gap-2 font-semibold text-slate-700 hover:text-indigo-600 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้าเลือกคลังคำศัพท์</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold">
            {!isGuest && userName ? (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>บันทึกความคืบหน้าบนคลาวด์: {userName}</span>
              </span>
            ) : (
              <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>บันทึกข้อมูลในเครื่อง</span>
              </span>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 pt-6 flex flex-col gap-6">
        {/* Collection Hero Banner Card */}
        <div className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-br ${collection.color} bg-white border border-slate-200 shadow-sm flex flex-col gap-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-white/95 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-3.5 py-1 bg-slate-900 text-white rounded-full text-sm font-extrabold tracking-wide shadow-xs">
                    {collection.category}
                  </span>
                  <span className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${collection.badgeColor}`}>
                    {collection.badge}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cefrInfo.colorClass}`}>
                    {cefrInfo.cefr}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                  {cleanTitle}
                </h1>
              </div>
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
            {cleanDesc}
          </p>

          {/* Progress Tracking Box Card */}
          <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col gap-3 mt-1">
            <div className="flex items-center justify-between text-sm sm:text-base font-semibold text-slate-800">
              <div className="flex items-center gap-2">
                <span>ความคืบหน้าของชุดคำศัพท์นี้:</span>
                <span className="text-indigo-600 font-bold">
                  {completedCount} / {totalWords} คำ
                </span>
                <span className="text-xs font-semibold text-slate-500">{progressPercent}%</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {progressPercent === 100
                  ? "เสร็จสิ้นครบทุกคำ"
                  : progressPercent >= 50
                  ? "ความคืบหน้าระดับดีเยี่ยม"
                  : "กำลังเริ่มต้นฝึกฝน"}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0 border border-slate-200">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1">
              <span>
                {isGuest
                  ? "จัดเก็บข้อมูลอัตโนมัติในเครื่อง เข้าสู่ระบบเพื่อซิงค์ข้อมูลบนคลาวด์"
                  : "ซิงค์ข้อมูลกับคลาวด์เรียบร้อยแล้ว"}
              </span>
            </div>
          </div>

          {/* Practice Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link
              href={`/practice?collectionId=${collection.id}`}
              className="cursor-pointer w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <PenTool className="w-4 h-4" />
              <span>เริ่มฝึกเขียนคำศัพท์ชุดนี้</span>
            </Link>
          </div>
        </div>

        {/* Word List Preview Section */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                รายการคำศัพท์ทั้งหมด: {words.length} คำ
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ตรวจสอบคำแปล ตัวอย่างการใช้ และระดับความยาก ก่อนเริ่มฝึกเขียน
              </p>
            </div>

            <div className="w-full sm:w-72 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="ค้นหาคำศัพท์หรือความหมาย..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title="ล้างคำค้นหา"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Grid/Table of Vocabulary items */}
          {filteredWords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm font-medium">
              ไม่พบคำศัพท์ที่ตรงกับ "{searchQuery}"
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredWords.map((w, index) => {
                const isCompleted = completedIds.includes(w.id);
                const wordCefr = getCefrBadgeProps(w.cefrLevel || w.difficultyLevel);

                const cleanExample = w.exampleSentence ? w.exampleSentence.replace(/[\u10000-\u10FFFF]/g, "").trim() : null;
                const cleanTarget = w.exampleTarget ? w.exampleTarget.replace(/\s*\([^)]*\)/g, "").replace(/[\u10000-\u10FFFF]/g, "").trim() : null;

                return (
                  <div
                    key={w.id}
                    className={`p-4 sm:p-5 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      isCompleted
                        ? "bg-emerald-50/30 border-emerald-200/70 shadow-2xs"
                        : "bg-white hover:bg-slate-50/50 border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start md:items-center gap-3.5 flex-1">
                      <div className="flex flex-col items-center justify-center min-w-8 font-mono font-medium text-xs text-slate-400">
                        #{index + 1}
                      </div>

                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                            {w.word}
                          </span>
                          {w.phonetic && (
                            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                              /{w.phonetic}/
                            </span>
                          )}
                          <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                            {w.partOfSpeech}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                            {wordCefr.cefr}
                          </span>
                        </div>

                        <p className="text-sm sm:text-base font-semibold text-slate-800 leading-snug">
                          {w.meaning}
                        </p>

                        {cleanExample && (
                          <div className="text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/60 mt-1 flex flex-col gap-0.5">
                            <span className="italic font-normal text-slate-700">"{cleanExample}"</span>
                            {cleanTarget && <span className="text-slate-500 text-[11px]">คำแปล: {cleanTarget}</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status & Quick Action */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      {isCompleted ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-medium text-xs border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>ผ่านแล้ว</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium text-xs border border-slate-200">
                          ยังไม่ผ่าน
                        </span>
                      )}

                      <Link
                        href={`/practice?collectionId=${collection.id}`}
                        className="cursor-pointer px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-medium text-xs rounded-lg transition-all flex items-center gap-1 shadow-2xs"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>ฝึกเขียน</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

