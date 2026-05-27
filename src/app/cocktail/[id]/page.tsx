"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassSilhouette } from "@/shared/ui/GlassSilhouette";
import { WebNav } from "@/shared/ui/WebNav";
import type { GlassType } from "@/shared/ui/GlassSilhouette";
import type { RecommendedCocktail } from "@/shared/types";

const W = {
  accent: "#B88752",
  bg: "#FCFBF9",
  surface: "#FFFFFF",
  border: "rgba(40,30,20,0.08)",
  borderStrong: "rgba(40,30,20,0.16)",
  text: "#1A1612",
  textMuted: "rgba(26,22,18,0.62)",
  textFaint: "rgba(26,22,18,0.38)",
  sans: '"Pretendard Variable","Pretendard",-apple-system,BlinkMacSystemFont,sans-serif',
  mono: '"JetBrains Mono",ui-monospace,"SF Mono",Menlo,monospace',
} as const;

const T = {
  accent: "#B88752",
  darkBg: "#15110D",
  darkSurface: "#1C1814",
  darkBorder: "rgba(255,246,232,0.08)",
  darkBorderStrong: "rgba(255,246,232,0.14)",
  darkText: "#F5EFE6",
  darkTextMuted: "rgba(245,239,230,0.62)",
  darkTextFaint: "rgba(245,239,230,0.38)",
  sans: '"Pretendard Variable","Pretendard",-apple-system,BlinkMacSystemFont,sans-serif',
  mono: '"JetBrains Mono",ui-monospace,"SF Mono",Menlo,monospace',
} as const;

interface IngredientItem {
  name: string;
  nameEn: string | null;
  amount: string | null;
}

type MixMethod = "shaking" | "stirring" | "build" | "blending" | "neat";

function formatAmount(amount: string | null): string {
  if (!amount) return "적당량";
  const match = amount.match(/^([\d.]+)cl$/);
  if (match) {
    const ml = Math.round(parseFloat(match[1]) * 10);
    return `${ml}ml`;
  }
  return amount;
}

function buildMethodSteps(method: string | null, ingredients: IngredientItem[]): string[] {
  const m = (method ?? "shaking") as MixMethod;
  const ingList = ingredients
    .filter(i => i.amount && i.amount !== "적당량")
    .map(i => `${i.name} ${formatAmount(i.amount)}`)
    .join(", ");
  const garnishes = ingredients
    .filter(i => !i.amount || i.amount === "적당량")
    .map(i => i.name);

  const garnishStep = garnishes.length > 0
    ? `${garnishes.join(", ")}으로 마무리하고 천천히 음미해요.`
    : "잔을 들고 천천히 향을 느끼며 음미해요.";

  switch (m) {
    case "shaking":
      return [
        `셰이커에 ${ingList}을(를) 넣어요.`,
        "얼음 없이 10초간 드라이 셰이크해요.",
        "큰 얼음을 채우고 다시 15초 세게 셰이크해요.",
        "차갑게 칠링한 잔에 더블 스트레이너로 걸러 따라요.",
        garnishStep,
      ];
    case "stirring":
      return [
        "믹싱 글라스에 큰 얼음을 채워요.",
        `${ingList}을(를) 순서대로 투입해요.`,
        "바 스푼으로 30초간 부드럽게 스터해요.",
        "칠링한 잔에 스트레이너로 걸러 따라요.",
        garnishStep,
      ];
    case "build":
      return [
        "잔에 큰 얼음을 가득 채워요.",
        `도수가 높은 술부터 순서대로 넣어요: ${ingList}.`,
        "바 스푼으로 가볍게 2~3회 스터해요.",
        garnishStep,
        "빨대와 함께 바로 서빙해요.",
      ];
    case "blending":
      return [
        `블렌더에 ${ingList}과(와) 얼음 한 컵을 넣어요.`,
        "고속으로 20~30초 블렌드해요.",
        "부드러운 질감이 될 때까지 필요하면 반복해요.",
        "차가운 잔에 천천히 따라요.",
        garnishStep,
      ];
    case "neat":
      return [
        "잔을 미리 냉동실에서 칠링해요.",
        `${ingList}을(를) 계량해요.`,
        "칠링된 잔에 바로 따라요.",
        "얼음 없이 그대로 즐겨요.",
        garnishStep,
      ];
    default:
      return [
        `재료를 준비해요: ${ingList}.`,
        "잔과 도구를 준비해요.",
        "레시피대로 재료를 계량해요.",
        "잘 섞어서 잔에 따라요.",
        garnishStep,
      ];
  }
}

function toBarValue(val: number) { return Math.round(val * 5); }

function pickGlass(name: string): GlassType {
  const n = name.toLowerCase();
  if (n.includes("martini") || n.includes("aviation") || n.includes("gimlet")) return "martini";
  if (n.includes("coupe") || n.includes("sidecar") || n.includes("negroni")) return "coupe";
  if (n.includes("highball") || n.includes("mojito") || n.includes("collins")) return "highball";
  if (n.includes("flute") || n.includes("champagne")) return "flute";
  return "rocks";
}

export default function CocktailDetailPage() {
  const router = useRouter();
  const [cocktail, setCocktail] = useState<RecommendedCocktail | null>(null);
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [method, setMethod] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const sel = typeof window !== "undefined" ? sessionStorage.getItem("selectedCocktail") : null;
    if (!sel) { router.back(); return; }
    const c = JSON.parse(sel) as RecommendedCocktail;
    setCocktail(c);

    // Fetch full detail with ingredients
    if (c.id && c.id !== "creative") {
      fetch(`/api/cocktails/${c.id}`)
        .then(r => r.json())
        .then((data: { ingredients?: { ingredient: { name: string; nameEn: string | null }; amount: string | null }[]; method?: string; imageUrl?: string | null }) => {
          if (data.ingredients) {
            setIngredients(data.ingredients.map(ci => ({
              name: ci.ingredient.name,
              nameEn: ci.ingredient.nameEn,
              amount: ci.amount,
            })));
          }
          if (data.method) setMethod(data.method);
          if (data.imageUrl) setImageUrl(data.imageUrl);
        })
        .catch(() => {});
    }
  }, [router]);

  if (!cocktail) {
    return (
      <>
        <div className="cordial-web" style={{ background: W.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: W.textMuted, fontFamily: W.sans }}>로딩 중...</div>
        </div>
        <div className="cordial-mob">
          <div style={{ background: T.darkBg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ color: T.darkTextMuted, fontFamily: T.sans }}>로딩 중...</div>
          </div>
        </div>
      </>
    );
  }

  const glassType = pickGlass(cocktail.name);
  const profile = [
    ["SOUR", toBarValue(cocktail.sourness)],
    ["SWEET", toBarValue(cocktail.sweetness)],
    ["BITTER", toBarValue(cocktail.bitterness)],
    ["STRONG", toBarValue(cocktail.strength)],
    ["FRESH", toBarValue(cocktail.freshness)],
  ] as const;

  const methodSteps = buildMethodSteps(method, ingredients);

  return (
    <>
      {/* ── WEB ── */}
      <div className="cordial-web" style={{ background: W.bg, minHeight: "100vh", color: W.text, fontFamily: W.sans }}>
        <WebNav />
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 40px 60px" }}>
          <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: W.textMuted, fontFamily: W.sans, marginBottom: 40, padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M12 4 L6 10 L12 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            추천 결과로
          </button>

          <div style={{ display: "flex", gap: 64 }}>
            <div style={{ flex: "0 0 300px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              {imageUrl ? (
                <img src={imageUrl} alt={cocktail.name} style={{ width: 220, height: 220, objectFit: "cover", borderRadius: 14, border: `1px solid ${W.border}` }} />
              ) : (
                <GlassSilhouette type={glassType} size={200} stroke={W.accent} liquid={W.accent} fillLevel={0.78} garnish strokeWidth={1.2} />
              )}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: W.mono, fontSize: 10, letterSpacing: 1.4, color: W.accent, marginBottom: 8, textTransform: "uppercase" }}>{cocktail.category ?? "Classic"}</div>
                <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.6, margin: "0 0 10px", lineHeight: 1.1 }}>{cocktail.name}</h1>
                <div style={{ fontSize: 14, color: W.textMuted, fontFamily: W.mono }}>ABV {Math.round(cocktail.abv)}%</div>
              </div>

              {/* Ingredients */}
              {ingredients.length > 0 && (
                <div style={{ width: "100%", marginTop: 8 }}>
                  <div style={{ fontFamily: W.mono, fontSize: 10, letterSpacing: 1.6, color: W.textFaint, marginBottom: 12, textTransform: "uppercase" }}>Ingredients</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {ingredients.map((ing, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `0.5px solid ${W.border}` }}>
                        <span style={{ fontSize: 13, color: W.text, fontWeight: 500 }}>{ing.name}</span>
                        <span style={{ fontFamily: W.mono, fontSize: 11, color: W.accent }}>{formatAmount(ing.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ padding: "18px 20px", borderLeft: `2px solid ${W.accent}`, marginBottom: 32 }}>
                <div style={{ fontFamily: W.mono, fontSize: 9, letterSpacing: 1.4, color: W.accent, marginBottom: 8, textTransform: "uppercase" }}>BARTENDER&apos;S NOTE</div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, letterSpacing: -0.2, color: W.textMuted }}>{cocktail.aiDescription}</p>
              </div>

              <div style={{ fontFamily: W.mono, fontSize: 10, letterSpacing: 1.6, color: W.textFaint, marginBottom: 14, textTransform: "uppercase" }}>FLAVOR PROFILE</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 32px", marginBottom: 36 }}>
                {profile.map(([label, val]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ width: 52, fontFamily: W.mono, fontSize: 10, color: W.textMuted, letterSpacing: 1.2, textTransform: "uppercase" }}>{label}</span>
                    <div style={{ flex: 1, display: "flex", gap: 4 }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <div key={n} style={{ flex: 1, height: 6, borderRadius: 1, background: n <= val ? W.accent : W.border }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ fontFamily: W.mono, fontSize: 10, letterSpacing: 1.6, color: W.textFaint, marginBottom: 16, textTransform: "uppercase" }}>
                METHOD — {method ? method.toUpperCase() : "SHAKING"}
              </div>
              {methodSteps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 18, padding: "12px 0", borderBottom: `0.5px solid ${W.border}` }}>
                  <span style={{ fontFamily: W.mono, fontSize: 11, color: W.accent, letterSpacing: 0.4, minWidth: 20 }}>0{i + 1}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.6, color: W.text, letterSpacing: -0.2 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="cordial-mob">
        <div style={{ width: "100%", minHeight: "100vh", background: T.darkBg, color: T.darkText, fontFamily: T.sans, maxWidth: 430, margin: "0 auto", paddingBottom: 28, overflowY: "auto" }}>
          <div style={{ paddingTop: 62, paddingBottom: 16, paddingLeft: 20, paddingRight: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 4 L6 10 L12 16" stroke={T.darkText} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>

          <div style={{ padding: "8px 24px 24px", display: "flex", alignItems: "center", gap: 20 }}>
            {imageUrl ? (
              <img src={imageUrl} alt={cocktail.name} style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 12, flexShrink: 0 }} />
            ) : (
              <GlassSilhouette type={glassType} size={120} stroke={T.accent} liquid={T.accent} fillLevel={0.78} garnish strokeWidth={1.2} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, color: T.accent, marginBottom: 8 }}>{cocktail.category ?? "CLASSIC"}</div>
              <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.6, margin: 0, lineHeight: 1.1 }}>{cocktail.name}</h1>
              <div style={{ marginTop: 8, fontFamily: T.mono, fontSize: 11, color: T.darkTextMuted }}>ABV {Math.round(cocktail.abv)}%</div>
            </div>
          </div>

          <div style={{ padding: "0 24px 24px" }}>
            <div style={{ padding: "16px 18px", borderLeft: `2px solid ${T.accent}` }}>
              <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: 1.4, color: T.accent, marginBottom: 8, textTransform: "uppercase" }}>BARTENDER&apos;S NOTE</div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, letterSpacing: -0.2, color: T.darkTextMuted }}>{cocktail.aiDescription}</p>
            </div>
          </div>

          {/* Ingredients Mobile */}
          {ingredients.length > 0 && (
            <div style={{ padding: "0 24px 24px" }}>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.6, color: T.darkTextFaint, marginBottom: 14, textTransform: "uppercase" }}>Ingredients</div>
              {ingredients.map((ing, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `0.5px solid ${T.darkBorder}` }}>
                  <span style={{ fontSize: 14, color: T.darkText }}>{ing.name}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 12, color: T.accent }}>{formatAmount(ing.amount)}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: "0 24px 24px" }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.6, color: T.darkTextFaint, marginBottom: 16, textTransform: "uppercase" }}>FLAVOR PROFILE</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {profile.map(([label, val]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ width: 60, fontFamily: T.mono, fontSize: 10, color: T.darkTextMuted, letterSpacing: 1.2, textTransform: "uppercase" }}>{label}</span>
                  <div style={{ flex: 1, display: "flex", gap: 4 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <div key={n} style={{ flex: 1, height: 6, borderRadius: 1, background: n <= val ? T.accent : T.darkBorder }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: "8px 24px 24px" }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.6, color: T.darkTextFaint, marginBottom: 16, textTransform: "uppercase" }}>
              METHOD — {method ? method.toUpperCase() : "SHAKING"}
            </div>
            {methodSteps.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 16, padding: "10px 0", borderBottom: `0.5px solid ${T.darkBorder}` }}>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.accent, letterSpacing: 0.4, minWidth: 16 }}>0{i + 1}</span>
                <span style={{ fontSize: 14, lineHeight: 1.6, color: T.darkText, letterSpacing: -0.2 }}>{step}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: "8px 24px 12px" }}>
            <button onClick={() => router.back()} style={{ fontSize: 13, color: T.darkTextFaint, background: "none", border: "none", cursor: "pointer", fontFamily: T.sans, letterSpacing: -0.1 }}>← 추천 결과로</button>
          </div>
        </div>
      </div>
    </>
  );
}
