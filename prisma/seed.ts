import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) throw new Error("請設定 ADMIN_EMAIL 與 ADMIN_PASSWORD 環境變數再跑 seed。");
  if (password.length < 12) throw new Error("ADMIN_PASSWORD 太短,請用 12 碼以上。");

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, status: "active", role: "super_admin" },
    create: { email, passwordHash, displayName: "VEKTR Admin", role: "super_admin", status: "active" },
  });

  console.log(`✓ admin 帳號就緒：${admin.email}（role=${admin.role}）`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
