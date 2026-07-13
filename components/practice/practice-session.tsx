"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import CanvasLoader from "@/components/canvas/canvas-loader";
import TTSButton from "@/components/tts/tts-button";
import { getCefrBadgeProps } from "@/lib/cefr";
import { recordGuestWordCompletion } from "@/lib/progress";

interface VocabData {
  id: string;
  word: string;
  meaning: string;
  synonyms?: string[];
  partOfSpeech: string;
  category: string;
  difficultyLevel: number;
  collectionId?: string | null;
  cefrLevel?: string;
  phonetic?: string;
  exampleSentence?: string | null;
  exampleTarget?: string | null;
  meta?: {
    wasAiGenerated?: boolean;
    servedFromDbDirectly?: boolean;
    userProgress?: {
      boxLevel?: number;
      nextReview?: string | Date;
      reviewCount?: number;
      streak?: number;
      isDueReview?: boolean;
      isNewWord?: boolean;
      isEarlyPractice?: boolean;
    };
  };
}

export interface PracticeSessionProps {
  initialCategory?: string;
}

// Common synonym mapping dictionary for TCAS / TGAT / A-Level words to support alternative correct answers ("บางทีคนตอบความหมายอีกแบบ ก็ให้ถูกบางคำมีหลายความหมาย")
const SYNONYM_DICTIONARY: Record<string, string[]> = {
  mitigate: ["alleviate", "relieve", "lessen", "reduce", "soothe", "ease", "diminish", "assuage"],
  alleviate: ["mitigate", "relieve", "lessen", "reduce", "soothe", "ease", "diminish", "assuage"],
  meticulous: ["thorough", "careful", "scrupulous", "precise", "fastidious", "diligent", "accurate"],
  procrastinate: ["delay", "postpone", "defer", "put off", "stall"],
  ubiquitous: ["omnipresent", "pervasive", "universal", "common", "everywhere", "widespread"],
  resilient: ["tough", "strong", "hardy", "flexible", "durable", "buoyant"],
  ambiguous: ["unclear", "vague", "equivocal", "obscure", "uncertain", "cryptic"],
  inevitable: ["unavoidable", "certain", "ineluctable", "destined", "sure"],
};

/**
 * Smart flexible verification:
 * - In TH_TO_EN: exact English word OR valid synonyms in dictionary OR slash variants.
 * - In EN_TO_TH: exact meaning OR matching any individual Thai meaning token inside comma/slash separated definition.
 */
function checkIsCorrectAnswer(typed: string, vocab: VocabData, direction: "TH_TO_EN" | "EN_TO_TH"): boolean {
  const cleanTyped = typed.trim().toLowerCase();
  if (!cleanTyped || cleanTyped.length < 2) return false;

  if (direction === "TH_TO_EN") {
    const mainWord = vocab.word.trim().toLowerCase();
    // 1. Exact match
    if (cleanTyped === mainWord) return true;

    // 2. Check DB synonyms array AND dictionary
    const dbSynonyms = (vocab.synonyms || []).map((s) => s.trim().toLowerCase());
    const dictSynonyms = SYNONYM_DICTIONARY[mainWord] || [];
    if (dbSynonyms.includes(cleanTyped) || dictSynonyms.includes(cleanTyped)) return true;

    // 3. Check if typed is inside slash/comma variants if vocab.word has multiple spellings
    const wordParts = mainWord.split(/[,/]/).map((w) => w.trim());
    if (wordParts.includes(cleanTyped)) return true;

    return false;
  } else {
    // EN_TO_TH direction: student types Thai meaning (e.g. "พิถีพิถัน" when meaning is "พิถีพิถัน, รอบคอบ, ละเอียดลอออย่างยิ่ง")
    const cleanMeaning = vocab.meaning.trim();
    if (cleanMeaning === typed.trim()) return true;

    // Split multi-meaning Thai definition by comma, slash, or parentheses
    const meaningTokens = cleanMeaning
      .split(/[,/()]/)
      .map((m) => m.trim())
      .filter((m) => m.length >= 2);

    for (const token of meaningTokens) {
      if (typed.trim() === token || token.includes(typed.trim()) || typed.trim().includes(token)) {
        if (typed.trim().length >= 3) return true; // prevent accidental 1-2 character false matches
      }
    }

    return false;
  }
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
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("collectionId") || "" : ""
  );
  const [typedInput, setTypedInput] = useState("");

  const fetchNextVocab = useCallback(async () => {
    setLoading(true);
    setError(null);
    setShowAnswer(false);
    setTypedInput("");

    try {
      let url = `/api/vocab/next`;
      if (selectedCollectionId) {
        url += `?collectionId=${encodeURIComponent(selectedCollectionId)}`;
      } else if (selectedCategory) {
        url += `?category=${encodeURIComponent(selectedCategory)}`;
      }

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
  }, [selectedCategory, selectedCollectionId]);

  useEffect(() => {
    fetchNextVocab();
  }, [fetchNextVocab]);

  const handleSrsReview = async (rating: "again" | "hard" | "good" | "easy") => {
    if (!vocab) return;
    recordGuestWordCompletion(vocab.id, vocab.collectionId, vocab.category);

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
    <div className="absolute inset-0 w-full h-full overflow-hidden text-slate-900 font-sans">
      {/* Loading State */}
      {loading ? (
        <div
          role="status"
          aria-label="กำลังโหลดคำศัพท์ถัดไป (Loading next vocabulary item)"
          className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-12 bg-white gap-4 animate-pulse"
        >
          <div className="h-10 w-64 bg-slate-200 rounded-2xl" />
          <div className="h-6 w-48 bg-slate-100 rounded-xl" />
          <span className="text-sm font-bold text-slate-400 mt-2">กำลังเตรียมกระดานคัดคำศัพท์เต็มหน้าจอ...</span>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="absolute inset-0 w-full h-full flex items-center justify-center p-6 bg-slate-50"
        >
          <div className="p-8 bg-white border border-rose-200 rounded-3xl text-rose-800 text-center flex flex-col items-center gap-4 shadow-xl max-w-md">
            <span className="text-4xl">⚠️</span>
            <p className="font-bold text-lg">{error}</p>
            <button
              type="button"
              onClick={fetchNextVocab}
              aria-label="ลองโหลดคำศัพท์ใหม่อีกครั้ง"
              className="px-6 py-3 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 shadow-md transition-colors"
            >
              ลองใหม่อีกครั้ง (Retry)
            </button>
          </div>
        </div>
      ) : vocab ? (
        <>
          {/* Layer 0: 100% Full Viewport Edge-to-Edge Grid Drawing Pad ("ให้กระดานเขียนเต็มจอเลย") */}
          <div className="absolute inset-0 w-full h-full z-0">
            <CanvasLoader
              wordToPractice={vocab.word}
              showGuidelineWord={practiceDirection === "EN_TO_TH" || showAnswer}
            />
          </div>

          {/* Layer 1: Top Floating Overlay Cards ("ที่เหลือลอยทับไปเลย") */}
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 z-10 pointer-events-none flex items-start justify-between gap-3">
            {/* Left side: Back Button + Floating Prompt Banner */}
            <div className="flex flex-wrap items-center gap-2.5 max-w-2xl">
              <Link
                href="/"
                aria-label="กลับไปเลือก Collection คำศัพท์"
                className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-md hover:bg-white text-xs font-bold text-slate-700 transition-all"
              >
                <span>⬅️</span>
                <span className="hidden sm:inline">เปลี่ยน Collection</span>
              </Link>

              {/* Floating Prompt & Exact Typing Box Card */}
              <div className="pointer-events-auto flex flex-wrap items-center gap-2.5 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200/80 shadow-md">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[11px] font-bold uppercase tracking-wider border border-indigo-200/80">
                    {vocab.category}
                  </span>
                  {(() => {
                    const cefr = getCefrBadgeProps(vocab.cefrLevel || vocab.difficultyLevel);
                    return (
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${cefr.colorClass}`}>
                        {cefr.badgeText}
                      </span>
                    );
                  })()}
                </div>

                {practiceDirection === "TH_TO_EN" ? (
                  <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 leading-tight">
                    {vocab.meaning}
                  </h2>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                      {vocab.word}
                    </h2>
                    {vocab.phonetic && (
                      <span className="text-sm font-mono text-slate-500">/{vocab.phonetic}/</span>
                    )}
                  </div>
                )}

                {/* Compact inline typing box for PC/mobile flexible auto-reveal */}
                {!showAnswer && (
                  <div className="flex items-center gap-1.5 bg-slate-100/90 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500 px-3 py-1 rounded-xl border border-slate-200 transition-all w-60 sm:w-72">
                    <span className="text-xs">⌨️</span>
                    <input
                      type="text"
                      placeholder={
                        practiceDirection === "TH_TO_EN"
                          ? "พิมพ์อังกฤษ (หรือคำที่มีความหมายเดียวกัน)..."
                          : "พิมพ์ความหมายภาษาไทย..."
                      }
                      value={typedInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTypedInput(val);
                        if (vocab && checkIsCorrectAnswer(val, vocab, practiceDirection)) {
                          recordGuestWordCompletion(vocab.id, vocab.collectionId, vocab.category);
                          setShowAnswer(true);
                        }
                      }}
                      aria-label="พิมพ์คำศัพท์หรือคำแปลเพื่อตรวจคำตอบและเฉลยอัตโนมัติ"
                      className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Note: Top Right is already occupied by DrawingPad's floating GoodNotes toolbar (Colors, Undo, Clear) at z-20 */}
          </div>

          {/* Layer 2: Bottom Floating Reveal Button & Spaced Repetition Modal Card */}
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none w-full max-w-xl px-4 flex flex-col items-center justify-center">
            {!showAnswer ? (
              <button
                type="button"
                onClick={() => setShowAnswer(true)}
                aria-label="เฉลยคำศัพท์ ตรวจคำแปล และดูประโยคตัวอย่างจาก AI"
                className="pointer-events-auto w-full sm:w-auto px-6 py-3.5 bg-indigo-600/95 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold rounded-2xl shadow-xl backdrop-blur-md transition-all text-base flex items-center justify-center gap-2 border border-indigo-400/30"
              >
                <span>
                  {practiceDirection === "TH_TO_EN"
                    ? "👁️ ดูเฉลยคำศัพท์ภาษาอังกฤษ & ประโยคตัวอย่าง AI"
                    : "👁️ ดูเฉลยความหมายไทย & ประโยคตัวอย่าง AI"}
                </span>
              </button>
            ) : (
              <div className="pointer-events-auto w-full bg-white/95 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xl animate-fadeIn flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
                {/* Revealed Answer Box */}
                {practiceDirection === "TH_TO_EN" ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
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
                  <div className="flex flex-col gap-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      ✨ เฉลยคำแปลและความหมาย
                    </span>
                    <p className="text-lg sm:text-xl font-bold text-slate-900">
                      {vocab.meaning}
                    </p>
                  </div>
                )}

                {/* AI Example Sentence Block */}
                {vocab.exampleSentence && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-end">
                      <TTSButton
                        text={vocab.exampleSentence}
                        lang="en-US"
                        size="sm"
                        label="ฟังประโยค"
                      />
                    </div>
                    <blockquote className="p-3.5 bg-slate-50 rounded-xl border-l-4 border-indigo-600 flex flex-col gap-1 border border-slate-200/80">
                      <p className="text-sm sm:text-base font-medium text-slate-900 italic leading-relaxed">
                        &ldquo;{vocab.exampleSentence}&rdquo;
                      </p>
                      {vocab.exampleTarget && (
                        <p className="text-xs font-semibold text-slate-700 pt-1 border-t border-slate-200/60">
                          🇹🇭 คำแปล: {vocab.exampleTarget}
                        </p>
                      )}
                    </blockquote>
                  </div>
                )}

                {/* Spaced Repetition Leitner Box Grading Buttons / Next Button */}
                <div className="flex flex-col gap-3 pt-2 border-t border-slate-200">
                  {mode === "AUTHENTICATED" ? (
                    <>
                      <span className="text-xs font-bold text-center text-slate-600">
                        ให้คะแนนความจำของคุณเพื่อปรับรอบทบทวนถัดไป (Spaced Repetition):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          type="button"
                          disabled={isReviewing}
                          onClick={() => handleSrsReview("again")}
                          aria-label="จำไม่ได้เลย กลับไปเริ่มทบทวนใหม่ในกล่อง 1 (Again / Box 1)"
                          className="flex flex-col items-center justify-center p-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold transition-all border border-rose-300 shadow-2xs"
                        >
                          <span className="text-xs sm:text-sm">❌ จำไม่ได้</span>
                          <span className="text-[10px] opacity-80 font-normal">ทบทวนพรุ่งนี้ (Box 1)</span>
                        </button>

                        <button
                          type="button"
                          disabled={isReviewing}
                          onClick={() => handleSrsReview("hard")}
                          aria-label="จำยาก ต้องใช้ความคิด (Hard / Same Box)"
                          className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold transition-all border border-amber-300 shadow-2xs"
                        >
                          <span className="text-xs sm:text-sm">⚠️ จำยาก</span>
                          <span className="text-[10px] opacity-80 font-normal">ทบทวนรอบเดิม</span>
                        </button>

                        <button
                          type="button"
                          disabled={isReviewing}
                          onClick={() => handleSrsReview("good")}
                          aria-label="จำได้ดี เลื่อนระดับกล่องขึ้น 1 ชั้น (Good / Box +1)"
                          className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold transition-all border border-blue-300 shadow-2xs"
                        >
                          <span className="text-xs sm:text-sm">✅ จำได้ดี</span>
                          <span className="text-[10px] opacity-80 font-normal">เลื่อนระดับ +1</span>
                        </button>

                        <button
                          type="button"
                          disabled={isReviewing}
                          onClick={() => handleSrsReview("easy")}
                          aria-label="ง่ายมาก แม่นยำ เลื่อนระดับกล่องขึ้น 2 ชั้นหรือมาสเตอร์ (Easy / Box +2)"
                          className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold transition-all border border-emerald-300 shadow-2xs"
                        >
                          <span className="text-xs sm:text-sm">🌟 ง่ายมาก</span>
                          <span className="text-[10px] opacity-80 font-normal">เลื่อนเร็ว +2</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fetchNextVocab()}
                      aria-label="ฝึกคำศัพท์ถัดไป"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold rounded-xl shadow-sm transition-colors text-center text-base"
                    >
                      คำศัพท์ถัดไป ➡️
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
