// app/learn/videos/page.tsx — 教學影片(學習路徑)
// 為避免外連影片失效,這裡以「主題 + 動作要點」整理學習路徑,並以 YouTube 搜尋連結帶出
// 該主題的最新教學影片(搜尋連結永遠有效,不會像固定影片網址那樣失連)。
import type { Metadata } from "next";
import { LearnShell, Section, CTA } from "../_components/LearnUI";

export const metadata: Metadata = {
  title: "匹克球教學影片與學習路徑",
  description:
    "依主題整理的匹克球學習路徑:握拍、發球、第三拍下擋(drop)、dink、截擊與雙打走位,附動作要點與教學影片搜尋。",
};

function yt(q: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

const TOPICS: { stage: string; items: { name: string; point: string; q: string }[] }[] = [
  {
    stage: "入門 Beginner",
    items: [
      { name: "握拍與站姿", point: "大陸式握法、放鬆手腕、預備時拍面朝前。", q: "pickleball grip ready position 教學" },
      { name: "發球", point: "低手、接觸點低於腰,先求穩定過廚房再求變化。", q: "pickleball serve 教學 中文" },
      { name: "正反手抽球", point: "用身體轉動帶動,而非只用手臂。", q: "pickleball forehand backhand drive 教學" },
    ],
  },
  {
    stage: "進階 Intermediate",
    items: [
      { name: "第三拍下擋 Drop", point: "把球軟落到對方廚房,化解對方的攻擊節奏。", q: "pickleball third shot drop 教學" },
      { name: "Dink 小球", point: "在廚房線前輕碰、低過網,耐心等對方失誤。", q: "pickleball dink 教學" },
      { name: "截擊 Volley", point: "在廚房線前穩定擋球,注意別踩線。", q: "pickleball volley 教學" },
    ],
  },
  {
    stage: "雙打戰術 Doubles",
    items: [
      { name: "上網與站位", point: "兩人同進退、一起推進到廚房線。", q: "pickleball doubles positioning 教學" },
      { name: "轉換時機", point: "打出 drop 後立刻上網搶佔廚房線。", q: "pickleball transition zone 教學" },
      { name: "溝通與補位", point: "喊聲、確認中路球誰接,減少漏接。", q: "pickleball doubles communication strategy" },
    ],
  },
];

export default function VideosPage() {
  return (
    <LearnShell
      title="教學影片與學習路徑"
      titleEn="Videos"
      intro="依「入門 → 進階 → 雙打戰術」順序練習效果最好。每個主題附上動作要點,點「看教學影片」會帶你到該主題的 YouTube 教學搜尋,挑你聽得懂的頻道看即可。"
    >
      {TOPICS.map((t) => (
        <Section key={t.stage} title={t.stage}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {t.items.map((it) => (
              <a
                key={it.name}
                href={yt(it.q)}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-[var(--color-primary)] transition-colors"
              >
                <div className="font-bold text-[var(--color-text)]">{it.name}</div>
                <p className="mt-1 text-sm text-[var(--color-text-muted)] leading-relaxed">{it.point}</p>
                <span className="mt-3 inline-block text-sm font-bold text-[var(--color-primary)]">
                  看教學影片 ↗
                </span>
              </a>
            ))}
          </div>
        </Section>
      ))}

      <p className="text-sm text-[var(--color-text-muted)]">
        提示:練習時把單一動作重複做到穩定,再進下一個主題;有球友一起練、互相回饋進步最快。
      </p>

      <CTA />
    </LearnShell>
  );
}
