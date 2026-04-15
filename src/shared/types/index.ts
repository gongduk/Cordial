export interface EmotionVector {
  happy: number;
  calm: number;
  excited: number;
  tired: number;
  stressed: number;
}

export interface CocktailVector {
  sweetness: number;
  sourness: number;
  bitterness: number;
  strength: number;
  freshness: number;
}

export interface RecommendedCocktail {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  sweetness: number;
  sourness: number;
  bitterness: number;
  strength: number;
  freshness: number;
  /** AI가 생성한 맞춤형 추천 설명 */
  aiDescription: string;
  /** 코사인 유사도 점수 */
  score: number;
}
