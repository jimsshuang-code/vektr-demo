import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/rbac";
import { uploadCourtImageDataUrl } from "@/app/lib/courtImage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/admin/courts/upload — 後台上傳球場圖片(封面/相簿),回 { url }。
export async function POST(req: NextRequest) {
  const guard = await requireAdmin("courts", { write: true });
  if (!guard.ok) return NextResponse.json({ error: "forbidden" }, { status: guard.status });
  try {
    const { dataUrl } = await req.json();
    const url = await uploadCourtImageDataUrl(String(dataUrl ?? ""));
    return NextResponse.json({ url });
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 500;
    const msg = e instanceof Error ? e.message : "上傳失敗";
    return NextResponse.json({ error: msg }, { status });
  }
}
