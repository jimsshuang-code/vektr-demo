// app/lib/currentUser.ts
// 取得「目前球友」的內部 users.id,給約球 API 用。
//
// 球友 LINE 登入已上線:auth() 的 session.user.id 即為球友 users.id
//(role === "user")。身分唯一來源為登入 session;未登入一律視為 null,
// 由 requireUser() 轉成 401。
//
// (A4 已移除舊的 MATCH_DEV_USER_ID dev 後備:本機開發請用真實 LINE 登入。)

import { auth } from "@/auth";

export type CurrentUser = { id: number; role: string };

export async function getCurrentUser(): Promise<CurrentUser | null> {
  // 球友登入 session:session.user.id 為 users.id,role 為 "user"。
  // 以 role 區分,避免誤用 admin(Credentials)session 的 admin_users.id。
  try {
    const session = await auth();
    const uid = (session?.user as any)?.id;
    if (uid && (session?.user as any)?.role === "user") {
      return { id: Number(uid), role: "user" };
    }
  } catch {
    /* ignore */
  }

  return null;
}

export async function requireUser(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) {
    const err = new Error("Unauthorized");
    (err as any).status = 401;
    throw err;
  }
  return u;
}
