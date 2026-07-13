import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import CollectionDetail from "@/components/collection/collection-detail";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CollectionPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  const isGuest = !userId;

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      vocabulary: {
        orderBy: { id: "asc" },
      },
    },
  });

  if (!collection) {
    notFound();
  }

  let dbProgressWordIds: string[] = [];
  if (!isGuest && userId) {
    const progressRows = await prisma.userProgress.findMany({
      where: {
        userId,
        vocabulary: {
          collections: {
            some: { id },
          },
        },
      },
      select: {
        vocabId: true,
      },
    });
    dbProgressWordIds = progressRows.map((r) => r.vocabId);
  }

  return (
    <CollectionDetail
      collection={collection}
      words={collection.vocabulary}
      isGuest={isGuest}
      initialDbProgressIds={dbProgressWordIds}
      userName={session?.user?.name || null}
    />
  );
}
