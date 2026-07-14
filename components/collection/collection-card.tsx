"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getCompletedWordIds, getCollectionPlayCount } from "@/lib/progress";
import { BookOpen, Layers, ChevronRight, CheckCircle2 } from "lucide-react";

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
  const [playCount, setPlayCount] = useState<number>(0);

  useEffect(() => {
    const pCount = getCollectionPlayCount(collection.id);
    setPlayCount(pCount);
    if (isGuest) {
      const guestIds = getCompletedWordIds(collection.id);
      setCompletedCount(Math.min(guestIds.length, collection.totalWordsCount));
    } else {
      setCompletedCount(Math.min(dbCompletedCount, collection.totalWordsCount));
    }
  }, [isGuest, collection.id, dbCompletedCount, collection.totalWordsCount]);

  const percent = collection.totalWordsCount > 0 ? Math.round((Math.min(completedCount, collection.totalWordsCount) / collection.totalWordsCount) * 100) : 0;

  // Clean title & description to ensure no brackets or emojis
  const cleanTitle = collection.title.replace(/\s*\([^)]*\)/g, "").trim();
  const cleanDesc = collection.description.replace(/\s*\([^)]*\)/g, "").trim();

  return (
    <div className="group relative flex flex-col justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all duration-200">
      <Link href={`/collection/${collection.id}`} className="cursor-pointer flex flex-col gap-3 flex-1 focus:outline-none">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 bg-slate-900 text-white rounded-full text-xs font-bold tracking-wide shadow-2xs">
              {collection.category}
            </span>
            {playCount > 0 && (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70 shadow-2xs flex items-center gap-1">
                เล่นไปแล้ว {playCount} ครั้ง
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/60 tracking-wide">
            {collection.cefrLevel}
          </span>
        </div>

        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors leading-snug">
            {cleanTitle}
          </h3>
          <p className="text-xs text-slate-500 font-normal leading-relaxed mt-1 line-clamp-2">
            {cleanDesc}
          </p>
        </div>
      </Link>

      {/* Progress & Action Bar */}
      <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center gap-1.5 font-medium">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>{collection.totalWordsCount} คำ</span>
          </span>
          <span className="flex items-center gap-1 font-medium">
            {percent === 100 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            <span className={percent > 0 ? "text-indigo-600 font-semibold" : "text-slate-400"}>
              {completedCount} / {collection.totalWordsCount}
            </span>
            <span className="text-slate-400">({percent}%)</span>
          </span>
        </div>

        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>

        <Link
          href={`/collection/${collection.id}`}
          className="cursor-pointer flex items-center justify-between pt-1 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors group-hover:translate-x-0.5"
        >
          <span>เข้าสู่คลังคำศัพท์</span>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
        </Link>
      </div>
    </div>
  );
}
