import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { pool } from "@/app/lib/db";
import { sendEmail } from "@/app/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/auth/forgot — 申請密碼重設。
// 無論 email 是否存在,一律回 {ok:true},避免洩漏帳號是否註冊。
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const email = String(b.email ?? "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "email 格式不正確" }, { status: 400 });
    }

    const { rows } = await pool.query("SELECT id FROM find_password_user($1)", [email]);
    const user = rows[0];

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 小時
      await pool.query("SELECT create_reset_token($1, $2, $3)", [
        user.id,
        tokenHash,
        expires.toISOString(),
      ]);

      const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.vektr.com.tw";
      const link = `${base}/reset?token=${token}`;
      await sendEmail({
        to: email,
        subject: "VEKTR 密碼重設",
        html: `<div style="font-family:-apple-system,'Noto Sans TC',sans-serif;max-width:480px;margin:0 auto">
          <p>你好,</p>
          <p>我們收到了你的 VEKTR 密碼重設要求。請點下方連結設定新密碼(1 小時內有效):</p>
          <p><a href="${link}" style="display:inline-block;background:#1e3a8a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">重設密碼</a></p>
          <p style="color:#64748b;font-size:13px">若按鈕無法點擊,請複製此網址:<br>${link}</p>
          <p style="color:#64748b;font-size:13px">若這不是你本人的操作,請忽略本信,你的密碼不會被變更。</p>
        </div>`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
