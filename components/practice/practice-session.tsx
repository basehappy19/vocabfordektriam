"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import CanvasLoader from "@/components/canvas/canvas-loader";
import TTSButton from "@/components/tts/tts-button";
import { getCefrBadgeProps, getCefrFromNumber } from "@/lib/cefr";
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

// Common synonym mapping dictionary for TCAS / TGAT / A-Level words to support alternative correct answers
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

function checkIsCorrectAnswer(typed: string, vocab: VocabData, direction: "TH_TO_EN" | "EN_TO_TH"): boolean {
  const cleanTyped = typed.trim().toLowerCase();
  if (!cleanTyped || cleanTyped.length < 2) return false;

  if (direction === "TH_TO_EN") {
    const mainWord = vocab.word.trim().toLowerCase();
    if (cleanTyped === mainWord) return true;

    const dbSynonyms = (vocab.synonyms || []).map((s) => s.trim().toLowerCase());
    const dictSynonyms = SYNONYM_DICTIONARY[mainWord] || [];
    if (dbSynonyms.includes(cleanTyped) || dictSynonyms.includes(cleanTyped)) return true;

    const wordParts = mainWord.split(/[,/]/).map((w) => w.trim());
    if (wordParts.includes(cleanTyped)) return true;

    return false;
  } else {
    const cleanMeaning = vocab.meaning.trim();
    if (cleanMeaning === typed.trim()) return true;

    const meaningTokens = cleanMeaning
      .split(/[,/()]/)
      .map((m) => m.trim())
      .filter((m) => m.length >= 2);

    for (const token of meaningTokens) {
      if (typed.trim() === token || token.includes(typed.trim()) || typed.trim().includes(token)) {
        if (typed.trim().length >= 3) return true;
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

  // iPad / Drawing Device Detection vs PC/Mobile Typing Detection
  const [isDrawingDevice, setIsDrawingDevice] = useState(false);
  const [hasUserDrawn, setHasUserDrawn] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isMacWithTouch = navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1;
      // iPad or tablet >= 768px screen width
      const isIpadOrTablet = (isTouch && window.innerWidth >= 768) || isMacWithTouch;
      setIsDrawingDevice(isIpadOrTablet);
    };
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  const fetchNextVocab = useCallback(async () => {
    setLoading(true);
    setError(null);
    setShowAnswer(false);
    setTypedInput("");
    setHasUserDrawn(false); // Reset drawing requirement

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
    <div className="absolute inset-0 w-full h-full overflow-hidden text-slate-900 font-sans bg-[#f8fafc]">
      {loading ? (
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-12 bg-white gap-4 animate-pulse">
          <div className="h-10 w-64 bg-slate-200 rounded-2xl" />
          <div className="h-6 w-48 bg-slate-100 rounded-xl" />
          <span className="text-sm font-bold text-slate-400 mt-2">กำลังเตรียมคำศัพท์และแบบฝึกหัด...</span>
        </div>
      ) : error ? (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center p-6 bg-slate-50">
          <div className="p-8 bg-white border border-rose-200 rounded-3xl text-rose-800 text-center flex flex-col items-center gap-4 shadow-xl max-w-md">
            <span className="text-4xl">⚠️</span>
            <p className="font-bold text-lg">{error}</p>
            <button
              type="button"
              onClick={fetchNextVocab}
              className="px-6 py-3 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 shadow-md transition-colors"
            >
              ลองใหม่อีกครั้ง (Retry)
            </button>
          </div>
        </div>
      ) : vocab ? (
        <>
          {/* =========================================================================
              MODE 1: iPad / Drawing Tablet Mode (Full Screen Edge-to-Edge Canvas)
              ========================================================================= */}
          {isDrawingDevice ? (
            <>
              {/* Layer 0: 100% Full Viewport Edge-to-Edge Grid Drawing Pad */}
              <div className="absolute inset-0 w-full h-full z-0">
                <CanvasLoader
                  wordToPractice={vocab.word}
                  showGuidelineWord={practiceDirection === "EN_TO_TH" || showAnswer}
                  onDrawStateChange={(drawn) => setHasUserDrawn(drawn)}
                />
              </div>

              {/* Layer 1: Minimal Top Floating Bar */}
              <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10 pointer-events-none flex items-center gap-2.5">
                <Link
                  href="/"
                  className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-md hover:bg-white text-xs font-bold text-slate-700 transition-all"
                >
                  <span>⬅️</span>
                  <span>เปลี่ยน Collection</span>
                </Link>

                <div className="pointer-events-auto flex items-center gap-2.5 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200/80 shadow-md">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[11px] font-bold uppercase">
                    {vocab.category}
                  </span>
                  {practiceDirection === "TH_TO_EN" ? (
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">
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
                </div>
              </div>

              {/* Layer 2: Bottom Floating Button & SRS Modal ("เมื่อมีการเขียนปุ่มเฉลยค่อยกดได้") */}
              <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none w-full max-w-xl px-4 flex flex-col items-center justify-center">
                {!showAnswer ? (
                  <button
                    type="button"
                    disabled={!hasUserDrawn && practiceDirection === "TH_TO_EN"}
                    onClick={() => setShowAnswer(true)}
                    className={`pointer-events-auto w-full sm:w-auto px-7 py-4 rounded-2xl shadow-xl backdrop-blur-md transition-all text-base flex items-center justify-center gap-2 border font-extrabold ${
                      hasUserDrawn || practiceDirection === "EN_TO_TH"
                        ? "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white border-indigo-400/30 animate-pulse cursor-pointer shadow-indigo-600/30"
                        : "bg-slate-700/85 text-slate-300 border-slate-600/50 cursor-not-allowed opacity-80"
                    }`}
                  >
                    <span>
                      {hasUserDrawn || practiceDirection === "EN_TO_TH"
                        ? "💡 ตรวจคำตอบ & ดูเฉลยทันที"
                        : "✍️ กรุณาเขียนคำศัพท์ด้วย Apple Pencil ก่อนกดดูเฉลย"}
                    </span>
                  </button>
                ) : (
                  <div className="pointer-events-auto w-full bg-white/95 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 shadow-2xl flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
                    {/* Revealed Answer Box */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-black text-slate-900">{vocab.word}</span>
                        {vocab.phonetic && (
                          <span className="text-base font-mono text-slate-500">/{vocab.phonetic}/</span>
                        )}
                      </div>
                      <TTSButton text={vocab.word} lang="en-US" size="md" label="ฟังเสียงคำศัพท์" />
                    </div>

                    {vocab.exampleSentence && (
                      <blockquote className="p-3.5 bg-slate-50 rounded-xl border-l-4 border-indigo-600 flex flex-col gap-1">
                        <p className="text-sm font-medium text-slate-900 italic">&ldquo;{vocab.exampleSentence}&rdquo;</p>
                        {vocab.exampleTarget && (
                          <p className="text-xs font-semibold text-slate-700 pt-1 border-t border-slate-200/60">
                            🇹🇭 คำแปล: {vocab.exampleTarget}
                          </p>
                        )}
                      </blockquote>
                    )}

                    {/* SRS Grading / Next Button */}
                    <div className="flex flex-col gap-3 pt-2 border-t border-slate-200">
                      {mode === "AUTHENTICATED" ? (
                        <div className="grid grid-cols-4 gap-2">
                          <button
                            onClick={() => handleSrsReview("again")}
                            disabled={isReviewing}
                            className="p-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold border border-rose-300 text-xs sm:text-sm"
                          >
                            ❌ จำไม่ได้
                          </button>
                          <button
                            onClick={() => handleSrsReview("hard")}
                            disabled={isReviewing}
                            className="p-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold border border-amber-300 text-xs sm:text-sm"
                          >
                            ⚠️ จำยาก
                          </button>
                          <button
                            onClick={() => handleSrsReview("good")}
                            disabled={isReviewing}
                            className="p-2.5 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold border border-blue-300 text-xs sm:text-sm"
                          >
                            ✅ จำได้ดี
                          </button>
                          <button
                            onClick={() => handleSrsReview("easy")}
                            disabled={isReviewing}
                            className="p-2.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold border border-emerald-300 text-xs sm:text-sm"
                          >
                            🌟 ง่ายมาก
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fetchNextVocab()}
                          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md text-center text-base"
                        >
                          คำศัพท์ถัดไป ➡️
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* =========================================================================
               MODE 2: Non-iPad PC / Desktop / Laptop / Mobile (Full-Screen Big Typing)
               "ไม่ขึ้นหน้าเขียนแต่เป็นพิมพ์แทนเลย พิมพ์เต็มจอใหญ่ ๆ และลด Text หลายๆจุดหน่อยมันลกตา"
               ========================================================================= */
            <div className="absolute inset-0 w-full h-full flex flex-col justify-between p-6 sm:p-10 z-10 bg-[#f8fafc] overflow-y-auto">
              {/* Top Clean Navbar */}
              <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
                <Link
                  href="/"
                  className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:bg-slate-50 text-xs sm:text-sm font-extrabold text-slate-700 transition-all"
                >
                  <span>⬅️</span>
                  <span>เปลี่ยน Collection</span>
                </Link>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black border border-indigo-200">
                    {vocab.category}
                  </span>
                  {(() => {
                    const cefr = getCefrBadgeProps(vocab.cefrLevel || vocab.difficultyLevel);
                    return (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${cefr.colorClass}`}>
                        {cefr.badgeText}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Center Stage: Big Prompt + Huge Typing Box ("พิมพ์เต็มจอใหญ่ ๆ") */}
              <div className="w-full max-w-3xl mx-auto my-auto flex flex-col items-center justify-center gap-10 py-8">
                {/* Clean Big Prompt */}
                <div className="text-center flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {practiceDirection === "TH_TO_EN" ? "🇹🇭 คำแปลภาษาไทย (พิมพ์คำศัพท์อังกฤษ)" : "🇬🇧 คำศัพท์อังกฤษ (แปลความหมาย)"}
                  </span>
                  {practiceDirection === "TH_TO_EN" ? (
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                      {vocab.meaning}
                    </h1>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight">
                        {vocab.word}
                      </h1>
                      {vocab.phonetic && (
                        <span className="text-lg sm:text-xl font-mono text-slate-400">/{vocab.phonetic}/</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Huge Full-Width Input / Revealed Box */}
                {!showAnswer ? (
                  <div className="w-full flex flex-col items-center gap-4">
                    <input
                      type="text"
                      autoFocus
                      placeholder={
                        practiceDirection === "TH_TO_EN"
                          ? "พิมพ์คำศัพท์ภาษาอังกฤษที่นี่..."
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
                      className="w-full text-2xl sm:text-4xl font-extrabold text-center py-6 px-8 bg-white border-2 border-slate-300 focus:border-indigo-600 rounded-3xl shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-slate-900 placeholder:text-slate-300 placeholder:font-normal placeholder:text-xl sm:placeholder:text-2xl"
                    />

                    <div className="flex items-center gap-4 mt-2">
                      <button
                        type="button"
                        onClick={() => setShowAnswer(true)}
                        className="px-6 py-2.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded-2xl text-xs sm:text-sm font-bold transition-all"
                      >
                        💡 ดูเฉลยทันที (Reveal Answer)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPracticeDirection((prev) => (prev === "TH_TO_EN" ? "EN_TO_TH" : "TH_TO_EN"))}
                        className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold transition-all shadow-2xs"
                      >
                        🔄 สลับด้านโจทย์
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl flex flex-col gap-6 animate-fadeIn">
                    {/* Revealed Answer Content */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <span className="text-xs font-bold uppercase text-indigo-600 tracking-wider">
                          ✨ เฉลยคำแปลและความหมาย
                        </span>
                        <div className="flex items-baseline gap-3 mt-1">
                          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">{vocab.word}</h2>
                          {vocab.phonetic && (
                            <span className="text-lg font-mono text-slate-500">/{vocab.phonetic}/</span>
                          )}
                        </div>
                      </div>
                      <TTSButton text={vocab.word} lang="en-US" size="md" label="ฟังเสียงคำศัพท์" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                        คำแปลภาษาไทย / ความหมายพ้อง
                      </span>
                      <p className="text-lg sm:text-xl font-bold text-slate-800">{vocab.meaning}</p>
                      {vocab.synonyms && vocab.synonyms.length > 0 && (
                        <p className="text-xs sm:text-sm text-indigo-600 font-medium mt-1">
                          🔗 คำพ้องความหมาย (Synonyms): {vocab.synonyms.join(", ")}
                        </p>
                      )}
                    </div>

                    {vocab.exampleSentence && (
                      <blockquote className="p-4 bg-slate-50 rounded-2xl border-l-4 border-indigo-600 flex flex-col gap-1.5">
                        <p className="text-sm sm:text-base font-medium text-slate-900 italic">
                          &ldquo;{vocab.exampleSentence}&rdquo;
                        </p>
                        {vocab.exampleTarget && (
                          <p className="text-xs font-semibold text-slate-700 pt-1 border-t border-slate-200/60">
                            🇹🇭 คำแปล: {vocab.exampleTarget}
                          </p>
                        )}
                      </blockquote>
                    )}

                    {/* Spaced Repetition Grading */}
                    <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
                      {mode === "AUTHENTICATED" ? (
                        <>
                          <span className="text-xs font-bold text-center text-slate-500">
                            เลือกระดับความจำเพื่อกำหนดรอบทบทวนถัดไป:
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <button
                              onClick={() => handleSrsReview("again")}
                              disabled={isReviewing}
                              className="py-3 px-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-900 font-bold border border-rose-200 text-xs sm:text-sm transition-all"
                            >
                              ❌ จำไม่ได้
                            </button>
                            <button
                              onClick={() => handleSrsReview("hard")}
                              disabled={isReviewing}
                              className="py-3 px-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border border-amber-200 text-xs sm:text-sm transition-all"
                            >
                              ⚠️ จำยาก
                            </button>
                            <button
                              onClick={() => handleSrsReview("good")}
                              disabled={isReviewing}
                              className="py-3 px-2 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold border border-blue-200 text-xs sm:text-sm transition-all"
                            >
                              ✅ จำได้ดี
                            </button>
                            <button
                              onClick={() => handleSrsReview("easy")}
                              disabled={isReviewing}
                              className="py-3 px-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold border border-emerald-200 text-xs sm:text-sm transition-all"
                            >
                              🌟 ง่ายมาก
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => fetchNextVocab()}
                          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/25 transition-all text-center text-base"
                        >
                          คำศัพท์ถัดไป ➡️
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Minimal Bottom Info */}
              <div className="w-full max-w-5xl mx-auto text-center text-xs font-medium text-slate-400">
                💡 พิมพ์คำศัพท์หรือคำพ้องความหมายให้ถูกต้องเป๊ะ ระบบจะเฉลยทันทีโดยไม่ต้องกดปุ่ม
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
