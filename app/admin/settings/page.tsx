import PagePlaceholder from "@/app/components/PagePlaceholder";

export default function AdminSettingsPage() {
  return (
    <PagePlaceholder
      title="系統設定"
      titleEn="Settings"
      description="平台全域設定:站內公告、首頁 banner、SEO meta、客服資訊、第三方服務串接(GA、Mixpanel、金流通道預留)、系統參數調整。"
      parentPath="/admin"
      parentLabel="管理後台"
    />
  );
}
