import dynamic from "next/dynamic";
import React from "react";

// Lazy-load the heavy iPad drawing canvas with ssr: false to guarantee fast initial HTML rendering & > 90 Lighthouse score
const DynamicDrawingPad = dynamic(
  () => import("./drawing-pad"),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full flex flex-col gap-3 animate-pulse"
        role="status"
        aria-label="กำลังโหลดกระดานเขียนคำศัพท์สำหรับ Apple Pencil (Loading iPad Drawing Canvas)"
      >
        <div className="h-12 w-full bg-slate-200 rounded-xl" />
        <div
          className="w-full min-h-[480px] sm:min-h-[580px] md:min-h-[660px] flex-1 rounded-3xl border-2 border-dashed border-slate-300 flex items-center justify-center shadow-inner"
          style={{
            backgroundColor: "#ffffff",
            backgroundImage: `linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        >
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <svg
              className="w-8 h-8 animate-spin text-indigo-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-sm font-medium">
              กำลังเตรียมกระดาน Apple Pencil...
            </span>
          </div>
        </div>
      </div>
    ),
  }
);

interface CanvasLoaderProps {
  wordToPractice?: string;
  showGuidelineWord?: boolean;
  onClear?: () => void;
  className?: string;
}

export default function CanvasLoader(props: CanvasLoaderProps) {
  return <DynamicDrawingPad {...props} />;
}
