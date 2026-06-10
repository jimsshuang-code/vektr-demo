"use client";
// app/invites/InviteActions.tsx
// 球友邀請頁的分享動作(複製連結 / LINE 揪人)。連結帶 ?ref=<推薦碼>,
// 受邀者進 /match 或 /match/[id] 時會寫入 vektr_ref cookie,登入後自動歸因。
import { useState } from "react";

export default function InviteActions({ shareUrl }: { shareUrl: string }) {
  const [msg, setMsg] = useState("");
  const text = `一起來打匹克球!用我的邀請連結加入 VEKTR:${shareUrl}`;

  function copy() {
    navigator.clipboard?.writeText(shareUrl).then(
      () => setMsg("已複製邀請連結"),
      () => setMsg("複製失敗,請手動選取")
    );
  }
  function line() {
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  return (
    <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
      <button
        onClick={line}
        style={{ width: "100%", background: "#06C755", color: "#fff", border: "none", padding: "13px", borderRadius: 12, fontSize: 15.5, fontWeight: 800, cursor: "pointer" }}
      >
        📲 用 LINE 邀請朋友
      </button>
      <button
        onClick={copy}
        style={{ width: "100%", background: "#fff", color: "#1e3a8a", border: "1.5px solid #1e3a8a", padding: "13px", borderRadius: 12, fontSize: 15.5, fontWeight: 800, cursor: "pointer" }}
      >
        🔗 複製邀請連結
      </button>
      {msg && <p style={{ textAlign: "center", color: "#64748b", fontSize: 13, margin: 0 }}>{msg}</p>}
    </div>
  );
}
