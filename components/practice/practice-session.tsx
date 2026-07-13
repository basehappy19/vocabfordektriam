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
    <div className="w-full flex flex-col flex-1 gap-2.5 sm:gap-3 text-slate-900 font-sans">
      {/* Loading State */}
      {loading ? (
        <div
          role="status"
          aria-label="กำลังโหลดคำศัพท์ถัดไป (Loading next vocabulary item)"
          className="w-full flex-1 flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 shadow-xs gap-4 animate-pulse"
        >
          <div className="h-8 w-64 bg-slate-200 rounded-xl" />
          <div className="h-5 w-40 bg-slate-100 rounded-lg" />
          <div className="min-h-[580px] sm:min-h-[680px] md:min-h-[760px] w-full bg-slate-100 rounded-3xl mt-4" />
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
        <div className="w-full flex-1 flex flex-col gap-2.5 sm:gap-3">
          {/* Ultra-compact Prompt Card & Exact Typing Box combined */}
          <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200/90 p-3 sm:p-4 rounded-2xl shadow-2xs">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[11px] font-bold uppercase tracking-wider border border-indigo-200/80">
                  {vocab.category}
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[11px] font-semibold">
                  {vocab.partOfSpeech}
                </span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[11px] font-bold border border-amber-200/60">
                  Level {vocab.difficultyLevel} ⭐
                </span>
              </div>

              {practiceDirection === "TH_TO_EN" ? (
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                  {vocab.meaning}
                </h2>
              ) : (
                <div className="flex items-baseline gap-2">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900">
                    {vocab.word}
                  </h2>
                  {vocab.phonetic && (
                    <span className="text-base font-mono text-slate-500">/{vocab.phonetic}/</span>
                  )}
                </div>
              )}
            </div>

            {/* Compact inline typing box for PC/mobile auto-reveal */}
            {!showAnswer && practiceDirection === "TH_TO_EN" ? (
              <div className="w-full sm:w-80 md:w-96 flex items-center gap-2 bg-slate-50 border border-slate-200/90 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 px-3 py-2 rounded-xl transition-all">
                <span className="text-sm">⌨️</span>
                <input
                  type="text"
                  placeholder="พิมพ์คำศัพท์ที่นี่ (ถูกเป๊ะเฉลยทันที)..."
                  value={typedInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTypedInput(val);
                    if (val.trim().toLowerCase() === vocab.word.toLowerCase()) {
                      setShowAnswer(true);
                    }
                  }}
                  aria-label="พิมพ์คำศัพท์ภาษาอังกฤษเพื่อตรวจคำตอบอัตโนมัติ"
                  className="w-full bg-transparent text-sm sm:text-base font-bold text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
            ) : !showAnswer ? (
              <TTSButton text={vocab.word} lang="en-US" size="sm" label="ฟังเสียง (Listen)" />
            ) : (
              <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl self-start sm:self-center">
                <span className="text-xs font-bold text-indigo-700">✅ เฉลยเปิดแล้ว</span>
              </div>
            )}
          </div>

          {/* iPad Apple Pencil Massive Full-Screen Grid Handwriting Pad with Floating GoodNotes Toolbar ("วาดเต็มจอตั้งแต่... เครื่องมือลอยคล้าย Goodnote") */}
          <div className="w-full flex-1 flex flex-col min-h-[580px] sm:min-h-[680px] md:min-h-[760px]">
            <CanvasLoader
              wordToPractice={vocab.word}
              showGuidelineWord={practiceDirection === "EN_TO_TH" || showAnswer}
            />
          </div>

          {/* Reveal Section & AI Example Sentences */}
          <div className="flex flex-col gap-3 pt-1">
            {!showAnswer ? (
              <button
                type="button"
                onClick={() => setShowAnswer(true)}
                aria-label="เฉลยคำศัพท์ ตรวจคำแปล และดูประโยคตัวอย่างจาก AI"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold rounded-2xl shadow-md shadow-indigo-600/20 transition-all text-base flex items-center justify-center gap-2"
              >
                <span>
                  {practiceDirection === "TH_TO_EN"
                    ? "👁️ ดูเฉลยคำศัพท์ภาษาอังกฤษ & ประโยคตัวอย่าง AI (Reveal Answer)"
                    : "👁️ ดูเฉลยความหมายไทย & ประโยคตัวอย่าง AI"}
                </span>
              </button>
            ) : (
              <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl border border-slate-200 animate-fadeIn shadow-sm">
                {/* Revealed Answer Box without crossed-out text */}
                {practiceDirection === "TH_TO_EN" ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900">
                        {vocab.word}
                      </span>
                      {vocab.phonetic && (
                        <span className="text-base font-mono text-slate-500 font-medium">
                          /{vocab.phonetic}/
                        </span>
                      )}
                    </div>
                    <TTSButton text={vocab.word} lang="en-US" size="md" label="ฟังเสียงคำศัพท์" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      ✨ เฉลยคำแปลและความหมาย
                    </span>
                    <p className="text-lg sm:text-xl font-bold text-slate-900">
                      {vocab.meaning}
                    </p>
                  </div>
                )}

                {/* AI Example Sentence Block without crossed-out headers */}
                {vocab.exampleSentence && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-end">
                      <TTSButton
                        text={vocab.exampleSentence}
                        lang="en-US"
                        size="sm"
                        label="ฟังประโยค"
                      />
                    </div>
                    <blockquote className="p-4 bg-slate-50 rounded-xl border-l-4 border-indigo-600 flex flex-col gap-1.5 border border-slate-200/80">
                      <p className="text-base sm:text-lg font-medium text-slate-900 italic leading-relaxed">
                        &ldquo;{vocab.exampleSentence}&rdquo;
                      </p>
                      {vocab.exampleTarget && (
                        <p className="text-xs sm:text-sm font-semibold text-slate-700 pt-1 border-t border-slate-200/60">
                          🇹🇭 คำแปล: {vocab.exampleTarget}
                        </p>
                      )}
                    </blockquote>
                  </div>
                )}

                {/* Spaced Repetition Leitner Box Grading Buttons / Next Button */}
                <div className="flex flex-col gap-3 pt-3 border-t border-slate-200">
                  {mode === "AUTHENTICATED" ? (
                    <>
                      <span className="text-xs font-bold text-center text-slate-600">
                        ให้คะแนนความจำของคุณเพื่อปรับรอบทบทวนถัดไป (Spaced Repetition):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <button
                          type="button"
                          disabled={isReviewing}
                          onClick={() => handleSrsReview("again")}
                          aria-label="จำไม่ได้เลย กลับไปเริ่มทบทวนใหม่ในกล่อง 1 (Again / Box 1)"
                          className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold transition-all border border-rose-300 shadow-2xs"
                        >
                          <span className="text-sm">❌ จำไม่ได้ (Again)</span>
                          <span className="text-[11px] opacity-80 font-normal">ทบทวนพรุ่งนี้ (Box 1)</span>
                        </button>

                        <button
                          type="button"
                          disabled={isReviewing}
                          onClick={() => handleSrsReview("hard")}
                          aria-label="จำยาก ต้องใช้ความคิด (Hard / Same Box)"
                          className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold transition-all border border-amber-300 shadow-2xs"
                        >
                          <span className="text-sm">⚠️ จำยาก (Hard)</span>
                          <span className="text-[11px] opacity-80 font-normal">ทบทวนรอบเดิม</span>
                        </button>

                        <button
                          type="button"
                          disabled={isReviewing}
                          onClick={() => handleSrsReview("good")}
                          aria-label="จำได้ดี เลื่อนระดับกล่องขึ้น 1 ชั้น (Good / Box +1)"
                          className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold transition-all border border-blue-300 shadow-2xs"
                        >
                          <span className="text-sm">✅ จำได้ดี (Good)</span>
                          <span className="text-[11px] opacity-80 font-normal">เลื่อนระดับ +1 กล่อง</span>
                        </button>

                        <button
                          type="button"
                          disabled={isReviewing}
                          onClick={() => handleSrsReview("easy")}
                          aria-label="ง่ายมาก แม่นยำ เลื่อนระดับกล่องขึ้น 2 ชั้นหรือมาสเตอร์ (Easy / Box +2)"
                          className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold transition-all border border-emerald-300 shadow-2xs"
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
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold rounded-xl shadow-sm transition-colors text-center text-base"
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
