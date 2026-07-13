"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

interface DrawingPadProps {
  wordToPractice?: string;
  onClear?: () => void;
  className?: string;
}

export default function DrawingPad({
  wordToPractice = "",
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
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {/* Controls & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
            ปากกา (Pencil)
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
              className={`w-7 h-7 rounded-full border-2 transition-transform ${
                strokeColor === item.color
                  ? "scale-110 border-indigo-600 ring-2 ring-indigo-300 dark:ring-indigo-700"
                  : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: item.color }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            aria-label="ย้อนกลับการเขียนก่อนหน้า (Undo)"
            className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ↩️ ย้อนกลับ (Undo)
          </button>
          <button
            type="button"
            onClick={handleClear}
            aria-label="ล้างกระดานเขียนคำศัพท์ (Clear Canvas)"
            className="px-3 py-1.5 text-xs font-medium rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
          >
            🗑️ ล้างกระดาน (Clear)
          </button>
        </div>
      </div>

      {/* iPad Apple Pencil Canvas Area */}
      <div className="relative w-full h-[320px] sm:h-[400px] md:h-[460px] bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden shadow-inner">
        {/* Subtle Watermark Word Guideline for Practice */}
        {!hasDrawn && wordToPractice && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-10 dark:opacity-5 text-center px-4"
            aria-hidden="true"
          >
            <span className="text-5xl sm:text-7xl md:text-8xl font-black tracking-widest text-slate-900 dark:text-slate-100 font-mono">
              {wordToPractice}
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
          className="w-full h-full cursor-crosshair focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-2xl"
          style={{ touchAction: "none" }} // CRITICAL: Prevents iPad Safari page scrolling/zooming when drawing with Apple Pencil
          tabIndex={0}
        />
      </div>
    </div>
  );
}
