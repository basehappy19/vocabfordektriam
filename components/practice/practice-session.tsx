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

interface PracticeSessionProps {
  initialCategory?: string;
}

export default function PracticeSession({ initialCategory = "" }: PracticeSessionProps) {
  const [vocab, setVocab] = useState<VocabData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"GUEST" | "AUTHENTICATED">("GUEST");

  const [practiceDirection, setPracticeDirection] = useState<"TH_TO_EN" | "EN_TO_TH">("TH_TO_EN");
  const [showAnswer, setShowAnswer] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategory === "all" ? "" : initialCategory
  );
  const [typedInput, setTypedInput] = useState("");

  const fetchNextVocab = useCallback(async () => {
    setLoading(true);
    setError(null);
    setShowAnswer(false);
    setTypedInput("");

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
    <div className="w-full flex flex-col flex-1 gap-4 text-slate-900 font-sans">
      {/* Sleek Minimal Controls Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 backdrop-blur-sm p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
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

        <div className="flex items-center gap-2">
          <label htmlFor="category-select" className="text-xs font-semibold text-slate-500">
            หมวด:
          </label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="เลือกหมวดหมู่คำศัพท์เตรียมสอบ"
            className="text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
          >
            <option value="">ทั้งหมด (All TCAS/TGAT)</option>
            <option value="TGAT-Eng">TGAT English Core</option>
            <option value="A-Level">A-Level Vocabulary</option>
            <option value="TCAS-Academic">TCAS Academic Idioms</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div
          role="status"
          aria-label="กำลังโหลดคำศัพท์ถัดไป (Loading next vocabulary item)"
          className="w-full flex-1 flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 shadow-xs gap-4 animate-pulse"
        >
          <div className="h-8 w-64 bg-slate-200 rounded-xl" />
          <div className="h-5 w-40 bg-slate-100 rounded-lg" />
          <div className="min-h-[480px] sm:min-h-[580px] md:min-h-[660px] w-full bg-slate-100 rounded-3xl mt-4" />
        </div>
      ) : error ? (
        <div
          role="alert"
          className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-rose-800 text-center flex flex-col items-center gap-4 shadow-xs"
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
        <div className="w-full flex-1 flex flex-col gap-4 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          {/* Top Badges & Word Info */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 p-5 rounded-2xl">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  📌 โจทย์ความหมายภาษาไทย
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-snug">
                  {vocab.meaning}
                </h2>
              </div>
              {!showAnswer ? (
                <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 whitespace-nowrap self-start sm:self-center">
                  ✍️ เขียนหรือพิมพ์คำอังกฤษ
                </span>
              ) : (
                <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl self-start sm:self-center">
                  <span className="text-xs font-bold text-indigo-700">เฉลยเปิดแล้ว</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200/80 p-5 rounded-2xl">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  📌 โจทย์คำศัพท์ภาษาอังกฤษ (ทายความหมายภาษาไทย)
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900">
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

          {/* Keyboard Typing Input Box for Non-iPad / Exact Spelling Auto-Reveal */}
          {!showAnswer && practiceDirection === "TH_TO_EN" && (
            <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-2xl">
              <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs whitespace-nowrap px-1">
                <span>⌨️ สำหรับ PC / มือถือ (พิมพ์ถูกเป๊ะเฉลยทันที):</span>
              </div>
              <input
                type="text"
                placeholder="พิมพ์คำศัพท์ภาษาอังกฤษที่นี่โดยไม่ต้องกดปุ่มเฉลย..."
                value={typedInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setTypedInput(val);
                  if (val.trim().toLowerCase() === vocab.word.toLowerCase()) {
                    setShowAnswer(true);
                  }
                }}
                aria-label="พิมพ์คำศัพท์ภาษาอังกฤษเพื่อตรวจคำตอบอัตโนมัติ"
                className="flex-1 w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none text-base font-bold text-slate-900 bg-white placeholder:text-slate-400 placeholder:font-normal shadow-2xs"
              />
            </div>
          )}

          {/* iPad Apple Pencil Massive Full-Screen Grid Handwriting Pad */}
          <div className="w-full flex-1 flex flex-col">
            <CanvasLoader
              wordToPractice={vocab.word}
              showGuidelineWord={practiceDirection === "EN_TO_TH" || showAnswer}
            />
          </div>

          {/* Reveal Section & AI Example Sentences */}
          <div className="flex flex-col gap-4 pt-2">
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
              <div className="flex flex-col gap-5 p-6 bg-slate-50 rounded-2xl border border-slate-200 animate-fadeIn shadow-2xs">
                {/* Revealed Answer Box without crossed-out text */}
                {practiceDirection === "TH_TO_EN" ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white border border-indigo-200 rounded-2xl shadow-xs">
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
                    <TTSButton text={vocab.word} lang="en-US" size="lg" label="ฟังเสียงคำศัพท์" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 p-5 bg-white border border-indigo-200 rounded-2xl shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      ✨ เฉลยคำแปลและความหมาย
                    </span>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900">
                      {vocab.meaning}
                    </p>
                  </div>
                )}

                {/* AI Example Sentence Block without crossed-out headers */}
                {vocab.exampleSentence && (
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex items-center justify-end">
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

                {/* Spaced Repetition Leitner Box Grading Buttons / Next Button */}
                <div className="flex flex-col gap-3 pt-4 border-t border-slate-200">
                  {mode === "AUTHENTICATED" ? (
                    <>
                      <span className="text-xs font-bold text-center text-slate-600 mb-1">
                        ให้คะแนนความจำของคุณเพื่อปรับรอบทบทวนถัดไป (Spaced Repetition):
                      </span>
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
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fetchNextVocab()}
                      aria-label="ฝึกคำศัพท์ถัดไป"
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold rounded-xl shadow-sm transition-colors text-center text-base"
                    >
                      คำศัพท์ถัดไป ➡️
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
