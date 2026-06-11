"use client";
// 全域 Header 的登入/登出區塊,依 useSession 反映實際狀態。
// 登入一律導向 /login(含同意勾選),不直接呼叫 signIn。
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function HeaderAuth({ mobile = false }: { mobile?: boolean }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="text-sm text-[var(--color-text-muted)]">…</span>;
  }

  if (session?.user) {
    const name = session.user.name ?? "球友";
    if (mobile) {
      return (
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="self-start text-sm font-medium text-[var(--color-text-muted)]"
        >
          登出（{name}）
        </button>
      );
    }
    return (
      <div className="hidden sm:flex items-center gap-3">
        <span className="text-sm text-[var(--color-text-muted)]">{name}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
        >
          登出
        </button>
      </div>
    );
  }

  // 未登入
  if (mobile) {
    return (
      <Link
        href="/login?callbackUrl=/match"
        className="self-start text-sm font-medium text-[var(--color-text-muted)]"
      >
        LINE 登入
      </Link>
    );
  }
  return (
    <Link
      href="/login?callbackUrl=/match"
      className="hidden sm:inline-block text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
    >
      登入
    </Link>
  );
}
