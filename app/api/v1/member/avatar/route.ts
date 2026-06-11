import { NextRequest, NextResponse } from "next/server";
import { uploadAvatarDataUrl } from "@/app/lib/avatar";
import { requireUser } from "@/app/lib/currentUser";
import { withUser } from "@/app/lib/matchDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/member/avatar — 球友更換頭像(需登入):上傳 + 更新 users.avatar_url。
export async function POST(req: NextRequest) {
  try {
    const me = await requireUser();
    const { dataUrl } = await req.json();
    const url = await uploadAvatarDataUrl(String(dataUrl ?? ""));
    await withUser(me.id, async (c) => {
      await c.query("UPDATE users SET avatar_url = $1 WHERE id = $2", [url, me.id]);
    });
    return NextResponse.json({ url });
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 500;
    const msg = e instanceof Error ? e.message : "上傳失敗";
    return NextResponse.json({ error: msg }, { status });
  }
}
