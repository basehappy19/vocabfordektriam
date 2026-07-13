"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getCompletedWordIds } from "@/lib/progress";

interface CollectionCardProps {
  collection: {
    id: string;
    title: string;
    description: string;
    category: string;
    cefrLevel: string;
    icon: string;
    color: string;
    badge: string;
    badgeColor: string;
    totalWordsCount: number;
  };
  isGuest: boolean;
  dbCompletedCount?: number;
}

export default function CollectionCard({
  collection,
  isGuest,
  dbCompletedCount = 0,
}: CollectionCardProps) {
  const [completedCount, setCompletedCount] = useState<number>(dbCompletedCount);

  useEffect(() => {
    if (isGuest) {
      const guestIds = getCompletedWordIds(collection.id);
      setCompletedCount(guestIds.length);
    } else {
      setCompletedCount(dbCompletedCount);
    }
  }, [isGuest, collection.id, dbCompletedCount]);

  const percent = collection.totalWordsCount > 0 ? Math.round((completedCount / collection.totalWordsCount) * 100) : 0;

  return (
    <div className={`group relative flex flex-col justify-between gap-5 p-6 rounded-3xl bg-gradient-to-br ${collection.color} bg-white border-2 transition-all duration-200 hover:shadow-xl hover:-translate-y-1.5 active:translate-y-0`}>
      <Link href={`/collection/${collection.id}`} className="flex flex-col gap-3.5 flex-1 focus:outline-none">
        <div className="flex items-center justify-between">
          <span className="text-4xl p-3 bg-white/95 rounded-2xl shadow-2xs border border-slate-100 group-hover:scale-110 transition-transform">
            {collection.icon}
          </span>
          <div className="flex flex-col items-end gap-1">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${collection.badgeColor}`}>
              {collection.badge}
            </span>
            <span className="text-[10px] font-extrabold text-slate-500 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200/60">
              CEFR {collection.cefrLevel}
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors leading-tight">
            {collection.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed mt-1.5">
            {collection.description}
          </p>
        </div>
      </Link>

      {/* Progress Bar inside Card */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200/60">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1">
            <span>⚡ ความคืบหน้า:</span>
            <span className="text-indigo-600 font-extrabold">
              {completedCount} / {collection.totalWordsCount} คำ
            </span>
          </span>
          <span className="text-slate-500 font-mono text-[11px]">{percent}%</span>
        </div>

        <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex items-center justify-between pt-1 text-xs font-black text-indigo-700 group-hover:translate-x-1 transition-transform">
          <span>📖 กดดูคำศัพท์หรือเริ่มฝึกชุดนี้</span>
          <span className="text-base">➡️</span>
        </div>
      </div>
    </div>
  );
}
