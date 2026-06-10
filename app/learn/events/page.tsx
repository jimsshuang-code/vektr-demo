// app/learn/events/page.tsx — 賽事資訊
// 不放假的賽事資料;以「如何理解分級、如何找到比賽與同好活動」的常青內容為主,
// 待之後接賽事資料來源再上即時行事曆。
import type { Metadata } from "next";
import Link from "next/link";
import { LearnShell, Section, CTA } from "../_components/LearnUI";

export const metadata: Metadata = {
  title: "匹克球賽事與分級制度",
  description:
    "認識匹克球賽事類型與 DUPR 分級制度,以及如何在台灣找到比賽、同好揪團與練習對手。",
};

export default function EventsPage() {
  return (
    <LearnShell
      title="賽事與分級"
      titleEn="Events"
      intro="想從休閒打球進階到參加比賽?先了解分級制度與賽事類型,再找到適合自己的活動。"
    >
      <Section title="DUPR 分級是什麼">
        <p>
          DUPR(Dynamic Universal Pickleball Rating)是國際通用的匹克球動態評分,範圍約 2.0–8.0,依你與不同對手的實際比賽結果動態調整。它讓「找程度相近的對手」變得有依據 —— 數字越接近,比賽越勢均力敵、也越好玩。
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>2.0–3.0</strong>:入門到初階,正在熟悉規則與基本擊球。</li>
          <li><strong>3.0–4.0</strong>:中階,能穩定來回、開始運用 drop 與 dink。</li>
          <li><strong>4.0–5.0</strong>:進階,戰術與落點控制成熟。</li>
          <li><strong>5.0 以上</strong>:競技/職業水準。</li>
        </ul>
        <p className="text-sm">
          在 VEKTR 約球時可依 DUPR 區間篩選場次,找到適合自己的對手。
        </p>
      </Section>

      <Section title="常見賽事類型">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>分級賽</strong>:依 DUPR 或自評分級分組,同程度對打,最適合初次參賽。</li>
          <li><strong>公開賽 / 邀請賽</strong>:不限或限定資格,競爭性較高。</li>
          <li><strong>同好揪團 / 聯誼賽</strong>:以交流為主,氣氛輕鬆,適合認識球友。</li>
          <li><strong>企業 / 社團對抗</strong>:團體制,常見於公司或社群活動。</li>
        </ul>
      </Section>

      <Section title="如何找到比賽與活動">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>關注台灣各地匹克球協會、社群與球館的公告。</li>
          <li>在 VEKTR <Link href="/match" className="text-[var(--color-primary)] underline">約球</Link>揪固定球友、組隊一起報名。</li>
          <li>從<Link href="/courts" className="text-[var(--color-primary)] underline">球場地圖</Link>找常辦活動的場館。</li>
        </ul>
        <p className="text-sm text-[var(--color-text-muted)]">
          VEKTR 的賽事行事曆功能規劃中,上線後會在這裡彙整可報名的活動。若你是主辦方想曝光活動,歡迎透過頁尾「聯絡我們」與我們聯繫。
        </p>
      </Section>

      <CTA />
    </LearnShell>
  );
}
