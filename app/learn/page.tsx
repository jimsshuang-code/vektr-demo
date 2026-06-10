// app/learn/page.tsx — 學習中心 hub
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "學習中心",
  description:
    "VEKTR 學習中心:匹克球規則手冊、新手入門指南、教學影片與賽事資訊。從第一次拿拍到參加賽事,一站學會 pickleball。",
};

const SECTIONS = [
  {
    href: "/learn/rules",
    code: "L01",
    name: "規則手冊",
    en: "Rules",
    desc: "發球、計分、廚房區(非截擊區)、犯規與雙打輪轉,一次看懂匹克球規則。",
  },
  {
    href: "/learn/guide",
    code: "L02",
    name: "新手指南",
    en: "Beginner Guide",
    desc: "第一支球拍怎麼選、要準備什麼、如何找場地與球友、場上基本禮儀。",
  },
  {
    href: "/learn/videos",
    code: "L03",
    name: "教學影片",
    en: "Videos",
    desc: "依主題整理的學習路徑:發球、第三拍下擋、截擊、移位與雙打站位。",
  },
  {
    href: "/learn/events",
    code: "L04",
    name: "賽事資訊",
    en: "Events",
    desc: "認識 pickleball 賽事與分級制度,以及如何在台灣找到比賽與同好活動。",
  },
];

export default function LearnPage() {
  return (
    <div className="bg-[var(--color-bg)]">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--color-text-muted)]">
          Learn · 學習中心
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-[var(--color-text)]">
          從零開始學 pickleball
        </h1>
        <p className="mt-4 text-lg text-[var(--color-text-muted)] leading-relaxed max-w-2xl">
          匹克球(pickleball)結合網球、羽球與桌球的特點,規則簡單、上手快、各年齡都能玩。這裡幫你從規則、裝備到實戰,一步步入門。
        </p>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group block rounded-2xl border border-slate-200 bg-white p-6 hover:border-[var(--color-primary)] transition-colors"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xs text-[var(--color-primary)]">{s.code}</span>
                <span className="font-mono text-[11px] tracking-widest uppercase text-[var(--color-text-muted)]">
                  {s.en}
                </span>
              </div>
              <div className="mt-3 text-xl font-bold text-[var(--color-text)]">{s.name}</div>
              <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed">{s.desc}</p>
              <span className="mt-4 inline-block text-sm font-bold text-[var(--color-primary)]">
                閱讀 →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-[var(--color-bg-dark)] text-white p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="font-bold text-lg">學完就下場練習</div>
            <div className="text-slate-300 text-sm mt-1">找附近球場、揪程度相近的球友一起打。</div>
          </div>
          <div className="flex gap-3">
            <Link href="/courts" className="px-5 py-2.5 rounded-md bg-[var(--color-accent)] text-[var(--color-text)] font-bold text-sm">
              找球場
            </Link>
            <Link href="/match" className="px-5 py-2.5 rounded-md border border-white/30 text-white font-bold text-sm">
              開始約球
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
