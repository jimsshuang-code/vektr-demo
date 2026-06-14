// ============================================================================
// POST /api/v1/payments/ecpay/cvs-store — 綠界電子地圖「選店完成」回傳
// 流程:結帳頁以新視窗 POST 開啟綠界地圖 → 用戶選店 → 綠界把門市資料 POST 到
// 本端點(在該新視窗內)→ 回一頁 HTML 把門市 postMessage 給 opener 後自動關閉。
// ============================================================================
import { parseFormBody } from "@/app/lib/ecpay";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const p = await parseFormBody(req);
  const store = {
    storeId: p.CVSStoreID ?? "",
    storeName: p.CVSStoreName ?? "",
    address: p.CVSAddress ?? "",
    extraData: p.ExtraData ?? "",
  };
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>門市已選擇</title></head>
<body style="font-family:sans-serif;text-align:center;padding-top:4rem">
<p>已選擇:${escapeHtml(store.storeName)}</p><p>視窗將自動關閉…</p>
<script>
  try {
    if (window.opener) {
      window.opener.postMessage({ type: "vektr_cvs_store", store: ${JSON.stringify(store)} }, "${(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.vektr.com.tw").replace(/\/$/, "")}");
    }
  } catch (e) {}
  setTimeout(function(){ window.close(); }, 800);
</script></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}
