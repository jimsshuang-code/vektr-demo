import PagePlaceholder from "@/app/components/PagePlaceholder";

export default function AdminProductsPage() {
  return (
    <PagePlaceholder
      title="商品管理"
      titleEn="Product Management"
      description="管理商城展示商品:新增、編輯、下架、分類調整、規格更新、授權通路連結維護,以及商品點擊與導購數據追蹤。"
      parentPath="/admin"
      parentLabel="管理後台"
    />
  );
}
