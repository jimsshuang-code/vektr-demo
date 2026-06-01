import { auth } from "@/auth";

export type Role = "super_admin" | "admin" | "editor" | "coach" | "viewer";

const WRITE_MATRIX: Record<string, Role[]> = {
  courts: ["super_admin", "admin", "editor"],
  members: ["super_admin", "admin"],
  products: ["super_admin", "admin", "editor"],
  content: ["super_admin", "admin", "editor"],
  permissions: ["super_admin"],
};

export function canWrite(role: Role | undefined, moduleName: string): boolean {
  if (!role) return false;
  const allowed = WRITE_MATRIX[moduleName] ?? ["super_admin"];
  return allowed.includes(role);
}

type GuardResult =
  | { ok: true; adminId: bigint; role: Role; email: string }
  | { ok: false; status: 401 | 403 };

export async function requireAdmin(
  moduleName: string,
  opts: { write?: boolean } = {}
): Promise<GuardResult> {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const idStr = session?.user?.id as string | undefined;
  const email = session?.user?.email ?? "";

  if (!role || !idStr) return { ok: false, status: 401 };
  if (opts.write && !canWrite(role, moduleName)) return { ok: false, status: 403 };

  return { ok: true, adminId: BigInt(idStr), role, email };
}
