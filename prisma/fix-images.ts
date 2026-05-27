import * as dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL!, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter });

const BASE = "https://www.thecocktaildb.com/api/json/v1/1/search.php?s=";

// 올바른 검색어 매핑
const SEARCH_MAP: Record<string, string[]> = {
  "라모스 피즈":       ["Ramos Fizz", "Ramos gin fizz"],
  "갓파더":           ["Godfather"],
  "갓마더":           ["Godmother"],
  "호스 넥":          ["Horse's Neck", "Horses Neck"],
  "비-52":            ["B-52", "B52", "B 52"],
  "다크 앤 스토미":   ["Dark and Stormy", "Dark N Stormy"],
  "레몬 드롭 마티니": ["Lemon Drop Martini", "Lemon Drop"],
  "토미스 마르가리타":["Tommy's Margarita", "Tommys Margarita"],
};

// Cocktail DB에서 못 찾을 경우 Wikimedia 공개 이미지 사용
const FALLBACK_MAP: Record<string, string> = {
  "라모스 피즈":       "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Ramos_gin_fizz.jpg/800px-Ramos_gin_fizz.jpg",
  "갓파더":           "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Godfather_cocktail.jpg/800px-Godfather_cocktail.jpg",
  "갓마더":           "https://www.thecocktaildb.com/images/media/drink/qyyvtu1468878544.jpg",
  "호스 넥":          "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Horses_neck_cocktail.jpg/800px-Horses_neck_cocktail.jpg",
  "비-52":            "https://www.thecocktaildb.com/images/media/drink/tqpvqp1472668328.jpg",
  "다크 앤 스토미":   "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Dark_%27N%27_Stormy_cocktail.jpg/800px-Dark_%27N%27_Stormy_cocktail.jpg",
  "레몬 드롭 마티니": "https://www.thecocktaildb.com/images/media/drink/3nbu4a1487603196.jpg",
  "토미스 마르가리타":"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Tommy%27s_margarita.jpg/800px-Tommy%27s_margarita.jpg",
};

interface CocktailDBResponse {
  drinks: { strDrinkThumb: string }[] | null;
}

async function fetchFromCocktailDB(name: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}${encodeURIComponent(name)}`);
    const data = await res.json() as CocktailDBResponse;
    return data.drinks?.[0]?.strDrinkThumb ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const missing = await prisma.cocktail.findMany({
    where: { imageUrl: null },
    select: { id: true, name: true },
  });

  console.log(`🔍 ${missing.length}개 이미지 보완 중...\n`);

  for (const c of missing) {
    const searches = SEARCH_MAP[c.name] ?? [];
    let imageUrl: string | null = null;

    // 1. Cocktail DB 검색
    for (const term of searches) {
      imageUrl = await fetchFromCocktailDB(term);
      if (imageUrl) {
        console.log(`✅ ${c.name} → CocktailDB (${term})`);
        break;
      }
      await new Promise(r => setTimeout(r, 150));
    }

    // 2. Cocktail DB 실패 시 fallback
    if (!imageUrl) {
      imageUrl = FALLBACK_MAP[c.name] ?? null;
      if (imageUrl) console.log(`🔄 ${c.name} → Wikimedia fallback`);
      else console.log(`❌ ${c.name} — 이미지 없음`);
    }

    if (imageUrl) {
      await prisma.cocktail.update({ where: { id: c.id }, data: { imageUrl } });
    }
  }

  console.log("\n🎉 완료!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
