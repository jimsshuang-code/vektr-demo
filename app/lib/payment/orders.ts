// app/lib/payment/orders.ts — 付款訂單資料層(預留)。
import { pool } from "@/app/lib/db";

export type PaymentOrder = {
  id: number;
  ref: string;
  amount: number;
  kind: string;
  status: string;
};

// 產生綠界用的 MerchantTradeNo(<=20 碼,英數)
export function genRef(): string {
  return `VK${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.slice(0, 20).toUpperCase();
}

export async function createOrder(d: {
  ref: string;
  user_id?: number | null;
  kind: string;
  related_id?: number | null;
  amount: number;
  description?: string | null;
}): Promise<number> {
  const r = await pool.query(
    `INSERT INTO payment_orders (ref, user_id, kind, related_id, amount, description)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [d.ref, d.user_id ?? null, d.kind, d.related_id ?? null, d.amount, d.description ?? null]
  );
  return Number(r.rows[0].id);
}

export async function markOrderPaid(ref: string, providerTradeNo: string): Promise<boolean> {
  const r = await pool.query(
    `UPDATE payment_orders SET status='paid', provider_trade_no=$2, paid_at=now()
      WHERE ref=$1 AND status='pending'`,
    [ref, providerTradeNo]
  );
  return (r.rowCount ?? 0) > 0;
}

export async function markOrderFailed(ref: string): Promise<void> {
  await pool.query("UPDATE payment_orders SET status='failed' WHERE ref=$1 AND status='pending'", [ref]);
}
