import PagePlaceholder from "@/app/components/PagePlaceholder";

export default function AdminContentPage() {
  return (
    <PagePlaceholder
      title="內容管理"
      titleEn="Content Management"
      description="維護網站內容:首頁文案、學習中心文章、教學影片、規則手冊、賽事公告、首頁 Banner 與活動推播訊息。"
      parentPath="/admin"
      parentLabel="管理後台"
    />
  );
}
