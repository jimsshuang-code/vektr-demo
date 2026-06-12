import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { pool } from "@/app/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/auth/reset — 用重設 token 設定新密碼。
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const token = String(b.token ?? "").trim();
    const password = String(b.password ?? "");
    if (!token) return NextResponse.json({ error: "連結無效" }, { status: 400 });
    if (password.length < 8)
      return NextResponse.json({ error: "密碼至少 8 碼" }, { status: 400 });

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const newHash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      "SELECT reset_password_with_token($1, $2) AS uid",
      [tokenHash, newHash]
    );
    const uid = rows[0]?.uid;
    if (!uid || Number(uid) === 0) {
      return NextResponse.json(
        { error: "重設連結無效或已過期,請重新申請" },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
