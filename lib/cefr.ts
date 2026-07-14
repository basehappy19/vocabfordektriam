/**
 * CEFR (Common European Framework of Reference for Languages) standard mapping helper.
 * Standard levels: A1 (Beginner), A2 (Elementary), B1 (Intermediate), B2 (Upper Intermediate - TCAS/TGAT), C1 (Advanced - A-Level), C2 (Proficiency - Master).
 */

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export function getCefrFromNumber(difficultyLevel: number | string | undefined): CefrLevel {
  if (typeof difficultyLevel === "string") {
    const upper = difficultyLevel.trim().toUpperCase() as CefrLevel;
    if (["A1", "A2", "B1", "B2", "C1", "C2"].includes(upper)) {
      return upper;
    }
  }

  const num = typeof difficultyLevel === "number" ? difficultyLevel : parseInt(String(difficultyLevel || 4), 10);
  switch (num) {
    case 1:
      return "A1";
    case 2:
      return "A2";
    case 3:
      return "B1";
    case 4:
      return "B2";
    case 5:
      return "C1";
    case 6:
      return "C2";
    default:
      return "B2";
  }
}

export function getDifficultyNumberFromCefr(cefr: string): number {
  switch (cefr.toUpperCase()) {
    case "A1":
      return 1;
    case "A2":
      return 2;
    case "B1":
      return 3;
    case "B2":
      return 4;
    case "C1":
      return 5;
    case "C2":
      return 6;
    default:
      return 4;
  }
}

export function getCefrBadgeProps(cefrOrNum: string | number | undefined) {
  const cefr = getCefrFromNumber(cefrOrNum);

  switch (cefr) {
    case "A1":
      return {
        cefr: "A1",
        label: "Beginner",
        thaiLabel: "ระดับเริ่มต้น",
        colorClass: "bg-slate-100 text-slate-700 border-slate-300",
        badgeText: "A1",
      };
    case "A2":
      return {
        cefr: "A2",
        label: "Elementary",
        thaiLabel: "ระดับพื้นฐาน",
        colorClass: "bg-emerald-50 text-emerald-700 border-emerald-300",
        badgeText: "A2",
      };
    case "B1":
      return {
        cefr: "B1",
        label: "Intermediate",
        thaiLabel: "ระดับกลาง",
        colorClass: "bg-blue-50 text-blue-700 border-blue-300",
        badgeText: "B1",
      };
    case "B2":
      return {
        cefr: "B2",
        label: "Upper Intermediate",
        thaiLabel: "ระดับข้อสอบ TGAT/TCAS",
        colorClass: "bg-indigo-50 text-indigo-700 border-indigo-300",
        badgeText: "B2",
      };
    case "C1":
      return {
        cefr: "C1",
        label: "Advanced",
        thaiLabel: "ระดับข้อสอบ A-Level/ยากพิเศษ",
        colorClass: "bg-amber-50 text-amber-800 border-amber-300",
        badgeText: "C1",
      };
    case "C2":
      return {
        cefr: "C2",
        label: "Proficient",
        thaiLabel: "ระดับเชี่ยวชาญสูงสุด",
        colorClass: "bg-rose-50 text-rose-700 border-rose-300",
        badgeText: "C2",
      };
    default:
      return {
        cefr: "B2",
        label: "Upper Intermediate",
        thaiLabel: "ระดับข้อสอบ TGAT/TCAS",
        colorClass: "bg-indigo-50 text-indigo-700 border-indigo-300",
        badgeText: "B2",
      };
  }
}
