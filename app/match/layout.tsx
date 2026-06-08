// 約球子樹 layout。SessionProvider 已上移到 root 的 Providers(全站單一 session 來源),
// 此處不再需要獨立 provider,避免 dual-session 衝突。
export default function MatchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
