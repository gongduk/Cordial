import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 설정: schema 경로만 지정 (어댑터는 PrismaClient 생성 시 직접 주입)
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
});
