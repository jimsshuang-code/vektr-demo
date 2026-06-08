"use client";

// app/admin/matches/ReportQueue.tsx
// A2 -- 檢舉佇列互動表 (client)。結案 / 改狀態 / 停權 / 解除停權。

import { useState, useMemo } from "react";
import type { AdminReportRow } from "@/app/lib/reportsDb";

const CATEGORY_LABEL: Record<string, string> = {
  no_show: "未到場",
  harassment: "騷擾",
  unsafe: "安全疑慮",
  fake_profile: "假帳號",
  spam: "洗版",
  other: "其他",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "待處理",
  reviewing: "審核中",
  resolved: "已處理",
  dismissed: "已駁回",
};
const FILTERS = ["all", "pending", "reviewing", "resolved", "dismissed"] as const;

export default function ReportQueue({ initialRows }: { initialRows: AdminReportRow[] }) {
  const [rows, setRows] = useState<AdminReportRow[]>(initialRows);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter]
  );

  async function patchReport(id: number, status: string) {
    setBusyId(id);
    setErr(null);
    try {
      const res = await fetch(`/api/v1/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.status);
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (e) {
      setErr(`狀態更新失敗 (#${id}):${e instanceof Error ? e.message : e}`);
    } finally {
      setBusyId(null);
    }
  }

  async function toggleSuspend(row: AdminReportRow) {
    setBusyId(row.id);
    setErr(null);
    const suspend = !row.reported_suspended;
    try {
      let res: Response;
      if (suspend) {
        const reason = window.prompt(`停權「${row.reported_name}」的理由:`, CATEGORY_LABEL[row.category] ?? "違反社群規範");
        if (reason === null) {
          setBusyId(null);
          return;
        }
        res = await fetch(`/api/v1/admin/users/${row.reported_user_id}/suspend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reason || "違反社群規範", until: null }),
        });
      } else {
        res = await fetch(`/api/v1/admin/users/${row.reported_user_id}/suspend`, { method: "DELETE" });
      }
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.status);
      setRows((rs) =>
        rs.map((r) => (r.reported_user_id === row.reported_user_id ? { ...r, reported_suspended: suspend } : r))
      );
    } catch (e) {
      setErr(`停權操作失敗:${e instanceof Error ? e.message : e}`);
    } finally {
      setBusyId(null);
    }
  }

  const chip = (active: boolean): React.CSSProperties => ({
    padding: "6px 12px",
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    background: active ? "#0a1929" : "#fff",
    color: active ? "#fff" : "#0a1929",
    fontSize: 12,
    cursor: "pointer",
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={chip(filter === f)}>
            {f === "all" ? "全部" : STATUS_LABEL[f]}(
            {f === "all" ? rows.length : rows.filter((r) => r.status === f).length})
          </button>
        ))}
      </div>

      {err && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{err}</p>}

      {visible.length === 0 ? (
        <p style={{ color: "#94a3b8", fontSize: 14 }}>沒有符合的檢舉。</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {visible.map((r) => (
            <div
              key={r.id}
              style={{
                border: "1px solid #e2e8f0",
                borderLeft: `3px solid ${r.status === "pending" ? "#65a30d" : "#e2e8f0"}`,
                borderRadius: 8,
                padding: 16,
                background: "#fff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    #{r.id} · {STATUS_LABEL[r.status] ?? r.status} · {new Date(r.created_at).toLocaleString("zh-TW")}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>
                    {r.reported_name ?? `用戶 ${r.reported_user_id}`}
                    {r.reported_suspended && (
                      <span style={{ marginLeft: 8, fontSize: 11, color: "#dc2626", border: "1px solid #fecaca", borderRadius: 4, padding: "1px 6px" }}>
                        已停權
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    原因:{CATEGORY_LABEL[r.category] ?? r.category}
                    {r.detail ? ` — ${r.detail}` : ""}
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                    檢舉人:{r.reporter_name ?? r.reporter_id} · 場局:{r.match_title ?? (r.match_id ? `#${r.match_id}` : "(無)")}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 140 }}>
                  <button
                    disabled={busyId === r.id}
                    onClick={() => toggleSuspend(r)}
                    style={{ background: r.reported_suspended ? "#fff" : "#dc2626", color: r.reported_suspended ? "#dc2626" : "#fff", border: "1px solid #dc2626", borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}
                  >
                    {r.reported_suspended ? "解除停權" : "停權此球友"}
                  </button>
                  {r.status !== "resolved" && (
                    <button disabled={busyId === r.id} onClick={() => patchReport(r.id, "resolved")} style={{ background: "#65a30d", color: "#fff", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      標記已處理
                    </button>
                  )}
                  {r.status === "pending" && (
                    <button disabled={busyId === r.id} onClick={() => patchReport(r.id, "reviewing")} style={{ background: "#fff", color: "#0a1929", border: "1px solid #cbd5e1", borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}>
                      開始審核
                    </button>
                  )}
                  {r.status !== "dismissed" && r.status !== "resolved" && (
                    <button disabled={busyId === r.id} onClick={() => patchReport(r.id, "dismissed")} style={{ background: "#fff", color: "#94a3b8", border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}>
                      駁回
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
