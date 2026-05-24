import PagePlaceholder from "@/app/components/PagePlaceholder";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CoachDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <PagePlaceholder
      title={`教練介紹 #${id}`}
      titleEn="Coach Profile"
      description="教練完整資料:DUPR 等級、執教經歷、專長項目、教學風格、可預約時段、單堂與包月收費、上課地點,以及學員實際上課後的回饋評價。"
      parentPath="/coaches"
      parentLabel="教練總覽"
    />
  );
}
