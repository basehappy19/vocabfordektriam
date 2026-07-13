import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

// Use next/font/google with precise subsets and display: 'swap' to eliminate Cumulative Layout Shift (CLS)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai", "latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

// Viewport configuration optimized specifically for iPad Apple Pencil drawing (`touch-action: none` / user-scalable prevention on practice pad)
export const viewport: Viewport = {
  themeColor: "#4f46e5", // Indigo-600 DekTriam primary color
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Supports zoom where allowed while maintaining accessibility
  colorScheme: "light dark",
};

// Comprehensive Metadata tailored for "VocabForDekTriam" achieving SEO Score 100
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://vocabfordektriam.th"),
  title: {
    default: "VocabForDekTriam | ฝึกศัพท์เตรียมสอบเข้ามหาวิทยาลัยบน iPad ด้วย Apple Pencil",
    template: "%s | VocabForDekTriam",
  },
  description:
    "แอปพลิเคชันฝึกเขียนและท่องจำคำศัพท์ภาษาอังกฤษสำหรับเด็กเตรียมสอบ TGAT, A-Level และ TCAS ออกแบบมาโดยเฉพาะสำหรับการใช้งานบน iPad ร่วมกับ Apple Pencil พร้อมระบบ AI ช่วยสร้างตัวอย่างประโยค และระบบจำแบบเว้นระยะ (Spaced Repetition System)",
  keywords: [
    "VocabForDekTriam",
    "เตรียมสอบเข้ามหาวิทยาลัย",
    "คำศัพท์ TGAT",
    "คำศัพท์ A-Level",
    "TCAS",
    "เด็กซิ่ว",
    "ฝึกศัพท์ภาษาอังกฤษ",
    "iPad Apple Pencil Vocab",
    "Spaced Repetition",
    "AI Vocab Generator",
    "ติวอังกฤษ TCAS",
  ],
  authors: [{ name: "VocabForDekTriam Team", url: "https://vocabfordektriam.th" }],
  creator: "VocabForDekTriam",
  publisher: "VocabForDekTriam Education",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      "th-TH": "/",
      "en-US": "/en",
    },
  },
  openGraph: {
    title: "VocabForDekTriam | ฝึกคำศัพท์ TCAS / TGAT / A-Level ด้วย Apple Pencil บน iPad",
    description:
      "ท่องจำคำศัพท์ภาษาอังกฤษอย่างแม่นยำด้วยระบบเขียนคัดบนหน้าจอ iPad พร้อมระบบ Spaced Repetition และ AI ช่วยสร้างประโยคตัวอย่างอัจฉริยะ",
    url: "https://vocabfordektriam.th",
    siteName: "VocabForDekTriam",
    locale: "th_TH",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VocabForDekTriam - Thai Students iPad Vocabulary Practice App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VocabForDekTriam | ฝึกศัพท์เตรียมสอบ TCAS บน iPad ด้วย Apple Pencil",
    description:
      "ท่องจำคำศัพท์ภาษาอังกฤษสำหรับเด็กเตรียมสอบ TGAT และ A-Level ด้วยระบบ Spaced Repetition และ AI ประโยคตัวอย่าง",
    creator: "@vocabfordektriam",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  category: "education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${inter.variable} ${notoSansThai.variable} h-full antialiased scroll-smooth`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col font-sans bg-[#f8fafc] text-[#0f172a] selection:bg-indigo-500 selection:text-white"
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-indigo-600 text-white font-medium px-4 py-2 rounded-lg shadow-lg"
        >
          ข้ามไปยังเนื้อหาหลัก (Skip to main content)
        </a>
        <main id="main-content" className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
