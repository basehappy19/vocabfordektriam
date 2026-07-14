"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import CollectionCard from "@/components/collection/collection-card";
import { Search, Sparkles, BookOpen, GraduationCap, Calendar, Layers, X } from "lucide-react";

interface CollectionData {
  id: string;
  title: string;
  description: string;
  category: string;
  cefrLevel: string;
  icon: string;
  color: string;
  badge: string;
  badgeColor: string;
  isRecommended: boolean;
  totalWordsCount: number;
}

interface DecksLibraryClientProps {
  collections: CollectionData[];
  isGuest: boolean;
  dbProgressMap: Record<string, number>;
}

export default function DecksLibraryClient({
  collections,
  isGuest,
  dbProgressMap,
}: DecksLibraryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const categories = [
    { id: "ALL", label: "ทั้งหมด", colorClass: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm" },
    { id: "RECOMMENDED", label: "แนะนำ", colorClass: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm" },
    { id: "TGAT1", label: "TGAT 1", colorClass: "bg-purple-600 text-white hover:bg-purple-700 shadow-sm" },
    { id: "A-Level", label: "A-Level 82", colorClass: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" },
    { id: "2568", label: "ปี 2568", colorClass: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm" },
    { id: "2567", label: "ปี 2567", colorClass: "bg-amber-600 text-white hover:bg-amber-700 shadow-sm" },
    { id: "2566", label: "ปี 2566", colorClass: "bg-cyan-600 text-white hover:bg-cyan-700 shadow-sm" },
  ];

  const filteredCollections = useMemo(() => {
    return collections.filter((col) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        query === "" ||
        col.title.toLowerCase().includes(query) ||
        col.description.toLowerCase().includes(query) ||
        col.badge.toLowerCase().includes(query) ||
        col.category.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (selectedCategory === "ALL") return true;
      if (selectedCategory === "RECOMMENDED") return col.isRecommended;
      if (selectedCategory === "TGAT1") return col.category === "TGAT1";
      if (selectedCategory === "A-Level") return col.category === "A-Level";
      if (selectedCategory === "2568") return col.id.includes("68") || col.title.includes("2568") || col.title.includes("68");
      if (selectedCategory === "2567") return col.id.includes("67") || col.title.includes("2567") || col.title.includes("67");
      if (selectedCategory === "2566") return col.id.includes("66") || col.title.includes("2566") || col.title.includes("66");

      return true;
    });
  }, [collections, searchQuery, selectedCategory]);

  const recommendedFiltered = filteredCollections.filter((c) => c.isRecommended);
  const tgat1Filtered = filteredCollections.filter((c) => c.category === "TGAT1");
  const aLevelFiltered = filteredCollections.filter((c) => c.category === "A-Level");

  const isFilterActive = selectedCategory !== "ALL" || searchQuery.trim() !== "";

  return (
    <div className="w-full flex flex-col items-center gap-8 py-4 sm:py-6">
      {/* Title & Subtitle - Clean, Minimalist, No Emojis, No Brackets */}
      <div className="text-center max-w-2xl flex flex-col gap-2 pt-2 px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
          คลังคำศัพท์ข้อสอบจริง
        </h1>
        <p className="text-sm sm:text-base text-slate-500 font-normal">
          เลือกฝึกคำศัพท์และพ้องความหมายตามปีข้อสอบหรือหมวดหมู่ที่ต้องการ
        </p>
      </div>

      {/* Pill Search Bar */}
      <div className="w-full max-w-2xl px-4">
        <div className="relative flex items-center w-full">
          <Search className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาคลังคำศัพท์..."
            className="w-full pl-11 pr-10 py-3 rounded-full bg-slate-100 border border-transparent focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/60 text-sm font-medium text-slate-800 placeholder:text-slate-400 transition-all outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="cursor-pointer absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              title="ล้างการค้นหา"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Colorful / Clean Category Pills */}
      <div className="w-full max-w-4xl px-4 flex items-center justify-center flex-wrap gap-2 sm:gap-2.5 pb-2">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`cursor-pointer px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                isSelected
                  ? `${cat.colorClass} scale-102 ring-2 ring-offset-2 ring-slate-300`
                  : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 active:scale-98"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Decks Grid Sections */}
      <div className="w-full flex flex-col gap-10 px-4 mt-2">
        {isFilterActive ? (
          /* Filtered Unified View */
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
                  ผลการค้นหาคลังคำศัพท์
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">
                  {filteredCollections.length} ชุด
                </span>
              </div>
              {isFilterActive && (
                <button
                  onClick={() => {
                    setSelectedCategory("ALL");
                    setSearchQuery("");
                  }}
                  className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  แสดงทั้งหมด
                </button>
              )}
            </div>

            {filteredCollections.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/60 flex flex-col items-center justify-center gap-3">
                <Layers className="w-8 h-8 text-slate-300" />
                <p className="text-sm text-slate-500 font-medium">ไม่พบคลังคำศัพท์ที่ตรงเงื่อนไขการค้นหา</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCollections.map((col) => (
                  <CollectionCard
                    key={col.id}
                    collection={col}
                    isGuest={isGuest}
                    dbCompletedCount={dbProgressMap[col.id] || 0}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          /* Default Library Sections */
          <>
            {/* Recommended Section */}
            {recommendedFiltered.length > 0 && (
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
                      ยอดนิยม
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">
                      {recommendedFiltered.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedCategory("RECOMMENDED")}
                    className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    ดูทั้งหมด
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendedFiltered.map((col) => (
                    <CollectionCard
                      key={col.id}
                      collection={col}
                      isGuest={isGuest}
                      dbCompletedCount={dbProgressMap[col.id] || 0}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* TGAT1 Section */}
            {tgat1Filtered.length > 0 && (
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
                      TGAT 1
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">
                      {tgat1Filtered.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedCategory("TGAT1")}
                    className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    ดูทั้งหมด
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tgat1Filtered.map((col) => (
                    <CollectionCard
                      key={col.id}
                      collection={col}
                      isGuest={isGuest}
                      dbCompletedCount={dbProgressMap[col.id] || 0}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* A-Level Section */}
            {aLevelFiltered.length > 0 && (
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
                      A-Level 82
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">
                      {aLevelFiltered.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedCategory("A-Level")}
                    className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    ดูทั้งหมด
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {aLevelFiltered.map((col) => (
                    <CollectionCard
                      key={col.id}
                      collection={col}
                      isGuest={isGuest}
                      dbCompletedCount={dbProgressMap[col.id] || 0}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
