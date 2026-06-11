import { NextRequest, NextResponse } from "next/server";
import { uploadAvatarDataUrl } from "@/app/lib/avatar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/avatar — 通用頭像上傳(教練申請用)。回 { url }。
export async function POST(req: NextRequest) {
  try {
    const { dataUrl } = await req.json();
    const url = await uploadAvatarDataUrl(String(dataUrl ?? ""));
    return NextResponse.json({ url });
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 500;
    const msg = e instanceof Error ? e.message : "上傳失敗";
    return NextResponse.json({ error: msg }, { status });
  }
}
