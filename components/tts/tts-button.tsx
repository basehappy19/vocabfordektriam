"use client";

import React, { useState, useEffect, useCallback } from "react";

interface TTSButtonProps {
  text: string;
  lang?: string;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function TTSButton({
  text,
  lang = "en-US",
  label,
  className = "",
  size = "md",
}: TTSButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);
    }
  }, []);

  const handleSpeak = useCallback(() => {
    if (!isSupported || !text) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // Slightly slower for clear Thai student listening
    utterance.pitch = 1.0;

    // Select optimal voice if available (prefer natural iOS/macOS English or Thai voices)
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(
      (v) =>
        v.lang.startsWith(lang.slice(0, 2)) &&
        (v.name.includes("Siri") ||
          v.name.includes("Samantha") ||
          v.name.includes("Narisa") ||
          v.name.includes("Google") ||
          v.name.includes("Natural"))
    );

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [text, lang, isSupported]);

  if (!isSupported) return null;

  const sizeClasses = {
    sm: "p-1.5 text-xs gap-1 rounded-lg",
    md: "px-3 py-2 text-sm gap-2 rounded-xl",
    lg: "px-4 py-2.5 text-base gap-2 rounded-xl",
  }[size];

  const ariaLabelText =
    label ||
    (lang.startsWith("th")
      ? `ฟังเสียงอ่านคำแปลภาษาไทย "${text}"`
      : `Listen to pronunciation of English word "${text}"`);

  return (
    <button
      type="button"
      onClick={handleSpeak}
      aria-label={ariaLabelText}
      aria-pressed={isSpeaking}
      title={ariaLabelText}
      className={`inline-flex items-center justify-center font-bold transition-all duration-200 border shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer select-none ${sizeClasses} ${
        isSpeaking
          ? "bg-indigo-600 text-white border-indigo-600 scale-95 shadow-indigo-500/30"
          : "bg-indigo-50/90 hover:bg-indigo-600 text-indigo-700 hover:text-white border-indigo-200 hover:border-indigo-600 shadow-2xs active:scale-98"
      } ${className}`}
    >
      <svg
        className={`w-4 h-4 ${isSpeaking ? "animate-pulse" : ""}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
        />
      </svg>
      {label && <span>{label}</span>}
      {isSpeaking && (
        <span className="flex gap-0.5 items-center ml-1" aria-hidden="true">
          <span className="w-1 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </span>
      )}
    </button>
  );
}
