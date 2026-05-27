import * as dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL!, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter });
async function main() {
  const missing = await prisma.cocktail.findMany({ where: { imageUrl: null }, select: { name: true, nameEn: true } });
  console.log(JSON.stringify(missing, null, 2));
}
main().finally(() => prisma.$disconnect());
