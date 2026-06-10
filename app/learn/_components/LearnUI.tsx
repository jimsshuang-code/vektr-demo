// app/learn/_components/LearnUI.tsx
// LEARN 學習中心共用版型(navy/lime,與全站一致)。
import Link from "next/link";

export function LearnShell({
  title,
  titleEn,
  intro,
  children,
}: {
  title: string;
  titleEn: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--color-bg)]">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-14">
        <Link href="/learn" className="text-sm text-[var(--color-text-muted)] hover:underline">
          ← 學習中心
        </Link>
        <p className="mt-6 font-mono text-xs tracking-[0.2em] uppercase text-[var(--color-text-muted)]">
          {titleEn}
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight text-[var(--color-text)]">
          {title}
        </h1>
        {intro && (
          <p className="mt-4 text-[var(--color-text-muted)] leading-relaxed">{intro}</p>
        )}
        <div className="mt-8 space-y-8">{children}</div>
      </div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-[var(--color-text)] border-l-4 border-[var(--color-accent)] pl-3">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[var(--color-text-muted)] leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export function Steps({ items }: { items: { h: string; d: React.ReactNode }[] }) {
  return (
    <ol className="space-y-4">
      {items.map((it, i) => (
        <li key={i} className="flex gap-4">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-sm">
            {i + 1}
          </span>
          <div>
            <div className="font-bold text-[var(--color-text)]">{it.h}</div>
            <div className="text-[var(--color-text-muted)] mt-0.5">{it.d}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function CTA() {
  return (
    <div className="mt-10 rounded-2xl bg-[var(--color-bg-dark)] text-white p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="font-bold text-lg">準備好下場了嗎?</div>
        <div className="text-slate-300 text-sm mt-1">找球場、揪球友,馬上開始打球。</div>
      </div>
      <div className="flex gap-3">
        <Link href="/match" className="px-5 py-2.5 rounded-md bg-[var(--color-accent)] text-[var(--color-text)] font-bold text-sm">
          開始約球
        </Link>
        <Link href="/courts" className="px-5 py-2.5 rounded-md border border-white/30 text-white font-bold text-sm">
          找球場
        </Link>
      </div>
    </div>
  );
}
