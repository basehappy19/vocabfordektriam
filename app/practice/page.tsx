import React, { Suspense } from "react";
import PracticeSessionWrapper from "./practice-wrapper";

export const metadata = {
  title: "โหมดเขียนคัดและท่องจำคำศัพท์ | VocabForDekTriam",
  description: "โหมดฝึกเขียนคำศัพท์ภาษาอังกฤษบน iPad ด้วย Apple Pencil เต็มหน้าจอ 100%",
};

export default function PracticePage() {
  return (
    <div className="w-screen h-screen fixed inset-0 overflow-hidden bg-white text-slate-900 font-sans">
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-3 animate-pulse">
              <span className="text-4xl">✍️</span>
              <span className="text-sm font-bold text-slate-500">กำลังเปิดกระดานเขียนคำศัพท์เต็มหน้าจอ...</span>
            </div>
          </div>
        }
      >
        <PracticeSessionWrapper />
      </Suspense>
    </div>
  );
}
