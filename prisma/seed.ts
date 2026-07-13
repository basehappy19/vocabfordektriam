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
  console.log("🌱 Seeding high-yield TCAS / TGAT / A-Level vocabulary with real-life daily usage sentences...");

  const initialVocab = [
    {
      word: "ubiquitous",
      meaning: "ที่มีอยู่ทุกหนทุกแห่ง, พบเห็นได้ทั่วไป",
      partOfSpeech: "Adjective",
      category: "TGAT-Eng",
      difficultyLevel: 4,
      phonetic: "yoo-BIK-wih-tus",
      exampleSentence: "Smartphones have become ubiquitous in modern society, allowing people to stay connected anywhere they go.",
      exampleTarget: "สมาร์ตโฟนได้กลายเป็นสิ่งที่พบเห็นได้ทั่วไปในสังคมปัจจุบัน ทำให้ผู้คนสามารถเชื่อมต่อกันได้ทุกที่ที่ไป",
    },
    {
      word: "mitigate",
      meaning: "บรรเทา, ทำให้รุนแรงน้อยลง",
      partOfSpeech: "Verb",
      category: "A-Level",
      difficultyLevel: 3,
      phonetic: "MIT-ih-gayt",
      exampleSentence: "Planting more trees along the highway will help mitigate air pollution and traffic noise for nearby residents.",
      exampleTarget: "การปลูกต้นไม้เพิ่มขึ้นตามแนวทางหลวงจะช่วยบรรเทามลพิษทางอากาศและเสียงรบกวนจากการจราจรให้แก่ผู้อยู่อาศัยใกล้เคียง",
    },
    {
      word: "meticulous",
      meaning: "พิถีพิถัน, รอบคอบ, ละเอียดลอออย่างยิ่ง",
      partOfSpeech: "Adjective",
      category: "TGAT-Eng",
      difficultyLevel: 4,
      phonetic: "muh-TIK-yuh-lus",
      exampleSentence: "She is always meticulous about keeping her financial records organized and accurate down to the last cent.",
      exampleTarget: "เธอมักจะพิถีพิถันและรอบคอบในการจัดทำบันทึกทางการเงินให้เป็นระเบียบและถูกต้องเสมอจนถึงเซ็นต์สุดท้าย",
    },
    {
      word: "procrastinate",
      meaning: "ผัดวันประกันพรุ่ง, เลื่อนเวลาออกไปโดยไม่จำเป็น",
      partOfSpeech: "Verb",
      category: "TCAS-Academic",
      difficultyLevel: 3,
      phonetic: "pro-KRAS-tuh-nayt",
      exampleSentence: "If you procrastinate on starting your project until the final night, the quality of your work will suffer.",
      exampleTarget: "หากคุณผัดวันประกันพรุ่งในการเริ่มทำโปรเจกต์จนถึงคืนสุดท้าย คุณภาพงานของคุณก็จะลดลง",
    },
    {
      word: "alleviate",
      meaning: "บรรเทา, ทำให้รุนแรงน้อยลง, ผ่อนคลาย",
      partOfSpeech: "Verb",
      category: "A-Level",
      difficultyLevel: 3,
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
      },
      create: item,
    });
  }

  // Also clean up any old meta-study sentences ("Understanding the word...") across the database
  const badRows = await prisma.vocabulary.findMany({
    where: {
      OR: [
        { exampleSentence: { contains: "Understanding the word" } },
        { exampleSentence: { contains: "crucial for achieving high scores" } },
      ],
    },
  });

  for (const row of badRows) {
    console.log(`🧹 Resetting old meta sentence for word: "${row.word}" so it can get real-life usage...`);
    await prisma.vocabulary.update({
      where: { id: row.id },
      data: { exampleSentence: null, exampleTarget: null },
    });
  }

  console.log("✅ Seed completed and real-life daily usage examples updated successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
