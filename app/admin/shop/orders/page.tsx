"use client";
// ============================================================================
// /admin/shop/orders — 後台訂單管理(取代 placeholder「訂單管理」)
// 篩選 + 一鍵出貨(超商自動建綠界託運單 / 宅配填單號)+ 取消
// ============================================================================
import { useCallback, useEffect, useState } from "react";

type OrderItem = { productName: string; variantName: string; sku: string; qty: number; unitCents: number };
type Order = {
  id: number; order_no: string; status: string; total_cents: number;
  user_name: string | null; receiver_name: string; receiver_phone: string;
  shipping_method: string; cvs_store_name: string | null; cvs_store_address: string | null;
  home_address: string | null; payment_method: string | null;
  tracking_no: string | null; created_at: string; items: OrderItem[];
};

const TABS: [string, string][] = [
  ["paid", "待出貨"], ["awaiting_payment", "待繳費"], ["shipped", "已出貨"],
  ["completed", "已完成"], ["", "全部"],
];

const SHIP_LABEL: Record<string, string> = {
  cvs_711: "7-11 取貨", cvs_family: "全家取貨", home: "宅配",
};

function twd(c: number) { return "NT$" + Math.round(c / 100).toLocaleString("en-US"); }

export default function AdminOrdersPage() {
  const [tab, setTab] = useState("paid");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setOrders(null);
    fetch(`/api/v1/admin/shop/orders${tab ? `?status=${tab}` : ""}`)
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []));
  }, [tab]);
  useEffect(load, [load]);

  async function ship(o: Order) {
    setMsg(null);
    let trackingNo: string | undefined;
    if (o.shipping_method === "home") {
      trackingNo = window.prompt("宅配託運單號(可留空,之後再補):") ?? undefined;
    } else if (!confirm(`對 ${o.order_no} 建立綠界超商託運單?`)) {
      return;
    }
    setBusy(o.id);
    const r = await fetch(`/api/v1/admin/shop/orders/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ship", trackingNo }),
    });
    setBusy(null);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setMsg(`出貨失敗(${o.order_no}):${d.error ?? r.status}${d.detail ? " — " + d.detail : ""}`);
      return;
    }
    load();
  }

  async function cancel(o: Order) {
    if (!confirm(`取消訂單 ${o.order_no}?庫存將回補;若已付款請另至綠界後台退刷。`)) return;
    setBusy(o.id);
    const r = await fetch(`/api/v1/admin/shop/orders/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    setBusy(null);
    if (!r.ok) { setMsg(`取消失敗(${o.order_no})`); return; }
    load();
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold text-blue-900">訂單管理</h1>

      <div className="mt-4 flex gap-2">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-sm ${tab === key ? "bg-blue-900 text-lime-300" : "border border-gray-300 text-gray-600"}`}>
            {label}
          </button>
        ))}
      </div>

      {msg && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{msg}</p>}

      {orders === null ? (
        <p className="mt-8 text-gray-400">載入中…</p>
      ) : orders.length === 0 ? (
        <p className="mt-8 text-gray-400">沒有符合的訂單</p>
      ) : (
        <div className="mt-4 space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-gray-200 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold">{o.order_no}</span>
                  <span className="text-gray-400">{new Date(o.created_at).toLocaleString("zh-TW")}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{o.status}</span>
                </div>
                <b className="text-blue-900">{twd(o.total_cents)}</b>
              </div>

              <div className="mt-2 grid gap-1 text-gray-600 md:grid-cols-2">
                <p>
                  {o.items.map((i) =>
                    `${i.productName}${i.variantName !== "default" ? `(${i.variantName})` : ""} x${i.qty}`
                  ).join("、")}
                </p>
                <p>
                  {o.receiver_name}({o.receiver_phone})· {SHIP_LABEL[o.shipping_method] ?? o.shipping_method}
                  {o.cvs_store_name ? ` · ${o.cvs_store_name}` : ""}
                  {o.home_address ? ` · ${o.home_address}` : ""}
                </p>
              </div>

              {o.tracking_no && (
                <p className="mt-1 text-xs text-gray-400">託運/寄貨編號:{o.tracking_no}</p>
              )}

              <div className="mt-3 flex gap-2">
                {o.status === "paid" && (
                  <button type="button" disabled={busy === o.id} onClick={() => ship(o)}
                    className="rounded-lg bg-blue-900 px-4 py-1.5 text-xs font-semibold text-lime-300 disabled:opacity-50">
                    {busy === o.id ? "處理中…" : o.shipping_method === "home" ? "出貨(填單號)" : "出貨(建綠界託運單)"}
                  </button>
                )}
                {["pending", "awaiting_payment", "paid"].includes(o.status) && (
                  <button type="button" disabled={busy === o.id} onClick={() => cancel(o)}
                    className="rounded-lg border border-gray-300 px-4 py-1.5 text-xs text-gray-600 disabled:opacity-50">
                    取消訂單
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
