export interface WordExamplePair {
  exampleSentence: string;
  exampleTarget: string;
}

export const CURATED_WORD_EXAMPLES: Record<string, WordExamplePair> = {
  ubiquitous: {
    exampleSentence: "Smartphones have become ubiquitous in modern society, allowing people to stay connected anywhere they go.",
    exampleTarget: "สมาร์ตโฟนได้กลายเป็นสิ่งที่พบเห็นได้ทั่วไปในสังคมปัจจุบัน ทำให้ผู้คนสามารถเชื่อมต่อกันได้ทุกที่ที่ไป",
  },
  mitigate: {
    exampleSentence: "Planting more trees along the highway will help mitigate air pollution and traffic noise for nearby residents.",
    exampleTarget: "การปลูกต้นไม้เพิ่มขึ้นตามแนวทางหลวงจะช่วยบรรเทามลพิษทางอากาศและเสียงรบกวนจากการจราจรให้แก่ผู้อยู่อาศัยใกล้เคียง",
  },
  resilient: {
    exampleSentence: "Children are often remarkably resilient and can adapt quickly to changes in their new environment.",
    exampleTarget: "เด็ก ๆ มักจะมีความเข้มแข็งฟื้นตัวเร็วและสามารถปรับตัวเข้ากับการเปลี่ยนแปลงในสภาพแวดล้อมใหม่ได้อย่างรวดเร็ว",
  },
  meticulous: {
    exampleSentence: "She is always meticulous about keeping her financial records organized and accurate down to the last cent.",
    exampleTarget: "เธอมักจะพิถีพิถันและรอบคอบในการจัดทำบันทึกทางการเงินให้เป็นระเบียบและถูกต้องเสมอจนถึงเซ็นต์สุดท้าย",
  },
  ambiguous: {
    exampleSentence: "The manager gave ambiguous instructions, leaving the team confused about what to do next.",
    exampleTarget: "ผู้จัดการให้คำสั่งที่คลุมเครือกำกวม ทำให้ทีมรู้สึกสับสนว่าควรทำอะไรต่อไป",
  },
  alleviate: {
    exampleSentence: "Taking a short walk in the park can help alleviate chronic stress and clear your mind.",
    exampleTarget: "การเดินเล่นสั้น ๆ ในสวนสาธารณะสามารถช่วยบรรเทาความเครียดเรื้อรังและทำให้จิตใจปลอดโปร่งได้",
  },
  scrutinize: {
    exampleSentence: "The auditing committee will carefully scrutinize every financial transaction before approving the annual budget.",
    exampleTarget: "คณะกรรมการตรวจสอบจะตรวจสอบทุกธุรกรรมทางการเงินอย่างละเอียดลออก่อนอนุมัติงบประมาณประจำปี",
  },
  empathy: {
    exampleSentence: "Good doctors show deep empathy when listening to their patients' concerns.",
    exampleTarget: "แพทย์ที่ดีแสดงความเห็นอกเห็นใจอย่างลึกซึ้งเมื่อรับฟังข้อกังวลของผู้ป่วย",
  },
  collaborate: {
    exampleSentence: "Our department plans to collaborate with international researchers on this environmental project.",
    exampleTarget: "แผนกของเรามีแผนที่จะร่วมมือกับนักวิจัยระดับนานาชาติในโครงการด้านสิ่งแวดล้อมนี้",
  },
  exacerbate: {
    exampleSentence: "Scratching an insect bite will only exacerbate the itching and may cause an infection.",
    exampleTarget: "การเการอยแมลงกัดต่อยจะมีแต่ทำให้ความคันรุนแรงขึ้นและอาจเกิดการติดเชื้อได้",
  },
  procrastinate: {
    exampleSentence: "If you procrastinate on starting your project until the final night, the quality of your work will suffer.",
    exampleTarget: "หากคุณผัดวันประกันพรุ่งในการเริ่มทำโปรเจกต์จนถึงคืนสุดท้าย คุณภาพงานของคุณก็จะลดลง",
  },
  paradigm: {
    exampleSentence: "The invention of artificial intelligence is creating a major paradigm shift in global education.",
    exampleTarget: "การประดิษฐ์ปัญญาประดิษฐ์กำลังสร้างการเปลี่ยนแปลงกระบวนทัศน์ครั้งใหญ่ในการศึกษาระดับโลก",
  },
  inevitable: {
    exampleSentence: "With rapid technological advancements, changes to the traditional workplace are inevitable and employees must adapt.",
    exampleTarget: "ด้วยความก้าวหน้าทางเทคโนโลยีที่รวดเร็ว การเปลี่ยนแปลงในสถานที่ทำงานแบบดั้งเดิมจึงเป็นสิ่งที่หลีกเลี่ยงไม่ได้และพนักงานต้องปรับตัว",
  },
};

/**
 * Returns a guaranteed valid, clean English example sentence and Thai translation pair for any word.
 * Protects against database entries containing invalid fragments like "," or "." or empty text.
 */
export function getCleanWordExample(
  word: string,
  dbSentence?: string | null,
  dbTarget?: string | null
): WordExamplePair {
  const cleanWordKey = word.trim().toLowerCase();
  const curated = CURATED_WORD_EXAMPLES[cleanWordKey];

  const isValidSentence =
    dbSentence &&
    typeof dbSentence === "string" &&
    dbSentence.trim().length > 5 &&
    !/^[.,!?;:\s\-_]+$/.test(dbSentence.trim()) &&
    dbSentence.trim() !== "," &&
    dbSentence.trim() !== ".";

  const isValidTarget =
    dbTarget &&
    typeof dbTarget === "string" &&
    dbTarget.trim().length > 3 &&
    !/^[.,!?;:\s\-_]+$/.test(dbTarget.trim());

  if (isValidSentence && isValidTarget) {
    return {
      exampleSentence: dbSentence!.replace(/[\u{10000}-\u{10FFFF}]/gu, "").trim(),
      exampleTarget: dbTarget!.replace(/\s*\([^)]*\)/g, "").replace(/[\u{10000}-\u{10FFFF}]/gu, "").trim(),
    };
  }

  if (curated) {
    return curated;
  }

  // Generic fallback if not in curated dict and db example is invalid
  return {
    exampleSentence: `Understanding and using "${word}" correctly is essential for academic and daily English communication.`,
    exampleTarget: `การเข้าใจและใช้คำว่า "${word}" อย่างถูกต้องมีความจำเป็นต่อการสื่อสารภาษาอังกฤษทั้งในเชิงวิชาการและในชีวิตประจำวัน`,
  };
}
