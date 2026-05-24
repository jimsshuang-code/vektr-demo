import PagePlaceholder from "@/app/components/PagePlaceholder";

export default function AdminCoachesPage() {
  return (
    <PagePlaceholder
      title="教練管理"
      titleEn="Coach Management"
      description="管理平台教練資源:申請審核、資歷驗證、上下架控制、課程審核、評價檢視與爭議處理。"
      parentPath="/admin"
      parentLabel="管理後台"
    />
  );
}
