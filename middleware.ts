import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const ALLOWED_ROLES = ["super_admin", "admin", "editor", "coach", "viewer"];

export default auth((req) => {
  const { pathname, origin } = req.nextUrl;

  const isAdminArea = pathname.startsWith("/admin") && pathname !== "/admin/login";
  if (!isAdminArea) return;

  const isLoggedIn = !!req.auth;
  const role: string | undefined = req.auth?.user?.role;

  if (!isLoggedIn) {
    const url = new URL("/admin/login", origin);
    url.searchParams.set("callbackUrl", pathname);
    return Response.redirect(url);
  }

  if (!role || !ALLOWED_ROLES.includes(role)) {
    return Response.redirect(new URL("/admin/login", origin));
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
