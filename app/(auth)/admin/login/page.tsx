"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) { setError("帳號或密碼錯誤"); return; }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div style={{ width: 360, background: "#ffffff", border: "1px solid #e1e8ef", borderRadius: 12, padding: 32, boxShadow: "0 1px 3px rgba(15,34,56,0.08)" }}>
      <div style={{ fontWeight: 800, fontSize: 22, color: "#0a1929", letterSpacing: 1 }}>VEKTR</div>
      <div style={{ color: "#7a8a9e", fontSize: 13, marginBottom: 24 }}>後台管理登入</div>

      <label style={labelStyle}>Email</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} autoComplete="username" />

      <label style={labelStyle}>密碼</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSubmit()} style={inputStyle} autoComplete="current-password" />

      {error && <div style={{ color: "#dc2626", fontSize: 13, marginTop: 8 }}>{error}</div>}

      <button onClick={onSubmit} disabled={loading} style={buttonStyle}>{loading ? "登入中…" : "登入"}</button>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#fafbfc", fontFamily: "Inter, 'Noto Sans TC', sans-serif" }}>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, color: "#4a5a6e", marginTop: 14, marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", height: 40, padding: "0 12px", border: "1px solid #e1e8ef", borderRadius: 8, fontSize: 14, color: "#0a1929", outline: "none", boxSizing: "border-box" };
const buttonStyle: React.CSSProperties = { width: "100%", height: 44, marginTop: 24, background: "#14b88a", color: "#ffffff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" };
