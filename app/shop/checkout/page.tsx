"use client";
// ============================================================================
// /shop/checkout — 結帳:配送(超商選店/宅配)+ 付款 + 收件人 → 跳轉綠界
// ============================================================================
import { useEffect, useState } from "react";
import Link from "next/link";
import { readCart, clearCart, twd, type CartLine } from "../_lib/cart";

type Shipping = "cvs_711" | "cvs_family" | "home";
type Payment = "Credit" | "CVS" | "ATM";
type CvsStore = { storeId: string; storeName: string; address: string };

const FEES: Record<Shipping, number> = { cvs_711: 6000, cvs_family: 6000, home: 12000 };
const FREE = 150000;

export default function CheckoutPage() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [shipping, setShipping] = useState<Shipping>("cvs_711");
  const [payment, setPayment] = useState<Payment>("Credit");
  const [store, setStore] = useState<CvsStore | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLines(readCart());
    setReady(true);
    // 綠界地圖選店回傳(cvs-store route postMessage)
    const onMsg = (e: MessageEvent) => {
      const d = e.data as { type?: string; store?: CvsStore };
      if (d?.type === "vektr_cvs_store" && d.store?.storeId) setStore(d.store);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const subtotal = lines.reduce((s, l) => s + l.priceCents * l.qty, 0);
  const fee = subtotal >= FREE ? 0 : FEES[shipping];
  const total = subtotal + fee;
  const isCvs = shipping !== "home";

  async function openCvsMap() {
    const subtype = shipping === "cvs_711" ? "UNIMARTC2C" : "FAMIC2C";
    const r = await fetch(`/api/v1/shop/cvs-map?subtype=${subtype}`);
    if (!r.ok) { setError("無法開啟門市地圖,請稍後再試"); return; }
    const { action, fields } = (await r.json()) as { action: string; fields: Record<string, string> };
    const w = window.open("", "vektr_cvs_map", "width=1000,height=720");
    if (!w) { setError("請允許彈出視窗以選擇門市"); return; }
    const form = document.createElement("form");
    form.method = "POST";
    form.action = action;
    form.target = "vektr_cvs_map";
    for (const [k, v] of Object.entries(fields)) {
      const input = document.createElement("input");
      input.type = "hidden"; input.name = k; input.value = v;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
    form.remove();
  }

  async function submit() {
    setError(null);
    if (lines.length === 0) { setError("購物車是空的"); return; }
    if (!name.trim()) { setError("請填寫收件人姓名"); return; }
    if (!/^09\d{8}$/.test(phone)) { setError("請填寫正確的手機號碼(09 開頭 10 碼)"); return; }
    if (isCvs && !store) { setError("請選擇取貨門市"); return; }
    if (!isCvs && address.trim().length < 8) { setError("請填寫完整宅配地址"); return; }

    setSubmitting(true);
    try {
      const r = await fetch("/api/v1/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ variantId: l.variantId, qty: l.qty })),
          payment,
          shippingMethod: shipping,
          receiverName: name.trim(),
          receiverPhone: phone,
          cvsStoreId: store?.storeId,
          cvsStoreName: store?.storeName,
          cvsStoreAddress: store?.address,
          homeAddress: address.trim() || undefined,
        }),
      });
      const data = (await r.json()) as {
        error?: string;
        ecpay?: { action: string; fields: Record<string, string> };
      };
      if (r.status === 401) { window.location.href = "/login?next=/shop/checkout"; return; }
      if (r.status === 409) { setError("部分商品庫存不足,請回購物車調整數量"); setSubmitting(false); return; }
      if (!r.ok || !data.ecpay) { setError(`結帳失敗(${data.error ?? r.status}),請稍後再試`); setSubmitting(false); return; }

      clearCart();
      // 自動 POST 跳轉綠界收銀台
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.ecpay.action;
      for (const [k, v] of Object.entries(data.ecpay.fields)) {
        const input = document.createElement("input");
        input.type = "hidden"; input.name = k; input.value = v;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch {
      setError("連線異常,請稍後再試");
      setSubmitting(false);
    }
  }

  if (!ready) return null;
  if (lines.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-gray-400">購物車是空的</p>
        <Link href="/shop" className="mt-4 inline-block rounded-xl bg-blue-900 px-6 py-3 font-semibold text-lime-300">去逛逛</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-blue-900">結帳</h1>

      {/* 配送方式 */}
      <section className="mt-6">
        <h2 className="font-semibold text-gray-900">配送方式</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {([
            ["cvs_711", "7-11 取貨", "NT$60"],
            ["cvs_family", "全家取貨", "NT$60"],
            ["home", "宅配", "NT$120"],
          ] as [Shipping, string, string][]).map(([key, label, feeLabel]) => (
            <button
              key={key}
              type="button"
              onClick={() => { setShipping(key); setStore(null); }}
              className={`rounded-xl border-2 px-3 py-3 text-sm font-semibold ${shipping === key ? "border-blue-900 bg-blue-900 text-lime-300" : "border-gray-200 text-gray-600"}`}
            >
              {label}
              <span className="block text-xs font-normal opacity-70">{subtotal >= FREE ? "免運" : feeLabel}</span>
            </button>
          ))}
        </div>

        {isCvs ? (
          <div className="mt-3">
            {store ? (
              <div className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                <div>
                  <p className="font-semibold text-gray-900">{store.storeName}</p>
                  <p className="text-sm text-gray-500">{store.address}</p>
                </div>
                <button type="button" className="text-sm text-blue-900 underline" onClick={openCvsMap}>更換</button>
              </div>
            ) : (
              <button type="button" onClick={openCvsMap} className="w-full rounded-xl border-2 border-dashed border-gray-300 py-3 text-gray-500">
                選擇取貨門市
              </button>
            )}
          </div>
        ) : (
          <input
            className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-3"
            placeholder="宅配地址(縣市區+路街巷弄號樓)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        )}
      </section>

      {/* 收件人 */}
      <section className="mt-6">
        <h2 className="font-semibold text-gray-900">收件人</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input className="rounded-xl border border-gray-300 px-4 py-3" placeholder="姓名(取貨需證件核對)"
            value={name} onChange={(e) => setName(e.target.value)} />
          <input className="rounded-xl border border-gray-300 px-4 py-3" placeholder="手機 09xxxxxxxx" inputMode="numeric"
            value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} />
        </div>
      </section>

      {/* 付款方式 */}
      <section className="mt-6">
        <h2 className="font-semibold text-gray-900">付款方式</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {([
            ["Credit", "信用卡", "即時入帳"],
            ["CVS", "超商代碼", "3 天內繳費"],
            ["ATM", "ATM 轉帳", "3 天內繳費"],
          ] as [Payment, string, string][]).map(([key, label, hint]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPayment(key)}
              className={`rounded-xl border-2 px-3 py-3 text-sm font-semibold ${payment === key ? "border-blue-900 bg-blue-900 text-lime-300" : "border-gray-200 text-gray-600"}`}
            >
              {label}
              <span className="block text-xs font-normal opacity-70">{hint}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 金額 */}
      <section className="mt-6 rounded-xl bg-gray-50 p-4 text-sm">
        <div className="flex justify-between text-gray-600"><span>小計({lines.reduce((s, l) => s + l.qty, 0)} 件)</span><span>{twd(subtotal)}</span></div>
        <div className="mt-1 flex justify-between text-gray-600"><span>運費</span><span>{fee === 0 ? "免運" : twd(fee)}</span></div>
        <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-blue-900">
          <span>合計</span><span>{twd(total)}</span>
        </div>
      </section>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        disabled={submitting}
        onClick={submit}
        className="mt-6 w-full rounded-xl bg-blue-900 py-4 font-semibold text-lime-300 disabled:opacity-50"
      >
        {submitting ? "處理中…" : `前往付款 ${twd(total)}`}
      </button>
      <p className="mt-3 text-center text-xs text-gray-400">點擊後將跳轉至綠界(ECPay)安全付款頁面</p>
    </main>
  );
}
