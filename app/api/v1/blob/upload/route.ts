import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/app/lib/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/blob/upload — 影片直傳(瀏覽器 → Vercel Blob)的權杖端點。
// 大檔(影片)不走 base64 JSON(會超過 serverless body 上限),改用 client upload。
// 僅允許登入球友上傳影片,限 50MB。
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        await requireUser(); // 未登入會丟錯 → 拒發權杖
        return {
          allowedContentTypes: ["video/mp4", "video/quicktime", "video/webm"],
          maximumSizeInBytes: 50 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // 紀錄由前端拿到 URL 後再呼叫 /api/v1/courts/[id]/media 建立,故此處不需處理。
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "upload error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
