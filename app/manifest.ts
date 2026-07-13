import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VocabForDekTriam | ฝึกศัพท์ TCAS บน iPad",
    short_name: "VocabForDekTriam",
    description: "แอปพลิเคชันฝึกเขียนและท่องจำคำศัพท์ภาษาอังกฤษสำหรับเด็กเตรียมสอบ TGAT/A-Level บน iPad ด้วย Apple Pencil",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#4f46e5",
    orientation: "any",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
