// app/lib/currentUser.ts
// 取得「目前球友」的內部 users.id,給約球 API 用。
//
// 現況:本專案的 auth() 目前只認 admin(Credentials),一般球友尚無法登入。
// 為了讓約球在「球友登入(LINE)」接上線前就能 demo/開發,這裡提供一個
// 受環境變數保護的 DEV 後備身分:
//   - 設定 MATCH_DEV_USER_ID=<users.id> 後,未登入請求會被當成該球友。
//   - 正式環境(NODE_ENV=production)且未設該變數時,一律視為未登入。
//
// 之後接上 LINE 登入,只要讓 auth() 能回傳球友的 users.id,
// 再把這支的 DEV 後備拿掉即可。介面不變,API 不用改。

import { auth } from "@/auth";

export type CurrentUser = { id: number; role: string };

export async function getCurrentUser(): Promise<CurrentUser | null> {
  // 1) 正式 session(未來球友登入後,session.user.id 應為 users.id)
  try {
    const session = await auth();
    const uid = (session?.user as any)?.id;
    // 注意:目前 session 來自 adminUser,其 id 不是球友 users.id。
    // 待球友登入接上後,這裡即為真正來源。暫以 role 區分,避免誤用 admin id。
    if (uid && (session?.user as any)?.role === "user") {
      return { id: Number(uid), role: "user" };
    }
  } catch {
    /* ignore */
  }

  // 2) DEV 後備身分(僅非 production 或顯式設定時)
  const devId = process.env.MATCH_DEV_USER_ID;
  if (devId && process.env.NODE_ENV !== "production") {
    return { id: Number(devId), role: "user" };
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
