"use client";
// app/login/page.tsx — 球友登入頁(含註冊/登入同意勾選)。
// 需勾選「已閱讀並同意服務條款與隱私政策」才能以 LINE 登入。
import { Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function LoginInner() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/match";
  const [agree, setAgree] = useState(false);

  function login() {
    if (!agree) return;
    // 記錄同意(輕量;之後可改為伺服器端同意紀錄)
    try {
      document.cookie = `vektr_tos_agreed=1;path=/;max-age=31536000`;
    } catch {
      /* ignore */
    }
    signIn("line", { callbackUrl });
  }

  return (
    <div className="bg-[var(--color-bg)]" style={{ minHeight: "70vh" }}>
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <div className="text-3xl font-black tracking-widest text-[var(--color-primary)]">VEKTR</div>
        <p className="mt-2 text-[var(--color-text-muted)]">登入 / 註冊,開始找球場、揪球友</p>

        <label className="mt-10 flex items-start gap-3 text-left text-sm text-[var(--color-text-muted)] leading-relaxed cursor-pointer">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-1 flex-shrink-0"
          />
          <span>
            我已閱讀並同意 VEKTR 的{" "}
            <Link href="/terms" target="_blank" className="text-[var(--color-primary)] underline">服務條款</Link>{" "}
            與{" "}
            <Link href="/privacy" target="_blank" className="text-[var(--color-primary)] underline">隱私權政策</Link>。
          </span>
        </label>

        <button
          onClick={login}
          disabled={!agree}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-md font-bold text-white transition-opacity"
          style={{ background: "#06C755", opacity: agree ? 1 : 0.45, cursor: agree ? "pointer" : "not-allowed" }}
        >
          使用 LINE 登入
        </button>
        {!agree && (
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">請先勾選同意條款才能登入</p>
        )}

        <p className="mt-8 text-xs text-[var(--color-text-muted)]">
          僅未滿 18 歲請勿註冊。登入即代表你已閱讀並同意上述條款。
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "70vh" }} />}>
      <LoginInner />
    </Suspense>
  );
}
