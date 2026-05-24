import PagePlaceholder from "@/app/components/PagePlaceholder";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CourtDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <PagePlaceholder
      title={`球場詳情 #${id}`}
      titleEn="Court Detail"
      description="球場完整資料:場地照片、地址、營業時間、收費、預約方式、停車資訊、淋浴更衣設施、附近交通與用戶實際打球評價。"
      parentPath="/courts"
      parentLabel="球場總覽"
    />
  );
}
