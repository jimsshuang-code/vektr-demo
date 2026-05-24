import PagePlaceholder from "@/app/components/PagePlaceholder";

export default function AdminCourtsPage() {
  return (
    <PagePlaceholder
      title="球場管理"
      titleEn="Courts"
      description="管理平台收錄球場:新增、編輯、下架、地址與營業時間維護、預約規則設定、合作條件與分潤模式管理。"
      parentPath="/admin"
      parentLabel="管理後台"
    />
  );
}
