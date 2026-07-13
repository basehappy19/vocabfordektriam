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

function getCefrFromNumber(num: number): string {
  switch (num) {
    case 1: return "A1";
    case 2: return "A2";
    case 3: return "B1";
    case 4: return "B2";
    case 5: return "C1";
    case 6: return "C2";
    default: return "B2";
  }
}

async function main() {
  console.log("🌱 Seeding high-yield TCAS / TGAT / A-Level vocabulary with CEFR standard levels...");

  const initialVocab = [
    {
      word: "ubiquitous",
      meaning: "ที่มีอยู่ทุกหนทุกแห่ง, พบเห็นได้ทั่วไป",
      partOfSpeech: "Adjective",
      category: "TGAT-Eng",
      difficultyLevel: 5,
      cefrLevel: "C1",
      phonetic: "yoo-BIK-wih-tus",
      exampleSentence: "Smartphones have become ubiquitous in modern society, allowing people to stay connected anywhere they go.",
      exampleTarget: "สมาร์ตโฟนได้กลายเป็นสิ่งที่พบเห็นได้ทั่วไปในสังคมปัจจุบัน ทำให้ผู้คนสามารถเชื่อมต่อกันได้ทุกที่ที่ไป",
    },
    {
      word: "mitigate",
      meaning: "บรรเทา, ทำให้รุนแรงน้อยลง",
      partOfSpeech: "Verb",
      category: "A-Level",
      difficultyLevel: 4,
      cefrLevel: "B2",
      phonetic: "MIT-ih-gayt",
      exampleSentence: "Planting more trees along the highway will help mitigate air pollution and traffic noise for nearby residents.",
      exampleTarget: "การปลูกต้นไม้เพิ่มขึ้นตามแนวทางหลวงจะช่วยบรรเทามลพิษทางอากาศและเสียงรบกวนจากการจราจรให้แก่ผู้อยู่อาศัยใกล้เคียง",
    },
    {
      word: "meticulous",
      meaning: "พิถีพิถัน, รอบคอบ, ละเอียดลอออย่างยิ่ง",
      partOfSpeech: "Adjective",
      category: "TGAT-Eng",
      difficultyLevel: 5,
      cefrLevel: "C1",
      phonetic: "muh-TIK-yuh-lus",
      exampleSentence: "She is always meticulous about keeping her financial records organized and accurate down to the last cent.",
      exampleTarget: "เธอมักจะพิถีพิถันและรอบคอบในการจัดทำบันทึกทางการเงินให้เป็นระเบียบและถูกต้องเสมอจนถึงเซ็นต์สุดท้าย",
    },
    {
      word: "procrastinate",
      meaning: "ผัดวันประกันพรุ่ง, เลื่อนเวลาออกไปโดยไม่จำเป็น",
      partOfSpeech: "Verb",
      category: "TCAS-Academic",
      difficultyLevel: 4,
      cefrLevel: "B2",
      phonetic: "pro-KRAS-tuh-nayt",
      exampleSentence: "If you procrastinate on starting your project until the final night, the quality of your work will suffer.",
      exampleTarget: "หากคุณผัดวันประกันพรุ่งในการเริ่มทำโปรเจกต์จนถึงคืนสุดท้าย คุณภาพงานของคุณก็จะลดลง",
    },
    {
      word: "alleviate",
      meaning: "บรรเทา, ทำให้รุนแรงน้อยลง, ผ่อนคลาย",
      partOfSpeech: "Verb",
      category: "A-Level",
      difficultyLevel: 5,
      cefrLevel: "C1",
      phonetic: "uh-LEE-vee-ayt",
      exampleSentence: "Taking a short walk in the park can help alleviate chronic stress and clear your mind.",
      exampleTarget: "การเดินเล่นสั้น ๆ ในสวนสาธารณะสามารถช่วยบรรเทาความเครียดเรื้อรังและทำให้จิตใจปลอดโปร่งได้",
    },
  ];

  for (const item of initialVocab) {
    await prisma.vocabulary.upsert({
      where: { word: item.word },
      update: {
        exampleSentence: item.exampleSentence,
        exampleTarget: item.exampleTarget,
        cefrLevel: item.cefrLevel,
        difficultyLevel: item.difficultyLevel,
      },
      create: item,
    });
  }

  // Sync existing vocabulary cefrLevels if needed
  const allVocab = await prisma.vocabulary.findMany();
  for (const v of allVocab) {
    const targetCefr = v.cefrLevel || getCefrFromNumber(v.difficultyLevel);
    await prisma.vocabulary.update({
      where: { id: v.id },
      data: { cefrLevel: targetCefr },
    });
  }

  console.log("✅ Seed completed and all vocabulary items synced with standard CEFR levels (A1..C2)!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
