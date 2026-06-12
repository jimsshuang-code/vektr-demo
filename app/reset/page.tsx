"use client";
// app/reset/page.tsx — 用信中的 token 設定新密碼。
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ResetInner() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setErr("");
    if (pw.length < 8) {
      setErr("密碼至少 8 碼");
      return;
    }
    if (pw !== pw2) {
      setErr("兩次密碼不一致");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/v1/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: pw }),
      });
      if (!r.ok) {
        setErr((await r.json()).error ?? "重設失敗");
        setBusy(false);
        return;
      }
      setDone(true);
    } catch {
      setErr("發生錯誤,請稍後再試");
    }
    setBusy(false);
  }

  const inputCls = "mt-3 w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm";

  return (
    <div className="bg-[var(--color-bg)]" style={{ minHeight: "70vh" }}>
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <div className="text-2xl font-black tracking-widest text-[var(--color-primary)]">VEKTR</div>
        <h1 className="mt-6 text-lg font-bold text-[var(--color-text)]">設定新密碼</h1>

        {!token ? (
          <p className="mt-4 text-sm text-red-600">連結無效,缺少重設權杖。請重新申請忘記密碼。</p>
        ) : done ? (
          <>
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">密碼已更新,請用新密碼登入。</p>
            <Link href="/login" className="mt-6 inline-block px-5 py-3 rounded-md font-bold text-white" style={{ background: "var(--color-primary)" }}>
              前往登入
            </Link>
          </>
        ) : (
          <>
            <input className={inputCls} type="password" placeholder="新密碼(至少 8 碼)" value={pw} onChange={(e) => setPw(e.target.value)} />
            <input className={inputCls} type="password" placeholder="再次輸入新密碼" value={pw2} onChange={(e) => setPw2(e.target.value)} />
            {err && <p className="mt-2 text-xs text-red-600 text-left">{err}</p>}
            <button
              onClick={submit}
              disabled={busy}
              className="mt-3 w-full px-5 py-3.5 rounded-md font-bold text-white"
              style={{ background: "var(--color-primary)", opacity: busy ? 0.5 : 1 }}
            >
              {busy ? "更新中…" : "更新密碼"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "70vh" }} />}>
      <ResetInner />
    </Suspense>
  );
}
