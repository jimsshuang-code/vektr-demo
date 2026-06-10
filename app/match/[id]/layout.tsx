// app/match/[id]/layout.tsx
// 每場球局的 server 端 metadata(og:title / description / url)。
// og:image 由同目錄 opengraph-image.tsx 自動帶入。page.tsx 為 client component,
// 故 metadata 放在此 layout(server)。
import type { Metadata } from "next";
import { getPublicMatch, playersNeeded, formatWhen, GAME_LABEL } from "@/app/lib/matchPublic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://vektr.com.tw";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const m = await getPublicMatch(Number(id));

  if (!m) {
    return {
      title: "約球",
      description: "VEKTR 約球 — 一起來打匹克球。",
    };
  }

  const title = m.title?.trim() || `${GAME_LABEL[m.gameType] ?? "匹克球"}球局`;
  const need = playersNeeded(m);
  const statusText =
    m.status === "cancelled"
      ? "(已取消)"
      : need === 0
      ? "已滿"
      : `還缺 ${need} 人`;
  const description = `${formatWhen(m.scheduledAt)} · ${m.courtName || "自訂地點"} · ${m.currentPlayers}/${m.maxPlayers} 人 · ${statusText}`;
  const url = `${SITE}/match/${m.id}`;

  return {
    metadataBase: new URL(SITE),
    title,
    description,
    openGraph: {
      title: `${title} · VEKTR 約球`,
      description,
      url,
      type: "website",
      locale: "zh_TW",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · VEKTR 約球`,
      description,
    },
  };
}

export default function MatchIdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
