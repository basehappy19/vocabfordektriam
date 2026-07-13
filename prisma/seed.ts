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
  console.log("🌱 Seeding TGAT1 & A-Level Collections by Year, and Vocabulary with Synonyms...");

  const collections = [
    {
      id: "tgat1-68",
      title: "TGAT1 ปี 68 (ข้อสอบจริงล่าสุด)",
      description: "รวมคำศัพท์และการสื่อสารภาษาอังกฤษที่ออกในข้อสอบ TGAT 1 ปี 2568 เน้นคำศัพท์ที่ต้องรู้และใช้บ่อยในชีวิตประจำวัน",
      category: "TGAT1",
      cefrLevel: "B2",
      icon: "🔥",
      color: "from-blue-500/10 to-indigo-500/10 border-blue-300 hover:border-blue-500",
      badge: "TGAT1 68",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      isRecommended: true,
    },
    {
      id: "tgat1-67",
      title: "TGAT1 ปี 67 (ตะลุยโจทย์สื่อสาร)",
      description: "คำคุณศัพท์ คำกริยา และสำนวนที่ออกสอบจริงใน TGAT 1 ปี 2567 สำหรับฝึกคัดและทบทวนก่อนสอบจริง",
      category: "TGAT1",
      cefrLevel: "B1-B2",
      icon: "📘",
      color: "from-sky-500/10 to-cyan-500/10 border-sky-200/80 hover:border-sky-400",
      badge: "TGAT1 67",
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
      isRecommended: false,
    },
    {
      id: "tgat1-66",
      title: "TGAT1 ปี 66 (ประโยคสนทนาพบบ่อย)",
      description: "คลังคำศัพท์จากข้อสอบ TGAT 1 ปี 2566 เน้นคำกริยาวลีและศัพท์บทสนทนาในที่ทำงานและสังคม",
      category: "TGAT1",
      cefrLevel: "B1-B2",
      icon: "💬",
      color: "from-indigo-500/10 to-violet-500/10 border-indigo-200/80 hover:border-indigo-400",
      badge: "TGAT1 66",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      isRecommended: false,
    },
    {
      id: "alevel-68",
      title: "A-Level ปี 68 (อ่านวิเคราะห์เข้มข้นล่าสุด)",
      description: "รวมคำศัพท์ยากระดับ C1-C2 จากข้อสอบ A-Level 82 ปี 2568 สำหรับทำคะแนนสูงในบทความยาวและ Cloze Test",
      category: "A-Level",
      cefrLevel: "C1",
      icon: "🌟",
      color: "from-purple-500/10 to-pink-500/10 border-purple-300 hover:border-purple-500",
      badge: "A-Level 68",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
      isRecommended: true,
    },
    {
      id: "alevel-67",
      title: "A-Level ปี 67 (เจาะลึกศัพท์กริยาวิชาการ)",
      description: "คำกริยาเชิงวิชาการและคำศัพท์เฉพาะทางที่พบบ่อยในข้อสอบ A-Level ปี 2567",
      category: "A-Level",
      cefrLevel: "C1",
      icon: "📙",
      color: "from-fuchsia-500/10 to-rose-500/10 border-fuchsia-200/80 hover:border-fuchsia-400",
      badge: "A-Level 67",
      badgeColor: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
      isRecommended: false,
    },
    {
      id: "alevel-66",
      title: "A-Level ปี 66 (บทความวิทยาศาสตร์และสังคม)",
      description: "ศัพท์เฉพาะทางเชิงวิทยาศาสตร์ สังคมศาสตร์ และเศรษฐศาสตร์ที่พบบ่อยใน A-Level ปี 2566",
      category: "A-Level",
      cefrLevel: "C1-C2",
      icon: "🔬",
      color: "from-rose-500/10 to-orange-500/10 border-rose-200/80 hover:border-rose-400",
      badge: "A-Level 66",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
      isRecommended: false,
    },
  ];

  for (const col of collections) {
    await prisma.collection.upsert({
      where: { id: col.id },
      update: {
        title: col.title,
        description: col.description,
        category: col.category,
        cefrLevel: col.cefrLevel,
        icon: col.icon,
        color: col.color,
        badge: col.badge,
        badgeColor: col.badgeColor,
        isRecommended: col.isRecommended,
      },
      create: col,
    });
  }

  const vocabList = [
    {
      word: "ubiquitous",
      meaning: "ที่มีอยู่ทุกหนทุกแห่ง, พบเห็นได้ทั่วไป",
      synonyms: ["omnipresent", "pervasive", "universal", "widespread", "common", "everywhere"],
      partOfSpeech: "Adjective",
      category: "TGAT1",
      collectionIds: ["tgat1-68", "tgat1-67", "alevel-68"], // ศัพท์อยู่ได้หลาย Collection
      difficultyLevel: 5,
      cefrLevel: "C1",
      phonetic: "yoo-BIK-wih-tus",
      exampleSentence: "Smartphones have become ubiquitous in modern society, allowing people to stay connected anywhere they go.",
      exampleTarget: "สมาร์ตโฟนได้กลายเป็นสิ่งที่พบเห็นได้ทั่วไปในสังคมปัจจุบัน ทำให้ผู้คนสามารถเชื่อมต่อกันได้ทุกที่ที่ไป",
    },
    {
      word: "mitigate",
      meaning: "บรรเทา, ทำให้รุนแรงน้อยลง",
      synonyms: ["alleviate", "lessen", "relieve", "reduce", "soothe", "ease", "diminish", "assuage"],
      partOfSpeech: "Verb",
      category: "A-Level",
      collectionIds: ["alevel-68", "alevel-67", "tgat1-68"], // ศัพท์ข้ามหมวดและปีได้
      difficultyLevel: 4,
      cefrLevel: "B2",
      phonetic: "MIT-ih-gayt",
      exampleSentence: "Planting more trees along the highway will help mitigate air pollution and traffic noise for nearby residents.",
      exampleTarget: "การปลูกต้นไม้เพิ่มขึ้นตามแนวทางหลวงจะช่วยบรรเทามลพิษทางอากาศและเสียงรบกวนจากการจราจรให้แก่ผู้อยู่อาศัยใกล้เคียง",
    },
    {
      word: "resilient",
      meaning: "เข้มแข็ง, ยืดหยุ่น, ฟื้นตัวจากอุปสรรคได้อย่างรวดเร็ว",
      synonyms: ["tough", "strong", "hardy", "flexible", "durable", "buoyant", "adaptable"],
      partOfSpeech: "Adjective",
      category: "TGAT1",
      collectionIds: ["tgat1-68", "tgat1-66", "alevel-67"],
      difficultyLevel: 4,
      cefrLevel: "B2",
      phonetic: "rih-ZIL-yunt",
      exampleSentence: "Children are often remarkably resilient and can adapt quickly to changes in their new environment.",
      exampleTarget: "เด็ก ๆ มักจะมีความเข้มแข็งฟื้นตัวเร็วและสามารถปรับตัวเข้ากับการเปลี่ยนแปลงในสภาพแวดล้อมใหม่ได้อย่างรวดเร็ว",
    },
    {
      word: "meticulous",
      meaning: "พิถีพิถัน, รอบคอบ, ละเอียดลอออย่างยิ่ง",
      synonyms: ["thorough", "careful", "scrupulous", "precise", "fastidious", "diligent", "accurate"],
      partOfSpeech: "Adjective",
      category: "A-Level",
      collectionIds: ["tgat1-67", "alevel-68", "alevel-66"],
      difficultyLevel: 5,
      cefrLevel: "C1",
      phonetic: "muh-TIK-yuh-lus",
      exampleSentence: "She is always meticulous about keeping her financial records organized and accurate down to the last cent.",
      exampleTarget: "เธอมักจะพิถีพิถันและรอบคอบในการจัดทำบันทึกทางการเงินให้เป็นระเบียบและถูกต้องเสมอจนถึงเซ็นต์สุดท้าย",
    },
    {
      word: "ambiguous",
      meaning: "กำกวม, คลุมเครือ, ตีความได้หลายแบบ",
      synonyms: ["unclear", "vague", "equivocal", "obscure", "uncertain", "cryptic"],
      partOfSpeech: "Adjective",
      category: "TGAT1",
      collectionIds: ["tgat1-68", "tgat1-67", "alevel-66"],
      difficultyLevel: 4,
      cefrLevel: "B2",
      phonetic: "am-BIG-yoo-us",
      exampleSentence: "The manager gave ambiguous instructions, leaving the team confused about what to do next.",
      exampleTarget: "ผู้จัดการให้คำสั่งที่คลุมเครือกำกวม ทำให้ทีมรู้สึกสับสนว่าควรทำอะไรต่อไป",
    },
    {
      word: "alleviate",
      meaning: "บรรเทา, ทำให้รุนแรงน้อยลง, ผ่อนคลาย",
      synonyms: ["mitigate", "relieve", "lessen", "reduce", "soothe", "ease", "diminish", "assuage"],
      partOfSpeech: "Verb",
      category: "A-Level",
      collectionIds: ["alevel-68", "alevel-67"],
      difficultyLevel: 5,
      cefrLevel: "C1",
      phonetic: "uh-LEE-vee-ayt",
      exampleSentence: "Taking a short walk in the park can help alleviate chronic stress and clear your mind.",
      exampleTarget: "การเดินเล่นสั้น ๆ ในสวนสาธารณะสามารถช่วยบรรเทาความเครียดเรื้อรังและทำให้จิตใจปลอดโปร่งได้",
    },
    {
      word: "scrutinize",
      meaning: "ตรวจสอบอย่างละเอียดลออ, พินิจพิเคราะห์",
      synonyms: ["examine", "inspect", "analyze", "study carefully", "investigate", "probe"],
      partOfSpeech: "Verb",
      category: "A-Level",
      collectionIds: ["alevel-68", "alevel-67"],
      difficultyLevel: 5,
      cefrLevel: "C1",
      phonetic: "SKROO-tuh-nyze",
      exampleSentence: "The auditing committee will carefully scrutinize every financial transaction before approving the annual budget.",
      exampleTarget: "คณะกรรมการตรวจสอบจะตรวจสอบทุกธุรกรรมทางการเงินอย่างละเอียดลออก่อนอนุมัติงบประมาณประจำปี",
    },
    {
      word: "empathy",
      meaning: "ความเห็นอกเห็นใจ, การเข้าใจความรู้สึกของผู้อื่น",
      synonyms: ["compassion", "understanding", "sympathy", "care", "sensitivity"],
      partOfSpeech: "Noun",
      category: "TGAT1",
      collectionIds: ["tgat1-68", "tgat1-66"],
      difficultyLevel: 3,
      cefrLevel: "B1",
      phonetic: "EM-puh-thee",
      exampleSentence: "Good doctors show deep empathy when listening to their patients' concerns.",
      exampleTarget: "แพทย์ที่ดีแสดงความเห็นอกเห็นใจอย่างลึกซึ้งเมื่อรับฟังข้อกังวลของผู้ป่วย",
    },
    {
      word: "collaborate",
      meaning: "ร่วมมือกัน, ทำงานร่วมกันเพื่อเป้าหมาย",
      synonyms: ["cooperate", "team up", "join forces", "work together", "partner"],
      partOfSpeech: "Verb",
      category: "TGAT1",
      collectionIds: ["tgat1-68", "tgat1-67"],
      difficultyLevel: 4,
      cefrLevel: "B2",
      phonetic: "kuh-LAB-uh-rayt",
      exampleSentence: "Our department plans to collaborate with international researchers on this environmental project.",
      exampleTarget: "แผนกของเรามีแผนที่จะร่วมมือกับนักวิจัยระดับนานาชาติในโครงการด้านสิ่งแวดล้อมนี้",
    },
    {
      word: "exacerbate",
      meaning: "ทำให้แย่ลงหรือรุนแรงขึ้น",
      synonyms: ["worsen", "aggravate", "intensify", "compound", "inflame"],
      partOfSpeech: "Verb",
      category: "A-Level",
      collectionIds: ["alevel-68", "alevel-66"],
      difficultyLevel: 5,
      cefrLevel: "C1",
      phonetic: "ig-ZAS-er-bayt",
      exampleSentence: "Scratching an insect bite will only exacerbate the itching and may cause an infection.",
      exampleTarget: "การเกาบริเวณที่แมลงกัดต่อยมีแต่จะทำให้อาการคันรุนแรงแย่ลงและอาจทำให้เกิดการติดเชื้อได้",
    },
    {
      word: "procrastinate",
      meaning: "ผัดวันประกันพรุ่ง, เลื่อนเวลาออกไปโดยไม่จำเป็น",
      synonyms: ["delay", "postpone", "defer", "put off", "stall", "dally"],
      partOfSpeech: "Verb",
      category: "TGAT1",
      collectionIds: ["tgat1-67", "alevel-67"],
      difficultyLevel: 4,
      cefrLevel: "B2",
      phonetic: "pro-KRAS-tuh-nayt",
      exampleSentence: "If you procrastinate on starting your project until the final night, the quality of your work will suffer.",
      exampleTarget: "หากคุณผัดวันประกันพรุ่งในการเริ่มทำโปรเจกต์จนถึงคืนสุดท้าย คุณภาพงานของคุณก็จะลดลง",
    },
    {
      word: "paradigm",
      meaning: "กรอบความคิด, แบบแผน, ตัวอย่างที่เป็นมาตรฐาน",
      synonyms: ["model", "pattern", "framework", "standard", "archetype", "prototype"],
      partOfSpeech: "Noun",
      category: "A-Level",
      collectionIds: ["alevel-68", "alevel-66"],
      difficultyLevel: 6,
      cefrLevel: "C2",
      phonetic: "PAR-uh-dyme",
      exampleSentence: "The invention of artificial intelligence is creating a major paradigm shift in global education.",
      exampleTarget: "การประดิษฐ์ปัญญาประดิษฐ์กำลังสร้างการเปลี่ยนแปลงกรอบความคิดครั้งใหญ่ในการศึกษาระดับโลก",
    },
  ];

  for (const item of vocabList) {
    const { collectionIds, ...data } = item;
    await prisma.vocabulary.upsert({
      where: { word: data.word },
      update: {
        meaning: data.meaning,
        synonyms: data.synonyms,
        partOfSpeech: data.partOfSpeech,
        category: data.category,
        difficultyLevel: data.difficultyLevel,
        cefrLevel: data.cefrLevel,
        phonetic: data.phonetic,
        exampleSentence: data.exampleSentence,
        exampleTarget: data.exampleTarget,
        collections: {
          set: collectionIds.map((id) => ({ id })),
        },
      },
      create: {
        ...data,
        collections: {
          connect: collectionIds.map((id) => ({ id })),
        },
      },
    });
  }

  console.log("✅ Successfully seeded 6 Collections (TGAT1 66-68, A-Level 66-68) with multi-collection vocabulary and synonyms array!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
