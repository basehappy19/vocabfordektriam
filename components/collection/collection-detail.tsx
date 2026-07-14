"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getCefrBadgeProps } from "@/lib/cefr";
import { getCompletedWordIds } from "@/lib/progress";
import { ArrowLeft, CheckCircle2, Search, X, BookOpen, PenTool, History, Play, RotateCcw } from "lucide-react";
import { AuthNavButtons } from "@/components/auth/auth-buttons";

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
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    if (isGuest) {
      const guestIds = getCompletedWordIds(collection.id);
      setCompletedIds(guestIds);
    } else {
      setCompletedIds(initialDbProgressIds);
    }
  }, [isGuest, collection.id, initialDbProgressIds]);

  const handlePlayAgain = async () => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("vocab_progress_guest");
        if (raw) {
          const map = JSON.parse(raw);
          if (map[collection.id]) {
            map[collection.id].completedWordIds = [];
            localStorage.setItem("vocab_progress_guest", JSON.stringify(map));
          }
          if (map[collection.category]) {
            map[collection.category].completedWordIds = [];
            localStorage.setItem("vocab_progress_guest", JSON.stringify(map));
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (!isGuest) {
      try {
        await fetch("/api/vocab/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collectionId: collection.id }),
        });
      } catch (e) {
        console.error(e);
      }
    }

    setCompletedIds([]);
    if (typeof window !== "undefined") {
      window.location.href = `/practice?collectionId=${collection.id}`;
    }
  };

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

  const cleanTitle = collection.title.replace(/\s*\([^)]*\)/g, "").trim();
  const cleanDesc = collection.description.replace(/\s*\([^)]*\)/g, "").trim();

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
                <span>{userName}</span>
              </span>
            ) : null}
            <AuthNavButtons user={!isGuest ? { name: userName } : null} />
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-5xl mx-auto px-4 pt-6 sm:pt-8 flex flex-col gap-6">
        {/* Hero Card */}
        <div className="p-7 sm:p-9 rounded-3xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col gap-7">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <BookOpen className="w-7 h-7 text-indigo-600" />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1 bg-slate-900 text-white rounded-full text-xs font-bold tracking-wide shadow-2xs">
                  {collection.category}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${cefrInfo.colorClass}`}>
                  {cefrInfo.cefr}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {cleanTitle}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl pt-0.5">
                {cleanDesc}
              </p>
            </div>
          </div>

          {/* Progress Tracking Box Card */}
          <div className="bg-slate-50/90 p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-slate-800">
              <span>ความคืบหน้าของชุดคำศัพท์นี้:</span>
              <span className="text-indigo-600 font-bold">
                {completedCount} / {totalWords} คำ
              </span>
              <span className="text-xs font-semibold text-slate-500">({progressPercent}%)</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden p-0 border border-slate-200">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Practice Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {completedCount === 0 ? (
              <Link
                href={`/practice?collectionId=${collection.id}`}
                className="cursor-pointer w-full sm:w-auto px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2.5"
              >
                <PenTool className="w-4 h-4" />
                <span>เริ่มฝึกเขียนคำศัพท์ชุดนี้</span>
              </Link>
            ) : completedCount < totalWords ? (
              <>
                <Link
                  href={`/practice?collectionId=${collection.id}`}
                  className="cursor-pointer w-full sm:w-auto px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2.5"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>เล่นต่อ ({completedCount}/{totalWords} คำ)</span>
                </Link>
                <button
                  type="button"
                  onClick={handlePlayAgain}
                  className="cursor-pointer w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 font-bold text-sm rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4 text-slate-600" />
                  <span>เล่นใหม่อีกครั้ง</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="cursor-pointer w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 font-bold text-sm rounded-xl border border-slate-200/80 transition-all flex items-center justify-center gap-2"
                >
                  <History className="w-4 h-4 text-slate-600" />
                  <span>ดูประวัติที่เคยเล่น</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="cursor-pointer w-full sm:w-auto px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2.5"
                >
                  <History className="w-4 h-4" />
                  <span>ดูประวัติที่เคยเล่น (ครบ 100%)</span>
                </button>
                <button
                  type="button"
                  onClick={handlePlayAgain}
                  className="cursor-pointer w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 font-bold text-sm rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4 text-slate-600" />
                  <span>เล่นใหม่อีกครั้ง</span>
                </button>
              </>
            )}
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

      {/* History Summary Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <History className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">ประวัติการฝึกฝน ({cleanTitle})</h3>
                  <p className="text-xs text-slate-500">
                    ผ่านแล้ว {completedCount} จาก {totalWords} คำ ({progressPercent}%)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="cursor-pointer p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Completed Words List */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-3">
              {completedCount === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm font-medium">
                  ยังไม่มีประวัติการฝึกฝนผ่านในชุดคำศัพท์นี้
                </div>
              ) : (
                words
                  .filter((w) => completedIds.includes(w.id))
                  .map((w, idx) => {
                    return (
                      <div
                        key={w.id}
                        className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-semibold text-emerald-700 w-6">#{idx + 1}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-base">{w.word}</span>
                              {w.phonetic && (
                                <span className="text-xs font-mono text-slate-500">/{w.phonetic}/</span>
                              )}
                            </div>
                            <p className="text-xs font-medium text-slate-700 mt-0.5">{w.meaning}</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-medium text-xs border border-emerald-200 flex items-center gap-1 self-end sm:self-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>ฝึกเขียนผ่านแล้ว</span>
                        </span>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-end gap-3">
              {completedCount < totalWords && (
                <Link
                  href={`/practice?collectionId=${collection.id}`}
                  onClick={() => setShowHistoryModal(false)}
                  className="cursor-pointer px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>เล่นต่อ ({completedCount}/{totalWords})</span>
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowHistoryModal(false);
                  handlePlayAgain();
                }}
                className="cursor-pointer px-5 py-2.5 bg-slate-200/80 hover:bg-slate-300/80 active:scale-[0.98] text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                <span>เล่นใหม่อีกครั้ง</span>
              </button>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="cursor-pointer px-5 py-2.5 bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-all"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

