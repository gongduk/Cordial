import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL!,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

const BASE_URL = "https://www.thecocktaildb.com/api/json/v1/1/search.php?s=";

interface CocktailDBDrink {
  strDrink: string;
  strDrinkThumb: string;
}

interface CocktailDBResponse {
  drinks: CocktailDBDrink[] | null;
}

async function fetchImage(nameEn: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}${encodeURIComponent(nameEn)}`);
    const data = await res.json() as CocktailDBResponse;
    if (!data.drinks || data.drinks.length === 0) return null;
    return data.drinks[0].strDrinkThumb ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const cocktails = await prisma.cocktail.findMany({
    select: { id: true, name: true, nameEn: true, imageUrl: true },
  });

  console.log(`🔍 ${cocktails.length}개 칵테일 이미지 검색 중...\n`);

  let found = 0, notFound = 0;

  for (const c of cocktails) {
    if (c.imageUrl) {
      console.log(`⏭  ${c.name} — 이미 있음`);
      continue;
    }

    const searchName = c.nameEn ?? c.name;
    const imageUrl = await fetchImage(searchName);

    if (imageUrl) {
      await prisma.cocktail.update({ where: { id: c.id }, data: { imageUrl } });
      console.log(`✅ ${c.name} → ${imageUrl}`);
      found++;
    } else {
      console.log(`❌ ${c.name} — 못 찾음`);
      notFound++;
    }

    // API rate limit 방지
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n🎉 완료: ${found}개 성공, ${notFound}개 실패`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
