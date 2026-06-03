"use client";
// 約球子樹專屬 layout:只把 SessionProvider 包在 /match 底下,
// 讓約球各頁能用 useSession 讀登入狀態。公開站與 admin 不受影響。
import { SessionProvider } from "next-auth/react";

export default function MatchLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
