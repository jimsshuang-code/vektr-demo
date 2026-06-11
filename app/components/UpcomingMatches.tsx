// app/components/UpcomingMatches.tsx
// 首頁「即時熱門揪球」區塊(server component)。撈即將到來的開放球局,讓首頁有真實活動感、
// 直接把訪客導進約球。靈感參考對手 PickleTown 首頁的即時揪團列表。
import Link from "next/link";
import { listUpcomingMatches, GAME_LABEL } from "@/app/lib/matchPublic";

function fmt(iso: string) {
  const d = new Date(iso);
  const wd = "日一二三四五六"[d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()} (${wd}) ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function UpcomingMatches() {
  const matches = await listUpcomingMatches(4);

  return (
    <section className="bg-[var(--color-bg-muted)] py-16 md:py-20">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <div className="text-xs font-bold tracking-widest text-[var(--color-primary)] mb-2">
              LIVE · 即時揪球
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--color-text)]">
              現在有人開團
            </h2>
          </div>
          <Link href="/match" className="text-sm font-bold text-[var(--color-primary)]">
            看全部球局 →
          </Link>
        </div>

        {matches.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-[var(--color-text-muted)]">目前還沒有開放中的球局。</p>
            <Link
              href="/match/create"
              className="mt-4 inline-block px-5 py-2.5 rounded-md bg-[var(--color-primary)] text-white font-bold text-sm"
            >
              成為第一個開團的人 →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {matches.map((m) => {
              const full = m.currentPlayers >= m.maxPlayers;
              const need = Math.max(0, m.maxPlayers - m.currentPlayers);
              return (
                <Link
                  key={m.id}
                  href={`/match/${m.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-[var(--color-primary)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-bold text-lg text-[var(--color-text)]">
                      {m.title || `${GAME_LABEL[m.gameType] ?? m.gameType}球局`}
                    </div>
                    <span
                      className="flex-shrink-0 text-xs font-bold rounded-full px-2.5 py-1"
                      style={{
                        background: full ? "#fef2f2" : "#f7fee7",
                        color: full ? "#dc2626" : "#65a30d",
                      }}
                    >
                      {full ? "已額滿" : `還缺 ${need} 人`}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed">
                    {fmt(m.scheduledAt)}
                    <br />
                    {m.courtName || "自訂地點"}
                    {m.city ? ` · ${m.city}` : ""}
                  </div>
                  <div className="mt-3 text-sm font-bold text-[var(--color-primary)]">
                    {m.currentPlayers}/{m.maxPlayers} 人 · 加入 →
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
