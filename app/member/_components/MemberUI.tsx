// app/member/_components/MemberUI.tsx — 會員頁共用版型(navy/lime)
import Link from "next/link";

export function MemberShell({
  title,
  back,
  children,
}: {
  title: string;
  back?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--color-bg)]" style={{ minHeight: "70vh" }}>
      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-12">
        {back && (
          <Link href={back.href} className="text-sm text-[var(--color-text-muted)] hover:underline">
            ← {back.label}
          </Link>
        )}
        <h1 className="mt-4 text-2xl font-black tracking-tight text-[var(--color-text)]">{title}</h1>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export function LoginPrompt({ what }: { what: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
      <p className="text-[var(--color-text-muted)]">請先以 LINE 登入,才能查看{what}。</p>
      <Link
        href="/match"
        className="mt-4 inline-block px-5 py-2.5 rounded-md bg-[var(--color-primary)] text-white font-bold text-sm"
      >
        前往登入
      </Link>
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-[var(--color-bg-muted)] p-6 text-sm text-[var(--color-text-muted)] leading-relaxed">
      {children}
    </div>
  );
}
