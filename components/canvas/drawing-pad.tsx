"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

interface DrawingPadProps {
  wordToPractice?: string;
  showGuidelineWord?: boolean;
  onClear?: () => void;
  className?: string;
}

export default function DrawingPad({
  wordToPractice = "",
  showGuidelineWord = false,
  onClear,
  className = "",
}: DrawingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#4f46e5"); // Indigo-600 default
  const [lineWidth, setLineWidth] = useState(6);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);

  // Initialize canvas and resize observer for crisp Retina/iPad display without blurriness
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Save existing drawing if resizing
    let existingData: ImageData | null = null;
    if (canvas.width > 0 && canvas.height > 0) {
      try {
        existingData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch (e) {
        // Ignore CORS issues if any
      }
    }

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;

    if (existingData) {
      ctx.putImageData(existingData, 0, 0);
    } else {
      // Clear with transparent or subtle background
      ctx.clearRect(0, 0, rect.width, rect.height);
    }
  }, [strokeColor, lineWidth]);

  useEffect(() => {
    setupCanvas();
    window.addEventListener("resize", setupCanvas);
    return () => window.removeEventListener("resize", setupCanvas);
  }, [setupCanvas]);

  // Update stroke styles on change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
  }, [strokeColor, lineWidth]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-10), data]); // Keep last 10 states for undo
  };

  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Capture pointer specifically for Apple Pencil high frequency polling
    canvas.setPointerCapture(e.pointerId);

    saveToHistory();
    setIsDrawing(true);
    setHasDrawn(true);

    const pos = getPointerPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);

    // Apply pressure sensitivity if available (Apple Pencil returns e.pressure from 0.0 to 1.0)
    if (e.pointerType === "pen" && e.pressure > 0) {
      ctx.lineWidth = Math.max(3, lineWidth * (e.pressure * 1.5));
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high frequency Apple Pencil events if getCoalescedEvents is supported
    const events =
      typeof e.nativeEvent.getCoalescedEvents === "function"
        ? e.nativeEvent.getCoalescedEvents()
        : [e.nativeEvent];

    for (const event of events) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (event.pointerType === "pen" && event.pressure > 0) {
        ctx.lineWidth = Math.max(3, lineWidth * (event.pressure * 1.5));
      }
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    saveToHistory();
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    if (onClear) onClear();
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lastState = history[history.length - 1];
    ctx.putImageData(lastState, 0, 0);
    setHistory((prev) => prev.slice(0, -1));
  };

  return (
    <div className={`flex-1 w-full flex flex-col ${className || ""}`}>
      {/* iPad Apple Pencil Massive Full-Screen Grid Canvas Area with Floating GoodNotes Toolbar */}
      <div
        className="relative w-full min-h-[580px] sm:min-h-[680px] md:min-h-[760px] flex-1 rounded-3xl border-2 border-slate-300 overflow-hidden shadow-inner transition-all flex flex-col"
        style={{
          backgroundColor: "#ffffff",
          backgroundImage: `linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      >
        {/* Floating GoodNotes-style Toolbar inside top-right of canvas */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 sm:gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-200/80 shadow-md">
          <span className="text-[11px] font-bold text-slate-500 hidden sm:inline mr-1">
            🎨 สีปากกา:
          </span>
          {[
            { color: "#4f46e5", label: "น้ำเงิน Indigo" },
            { color: "#0f172a", label: "ดำ Slate Black" },
            { color: "#e11d48", label: "แดง Rose" },
            { color: "#059669", label: "เขียว Emerald" },
          ].map((item) => (
            <button
              key={item.color}
              type="button"
              onClick={() => setStrokeColor(item.color)}
              aria-label={`เปลี่ยนสีปากกาเป็นสี${item.label}`}
              aria-pressed={strokeColor === item.color}
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 transition-all ${
                strokeColor === item.color
                  ? "scale-110 border-indigo-600 ring-2 ring-indigo-200 shadow-xs"
                  : "border-transparent hover:scale-105 opacity-85 hover:opacity-100"
              }`}
              style={{ backgroundColor: item.color }}
            />
          ))}

          <span className="w-px h-5 bg-slate-200 mx-1 hidden sm:inline-block" />

          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            aria-label="ย้อนกลับการเขียนก่อนหน้า (Undo)"
            className="px-2.5 py-1 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-slate-200/80"
          >
            ↩️ ย้อนกลับ
          </button>
          <button
            type="button"
            onClick={handleClear}
            aria-label="ล้างกระดานเขียนคำศัพท์ (Clear Canvas)"
            className="px-2.5 py-1 text-xs font-semibold rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-200/80"
          >
            🗑️ ล้างกระดาน
          </button>
        </div>
        {/* Subtle Watermark Guideline (Only when showGuidelineWord is true) */}
        {!hasDrawn && wordToPractice && showGuidelineWord && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-10 text-center px-4"
            aria-hidden="true"
          >
            <span className="text-5xl sm:text-7xl md:text-8xl font-black tracking-widest text-slate-900 font-mono">
              {wordToPractice}
            </span>
          </div>
        )}

        {/* Clean iPad handwriting guidance watermark/lines when blank */}
        {!hasDrawn && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none opacity-20 text-center px-6"
            aria-hidden="true"
          >
            <span className="text-sm sm:text-base font-semibold text-slate-400 border-b border-dashed border-slate-300 pb-1">
              ✍️ พื้นที่สำหรับเขียนคำศัพท์ด้วย Apple Pencil (หรือนิ้วมือ)
            </span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          aria-label={`กระดานคัดเขียนคำศัพท์ภาษาอังกฤษสำหรับ Apple Pencil (iPad Drawing Canvas for word: ${wordToPractice})`}
          role="img"
          className="w-full h-full cursor-crosshair focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-3xl"
          style={{ touchAction: "none" }} // CRITICAL: Prevents iPad Safari page scrolling/zooming when drawing with Apple Pencil
          tabIndex={0}
        />
      </div>
    </div>
  );
}
