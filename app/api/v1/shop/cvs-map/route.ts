// GET /api/v1/shop/cvs-map?subtype=UNIMARTC2C|FAMIC2C
// 回綠界電子地圖表單參數;前端以新視窗 POST 開啟讓用戶選店。
import { NextResponse } from "next/server";
import { buildCvsMapForm, type CvsSubType } from "@/app/lib/ecpay";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const subtype = url.searchParams.get("subtype");
  if (subtype !== "UNIMARTC2C" && subtype !== "FAMIC2C") {
    return NextResponse.json({ error: "invalid_subtype" }, { status: 400 });
  }
  return NextResponse.json(buildCvsMapForm({ subType: subtype as CvsSubType }));
}
