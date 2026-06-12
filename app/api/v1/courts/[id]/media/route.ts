import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/lib/db";
import { requireUser, getCurrentUser } from "@/app/lib/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/courts/[id]/media — 球友分享的照片/影片(僅 visible)。
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const me = await getCurrentUser();
    const { rows } = await pool.query(
      `SELECT m.id, m.kind, m.url, m.user_id, m.created_at,
              u.name AS uploader_name,
              ($2::bigint IS NOT NULL AND m.user_id = $2) AS mine
       FROM court_media m
       LEFT JOIN users u ON u.id = m.user_id
       WHERE m.court_id = $1 AND m.status = 'visible'
       ORDER BY m.created_at DESC
       LIMIT 60`,
      [id, me?.id ?? null]
    );
    return NextResponse.json({ media: rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/v1/courts/[id]/media — 登入球友新增一則照片/影片。先顯示、可被檢舉下架。
// body: { kind: 'photo'|'video', url: string }
//   photo:url 來自 /api/v1/courts/upload(Blob 圖)
//   video:url 可為 YouTube 連結,或 /api/v1/blob/upload 直傳回來的 Blob mp4 網址
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    const { id } = await params;
    const b = await req.json();
    const kind = String(b.kind ?? "");
    const url = String(b.url ?? "").trim();

    if (kind !== "photo" && kind !== "video")
      return NextResponse.json({ error: "kind 不正確" }, { status: 400 });
    if (!/^https?:\/\/.+/i.test(url) || url.length > 600)
      return NextResponse.json({ error: "網址不正確" }, { status: 400 });
    if (kind === "video") {
      const ok = /youtube\.com|youtu\.be/i.test(url) || /\.(mp4|webm|mov)(\?.*)?$/i.test(url) || /\.blob\.vercel-storage\.com/i.test(url);
      if (!ok) return NextResponse.json({ error: "影片僅接受 YouTube 連結或上傳的影片檔" }, { status: 400 });
    }

    // 防洗版:單一球場單人最多 20 則
    const cnt = await pool.query(
      "SELECT count(*)::int AS n FROM court_media WHERE court_id=$1 AND user_id=$2 AND status='visible'",
      [id, me.id]
    );
    if (cnt.rows[0].n >= 20)
      return NextResponse.json({ error: "你在此球場的分享已達上限" }, { status: 429 });

    const { rows } = await pool.query(
      `INSERT INTO court_media (court_id, user_id, kind, url) VALUES ($1,$2,$3,$4)
       RETURNING id, kind, url, user_id, created_at`,
      [id, me.id, kind, url]
    );
    return NextResponse.json({ media: { ...rows[0], mine: true } }, { status: 201 });
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 500;
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status });
  }
}
