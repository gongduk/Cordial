# Cordial 기능명세서

## 유저(고객) 플로우

### F-U-01 QR 진입
- 고객이 테이블 QR 스캔 → `/qr/[storeId]` 접근
- `storeId` 유효성 검증 (존재하지 않는 가게면 에러 페이지)
- `storeId`를 sessionStorage에 저장 후 감정 입력 페이지로 이동

### F-U-02 감정 입력
- 텍스트 자유 입력 (한국어 구어체)
- 입력 예시 힌트 제공 ("오늘 너무 피곤해", "기분이 좋아서 뭔가 상큼한 거 마시고 싶어")
- 최소 5자 이상 입력 시 제출 가능
- 제출 → `/api/ai/analyze-emotion` 호출 → 로딩 상태 표시

### F-U-03 칵테일 추천 결과
- 추천 칵테일 최대 3개 카드 표시
- 각 카드: 칵테일명, 가격, AI 생성 맞춤 설명, 주문 버튼
- "다시 입력하기" 버튼 (감정 입력 페이지로 복귀)

### F-U-04 주문
- 추천 결과에서 수량 선택 후 주문
- 주문 완료 시 확인 화면 표시 (예상 준비 시간 안내)
- 중복 주문 방지 (주문 완료 후 재주문 버튼 비활성화, 5분 타이머)

---

## 점주 플로우

### F-O-01 로그인
- 이메일 + 비밀번호 로그인
- NextAuth.js credentials provider 사용
- 로그인 성공 시 대시보드로 리다이렉트

### F-O-02 대시보드 (주문 현황)
- 실시간 주문 목록 (Socket.io or Supabase Realtime)
- 주문 상태: 대기중 → 수락 → 완료 / 취소
- 상태 변경 버튼 (수락, 완료, 취소)
- 새 주문 수신 시 알림 (브라우저 알림 or 사운드)

### F-O-03 메뉴 관리
- 칵테일 목록 조회 (가게별)
- 칵테일 추가: 이름, 가격, 설명, 이미지, 속성 벡터 입력
- 칵테일 수정 / 삭제
- 품절 처리 (isAvailable 토글)

### F-O-04 칵테일 속성 벡터 설정
- 점주가 직접 슬라이더로 입력 (sweetness, sourness, bitterness, strength, freshness)
- AI 자동 추론 옵션: 칵테일 이름/설명 입력 시 Claude API가 벡터 자동 생성

---

## AI 기능 상세

### AI-01 감정 분석

**System Prompt**:
```
당신은 사용자의 텍스트에서 현재 감정 상태를 분석하는 전문가입니다.
입력된 텍스트를 분석하여 다음 5가지 감정 차원의 강도를 0과 1 사이의 소수로 표현하세요.
반드시 JSON만 반환하고 다른 텍스트는 포함하지 마세요.

{
  "happy": 0.0~1.0,
  "calm": 0.0~1.0,
  "excited": 0.0~1.0,
  "tired": 0.0~1.0,
  "stressed": 0.0~1.0
}
```

### AI-02 칵테일 추천 설명 생성

**System Prompt**:
```
당신은 바텐더입니다. 고객의 감정 상태와 추천된 칵테일 정보를 바탕으로
고객에게 맞춤형 추천 설명을 2~3문장으로 작성하세요.
따뜻하고 친근한 어조로, 왜 이 칵테일이 지금 고객에게 어울리는지 설명하세요.
한국어로 작성하세요.
```

### AI-03 칵테일 속성 자동 추론

**System Prompt**:
```
칵테일 이름과 설명을 보고 맛 프로파일을 분석하세요.
반드시 JSON만 반환하세요.

{
  "sweetness": 0.0~1.0,
  "sourness": 0.0~1.0,
  "bitterness": 0.0~1.0,
  "strength": 0.0~1.0,
  "freshness": 0.0~1.0
}
```

---

## 추천 알고리즘

감정 벡터 → 칵테일 속성 벡터 변환 규칙:

```typescript
function emotionToCocktailVector(emotion: EmotionVector): CocktailVector {
  return {
    sweetness: emotion.happy * 0.6 + emotion.excited * 0.3 + emotion.stressed * 0.1,
    sourness:  emotion.excited * 0.5 + emotion.happy * 0.3 + emotion.tired * 0.2,
    bitterness: emotion.stressed * 0.4 + emotion.tired * 0.4 + emotion.calm * 0.2,
    strength:  emotion.excited * 0.5 + emotion.stressed * 0.3 + emotion.happy * 0.2,
    freshness: emotion.calm * 0.5 + emotion.happy * 0.3 + emotion.tired * 0.2,
  }
}
```

코사인 유사도로 DB 칵테일과 비교 → 상위 3개 반환