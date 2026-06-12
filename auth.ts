import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import LINE from "next-auth/providers/line";
import Apple from "next-auth/providers/apple";
import Google from "next-auth/providers/google";
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
    // login-time 停權守衛(§6 決策 2)。擋所有球友 provider;admin(credentials)不在 users 表,略過。
    async signIn({ user, account }) {
      const p = account?.provider;
      if (p !== "line" && p !== "apple" && p !== "google" && p !== "user-login") return true;
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
    // 球友:Email + 密碼登入(id 與 admin 的 "credentials" 區隔)。
    // 查 users 表的密碼帳號,bcrypt 驗證;回 uid 供 jwt/session callback 烤進 session.user.id。
    Credentials({
      id: "user-login",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        const email = String(creds?.email ?? "").trim().toLowerCase();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;
        const { rows } = await pool.query(
          "SELECT id, role, password_hash FROM find_user_for_login($1)",
          [email]
        );
        const u = rows[0];
        if (!u?.password_hash) return null;
        const ok = await bcrypt.compare(password, u.password_hash);
        if (!ok) return null;
        return {
          id: String(u.id),
          uid: String(u.id),
          role: u.role,
          email,
        };
      },
    }),
    // 球友:Google 登入(Gmail)。僅在設定 AUTH_GOOGLE_ID 後啟用。
    ...(process.env.AUTH_GOOGLE_ID
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            async profile(profile: {
              sub: string;
              name?: string;
              email?: string;
              picture?: string;
            }) {
              const { rows } = await pool.query(
                "SELECT id, role FROM upsert_google_user($1, $2, $3, $4)",
                [
                  profile.sub,
                  profile.name ?? null,
                  profile.email ?? null,
                  profile.picture ?? null,
                ]
              );
              const u = rows[0];
              return {
                id: String(u.id),
                uid: String(u.id),
                role: u.role,
                name: profile.name ?? "Google 球友",
                email: profile.email,
                image: profile.picture,
              };
            },
          }),
        ]
      : []),
    // Sign in with Apple(iOS App Store 條款 4.8 必須)。僅在設定 AUTH_APPLE_ID 後啟用。
    ...(process.env.AUTH_APPLE_ID
      ? [
          Apple({
            clientId: process.env.AUTH_APPLE_ID,
            clientSecret: process.env.AUTH_APPLE_SECRET,
            async profile(profile: { sub: string; email?: string; name?: string }) {
              const { rows } = await pool.query(
                "SELECT id, role FROM upsert_apple_user($1, $2, $3)",
                [profile.sub, profile.name ?? null, profile.email ?? null]
              );
              const u = rows[0];
              return {
                id: String(u.id),
                uid: String(u.id),
                role: u.role,
                name: profile.name ?? "Apple 球友",
                email: profile.email,
              };
            },
          }),
        ]
      : []),
  ],
});
