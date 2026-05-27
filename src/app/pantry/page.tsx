"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GlassSilhouette, GlassGlyph } from "@/shared/ui/GlassSilhouette";
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

const TABS = [
  { id: "home" as const, label: "홈", glass: "martini" as GlassType, href: "/home" },
  { id: "pantry" as const, label: "내 술장", glass: "rocks" as GlassType, href: "/pantry" },
  { id: "mix" as const, label: "모의 제조", glass: "highball" as GlassType, href: "/mix" },
  { id: "bars" as const, label: "바", glass: "coupe" as GlassType, href: "/bars" },
] as const;

interface PantryResult {
  exact: Array<{ cocktail: RecommendedCocktail & { abv: number }; missingIngredients: string[]; matchRatio: number }>;
  almost: Array<{ cocktail: RecommendedCocktail & { abv: number }; missingIngredients: string[]; matchRatio: number }>;
  creative: RecommendedCocktail | null;
}

function pickGlass(name: string): GlassType {
  const n = name.toLowerCase();
  if (n.includes("martini") || n.includes("gimlet")) return "martini";
  if (n.includes("coupe") || n.includes("negroni") || n.includes("sidecar")) return "coupe";
  if (n.includes("highball") || n.includes("collins") || n.includes("mule")) return "highball";
  return "rocks";
}

export default function PantryPage() {
  const [owned, setOwned] = useState<string[]>(["버번 위스키", "진", "캄파리", "베르무트", "레몬", "심플 시럽"]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PantryResult | null>(null);

  async function fetchMatches(ingredients: string[]) {
    if (ingredients.length === 0) { setResult(null); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/ai/pantry-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients }),
      });
      const data = await res.json() as PantryResult;
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchMatches(owned); }, []);

  function addItem() {
    const name = prompt("추가할 재료를 입력하세요");
    if (!name?.trim()) return;
    const next = [...owned, name.trim()];
    setOwned(next);
    fetchMatches(next);
  }

  function removeItem(name: string) {
    const next = owned.filter((i) => i !== name);
    setOwned(next);
    fetchMatches(next);
  }

  const exactCount = result?.exact.length ?? 0;

  return (
    <>
      {/* ── WEB ── */}
      <div className="cordial-web" style={{ background: W.bg, minHeight: "100vh", color: W.text, fontFamily: W.sans }}>
        <WebNav active="/pantry" />
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 40px" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontFamily: W.mono, fontSize: 10, letterSpacing: 1.8, color: W.accent, marginBottom: 14, textTransform: "uppercase" }}>My Pantry</div>
            <h1 style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1, lineHeight: 1.1, margin: "0 0 14px" }}>가진 재료로<br />만들 수 있는 한 잔.</h1>
            <p style={{ fontSize: 15, color: W.textMuted, margin: 0 }}>
              {owned.length}가지 재료로 {loading ? "확인 중..." : `${exactCount}잔이 가능해요.`}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 48 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontFamily: W.mono, fontSize: 10, letterSpacing: 1.6, color: W.textFaint, textTransform: "uppercase" }}>YOUR INVENTORY · {owned.length}</div>
                <button onClick={addItem} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: W.accent, fontFamily: W.sans }}>+ 추가</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {owned.map((item) => (
                  <div key={item} style={{ padding: "8px 10px 8px 14px", borderRadius: 100, background: W.surface, border: `0.5px solid ${W.borderStrong}`, display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    {item}
                    <button onClick={() => removeItem(item)} style={{ background: "none", border: "none", cursor: "pointer", color: W.textFaint, fontSize: 14, lineHeight: 1, padding: "0 2px" }}>×</button>
                  </div>
                ))}
                <div onClick={addItem} style={{ padding: "10px 14px", borderRadius: 100, border: `0.5px dashed ${W.borderStrong}`, fontSize: 13, color: W.textFaint, cursor: "pointer" }}>+ 재료 추가</div>
              </div>
            </div>

            <div>
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "40px 0", color: W.textFaint, fontFamily: W.mono, fontSize: 12, letterSpacing: 0.5 }}>MATCHING...</div>
              ) : (
                <>
                  <div style={{ fontFamily: W.mono, fontSize: 10, letterSpacing: 1.6, color: W.textFaint, marginBottom: 16, textTransform: "uppercase" }}>MATCHES · {exactCount}</div>
                  {result?.exact.length === 0 && (
                    <p style={{ fontSize: 14, color: W.textMuted }}>재료로 만들 수 있는 칵테일이 없어요.</p>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
                    {result?.exact.map(({ cocktail: c }) => (
                      <div key={c.id} style={{ background: W.surface, border: `0.5px solid ${W.border}`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                        <GlassSilhouette type={pickGlass(c.name)} size={52} stroke={W.accent} liquid={W.accent} fillLevel={0.7} strokeWidth={1.3} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.3 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: W.accent, marginTop: 4, fontFamily: W.mono }}>바로 만들 수 있어요 · ABV {c.abv}%</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {(result?.almost.length ?? 0) > 0 && (
                    <>
                      <div style={{ fontFamily: W.mono, fontSize: 10, letterSpacing: 1.6, color: W.textFaint, marginBottom: 14, textTransform: "uppercase" }}>ALMOST · 한 가지만 더</div>
                      {result?.almost.map(({ cocktail: c, missingIngredients }) => (
                        <div key={c.id} style={{ padding: "14px 0", display: "flex", alignItems: "baseline", borderBottom: `0.5px solid ${W.border}`, gap: 12 }}>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</span>
                          <span style={{ flex: 1, fontSize: 11, color: W.textFaint }}>{missingIngredients[0]} 필요</span>
                        </div>
                      ))}
                    </>
                  )}

                  {result?.creative && (
                    <div style={{ marginTop: 28, padding: "16px 20px", background: W.surface, borderRadius: 14, border: `0.5px solid ${W.borderStrong}` }}>
                      <div style={{ fontFamily: W.mono, fontSize: 9, letterSpacing: 1.4, color: W.accent, marginBottom: 8, textTransform: "uppercase" }}>AI CREATIVE</div>
                      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{result.creative.name}</div>
                      <p style={{ margin: 0, fontSize: 13, color: W.textMuted, lineHeight: 1.6 }}>{result.creative.aiDescription}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="cordial-mob">
        <div style={{ width: "100%", minHeight: "100vh", background: T.darkBg, color: T.darkText, fontFamily: T.sans, maxWidth: 430, margin: "0 auto", paddingBottom: 90, overflowY: "auto" }}>
          <div style={{ paddingTop: 62, paddingBottom: 16, paddingLeft: 20, paddingRight: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/home" style={{ textDecoration: "none", display: "flex" }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 4 L6 10 L12 16" stroke={T.darkText} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", color: T.darkTextMuted }}>MY PANTRY</div>
            <button onClick={addItem} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: T.accent, fontFamily: T.sans }}>+ 추가</button>
          </div>

          <div style={{ padding: "8px 24px 24px" }}>
            <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.6, margin: 0, lineHeight: 1.2 }}>가진 재료로<br />만들 수 있는 한 잔.</h1>
            <p style={{ fontSize: 13, color: T.darkTextMuted, marginTop: 12, lineHeight: 1.6 }}>
              {owned.length}가지 재료 · {loading ? "확인 중..." : `${exactCount}잔 가능`}
            </p>
          </div>

          <div style={{ padding: "0 24px 28px" }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.6, color: T.darkTextFaint, marginBottom: 14, textTransform: "uppercase" }}>YOUR INVENTORY · {owned.length}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {owned.map((item) => (
                <div key={item} style={{ padding: "8px 10px 8px 14px", borderRadius: 100, background: T.darkSurface, border: `0.5px solid ${T.darkBorderStrong}`, display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  {item}
                  <button onClick={() => removeItem(item)} style={{ background: "none", border: "none", cursor: "pointer", color: T.darkTextFaint, fontSize: 14, lineHeight: 1, padding: "0 2px" }}>×</button>
                </div>
              ))}
              <div onClick={addItem} style={{ padding: "10px 14px", borderRadius: 100, border: `0.5px dashed ${T.darkBorderStrong}`, fontSize: 13, color: T.darkTextFaint, cursor: "pointer" }}>+ 추가</div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "24px", color: T.darkTextFaint, fontFamily: T.mono, fontSize: 12 }}>MATCHING...</div>
          ) : (
            <div style={{ padding: "0 24px" }}>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.6, color: T.darkTextFaint, marginBottom: 14, textTransform: "uppercase" }}>MATCHES · {exactCount}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                {result?.exact.map(({ cocktail: c }) => (
                  <div key={c.id} style={{ background: T.darkSurface, border: `0.5px solid ${T.darkBorder}`, borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                    <GlassSilhouette type={pickGlass(c.name)} size={56} stroke={T.accent} liquid={T.accent} fillLevel={0.7} strokeWidth={1.3} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.3 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: T.accent, marginTop: 4, fontFamily: T.mono }}>바로 만들 수 있어요</div>
                    </div>
                  </div>
                ))}
                {result?.exact.length === 0 && <p style={{ fontSize: 13, color: T.darkTextMuted }}>만들 수 있는 칵테일이 없어요.</p>}
              </div>

              {(result?.almost.length ?? 0) > 0 && (
                <>
                  <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.6, color: T.darkTextFaint, marginBottom: 14, textTransform: "uppercase" }}>ALMOST · 한 가지만 더</div>
                  {result?.almost.map(({ cocktail: c, missingIngredients }) => (
                    <div key={c.id} style={{ padding: "14px 0", display: "flex", alignItems: "baseline", borderBottom: `0.5px solid ${T.darkBorder}`, gap: 12 }}>
                      <span style={{ fontSize: 14, color: T.darkTextMuted }}>{c.name}</span>
                      <span style={{ flex: 1, fontSize: 11, color: T.darkTextFaint }}>{missingIngredients[0]} 필요</span>
                    </div>
                  ))}
                </>
              )}

              {result?.creative && (
                <div style={{ marginTop: 24, padding: "16px 18px", borderLeft: `2px solid ${T.accent}` }}>
                  <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: 1.4, color: T.accent, marginBottom: 8, textTransform: "uppercase" }}>AI CREATIVE</div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{result.creative.name}</div>
                  <p style={{ margin: 0, fontSize: 13, color: T.darkTextMuted, lineHeight: 1.6 }}>{result.creative.aiDescription}</p>
                </div>
              )}
            </div>
          )}

          <MobileTabBar active="pantry" />
        </div>
      </div>
    </>
  );
}

function MobileTabBar({ active }: { active: "home" | "pantry" | "mix" | "bars" }) {
  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, paddingBottom: 28, paddingTop: 10, background: "linear-gradient(180deg,rgba(21,17,13,0) 0%,rgba(21,17,13,0.92) 30%,rgba(21,17,13,1) 60%)", display: "flex", justifyContent: "space-around", borderTop: "0.5px solid rgba(255,246,232,0.08)" }}>
      {TABS.map((t) => {
        const isActive = t.id === active;
        const c = isActive ? "#B88752" : "rgba(245,239,230,0.38)";
        return (
          <Link key={t.id} href={t.href} style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 12px" }}>
              <GlassGlyph type={t.glass} size={22} color={c} strokeWidth={1.4} />
              <span style={{ fontSize: 10, color: c, fontWeight: 500, fontFamily: '"Pretendard Variable","Pretendard",sans-serif' }}>{t.label}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
