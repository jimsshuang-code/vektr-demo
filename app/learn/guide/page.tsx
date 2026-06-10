// app/learn/guide/page.tsx — 新手指南
import type { Metadata } from "next";
import Link from "next/link";
import { LearnShell, Section, Steps, CTA } from "../_components/LearnUI";

export const metadata: Metadata = {
  title: "匹克球新手指南",
  description:
    "第一次打匹克球?從什麼是 pickleball、要準備什麼裝備、怎麼選球拍、去哪找球場與球友,到場上禮儀,一篇帶你上場。",
};

export default function GuidePage() {
  return (
    <LearnShell
      title="匹克球新手指南"
      titleEn="Beginner Guide"
      intro="完全沒打過也沒關係。匹克球的學習曲線很友善,看完這篇、準備好基本裝備,就能下場打第一場。"
    >
      <Section title="什麼是匹克球?">
        <p>
          匹克球(pickleball)是一種結合網球、羽球與桌球的拍類運動。場地小、球速相對慢、規則簡單,對體力與技術門檻較低,男女老少都能一起打,因此近年在全球與台灣快速成長,是最容易揪到朋友一起玩的運動之一。
        </p>
      </Section>

      <Section title="第一次要準備什麼">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>球拍</strong>:入門先用一支中等重量(約 210–240 克)、握把粗細合手的複合材質拍即可,不必一開始就買高階拍。
          </li>
          <li>
            <strong>球</strong>:分室內球與室外球,孔數與硬度不同,依你常打的場地選擇。
          </li>
          <li>
            <strong>鞋子</strong>:穿止滑的室內運動鞋或網球鞋,有橫向支撐、抓地力好,避免跑步鞋(側向支撐不足易扭傷)。
          </li>
          <li>
            <strong>服裝</strong>:排汗透氣的運動服與毛巾、水壺即可。
          </li>
        </ul>
      </Section>

      <Section title="怎麼選第一支球拍">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>重量</strong>:輕拍(&lt;210g)好控球、手腕負擔小;重拍(&gt;240g)力量大但較吃力。新手建議中等重量。</li>
          <li><strong>握把粗細</strong>:握起來手指與掌心約留一指空隙最合適,太粗易脫手、太細易發力過度。</li>
          <li><strong>拍面</strong>:加大甜區的款式容錯率高,適合新手。</li>
          <li>先借朋友或租用試打不同款,再決定購入。</li>
        </ul>
        <p className="text-sm">
          之後 VEKTR 商城會提供選拍建議與試打預約;現階段可先到{" "}
          <Link href="/learn/rules" className="text-[var(--color-primary)] underline">規則手冊</Link>{" "}
          把規則弄懂。
        </p>
      </Section>

      <Section title="從零到上場:四步驟">
        <Steps
          items={[
            { h: "學會基本規則", d: <>花 10 分鐘看完<Link href="/learn/rules" className="text-[var(--color-primary)] underline">規則手冊</Link>,重點記住「雙彈跳」與「廚房區不可截擊」。</> },
            { h: "找到球場", d: <>用<Link href="/courts" className="text-[var(--color-primary)] underline">球場地圖</Link>找附近的場地,看評分、收費與時段。</> },
            { h: "揪到球友", d: <>到<Link href="/match" className="text-[var(--color-primary)] underline">約球</Link>瀏覽開團中的球局直接加入,或自己開一場揪人;也能依 DUPR 等級找程度相近的場次。</> },
            { h: "下場打、累積等級", d: <>實際打球、賽後互評,逐步建立你的球技等級與球友圈。</> },
          ]}
        />
      </Section>

      <Section title="場上基本禮儀">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>報分清楚、有疑義先口頭確認,爭議球可重打(let)。</li>
          <li>撿球、傳球給對方時用滾的或穩穩遞,避免亂拋。</li>
          <li>準時到場、輪場時間到就換人,讓大家都打得到。</li>
          <li>打完互相擊拍(拍柄輕碰)致意,維持友善氛圍。</li>
        </ul>
      </Section>

      <CTA />
    </LearnShell>
  );
}
