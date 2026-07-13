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
  
  // Primary practice mode requested by user: Thai meaning -> write English word ("ให้โหมดภาษาไทยให้เขียนอังฤษเป็นหลัก")
  const [practiceDirection, setPracticeDirection] = useState<"TH_TO_EN" | "EN_TO_TH">("TH_TO_EN");
  const [showAnswer, setShowAnswer] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const fetchNextVocab = useCallback(async () => {
    setLoading(true);
    setError(null);
    setShowAnswer(false);

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
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 p-4 sm:p-6 text-slate-900 font-sans">
      {/* Top Controls & Mode Switcher (Clean Light Theme) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        {/* Guest vs Authenticated Status */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                mode === "AUTHENTICATED" ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                mode === "AUTHENTICATED" ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
          </span>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">
              สถานะ: {mode === "AUTHENTICATED" ? "บันทึกความคืบหน้า (Leitner SRS)" : "ผู้ใช้งานทั่วไป Guest (สุ่มศัพท์)"}
            </span>
          </div>
        </div>

        {/* Practice Direction Mode Switcher & Category Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setPracticeDirection("TH_TO_EN");
                setShowAnswer(false);
              }}
              aria-pressed={practiceDirection === "TH_TO_EN"}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                practiceDirection === "TH_TO_EN"
                  ? "bg-white text-indigo-700 shadow-2xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🇹🇭 แปลไทย ➡️ เขียนอังกฤษ (หลัก)
            </button>
            <button
              type="button"
              onClick={() => {
                setPracticeDirection("EN_TO_TH");
                setShowAnswer(false);
              }}
              aria-pressed={practiceDirection === "EN_TO_TH"}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                practiceDirection === "EN_TO_TH"
                  ? "bg-white text-indigo-700 shadow-2xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🇬🇧 ศัพท์อังกฤษ ➡️ แปลไทย
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <label htmlFor="category-select" className="text-xs font-semibold text-slate-600">
              หมวด:
            </label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="เลือกหมวดหมู่คำศัพท์เตรียมสอบ"
              className="text-xs font-medium rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">ทั้งหมด (All TCAS/TGAT)</option>
              <option value="TGAT-Eng">TGAT English Core</option>
              <option value="A-Level">A-Level Vocabulary</option>
              <option value="TCAS-Academic">TCAS Academic Idioms</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div
          role="status"
          aria-label="กำลังโหลดคำศัพท์ถัดไป (Loading next vocabulary item)"
          className="w-full flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-slate-200 shadow-md gap-4 animate-pulse"
        >
          <div className="h-10 w-64 bg-slate-200 rounded-xl" />
          <div className="h-6 w-40 bg-slate-100 rounded-lg" />
          <div className="h-80 w-full bg-slate-100 rounded-2xl mt-4" />
        </div>
      ) : error ? (
        <div
          role="alert"
          className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-rose-800 text-center flex flex-col items-center gap-4"
        >
          <span className="text-3xl">⚠️</span>
          <p className="font-bold text-lg">{error}</p>
          <button
            type="button"
            onClick={fetchNextVocab}
            aria-label="ลองโหลดคำศัพท์ใหม่อีกครั้ง"
            className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 shadow-xs transition-colors"
          >
            ลองใหม่อีกครั้ง (Retry)
          </button>
        </div>
      ) : vocab ? (
        <div className="flex flex-col gap-6 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md">
          {/* Top Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider border border-indigo-200/80">
                {vocab.category}
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                {vocab.partOfSpeech}
              </span>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200/60">
                Level {vocab.difficultyLevel} ⭐
              </span>
            </div>

            {vocab.meta?.userProgress && (
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg font-bold border border-purple-200/60">
                  📦 Leitner Box {vocab.meta.userProgress.boxLevel}/5
                </span>
                <span className="font-semibold text-slate-700">🔥 Streak: {vocab.meta.userProgress.streak}</span>
              </div>
            )}
          </div>

          {/* Primary Prompt Display Card based on Direction */}
          {practiceDirection === "TH_TO_EN" ? (
            /* TH_TO_EN Mode: Show Thai Meaning Prominently at top -> write English */
            <div className="flex flex-col gap-3 py-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
                <span>📌 โจทย์ความหมายภาษาไทย (เขียนคำศัพท์อังกฤษด้านล่าง)</span>
              </div>
              <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-snug">
                  {vocab.meaning}
                </h2>
                {!showAnswer ? (
                  <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 whitespace-nowrap">
                    ✍️ เขียนคำอังกฤษด้วย Apple Pencil
                  </span>
                ) : (
                  <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl">
                    <span className="text-xs font-bold text-indigo-700">เฉลยเปิดแล้ว</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* EN_TO_TH Mode: Show English Word at top -> write Thai meaning */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  📌 โจทย์คำศัพท์ภาษาอังกฤษ (ทาย/เขียนคำแปลไทย)
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
                    {vocab.word}
                  </h1>
                  {vocab.phonetic && (
                    <span className="text-lg sm:text-xl font-mono text-slate-500 font-medium">
                      /{vocab.phonetic}/
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                <TTSButton text={vocab.word} lang="en-US" size="lg" label="ฟังเสียง (Listen)" />
              </div>
            </div>
          )}

          {/* iPad Apple Pencil Handwriting Pad */}
          <CanvasLoader
            wordToPractice={vocab.word}
            showGuidelineWord={practiceDirection === "EN_TO_TH" || showAnswer}
          />

          {/* Reveal Section & AI Example Sentences */}
          <div className="flex flex-col gap-4 mt-2">
            {!showAnswer ? (
              <button
                type="button"
                onClick={() => setShowAnswer(true)}
                aria-label="เฉลยคำศัพท์ ตรวจคำแปล และดูประโยคตัวอย่างจาก AI"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold rounded-2xl shadow-md shadow-indigo-600/20 transition-all text-base flex items-center justify-center gap-2"
              >
                <span>
                  {practiceDirection === "TH_TO_EN"
                    ? "👁️ ดูเฉลยคำศัพท์ภาษาอังกฤษ & ประโยคตัวอย่าง AI (Reveal Answer)"
                    : "👁️ ดูเฉลยความหมายไทย & ประโยคตัวอย่าง AI"}
                </span>
              </button>
            ) : (
              <div className="flex flex-col gap-5 p-6 sm:p-8 bg-slate-50 rounded-2xl border border-slate-200 animate-fadeIn shadow-2xs">
                {/* Revealed Answer Box */}
                {practiceDirection === "TH_TO_EN" ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white border border-indigo-200 rounded-2xl shadow-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                        ✨ เฉลยคำศัพท์ภาษาอังกฤษ (Answer Word)
                      </span>
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl sm:text-4xl font-black text-slate-900">
                          {vocab.word}
                        </span>
                        {vocab.phonetic && (
                          <span className="text-base sm:text-lg font-mono text-slate-500 font-medium">
                            /{vocab.phonetic}/
                          </span>
                        )}
                      </div>
                    </div>
                    <TTSButton text={vocab.word} lang="en-US" size="lg" label="ฟังเสียงคำศัพท์" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 p-5 bg-white border border-indigo-200 rounded-2xl shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      ✨ เฉลยคำแปลและความหมาย (Meaning)
                    </span>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900">
                      {vocab.meaning}
                    </p>
                  </div>
                )}

                {/* AI Example Sentence Block */}
                {vocab.exampleSentence && (
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <span>💡 ประโยคตัวอย่างเตรียมสอบ (Example Sentence)</span>
                        {vocab.meta?.wasAiGenerated ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold border border-emerald-200">
                            🤖 AI Generated Now (Lazy-Cached to DB)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold border border-blue-200">
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
                    <blockquote className="p-4 sm:p-5 bg-white rounded-xl border-l-4 border-indigo-600 shadow-2xs flex flex-col gap-2 border border-slate-200/80">
                      <p className="text-base sm:text-lg font-medium text-slate-900 italic leading-relaxed">
                        &ldquo;{vocab.exampleSentence}&rdquo;
                      </p>
                      {vocab.exampleTarget && (
                        <p className="text-sm font-semibold text-slate-700 pt-1 border-t border-slate-100">
                          🇹🇭 คำแปล: {vocab.exampleTarget}
                        </p>
                      )}
                    </blockquote>
                  </div>
                )}

                {/* Spaced Repetition Leitner Box Grading Buttons */}
                <div className="flex flex-col gap-3 pt-4 border-t border-slate-200">
                  <span className="text-xs font-bold text-center text-slate-600 mb-1">
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
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold transition-all border border-rose-300 shadow-2xs"
                      >
                        <span className="text-sm">❌ จำไม่ได้ (Again)</span>
                        <span className="text-[11px] opacity-80 font-normal">ทบทวนพรุ่งนี้ (Box 1)</span>
                      </button>

                      <button
                        type="button"
                        disabled={isReviewing}
                        onClick={() => handleSrsReview("hard")}
                        aria-label="จำยาก ต้องใช้ความคิด (Hard / Same Box)"
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold transition-all border border-amber-300 shadow-2xs"
                      >
                        <span className="text-sm">⚠️ จำยาก (Hard)</span>
                        <span className="text-[11px] opacity-80 font-normal">ทบทวนรอบเดิม</span>
                      </button>

                      <button
                        type="button"
                        disabled={isReviewing}
                        onClick={() => handleSrsReview("good")}
                        aria-label="จำได้ดี เลื่อนระดับกล่องขึ้น 1 ชั้น (Good / Box +1)"
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold transition-all border border-blue-300 shadow-2xs"
                      >
                        <span className="text-sm">✅ จำได้ดี (Good)</span>
                        <span className="text-[11px] opacity-80 font-normal">เลื่อนระดับ +1 กล่อง</span>
                      </button>

                      <button
                        type="button"
                        disabled={isReviewing}
                        onClick={() => handleSrsReview("easy")}
                        aria-label="ง่ายมาก แม่นยำ เลื่อนระดับกล่องขึ้น 2 ชั้นหรือมาสเตอร์ (Easy / Box +2)"
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold transition-all border border-emerald-300 shadow-2xs"
                      >
                        <span className="text-sm">🌟 ง่ายมาก (Easy)</span>
                        <span className="text-[11px] opacity-80 font-normal">เลื่อนเร็ว +2 กล่อง</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fetchNextVocab()}
                      aria-label="ฝึกคำศัพท์ถัดไป"
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold rounded-xl shadow-sm transition-colors text-center text-base"
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
