"use client";
// ============================================================================
// /shop/cart — 購物車(localStorage)
// ============================================================================
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  readCart, setQty, twd, type CartLine,
} from "../_lib/cart";

const FREE_SHIPPING_CENTS = 150000;

export default function CartPage() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setLines(readCart());
    sync();
    setReady(true);
    window.addEventListener("vektr_cart_changed", sync);
    return () => window.removeEventListener("vektr_cart_changed", sync);
  }, []);

  const subtotal = lines.reduce((s, l) => s + l.priceCents * l.qty, 0);

  if (!ready) return null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-blue-900">購物車</h1>

      {lines.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-gray-400">購物車是空的</p>
          <Link href="/shop" className="mt-4 inline-block rounded-xl bg-blue-900 px-6 py-3 font-semibold text-lime-300">
            去逛逛
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 divide-y divide-gray-100">
            {lines.map((l) => (
              <li key={l.variantId} className="flex items-center gap-4 py-4">
                <Link href={`/shop/${l.productSlug}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {l.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.image} alt="" className="h-full w-full object-cover" />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900">{l.productName}</p>
                  {l.variantName !== "default" && (
                    <p className="text-sm text-gray-500">{l.variantName}</p>
                  )}
                  <p className="text-sm font-bold text-blue-900">{twd(l.priceCents)}</p>
                </div>
                <div className="flex items-center rounded-lg border border-gray-300">
                  <button type="button" className="px-3 py-1.5" onClick={() => setQty(l.variantId, l.qty - 1)}>−</button>
                  <span className="w-8 text-center text-sm">{l.qty}</span>
                  <button type="button" className="px-3 py-1.5" onClick={() => setQty(l.variantId, Math.min(99, l.qty + 1))}>+</button>
                </div>
                <button type="button" className="text-sm text-gray-400 hover:text-red-500" onClick={() => setQty(l.variantId, 0)}>
                  移除
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl bg-gray-50 p-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>小計</span><span>{twd(subtotal)}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm text-gray-600">
              <span>運費</span>
              <span>{subtotal >= FREE_SHIPPING_CENTS ? "免運" : "結帳時計算(滿 NT$1,500 免運)"}</span>
            </div>
          </div>

          <Link
            href="/shop/checkout"
            className="mt-6 block rounded-xl bg-blue-900 py-3.5 text-center font-semibold text-lime-300"
          >
            前往結帳 · {twd(subtotal)}
          </Link>
        </>
      )}
    </main>
  );
}
