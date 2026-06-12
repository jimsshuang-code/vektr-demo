"use client";
// app/login/page.tsx — 球友登入頁。
// 登入方式:LINE / Google(Gmail)/ Apple / Email+密碼。
// 需勾選「已閱讀並同意服務條款與隱私政策」才能登入或註冊。
import { Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function LoginInner() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/match";
  const [agree, setAgree] = useState(false);

  // email/密碼
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function rememberConsent() {
    try {
      document.cookie = `vektr_tos_agreed=1;path=/;max-age=31536000`;
    } catch {
      /* ignore */
    }
  }

  async function loginLine() {
    if (!agree) return;
    rememberConsent();
    // 在 Capacitor App 內:LINE 會擋 WebView 登入,改用系統瀏覽器開 OAuth(vektr-native.js 提供)
    const w = window as unknown as {
      Capacitor?: { isNativePlatform?: () => boolean };
      vektrOpenAuth?: (url: string) => unknown;
    };
    if (w.Capacitor?.isNativePlatform?.() && typeof w.vektrOpenAuth === "function") {
      try {
        const res = await signIn("line", { callbackUrl, redirect: false });
        if (res?.url) {
          w.vektrOpenAuth(res.url);
          return;
        }
      } catch {
        /* 落回一般流程 */
      }
    }
    signIn("line", { callbackUrl });
  }

  async function submitEmail() {
    if (!agree) return;
    setErr("");
    if (!email || !password) {
      setErr("請輸入 email 與密碼");
      return;
    }
    setBusy(true);
    rememberConsent();
    try {
      if (mode === "register") {
        const r = await fetch("/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        if (!r.ok) {
          setErr((await r.json()).error ?? "註冊失敗");
          setBusy(false);
          return;
        }
      }
      const res = await signIn("user-login", {
        email,
        password,
        callbackUrl,
        redirect: false,
      });
      if (res?.error) {
        setErr(mode === "register" ? "註冊成功但登入失敗,請改用登入" : "email 或密碼錯誤");
        setBusy(false);
        return;
      }
      window.location.href = res?.url || callbackUrl;
    } catch {
      setErr("發生錯誤,請稍後再試");
      setBusy(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm";

  return (
    <div className="bg-[var(--color-bg)]" style={{ minHeight: "70vh" }}>
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <div className="text-3xl font-black tracking-widest text-[var(--color-primary)]">VEKTR</div>
        <p className="mt-2 text-[var(--color-text-muted)]">登入 / 註冊,開始找球場、揪球友</p>

        <label className="mt-8 flex items-start gap-3 text-left text-sm text-[var(--color-text-muted)] leading-relaxed cursor-pointer">
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

        {/* 社群登入 */}
        <button
          onClick={loginLine}
          disabled={!agree}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-md font-bold text-white transition-opacity"
          style={{ background: "#06C755", opacity: agree ? 1 : 0.45, cursor: agree ? "pointer" : "not-allowed" }}
        >
          使用 LINE 登入
        </button>

        {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "1" && (
          <button
            onClick={() => {
              if (!agree) return;
              rememberConsent();
              signIn("google", { callbackUrl });
            }}
            disabled={!agree}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-md font-bold transition-opacity border border-slate-300 bg-white text-slate-700"
            style={{ opacity: agree ? 1 : 0.45, cursor: agree ? "pointer" : "not-allowed" }}
          >
            使用 Google 登入
          </button>
        )}

        {process.env.NEXT_PUBLIC_APPLE_ENABLED === "1" && (
          <button
            onClick={() => {
              if (!agree) return;
              rememberConsent();
              signIn("apple", { callbackUrl });
            }}
            disabled={!agree}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-md font-bold text-white transition-opacity"
            style={{ background: "#000", opacity: agree ? 1 : 0.45, cursor: agree ? "pointer" : "not-allowed" }}
          >
            使用 Apple 登入
          </button>
        )}

        {/* 分隔線 */}
        <div className="mt-6 mb-4 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
          <span className="flex-1 h-px bg-slate-200" />
          或用 Email
          <span className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Email + 密碼 */}
        <div className="text-left space-y-2.5">
          {mode === "register" && (
            <input
              className={inputCls}
              placeholder="暱稱(選填)"
              value={name}
              maxLength={30}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            className={inputCls}
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className={inputCls}
            type="password"
            placeholder={mode === "register" ? "設定密碼(至少 8 碼)" : "密碼"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {err && <p className="mt-2 text-xs text-red-600 text-left">{err}</p>}

        <button
          onClick={submitEmail}
          disabled={!agree || busy}
          className="mt-3 w-full px-5 py-3.5 rounded-md font-bold text-white transition-opacity"
          style={{ background: "var(--color-primary)", opacity: agree && !busy ? 1 : 0.45, cursor: agree && !busy ? "pointer" : "not-allowed" }}
        >
          {busy ? "處理中…" : mode === "register" ? "註冊並登入" : "Email 登入"}
        </button>

        <button
          onClick={() => {
            setErr("");
            setMode((m) => (m === "login" ? "register" : "login"));
          }}
          className="mt-3 text-sm text-[var(--color-primary)] underline"
        >
          {mode === "login" ? "還沒有帳號?點此用 Email 註冊" : "已有帳號?改用 Email 登入"}
        </button>

        {!agree && (
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">請先勾選同意條款才能登入</p>
        )}

        <p className="mt-8 text-xs text-[var(--color-text-muted)]">
          未滿 18 歲請勿註冊。登入即代表你已閱讀並同意上述條款。
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
