// app/lib/coachesDb.ts
// 教練系統資料層(純媒合,無金流)。沿用 courts 模式:直接走 pool,存取控制在 API/頁面層。
// 教練聯絡方式(contact)僅後台函式回傳,前台公開查詢一律不含 contact。
import { pool } from "@/app/lib/db";

export type PublicCoach = {
  id: number;
  name: string;
  bio: string | null;
  city: string | null;
  district: string | null;
  specialties: string | null;
  dupr_rating: number | null;
  hourly_rate: number | null;
  avatar_url: string | null;
};

export type AdminCoach = PublicCoach & { contact: string; status: string; created_at: string };

export type Booking = {
  id: number;
  coach_id: number;
  coach_name: string | null;
  student_name: string;
  student_contact: string;
  preferred_time: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

const PUB_COLS =
  "id, name, bio, city, district, specialties, dupr_rating, hourly_rate, avatar_url";

function mapPublic(r: any): PublicCoach {
  return {
    id: Number(r.id),
    name: r.name,
    bio: r.bio ?? null,
    city: r.city ?? null,
    district: r.district ?? null,
    specialties: r.specialties ?? null,
    dupr_rating: r.dupr_rating != null ? Number(r.dupr_rating) : null,
    hourly_rate: r.hourly_rate != null ? Number(r.hourly_rate) : null,
    avatar_url: r.avatar_url ?? null,
  };
}

// ---- 前台(公開,只回 active,不含 contact) --------------------------------
export async function listActiveCoaches(city?: string | null): Promise<PublicCoach[]> {
  try {
    const params: unknown[] = [];
    let where = "status = 'active'";
    if (city && city.trim()) {
      params.push(city.trim());
      where += ` AND city = $${params.length}`;
    }
    const r = await pool.query(
      `SELECT ${PUB_COLS} FROM coaches WHERE ${where} ORDER BY created_at DESC LIMIT 300`,
      params
    );
    return r.rows.map(mapPublic);
  } catch {
    return [];
  }
}

export async function getActiveCoach(id: number): Promise<PublicCoach | null> {
  if (!Number.isFinite(id)) return null;
  try {
    const r = await pool.query(
      `SELECT ${PUB_COLS} FROM coaches WHERE id = $1 AND status = 'active'`,
      [id]
    );
    return r.rowCount ? mapPublic(r.rows[0]) : null;
  } catch {
    return null;
  }
}

// ---- 申請成為教練(public insert,status pending) --------------------------
export async function createCoachApplication(d: {
  name: string;
  contact: string;
  bio?: string | null;
  city?: string | null;
  district?: string | null;
  specialties?: string | null;
  dupr_rating?: number | null;
  hourly_rate?: number | null;
}): Promise<number> {
  const r = await pool.query(
    `INSERT INTO coaches (name, contact, bio, city, district, specialties, dupr_rating, hourly_rate, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending') RETURNING id`,
    [
      d.name,
      d.contact,
      d.bio ?? null,
      d.city ?? null,
      d.district ?? null,
      d.specialties ?? null,
      d.dupr_rating ?? null,
      d.hourly_rate ?? null,
    ]
  );
  return Number(r.rows[0].id);
}

// ---- 預約需求(學員送出;coach 須為 active) -------------------------------
export async function createBooking(
  coachId: number,
  d: { student_user_id?: number | null; student_name: string; student_contact: string; preferred_time?: string | null; message?: string | null }
): Promise<{ ok: boolean; reason?: string }> {
  const c = await pool.query("SELECT id FROM coaches WHERE id = $1 AND status = 'active'", [coachId]);
  if (c.rowCount === 0) return { ok: false, reason: "coach_not_available" };
  await pool.query(
    `INSERT INTO coach_bookings (coach_id, student_user_id, student_name, student_contact, preferred_time, message)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [coachId, d.student_user_id ?? null, d.student_name, d.student_contact, d.preferred_time ?? null, d.message ?? null]
  );
  return { ok: true };
}

// ---- 後台(含 contact) ------------------------------------------------------
export async function adminListCoaches(status?: string | null): Promise<AdminCoach[]> {
  const params: unknown[] = [];
  let where = "1=1";
  if (status) {
    params.push(status);
    where = `status = $${params.length}`;
  }
  const r = await pool.query(
    `SELECT ${PUB_COLS}, contact, status, created_at FROM coaches WHERE ${where} ORDER BY
       case status when 'pending' then 0 when 'active' then 1 else 2 end, created_at DESC LIMIT 500`,
    params
  );
  return r.rows.map((row) => ({
    ...mapPublic(row),
    contact: row.contact,
    status: row.status,
    created_at: new Date(row.created_at).toISOString(),
  }));
}

export async function adminSetCoachStatus(id: number, status: "active" | "rejected" | "pending"): Promise<boolean> {
  const r = await pool.query("UPDATE coaches SET status = $2 WHERE id = $1", [id, status]);
  return (r.rowCount ?? 0) > 0;
}

export async function adminListBookings(): Promise<Booking[]> {
  const r = await pool.query(
    `SELECT b.id, b.coach_id, c.name AS coach_name, b.student_name, b.student_contact,
            b.preferred_time, b.message, b.status, b.created_at
       FROM coach_bookings b
       LEFT JOIN coaches c ON c.id = b.coach_id
      ORDER BY b.created_at DESC LIMIT 500`
  );
  return r.rows.map((b) => ({
    id: Number(b.id),
    coach_id: Number(b.coach_id),
    coach_name: b.coach_name ?? null,
    student_name: b.student_name,
    student_contact: b.student_contact,
    preferred_time: b.preferred_time ?? null,
    message: b.message ?? null,
    status: b.status,
    created_at: new Date(b.created_at).toISOString(),
  }));
}
