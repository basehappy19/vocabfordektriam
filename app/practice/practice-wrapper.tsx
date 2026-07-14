"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import PracticeSession from "@/components/practice/practice-session";

interface PracticeSessionWrapperProps {
  initialVocab?: any | null;
  initialCategory?: string;
  initialCollectionId?: string;
  initialMode?: "GUEST" | "AUTHENTICATED";
}

export default function PracticeSessionWrapper({
  initialVocab = null,
  initialCategory = "",
  initialCollectionId = "",
  initialMode = "GUEST",
}: PracticeSessionWrapperProps) {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") || initialCategory;
  const collectionIdParam = searchParams.get("collectionId") || initialCollectionId;

  return (
    <PracticeSession
      initialCategory={categoryParam}
      initialCollectionId={collectionIdParam}
      initialVocab={initialVocab}
      initialMode={initialMode}
    />
  );
}
