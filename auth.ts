import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import LINE from "next-auth/providers/line";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { pool } from "@/app/lib/db";
import { authConfig } from "@/auth.config";

// 推薦碼歸因:讀 vektr_ref cookie 並把新球友綁到推薦人(first-touch、fail-open)。
// bind_referral 只在 referred_by IS NULL 且非自我推薦時生效,故每次登入呼叫皆安全。
async function bindReferralFromCookie(uid: string | number) {
  try {
    const jar = await cookies();
    const ref = jar.get("vektr_ref")?.value;
    if (!ref) return;
    const { rows } = await pool.query("SELECT bind_referral($1,$2) AS bound", [
      Number(uid),
      ref,
    ]);
    // 綁定成功就清掉 cookie,避免之後重複處理(失敗則保留,下次再試)
    if (rows[0]?.bound === true) {
      try {
        jar.delete("vektr_ref");
      } catch {
        /* 某些情境 cookie 不可寫,忽略;DB 端已綁定 */
      }
    }
  } catch {
    // 歸因為加值功能,任何失敗都不得影響登入
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    // login-time 停權守衛(§6 決策 2)。只擋球友(LINE);admin(Credentials)不在 users 表,略過。
    async signIn({ user, account }) {
      if (account?.provider !== "line") return true;
      const uid = (user as { uid?: string }).uid ?? user.id;
      if (!uid) return true;
      try {
        const { rows } = await pool.query("SELECT user_is_suspended($1) AS s", [Number(uid)]);
        if (rows[0]?.s === true) return "/suspended";
      } catch {
        // 查詢失敗時不阻擋登入,避免 DB 抖動把所有人鎖在外面(write-time 仍會擋)
      }
      // 推薦碼歸因(fail-open,不影響登入結果)
      await bindReferralFromCookie(uid);
      return true;
    },
  },
  providers: [
    // 球友:LINE 登入(OIDC)。首登/回訪都呼叫 upsert_line_user(SECURITY DEFINER),
    // 用 LINE sub 對 users.line_user_id,拿回內部 users.id 與 role。
    // 回傳的 id/role 經既有 jwt/session callback 烤進 session.user.id / role。
    LINE({
      clientId: process.env.AUTH_LINE_ID,
      clientSecret: process.env.AUTH_LINE_SECRET,
      async profile(profile) {
        const { rows } = await pool.query(
          "SELECT id, role FROM upsert_line_user($1, $2, $3, $4)",
          [
            profile.sub,
            profile.name ?? null,
            profile.picture ?? null,
            profile.email ?? null,
          ]
        );
        const u = rows[0];
        return {
          id: String(u.id), // 注意:Auth.js OAuth 會把這個 id 覆蓋成隨機 UUID
          uid: String(u.id), // 內部 users.id;另存自訂欄位給 jwt callback 用(自訂欄位不會被覆蓋)
          role: u.role, // 一般為 "user"
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        const email = creds?.email as string | undefined;
        const password = creds?.password as string | undefined;
        if (!email || !password) return null;

        const admin = await prisma.adminUser.findUnique({ where: { email } });
        if (!admin || admin.status !== "active") return null;

        const ok = await bcrypt.compare(password, admin.passwordHash);
        if (!ok) return null;

        prisma.adminUser
          .update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } })
          .catch(() => {});

        return {
          id: admin.id.toString(),
          email: admin.email,
          name: admin.displayName ?? admin.email,
          role: admin.role,
        };
      },
    }),
  ],
});
