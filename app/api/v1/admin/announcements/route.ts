import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/rbac";
import { createAnnouncement } from "@/app/lib/marketingDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/admin/announcements — 建立公告(需 content 寫入權)
export async function POST(req: NextRequest) {
  const guard = await requireAdmin("content", { write: true });
  if (!guard.ok) return NextResponse.json({ error: "forbidden" }, { status: guard.status });
  try {
    const b = await req.json();
    const title = String(b.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "標題必填" }, { status: 400 });
    const id = await createAnnouncement({
      title: title.slice(0, 200),
      body: b.body ? String(b.body).slice(0, 2000) : null,
      link_url: b.link_url ? String(b.link_url).slice(0, 300) : null,
      link_label: b.link_label ? String(b.link_label).slice(0, 50) : null,
      priority: b.priority != null ? Number(b.priority) : 0,
      starts_at: b.starts_at || null,
      ends_at: b.ends_at || null,
    });
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
