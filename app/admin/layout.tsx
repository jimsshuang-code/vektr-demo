import { auth, signOut } from "@/auth";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;

  return (
    <div style={{ minHeight: "100vh", background: "#fafbfc", fontFamily: "Inter, 'Noto Sans TC', sans-serif", color: "#0a1929", display: "flex" }}>
      <aside style={{ width: 220, background: "#ffffff", borderRight: "1px solid #e1e8ef", padding: "20px 12px", flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 20, padding: "0 12px 20px", letterSpacing: 1 }}>VEKTR</div>
        <NavItem href="/admin" label="儀表板" enabled={false} />
        <NavItem href="/admin/members" label="會員管理" enabled={false} />
        <NavItem href="/admin/coaches" label="教練管理" enabled={false} />
        <NavItem href="/admin/courts" label="球場管理" enabled />
        <NavItem href="/admin/products" label="商品管理" enabled={false} />
        <NavItem href="/admin/orders" label="訂單管理" enabled={false} />
        <NavItem href="/admin/permissions" label="權限管理" enabled={false} />
        <NavItem href="/admin/settings" label="系統設定" enabled={false} />
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header style={{ height: 56, borderBottom: "1px solid #e1e8ef", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 24px", gap: 16 }}>
          <span style={{ fontSize: 13, color: "#4a5a6e" }}>
            {user?.name ?? user?.email}{user?.role ? `（${user.role}）` : ""}
          </span>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/admin/login" }); }}>
            <button type="submit" style={{ fontSize: 13, color: "#4a5a6e", background: "transparent", border: "1px solid #e1e8ef", borderRadius: 6, padding: "6px 12px", cursor: "pointer" }}>登出</button>
          </form>
        </header>
        <main style={{ flex: 1, padding: 24 }}>{children}</main>
      </div>
    </div>
  );
}

function NavItem({ href, label, enabled }: { href: string; label: string; enabled: boolean }) {
  if (!enabled) {
    return <div style={{ padding: "10px 12px", fontSize: 14, color: "#b0bcca", cursor: "not-allowed", userSelect: "none" }} title="尚未開放">{label}</div>;
  }
  return <Link href={href} style={{ display: "block", padding: "10px 12px", fontSize: 14, color: "#0a1929", textDecoration: "none", borderRadius: 8, fontWeight: 500 }}>{label}</Link>;
}
