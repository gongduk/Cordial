# Cordial - AI 칵테일 추천 시스템

## 프로젝트 개요

바(Bar) 고객이 QR코드를 스캔 → 감정 상태 입력 → AI가 칵테일 추천
점주는 대시보드에서 메뉴 관리 및 주문 처리

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **DB**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Realtime**: Socket.io
- **AI**: Anthropic Claude API (`claude-sonnet-4-20250514`)
- **Color Palette**: Teal/Mint 계열

## 디렉토리 구조

FSD(Feature-Sliced Design) 아키텍처 적용

```
src/
├── app/                      # Next.js App Router
│   ├── (user)/               # 유저(고객) 라우트 그룹
│   │   ├── qr/[storeId]/     # QR 진입점
│   │   ├── emotion/          # 감정 입력
│   │   ├── recommend/        # 추천 결과
│   │   └── order/            # 주문
│   ├── (owner)/              # 점주 라우트 그룹
│   │   ├── dashboard/        # 대시보드
│   │   ├── menu/             # 메뉴 관리
│   │   └── orders/           # 주문 관리
│   └── api/                  # API Routes
├── features/                 # FSD features layer
│   ├── emotion-input/
│   ├── cocktail-recommend/
│   ├── order/
│   └── menu-manage/
├── entities/                 # FSD entities layer
│   ├── cocktail/
│   ├── order/
│   └── store/
├── shared/                   # 공통 모듈
│   ├── ui/
│   ├── lib/
│   └── types/
└── server/                   # 서버 사이드
    ├── ai/                   # Claude API 연동
    └── socket/               # Socket.io
```

## DB 스키마 (Prisma)

```prisma
model Store {
  id        String   @id @default(cuid())
  name      String
  ownerId   String
  createdAt DateTime @default(now())
  owner     User     @relation(fields: [ownerId], references: [id])
  cocktails Cocktail[]
  orders    Order[]
}

model Cocktail {
  id          String   @id @default(cuid())
  storeId     String
  name        String
  description String?
  price       Int
  imageUrl    String?
  isAvailable Boolean  @default(true)
  // 칵테일 속성 벡터 (AI 매칭용)
  sweetness   Float    @default(0)  // 0~1
  sourness    Float    @default(0)
  bitterness  Float    @default(0)
  strength    Float    @default(0)
  freshness   Float    @default(0)
  store       Store    @relation(fields: [storeId], references: [id])
  orders      OrderItem[]
}

model Order {
  id        String      @id @default(cuid())
  storeId   String
  tableNum  Int?
  status    OrderStatus @default(PENDING)
  createdAt DateTime    @default(now())
  store     Store       @relation(fields: [storeId], references: [id])
  items     OrderItem[]
}

model OrderItem {
  id         String   @id @default(cuid())
  orderId    String
  cocktailId String
  quantity   Int      @default(1)
  order      Order    @relation(fields: [orderId], references: [id])
  cocktail   Cocktail @relation(fields: [cocktailId], references: [id])
}

model User {
  id       String  @id @default(cuid())
  email    String  @unique
  password String
  role     Role    @default(OWNER)
  stores   Store[]
}

enum OrderStatus {
  PENDING
  ACCEPTED
  DONE
  CANCELLED
}

enum Role {
  OWNER
  ADMIN
}
```

## AI 기능 명세

### 1. 감정 분석 → 5차원 벡터 추출

**입력**: 고객이 입력한 자유 텍스트 (한국어 구어체)  
**출력**: `{ happy, calm, excited, tired, stressed }` (각 0~1)

```typescript
// src/server/ai/analyzeEmotion.ts
// Claude API 호출 → JSON 응답 파싱
```

### 2. 감정 벡터 → 칵테일 속성 추론

감정 벡터를 칵테일 속성 벡터(sweetness, sourness, bitterness, strength, freshness)로 변환  
DB의 칵테일들과 코사인 유사도 계산 → 상위 3개 추천

### 3. 추천 칵테일 설명 생성

추천된 칵테일에 대해 고객 감정 맞춤형 설명 생성 (2~3문장)

## 주요 API Routes

```
POST /api/ai/analyze-emotion     # 감정 텍스트 → 벡터
POST /api/ai/recommend           # 벡터 → 칵테일 추천 + 설명
POST /api/orders                 # 주문 생성
GET  /api/orders/[storeId]       # 점주용 주문 목록
PATCH /api/orders/[id]/status    # 주문 상태 변경
GET  /api/cocktails/[storeId]    # 가게 칵테일 목록
POST /api/cocktails              # 칵테일 등록 (점주)
PATCH /api/cocktails/[id]        # 칵테일 수정 (점주)
```

## 환경변수

```env
DATABASE_URL=
DIRECT_URL=
ANTHROPIC_API_KEY=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

## 개발 컨벤션

- 컴포넌트: PascalCase, `*.tsx`
- 훅: `use`로 시작, `*.ts`
- 서버 액션 / API: camelCase
- Tailwind 클래스 정렬: `prettier-plugin-tailwindcss` 사용
- import 순서: 외부 라이브러리 → 내부 절대경로(`@/`) → 상대경로
- 타입은 `interface` 우선, 유니온/조건부는 `type`
- `any` 금지, `unknown` + 타입가드 사용
- Claude API 호출은 반드시 `src/server/ai/` 하위에서만

## 작업 시 주의사항

- Supabase Realtime은 주문 상태 변경 시 점주 대시보드에 실시간 반영에 사용
- QR 진입 시 `storeId`를 URL 파라미터로 받아 세션에 저장, 이후 주문까지 유지
- 칵테일 추천은 해당 가게(`storeId`)의 메뉴 내에서만 수행
- AI 응답은 항상 JSON 파싱 실패에 대한 fallback 처리 필수