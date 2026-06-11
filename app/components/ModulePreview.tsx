// app/components/ModulePreview.tsx
// 尚未接後端(如金流/預約)的模組用的「精緻預覽」頁。比 Coming Soon placeholder 完整:
// 說明價值、列出規劃中的功能、提供通知/CTA 與相關連結。誠實不造假。
import Link from "next/link";

export type PreviewLink = { href: string; label: string; primary?: boolean };

export default function ModulePreview({
  title,
  titleEn,
  badge = "即將推出",
  lead,
  features,
  categories,
  links,
  notifyEmail = "service@abouttime-tech.com",
}: {
  title: string;
  titleEn: string;
  badge?: string;
  lead: string;
  features?: { h: string; d: string }[];
  categories?: string[];
  links?: PreviewLink[];
  notifyEmail?: string;
}) {
  return (
    <div className="bg-[var(--color-bg)]">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-16">
        <span className="inline-block px-3 py-1 rounded-full bg-[var(--color-accent)] text-[var(--color-text)] text-xs font-bold tracking-wide">
          {badge}
        </span>
        <p className="mt-5 font-mono text-xs tracking-[0.2em] uppercase text-[var(--color-text-muted)]">
          {titleEn}
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--color-text)]">{title}</h1>
        <p className="mt-4 text-lg text-[var(--color-text-muted)] leading-relaxed max-w-2xl">{lead}</p>

        {categories && categories.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2.5">
            {categories.map((c) => (
              <span
                key={c}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-[var(--color-text)]"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        {features && features.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.h} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="font-bold text-[var(--color-text)]">{f.h}</div>
                <p className="mt-1 text-sm text-[var(--color-text-muted)] leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href={`mailto:${notifyEmail}?subject=${encodeURIComponent(`VEKTR ${title} 上線通知`)}`}
            className="px-5 py-2.5 rounded-md bg-[var(--color-primary)] text-white font-bold text-sm"
          >
            上線通知我
          </a>
          {links?.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                l.primary
                  ? "px-5 py-2.5 rounded-md bg-[var(--color-accent)] text-[var(--color-text)] font-bold text-sm"
                  : "px-5 py-2.5 rounded-md border border-slate-300 text-[var(--color-text)] font-bold text-sm"
              }
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
