# Cordial 기능명세서

## 유저 플로우

### F-01 감정 추천 (`/emotion` → `/recommend`)
- 4단계 카드 선택 질문으로 감정 입력
- 제출 → `POST /api/ai/analyze-emotion` → EmotionVector 반환
- EmotionVector를 sessionStorage에 저장 후 `/recommend`로 이동
- `/recommend`: `POST /api/ai/recommend` 호출 → 칵테일 Top 3 카드
- 로그인 유저: 5-factor 점수 (감정 + 취향 + 주량 + 과거선호 + 인기도)
- 비로그인: 2-factor 점수 (감정 + 인기도)
- 카드 클릭 → `sessionStorage.setItem("selectedCocktail", ...)` → `/cocktail/[id]`

### F-02 칵테일 상세 (`/cocktail/[id]`)
- sessionStorage에서 cocktail 데이터 로드 (페이지 새로고침 시 back으로 복귀)
- Flavor Profile 바 차트 (SOUR / SWEET / BITTER / STRONG / FRESH)
- 기본 제조 방법 5단계 표시
- 글라스 실루엣 자동 선택 (cocktail 이름 기반)
- 웹(라이트 테마) + 모바일(다크 테마) 듀얼 레이아웃

### F-03 내 술장 (`/pantry`)
- 보유 재료 태그 입력/삭제
- `POST /api/ai/pantry-recommend` → 세 섹션 반환:
  - **exact**: 모든 재료 보유 (즉시 제조 가능)
  - **almost**: 1개 재료만 부족
  - **creative**: Claude가 창작한 레시피

### F-04 모의 제조 (`/mix`)
- 재료 추가: 이름 + 용량(ml) + 도수(%)
- 제조 방식 선택: Shaking / Stirring / Build / Blending / Neat
- ABV 알고리즘으로 예상 도수 즉시 계산
- `POST /api/ai/mix-analyze` → Claude가 맛/향 분석 + 바텐더 한마디

### F-05 바 매칭 (`/bars`)
- `GET /api/bars` → Bar 목록 (area/mood 쿼리 파라미터)
- 기분 태그 필터 칩 (actual moodTags에서 동적 생성)
- 지역 드롭다운 필터
- 바 정보: 이름, 주소, 시그니처 칵테일, 분위기 태그

### F-06 로그인 (`/login`)
- Google OAuth 버튼
- GitHub OAuth 버튼
- 이메일/비밀번호 (로그인 / 회원가입 모드 토글)
- 비로그인으로 계속하기 → `/emotion`으로 이동
- 로그인 성공 → 이전 페이지 또는 `/emotion`으로 리다이렉트

---

## AI 기능 상세

### AI-01 감정 분석 (`src/server/ai/analyzeEmotion.ts`)

**입력**: 감정 선택 텍스트  
**출력**: `{ joy, sadness, stress, fatigue, excitement }` (각 0~1)

`getDominantEmotion()` → 헤드라인용 형용사 (기쁜/슬픈/지친/피곤한/설레는)

### AI-02 칵테일 추천 (`src/server/ai/recommendCocktails.ts`)

1. `emotionToVector()`: EmotionVector → 칵테일 맛 벡터 변환
2. 코사인 유사도로 IBA DB 칵테일 전체와 비교
3. 유저 프로필 기반 가중치 점수 계산
4. 상위 3개에 대해 Claude가 맞춤 설명 생성 (`Promise.allSettled`)

### AI-03 재료 매칭 (`src/server/ai/pantryRecommend.ts`)

- IBA DB 전체 칵테일 재료와 case-insensitive 퍼지 매칭
- exact(완전 보유) / almost(1개 부족) / creative(Claude 창작) 분류

### AI-04 모의 제조 분석 (`src/server/ai/mixAnalyze.ts`)

- `calculateAbv()`: 순수 알고리즘 (Claude 불필요)
- `mixAnalyze()`: Claude에 재료+방식 전달 → 맛/향/설명 JSON 반환

---

## 추천 알고리즘 상세

```typescript
// emotionToVector: EmotionVector → 칵테일 맛 벡터
sweetness = joy*0.5 + excitement*0.3 - sadness*0.1
sourness  = excitement*0.4 + stress*0.2 + joy*0.2
bitterness = stress*0.4 + fatigue*0.3 + sadness*0.2
strength   = stress*0.4 + excitement*0.3 + fatigue*0.2
freshness  = joy*0.4 - fatigue*0.2 - stress*0.1 + 0.3

// 코사인 유사도
similarity = dot(target, cocktail) / (|target| × |cocktail|)

// 비로그인 점수
score = (0.4×similarity + 0.1×popularity) / 0.5

// 로그인 점수
score = 0.4×similarity + 0.2×tastePref + 0.15×volumeFit + 0.15×pastPref + 0.1×popularity
```

---

## 데이터 파이프라인 (FastAPI)

`POST /bars/pipeline`: 지역명 입력 → Naver 지역/블로그/이미지 API 수집 → Claude 분석 (moodTags, signature) → Supabase Bar 테이블 저장

실행: `cd backend && uvicorn main:app --reload`
