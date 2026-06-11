// app/lib/reservationsDb.ts — 球場預約資料層(Phase 1,無金流)。直接走 pool。
import { pool } from "@/app/lib/db";

export type Reservation = {
  id: number;
  court_id: number;
  court_name: string | null;
  contact_name: string;
  contact: string;
  reserve_date: string;
  time_slot: string;
  party_size: number | null;
  note: string | null;
  status: string;
  created_at: string;
};

export async function createReservation(
  courtId: number,
  d: {
    user_id?: number | null;
    contact_name: string;
    contact: string;
    reserve_date: string;
    time_slot: string;
    party_size?: number | null;
    note?: string | null;
  }
): Promise<{ ok: boolean; reason?: string }> {
  const c = await pool.query("SELECT id FROM courts WHERE id = $1 AND status = 'active'", [courtId]);
  if (c.rowCount === 0) return { ok: false, reason: "court_not_available" };
  await pool.query(
    `INSERT INTO court_reservations (court_id, user_id, contact_name, contact, reserve_date, time_slot, party_size, note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      courtId,
      d.user_id ?? null,
      d.contact_name,
      d.contact,
      d.reserve_date,
      d.time_slot,
      d.party_size ?? null,
      d.note ?? null,
    ]
  );
  return { ok: true };
}

export async function adminListReservations(status?: string | null): Promise<Reservation[]> {
  const params: unknown[] = [];
  let where = "1=1";
  if (status) {
    params.push(status);
    where = `r.status = $${params.length}`;
  }
  const r = await pool.query(
    `SELECT r.id, r.court_id, co.name AS court_name, r.contact_name, r.contact,
            r.reserve_date, r.time_slot, r.party_size, r.note, r.status, r.created_at
       FROM court_reservations r
       LEFT JOIN courts co ON co.id = r.court_id
      WHERE ${where}
      ORDER BY case r.status when 'pending' then 0 else 1 end, r.created_at DESC
      LIMIT 500`,
    params
  );
  return r.rows.map((x) => ({
    id: Number(x.id),
    court_id: Number(x.court_id),
    court_name: x.court_name ?? null,
    contact_name: x.contact_name,
    contact: x.contact,
    reserve_date: x.reserve_date instanceof Date ? x.reserve_date.toISOString().slice(0, 10) : String(x.reserve_date),
    time_slot: x.time_slot,
    party_size: x.party_size != null ? Number(x.party_size) : null,
    note: x.note ?? null,
    status: x.status,
    created_at: new Date(x.created_at).toISOString(),
  }));
}

export async function adminSetReservationStatus(
  id: number,
  status: "confirmed" | "declined" | "pending" | "cancelled"
): Promise<boolean> {
  const r = await pool.query("UPDATE court_reservations SET status = $2 WHERE id = $1", [id, status]);
  return (r.rowCount ?? 0) > 0;
}

export async function pendingReservationCount(): Promise<number> {
  try {
    const r = await pool.query("SELECT count(*)::int AS n FROM court_reservations WHERE status = 'pending'");
    return Number(r.rows[0]?.n ?? 0);
  } catch {
    return 0;
  }
}
