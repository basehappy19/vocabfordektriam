"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import PracticeSession from "@/components/practice/practice-session";

export default function PracticeSessionWrapper() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") || "";

  return <PracticeSession initialCategory={categoryParam} />;
}
