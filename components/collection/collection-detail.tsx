"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getCefrBadgeProps } from "@/lib/cefr";
import { getCompletedWordIds } from "@/lib/progress";

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

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-16">
      {/* Navbar */}
      <header className="sticky top-3 sm:top-4 z-40 w-full max-w-5xl mx-auto px-4">
        <nav className="flex items-center justify-between py-3 px-5 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-sm">
          <Link href="/" className="flex items-center gap-2 font-black text-slate-900 hover:text-indigo-600 transition-colors">
            <span>⬅️ กลับหน้าเลือกคลังคำศัพท์</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold">
            {!isGuest && userName ? (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>บันทึก progress ในคลาวด์ ({userName})</span>
              </span>
            ) : (
              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>บันทึก progress ใน LocalStorage (Guest)</span>
              </span>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 pt-6 flex flex-col gap-6">
        {/* Collection Hero Banner Card */}
        <div className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-br ${collection.color} bg-white border-2 shadow-sm flex flex-col gap-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl sm:text-5xl p-3 bg-white/95 rounded-2xl shadow-sm border border-slate-100">
                {collection.icon}
              </span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${collection.badgeColor}`}>
                    {collection.badge}
                  </span>
                  <span className="px-2.5 py-0.5 bg-slate-900 text-white rounded-full text-[11px] font-bold tracking-wider uppercase">
                    หมวดหมู่ {collection.category}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cefrInfo.colorClass}`}>
                    {cefrInfo.badgeText}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  {collection.title}
                </h1>
              </div>
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
            {collection.description}
          </p>

          {/* Progress Tracking Box Card */}
          <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col gap-3 mt-1">
            <div className="flex items-center justify-between text-sm sm:text-base font-black text-slate-800">
              <div className="flex items-center gap-2">
                <span>🎯 ความคืบหน้าของ Collection นี้:</span>
                <span className="text-indigo-600 font-extrabold">
                  {completedCount} / {totalWords} คำ
                </span>
                <span className="text-xs font-bold text-slate-500">({progressPercent}%)</span>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {progressPercent === 100
                  ? "🏆 เชี่ยวชาญครบทุกคำแล้ว!"
                  : progressPercent >= 50
                  ? "🔥 คืบหน้ายอดเยี่ยม"
                  : "🌱 เริ่มต้นฝึกฝน"}
              </span>
            </div>

            {/* Glowing Bar */}
            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1">
              <span>
                {isGuest
                  ? "💡 ข้อมูลถูกจัดเก็บอัตโนมัติในเครื่อง (LocalStorage) ล็อคอินเพื่อซิงค์ข้อมูลลงคลาวด์"
                  : "☁️ ข้อมูลซิงค์กับฐานข้อมูลคลาวด์เรียบร้อยแล้ว"}
              </span>
            </div>
          </div>

          {/* Practice Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link
              href={`/practice?collectionId=${collection.id}`}
              className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 group"
            >
              <span>🚀 เริ่มฝึกเขียนคำศัพท์ใน Collection นี้ทันที</span>
              <span className="group-hover:translate-x-1 transition-transform">➡️</span>
            </Link>

            <Link
              href={`/practice?category=${collection.category}`}
              className="w-full sm:w-auto px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-2xl border-2 border-slate-200 shadow-2xs transition-all flex items-center justify-center gap-2"
            >
              <span>🎯 หรือฝึกสุ่มทั้งหมวดหมู่ [{collection.category}]</span>
            </Link>
          </div>
        </div>

        {/* Word List Preview Section */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                📚 รายการคำศัพท์ทั้งหมดในชุดฝึก ({words.length} คำ)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                สามารถดูคำแปล ตัวอย่างการใช้จริง และระดับ CEFR ได้ก่อนเข้าสู่กระดานเขียน Apple Pencil
              </p>
            </div>

            <div className="w-full sm:w-72 relative">
              <input
                type="text"
                placeholder="🔍 ค้นหาคำศัพท์ หรือ ความหมาย..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Grid/Table of Vocabulary items */}
          {filteredWords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm font-medium">
              ไม่พบคำศัพท์ที่ตรงกับ "{searchQuery}" ใน Collection นี้
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredWords.map((w, index) => {
                const isCompleted = completedIds.includes(w.id);
                const wordCefr = getCefrBadgeProps(w.cefrLevel || w.difficultyLevel);

                return (
                  <div
                    key={w.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      isCompleted
                        ? "bg-emerald-50/40 border-emerald-200/80 shadow-2xs"
                        : "bg-slate-50/70 hover:bg-white border-slate-200/80 hover:shadow-md hover:border-indigo-200"
                    }`}
                  >
                    <div className="flex items-start md:items-center gap-3.5 flex-1">
                      <div className="flex flex-col items-center justify-center min-w-8 font-mono font-bold text-xs text-slate-400">
                        #{index + 1}
                      </div>

                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                            {w.word}
                          </span>
                          {w.phonetic && (
                            <span className="text-xs font-mono font-medium text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md">
                              /{w.phonetic}/
                            </span>
                          )}
                          <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700">
                            {w.partOfSpeech}
                          </span>
                          <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${wordCefr.colorClass}`}>
                            {wordCefr.badgeText}
                          </span>
                        </div>

                        <p className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
                          {w.meaning}
                        </p>

                        {w.exampleSentence && (
                          <div className="text-xs text-slate-600 bg-white/80 p-2.5 rounded-xl border border-slate-200/60 mt-1 flex flex-col gap-0.5">
                            <span className="italic font-medium text-slate-700">"{w.exampleSentence}"</span>
                            {w.exampleTarget && <span className="text-slate-500 text-[11px]">({w.exampleTarget})</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status & Quick Action */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      {isCompleted ? (
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center gap-1 border border-emerald-300">
                          <span>✅ ผ่านแล้ว</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-500 font-medium text-xs">
                          ⏳ ยังไม่ได้ฝึก
                        </span>
                      )}

                      <Link
                        href={`/practice?collectionId=${collection.id}`}
                        className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all"
                      >
                        ✍️ ฝึกเขียน
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
