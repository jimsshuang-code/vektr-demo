"use client";
// app/forgot/page.tsx — 忘記密碼:輸入 email,寄出重設連結。
import { useState } from "react";
import Link from "next/link";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setErr("");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setErr("請輸入正確的 email");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/v1/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!r.ok) {
        setErr((await r.json()).error ?? "發生錯誤,請稍後再試");
        setBusy(false);
        return;
      }
      setDone(true);
    } catch {
      setErr("發生錯誤,請稍後再試");
    }
    setBusy(false);
  }

  return (
    <div className="bg-[var(--color-bg)]" style={{ minHeight: "70vh" }}>
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <div className="text-2xl font-black tracking-widest text-[var(--color-primary)]">VEKTR</div>
        <h1 className="mt-6 text-lg font-bold text-[var(--color-text)]">忘記密碼</h1>

        {done ? (
          <>
            <p className="mt-4 text-sm text-[var(--color-text-muted)] leading-relaxed">
              若 <b>{email}</b> 有註冊密碼帳號,我們已寄出重設連結,請至信箱查收(1 小時內有效)。
            </p>
            <Link href="/login" className="mt-6 inline-block text-sm text-[var(--color-primary)] underline">
              返回登入
            </Link>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">輸入註冊用的 email,我們會寄重設連結給你。</p>
            <input
              className="mt-6 w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm"
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {err && <p className="mt-2 text-xs text-red-600 text-left">{err}</p>}
            <button
              onClick={submit}
              disabled={busy}
              className="mt-3 w-full px-5 py-3.5 rounded-md font-bold text-white"
              style={{ background: "var(--color-primary)", opacity: busy ? 0.5 : 1 }}
            >
              {busy ? "寄送中…" : "寄出重設連結"}
            </button>
            <Link href="/login" className="mt-5 inline-block text-sm text-[var(--color-primary)] underline">
              返回登入
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
