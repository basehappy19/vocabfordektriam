import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const exampleSentenceSchema = z.object({
  exampleSentence: z
    .string()
    .describe(
      "A natural, realistic daily-life or authentic academic reading sentence where the target vocabulary word is used in a real-world context."
    ),
  exampleTarget: z
    .string()
    .describe(
      "The accurate and natural Thai translation of the real-life example sentence."
    ),
});

export interface GeneratedExample {
  exampleSentence: string;
  exampleTarget: string;
}

// Curated authentic real-life daily usage sentences for core TCAS vocabulary
const REAL_LIFE_FALLBACK_EXAMPLES: Record<string, GeneratedExample> = {
  meticulous: {
    exampleSentence: "She is always meticulous about keeping her financial records organized and accurate down to the last cent.",
    exampleTarget: "เธอมักจะพิถีพิถันและรอบคอบในการจัดทำบันทึกทางการเงินให้เป็นระเบียบและถูกต้องเสมอจนถึงเซ็นต์สุดท้าย",
  },
  mitigate: {
    exampleSentence: "Planting more trees along the highway will help mitigate air pollution and traffic noise for nearby residents.",
    exampleTarget: "การปลูกต้นไม้เพิ่มขึ้นตามแนวทางหลวงจะช่วยบรรเทามลพิษทางอากาศและเสียงรบกวนจากการจราจรให้แก่ผู้อยู่อาศัยใกล้เคียง",
  },
  ubiquitous: {
    exampleSentence: "Smartphones have become ubiquitous in modern society, allowing people to stay connected anywhere they go.",
    exampleTarget: "สมาร์ตโฟนได้กลายเป็นสิ่งที่พบเห็นได้ทั่วไปในสังคมปัจจุบัน ทำให้ผู้คนสามารถเชื่อมต่อกันได้ทุกที่ที่ไป",
  },
  procrastinate: {
    exampleSentence: "If you procrastinate on starting your project until the final night, the quality of your work will suffer.",
    exampleTarget: "หากคุณผัดวันประกันพรุ่งในการเริ่มทำโปรเจกต์จนถึงคืนสุดท้าย คุณภาพงานของคุณก็จะลดลง",
  },
  alleviate: {
    exampleSentence: "Taking a short walk in the park can help alleviate chronic stress and clear your mind.",
    exampleTarget: "การเดินเล่นสั้น ๆ ในสวนสาธารณะสามารถช่วยบรรเทาความเครียดเรื้อรังและทำให้จิตใจปลอดโปร่งได้",
  },
  resilient: {
    exampleSentence: "Despite facing numerous financial hardships, the local business owners remained resilient and successfully rebuilt their store.",
    exampleTarget: "แม้จะต้องเผชิญกับความยากลำบากทางการเงินมากมาย แต่เจ้าของธุรกิจท้องถิ่นก็ยังคงยืดหยุ่นอดทนและสร้างร้านใหม่ได้สำเร็จ",
  },
  ambiguous: {
    exampleSentence: "The manager gave ambiguous instructions regarding the project deadline, leaving the team confused about what to prioritize.",
    exampleTarget: "ผู้จัดการให้คำสั่งที่กำกวมเกี่ยวกับกำหนดส่งงาน ทำให้ทีมงานสับสนว่าควรให้ความสำคัญกับสิ่งใดก่อน",
  },
  inevitable: {
    exampleSentence: "With rapid technological advancements, changes to the traditional workplace are inevitable and employees must adapt.",
    exampleTarget: "ด้วยความก้าวหน้าทางเทคโนโลยีที่รวดเร็ว การเปลี่ยนแปลงในสถานที่ทำงานแบบดั้งเดิมจึงเป็นสิ่งที่หลีกเลี่ยงไม่ได้และพนักงานต้องปรับตัว",
  },
};

/**
 * Lazy-generates a natural real-life English example sentence and its Thai translation for a given vocabulary word.
 * Cost-saving logic: Only called when the DB has `exampleSentence === null`.
 */
export async function generateExampleForVocab(
  word: string,
  meaning: string,
  partOfSpeech: string,
  category: string
): Promise<GeneratedExample> {
  const lowerWord = word.trim().toLowerCase();

  try {
    const { object } = await generateObject({
      model: google("gemini-3.1-pro-high"),
      schema: exampleSentenceSchema,
      prompt: `You are an expert English linguist and tutor for Thai high school students preparing for university entrance exams (DekTriam / TCAS / TGAT / A-Level).
Generate an authentic, natural, REAL-LIFE DAILY USAGE or high-quality reading passage sentence using the vocabulary word "${word}" (${partOfSpeech}: "${meaning}") from the category "${category}".
CRITICAL REQUIREMENT: The sentence MUST demonstrate how native English speakers actually use "${word}" in daily conversation, work, news, science, or human relationships. 
NEVER write meta-sentences about studying, learning, or understanding the word "${word}" for exams! Do NOT say "Understanding the word X is crucial...".
Also provide an accurate, idiomatic Thai translation. Keep the sentence concise (12-18 words) and easy to read on an iPad screen.`,
      temperature: 0.5,
    });

    // Verify AI didn't return a generic meta sentence
    if (object.exampleSentence.toLowerCase().includes("understanding the word") || object.exampleSentence.toLowerCase().includes("crucial for achieving high scores")) {
      throw new Error("AI generated a meta-sentence instead of real-life usage.");
    }

    return object;
  } catch (error) {
    console.error(`AI generation/verification failed for word "${word}":`, error);
    
    // Check our curated daily-life dictionary first
    if (REAL_LIFE_FALLBACK_EXAMPLES[lowerWord]) {
      return REAL_LIFE_FALLBACK_EXAMPLES[lowerWord];
    }

    // Provide natural contextual daily-life fallback sentence if unknown word and API offline
    return {
      exampleSentence: `During the community meeting, the speaker emphasized how being ${word} can significantly improve our daily decision-making and teamwork.`,
      exampleTarget: `ในระหว่างการประชุมชุมชน ผู้บรรยายได้เน้นย้ำถึงวิธีที่การมีคุณสมบัติ ${word} สามารถปรับปรุงการตัดสินใจในชีวิตประจำวันและการทำงานร่วมกันของเราได้อย่างมาก (${meaning})`,
    };
  }
}
