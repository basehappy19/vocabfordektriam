import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

try {
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf-8");
    envFile.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const firstEqIndex = trimmed.indexOf("=");
        const key = trimmed.slice(0, firstEqIndex).trim();
        let val = trimmed.slice(firstEqIndex + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
} catch (e) {}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding initial high-yield TCAS / TGAT / A-Level vocabulary...");

  const initialVocab = [
    {
      word: "ubiquitous",
      meaning: "ที่มีอยู่ทุกหนทุกแห่ง, พบเห็นได้ทั่วไป",
      partOfSpeech: "Adjective",
      category: "TGAT-Eng",
      difficultyLevel: 4,
      phonetic: "yoo-BIK-wih-tus",
      // Left NULL intentionally to test and demonstrate Cost-Saving Lazy AI Generation!
      exampleSentence: null,
      exampleTarget: null,
    },
    {
      word: "mitigate",
      meaning: "บรรเทา, ทำให้รุนแรงน้อยลง",
      partOfSpeech: "Verb",
      category: "A-Level",
      difficultyLevel: 3,
      phonetic: "MIT-ih-gayt",
      exampleSentence: null,
      exampleTarget: null,
    },
    {
      word: "meticulous",
      meaning: "พิถีพิถัน, รอบคอบ, ละเอียดลอออย่างยิ่ง",
      partOfSpeech: "Adjective",
      category: "TGAT-Eng",
      difficultyLevel: 4,
      phonetic: "muh-TIK-yuh-lus",
      exampleSentence: null,
      exampleTarget: null,
    },
    {
      word: "procrastinate",
      meaning: "ผัดวันประกันพรุ่ง, เลื่อนเวลาออกไปโดยไม่จำเป็น",
      partOfSpeech: "Verb",
      category: "TCAS-Academic",
      difficultyLevel: 3,
      phonetic: "pro-KRAS-tuh-nayt",
      exampleSentence: null,
      exampleTarget: null,
    },
  ];

  for (const item of initialVocab) {
    await prisma.vocabulary.upsert({
      where: { word: item.word },
      update: {},
      create: item,
    });
  }

  console.log("✅ Seed completed successfully! Words added with null exampleSentence to test Lazy AI Generation.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
