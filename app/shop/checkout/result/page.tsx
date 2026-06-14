"use client";
// ============================================================================
// /shop/checkout/result — 付款結果頁(?orderNo=&ok=1|0)
// 信用卡:ok=1 即成功;ATM/超商代碼:顯示取號繳費資訊(向 API 查單)。
// ============================================================================
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Order = {
  orderNo: string;
  status: string;
  totalCents: number;
  paymentMethod: string | null;
  atmBankCode: string | null;
  atmVAccount: string | null;
  cvsPaymentNo: string | null;
  paymentExpireAt: string | null;
};

function twd(c: number) {
  return "NT$" + Math.round(c / 100).toLocaleString("en-US");
}

function ResultInner() {
  const sp = useSearchParams();
  const orderNo = sp.get("orderNo") ?? "";
  const ok = sp.get("ok") === "1";
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNo) { setLoading(false); return; }
    fetch(`/api/v1/shop/orders/${encodeURIComponent(orderNo)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setOrder(d?.order ?? null))
      .finally(() => setLoading(false));
  }, [orderNo]);

  if (loading) return <p className="py-16 text-center text-gray-400">載入中…</p>;

  const awaiting = order?.status === "awaiting_payment";
  const paid = ok || order?.status === "paid";

  return (
    <main className="mx-auto max-w-lg px-4 py-12 text-center">
      {paid ? (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime-300 text-3xl">✓</div>
          <h1 className="mt-4 text-2xl font-bold text-blue-900">付款成功</h1>
          <p className="mt-2 text-gray-500">訂單 {orderNo} 已成立,我們將盡快為您出貨。</p>
        </>
      ) : awaiting && order ? (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-3xl">⏳</div>
          <h1 className="mt-4 text-2xl font-bold text-blue-900">訂單成立,等待繳費</h1>
          <div className="mt-6 rounded-xl bg-gray-50 p-5 text-left text-sm">
            <p className="flex justify-between"><span className="text-gray-500">訂單編號</span><span className="font-mono">{order.orderNo}</span></p>
            <p className="mt-2 flex justify-between"><span className="text-gray-500">金額</span><b>{twd(order.totalCents)}</b></p>
            {order.atmVAccount && (
              <>
                <p className="mt-2 flex justify-between"><span className="text-gray-500">銀行代碼</span><span className="font-mono">{order.atmBankCode}</span></p>
                <p className="mt-2 flex justify-between"><span className="text-gray-500">虛擬帳號</span><span className="font-mono">{order.atmVAccount}</span></p>
              </>
            )}
            {order.cvsPaymentNo && (
              <p className="mt-2 flex justify-between"><span className="text-gray-500">超商繳費代碼</span><span className="font-mono">{order.cvsPaymentNo}</span></p>
            )}
            {order.paymentExpireAt && (
              <p className="mt-2 flex justify-between"><span className="text-gray-500">繳費期限</span><span>{new Date(order.paymentExpireAt).toLocaleString("zh-TW")}</span></p>
            )}
          </div>
          <p className="mt-3 text-xs text-gray-400">繳費完成後約 10–30 分鐘入帳,可至「我的訂單」查看狀態。</p>
        </>
      ) : (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">✕</div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">付款未完成</h1>
          <p className="mt-2 text-gray-500">{orderNo ? `訂單 ${orderNo} 尚未完成付款,` : ""}您可以回購物車重新結帳。</p>
        </>
      )}

      <div className="mt-8 flex justify-center gap-3">
        <Link href="/shop/orders" className="rounded-xl bg-blue-900 px-6 py-3 font-semibold text-lime-300">我的訂單</Link>
        <Link href="/shop" className="rounded-xl border-2 border-blue-900 px-6 py-3 font-semibold text-blue-900">繼續購物</Link>
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-gray-400">載入中…</p>}>
      <ResultInner />
    </Suspense>
  );
}
