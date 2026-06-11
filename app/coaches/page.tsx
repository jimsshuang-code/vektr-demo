// app/coaches/page.tsx — 教練(預約後端未上線,精緻預覽 + 招募教練)
import type { Metadata } from "next";
import ModulePreview from "@/app/components/ModulePreview";

export const metadata: Metadata = {
  title: "教練媒合",
  description: "VEKTR 教練媒合:認證教練、線上預約、私人與團體課、課後雙向評價。教練招募中。",
};

export default function CoachesPage() {
  return (
    <ModulePreview
      title="教練媒合"
      titleEn="Coaches"
      badge="即將上線"
      lead="找到適合你的匹克球教練 —— 從入門、技術精進到比賽指導。教練媒合與線上預約正在籌備中。若你是教練,歡迎現在就申請加入,成為平台首批合作教練。"
      features={[
        { h: "認證教練", d: "完整資歷、專長、收費與學員評價,公開透明。" },
        { h: "線上預約", d: "查看可預約時段,線上送出預約需求。" },
        { h: "私人 / 團體課", d: "一對一精修或小組揪團,彈性選擇。" },
        { h: "課後互評", d: "雙向評價,維持教學品質與信任。" },
      ]}
      links={[
        { href: "/coaches/apply", label: "申請成為教練", primary: true },
        { href: "/learn", label: "先自學" },
      ]}
    />
  );
}
