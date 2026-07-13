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
    setIsSavingSummary(true);
    try {
      const durationSeconds = Math.round((Date.now() - sessionStartTime) / 1000);
      const res = await fetch("/api/vocab/session-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionId: selectedCollectionId || null,
          category: selectedCategory || "GENERAL",
          durationSeconds,
          answers: list,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "success") {
          setSavedSessionSummary(data.sessionSummary);
        }
      }
    } catch (err) {
      console.error("Error saving practice session summary:", err);
    } finally {
      setIsSavingSummary(false);
    }
  }, [recordedAnswers, selectedCollectionId, selectedCategory, sessionStartTime]);

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
    if (vocab && !recordedAnswers.some((a) => a.vocabId === vocab.id)) {
      const skipRecord: SessionRecordedAnswer = {
        vocabId: vocab.id,
        word: vocab.word,
        meaning: vocab.meaning,
        userTypedInput: "- กดข้ามคำ -",
        correctAnswerText: `${vocab.word} = ${vocab.meaning}`,
        isCorrect: false,
      };
      setRecordedAnswers((prev) => [...prev, skipRecord]);
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
    fetchNextVocab();
  }, [historyIndex, history, syncCurrentToHistory, fetchNextVocab, vocab, recordedAnswers]);

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
        recordGuestWordCompletion(vocab.id, vocab.collectionId, vocab.category);
        if (mode === "GUEST") setGuestCompletedCount((prev) => prev + 1);
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
        userTypedInput: textToCheck || (isDrawingDevice && hasUserDrawn ? "(วาดจากลายมือแต่ไม่ถูกต้อง)" : "(กดดูเฉลย)"),
        correctAnswerText: `${vocab.word} = ${vocab.meaning}`,
        isCorrect,
      };

      setRecordedAnswers((prev) => {
        if (prev.some((a) => a.vocabId === vocab.id)) return prev;
        const nextAnswers = [...prev, answerRecord];

        // "ถ้ากดดูเฉลยแล้วผิดถือว่าเสียคำนั้นไปเลย และไปคำต่อไป" -> 2.5s timer so they can see the correct answer briefly before auto-advancing
        setTimeout(() => {
          if (
            nextAnswers.length >= 15 ||
            (vocab.meta?.progress?.totalWords && nextAnswers.length >= vocab.meta.progress.totalWords)
          ) {
            openAndSaveSummary(nextAnswers);
          } else {
            handleNext();
          }
        }, isCorrect ? 1500 : 2500);

        return nextAnswers;
      });
    }
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

              {/* Word Progress Bar (% & Counter) and Summary Button */}
              <div className="w-full sm:w-auto flex items-center gap-3">
                <div className="w-full sm:w-64 flex flex-col gap-1.5">
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

                {recordedAnswers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => openAndSaveSummary()}
                    className="pointer-events-auto px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 shrink-0 transition-all cursor-pointer animate-pulse"
                    title="สรุปผลและเก็บข้อมูลลง Database"
                  >
                    <span>🏆</span>
                    <span>สรุปผล ({recordedAnswers.length} คำ)</span>
                  </button>
                )}
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

              <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none w-full max-w-2xl px-4 flex flex-col items-center justify-center gap-2">
                {typedInput && !showAnswer && (
                  <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-indigo-200 shadow-lg text-sm sm:text-base font-extrabold text-indigo-700 flex items-center gap-2 animate-fadeIn">
                    <span>✏️ ระบบอ่านลายมือได้เป็น: <span className="underline decoration-indigo-400 font-black">{typedInput}</span></span>
                    <button
                      type="button"
                      onClick={() => setTypedInput("")}
                      className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-lg border border-rose-200 hover:bg-rose-100 font-bold ml-1 transition-colors"
                    >
                      ลบ/เขียนใหม่
                    </button>
                  </div>
                )}

                {!showAnswer ? (
                  <div className="pointer-events-auto flex items-center justify-center gap-2 sm:gap-2.5 w-full sm:w-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2.5 rounded-3xl border border-slate-200/80 shadow-2xl flex-wrap">
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={historyIndex <= 0}
                      className="px-3.5 sm:px-4 py-3.5 rounded-2xl font-bold text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-slate-200 flex items-center gap-1 shrink-0"
                    >
                      ⬅️ ย้อนกลับ
                    </button>

                    {hasUserDrawn && !typedInput && (
                      <button
                        type="button"
                        onClick={handleOcrConvertOnly}
                        disabled={isConvertingOcr}
                        className="px-4 py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-all flex items-center gap-1.5 shadow-xs shrink-0"
                      >
                        {isConvertingOcr ? "⏳ กำลังแปลง..." : "✨ แปลงลายมือเป็นข้อความ"}
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={!hasUserDrawn || isConvertingOcr}
                      onClick={handleRevealClick}
                      className={`px-6 sm:px-8 py-3.5 rounded-2xl font-black text-sm sm:text-base transition-all flex items-center justify-center border shadow-md shrink-0 ${
                        hasUserDrawn && !isConvertingOcr
                          ? "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white border-indigo-500 shadow-indigo-600/30 cursor-pointer animate-pulse"
                          : "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-75 shadow-none"
                      }`}
                    >
                      {isConvertingOcr
                        ? "⏳ กำลังตรวจและแปลงลายมือ..."
                        : typedInput
                        ? "✅ ยืนยันตรวจคำตอบ"
                        : "✨ แปลงและตรวจคำตอบ"}
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-3.5 sm:px-4 py-3.5 rounded-2xl font-bold text-xs sm:text-sm bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all cursor-pointer flex items-center gap-1 shrink-0"
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
                          คำพ้องความหมาย: {displaySynonyms.join(", ")}
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
                            const nextAnswers = [...prev, answerRecord];
                            setTimeout(() => {
                              if (
                                nextAnswers.length >= 15 ||
                                (vocab.meta?.progress?.totalWords && nextAnswers.length >= vocab.meta.progress.totalWords)
                              ) {
                                openAndSaveSummary(nextAnswers);
                              } else {
                                handleNext();
                              }
                            }, 1500);
                            return nextAnswers;
                          });
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

      {/* =========================================================================
          PRACTICE SESSION SUMMARY MODAL ("และสรุปตอนหลังเก็บลง db ว่าถูกผิดกี่คำเขียนว่าอะไร ถูกต้องเขียนอย่างไร")
          ========================================================================= */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="p-6 sm:p-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                  🎯 สรุปผลการฝึกซ้อมรอบนี้
                </span>
                <h2 className="text-2xl sm:text-3xl font-black mt-2">ผลลัพธ์และบันทึกข้อมูล</h2>
                <p className="text-indigo-100 text-xs sm:text-sm font-medium mt-1">
                  ระบบได้ทำการสรุปคำศัพท์ที่คุณฝึกซ้อมและเก็บสถิติบังคับลงฐานข้อมูล (DB) เรียบร้อยแล้ว
                </p>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <span className="text-4xl">🏆</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 flex flex-col gap-6">
              {/* Saving status indicator */}
              {isSavingSummary ? (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center gap-3 text-indigo-900 font-bold text-sm">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>⏳ กำลังบันทึกสรุปผลและคำตอบแต่ละข้อลง Database (table: practice_sessions & practice_answers)...</span>
                </div>
              ) : savedSessionSummary ? (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-900 font-bold text-sm shadow-xs">
                  <span className="text-xl">✅</span>
                  <div>
                    <span>บันทึกผลลง Database เรียบร้อยแล้ว (Session ID: <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-xs font-mono">{savedSessionSummary.id}</code>)</span>
                  </div>
                </div>
              ) : null}

              {/* Summary Stats Cards */}
              {(() => {
                const total = recordedAnswers.length;
                const correct = recordedAnswers.filter((a) => a.isCorrect).length;
                const wrong = total - correct;
                const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                      <span className="text-xs font-bold text-slate-500 uppercase">📚 คำศัพท์ทั้งหมด</span>
                      <p className="text-3xl font-black text-slate-800 mt-1">{total} <span className="text-sm font-bold">คำ</span></p>
                    </div>
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                      <span className="text-xs font-bold text-emerald-700 uppercase">✅ ตอบถูกต้อง</span>
                      <p className="text-3xl font-black text-emerald-600 mt-1">{correct} <span className="text-sm font-bold">คำ</span></p>
                    </div>
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center">
                      <span className="text-xs font-bold text-rose-700 uppercase">❌ เสียไป/ผิดพลาด</span>
                      <p className="text-3xl font-black text-rose-600 mt-1">{wrong} <span className="text-sm font-bold">คำ</span></p>
                    </div>
                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-center">
                      <span className="text-xs font-bold text-indigo-700 uppercase">🎯 ความแม่นยำ</span>
                      <p className="text-3xl font-black text-indigo-600 mt-1">{pct}%</p>
                    </div>
                  </div>
                );
              })()}

              {/* Detailed Words Table ("ถูกผิดกี่คำเขียนว่าอะไร ถูกต้องเขียนอย่างไร") */}
              <div>
                <h3 className="text-base font-black text-slate-800 mb-3 flex items-center gap-2">
                  <span>📋</span>
                  <span>รายละเอียดคำศัพท์แต่ละข้อ (เขียนว่าอะไร • ถูกต้องเขียนอย่างไร)</span>
                </h3>
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-600 font-extrabold">
                          <th className="p-3.5 w-14 text-center">ลำดับ</th>
                          <th className="p-3.5">คำศัพท์</th>
                          <th className="p-3.5 w-24 text-center">ผลลัพธ์</th>
                          <th className="p-3.5">สิ่งที่คุณเขียน / ตอบ (`userTypedInput`)</th>
                          <th className="p-3.5">เฉลยถูกต้องเขียนอย่างไร (`correctAnswerText`)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recordedAnswers.map((item, idx) => (
                          <tr key={idx} className={item.isCorrect ? "bg-emerald-50/30 hover:bg-emerald-50/60" : "bg-rose-50/30 hover:bg-rose-50/60"}>
                            <td className="p-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-3.5 font-black text-slate-900">{item.word}</td>
                            <td className="p-3.5 text-center">
                              {item.isCorrect ? (
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-black rounded-lg border border-emerald-300 text-xs">
                                  ✅ ถูกต้อง
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-rose-100 text-rose-800 font-black rounded-lg border border-rose-300 text-xs">
                                  ❌ เสียไป
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 font-extrabold text-slate-800">
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

            {/* Modal Footer */}
            <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <Link
                href="/"
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm text-center transition-all"
              >
                ⬅️ กลับไปเลือกหมวดคำศัพท์ใหม่
              </Link>
              <button
                type="button"
                onClick={() => {
                  setRecordedAnswers([]);
                  setShowSummaryModal(false);
                  setSavedSessionSummary(null);
                  fetchNextVocab();
                }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-sm sm:text-base shadow-lg shadow-indigo-600/25 transition-all cursor-pointer text-center"
              >
                🟢 ฝึกซ้อมรอบใหม่ (Start Fresh) ➡️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
