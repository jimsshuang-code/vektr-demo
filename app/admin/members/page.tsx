import PagePlaceholder from "@/app/components/PagePlaceholder";

export default function AdminMembersPage() {
  return (
    <PagePlaceholder
      title="會員管理"
      titleEn="Members"
      description="管理平台會員資料:基本資料查閱、會員等級、活動歷史、停權與解鎖、客服紀錄與糾紛處理。支援批次操作與 CSV 匯出。"
      parentPath="/admin"
      parentLabel="管理後台"
    />
  );
}
