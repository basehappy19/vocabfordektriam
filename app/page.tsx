import React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuthNavButtons } from "@/components/auth/auth-buttons";
import DecksLibraryClient from "@/components/home/decks-library-client";

export default async function Home() {
  const session = await auth();
  const user = session?.user;
  const isGuest = !user?.id;

  // Fetch all collections with total vocabulary counts
  const collections = await prisma.collection.findMany({
    include: {
      _count: {
        select: { vocabulary: true },
      },
    },
    orderBy: { id: "desc" },
  });

  // Calculate DB progress per collection if logged in
  let dbProgressMap: Record<string, number> = {};
  if (!isGuest && user?.id) {
    const userProgress = await prisma.userProgress.findMany({
      where: { userId: user.id },
      include: {
        vocabulary: {
          select: {
            collections: {
              select: { id: true },
            },
          },
        },
      },
    });
    userProgress.forEach((p) => {
      p.vocabulary?.collections.forEach((col) => {
        dbProgressMap[col.id] = (dbProgressMap[col.id] || 0) + 1;
      });
    });
  }

  const formattedCollections = collections.map((col) => ({
    id: col.id,
    title: col.title,
    description: col.description,
    category: col.category,
    cefrLevel: col.cefrLevel,
    icon: col.icon,
    color: col.color,
    badge: col.badge,
    badgeColor: col.badgeColor,
    isRecommended: col.isRecommended,
    totalWordsCount: col._count.vocabulary,
  }));

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8fafc] text-slate-900 font-sans pb-12">
      {/* Minimalist Header / Navbar */}
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 hover:text-indigo-600 transition-colors"
          >
            VocabForDekTriam
          </Link>

          <AuthNavButtons user={user} />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        <DecksLibraryClient
          collections={formattedCollections}
          isGuest={isGuest}
          dbProgressMap={dbProgressMap}
        />
      </main>

      {/* Minimalist Footer */}
      <footer className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 border-t border-slate-200/60 text-center text-xs text-slate-400 font-medium mt-12">
        © {new Date().getFullYear()} VocabForDekTriam
      </footer>
    </div>
  );
}
