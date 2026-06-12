"use client";
// 編輯個人資料:修改顯示名稱(Apple 登入進來預設為「Apple 球友」,可改)。
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditProfile({ initialName }: { initialName: string | null }) {
  const router = useRouter();
  const [name, setName] = useState(initialName ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function save() {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const r = await fetch("/api/v1/member/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const j = await r.json();
      if (!r.ok) setErr(j.error ?? "儲存失敗");
      else {
        setMsg("已儲存");
        router.refresh();
      }
    } catch {
      setErr("儲存失敗");
    }
    setBusy(false);
  }

  return (
    <div>
      <label className="text-sm font-bold text-[var(--color-text)]">暱稱</label>
      <div className="mt-1.5 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg text-sm"
          placeholder="輸入你的暱稱"
        />
        <button
          onClick={save}
          disabled={busy || !name.trim()}
          className="px-4 py-2.5 rounded-md bg-[var(--color-primary)] text-white font-bold text-sm disabled:opacity-40"
        >
          {busy ? "儲存中…" : "儲存"}
        </button>
      </div>
      {msg && <p className="text-xs text-green-600 mt-2">{msg}</p>}
      {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
    </div>
  );
}
