"use client";

import Link from "next/link";

const navItems = [
  { label: "商城", labelEn: "SHOP", href: "/shop" },
  { label: "球場", labelEn: "COURTS", href: "/courts" },
  { label: "教練", labelEn: "COACH", href: "/coaches" },
  { label: "約球", labelEn: "MATCH", href: "/match" },
  { label: "學習", labelEn: "LEARN", href: "/learn" },
  { label: "會員", labelEn: "MEMBER", href: "/member" },
];

export default function Header() {
  const handleLangSwitch = () => {
    alert("English version coming soon.\n英文版即將推出。");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-black tracking-widest text-[var(--color-primary)] group-hover:text-[var(--color-primary-dark)] transition-colors">
            VEKTR
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors rounded-md hover:bg-[var(--color-bg-muted)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side: Lang + Login + CTA */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <button
            onClick={handleLangSwitch}
            className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] border border-[var(--color-border)] hover:border-[var(--color-primary)] rounded transition-colors"
            aria-label="Switch language"
          >
            <span className="text-[var(--color-primary)]">中</span>
            <span className="text-slate-300">/</span>
            <span>EN</span>
          </button>

          <Link
            href="/member"
            className="hidden sm:inline-block text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            登入
          </Link>
          <Link
            href="/match/find"
            className="inline-flex items-center px-4 py-2 text-sm font-bold text-[var(--color-text)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] rounded-md transition-colors"
          >
            開始約球
          </Link>
        </div>
      </div>
    </header>
  );
}