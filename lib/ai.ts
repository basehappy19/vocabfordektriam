import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const exampleSentenceSchema = z.object({
  exampleSentence: z
    .string()
    .describe(
      "A clear, memorable English example sentence using the target vocabulary word, appropriate for Thai university entrance exam (TGAT/A-Level) difficulty."
    ),
  exampleTarget: z
    .string()
    .describe(
      "The accurate and natural Thai translation of the English example sentence."
    ),
});

export interface GeneratedExample {
  exampleSentence: string;
  exampleTarget: string;
}

/**
 * Lazy-generates an English example sentence and its Thai translation for a given vocabulary word.
 * Cost-saving logic: Only called when the DB has `exampleSentence === null`.
 */
export async function generateExampleForVocab(
  word: string,
  meaning: string,
  partOfSpeech: string,
  category: string
): Promise<GeneratedExample> {
  try {
    const { object } = await generateObject({
      model: google("gemini-3.1-pro-high"),
      schema: exampleSentenceSchema,
      prompt: `You are an expert English tutor for Thai high school students preparing for university entrance exams (DekTriam / TCAS / TGAT / A-Level).
Generate a clear, natural, and high-yield academic English example sentence using the vocabulary word "${word}" (${partOfSpeech}: "${meaning}") in the category "${category}".
Also provide an accurate, idiomatic Thai translation. Keep the sentence concise (10-18 words) and easy to read on an iPad screen.`,
      temperature: 0.4,
    });

    return object;
  } catch (error) {
    console.error(`AI generation failed for word "${word}":`, error);
    // Provide fallback high-quality sentence if AI API is unreachable during offline/quota limits
    return {
      exampleSentence: `Understanding the word "${word}" is crucial for achieving high scores on university entrance examinations.`,
      exampleTarget: `การเข้าใจคำว่า "${word}" มีความสำคัญอย่างยิ่งต่อการทำคะแนนสูงในการสอบเข้ามหาวิทยาลัย (${meaning})`,
    };
  }
}
