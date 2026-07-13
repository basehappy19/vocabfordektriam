"use client";

import React, { useState, useEffect, useCallback } from "react";
import CanvasLoader from "@/components/canvas/canvas-loader";
import TTSButton from "@/components/tts/tts-button";

interface VocabData {
  id: string;
  word: string;
  meaning: string;
  partOfSpeech: string;
  category: string;
  difficultyLevel: number;
  phonetic?: string;
  exampleSentence?: string | null;
  exampleTarget?: string | null;
  meta?: {
    wasAiGenerated?: boolean;
    servedFromDbDirectly?: boolean;
    userProgress?: {
      boxLevel: number;
      nextReview?: string;
      reviewCount: number;
      streak: number;
      isDueReview?: boolean;
      isNewWord?: boolean;
    };
  };
}

export default function PracticeSession() {
  const [vocab, setVocab] = useState<VocabData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"GUEST" | "AUTHENTICATED">("GUEST");
  const [showMeaning, setShowMeaning] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const fetchNextVocab = useCallback(async () => {
    setLoading(true);
    setError(null);
    setShowMeaning(false);

    try {
      const url = selectedCategory
        ? `/api/vocab/next?category=${encodeURIComponent(selectedCategory)}`
        : `/api/vocab/next`;

      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาดในการโหลดคำศัพท์");
      }

      const json = await res.json();
      setVocab(json.data);
      setMode(json.mode);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchNextVocab();
  }, [fetchNextVocab]);

  const handleSrsReview = async (rating: "again" | "hard" | "good" | "easy") => {
    if (!vocab) return;

    if (mode === "GUEST") {
      // Guests don't save progress; just fetch next random word
      fetchNextVocab();
      return;
    }

    setIsReviewing(true);
    try {
      const res = await fetch("/api/vocab/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vocabId: vocab.id,
          rating,
          durationSeconds: 30,
        }),
      });

      if (!res.ok) {
        console.error("Failed to update SRS progress");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReviewing(false);
      fetchNextVocab();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 p-4 sm:p-6">
      {/* Top Banner Status (Guest vs Authenticated) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                mode === "AUTHENTICATED" ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                mode === "AUTHENTICATED" ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
          </span>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              โหมดการใช้งาน (Mode)
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {mode === "AUTHENTICATED"
                ? "📚 ระบบ Spaced Repetition (บันทึกความคืบหน้า Leitner Box)"
                : "👋 ผู้ใช้งานทั่วไป Guest (สุ่มฝึกศัพท์ - ไม่บันทึกความจำ)"}
            </span>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="category-select" className="text-xs font-semibold text-slate-500">
            หมวดหมู่:
          </label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="เลือกหมวดหมู่คำศัพท์เตรียมสอบ"
            className="text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">ทั้งหมด (All TCAS/TGAT)</option>
            <option value="TGAT-Eng">TGAT English Core</option>
            <option value="A-Level">A-Level Vocabulary</option>
            <option value="TCAS-Academic">TCAS Academic Idioms</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div
          role="status"
          aria-label="กำลังโหลดคำศัพท์ถัดไป (Loading next vocabulary item)"
          className="w-full flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg gap-4 animate-pulse"
        >
          <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-6 w-32 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        </div>
      ) : error ? (
        <div
          role="alert"
          className="p-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-center flex flex-col items-center gap-3"
        >
          <span className="text-2xl">⚠️</span>
          <p className="font-semibold">{error}</p>
          <button
            type="button"
            onClick={fetchNextVocab}
            aria-label="ลองโหลดคำศัพท์ใหม่อีกครั้ง"
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition-colors"
          >
            ลองใหม่อีกครั้ง (Retry)
          </button>
        </div>
      ) : vocab ? (
        <div className="flex flex-col gap-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl">
          {/* Header Info & Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider border border-indigo-200 dark:border-indigo-800">
                {vocab.category}
              </span>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold">
                {vocab.partOfSpeech}
              </span>
              <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold">
                Level {vocab.difficultyLevel} ⭐
              </span>
            </div>

            {vocab.meta?.userProgress && (
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-lg font-bold">
                  📦 Leitner Box {vocab.meta.userProgress.boxLevel}/5
                </span>
                <span>🔥 Streak: {vocab.meta.userProgress.streak}</span>
              </div>
            )}
          </div>

          {/* Main Target Word & Pronunciation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-3">
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                  {vocab.word}
                </h1>
                {vocab.phonetic && (
                  <span className="text-lg sm:text-xl font-mono text-slate-400">
                    /{vocab.phonetic}/
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">
                ใช้ Apple Pencil เขียนคัดคำศัพท์ลงบนกระดานด้านล่างเพื่อกระตุ้นความจำกล้ามเนื้อมือ (Muscle Memory)
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <TTSButton text={vocab.word} lang="en-US" size="lg" label="ฟังเสียง (Listen)" />
            </div>
          </div>

          {/* Dynamic Lazy-Loaded iPad Apple Pencil Canvas */}
          <CanvasLoader wordToPractice={vocab.word} />

          {/* Meaning & AI Example Sentence Accordion */}
          <div className="flex flex-col gap-4 mt-2">
            {!showMeaning ? (
              <button
                type="button"
                onClick={() => setShowMeaning(true)}
                aria-label="ตรวจคำแปลและประโยคตัวอย่างภาษาอังกฤษ"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-base flex items-center justify-center gap-2"
              >
                <span>🔍 ตรวจคำแปลและดูประโยคตัวอย่าง (Show Meaning & AI Example)</span>
              </button>
            ) : (
              <div className="flex flex-col gap-4 p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 animate-fadeIn">
                <div className="flex flex-col gap-1 border-b border-slate-200 dark:border-slate-700 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    คำแปลและความหมาย (Meaning)
                  </span>
                  <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {vocab.meaning}
                  </p>
                </div>

                {/* AI Example Sentence Block */}
                {vocab.exampleSentence && (
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <span>💡 ประโยคตัวอย่างเตรียมสอบ (Example Sentence)</span>
                        {vocab.meta?.wasAiGenerated ? (
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-bold">
                            🤖 AI Generated Now (Lazy-Cached to DB)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded text-[10px] font-bold">
                            ⚡ Served Direct from DB (No AI Cost)
                          </span>
                        )}
                      </span>
                      <TTSButton
                        text={vocab.exampleSentence}
                        lang="en-US"
                        size="sm"
                        label="ฟังประโยค"
                      />
                    </div>
                    <blockquote className="p-4 bg-white dark:bg-slate-900 rounded-xl border-l-4 border-indigo-500 shadow-sm flex flex-col gap-1.5">
                      <p className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-200 italic">
                        &ldquo;{vocab.exampleSentence}&rdquo;
                      </p>
                      {vocab.exampleTarget && (
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                          🇹🇭 คำแปล: {vocab.exampleTarget}
                        </p>
                      )}
                    </blockquote>
                  </div>
                )}

                {/* Spaced Repetition Grading Buttons / Next Action */}
                <div className="flex flex-col gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-center text-slate-500 mb-1">
                    {mode === "AUTHENTICATED"
                      ? "ให้คะแนนความจำของคุณเพื่อปรับรอบทบทวนถัดไป (Spaced Repetition Leitner Box Algorithm):"
                      : "กดเพื่อสุ่มคำศัพท์ถัดไป (Guest Mode):"}
                  </span>

                  {mode === "AUTHENTICATED" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <button
                        type="button"
                        disabled={isReviewing}
                        onClick={() => handleSrsReview("again")}
                        aria-label="จำไม่ได้เลย กลับไปเริ่มทบทวนใหม่ในกล่อง 1 (Again / Box 1)"
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-200 font-bold transition-all border border-rose-300 dark:border-rose-800"
                      >
                        <span className="text-sm">❌ จำไม่ได้ (Again)</span>
                        <span className="text-[11px] opacity-75 font-normal">ทบทวนพรุ่งนี้ (Box 1)</span>
                      </button>

                      <button
                        type="button"
                        disabled={isReviewing}
                        onClick={() => handleSrsReview("hard")}
                        aria-label="จำยาก ต้องใช้ความคิด (Hard / Same Box)"
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold transition-all border border-amber-300 dark:border-amber-800"
                      >
                        <span className="text-sm">⚠️ จำยาก (Hard)</span>
                        <span className="text-[11px] opacity-75 font-normal">ทบทวนรอบเดิม</span>
                      </button>

                      <button
                        type="button"
                        disabled={isReviewing}
                        onClick={() => handleSrsReview("good")}
                        aria-label="จำได้ดี เลื่อนระดับกล่องขึ้น 1 ชั้น (Good / Box +1)"
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold transition-all border border-blue-300 dark:border-blue-800"
                      >
                        <span className="text-sm">✅ จำได้ดี (Good)</span>
                        <span className="text-[11px] opacity-75 font-normal">เลื่อนระดับ +1 กล่อง</span>
                      </button>

                      <button
                        type="button"
                        disabled={isReviewing}
                        onClick={() => handleSrsReview("easy")}
                        aria-label="ง่ายมาก แม่นยำ เลื่อนระดับกล่องขึ้น 2 ชั้นหรือมาสเตอร์ (Easy / Box +2)"
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold transition-all border border-emerald-300 dark:border-emerald-800"
                      >
                        <span className="text-sm">🌟 ง่ายมาก (Easy)</span>
                        <span className="text-[11px] opacity-75 font-normal">เลื่อนเร็ว +2 กล่อง</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fetchNextVocab()}
                      aria-label="ฝึกคำศัพท์ถัดไป"
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition-colors text-center"
                    >
                      ➡️ สุ่มฝึกคำศัพท์ถัดไป (Next Random Word)
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
