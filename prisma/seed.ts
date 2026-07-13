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
  console.log("🌱 Seeding Categories, Collections, and High-Yield Vocabulary...");

  const collections = [
    {
      id: "col-tgat-1",
      title: "TGAT Set 1: Essential Adjectives & Verbs",
      description: "ชุดฝึกคำศัพท์คุณศัพท์และกริยาหลักที่ออกสอบบ่อยที่สุดในข้อสอบ TGAT 1 การสื่อสารภาษาอังกฤษ",
      category: "TGAT-Eng",
      cefrLevel: "B2",
      icon: "📘",
      color: "from-blue-500/10 to-indigo-500/10 border-blue-200/80 hover:border-blue-400",
      badge: "TGAT Set 1",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      id: "col-tgat-2",
      title: "TGAT Set 2: High-Yield Daily Communication",
      description: "คำศัพท์ด้านการสื่อสาร ทักษะทางสังคม และบทสนทนาในชีวิตประจำวันที่มักพบในข้อสอบ TGAT",
      category: "TGAT-Eng",
      cefrLevel: "B1-B2",
      icon: "💬",
      color: "from-sky-500/10 to-cyan-500/10 border-sky-200/80 hover:border-sky-400",
      badge: "TGAT Set 2",
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    },
    {
      id: "col-alevel-1",
      title: "A-Level Set 1: Critical Reading & Academic Verbs",
      description: "คำกริยาเชิงวิชาการและคำศัพท์ขั้นสูงระดับ C1 สำหรับวิเคราะห์โจทย์ยากและบทความยาวใน A-Level 82",
      category: "A-Level",
      cefrLevel: "C1",
      icon: "📙",
      color: "from-purple-500/10 to-pink-500/10 border-purple-200/80 hover:border-purple-400",
      badge: "A-Level Set 1",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      id: "col-alevel-2",
      title: "A-Level Set 2: Science & Social Passages",
      description: "ศัพท์เฉพาะทางเชิงวิทยาศาสตร์และสังคมศาสตร์ที่พบบ่อยมากที่สุดในข้อสอบ Reading ของ A-Level",
      category: "A-Level",
      cefrLevel: "C1-C2",
      icon: "🔬",
      color: "from-fuchsia-500/10 to-rose-500/10 border-fuchsia-200/80 hover:border-fuchsia-400",
      badge: "A-Level Set 2",
      badgeColor: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
    },
    {
      id: "col-tcas-1",
      title: "TCAS Academic Core: Connectors & Formal Words",
      description: "คำเชื่อม (Conjunctions/Transitions) และคำศัพท์ทางการที่จำเป็นสำหรับการเขียนความเรียงระดับมหาวิทยาลัย",
      category: "TCAS-Academic",
      cefrLevel: "B2-C1",
      icon: "📗",
      color: "from-emerald-500/10 to-teal-500/10 border-emerald-200/80 hover:border-emerald-400",
      badge: "Academic Set 1",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
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
      },
      create: col,
    });
  }

  const initialVocab = [
    // --- col-tgat-1 ---
    {
      word: "ubiquitous",
      meaning: "ที่มีอยู่ทุกหนทุกแห่ง, พบเห็นได้ทั่วไป",
      partOfSpeech: "Adjective",
      category: "TGAT-Eng",
      collectionId: "col-tgat-1",
      difficultyLevel: 5,
      cefrLevel: "C1",
      phonetic: "yoo-BIK-wih-tus",
      exampleSentence: "Smartphones have become ubiquitous in modern society, allowing people to stay connected anywhere they go.",
      exampleTarget: "สมาร์ตโฟนได้กลายเป็นสิ่งที่พบเห็นได้ทั่วไปในสังคมปัจจุบัน ทำให้ผู้คนสามารถเชื่อมต่อกันได้ทุกที่ที่ไป",
    },
    {
      word: "meticulous",
      meaning: "พิถีพิถัน, รอบคอบ, ละเอียดลอออย่างยิ่ง",
      partOfSpeech: "Adjective",
      category: "TGAT-Eng",
      collectionId: "col-tgat-1",
      difficultyLevel: 5,
      cefrLevel: "C1",
      phonetic: "muh-TIK-yuh-lus",
      exampleSentence: "She is always meticulous about keeping her financial records organized and accurate down to the last cent.",
      exampleTarget: "เธอมักจะพิถีพิถันและรอบคอบในการจัดทำบันทึกทางการเงินให้เป็นระเบียบและถูกต้องเสมอจนถึงเซ็นต์สุดท้าย",
    },
    {
      word: "resilient",
      meaning: "เข้มแข็ง, ยืดหยุ่น, ฟื้นตัวจากอุปสรรคได้อย่างรวดเร็ว",
      partOfSpeech: "Adjective",
      category: "TGAT-Eng",
      collectionId: "col-tgat-1",
      difficultyLevel: 4,
      cefrLevel: "B2",
      phonetic: "rih-ZIL-yunt",
      exampleSentence: "Children are often remarkably resilient and can adapt quickly to changes in their new environment.",
      exampleTarget: "เด็ก ๆ มักจะมีความเข้มแข็งฟื้นตัวเร็วและสามารถปรับตัวเข้ากับการเปลี่ยนแปลงในสภาพแวดล้อมใหม่ได้อย่างรวดเร็ว",
    },
    {
      word: "ambiguous",
      meaning: "กำกวม, คลุมเครือ, ตีความได้หลายแบบ",
      partOfSpeech: "Adjective",
      category: "TGAT-Eng",
      collectionId: "col-tgat-1",
      difficultyLevel: 4,
      cefrLevel: "B2",
      phonetic: "am-BIG-yoo-us",
      exampleSentence: "The manager gave ambiguous instructions, leaving the team confused about what to do next.",
      exampleTarget: "ผู้จัดการให้คำสั่งที่คลุมเครือกำกวม ทำให้ทีมรู้สึกสับสนว่าควรทำอะไรต่อไป",
    },
    {
      word: "inevitable",
      meaning: "หลีกเลี่ยงไม่ได้, ต้องเกิดขึ้นอย่างแน่นอน",
      partOfSpeech: "Adjective",
      category: "TGAT-Eng",
      collectionId: "col-tgat-1",
      difficultyLevel: 4,
      cefrLevel: "B2",
      phonetic: "in-EV-ih-tuh-bul",
      exampleSentence: "Technological advancement is inevitable as companies constantly invest in new innovations.",
      exampleTarget: "ความก้าวหน้าทางเทคโนโลยีเป็นสิ่งที่หลีกเลี่ยงไม่ได้ในขณะที่บริษัทต่าง ๆ ลงทุนในนวัตกรรมใหม่อย่างต่อเนื่อง",
    },

    // --- col-tgat-2 ---
    {
      word: "empathy",
      meaning: "ความเห็นอกเห็นใจ, การเข้าใจความรู้สึกของผู้อื่น",
      partOfSpeech: "Noun",
      category: "TGAT-Eng",
      collectionId: "col-tgat-2",
      difficultyLevel: 3,
      cefrLevel: "B1",
      phonetic: "EM-puh-thee",
      exampleSentence: "Good doctors show deep empathy when listening to their patients' concerns.",
      exampleTarget: "แพทย์ที่ดีแสดงความเห็นอกเห็นใจอย่างลึกซึ้งเมื่อรับฟังข้อกังวลของผู้ป่วย",
    },
    {
      word: "collaborate",
      meaning: "ร่วมมือกัน, ทำงานร่วมกันเพื่อเป้าหมาย",
      partOfSpeech: "Verb",
      category: "TGAT-Eng",
      collectionId: "col-tgat-2",
      difficultyLevel: 4,
      cefrLevel: "B2",
      phonetic: "kuh-LAB-uh-rayt",
      exampleSentence: "Our department plans to collaborate with international researchers on this environmental project.",
      exampleTarget: "แผนกของเรามีแผนที่จะร่วมมือกับนักวิจัยระดับนานาชาติในโครงการด้านสิ่งแวดล้อมนี้",
    },
    {
      word: "versatile",
      meaning: "อเนกประสงค์, ปรับตัวเก่ง, ทำได้หลายอย่าง",
      partOfSpeech: "Adjective",
      category: "TGAT-Eng",
      collectionId: "col-tgat-2",
      difficultyLevel: 4,
      cefrLevel: "B2",
      phonetic: "VUR-suh-tuhl",
      exampleSentence: "He is a highly versatile employee who can handle marketing, design, and customer relations with ease.",
      exampleTarget: "เขาเป็นพนักงานที่มีความอเนกประสงค์และปรับตัวเก่งมาก ซึ่งสามารถจัดการงานการตลาด ดีไซน์ และลูกค้าสัมพันธ์ได้อย่างง่ายดาย",
    },
    {
      word: "pragmatic",
      meaning: "เน้นการปฏิบัติจริง, มองโลกตามความเป็นจริง",
      partOfSpeech: "Adjective",
      category: "TGAT-Eng",
      collectionId: "col-tgat-2",
      difficultyLevel: 5,
      cefrLevel: "C1",
      phonetic: "prag-MAT-ik",
      exampleSentence: "Instead of complaining about the tight budget, we need to take a pragmatic approach and prioritize core tasks.",
      exampleTarget: "แทนที่จะบ่นเกี่ยวกับงบประมาณที่จำกัด เราจำเป็นต้องใช้วิธีที่เน้นการปฏิบัติจริงและจัดลำดับความสำคัญของงานหลัก",
    },
    {
      word: "articulate",
      meaning: "พูดจาฉะฉาน, อธิบายความคิดได้อย่างชัดเจน",
      partOfSpeech: "Adjective / Verb",
      category: "TGAT-Eng",
      collectionId: "col-tgat-2",
      difficultyLevel: 5,
      cefrLevel: "C1",
      phonetic: "ar-TIK-yuh-lit",
      exampleSentence: "She is an articulate speaker who can explain complicated scientific concepts to the general public.",
      exampleTarget: "เธอเป็นนักพูดที่พูดจาฉะฉานและสามารถอธิบายแนวคิดทางวิทยาศาสตร์ที่ซับซ้อนให้สาธารณชนทั่วไปเข้าใจได้",
    },

    // --- col-alevel-1 ---
    {
      word: "mitigate",
      meaning: "บรรเทา, ทำให้รุนแรงน้อยลง",
      partOfSpeech: "Verb",
      category: "A-Level",
      collectionId: "col-alevel-1",
      difficultyLevel: 4,
      cefrLevel: "B2",
      phonetic: "MIT-ih-gayt",
      exampleSentence: "Planting more trees along the highway will help mitigate air pollution and traffic noise for nearby residents.",
      exampleTarget: "การปลูกต้นไม้เพิ่มขึ้นตามแนวทางหลวงจะช่วยบรรเทามลพิษทางอากาศและเสียงรบกวนจากการจราจรให้แก่ผู้อยู่อาศัยใกล้เคียง",
    },
    {
      word: "alleviate",
      meaning: "บรรเทา, ทำให้รุนแรงน้อยลง, ผ่อนคลาย",
      partOfSpeech: "Verb",
      category: "A-Level",
      collectionId: "col-alevel-1",
      difficultyLevel: 5,
      cefrLevel: "C1",
      phonetic: "uh-LEE-vee-ayt",
      exampleSentence: "Taking a short walk in the park can help alleviate chronic stress and clear your mind.",
      exampleTarget: "การเดินเล่นสั้น ๆ ในสวนสาธารณะสามารถช่วยบรรเทาความเครียดเรื้อรังและทำให้จิตใจปลอดโปร่งได้",
    },
    {
      word: "scrutinize",
      meaning: "ตรวจสอบอย่างละเอียดลออ, พินิจพิเคราะห์",
      partOfSpeech: "Verb",
      category: "A-Level",
      collectionId: "col-alevel-1",
      difficultyLevel: 5,
      cefrLevel: "C1",
      phonetic: "SKROO-tuh-nyze",
      exampleSentence: "The auditing committee will carefully scrutinize every financial transaction before approving the annual budget.",
      exampleTarget: "คณะกรรมการตรวจสอบจะตรวจสอบทุกธุรกรรมทางการเงินอย่างละเอียดลออก่อนอนุมัติงบประมาณประจำปี",
    },
    {
      word: "exacerbate",
      meaning: "ทำให้แย่ลงหรือรุนแรงขึ้น",
      partOfSpeech: "Verb",
      category: "A-Level",
      collectionId: "col-alevel-1",
      difficultyLevel: 5,
      cefrLevel: "C1",
      phonetic: "ig-ZAS-er-bayt",
      exampleSentence: "Scratching an insect bite will only exacerbate the itching and may cause an infection.",
      exampleTarget: "การเกาบริเวณที่แมลงกัดต่อยมีแต่จะทำให้อาการคันรุนแรงแย่ลงและอาจทำให้เกิดการติดเชื้อได้",
    },
    {
      word: "substantiate",
      meaning: "พิสูจน์ด้วยหลักฐาน, ยืนยันว่าเป็นความจริง",
      partOfSpeech: "Verb",
      category: "A-Level",
      collectionId: "col-alevel-1",
      difficultyLevel: 5,
      cefrLevel: "C1",
      phonetic: "sub-STAN-shee-ayt",
      exampleSentence: "Scientists must provide solid experimental data to substantiate their new theories.",
      exampleTarget: "นักวิทยาศาสตร์ต้องนำเสนอข้อมูลการทดลองที่หนักแน่นเพื่อพิสูจน์ยืนยันทฤษฎีใหม่ของตนด้วยหลักฐาน",
    },

    // --- col-alevel-2 ---
    {
      word: "hypothesize",
      meaning: "ตั้งสมมติฐาน, คาดการณ์เชิงวิชาการ",
      partOfSpeech: "Verb",
      category: "A-Level",
      collectionId: "col-alevel-2",
      difficultyLevel: 5,
      cefrLevel: "C1",
      phonetic: "hy-POTH-uh-syze",
      exampleSentence: "Researchers hypothesize that dietary changes can significantly impact long-term brain health.",
      exampleTarget: "นักวิจัยตั้งสมมติฐานว่าการเปลี่ยนแปลงด้านโภชนาการสามารถส่งผลกระทบอย่างมีนัยสำคัญต่อสุขภาพสมองในระยะยาว",
    },
    {
      word: "empirical",
      meaning: "ที่ได้จากการทดลองหรือประสบการณ์จริง",
      partOfSpeech: "Adjective",
      category: "A-Level",
      collectionId: "col-alevel-2",
      difficultyLevel: 5,
      cefrLevel: "C1",
      phonetic: "im-PIR-ih-kul",
      exampleSentence: "There is now strong empirical evidence showing that regular exercise improves sleep quality.",
      exampleTarget: "ขณะนี้มีหลักฐานเชิงประจักษ์จากการทดลองจริงที่แสดงให้เห็นว่าการออกกำลังกายสม่ำเสมอช่วยปรับปรุงคุณภาพการนอนหลับ",
    },
    {
      word: "paradigm",
      meaning: "กรอบความคิด, แบบแผน, ตัวอย่างที่เป็นมาตรฐาน",
      partOfSpeech: "Noun",
      category: "A-Level",
      collectionId: "col-alevel-2",
      difficultyLevel: 6,
      cefrLevel: "C2",
      phonetic: "PAR-uh-dyme",
      exampleSentence: "The invention of artificial intelligence is creating a major paradigm shift in global education.",
      exampleTarget: "การประดิษฐ์ปัญญาประดิษฐ์กำลังสร้างการเปลี่ยนแปลงกรอบความคิดครั้งใหญ่ในการศึกษาระดับโลก",
    },
    {
      word: "catalyst",
      meaning: "ตัวเร่งปฏิกิริยา, สิ่งกระตุ้นให้เกิดการเปลี่ยนแปลง",
      partOfSpeech: "Noun",
      category: "A-Level",
      collectionId: "col-alevel-2",
      difficultyLevel: 5,
      cefrLevel: "C1",
      phonetic: "KAT-uh-list",
      exampleSentence: "The community protest acted as a powerful catalyst for local environmental reform.",
      exampleTarget: "การประท้วงของชุมชนทำหน้าที่เป็นสิ่งกระตุ้นตัวเร่งปฏิกิริยาที่ทรงพลังสำหรับการปฏิรูปสิ่งแวดล้อมในท้องถิ่น",
    },
    {
      word: "unprecedented",
      meaning: "ที่ไม่เคยเกิดขึ้นมาก่อน, เป็นประวัติการณ์",
      partOfSpeech: "Adjective",
      category: "A-Level",
      collectionId: "col-alevel-2",
      difficultyLevel: 5,
      cefrLevel: "C1",
      phonetic: "un-PRES-ih-den-tid",
      exampleSentence: "The company experienced unprecedented growth this year thanks to global expansion.",
      exampleTarget: "บริษัทประสบกับการเติบโตที่ไม่เคยเกิดขึ้นมาก่อนในปีนี้เนื่องจากการขยายตลาดสู่ระดับโลก",
    },

    // --- col-tcas-1 ---
    {
      word: "procrastinate",
      meaning: "ผัดวันประกันพรุ่ง, เลื่อนเวลาออกไปโดยไม่จำเป็น",
      partOfSpeech: "Verb",
      category: "TCAS-Academic",
      collectionId: "col-tcas-1",
      difficultyLevel: 4,
      cefrLevel: "B2",
      phonetic: "pro-KRAS-tuh-nayt",
      exampleSentence: "If you procrastinate on starting your project until the final night, the quality of your work will suffer.",
      exampleTarget: "หากคุณผัดวันประกันพรุ่งในการเริ่มทำโปรเจกต์จนถึงคืนสุดท้าย คุณภาพงานของคุณก็จะลดลง",
    },
    {
      word: "consequently",
      meaning: "ดังนั้น, ผลที่ตามมาคือ",
      partOfSpeech: "Adverb",
      category: "TCAS-Academic",
      collectionId: "col-tcas-1",
      difficultyLevel: 4,
      cefrLevel: "B2",
      phonetic: "KON-sih-kwent-lee",
      exampleSentence: "He missed the early morning train; consequently, he arrived late for his university interview.",
      exampleTarget: "เขาตกรถไฟรอบเช้าตรู่ ดังนั้น ผลที่ตามมาคือเขาจึงไปถึงงานสัมภาษณ์ของมหาวิทยาลัยสาย",
    },
    {
      word: "notwithstanding",
      meaning: "แม้ว่า, อย่างไรก็ตาม, โดยไม่คำนึงถึง",
      partOfSpeech: "Preposition / Conjunction",
      category: "TCAS-Academic",
      collectionId: "col-tcas-1",
      difficultyLevel: 5,
      cefrLevel: "C1",
      phonetic: "not-with-STAN-ding",
      exampleSentence: "Notwithstanding the severe weather conditions, the marathon proceeded exactly as scheduled.",
      exampleTarget: "แม้ว่าสภาพอากาศจะเลวร้ายรุนแรง แต่การแข่งขันมาราธอนก็ยังคงดำเนินต่อไปตามกำหนดการเป๊ะ",
    },
    {
      word: "subsequent",
      meaning: "ที่ตามมาภายหลัง, ลำดับถัดไป",
      partOfSpeech: "Adjective",
      category: "TCAS-Academic",
      collectionId: "col-tcas-1",
      difficultyLevel: 4,
      cefrLevel: "B2",
      phonetic: "SUB-sih-kwent",
      exampleSentence: "The initial experiment failed, but all subsequent trials produced highly accurate results.",
      exampleTarget: "การทดลองครั้งแรกล้มเหลว แต่การทดลองในลำดับที่ตามมาภายหลังทั้งหมดให้ผลลัพธ์ที่แม่นยำสูงมาก",
    },
    {
      word: "feasible",
      meaning: "ที่สามารถเป็นไปได้จริง, ในทางปฏิบัติทำได้",
      partOfSpeech: "Adjective",
      category: "TCAS-Academic",
      collectionId: "col-tcas-1",
      difficultyLevel: 4,
      cefrLevel: "B2",
      phonetic: "FEE-zuh-bul",
      exampleSentence: "Before building the new bridge, engineers must determine whether the construction is financially feasible.",
      exampleTarget: "ก่อนสร้างสะพานใหม่ วิศวกรต้องประเมินว่าการก่อสร้างนั้นสามารถเป็นไปได้จริงในทางปฏิบัติและทางการเงินหรือไม่",
    },
  ];

  for (const item of initialVocab) {
    await prisma.vocabulary.upsert({
      where: { word: item.word },
      update: {
        meaning: item.meaning,
        partOfSpeech: item.partOfSpeech,
        category: item.category,
        collectionId: item.collectionId,
        difficultyLevel: item.difficultyLevel,
        cefrLevel: item.cefrLevel,
        phonetic: item.phonetic,
        exampleSentence: item.exampleSentence,
        exampleTarget: item.exampleTarget,
      },
      create: item,
    });
  }

  console.log("✅ Successfully seeded 5 curated Collections with 20 high-yield vocabulary items!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
