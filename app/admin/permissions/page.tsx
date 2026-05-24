import PagePlaceholder from "@/app/components/PagePlaceholder";

export default function AdminPermissionsPage() {
  return (
    <PagePlaceholder
      title="權限管理"
      titleEn="Permissions"
      description="後台帳號與角色權限管理。預設五層角色:super admin、admin、editor、coach、viewer,可自訂細部權限。記錄所有後台操作日誌。"
      parentPath="/admin"
      parentLabel="管理後台"
    />
  );
}
