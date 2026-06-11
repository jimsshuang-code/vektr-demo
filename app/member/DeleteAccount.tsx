"use client";
// 會員中心「刪除帳號」(Apple App Store 硬性要求)。二次確認後刪除並登出。
import { useState } from "react";
import { signOut } from "next-auth/react";

export default function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function doDelete() {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/v1/member/delete", { method: "POST" });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setErr(j.error ?? "刪除失敗,請稍後再試");
        setBusy(false);
        return;
      }
      // 刪除成功 → 登出並回首頁
      await signOut({ callbackUrl: "/" });
    } catch {
      setErr("刪除失敗,請稍後再試");
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5">
      <div className="font-bold text-red-700">刪除帳號</div>
      <p className="text-sm text-red-900/80 mt-1 leading-relaxed">
        刪除後將永久移除你的帳號與相關資料(約球紀錄、預約、球友關係等),且無法復原。
      </p>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-4 px-4 py-2 rounded-md border border-red-300 text-red-700 font-bold text-sm bg-white"
        >
          我要刪除帳號
        </button>
      ) : (
        <div className="mt-4">
          <p className="text-sm text-red-900">請輸入「刪除」以確認:</p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="mt-2 w-full max-w-xs px-3 py-2 border border-red-300 rounded-md text-sm"
            placeholder="刪除"
          />
          {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
          <div className="mt-3 flex gap-3">
            <button
              onClick={doDelete}
              disabled={busy || confirmText !== "刪除"}
              className="px-4 py-2 rounded-md bg-red-600 text-white font-bold text-sm disabled:opacity-40"
            >
              {busy ? "刪除中…" : "確認永久刪除"}
            </button>
            <button onClick={() => { setOpen(false); setConfirmText(""); setErr(""); }} className="px-4 py-2 rounded-md border border-slate-300 text-sm font-bold">
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
