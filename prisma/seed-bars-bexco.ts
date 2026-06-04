import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// 벡스코(BEXCO) 주변 칵테일 바 시드 데이터
// 위치: 부산광역시 해운대구 APEC로 55 (위도 35.1694, 경도 129.1357)

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const BEXCO_BARS = [
  {
    name: "Bar Haebar",
    address: "부산 해운대구 중동 1로 55",
    area: "해운대",
    latitude: 35.1588,
    longitude: 129.1603,
    moodTags: ["클래식", "조용한"],
    purposeTags: ["혼술", "데이트"],
    signature: "Old Fashioned",
    description: "해운대 바닷바람과 클래식 칵테일",
    rating: 4.5,
    priceLevel: 3,
    reviewCount: 84,
    placeId: "seed_haebar_001",
  },
  {
    name: "Moonrise Bar",
    address: "부산 해운대구 해운대해변로 298",
    area: "해운대",
    latitude: 35.1584,
    longitude: 129.1601,
    moodTags: ["로맨틱", "활기찬"],
    purposeTags: ["데이트", "친구모임"],
    signature: "Moonrise Spritz",
    description: "바다 뷰와 함께하는 로맨틱 칵테일",
    rating: 4.7,
    priceLevel: 3,
    reviewCount: 132,
    placeId: "seed_moonrise_002",
  },
  {
    name: "The Trunk",
    address: "부산 해운대구 달맞이길 30",
    area: "달맞이",
    latitude: 35.1629,
    longitude: 129.1748,
    moodTags: ["힙한", "활기찬"],
    purposeTags: ["친구모임", "혼술"],
    signature: "Negroni Sbagliato",
    description: "달맞이 힙스터 바. 바이닐 레코드가 돌아가는 곳",
    rating: 4.4,
    priceLevel: 2,
    reviewCount: 67,
    placeId: "seed_trunk_003",
  },
  {
    name: "Speakeasy 1926",
    address: "부산 해운대구 구남로 21번길 7",
    area: "해운대",
    latitude: 35.1602,
    longitude: 129.1622,
    moodTags: ["클래식", "조용한"],
    purposeTags: ["비즈니스", "데이트"],
    signature: "Whiskey Sour",
    description: "숨겨진 입구, 금주법 시대 감성",
    rating: 4.6,
    priceLevel: 3,
    reviewCount: 55,
    placeId: "seed_speakeasy_004",
  },
  {
    name: "Bar Ciel",
    address: "부산 해운대구 마린시티 2로 33",
    area: "마린시티",
    latitude: 35.1541,
    longitude: 129.1568,
    moodTags: ["로맨틱", "클래식"],
    purposeTags: ["데이트", "비즈니스"],
    signature: "French 75",
    description: "마린시티 야경을 품은 루프톱 바",
    rating: 4.8,
    priceLevel: 4,
    reviewCount: 201,
    placeId: "seed_ciel_005",
  },
  {
    name: "Highball Society",
    address: "부산 해운대구 중동 2로 11",
    area: "해운대",
    latitude: 35.1612,
    longitude: 129.1637,
    moodTags: ["활기찬", "힙한"],
    purposeTags: ["친구모임", "혼술"],
    signature: "Yuzu Highball",
    description: "위스키 하이볼 전문. 소란스럽고 즐거운",
    rating: 4.3,
    priceLevel: 2,
    reviewCount: 98,
    placeId: "seed_highball_006",
  },
  {
    name: "Amber Room",
    address: "부산 수영구 광안해변로 219",
    area: "광안리",
    latitude: 35.1531,
    longitude: 129.1187,
    moodTags: ["조용한", "로맨틱"],
    purposeTags: ["데이트", "혼술"],
    signature: "Amber Negroni",
    description: "광안대교 야경이 보이는 바",
    rating: 4.5,
    priceLevel: 3,
    reviewCount: 76,
    placeId: "seed_amber_007",
  },
  {
    name: "Wave Craft",
    address: "부산 해운대구 해운대로 772",
    area: "해운대",
    latitude: 35.1598,
    longitude: 129.1589,
    moodTags: ["힙한", "활기찬"],
    purposeTags: ["친구모임", "비즈니스"],
    signature: "Craft Sour",
    description: "크래프트 스피리츠 전문. 개성 있는 칵테일",
    rating: 4.4,
    priceLevel: 2,
    reviewCount: 43,
    placeId: "seed_wave_008",
  },
];

async function main() {
  console.log("벡스코 주변 바 시드 시작...");

  for (const bar of BEXCO_BARS) {
    await prisma.bar.upsert({
      where: { placeId: bar.placeId },
      update: bar,
      create: { ...bar, analyzedAt: new Date() },
    });
    console.log(`✓ ${bar.name}`);
  }

  console.log(`\n총 ${BEXCO_BARS.length}개 바 시드 완료`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
