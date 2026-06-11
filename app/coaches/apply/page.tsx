// app/coaches/apply/page.tsx — 申請成為教練(招募,先用 email 收件)
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "申請成為教練",
  description: "加入 VEKTR 成為合作教練:上架課程、開放預約、觸及更多學員。立即提交申請。",
};

const MAIL = "service@abouttime-tech.com";

export default function CoachesApplyPage() {
  const subject = encodeURIComponent("VEKTR 教練申請");
  const body = encodeURIComponent(
    [
      "姓名:",
      "聯絡方式(電話/LINE):",
      "所在地區:",
      "DUPR 等級:",
      "執教經歷:",
      "持有證照:",
      "專長(入門/技術/戰術/青少年等):",
      "可授課時段:",
      "希望收費:",
    ].join("\n")
  );

  return (
    <div className="bg-[var(--color-bg)]">
      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-16">
        <Link href="/coaches" className="text-sm text-[var(--color-text-muted)] hover:underline">
          ← 教練媒合
        </Link>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--color-text)]">
          申請成為 VEKTR 教練
        </h1>
        <p className="mt-4 text-[var(--color-text-muted)] leading-relaxed">
          VEKTR 正在招募首批合作教練。通過審核後,你可以在平台上架課程、開放線上預約,觸及更多想學球的學員,並建立你的個人品牌。
        </p>

        <div className="mt-8 space-y-3">
          <h2 className="text-lg font-bold text-[var(--color-text)]">合作教練可以</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-[var(--color-text-muted)]">
            <li>建立公開教練頁,展示資歷、專長與收費。</li>
            <li>開放學員線上預約私人課或團體班。</li>
            <li>透過約球與商城生態,觸及更多潛在學員與裝備分潤。</li>
            <li>累積課後評價,建立口碑。</li>
          </ul>
        </div>

        <div className="mt-8 space-y-3">
          <h2 className="text-lg font-bold text-[var(--color-text)]">申請方式</h2>
          <p className="text-[var(--color-text-muted)] leading-relaxed">
            線上申請表單即將上線。現階段請點下方按鈕,以 email 寄出你的資歷與聯絡方式,我們會盡快與你聯繫安排審核。
          </p>
        </div>

        <a
          href={`mailto:${MAIL}?subject=${subject}&body=${body}`}
          className="mt-6 inline-block px-6 py-3 rounded-md bg-[var(--color-primary)] text-white font-bold"
        >
          以 Email 提交申請
        </a>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">
          或直接來信 {MAIL}
        </p>
      </div>
    </div>
  );
}
