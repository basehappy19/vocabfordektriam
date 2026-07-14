"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import TTSButton from "@/components/tts/tts-button";
import { getCefrBadgeProps, getCefrFromNumber } from "@/lib/cefr";
import { recordGuestWordCompletion, getCompletedWordIds, recordCollectionPlaySession, GuestSessionHistoryItem } from "@/lib/progress";
import { getCollectionMeta } from "@/lib/collection-meta";

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
      wordIndex?: number;
    };
  };
}

export interface PracticeSessionProps {
  initialCategory?: string;
  initialCollectionId?: string;
  initialVocab?: VocabData | null;
  initialMode?: "GUEST" | "AUTHENTICATED";
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

const SYNONYM_PHONETIC_DICTIONARY: Record<string, string> = {
  // Main words
  ubiquitous: "yoo-BIK-wih-tus",
  mitigate: "MIT-ih-gayt",
  resilient: "rih-ZIL-yunt",
  meticulous: "muh-TIK-yuh-lus",
  ambiguous: "am-BIG-yoo-us",
  alleviate: "uh-LEE-vee-ayt",
  scrutinize: "SKROO-tuh-nyze",
  empathy: "EM-puh-thee",
  collaborate: "kuh-LAB-uh-rayt",
  exacerbate: "ig-ZAS-er-bayt",
  procrastinate: "pro-KRAS-tuh-nayt",
  paradigm: "PAR-uh-dyme",
  inevitable: "in-EV-ih-tuh-bul",

  // ubiquitous synonyms
  omnipresent: "om-nih-PREZ-unt",
  pervasive: "per-VAY-siv",
  universal: "yoo-nuh-VER-sul",
  widespread: "WYDE-spred",
  common: "KOM-un",
  everywhere: "EV-ree-wair",

  // mitigate / alleviate synonyms
  lessen: "LES-un",
  relieve: "rih-LEEV",
  reduce: "rih-DOOS",
  soothe: "s-OOTH",
  ease: "EEZ",
  diminish: "dih-MIN-ish",
  assuage: "uh-SWAYJ",

  // resilient synonyms
  tough: "t-UFF",
  strong: "str-AWNG",
  hardy: "HAR-dee",
  flexible: "FLEK-suh-bul",
  durable: "DYOOR-uh-bul",
  buoyant: "BOY-unt",
  adaptable: "uh-DAP-tuh-bul",

  // meticulous synonyms
  thorough: "THUR-oh",
  careful: "KAIR-ful",
  scrupulous: "SKROO-pyuh-lus",
  precise: "prih-SYSE",
  fastidious: "fah-STID-ee-us",
  diligent: "DIL-ih-junt",
  accurate: "AK-yuh-rut",

  // ambiguous synonyms
  unclear: "un-KLEER",
  vague: "v-AYG",
  equivocal: "ih-KWIV-uh-kul",
  obscure: "ub-SKYOOR",
  uncertain: "un-SER-tun",
  cryptic: "KRIP-tik",

  // scrutinize synonyms
  examine: "ig-ZAM-in",
  inspect: "in-SPEKT",
  analyze: "AN-uh-lyze",
  "study carefully": "STUD-ee KAIR-ful-ee",
  investigate: "in-VES-tuh-gayt",
  probe: "pr-OHB",

  // empathy synonyms
  compassion: "kum-PASH-un",
  understanding: "un-der-STAN-ding",
  sympathy: "SIM-puh-thee",
  care: "k-AIR",
  sensitivity: "sen-sih-TIV-ih-tee",

  // collaborate synonyms
  cooperate: "koh-OP-uh-rayt",
  "team up": "t-EEM UP",
  "join forces": "JOYN FOR-suz",
  "work together": "WERK tuh-GETH-er",
  partner: "PART-ner",

  // exacerbate synonyms
  worsen: "WER-sun",
  aggravate: "AG-ruh-vayt",
  intensify: "in-TEN-suh-fye",
  compound: "kum-POWND",
  inflame: "in-FLAYM",

  // procrastinate synonyms
  delay: "dih-LAY",
  postpone: "pohst-POHN",
  defer: "dih-FER",
  "put off": "p-UT OFF",
  stall: "st-AWL",
  dally: "DAL-ee",

  // paradigm synonyms
  model: "MOD-ul",
  pattern: "PAT-ern",
  framework: "FRAYM-werk",
  standard: "STAN-derd",
  archetype: "AR-kuh-type",
  prototype: "PROH-tuh-type",

  // inevitable synonyms
  unavoidable: "un-uh-VOY-duh-bul",
  certain: "SER-tun",
  ineluctable: "in-ih-LUK-tuh-bul",
  destined: "DES-tind",
  sure: "sh-OOR",
};

const COLLECTION_TITLES: Record<string, string> = {
  "tgat1-68": "TGAT 1 ปี 2568",
  "tgat1-67": "TGAT 1 ปี 2567",
  "tgat1-66": "TGAT 1 ปี 2566",
  "alevel-68": "A-Level ปี 2568",
  "alevel-67": "A-Level ปี 2567",
  "alevel-66": "A-Level ปี 2566",
};

function getPhoneticForWord(word: string, vocab?: VocabData | null): string {
  const clean = word.trim().toLowerCase();
  if (vocab && clean === vocab.word.toLowerCase() && vocab.phonetic) {
    return vocab.phonetic;
  }
  if (SYNONYM_PHONETIC_DICTIONARY[clean]) {
    return SYNONYM_PHONETIC_DICTIONARY[clean];
  }
  return word
    .trim()
    .split(/\s+/)
    .map((w) => w.toUpperCase())
    .join(" ");
}

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
    const cleanTyped = typed.trim();
    if (cleanMeaning === cleanTyped) return true;

    // Split meaning by common delimiters (, / () | หรือ ;)
    const meaningTokens = cleanMeaning
      .split(/[,/()|;]/)
      .map((m) => m.replace(/^หรือ\s+/g, "").trim())
      .filter((m) => m.length >= 2);

    for (const token of meaningTokens) {
      // 1. Exact match with any token in the meaning list
      if (cleanTyped === token) return true;

      // 2. Ignore spaces when comparing Thai words (e.g. "เข้มแข็ง อดทน" vs "เข้มแข็งอดทน")
      const tokenNoSpaces = token.replace(/\s+/g, "");
      const typedNoSpaces = cleanTyped.replace(/\s+/g, "");
      if (typedNoSpaces === tokenNoSpaces && tokenNoSpaces.length >= 2) return true;

      // 3. If the user typed the ENTIRE token plus extra descriptive words (e.g. typed "มีความอดทนสูง" where token is "มีความอดทน")
      // We ONLY allow this if the token is complete (>= 4 chars) and the typed input explicitly CONTAINS the full token!
      if (tokenNoSpaces.length >= 4 && typedNoSpaces.includes(tokenNoSpaces)) {
        return true;
      }
    }

    return false;
  }
}

export interface SessionRecordedAnswer {
  vocabId: string;
  word: string;
  meaning: string;
  userTypedInput: string;
  correctAnswerText: string;
  isCorrect: boolean;
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

export default function PracticeSession({
  initialCategory = "",
  initialCollectionId = "",
  initialVocab = null,
  initialMode = "GUEST",
}: PracticeSessionProps) {
  const [vocab, setVocab] = useState<VocabData | null>(initialVocab);
  const [loading, setLoading] = useState<boolean>(!initialVocab);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"GUEST" | "AUTHENTICATED">(initialMode);

  const [practiceDirection, setPracticeDirection] = useState<"TH_TO_EN" | "EN_TO_TH">("TH_TO_EN");
  const [showAnswer, setShowAnswer] = useState(false);
  const [answerStatus, setAnswerStatus] = useState<"IDLE" | "CORRECT" | "WRONG">("IDLE");
  const [isReviewing, setIsReviewing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategory === "all" ? "" : initialCategory
  );
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(() => {
    if (initialCollectionId) return initialCollectionId;
    return typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("collectionId") || "" : "";
  });
  const [typedInput, setTypedInput] = useState("");

  // Local progress tracking for guest mode
  const [guestCompletedCount, setGuestCompletedCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // iPad / Drawing Device Detection vs PC/Mobile Typing Detection
  const [isDrawingDevice, setIsDrawingDevice] = useState(false);
  const [hasUserDrawn, setHasUserDrawn] = useState(false);
  const [drawingDataUrl, setDrawingDataUrl] = useState<string | null>(null);
  const [isConvertingOcr, setIsConvertingOcr] = useState(false);

  // History Stack for Previous / Back navigation
  const [history, setHistory] = useState<HistorySessionItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Practice Session Summary and DB Recording
  const [recordedAnswers, setRecordedAnswers] = useState<SessionRecordedAnswer[]>([]);
  const [sessionStartTime] = useState<number>(Date.now());
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [isSavingSummary, setIsSavingSummary] = useState(false);
  const [savedSessionSummary, setSavedSessionSummary] = useState<any | null>(null);

  const openAndSaveSummary = useCallback(async (answersToSave?: SessionRecordedAnswer[]) => {
    const list = answersToSave || recordedAnswers;
    if (list.length === 0) return;
    setShowSummaryModal(true);

    if (!savedSessionSummary && !isSavingSummary) {
      const activeColId = selectedCollectionId || vocab?.collectionId || null;
      const activeCat = selectedCategory || vocab?.category || "GENERAL";
      const durationSeconds = Math.round((Date.now() - sessionStartTime) / 1000);

      const sessionItem: GuestSessionHistoryItem = {
        id: `session-${Date.now()}`,
        collectionId: activeColId,
        category: activeCat,
        totalWords: list.length,
        correctCount: list.filter((a) => a.isCorrect).length,
        wrongCount: list.filter((a) => !a.isCorrect).length,
        durationSeconds,
        createdAt: new Date().toISOString(),
        answers: list.map((a) => ({
          vocabId: a.vocabId,
          word: a.word,
          meaning: a.meaning,
          userTypedInput: a.userTypedInput,
          correctAnswerText: a.correctAnswerText,
          isCorrect: a.isCorrect,
        })),
      };
      recordCollectionPlaySession(activeColId, sessionItem);
    }

    if (mode !== "AUTHENTICATED" || isSavingSummary || savedSessionSummary !== null) return;

    setIsSavingSummary(true);
    try {
      const res = await fetch("/api/vocab/session-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionId: selectedCollectionId || null,
          category: selectedCategory || null,
          answers: list,
          startedAt: new Date(sessionStartTime).toISOString(),
          endedAt: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSavedSessionSummary(data.summary || data.sessionSummary || null);
      }
    } catch (err) {
      console.error("Error saving practice session summary:", err);
    } finally {
      setIsSavingSummary(false);
    }
  }, [recordedAnswers, selectedCollectionId, selectedCategory, sessionStartTime, mode, isSavingSummary, savedSessionSummary]);

  useEffect(() => {
    setIsMounted(true);
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

  const fetchNextVocab = useCallback(async (isResetOrEvent?: boolean | any) => {
    const isReset = typeof isResetOrEvent === "boolean" ? isResetOrEvent : false;
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
      const params = new URLSearchParams();
      if (selectedCollectionId) params.set("collectionId", selectedCollectionId);
      if (selectedCategory) params.set("category", selectedCategory);

      if (isReset || (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("reset") === "true")) {
        params.set("reset", "true");
      } else {
        if (vocab?.id) params.set("currentWordId", vocab.id);
        if (history.length > 0) {
          params.set("excludeIds", history.map((h) => h.vocab.id).join(","));
        }
      }

      const paramStr = params.toString();
      if (paramStr) url += `?${paramStr}`;

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
      const newDirection: "TH_TO_EN" | "EN_TO_TH" = "TH_TO_EN";
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
        const nextList = isReset ? [newItem] : [...prev, newItem];
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
  }, [selectedCategory, selectedCollectionId, vocab?.id, history]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storageKey = `vocab_practice_state_${selectedCollectionId || selectedCategory || "general"}`;
    const isResetParam = new URLSearchParams(window.location.search).get("reset") === "true";

    if (isResetParam) {
      try { localStorage.removeItem(storageKey); } catch (e) {}
      window.history.replaceState({}, "", window.location.pathname + (selectedCollectionId ? `?collectionId=${selectedCollectionId}` : selectedCategory ? `?category=${selectedCategory}` : ""));
      fetchNextVocab(true);
      return;
    }

    try {
      const savedStr = localStorage.getItem(storageKey);
      if (savedStr) {
        const saved = JSON.parse(savedStr);
        if (saved && Array.isArray(saved.history) && saved.history.length > 0 && typeof saved.historyIndex === "number" && saved.history[saved.historyIndex]) {
          setHistory(saved.history);
          setHistoryIndex(saved.historyIndex);
          setVocab(saved.history[saved.historyIndex].vocab);
          setMode(saved.mode || "GUEST");
          setShowAnswer(saved.history[saved.historyIndex].showAnswer || false);
          setAnswerStatus(saved.history[saved.historyIndex].answerStatus || "IDLE");
          setTypedInput(saved.history[saved.historyIndex].typedInput || "");
          setPracticeDirection("TH_TO_EN");
          if (Array.isArray(saved.recordedAnswers)) setRecordedAnswers(saved.recordedAnswers);
          if (typeof saved.guestCompletedCount === "number") setGuestCompletedCount(saved.guestCompletedCount);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.error("Failed restoring practice state from localStorage:", e);
    }

    if (initialVocab) {
      setHistory([
        {
          vocab: initialVocab,
          mode: initialMode,
          showAnswer: false,
          answerStatus: "IDLE",
          typedInput: "",
          hasUserDrawn: false,
          drawingDataUrl: null,
          practiceDirection: "TH_TO_EN",
        },
      ]);
      setHistoryIndex(0);
      setVocab(initialVocab);
      setMode(initialMode);
      setLoading(false);
      return;
    }

    fetchNextVocab(false);
  }, [selectedCollectionId, selectedCategory, initialVocab, initialMode]); // Initial check and load on mount

  useEffect(() => {
    if (typeof window === "undefined" || history.length === 0 || historyIndex < 0 || !vocab) return;
    const storageKey = `vocab_practice_state_${selectedCollectionId || selectedCategory || "general"}`;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          history,
          historyIndex,
          recordedAnswers,
          guestCompletedCount,
          mode,
          lastUpdated: Date.now(),
        })
      );
    } catch (e) {
      console.error("Error saving practice state:", e);
    }
  }, [history, historyIndex, recordedAnswers, guestCompletedCount, mode, vocab, selectedCollectionId, selectedCategory]);

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
    let currentAnswers = [...recordedAnswers];
    if (vocab && !recordedAnswers.some((a) => a.vocabId === vocab.id)) {
      const skipRecord: SessionRecordedAnswer = {
        vocabId: vocab.id,
        word: vocab.word,
        meaning: vocab.meaning,
        userTypedInput: "- กดข้ามคำ -",
        correctAnswerText: `${vocab.word} = ${vocab.meaning}`,
        isCorrect: false,
      };
      currentAnswers = [...recordedAnswers, skipRecord];
      setRecordedAnswers(currentAnswers);
    }

    const totalTarget = vocab?.meta?.progress?.totalWords || 15;
    if (currentAnswers.length >= totalTarget) {
      openAndSaveSummary(currentAnswers);
      return;
    }

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
    fetchNextVocab(false);
  }, [historyIndex, history, syncCurrentToHistory, fetchNextVocab, vocab, recordedAnswers, openAndSaveSummary]);

  const handleSrsReview = async (rating: "again" | "hard" | "good" | "easy") => {
    if (!vocab) return;
    recordGuestWordCompletion(vocab.id, selectedCollectionId || vocab.collectionId, vocab.category);

    if (mode === "GUEST") {
      incrementGuestCountSafely();
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

  const recognizeHandwritingFromDataUrl = async (dataUrl: string): Promise<string> => {
    try {
      const res = await fetch("/api/vocab/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: dataUrl,
          expectedWords: vocab ? [vocab.word, ...(vocab.synonyms || []), vocab.meaning] : [],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "success" && data.text !== undefined) {
          return data.text;
        }
      }
    } catch (apiErr) {
      console.warn("[API OCR fallback]:", apiErr);
    }

    try {
      const Tesseract = (await import("tesseract.js")).default;
      const result = await Tesseract.recognize(dataUrl, "eng+tha");
      return result.data.text.trim().toLowerCase();
    } catch (tessErr) {
      console.error("[Tesseract OCR Error]:", tessErr);
      return "";
    }
  };

  const handleOcrConvertOnly = async () => {
    if (!drawingDataUrl || !hasUserDrawn) return;
    setIsConvertingOcr(true);
    try {
      const recognized = await recognizeHandwritingFromDataUrl(drawingDataUrl);
      if (recognized) {
        setTypedInput(recognized);
      } else {
        alert("ระบบอ่านอักษรไม่ชัดเจน ลองเขียนให้ตัวใหญ่และชัดเจนขึ้นครับ");
      }
    } finally {
      setIsConvertingOcr(false);
    }
  };

  const handleRevealClick = async () => {
    if (isDrawingDevice && !hasUserDrawn) return;
    if (!isDrawingDevice && !typedInput.trim()) return;

    let textToCheck = typedInput.trim();
    if (isDrawingDevice && !textToCheck && drawingDataUrl) {
      setIsConvertingOcr(true);
      try {
        const recognized = await recognizeHandwritingFromDataUrl(drawingDataUrl);
        if (recognized) {
          textToCheck = recognized;
          setTypedInput(recognized);
        }
      } finally {
        setIsConvertingOcr(false);
      }
    }

    let newStatus: "IDLE" | "CORRECT" | "WRONG" = "IDLE";
    let isCorrect = false;
    if (textToCheck.length > 0 && vocab) {
      if (checkIsCorrectAnswer(textToCheck, vocab, practiceDirection)) {
        newStatus = "CORRECT";
        isCorrect = true;
        recordGuestWordCompletion(vocab.id, selectedCollectionId || vocab.collectionId, vocab.category);
        incrementGuestCountSafely();
      } else {
        newStatus = "WRONG";
        isCorrect = false;
      }
    } else if (isDrawingDevice && hasUserDrawn) {
      newStatus = "WRONG";
      isCorrect = false;
    } else {
      newStatus = "IDLE";
    }
    setAnswerStatus(newStatus);
    setShowAnswer(true);
    syncCurrentToHistory({ showAnswer: true, answerStatus: newStatus, typedInput: textToCheck });

    if (vocab && (newStatus === "CORRECT" || newStatus === "WRONG")) {
      const answerRecord: SessionRecordedAnswer = {
        vocabId: vocab.id,
        word: vocab.word,
        meaning: vocab.meaning,
        userTypedInput: textToCheck || (isDrawingDevice && hasUserDrawn ? "(วาดจากลายมือแต่ไม่ถูกต้อง)" : "(ยังไม่ได้ระบุคำตอบ)"),
        correctAnswerText: `${vocab.word} = ${vocab.meaning}`,
        isCorrect,
      };

      setRecordedAnswers((prev) => {
        if (prev.some((a) => a.vocabId === vocab.id)) return prev;
        return [...prev, answerRecord];
      });
    }
  };

  const incrementGuestCountSafely = useCallback(() => {
    if (mode === "GUEST" && vocab && !recordedAnswers.some((a) => a.vocabId === vocab.id) && historyIndex >= history.length - 1) {
      setGuestCompletedCount((prev) => prev + 1);
    }
  }, [mode, vocab, recordedAnswers, historyIndex, history.length]);

  // Calculate Progress Stats based on exact word order in collection ("เรียงตามนั้น")
  const totalWords = vocab?.meta?.progress?.totalWords || 1;
  const dbCompleted = vocab?.meta?.progress?.completedWords || 0;
  const activeColKey = selectedCollectionId || vocab?.collectionId || selectedCategory || "";
  const guestStorageCount = isMounted && activeColKey ? getCompletedWordIds(activeColKey).length : 0;
  const completedWords = mode === "AUTHENTICATED"
    ? dbCompleted
    : (isMounted ? Math.max(guestStorageCount, guestCompletedCount) : (dbCompleted || guestCompletedCount));
  const currentWordNumber = vocab?.meta?.progress?.wordIndex || (historyIndex >= 0 ? Math.min(totalWords, historyIndex + 1) : 1);
  const completedPercent = Math.min(100, Math.round((completedWords / totalWords) * 100));

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
  const displayPhonetic = getPhoneticForWord(displayWord, vocab);
  const displaySynonyms =
    isTypedCorrectAndDifferent && vocab
      ? [
          vocab.word,
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

  if (showSummaryModal) {
    const total = recordedAnswers.length;
    const correct = recordedAnswers.filter((a) => a.isCorrect).length;
    const wrong = total - correct;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <div className="absolute inset-0 w-full h-full overflow-y-auto bg-[#f8fafc] text-slate-900 font-sans p-4 sm:p-8 md:p-12 z-50">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col my-auto">
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-900 text-white flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              สรุปผลการฝึกซ้อมรอบนี้
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold">ผลลัพธ์การฝึกเขียนคำศัพท์</h2>
            <p className="text-slate-300 text-xs sm:text-sm">
              ระบบได้ทำการสรุปคำศัพท์ที่คุณฝึกซ้อมเรียบร้อยแล้ว
            </p>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 flex flex-col gap-6">
            {isSavingSummary ? (
              <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl flex items-center gap-3 text-indigo-900 font-bold text-sm">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
                <span>กำลังบันทึกสรุปผลการฝึกซ้อม...</span>
              </div>
            ) : savedSessionSummary ? (
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 font-bold text-sm">
                <span>บันทึกผลการฝึกซ้อมเรียบร้อยแล้ว</span>
              </div>
            ) : null}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4.5 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">คำศัพท์ทั้งหมด</span>
                <p className="text-3xl font-extrabold text-slate-900 mt-1">{total} <span className="text-sm font-bold text-slate-500">คำ</span></p>
              </div>
              <div className="p-4.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-center">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">ตอบถูกต้อง</span>
                <p className="text-3xl font-extrabold text-emerald-600 mt-1">{correct} <span className="text-sm font-bold text-emerald-700">คำ</span></p>
              </div>
              <div className="p-4.5 bg-rose-50/60 border border-rose-200 rounded-2xl text-center">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wide">เสียไป/ผิดพลาด</span>
                <p className="text-3xl font-extrabold text-rose-600 mt-1">{wrong} <span className="text-sm font-bold text-rose-700">คำ</span></p>
              </div>
              <div className="p-4.5 bg-indigo-50/60 border border-indigo-200 rounded-2xl text-center">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">ความแม่นยำ</span>
                <p className="text-3xl font-extrabold text-indigo-600 mt-1">{pct}%</p>
              </div>
            </div>

            {/* Detailed Words Table */}
            <div>
              <h3 className="text-base font-extrabold text-slate-900 mb-3.5">
                รายละเอียดคำศัพท์แต่ละข้อ (เขียนว่าอะไร • ถูกต้องเขียนอย่างไร)
              </h3>
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="p-3.5 w-14 text-center">ลำดับ</th>
                        <th className="p-3.5">คำศัพท์</th>
                        <th className="p-3.5 w-24 text-center">ผลลัพธ์</th>
                        <th className="p-3.5">สิ่งที่คุณเขียน / ตอบ</th>
                        <th className="p-3.5">เฉลยถูกต้องเขียนอย่างไร</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recordedAnswers.map((item, idx) => (
                        <tr key={idx} className={item.isCorrect ? "bg-emerald-50/30 hover:bg-emerald-50/60 transition-colors" : "bg-rose-50/30 hover:bg-rose-50/60 transition-colors"}>
                          <td className="p-3.5 text-center font-mono font-bold text-slate-400">#{idx + 1}</td>
                          <td className="p-3.5 font-bold text-slate-900">{item.word}</td>
                          <td className="p-3.5 text-center">
                            {item.isCorrect ? (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 text-xs">
                                ถูกต้อง
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-bold rounded-lg border border-rose-200 text-xs">
                                เสียไป
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 font-semibold text-slate-800">
                            {item.userTypedInput || (item.isCorrect ? item.word : "- ไม่ได้ระบุ -")}
                          </td>
                          <td className="p-3.5 font-bold text-indigo-700">
                            {item.correctAnswerText}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              href="/"
              className="cursor-pointer w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-700 font-bold text-xs sm:text-sm text-center border border-slate-200 transition-all"
            >
              กลับไปเลือกหมวดคำศัพท์
            </Link>
            <button
              type="button"
              onClick={() => {
                setRecordedAnswers([]);
                setShowSummaryModal(false);
                setSavedSessionSummary(null);
                const storageKey = `vocab_practice_state_${selectedCollectionId || selectedCategory || "general"}`;
                try { localStorage.removeItem(storageKey); } catch (e) {}
                setHistory([]);
                setHistoryIndex(-1);
                setGuestCompletedCount(0);
                fetchNextVocab(true);
              }}
              className="cursor-pointer w-full sm:w-auto px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm transition-all text-center shadow-xs"
            >
              ฝึกซ้อมรอบใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden text-slate-900 font-sans bg-[#f8fafc]">
      {loading ? (
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-12 bg-[#f8fafc] gap-4 animate-pulse">
          <div className="h-10 w-64 bg-slate-200 rounded-2xl" />
          <div className="h-6 w-48 bg-slate-100 rounded-xl" />
          <span className="text-sm font-semibold text-slate-400 mt-2">กำลังเตรียมคำศัพท์และแบบฝึกหัด...</span>
        </div>
      ) : error ? (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center p-6 bg-[#f8fafc]">
          <div className="p-8 bg-white border border-rose-200 rounded-3xl text-rose-800 text-center flex flex-col items-center gap-4 shadow-sm max-w-md">
            <p className="font-bold text-base">{error}</p>
            <button
              type="button"
              onClick={() => fetchNextVocab(false)}
              className="cursor-pointer px-6 py-3 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
      ) : vocab ? (
        <>
          {/* Top Universal Progress Navbar */}
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 z-30 pointer-events-none flex justify-center">
            <div className="w-full max-w-5xl pointer-events-auto bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 shrink-0">
                <Link
                  href={vocab.collectionId ? `/collection/${vocab.collectionId}` : "/"}
                  className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all"
                >
                  <span>กลับหน้าหลัก</span>
                </Link>
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold border border-indigo-200/60">
                  {(() => {
                    const colKey = selectedCollectionId || vocab.collectionId || selectedCategory || "";
                    const meta = getCollectionMeta(colKey);
                    return meta ? meta.title : colKey || "TGAT 1";
                  })()}
                </span>
                {(() => {
                  const colKey = selectedCollectionId || vocab.collectionId || selectedCategory || "";
                  const meta = getCollectionMeta(colKey);
                  if (!meta || !meta.cefrLevel) return null;
                  const cefr = getCefrBadgeProps(meta.cefrLevel);
                  return (
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${cefr.colorClass}`}>
                      {cefr.badgeText}
                    </span>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("ต้องการเริ่มแบบฝึกซ้อมชุดนี้ใหม่ตั้งแต่ต้น (สุ่มคำเริ่มต้นใหม่) หรือไม่?")) {
                      const storageKey = `vocab_practice_state_${selectedCollectionId || selectedCategory || "general"}`;
                      try { localStorage.removeItem(storageKey); } catch (e) {}
                      setHistory([]);
                      setHistoryIndex(-1);
                      setRecordedAnswers([]);
                      setGuestCompletedCount(0);
                      fetchNextVocab(true);
                    }
                  }}
                  className="cursor-pointer px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-[11px] font-bold text-slate-600 transition-all border border-slate-200/80"
                  title="เริ่มฝึกฝนใหม่ตั้งแต่ต้น"
                >
                  เริ่มใหม่
                </button>
              </div>

              {/* Word Progress Bar (% & Counter) */}
              <div className="w-full sm:w-auto flex items-center gap-3">
                <div className="w-full sm:w-80 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>
                      คำที่ {currentWordNumber} / {totalWords} | ความคืบหน้า {completedWords} คำ
                    </span>
                    <span className="text-indigo-600 font-mono font-bold">{completedPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden p-0 border border-slate-200">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${completedPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              UNIFIED PRACTICE VIEW (All Devices: PC, Laptop, Tablet, iPad, Mobile)
              - Background: iPad 32x32px Grid on all devices
              - Direction: TH_TO_EN only (prompt is Thai meaning, user enters English word)
              - Input: Standard text input (Scribble on iPad / keyboard on PC/Mobile)
              ========================================================================= */}
          <div
            className="absolute inset-0 w-full h-full flex flex-col justify-between p-6 sm:p-10 z-10 overflow-y-auto pt-24 sm:pt-28"
            style={{
              backgroundColor: "#ffffff",
              backgroundImage: `linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)`,
              backgroundSize: "32px 32px",
            }}
          >
            <div className="w-full max-w-3xl mx-auto my-auto flex flex-col items-center justify-center gap-8 py-4">
              {!showAnswer && (
                <div className="text-center flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    คำแปลภาษาไทย (เขียนหรือพิมพ์คำศัพท์อังกฤษ)
                  </span>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                    {vocab.meaning}
                  </h1>
                </div>
              )}

              {!showAnswer ? (
                <div className="w-full flex flex-col items-center gap-5">
                  <input
                    type="text"
                    autoFocus
                    placeholder={
                      isDrawingDevice
                        ? "เขียนคำศัพท์ภาษาอังกฤษที่นี่...."
                        : "พิมพ์คำศัพท์ภาษาอังกฤษที่นี่..."
                    }
                    value={typedInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTypedInput(val);
                      if (vocab && checkIsCorrectAnswer(val, vocab, practiceDirection)) {
                        setAnswerStatus("CORRECT");
                        recordGuestWordCompletion(vocab.id, selectedCollectionId || vocab.collectionId, vocab.category);
                        incrementGuestCountSafely();
                        setShowAnswer(true);
                        syncCurrentToHistory({ typedInput: val, answerStatus: "CORRECT", showAnswer: true });

                        const answerRecord: SessionRecordedAnswer = {
                          vocabId: vocab.id,
                          word: vocab.word,
                          meaning: vocab.meaning,
                          userTypedInput: val,
                          correctAnswerText: `${vocab.word} = ${vocab.meaning}`,
                          isCorrect: true,
                        };

                        setRecordedAnswers((prev) => {
                          if (prev.some((a) => a.vocabId === vocab.id)) return prev;
                          return [...prev, answerRecord];
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && typedInput.trim()) {
                        e.preventDefault();
                        if (vocab && checkIsCorrectAnswer(typedInput, vocab, practiceDirection)) {
                          setAnswerStatus("CORRECT");
                          recordGuestWordCompletion(vocab.id, selectedCollectionId || vocab.collectionId, vocab.category);
                          incrementGuestCountSafely();
                          setShowAnswer(true);
                          syncCurrentToHistory({ typedInput: typedInput.trim(), answerStatus: "CORRECT", showAnswer: true });

                          const answerRecord: SessionRecordedAnswer = {
                            vocabId: vocab.id,
                            word: vocab.word,
                            meaning: vocab.meaning,
                            userTypedInput: typedInput.trim(),
                            correctAnswerText: `${vocab.word} = ${vocab.meaning}`,
                            isCorrect: true,
                          };

                          setRecordedAnswers((prev) => {
                            if (prev.some((a) => a.vocabId === vocab.id)) return prev;
                            return [...prev, answerRecord];
                          });
                        } else {
                          setAnswerStatus("WRONG");
                          setShowAnswer(true);
                          syncCurrentToHistory({ typedInput: typedInput.trim(), answerStatus: "WRONG", showAnswer: true });

                          if (vocab) {
                            const answerRecord: SessionRecordedAnswer = {
                              vocabId: vocab.id,
                              word: vocab.word,
                              meaning: vocab.meaning,
                              userTypedInput: typedInput.trim(),
                              correctAnswerText: `${vocab.word} = ${vocab.meaning}`,
                              isCorrect: false,
                            };

                            setRecordedAnswers((prev) => {
                              if (prev.some((a) => a.vocabId === vocab.id)) return prev;
                              return [...prev, answerRecord];
                            });
                          }
                        }
                      }
                    }}
                    className="w-full max-w-2xl px-6 py-5 rounded-2xl border-2 border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none text-center text-xl sm:text-2xl font-bold font-mono text-slate-800 placeholder:text-slate-400 placeholder:font-sans transition-all shadow-sm bg-white/95"
                  />

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={historyIndex <= 0}
                      className="cursor-pointer px-5 py-3 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-slate-200"
                    >
                      ย้อนกลับ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!typedInput.trim()) return;
                        if (vocab && checkIsCorrectAnswer(typedInput, vocab, practiceDirection)) {
                          setAnswerStatus("CORRECT");
                          recordGuestWordCompletion(vocab.id, selectedCollectionId || vocab.collectionId, vocab.category);
                          incrementGuestCountSafely();
                          setShowAnswer(true);
                          syncCurrentToHistory({ typedInput: typedInput.trim(), answerStatus: "CORRECT", showAnswer: true });

                          const answerRecord: SessionRecordedAnswer = {
                            vocabId: vocab.id,
                            word: vocab.word,
                            meaning: vocab.meaning,
                            userTypedInput: typedInput.trim(),
                            correctAnswerText: `${vocab.word} = ${vocab.meaning}`,
                            isCorrect: true,
                          };

                          setRecordedAnswers((prev) => {
                            if (prev.some((a) => a.vocabId === vocab.id)) return prev;
                            return [...prev, answerRecord];
                          });
                        } else {
                          setAnswerStatus("WRONG");
                          setShowAnswer(true);
                          syncCurrentToHistory({ typedInput: typedInput.trim(), answerStatus: "WRONG", showAnswer: true });

                          if (vocab) {
                            const answerRecord: SessionRecordedAnswer = {
                              vocabId: vocab.id,
                              word: vocab.word,
                              meaning: vocab.meaning,
                              userTypedInput: typedInput.trim(),
                              correctAnswerText: `${vocab.word} = ${vocab.meaning}`,
                              isCorrect: false,
                            };

                            setRecordedAnswers((prev) => {
                              if (prev.some((a) => a.vocabId === vocab.id)) return prev;
                              return [...prev, answerRecord];
                            });
                          }
                        }
                      }}
                      disabled={!typedInput.trim()}
                      className="cursor-pointer px-6 py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
                    >
                      ยืนยันคำตอบ
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="cursor-pointer px-5 py-3 rounded-xl font-bold text-sm bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all"
                    >
                      ข้ามคำ
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`pointer-events-auto w-full p-6 rounded-3xl border shadow-xl flex flex-col gap-4 max-h-[75vh] overflow-y-auto transition-all duration-300 ${
                    answerStatus === "CORRECT"
                      ? "bg-emerald-50/90 backdrop-blur-xl border-emerald-400"
                      : "bg-white/95 backdrop-blur-xl border-slate-200"
                  }`}
                >
                  {answerStatus === "CORRECT" && (
                    <div className="w-full p-4 bg-emerald-600 text-white rounded-2xl shadow-xs border border-emerald-500 flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-bold">ถูกต้อง</h3>
                      <span className="px-3 py-1 bg-white text-emerald-900 text-xs font-bold rounded-full uppercase">+1 EXP</span>
                    </div>
                  )}
                  {answerStatus === "WRONG" && (
                    <div className="w-full p-4 bg-rose-600 text-white rounded-2xl shadow-xs border border-rose-500 flex items-center gap-3">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold">ยังไม่ถูกต้อง</h3>
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
                      <span className="text-3xl sm:text-4xl font-black text-slate-900">{displayWord}</span>
                      {displayPhonetic && (
                        <span className="text-base sm:text-lg font-mono text-slate-500">/{displayPhonetic}/</span>
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
                        คำพ้องความหมาย: {displaySynonyms.join(", ")}
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
                          คำแปล: {vocab.exampleTarget}
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
                            className="cursor-pointer py-3 px-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-900 font-bold border border-rose-200 text-xs sm:text-sm transition-all"
                          >
                            จำไม่ได้
                          </button>
                          <button
                            onClick={() => handleSrsReview("hard")}
                            disabled={isReviewing}
                            className="cursor-pointer py-3 px-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border border-amber-200 text-xs sm:text-sm transition-all"
                          >
                            จำยาก
                          </button>
                          <button
                            onClick={() => handleSrsReview("good")}
                            disabled={isReviewing}
                            className="cursor-pointer py-3 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold border border-blue-200 text-xs sm:text-sm transition-all"
                          >
                            จำได้ดี
                          </button>
                          <button
                            onClick={() => handleSrsReview("easy")}
                            disabled={isReviewing}
                            className="cursor-pointer py-3 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold border border-emerald-200 text-xs sm:text-sm transition-all"
                          >
                            ง่ายมาก
                          </button>
                        </div>
                      </>
                    ) : (
                        <div className="flex items-center gap-3 w-full">
                          <button
                            type="button"
                            onClick={handlePrev}
                            disabled={historyIndex <= 0}
                            className="cursor-pointer px-5 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-base disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-slate-200 shadow-xs"
                          >
                            ย้อนกลับ
                          </button>
                          <button
                            onClick={handleNext}
                            className="cursor-pointer flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xs transition-all text-center text-base"
                          >
                            คำศัพท์ถัดไป
                          </button>
                        </div>
                      )}
                      {mode === "AUTHENTICATED" && (
                        <div className="flex justify-start pt-1">
                          <button
                            type="button"
                            onClick={handlePrev}
                            disabled={historyIndex <= 0}
                            className="cursor-pointer px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-slate-200 shadow-xs"
                          >
                            ย้อนกลับไปคำก่อนหน้า
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
        </>
      ) : null}
    </div>
  );
}
