"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type SubItem = { label: string; href: string };
type NavItem = {
  label: string;
  labelEn: string;
  href: string;
  children?: SubItem[];
};

const navItems: NavItem[] = [
  {
    label: "商城",
    labelEn: "SHOP",
    href: "/shop",
    children: [
      { label: "球拍", href: "/shop/paddles" },
      { label: "球類", href: "/shop/balls" },
      { label: "鞋類", href: "/shop/shoes" },
      { label: "服飾", href: "/shop/apparel" },
      { label: "球袋", href: "/shop/bags" },
      { label: "配件", href: "/shop/accessories" },
      { label: "試打體驗", href: "/shop/demo" },
    ],
  },
  { label: "球場", labelEn: "COURTS", href: "/courts" },
  { label: "教練", labelEn: "COACH", href: "/coaches" },
  {
    label: "約球",
    labelEn: "MATCH",
    href: "/match",
    children: [
      { label: "開團約球", href: "/match/create" },
      { label: "尋找球友", href: "/match/find" },
      { label: "約球紀錄", href: "/match/history" },
    ],
  },
  {
    label: "學習",
    labelEn: "LEARN",
    href: "/learn",
    children: [
      { label: "規則手冊", href: "/learn/rules" },
      { label: "教學影片", href: "/learn/videos" },
      { label: "新手指南", href: "/learn/guide" },
      { label: "賽事活動", href: "/learn/events" },
    ],
  },
  {
    label: "會員",
    labelEn: "MEMBER",
    href: "/member",
    children: [
      { label: "訂單紀錄", href: "/member/orders" },
      { label: "等級認證", href: "/member/level" },
      { label: "球友名單", href: "/member/friends" },
      { label: "我的課程", href: "/member/coaching" },
    ],
  },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  const handleLangSwitch = () => {
    alert("English version coming soon.\n英文版即將推出。");
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const toggleMobileExpand = (href: string) => {
    setMobileExpanded(mobileExpanded === href ? null : href);
  };

  const closeMobile = () => {
    setMobileOpen(false);
    setMobileExpanded(null);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group" onClick={closeMobile}>
          <span className="text-2xl font-black tracking-widest text-[var(--color-primary)] group-hover:text-[var(--color-primary-dark)] transition-colors">
            VEKTR
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const hasDropdown = item.children && item.children.length > 0;

            return (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className={`px-4 py-2 text-sm font-medium transition-colors rounded-md inline-flex items-center gap-1 ${
                    active
                      ? "text-[var(--color-primary)] bg-[var(--color-bg-muted)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-muted)]"
                  }`}
                >
                  {item.label}
                  {hasDropdown && (
                    <svg
                      className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </Link>

                {/* Dropdown */}
                {hasDropdown && (
                  <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                    <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-lg py-2 min-w-[180px]">
                      {item.children!.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`block px-4 py-2 text-sm transition-colors ${
                            pathname === sub.href
                              ? "text-[var(--color-primary)] bg-[var(--color-bg-muted)] font-semibold"
                              : "text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-muted)]"
                          }`}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right side: Lang + Login + CTA + Mobile Toggle */}
        <div className="flex items-center gap-2 md:gap-3">
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
            className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-bold text-[var(--color-text)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] rounded-md transition-colors"
          >
            開始約球
          </Link>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-muted)] transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-white">
          <nav className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const hasDropdown = item.children && item.children.length > 0;
              const expanded = mobileExpanded === item.href;

              return (
                <div key={item.href} className="border-b border-[var(--color-border)] last:border-b-0">
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      onClick={closeMobile}
                      className={`flex-1 py-3 text-base font-medium transition-colors ${
                        active
                          ? "text-[var(--color-primary)]"
                          : "text-[var(--color-text)] hover:text-[var(--color-primary)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                    {hasDropdown && (
                      <button
                        onClick={() => toggleMobileExpand(item.href)}
                        className="px-3 py-3 text-[var(--color-text-muted)]"
                        aria-label={`Expand ${item.label}`}
                      >
                        <svg
                          className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {hasDropdown && expanded && (
                    <div className="pb-2 pl-4 flex flex-col gap-1">
                      {item.children!.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={closeMobile}
                          className={`py-2 text-sm transition-colors ${
                            pathname === sub.href
                              ? "text-[var(--color-primary)] font-semibold"
                              : "text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                          }`}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Mobile-only CTAs */}
            <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex flex-col gap-3">
              <button
                onClick={() => {
                  handleLangSwitch();
                  closeMobile();
                }}
                className="self-start inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-[var(--color-text-muted)] border border-[var(--color-border)] rounded"
              >
                <span className="text-[var(--color-primary)]">中</span>
                <span className="text-slate-300">/</span>
                <span>EN</span>
              </button>
              <Link
                href="/member"
                onClick={closeMobile}
                className="text-sm font-medium text-[var(--color-text-muted)]"
              >
                登入
              </Link>
              <Link
                href="/match/find"
                onClick={closeMobile}
                className="inline-flex items-center justify-center px-4 py-3 text-sm font-bold text-[var(--color-text)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] rounded-md transition-colors"
              >
                開始約球
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
