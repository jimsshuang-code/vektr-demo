// app/learn/rules/page.tsx — 規則手冊
import type { Metadata } from "next";
import { LearnShell, Section, CTA } from "../_components/LearnUI";

export const metadata: Metadata = {
  title: "匹克球規則手冊",
  description:
    "匹克球(pickleball)規則中文整理:場地與器材、發球規則、計分制、廚房區(非截擊區)、雙彈跳規則、常見犯規與雙打輪轉。",
};

export default function RulesPage() {
  return (
    <LearnShell
      title="匹克球規則手冊"
      titleEn="Rules"
      intro="以下為匹克球常見規則的中文整理,適合新手快速理解。正式比賽以主辦單位採用之規則版本(如 USA Pickleball 官方規則)為準。"
    >
      <Section title="場地與器材">
        <p>
          球場為 13.41 公尺 × 6.10 公尺(20×44 英尺),與雙打羽球場同尺寸,中間以球網分隔,網高中央約
          86 公分。球網兩側各有一塊距網 2.13 公尺(7 英尺)的「非截擊區」,俗稱「廚房(kitchen)」。
        </p>
        <p>
          使用無彈性的硬質球拍(比網球拍小、無線)與帶孔的塑膠球。室內球與室外球孔數與重量略有不同。
        </p>
      </Section>

      <Section title="發球規則">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>發球須由底線後、單手低手發出,擊球瞬間球拍接觸點需低於腰部。</li>
          <li>發球採對角線發球,發向對角的接發球區,且須越過廚房區落地。</li>
          <li>傳統發球為球拋下後直接擊出;另有規則允許「落地發球(drop serve)」,讓球落地後再擊出。</li>
          <li>發球時雙腳不可踩線或踏入場內。每次只發一球(沒有第二發)。</li>
        </ul>
      </Section>

      <Section title="雙彈跳規則(Double Bounce Rule)">
        <p>
          發球後,接發球方必須等球「落地一次」才能回擊;發球方回擊時也必須等球「落地一次」。也就是說,開球後的前兩拍都必須先落地,雙方才能開始截擊(volley,不落地直接打)。這條規則是匹克球節奏的核心。
        </p>
      </Section>

      <Section title="廚房區 / 非截擊區(The Kitchen)">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>球員不可站在廚房區內進行截擊(不落地的擊球)。</li>
          <li>截擊時,若因衝力導致腳踩到廚房線或落入廚房區,即為犯規。</li>
          <li>可以進入廚房區擊打「已落地的球」,擊完應儘速退出。</li>
        </ul>
      </Section>

      <Section title="計分制">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>傳統採「發球得分制」:只有發球方得分,接發球方贏球只取得發球權。</li>
          <li>一般打到 11 分、且需領先 2 分獲勝;部分賽事採 15 或 21 分。</li>
          <li>
            雙打報分念三個數字:發球方分數、接發球方分數、發球員號(1 或 2)。例如「5-3-2」。
          </li>
        </ul>
      </Section>

      <Section title="雙打發球輪轉">
        <p>
          雙打中,除了每局第一個發球只由一位球員發(開局只算「第二發球員」),之後每隊兩位球員都會輪流發球;同隊兩人都失去發球權後,發球權才交給對方。發球方每得一分,該發球員與同伴互換左右站位。
        </p>
      </Section>

      <Section title="常見犯規(Faults)">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>球出界、未過網、或未先落地就截擊(違反雙彈跳)。</li>
          <li>截擊時踩到或踏入廚房區。</li>
          <li>發球違規(過腰、踩線、發錯區)。</li>
          <li>球在同一方被擊中兩次、或球員身體/衣物碰到網。</li>
        </ul>
      </Section>

      <Section title="新手最常搞錯的三件事">
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>忘了「雙彈跳」:開球後前兩拍急著截擊,其實都要先讓球落地。</li>
          <li>站進廚房截擊:興奮往前撲球,腳踩進廚房線就犯規。</li>
          <li>以為贏球就得分:傳統制只有發球方能得分,接發方贏球只是換發。</li>
        </ol>
      </Section>

      <CTA />
    </LearnShell>
  );
}
