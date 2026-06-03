import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        // 球友走 LINE:Auth.js 會把 user.id 覆蓋成隨機 UUID,改讀 profile 另存的 uid;
        // admin(Credentials)沒有 uid,?? 退回 user.id,行為與原本相同。
        token.uid = (user as { uid?: string }).uid ?? user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.uid as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
