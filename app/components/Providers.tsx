"use client";
// 全站 SessionProvider,讓全域 Header 等元件能用 useSession 讀登入狀態。
// (修正已知問題 1:全域 Header 永遠顯示「登入」)
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
