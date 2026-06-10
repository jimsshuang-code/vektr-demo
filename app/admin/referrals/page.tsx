// app/admin/referrals/page.tsx
// 後台推薦成長報表(server component)。守衛 requireAdmin('members',{write}) -> super_admin/admin。
// 資料走 SECURITY DEFINER admin_referral_stats / admin_referral_summary(傳 admin_users.id)。
import { redirect } from "next/navigation";
import { requireAdmin } from "@/app/lib/rbac";
import {
  adminReferralStats,
  adminReferralSummary,
  type ReferralRow,
  type ReferralSummary,
} from "@/app/lib/referralsDb";

export const dynamic = "force-dynamic";

const FONT = "Inter, 'Noto Sans TC', sans-serif";

export default async function AdminReferralsPage() {
  const guard = await requireAdmin("members", { write: true });
  if (!guard.ok) {
    if (guard.status === 401) redirect("/admin/login");
    return (
      <div style={{ padding: 24, color: "#dc2626", fontFamily: FONT }}>
        沒有權限檢視推薦成長報表(需 admin 或 super_admin)。
      </div>
    );
  }

  let rows: ReferralRow[] = [];
  let summary: ReferralSummary = { total_invited: 0, total_referrers: 0 };
  let loadError: string | null = null;
  try {
    [rows, summary] = await Promise.all([
      adminReferralStats(Number(guard.adminId)),
      adminReferralSummary(Number(guard.adminId)),
    ]);
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e);
  }

  return (
    <div style={{ fontFamily: FONT, color: "#0a1929" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>推薦成長報表</h1>
      <p style={{ fontSize: 13, color: "#4a5a6e", margin: "0 0 20px" }}>
        GROWTH · 推薦碼歸因(分享揪人 → LINE 登入綁定)
      </p>

      {loadError ? (
        <div
          style={{
            padding: 16,
            border: "1px solid #fecaca",
            background: "#fef2f2",
            borderRadius: 8,
            color: "#dc2626",
            fontSize: 14,
          }}
        >
          載入失敗:{loadError}
          <div style={{ marginTop: 8, color: "#7f1d1d", fontSize: 13 }}>
            若顯示找不到函式,請先套用 007_referral.sql 與 008_referral_admin.sql。
          </div>
        </div>
      ) : (
        <>
          {/* 總計卡 */}
          <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
            <StatCard label="已歸因球友" value={summary.total_invited} suffix="人" />
            <StatCard label="有效推薦人" value={summary.total_referrers} suffix="人" />
          </div>

          {/* 排行榜 */}
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 10px" }}>推薦排行榜</h2>
          {rows.length === 0 ? (
            <div
              style={{
                padding: 20,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                borderRadius: 10,
                fontSize: 14,
                color: "#64748b",
              }}
            >
              目前還沒有任何推薦綁定。分享約球連結(帶 ?ref=)邀人 LINE 登入後,會在這裡出現。
            </div>
          ) : (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                    <Th style={{ width: 56 }}>#</Th>
                    <Th>推薦人</Th>
                    <Th>推薦碼</Th>
                    <Th style={{ textAlign: "right" }}>邀來人數</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.referrer_id} style={{ borderTop: "1px solid #e2e8f0" }}>
                      <Td style={{ color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>
                        {i + 1}
                      </Td>
                      <Td style={{ fontWeight: 600 }}>
                        {r.referrer_name || "球友"}{" "}
                        <span style={{ color: "#94a3b8", fontWeight: 400 }}>#{r.referrer_id}</span>
                      </Td>
                      <Td style={{ fontFamily: "ui-monospace, monospace", color: "#475569" }}>
                        {r.referral_code || "—"}
                      </Td>
                      <Td style={{ textAlign: "right", fontWeight: 800, color: "#1e3a8a" }}>
                        {r.invited}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 12 }}>
            歸因策略:first-touch、僅在尚未綁定時記錄、禁止自我推薦。排行榜上限 500 筆。
          </p>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div
      style={{
        flex: "1 1 180px",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "16px 18px",
        background: "#fff",
      }}
    >
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: "#0f172a" }}>
        {value.toLocaleString()}
        {suffix ? <span style={{ fontSize: 15, fontWeight: 600, marginLeft: 4 }}>{suffix}</span> : null}
      </div>
    </div>
  );
}

function Th({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <th style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: "#475569", ...style }}>
      {children}
    </th>
  );
}

function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: "11px 14px", ...style }}>{children}</td>;
}
