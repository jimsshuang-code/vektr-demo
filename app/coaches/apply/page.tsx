"use client";
// app/coaches/apply/page.tsx — 申請成為教練(真表單,送出 → coaches status=pending)
import { useState } from "react";
import Link from "next/link";
import AvatarUpload from "@/app/components/AvatarUpload";

export default function CoachesApplyPage() {
  const [f, setF] = useState({ name: "", contact: "", city: "", district: "", specialties: "", dupr_rating: "", hourly_rate: "", bio: "", avatar_url: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/v1/coaches/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const j = await r.json();
      if (!r.ok) setErr(j.error ?? "送出失敗");
      else setDone(true);
    } catch {
      setErr("送出失敗,請稍後再試");
    }
    setBusy(false);
  }

  const input = "w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm";

  return (
    <div className="bg-[var(--color-bg)]">
      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-14">
        <Link href="/coaches" className="text-sm text-[var(--color-text-muted)] hover:underline">
          ← 教練媒合
        </Link>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--color-text)]">
          申請成為 VEKTR 教練
        </h1>

        {done ? (
          <div className="mt-8 rounded-2xl border border-[var(--color-accent)] bg-[var(--color-bg-muted)] p-6">
            <p className="text-[var(--color-text)] font-bold">申請已送出 🎉</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              我們會盡快審核你的資料,通過後你的教練頁就會上架、開放學員預約。審核結果會透過你留的聯絡方式通知。
            </p>
            <Link href="/coaches" className="mt-4 inline-block text-[var(--color-primary)] font-bold underline">
              回教練列表
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-3 text-[var(--color-text-muted)] leading-relaxed">
              填寫以下資料送出申請。通過審核後即可上架課程、開放預約。標 * 為必填。
            </p>
            <form onSubmit={submit} className="mt-8 grid gap-4">
              <Field label="教練照片">
                <AvatarUpload
                  endpoint="/api/v1/avatar"
                  initialUrl={f.avatar_url || null}
                  label="上傳照片"
                  onUploaded={(url) => setF((s) => ({ ...s, avatar_url: url }))}
                />
              </Field>
              <Field label="姓名 *"><input className={input} value={f.name} onChange={set("name")} required maxLength={100} /></Field>
              <Field label="聯絡方式(LINE / 電話 / Email)*"><input className={input} value={f.contact} onChange={set("contact")} required maxLength={200} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="城市"><input className={input} value={f.city} onChange={set("city")} placeholder="如 台北市" maxLength={50} /></Field>
                <Field label="地區"><input className={input} value={f.district} onChange={set("district")} placeholder="如 信義區" maxLength={50} /></Field>
              </div>
              <Field label="專長"><input className={input} value={f.specialties} onChange={set("specialties")} placeholder="如 入門教學, 技術精進, 青少年" maxLength={500} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="DUPR 等級"><input className={input} type="number" step="0.1" value={f.dupr_rating} onChange={set("dupr_rating")} placeholder="如 4.5" /></Field>
                <Field label="參考時薪(NT$)"><input className={input} type="number" value={f.hourly_rate} onChange={set("hourly_rate")} placeholder="如 800" /></Field>
              </div>
              <Field label="自我介紹 / 執教經歷"><textarea className={input} value={f.bio} onChange={set("bio")} rows={4} maxLength={2000} placeholder="你的教學風格、資歷、證照…" /></Field>
              {err && <p className="text-sm text-red-600">{err}</p>}
              <button type="submit" disabled={busy} className="px-6 py-3 rounded-md bg-[var(--color-primary)] text-white font-bold disabled:opacity-50">
                {busy ? "送出中…" : "送出申請"}
              </button>
              <p className="text-xs text-[var(--color-text-muted)]">
                VEKTR 第一階段為純媒合,平台不經手學費;實際課程與收費由你與學員議定。
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-[var(--color-text)]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
