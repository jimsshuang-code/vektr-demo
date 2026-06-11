"use client";
// 站台頂部公告橫幅(可關閉,記住已關閉的公告 id)。
import { useEffect, useState } from "react";
import Link from "next/link";

export default function BannerBar({
  id,
  title,
  linkUrl,
  linkLabel,
}: {
  id: number;
  title: string;
  linkUrl: string | null;
  linkLabel: string | null;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(`vektr_banner_dismissed_${id}`) !== "1") setShow(true);
    } catch {
      setShow(true);
    }
  }, [id]);

  if (!show) return null;

  function dismiss() {
    try {
      localStorage.setItem(`vektr_banner_dismissed_${id}`, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  return (
    <div
      style={{
        background: "var(--color-primary, #1e3a8a)",
        color: "#fff",
        fontSize: 14,
        padding: "8px 40px 8px 16px",
        textAlign: "center",
        position: "relative",
      }}
    >
      <span>{title}</span>
      {linkUrl && (
        <Link href={linkUrl} style={{ color: "#bef264", fontWeight: 700, marginLeft: 10, textDecoration: "underline" }}>
          {linkLabel || "看詳情"}
        </Link>
      )}
      <button
        onClick={dismiss}
        aria-label="關閉"
        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", lineHeight: 1 }}
      >
        ×
      </button>
    </div>
  );
}
