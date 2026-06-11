"use client";
// 學員預約需求表單(送出後平台記錄,教練再聯繫;不涉及付款)。
import { useState } from "react";

export default function BookingForm({ coachId, coachName }: { coachId: number; coachName: string }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [time, setTime] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await fetch(`/api/v1/coaches/${coachId}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_name: name, student_contact: contact, preferred_time: time, message: msg }),
      });
      const j = await r.json();
      if (!r.ok) setErr(j.error ?? "送出失敗");
      else setDone(true);
    } catch {
      setErr("送出失敗,請稍後再試");
    }
    setBusy(false);
  }

  if (done) {
    return (
      <div className="rounded-xl border border-[var(--color-accent)] bg-[var(--color-bg-muted)] p-5 text-sm text-[var(--color-text)]">
        已送出對 <strong>{coachName}</strong> 的預約需求,教練會透過你留的聯絡方式與你聯繫。
      </div>
    );
  }

  const input = "w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm";

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div>
        <label className="text-sm font-bold text-[var(--color-text)]">你的稱呼 *</label>
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
      </div>
      <div>
        <label className="text-sm font-bold text-[var(--color-text)]">聯絡方式(LINE / 電話)*</label>
        <input className={input} value={contact} onChange={(e) => setContact(e.target.value)} required maxLength={200} />
      </div>
      <div>
        <label className="text-sm font-bold text-[var(--color-text)]">希望時段</label>
        <input className={input} value={time} onChange={(e) => setTime(e.target.value)} placeholder="如 平日晚上 / 週末早上" maxLength={200} />
      </div>
      <div>
        <label className="text-sm font-bold text-[var(--color-text)]">想說的話</label>
        <textarea className={input} value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} maxLength={2000} placeholder="你的程度、目標、想加強的地方…" />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button
        type="submit"
        disabled={busy}
        className="px-5 py-3 rounded-md bg-[var(--color-primary)] text-white font-bold text-sm disabled:opacity-50"
      >
        {busy ? "送出中…" : "送出預約需求"}
      </button>
      <p className="text-xs text-[var(--color-text-muted)]">
        平台僅做媒合,實際課程與收費由你與教練私下議定。送出後教練會與你聯繫。
      </p>
    </form>
  );
}
