import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, expectedWords = [] } = body;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && !process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "AI OCR not configured on server" }, { status: 501 });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `Please read the handwriting or drawing in this image and transcribe the English or Thai word written. 
If the handwriting matches or is close to any of these expected target words: [${expectedWords.join(", ")}], prefer returning that exact expected word.
Return only the recognized text/word with no explanation or punctuation.`;

    const result = await Promise.race([
      generateText({
        model: google("gemini-1.5-flash"),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image", image: base64Data },
            ],
          },
        ],
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("OCR timeout")), 4500)),
    ]);

    const recognizedText = result.text ? result.text.trim().toLowerCase() : "";
    return NextResponse.json({ status: "success", text: recognizedText });
  } catch (error: any) {
    console.error("[API Error /api/vocab/ocr]:", error);
    return NextResponse.json({ error: error?.message || "Failed to recognize handwriting" }, { status: 500 });
  }
}
