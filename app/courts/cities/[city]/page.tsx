import PagePlaceholder from "@/app/components/PagePlaceholder";

interface Props {
  params: Promise<{ city: string }>;
}

export default async function CityCourtsPage({ params }: Props) {
  const { city } = await params;
  return (
    <PagePlaceholder
      title={`${decodeURIComponent(city)} 球場列表`}
      titleEn="Courts by City"
      description="該城市所有 pickleball 球場列表,包含市區、近郊、24 小時開放與會員制場地。每個球場提供完整資訊、用戶評價與最近一週可預約時段。"
      parentPath="/courts"
      parentLabel="球場總覽"
    />
  );
}
