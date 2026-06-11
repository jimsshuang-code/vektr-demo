// app/shop/page.tsx — 商城(預覽,金流未啟用)
import type { Metadata } from "next";
import ModulePreview from "@/app/components/ModulePreview";

export const metadata: Metadata = {
  title: "商城",
  description: "VEKTR 商城:球拍、球類、鞋類、服飾、球袋與配件,以及試打體驗服務。即將開賣。",
};

export default function ShopPage() {
  return (
    <ModulePreview
      title="VEKTR 商城"
      titleEn="Shop"
      badge="即將開賣"
      lead="嚴選 pickleball 裝備 —— 球拍、球類、鞋類、服飾、球袋與配件,搭配選拍指南與試打體驗,幫你找到最合適的裝備。商城正在籌備中,留下信箱我們開賣第一時間通知你。"
      categories={["球拍", "球類", "鞋類", "服飾", "球袋", "配件", "試打體驗"]}
      features={[
        { h: "選拍指南", d: "依重量、握把、拍面與你的程度,推薦適合的球拍。" },
        { h: "試打體驗", d: "下單前先試打,找到真正順手的那一支。" },
        { h: "會員專屬", d: "結合 DUPR 等級與約球紀錄,給你個人化推薦。" },
        { h: "教練分潤", d: "透過教練推薦購買,支持你的教練。" },
      ]}
      links={[
        { href: "/learn/guide", label: "先看選拍指南", primary: true },
        { href: "/match", label: "開始約球" },
      ]}
    />
  );
}
