import PagePlaceholder from "@/app/components/PagePlaceholder";

export default function AdminPage() {
  return (
    <PagePlaceholder
      title="管理後台"
      titleEn="Admin"
      description="VEKTR 內部管理介面。商品、教練、內容、會員與平台數據統一管理入口,僅限授權人員存取。"
      parentPath="/"
      parentLabel="首頁"
    />
  );
}
