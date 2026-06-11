// app/lib/marketingDb.ts — 行銷後台資料層(公告/橫幅)。
import { unstable_cache } from "next/cache";
import { pool } from "@/app/lib/db";

export type Announcement = {
  id: number;
  title: string;
  body: string | null;
  link_url: string | null;
  link_label: string | null;
  active: boolean;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

function map(r: any): Announcement {
  return {
    id: Number(r.id),
    title: r.title,
    body: r.body ?? null,
    link_url: r.link_url ?? null,
    link_label: r.link_label ?? null,
    active: !!r.active,
    priority: Number(r.priority ?? 0),
    starts_at: r.starts_at ? new Date(r.starts_at).toISOString() : null,
    ends_at: r.ends_at ? new Date(r.ends_at).toISOString() : null,
    created_at: new Date(r.created_at).toISOString(),
  };
}

// 前台:目前該顯示的公告(啟用 + 在有效期間內,priority 最高)。
// unstable_cache:全站快取 60 秒,避免每個頁面都打 DB / 被迫變動態。
export const getActiveAnnouncement = unstable_cache(
  async (): Promise<Announcement | null> => {
    try {
      const r = await pool.query(
        `SELECT * FROM announcements
          WHERE active = true
            AND (starts_at IS NULL OR starts_at <= now())
            AND (ends_at IS NULL OR ends_at > now())
          ORDER BY priority DESC, created_at DESC
          LIMIT 1`
      );
      return r.rowCount ? map(r.rows[0]) : null;
    } catch {
      return null;
    }
  },
  ["active-announcement"],
  { revalidate: 60, tags: ["announcements"] }
);

// 後台
export async function adminListAnnouncements(): Promise<Announcement[]> {
  const r = await pool.query(`SELECT * FROM announcements ORDER BY priority DESC, created_at DESC LIMIT 200`);
  return r.rows.map(map);
}

export async function createAnnouncement(d: {
  title: string;
  body?: string | null;
  link_url?: string | null;
  link_label?: string | null;
  priority?: number;
  starts_at?: string | null;
  ends_at?: string | null;
}): Promise<number> {
  const r = await pool.query(
    `INSERT INTO announcements (title, body, link_url, link_label, priority, starts_at, ends_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [
      d.title,
      d.body ?? null,
      d.link_url ?? null,
      d.link_label ?? null,
      d.priority ?? 0,
      d.starts_at || null,
      d.ends_at || null,
    ]
  );
  return Number(r.rows[0].id);
}

export async function setAnnouncementActive(id: number, active: boolean): Promise<boolean> {
  const r = await pool.query("UPDATE announcements SET active=$2 WHERE id=$1", [id, active]);
  return (r.rowCount ?? 0) > 0;
}

export async function deleteAnnouncement(id: number): Promise<boolean> {
  const r = await pool.query("DELETE FROM announcements WHERE id=$1", [id]);
  return (r.rowCount ?? 0) > 0;
}
