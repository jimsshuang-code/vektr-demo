import PagePlaceholder from "@/app/components/PagePlaceholder";

export default function AdminOrdersPage() {
  return (
    <PagePlaceholder
      title="訂單管理"
      titleEn="Orders"
      description="管理所有媒合訂單:商品諮詢、課程預約、球場預約、試打申請的完整狀態追蹤。第一階段不含金流,訂單僅為媒合紀錄,未來開放金流後將整合交易資料。"
      parentPath="/admin"
      parentLabel="管理後台"
    />
  );
}
