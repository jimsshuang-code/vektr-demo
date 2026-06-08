// app/suspended/page.tsx -- 被停權球友(login-time 守衛)導向頁。

export const dynamic = "force-dynamic";

export default function SuspendedPage() {
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "80px 20px", textAlign: "center", color: "#0f172a", fontFamily: "Inter, 'Noto Sans TC', sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>帳號已暫停</h1>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: "#64748b", marginTop: 12 }}>
        你的帳號目前因違反社群規範而暫停使用約球功能。若你認為這是誤判,請聯繫客服協助處理。
      </p>
    </main>
  );
}
