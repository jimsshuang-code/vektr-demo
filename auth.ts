import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/prisma";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
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
