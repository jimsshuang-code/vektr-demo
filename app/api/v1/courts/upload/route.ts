import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/app/lib/currentUser";
import { uploadCourtImageDataUrl } from "@/app/lib/courtImage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/courts/upload — 登入球友上傳球場照片(社群分享 / 場主管理用),回 { url }。
export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const { dataUrl } = await req.json();
    const url = await uploadCourtImageDataUrl(String(dataUrl ?? ""));
    return NextResponse.json({ url });
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 500;
    const msg = e instanceof Error ? e.message : "上傳失敗";
    return NextResponse.json({ error: msg }, { status });
  }
}
