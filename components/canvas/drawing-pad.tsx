"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

interface DrawingPadProps {
  wordToPractice?: string;
  showGuidelineWord?: boolean;
  className?: string;
  onDrawStateChange?: (hasDrawn: boolean) => void;
}

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export default function DrawingPad({
  wordToPractice = "",
  showGuidelineWord = false,
  className = "",
  onDrawStateChange,
}: DrawingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#4f46e5"); // Indigo default
  const [strokeWidth, setStrokeWidth] = useState(4); // Clean smooth stroke
  const [hasDrawn, setHasDrawn] = useState(false);

  const updateHasDrawn = useCallback((val: boolean) => {
    setHasDrawn(val);
    onDrawStateChange?.(val);
  }, [onDrawStateChange]);

  // History stack for Undo capability
  const [history, setHistory] = useState<ImageData[]>([]);
  const currentPointsRef = useRef<{ x: number; y: number }[]>([]);

  // Initialize and resize canvas with crisp Retina display ratio
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Save previous drawing state if any
    let prevImage: ImageData | null = null;
    if (canvas.width > 0 && canvas.height > 0) {
      try {
        prevImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch (e) {
        // Ignore cross-origin canvas errors if any
      }
    }

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    if (prevImage) {
      ctx.putImageData(prevImage, 0, 0);
    }
  }, [strokeColor, strokeWidth]);

  useEffect(() => {
    initCanvas();
    const handleResize = () => initCanvas();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initCanvas]);

  // Update stroke style when color/width change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
  }, [strokeColor, strokeWidth]);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), imageData]); // Keep last 15 steps
  }, []);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Capture Apple Pencil / touch pressure if available
    if (e.pressure > 0 && e.pointerType === "pen") {
      ctx.lineWidth = Math.max(2, strokeWidth * (e.pressure * 1.5));
    } else {
      ctx.lineWidth = strokeWidth;
    }

    canvas.setPointerCapture(e.pointerId);
    saveToHistory();

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();

    setIsDrawing(true);
    updateHasDrawn(true);
    currentPointsRef.current = [{ x, y }];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Adjust line width dynamically for Apple Pencil pressure
    if (e.pressure > 0 && e.pointerType === "pen") {
      ctx.lineWidth = Math.max(2, strokeWidth * (e.pressure * 1.5));
    }

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    currentPointsRef.current.push({ x, y });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    saveToHistory();
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    updateHasDrawn(false);
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
    if (history.length <= 1) {
      updateHasDrawn(false);
    }
  };

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden ${className || ""}`}>
      {/* 100% Full Screen Grid Canvas Area ("ให้กระดานเขียนเต็มจอเลย ที่เหลือลอยทับไปเลย") */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden select-none"
        style={{
          backgroundColor: "#ffffff",
          backgroundImage: `linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      >
        {/* Floating GoodNotes-style Toolbar inside top-right of screen ("เครื่องมือสีต่าง ๆ ลอยคล้าย ๆ Goodnote") */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 pointer-events-auto flex items-center gap-1.5 sm:gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-200/80 shadow-md">
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
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none opacity-25 text-center px-6"
            aria-hidden="true"
          >
            <span className="text-sm sm:text-base font-semibold text-slate-400 border-b border-dashed border-slate-300 pb-1.5">
              ✍️ พื้นที่กระดานเขียนคำศัพท์เต็มหน้าจอด้วย Apple Pencil (หรือนิ้วมือ)
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
          className="absolute inset-0 w-full h-full cursor-crosshair focus:outline-none z-10"
          style={{ touchAction: "none" }} // CRITICAL: Prevents iPad Safari page scrolling/zooming when drawing with Apple Pencil
          tabIndex={0}
        />
      </div>
    </div>
  );
}
