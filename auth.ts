import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import LINE from "next-auth/providers/line";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/prisma";
import { pool } from "@/app/lib/db";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
