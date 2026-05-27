export interface EmotionVector {
  joy: number;
  sadness: number;
  stress: number;
  fatigue: number;
  excitement: number;
}

export interface CocktailVector {
  sweetness: number;
  sourness: number;
  bitterness: number;
  strength: number;
  freshness: number;
}

export interface UserFlavorProfile extends CocktailVector {}

export interface RecommendedCocktail {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  glassType: string | null;
  abv: number;
  imageUrl: string | null;
  sweetness: number;
  sourness: number;
  bitterness: number;
  strength: number;
  freshness: number;
  popularity: number;
  aiDescription: string;
  score: number;
}

export interface MixIngredient {
  name: string;
  amount: number;
  abv: number;
}

export type MixMethod = "shaking" | "stirring" | "build" | "blending" | "neat" | "floating";

export interface MixAnalysisResult {
  calculatedAbv: number;
  taste: CocktailVector;
  aroma: string;
  description: string;
  name: string;
}

export interface BarData {
  id: string;
  name: string;
  address: string;
  area: string | null;
  moodTags: string[];
  signature: string | null;
  imageUrl: string | null;
  description: string | null;
}

export type DrinkingCapacity = "LOW" | "MEDIUM" | "HIGH";
