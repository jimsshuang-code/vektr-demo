import PagePlaceholder from "@/app/components/PagePlaceholder";

export default function CourtsMapPage() {
  return (
    <PagePlaceholder
      title="球場地圖"
      titleEn="Court Map"
      description="互動式地圖呈現全台球場分布。依距離、場地類型、價位、開放時段篩選,直接從地圖點選查看球場詳情與預約資訊。"
      parentPath="/courts"
      parentLabel="球場總覽"
    />
  );
}
