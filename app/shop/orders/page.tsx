"use client";
// ============================================================================
// /shop/orders — 我的訂單(會員中心可加入口連到這頁)
// ============================================================================
import { useEffect, useState } from "react";
import Link from "next/link";

type OrderSummary = {
  orderNo: string;
  status: string;
  totalCents: number;
  createdAt: string;
  itemCount: number;
  firstItemName: string | null;
};

const STATUS_LABEL: Record<string, [string, string]> = {
  pending: ["待付款", "bg-orange-100 text-orange-700"],
  awaiting_payment: ["待繳費", "bg-orange-100 text-orange-700"],
  paid: ["已付款,備貨中", "bg-blue-100 text-blue-800"],
  shipped: ["已出貨", "bg-lime-100 text-lime-800"],
  completed: ["已完成", "bg-gray-100 text-gray-600"],
  cancelled: ["已取消", "bg-gray-100 text-gray-400"],
  refunded: ["已退款", "bg-gray-100 text-gray-400"],
};

function twd(c: number) {
  return "NT$" + Math.round(c / 100).toLocaleString("en-US");
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [unauth, setUnauth] = useState(false);

  useEffect(() => {
    fetch("/api/v1/shop/orders").then(async (r) => {
      if (r.status === 401) { setUnauth(true); setOrders([]); return; }
      const d = await r.json();
      setOrders(d.orders ?? []);
    });
  }, []);

  if (orders === null) return <p className="py-16 text-center text-gray-400">載入中…</p>;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-blue-900">我的訂單</h1>

      {unauth ? (
        <div className="mt-16 text-center">
          <p className="text-gray-400">請先登入查看訂單</p>
          <Link href="/login?next=/shop/orders" className="mt-4 inline-block rounded-xl bg-blue-900 px-6 py-3 font-semibold text-lime-300">登入</Link>
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-gray-400">還沒有訂單</p>
          <Link href="/shop" className="mt-4 inline-block rounded-xl bg-blue-900 px-6 py-3 font-semibold text-lime-300">去逛逛</Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((o) => {
            const [label, cls] = STATUS_LABEL[o.status] ?? [o.status, "bg-gray-100 text-gray-600"];
            return (
              <li key={o.orderNo} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-gray-500">{o.orderNo}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{label}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="truncate text-sm text-gray-700">
                    {o.firstItemName}{o.itemCount > 1 ? ` 等 ${o.itemCount} 件` : ""}
                  </p>
                  <b className="text-blue-900">{twd(o.totalCents)}</b>
                </div>
                <p className="mt-1 text-xs text-gray-400">{new Date(o.createdAt).toLocaleString("zh-TW")}</p>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
