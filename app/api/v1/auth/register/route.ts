import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "@/app/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/auth/register — 以 email + 密碼註冊球友帳號。
// 成功後前端再呼叫 signIn("user-login", {email, password}) 登入。
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const email = String(b.email ?? "").trim().toLowerCase();
    const password = String(b.password ?? "");
    const name = String(b.name ?? "").trim();

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return NextResponse.json({ error: "email 格式不正確" }, { status: 400 });
    if (password.length < 8)
      return NextResponse.json({ error: "密碼至少 8 碼" }, { status: 400 });
    if (name.length > 30)
      return NextResponse.json({ error: "暱稱最多 30 字" }, { status: 400 });

    const hash = await bcrypt.hash(password, 10);

    try {
      await pool.query("SELECT id, role FROM register_user($1, $2, $3)", [
        email,
        hash,
        name || null,
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("email_taken"))
        return NextResponse.json(
          { error: "此 email 已被註冊,請直接登入" },
          { status: 409 }
        );
      throw e;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
