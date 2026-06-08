import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/currentUser";
import {
  createReport,
  isSuspended,
  REPORT_CATEGORIES,
  type ReportCategory,
} from "@/app/lib/reportsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/reports  球友檢舉
export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // write-time 停權守衛
  if (await isSuspended(me.id)) {
    return NextResponse.json({ error: "account_suspended" }, { status: 403 });
  }

  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const reportedUserId = Number(b.reportedUserId);
  const matchId =
    b.matchId === null || b.matchId === undefined ? null : Number(b.matchId);
  const category = String(b.category ?? "") as ReportCategory;
  const detail = typeof b.detail === "string" ? b.detail.trim().slice(0, 1000) : null;

  if (!Number.isInteger(reportedUserId) || reportedUserId <= 0) {
    return NextResponse.json({ error: "invalid_reported_user" }, { status: 400 });
  }
  if (matchId !== null && (!Number.isInteger(matchId) || matchId <= 0)) {
    return NextResponse.json({ error: "invalid_match" }, { status: 400 });
  }
  if (!REPORT_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "invalid_category" }, { status: 400 });
  }
  if (reportedUserId === me.id) {
    return NextResponse.json({ error: "cannot_report_self" }, { status: 400 });
  }

  try {
    const { id } = await createReport(me.id, { reportedUserId, matchId, category, detail });
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/match_reports_dedupe_open|duplicate key/.test(msg)) {
      return NextResponse.json({ error: "already_reported" }, { status: 409 });
    }
    console.error("[reports] create failed:", msg);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
