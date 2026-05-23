import type { Metadata } from "next";
import { Inter, Noto_Serif_TC } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSerifTC = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "VEKTR — Pickleball Platform",
    template: "%s | VEKTR",
  },
  description: "VEKTR 是台灣首個整合球場、教練、約球、商城與學習資源的 pickleball 生態系平台。",
  keywords: ["pickleball", "匹克球", "VEKTR", "球場", "教練", "約球"],
  authors: [{ name: "VEKTR" }],
  openGraph: {
    title: "VEKTR — Pickleball Platform",
    description: "電商 × 社群 × 教學三位一體的 pickleball 生態系",
    type: "website",
    locale: "zh_TW",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      className={`${inter.variable} ${notoSerifTC.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}