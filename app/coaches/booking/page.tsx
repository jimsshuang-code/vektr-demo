import PagePlaceholder from "@/app/components/PagePlaceholder";

export default function CoachesBookingPage() {
  return (
    <PagePlaceholder
      title="預約課程"
      titleEn="Book a Lesson"
      description="瀏覽教練可預約時段、選擇場地與課程類型(私人課/小組課/團體班),確認後送出預約。VEKTR 僅做媒合,實際付款與課程確認由教練端處理。"
      parentPath="/coaches"
      parentLabel="教練總覽"
    />
  );
}
