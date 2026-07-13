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
    progress?: {
      totalWords?: number;
      completedWords?: number;
    };
  };
}

export interface PracticeSessionProps {
  initialCategory?: string;
}

const SYNONYM_DICTIONARY: Record<string, string[]> = {
  mitigate: ["alleviate", "relieve", "lessen", "reduce", "soothe", "ease", "diminish", "assuage"],
  alleviate: ["mitigate", "relieve", "lessen", "reduce", "soothe", "ease", "diminish", "assuage"],
  meticulous: ["thorough", "careful", "scrupulous", "precise", "fastidious", "diligent", "accurate"],
  procrastinate: ["delay", "postpone", "defer", "put off", "stall"],
  ubiquitous: ["omnipresent", "pervasive", "universal", "common", "everywhere", "widespread"],
  resilient: ["tough", "strong", "hardy", "flexible", "durable", "buoyant", "adaptable"],
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

interface HistorySessionItem {
  vocab: VocabData;
  mode: "GUEST" | "AUTHENTICATED";
  showAnswer: boolean;
  answerStatus: "IDLE" | "CORRECT" | "WRONG";
  typedInput: string;
  hasUserDrawn: boolean;
  drawingDataUrl: string | null;
  practiceDirection: "TH_TO_EN" | "EN_TO_TH";
}

export default function PracticeSession({ initialCategory = "" }: PracticeSessionProps) {
  const [vocab, setVocab] = useState<VocabData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"GUEST" | "AUTHENTICATED">("GUEST");

  const [practiceDirection, setPracticeDirection] = useState<"TH_TO_EN" | "EN_TO_TH">("TH_TO_EN");
  const [showAnswer, setShowAnswer] = useState(false);
  const [answerStatus, setAnswerStatus] = useState<"IDLE" | "CORRECT" | "WRONG">("IDLE");
  const [isReviewing, setIsReviewing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategory === "all" ? "" : initialCategory
  );
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("collectionId") || "" : ""
  );
  const [typedInput, setTypedInput] = useState("");

  // Local progress tracking for guest mode
  const [guestCompletedCount, setGuestCompletedCount] = useState(0);

  // iPad / Drawing Device Detection vs PC/Mobile Typing Detection
  const [isDrawingDevice, setIsDrawingDevice] = useState(false);
  const [hasUserDrawn, setHasUserDrawn] = useState(false);
  const [drawingDataUrl, setDrawingDataUrl] = useState<string | null>(null);

  // History Stack for Previous / Back navigation
  const [history, setHistory] = useState<HistorySessionItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  useEffect(() => {
    const checkDevice = () => {
      const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isMacWithTouch = navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1;
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
    setAnswerStatus("IDLE");
    setTypedInput("");
    setHasUserDrawn(false);
    setDrawingDataUrl(null);

    const fallbackTimer = setTimeout(() => {
      setLoading(false);
      setError("การเชื่อมต่อใช้เวลานานเกินกำหนด กรุณากดปุ่มลองใหม่อีกครั้งเพื่อรีเฟรชข้อมูล");
    }, 20000);

    try {
      let url = `/api/vocab/next`;
      if (selectedCollectionId) {
        url += `?collectionId=${encodeURIComponent(selectedCollectionId)}`;
      } else if (selectedCategory) {
        url += `?category=${encodeURIComponent(selectedCategory)}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);

      const res = await fetch(url, {
        cache: "no-store",
        headers: {
          Pragma: "no-cache",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      clearTimeout(fallbackTimer);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "เกิดข้อผิดพลาดในการโหลดคำศัพท์");
      }

      const json = await res.json();
      const newDirection: "TH_TO_EN" | "EN_TO_TH" = Math.random() > 0.3 ? "TH_TO_EN" : "EN_TO_TH";
      setVocab(json.data);
      setMode(json.mode);
      setPracticeDirection(newDirection);

      const newItem: HistorySessionItem = {
        vocab: json.data,
        mode: json.mode,
        showAnswer: false,
        answerStatus: "IDLE",
        typedInput: "",
        hasUserDrawn: false,
        drawingDataUrl: null,
        practiceDirection: newDirection,
      };

      setHistory((prev) => {
        const nextList = [...prev, newItem];
        setHistoryIndex(nextList.length - 1);
        return nextList;
      });
    } catch (err: any) {
      clearTimeout(fallbackTimer);
      if (err.name === "AbortError" || err.message?.includes("abort")) {
        setError("เชื่อมต่อเซิร์ฟเวอร์ใช้เวลานานผิดปกติ กรุณากดปุ่ม ลองใหม่อีกครั้ง");
      } else {
        setError(err.message || "ไม่สามารถโหลดข้อมูลคำศัพท์ได้ กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      clearTimeout(fallbackTimer);
      setLoading(false);
    }
  }, [selectedCategory, selectedCollectionId]);

  useEffect(() => {
    fetchNextVocab();
  }, [fetchNextVocab]);

  const syncCurrentToHistory = useCallback(
    (overrides: Partial<HistorySessionItem> = {}) => {
      if (historyIndex < 0 || !vocab) return;
      setHistory((prev) => {
        const updated = [...prev];
        if (updated[historyIndex]) {
          updated[historyIndex] = {
            ...updated[historyIndex],
            vocab,
            mode,
            showAnswer,
            answerStatus,
            typedInput,
            hasUserDrawn,
            drawingDataUrl,
            practiceDirection,
            ...overrides,
          };
        }
        return updated;
      });
    },
    [historyIndex, vocab, mode, showAnswer, answerStatus, typedInput, hasUserDrawn, drawingDataUrl, practiceDirection]
  );

  const handleDrawStateChange = useCallback((drawn: boolean) => {
    setHasUserDrawn((prev) => (prev === drawn ? prev : drawn));
  }, []);

  const handleCanvasChange = useCallback(
    (dataUrl: string | null) => {
      setDrawingDataUrl(dataUrl);
      syncCurrentToHistory({ drawingDataUrl: dataUrl });
    },
    [syncCurrentToHistory]
  );

  const handlePrev = useCallback(() => {
    if (historyIndex <= 0) return;
    syncCurrentToHistory();
    const prevIdx = historyIndex - 1;
    const prevItem = history[prevIdx];
    if (prevItem) {
      setVocab(prevItem.vocab);
      setMode(prevItem.mode);
      setShowAnswer(prevItem.showAnswer);
      setAnswerStatus(prevItem.answerStatus);
      setTypedInput(prevItem.typedInput);
      setHasUserDrawn(prevItem.hasUserDrawn);
      setDrawingDataUrl(prevItem.drawingDataUrl);
      setPracticeDirection(prevItem.practiceDirection);
      setHistoryIndex(prevIdx);
    }
  }, [historyIndex, history, syncCurrentToHistory]);

  const handleNext = useCallback(() => {
    syncCurrentToHistory();
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const nextItem = history[nextIdx];
      if (nextItem) {
        setVocab(nextItem.vocab);
        setMode(nextItem.mode);
        setShowAnswer(nextItem.showAnswer);
        setAnswerStatus(nextItem.answerStatus);
        setTypedInput(nextItem.typedInput);
        setHasUserDrawn(nextItem.hasUserDrawn);
        setDrawingDataUrl(nextItem.drawingDataUrl);
        setPracticeDirection(nextItem.practiceDirection);
        setHistoryIndex(nextIdx);
        return;
      }
    }
    fetchNextVocab();
  }, [historyIndex, history, syncCurrentToHistory, fetchNextVocab]);

  const handleSrsReview = async (rating: "again" | "hard" | "good" | "easy") => {
    if (!vocab) return;
    recordGuestWordCompletion(vocab.id, vocab.collectionId, vocab.category);

    if (mode === "GUEST") {
      setGuestCompletedCount((prev) => prev + 1);
      handleNext();
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
      handleNext();
    }
  };

  const handleRevealClick = () => {
    if (isDrawingDevice && !hasUserDrawn) return;
    if (!isDrawingDevice && !typedInput.trim()) return;

    let newStatus: "IDLE" | "CORRECT" | "WRONG" = "IDLE";
    if (typedInput.trim().length > 0 && vocab) {
      if (checkIsCorrectAnswer(typedInput, vocab, practiceDirection)) {
        newStatus = "CORRECT";
        recordGuestWordCompletion(vocab.id, vocab.collectionId, vocab.category);
        if (mode === "GUEST") setGuestCompletedCount((prev) => prev + 1);
      } else {
        newStatus = "WRONG";
      }
    } else {
      newStatus = "IDLE";
    }
    setAnswerStatus(newStatus);
    setShowAnswer(true);
    syncCurrentToHistory({ showAnswer: true, answerStatus: newStatus });
  };

  // Calculate Progress Stats
  const totalWords = vocab?.meta?.progress?.totalWords || 1;
  const dbCompleted = vocab?.meta?.progress?.completedWords || 0;
  const completedWords = mode === "AUTHENTICATED" ? dbCompleted : guestCompletedCount;
  const currentWordNumber = Math.min(totalWords, completedWords + 1);
  const percent = Math.min(100, Math.round((completedWords / totalWords) * 100));

  // =========================================================================
  // RULE 1: "ถ้าถูกให้เอาคำที่ตอบเป็นหลัก และคำหลัก มาอยู่ในคำย่อย"
  // =========================================================================
  const cleanTyped = typedInput.trim().toLowerCase();
  const isTypedCorrectAndDifferent =
    answerStatus === "CORRECT" &&
    cleanTyped !== "" &&
    vocab !== null &&
    cleanTyped !== vocab.word.toLowerCase() &&
    practiceDirection === "TH_TO_EN";

  const displayWord = isTypedCorrectAndDifferent && vocab ? typedInput.trim().toLowerCase() : vocab?.word || "";
  const displayPhonetic = isTypedCorrectAndDifferent ? "" : vocab?.phonetic;
  const displaySynonyms =
    isTypedCorrectAndDifferent && vocab
      ? [
          `${vocab.word}${vocab.phonetic ? ` (/${vocab.phonetic}/)` : ""}`,
          ...(vocab.synonyms || []).filter((s) => s.toLowerCase() !== cleanTyped),
        ]
      : vocab?.synonyms || [];

  // =========================================================================
  // RULE 2 & 3: "ประโยคตัวอย่าง ทำให้คำนั้น หนาด้วย และคำที่เอามาเป็นตัวอย่างเอาตามที่ป้อนเป็นหลักก่อนถ้าความหมายถูก"
  // =========================================================================
  const renderFormattedSentence = (sentence: string | null | undefined) => {
    if (!sentence || !vocab) return null;

    let textToDisplay = sentence;
    if (isTypedCorrectAndDifferent) {
      const escapeLesson = vocab.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regLesson = new RegExp(`\\b${escapeLesson}[a-z]*\\b`, "gi");
      if (regLesson.test(textToDisplay)) {
        textToDisplay = textToDisplay.replace(regLesson, displayWord);
      }
    }

    const targets = Array.from(
      new Set([displayWord, vocab.word, ...(vocab.synonyms || [])].filter((w) => w && w.length >= 2))
    );
    targets.sort((a, b) => b.length - a.length);
    const escapedTargets = targets.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`\\b(${escapedTargets.join("|")})[a-z]*\\b`, "gi");

    const parts = textToDisplay.split(regex);
    return parts.map((part, idx) => {
      if (
        targets.some(
          (t) => part.toLowerCase().startsWith(t.toLowerCase()) || t.toLowerCase().startsWith(part.toLowerCase())
        ) &&
        part.length >= 2
      ) {
        return (
          <strong
            key={idx}
            className="font-black text-indigo-700 bg-indigo-100/90 px-1.5 py-0.5 rounded-lg border border-indigo-200 underline decoration-indigo-400 decoration-2"
          >
            {part}
          </strong>
        );
      }
      return part;
    });
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
          {/* Top Universal Progress Navbar */}
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 z-30 pointer-events-none flex justify-center">
            <div className="w-full max-w-5xl pointer-events-auto bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 rounded-2xl border border-slate-200/80 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 shrink-0">
                <Link
                  href="/"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all"
                >
                  <span>⬅️</span>
                  <span>เปลี่ยน Collection</span>
                </Link>
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black border border-indigo-200">
                  {vocab.category}
                </span>
                {(() => {
                  const cefr = getCefrBadgeProps(vocab.cefrLevel || vocab.difficultyLevel);
                  return (
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${cefr.colorClass}`}>
                      {cefr.badgeText}
                    </span>
                  );
                })()}
              </div>

              {/* Word Progress Bar (% & Counter) */}
              <div className="w-full sm:w-80 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
                  <span>
                    🎯 คำที่ {currentWordNumber} / {totalWords}{" "}
                    <span className="text-slate-400 font-normal text-[11px]">
                      (เหลือ {Math.max(0, totalWords - currentWordNumber)} คำ)
                    </span>
                  </span>
                  <span className="text-indigo-600 font-mono font-black">{percent}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              MODE 1: iPad / Drawing Tablet Mode (Full Screen Edge-to-Edge Canvas)
              ========================================================================= */}
          {isDrawingDevice ? (
            <>
              <div className="absolute inset-0 w-full h-full z-0 pt-20">
                <CanvasLoader
                  wordToPractice={vocab.word}
                  showGuidelineWord={practiceDirection === "EN_TO_TH" || showAnswer}
                  onDrawStateChange={handleDrawStateChange}
                  initialDataUrl={drawingDataUrl}
                  onCanvasChange={handleCanvasChange}
                />
              </div>

              {!showAnswer && (
                <div className="absolute top-20 left-4 z-10 pointer-events-none flex items-center gap-2.5">
                  <div className="pointer-events-auto flex items-center gap-2.5 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200/80 shadow-md">
                    {practiceDirection === "TH_TO_EN" ? (
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900">{vocab.meaning}</h2>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900">{vocab.word}</h2>
                        {vocab.phonetic && (
                          <span className="text-sm font-mono text-slate-500">/{vocab.phonetic}/</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none w-full max-w-xl px-4 flex flex-col items-center justify-center">
                {!showAnswer ? (
                  <div className="pointer-events-auto flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2.5 rounded-3xl border border-slate-200/80 shadow-2xl">
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={historyIndex <= 0}
                      className="px-4 sm:px-5 py-3.5 rounded-2xl font-bold text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-slate-200 flex items-center gap-1.5"
                    >
                      ⬅️ ย้อนกลับ
                    </button>

                    <button
                      type="button"
                      disabled={!hasUserDrawn}
                      onClick={handleRevealClick}
                      className={`px-7 sm:px-10 py-3.5 rounded-2xl font-black text-base sm:text-lg transition-all flex items-center justify-center border shadow-md ${
                        hasUserDrawn
                          ? "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white border-indigo-500 shadow-indigo-600/30 cursor-pointer animate-pulse"
                          : "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-75 shadow-none"
                      }`}
                    >
                      ดูเฉลย
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-4 sm:px-5 py-3.5 rounded-2xl font-bold text-xs sm:text-sm bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all cursor-pointer flex items-center gap-1"
                    >
                      ข้ามคำ ⏩
                    </button>
                  </div>
                ) : (
                  <div
                    className={`pointer-events-auto w-full p-6 rounded-3xl border shadow-2xl flex flex-col gap-4 max-h-[75vh] overflow-y-auto transition-all duration-300 ${
                      answerStatus === "CORRECT"
                        ? "bg-emerald-50/80 backdrop-blur-xl border-emerald-400 shadow-emerald-500/15"
                        : "bg-white/95 backdrop-blur-xl border-slate-200"
                    }`}
                  >
                    {/* RULE 4: "เมื่อถูกให้ทั้งแทบเป็นสีเขียวไม่ต้องเด้ง ๆ ลายตา" */}
                    {answerStatus === "CORRECT" && (
                      <div className="w-full p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl shadow-md shadow-emerald-600/25 border border-emerald-300 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">🎉</span>
                          <h3 className="text-base sm:text-lg font-black">ถูกต้อง</h3>
                        </div>
                        <span className="px-3 py-1 bg-white text-emerald-900 text-xs font-black rounded-full uppercase">+1 EXP ✅</span>
                      </div>
                    )}
                    {answerStatus === "WRONG" && (
                      <div className="w-full p-4 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-2xl shadow-md shadow-rose-600/25 border border-rose-300 flex items-center gap-3">
                        <span className="text-3xl">💡</span>
                        <div>
                          <h3 className="text-base sm:text-lg font-black">ยังไม่ถูกต้อง</h3>
                          {typedInput && (
                            <p className="text-xs text-rose-100 font-medium mt-0.5">
                              คุณตอบ: &ldquo;{typedInput}&rdquo; • เฉลย: &ldquo;{vocab.word}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 bg-white/80 border border-slate-200/80 rounded-2xl shadow-2xs">
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-black text-slate-900">{displayWord}</span>
                        {displayPhonetic && (
                          <span className="text-base font-mono text-slate-500">/{displayPhonetic}/</span>
                        )}
                      </div>
                      <TTSButton text={displayWord} lang="en-US" size="md" label="ฟังเสียงคำศัพท์" />
                    </div>

                    <div className="flex flex-col gap-1 text-left">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                        คำแปลภาษาไทย / ความหมายพ้อง
                      </span>
                      <p className="text-lg sm:text-xl font-bold text-slate-800">{vocab.meaning}</p>
                      {displaySynonyms && displaySynonyms.length > 0 && (
                        <p className="text-xs sm:text-sm text-indigo-600 font-medium mt-1">
                          🔗 คำพ้องความหมาย (Synonyms / คำหลัก): {displaySynonyms.join(", ")}
                        </p>
                      )}
                    </div>

                    {vocab.exampleSentence && (
                      <blockquote className="p-3.5 bg-white/80 rounded-xl border-l-4 border-indigo-600 flex flex-col gap-1 text-left shadow-2xs">
                        <p className="text-sm sm:text-base font-medium text-slate-900 italic">
                          &ldquo;{renderFormattedSentence(vocab.exampleSentence)}&rdquo;
                        </p>
                        {vocab.exampleTarget && (
                          <p className="text-xs font-semibold text-slate-700 pt-1 border-t border-slate-200/60">
                            🇹🇭 คำแปล: {vocab.exampleTarget}
                          </p>
                        )}
                      </blockquote>
                    )}

                    <div className="flex flex-col gap-3 pt-2 border-t border-slate-200/80">
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
                        <div className="flex items-center gap-2.5 w-full">
                          <button
                            type="button"
                            onClick={handlePrev}
                            disabled={historyIndex <= 0}
                            className="px-4 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            ⬅️ ย้อนกลับ
                          </button>
                          <button
                            onClick={() => {
                              setGuestCompletedCount((prev) => prev + 1);
                              handleNext();
                            }}
                            className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md text-center text-base cursor-pointer"
                          >
                            คำศัพท์ถัดไป ➡️
                          </button>
                        </div>
                      )}
                      {mode === "AUTHENTICATED" && (
                        <div className="flex justify-start pt-1">
                          <button
                            type="button"
                            onClick={handlePrev}
                            disabled={historyIndex <= 0}
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            ⬅️ ย้อนกลับไปคำก่อนหน้า
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* =========================================================================
               MODE 2: Non-iPad PC / Desktop / Laptop / Mobile (Full-Screen Big Typing)
               ========================================================================= */
            <div className="absolute inset-0 w-full h-full flex flex-col justify-between p-6 sm:p-10 z-10 bg-[#f8fafc] overflow-y-auto pt-24 sm:pt-28">
              <div className="w-full max-w-3xl mx-auto my-auto flex flex-col items-center justify-center gap-8 py-4">
                {!showAnswer && (
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
                )}

                {!showAnswer ? (
                  <div className="w-full flex flex-col items-center gap-5">
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
                          setAnswerStatus("CORRECT");
                          recordGuestWordCompletion(vocab.id, vocab.collectionId, vocab.category);
                          if (mode === "GUEST") setGuestCompletedCount((prev) => prev + 1);
                          setShowAnswer(true);
                          syncCurrentToHistory({ typedInput: val, answerStatus: "CORRECT", showAnswer: true });
                        } else {
                          syncCurrentToHistory({ typedInput: val });
                        }
                      }}
                      className="w-full text-2xl sm:text-4xl font-extrabold text-center py-6 px-8 bg-white border-2 border-slate-300 focus:border-indigo-600 rounded-3xl shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-slate-900 placeholder:text-slate-300 placeholder:font-normal placeholder:text-xl sm:placeholder:text-2xl"
                    />

                    <div className="flex items-center justify-center gap-3 mt-1 flex-wrap w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handlePrev}
                        disabled={historyIndex <= 0}
                        className="px-5 py-3.5 rounded-2xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-slate-200 shadow-xs flex items-center gap-1.5"
                      >
                        ⬅️ ย้อนกลับ
                      </button>

                      <button
                        type="button"
                        disabled={!typedInput.trim()}
                        onClick={handleRevealClick}
                        className={`px-8 py-3.5 rounded-2xl text-base font-black transition-all border shadow-md flex items-center justify-center ${
                          typedInput.trim().length > 0
                            ? "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white border-indigo-500 shadow-indigo-600/25 cursor-pointer animate-pulse"
                            : "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-70 shadow-none"
                        }`}
                      >
                        ดูเฉลย
                      </button>

                      <button
                        type="button"
                        onClick={handleNext}
                        className="px-5 py-3.5 rounded-2xl font-bold text-sm bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        ข้ามคำ ⏩
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`w-full p-6 sm:p-8 rounded-3xl border transition-all duration-300 flex flex-col gap-6 ${
                      answerStatus === "CORRECT"
                        ? "bg-emerald-50/70 border-emerald-400 shadow-xl shadow-emerald-500/15"
                        : "bg-white border-slate-200 shadow-xl"
                    }`}
                  >
                    {/* RULE 4: "เมื่อถูกให้ทั้งแทบเป็นสีเขียวไม่ต้องเด้ง ๆ ลายตา" */}
                    {answerStatus === "CORRECT" && (
                      <div className="w-full p-4.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl shadow-md shadow-emerald-600/25 border border-emerald-300 flex items-center justify-between transition-all duration-300">
                        <div className="flex items-center gap-3.5">
                          <span className="text-4xl">🎉</span>
                          <h3 className="text-lg sm:text-xl font-black">ถูกต้อง</h3>
                        </div>
                        <span className="px-3 py-1 bg-white text-emerald-900 text-xs font-black rounded-full uppercase shadow-2xs">+1 EXP ✅</span>
                      </div>
                    )}
                    {answerStatus === "WRONG" && (
                      <div className="w-full p-4.5 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-2xl shadow-md shadow-rose-600/25 border border-rose-300 flex items-center gap-3.5">
                        <span className="text-4xl">💡</span>
                        <div>
                          <h3 className="text-lg sm:text-xl font-black">ยังไม่ถูกต้อง</h3>
                          {typedInput && (
                            <p className="text-xs sm:text-sm text-rose-100 font-medium mt-0.5">
                              คุณตอบ: &ldquo;{typedInput}&rdquo; • เฉลย: &ldquo;{vocab.word}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Revealed Answer Content */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                      <div>
                        <span className="text-xs font-bold uppercase text-indigo-600 tracking-wider">
                          ✨ เฉลยคำแปลและความหมาย
                        </span>
                        <div className="flex items-baseline gap-3 mt-1">
                          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">{displayWord}</h2>
                          {displayPhonetic && (
                            <span className="text-lg font-mono text-slate-500">/{displayPhonetic}/</span>
                          )}
                        </div>
                      </div>
                      <TTSButton text={displayWord} lang="en-US" size="md" label="ฟังเสียงคำศัพท์" />
                    </div>

                    <div className="flex flex-col gap-1 text-left">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                        คำแปลภาษาไทย / ความหมายพ้อง
                      </span>
                      <p className="text-lg sm:text-xl font-bold text-slate-800">{vocab.meaning}</p>
                      {displaySynonyms && displaySynonyms.length > 0 && (
                        <p className="text-xs sm:text-sm text-indigo-600 font-medium mt-1">
                          🔗 คำพ้องความหมาย (Synonyms / คำหลัก): {displaySynonyms.join(", ")}
                        </p>
                      )}
                    </div>

                    {vocab.exampleSentence && (
                      <blockquote className="p-4 bg-white/80 rounded-2xl border-l-4 border-indigo-600 flex flex-col gap-1.5 text-left shadow-2xs">
                        <p className="text-sm sm:text-base font-medium text-slate-900 italic">
                          &ldquo;{renderFormattedSentence(vocab.exampleSentence)}&rdquo;
                        </p>
                        {vocab.exampleTarget && (
                          <p className="text-xs font-semibold text-slate-700 pt-1 border-t border-slate-200/60">
                            🇹🇭 คำแปล: {vocab.exampleTarget}
                          </p>
                        )}
                      </blockquote>
                    )}

                    <div className="flex flex-col gap-3 pt-2 border-t border-slate-200/80">
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
                        <div className="flex items-center gap-3 w-full">
                          <button
                            type="button"
                            onClick={handlePrev}
                            disabled={historyIndex <= 0}
                            className="px-5 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-base disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-slate-200 shadow-xs"
                          >
                            ⬅️ ย้อนกลับ
                          </button>
                          <button
                            onClick={() => {
                              setGuestCompletedCount((prev) => prev + 1);
                              handleNext();
                            }}
                            className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/25 transition-all text-center text-base cursor-pointer"
                          >
                            คำศัพท์ถัดไป ➡️
                          </button>
                        </div>
                      )}
                      {mode === "AUTHENTICATED" && (
                        <div className="flex justify-start pt-1">
                          <button
                            type="button"
                            onClick={handlePrev}
                            disabled={historyIndex <= 0}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-slate-200 shadow-xs"
                          >
                            ⬅️ ย้อนกลับไปคำก่อนหน้า
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
