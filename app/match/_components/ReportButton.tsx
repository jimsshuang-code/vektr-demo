"use client";

// app/match/_components/ReportButton.tsx
// A2 -- 檢舉按鈕 + Modal。放在球局詳情頁名單列。樣式融入既有約球 UI(navy/lime/slate)。

import { useState } from "react";

const C = { navy: "#1e3a8a", ink: "#0f172a", lime: "#65a30d", txt2: "#64748b", line: "#e2e8f0" };

const CATEGORIES: { value: string; label: string }[] = [
  { value: "no_show", label: "未到場 / 放鴿子" },
  { value: "harassment", label: "騷擾 / 言語不當" },
  { value: "unsafe", label: "安全疑慮" },
  { value: "fake_profile", label: "假帳號 / 不實身分" },
  { value: "spam", label: "洗版 / 廣告" },
  { value: "other", label: "其他" },
];

type Props = { reportedUserId: number; reportedName?: string; matchId?: number | null };

export default function ReportButton({ reportedUserId, reportedName, matchId = null }: Props) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/v1/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportedUserId, matchId, category, detail }),
      });
      if (res.status === 201) setDone(true);
      else if (res.status === 401) setMsg("請先登入後再檢舉。");
      else if (res.status === 403) setMsg("您的帳號目前無法執行此操作。");
      else if (res.status === 409) setMsg("您已檢舉過此對象,我們正在處理。");
      else {
        const j = await res.json().catch(() => ({}));
        setMsg("送出失敗:" + (j.error ?? res.status));
      }
    } catch {
      setMsg("網路錯誤,請稍後再試。");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setOpen(false);
    setMsg(null);
    setDone(false);
    setDetail("");
    setCategory(CATEGORIES[0].value);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ background: "none", border: "none", color: C.txt2, fontSize: 12, cursor: "pointer", padding: "2px 4px", textDecoration: "underline" }}
        aria-label={`檢舉 ${reportedName ?? "此球友"}`}
      >
        檢舉
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={reset}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", color: C.ink, width: "100%", maxWidth: 420, borderRadius: 16, padding: 24, fontFamily: "-apple-system,'Noto Sans TC',sans-serif" }}
          >
            {done ? (
              <div>
                <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800 }}>已收到檢舉</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 20px", color: C.txt2 }}>
                  感謝你協助維護社群安全。我們會盡快審核。
                </p>
                <button onClick={reset} style={{ width: "100%", background: C.navy, color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontWeight: 800, cursor: "pointer" }}>
                  完成
                </button>
              </div>
            ) : (
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800 }}>
                  檢舉{reportedName ? `「${reportedName}」` : "球友"}
                </h3>
                <p style={{ fontSize: 12, color: C.txt2, margin: "0 0 16px" }}>你的檢舉將保密送交管理員審核。</p>

                <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>原因</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: "100%", padding: "10px", border: `1px solid ${C.line}`, borderRadius: 10, marginBottom: 16, fontSize: 14 }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>

                <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>補充說明(選填)</label>
                <textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder="請描述發生的情況"
                  style={{ width: "100%", padding: "10px", border: `1px solid ${C.line}`, borderRadius: 10, marginBottom: 12, fontSize: 14, resize: "vertical", fontFamily: "inherit" }}
                />

                {msg && <p style={{ fontSize: 13, color: "#dc2626", margin: "0 0 12px" }}>{msg}</p>}

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={reset} disabled={busy} style={{ flex: 1, background: "#fff", color: C.navy, border: `1.5px solid ${C.navy}`, borderRadius: 12, padding: "12px", fontWeight: 700, cursor: "pointer" }}>
                    取消
                  </button>
                  <button onClick={submit} disabled={busy} style={{ flex: 1, background: busy ? "#94a3b8" : C.navy, color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontWeight: 800, cursor: busy ? "default" : "pointer" }}>
                    {busy ? "送出中…" : "送出檢舉"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
