// ============================================================================
// app/shop/_lib/cart.ts — 購物車(client,localStorage)
// ============================================================================
"use client";

export type CartLine = {
  variantId: number;
  productSlug: string;
  productName: string;
  variantName: string;
  priceCents: number;
  image: string | null;
  qty: number;
};

const KEY = "vektr_cart_v1";

export function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as CartLine[]) : [];
    return Array.isArray(arr) ? arr.filter((l) => l.qty > 0) : [];
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]): void {
  window.localStorage.setItem(KEY, JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent("vektr_cart_changed"));
}

export function addToCart(line: Omit<CartLine, "qty">, qty: number): void {
  const cart = readCart();
  const found = cart.find((l) => l.variantId === line.variantId);
  if (found) found.qty = Math.min(99, found.qty + qty);
  else cart.push({ ...line, qty: Math.min(99, qty) });
  writeCart(cart);
}

export function setQty(variantId: number, qty: number): void {
  const cart = readCart()
    .map((l) => (l.variantId === variantId ? { ...l, qty } : l))
    .filter((l) => l.qty > 0);
  writeCart(cart);
}

export function clearCart(): void {
  writeCart([]);
}

export function cartCount(): number {
  return readCart().reduce((s, l) => s + l.qty, 0);
}

export function cartSubtotalCents(): number {
  return readCart().reduce((s, l) => s + l.priceCents * l.qty, 0);
}

export function twd(cents: number): string {
  return "NT$" + Math.round(cents / 100).toLocaleString("en-US");
}
