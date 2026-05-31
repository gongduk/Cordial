"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { GlassSilhouette, GlassGlyph } from "@/shared/ui/GlassSilhouette";
import { WebNav } from "@/shared/ui/WebNav";
import { IngredientSearch } from "@/shared/ui/IngredientSearch";
import type { GlassType } from "@/shared/ui/GlassSilhouette";
import type { IngredientOption } from "@/shared/ui/IngredientSearch";
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

const DEFAULT_PANTRY = ["버번 위스키", "진", "캄파리", "드라이 베르무트", "레몬 주스", "심플 시럽"];
const STORAGE_KEY = "cordial_pantry";

export default function PantryPage() {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  const router = useRouter();

  function openCocktail(c: RecommendedCocktail & { abv: number }) {
    sessionStorage.setItem("selectedCocktail", JSON.stringify({ ...c, aiDescription: c.aiDescription ?? "", score: 0 }));
    router.push(`/cocktail/${c.id}`);
  }

  const [owned, setOwned] = useState<string[]>([]);
  const [loadingPantry, setLoadingPantry] = useState(true);
  const [result, setResult] = useState<PantryResult | null>(null);
  const [showSearchWeb, setShowSearchWeb] = useState(false);
  const [showSearchMob, setShowSearchMob] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matchMutation = useMutation({
    mutationFn: (ingredients: string[]) =>
      api.post<PantryResult>("/ai/pantry-recommend", { ingredients }).then(r => r.data),
    onSuccess: (data) => setResult(data),
    onError: () => setResult(null),
  });

  const matchLoading = matchMutation.isPending;

  // 매칭 요청
  const fetchMatches = useCallback((ingredients: string[]) => {
    if (ingredients.length === 0) { setResult(null); return; }
    matchMutation.mutate(ingredients);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // DB 저장 (로그인 시, 디바운스)
  const saveToDB = useCallback((items: string[]) => {
    if (!isLoggedIn) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      api.put("/user/pantry", { pantry: items }).catch(() => {});
    }, 800);
  }, [isLoggedIn]);

  // 초기 로드
  useEffect(() => {
    if (status === "loading") return;

    async function loadPantry() {
      if (isLoggedIn) {
        try {
          const res = await api.get<{ pantry: string[] }>("/user/pantry");
          const data = res.data;
          const items = data.pantry.length > 0 ? data.pantry : DEFAULT_PANTRY;
          setOwned(items);
          fetchMatches(items);
        } catch {
          setOwned(DEFAULT_PANTRY);
          fetchMatches(DEFAULT_PANTRY);
        }
      } else {
        const saved = localStorage.getItem(STORAGE_KEY);
        let items: string[] = DEFAULT_PANTRY;
        if (saved) {
          try { items = JSON.parse(saved) as string[]; } catch { localStorage.removeItem(STORAGE_KEY); }
        }
        setOwned(items);
        fetchMatches(items);
      }
      setLoadingPantry(false);
    }

    loadPantry();
  }, [status, isLoggedIn, fetchMatches]);

  function applyItems(next: string[]) {
    setOwned(next);
    fetchMatches(next);
    if (isLoggedIn) {
      saveToDB(next);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }

  function addItem(item: IngredientOption | { name: string; abv: number; isCustom: true }) {
    if (owned.includes(item.name)) return;
    applyItems([...owned, item.name]);
  }

  function removeItem(name: string) {
    applyItems(owned.filter(i => i !== name));
  }

  const exactCount = result?.exact.length ?? 0;

  if (loadingPantry) {
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

  return (
    <>
      {/* ── WEB ── */}
      <div className="cordial-web" style={{ background: W.bg, minHeight: "100vh", color: W.text, fontFamily: W.sans }}>
        <WebNav active="/pantry" />
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 40px" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontFamily: W.mono, fontSize: 10, letterSpacing: 1.8, color: W.accent, marginBottom: 14, textTransform: "uppercase" }}>My Pantry</div>
            <h1 style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1, lineHeight: 1.1, margin: "0 0 14px" }}>가진 재료로<br />만들 수 있는 한 잔.</h1>
            <p style={{ fontSize: 15, color: W.textMuted, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              {owned.length}가지 재료로 {matchLoading ? "확인 중..." : `${exactCount}잔이 가능해요.`}
              {isLoggedIn && <span style={{ fontSize: 12, color: W.accent, fontFamily: W.mono }}>· 자동 저장됨</span>}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 48 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: W.mono, fontSize: 10, letterSpacing: 1.6, color: W.textFaint, textTransform: "uppercase" }}>YOUR INVENTORY · {owned.length}</div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {owned.map((item) => (
                  <div key={item} style={{ padding: "8px 10px 8px 14px", borderRadius: 100, background: W.surface, border: `0.5px solid ${W.borderStrong}`, display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    {item}
                    <button onClick={() => removeItem(item)} style={{ background: "none", border: "none", cursor: "pointer", color: W.textFaint, fontSize: 14, lineHeight: 1, padding: "0 2px" }}>×</button>
                  </div>
                ))}
              </div>
              {showSearchWeb ? (
                <div style={{ marginTop: 4 }}>
                  <IngredientSearch
                    onSelect={(item) => { addItem(item); setShowSearchWeb(false); }}
                    placeholder="재료 검색 또는 직접 추가..."
                  />
                </div>
              ) : (
                <button onClick={() => setShowSearchWeb(true)} style={{ padding: "10px 14px", borderRadius: 100, border: `0.5px dashed ${W.borderStrong}`, fontSize: 13, color: W.textFaint, cursor: "pointer", background: "none" }}>+ 재료 추가</button>
              )}
            </div>

            <div>
              {matchLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "40px 0", color: W.textFaint, fontFamily: W.mono, fontSize: 12, letterSpacing: 0.5 }}>MATCHING...</div>
              ) : (
                <>
                  <div style={{ fontFamily: W.mono, fontSize: 10, letterSpacing: 1.6, color: W.textFaint, marginBottom: 16, textTransform: "uppercase" }}>MATCHES · {exactCount}</div>
                  {result?.exact.length === 0 && (
                    <p style={{ fontSize: 14, color: W.textMuted }}>재료로 만들 수 있는 칵테일이 없어요.</p>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
                    {result?.exact.map(({ cocktail: c }) => (
                      <div key={c.id} onClick={() => openCocktail(c)} style={{ background: W.surface, border: `0.5px solid ${W.border}`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", transition: "box-shadow 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(184,135,82,0.12)")}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                      >
                        <GlassSilhouette type={pickGlass(c.name)} size={52} stroke={W.accent} liquid={W.accent} fillLevel={0.7} strokeWidth={1.3} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.3 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: W.accent, marginTop: 4, fontFamily: W.mono }}>바로 만들 수 있어요 · ABV {c.abv}%</div>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M8 4l6 6-6 6" stroke={W.textFaint} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    ))}
                  </div>

                  {(result?.almost.length ?? 0) > 0 && (
                    <>
                      <div style={{ fontFamily: W.mono, fontSize: 10, letterSpacing: 1.6, color: W.textFaint, marginBottom: 14, textTransform: "uppercase" }}>ALMOST · 한 가지만 더</div>
                      {result?.almost.map(({ cocktail: c, missingIngredients }) => (
                        <div key={c.id} onClick={() => openCocktail(c)} style={{ padding: "14px 0", display: "flex", alignItems: "baseline", borderBottom: `0.5px solid ${W.border}`, gap: 12, cursor: "pointer" }}>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</span>
                          <span style={{ flex: 1, fontSize: 11, color: W.textFaint }}>{missingIngredients[0]} 필요</span>
                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M8 4l6 6-6 6" stroke={W.textFaint} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
            <button onClick={() => setShowSearchMob(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: T.accent, fontFamily: T.sans }}>+ 추가</button>
          </div>

          <div style={{ padding: "8px 24px 16px" }}>
            <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.6, margin: 0, lineHeight: 1.2 }}>가진 재료로<br />만들 수 있는 한 잔.</h1>
            <p style={{ fontSize: 13, color: T.darkTextMuted, marginTop: 10, lineHeight: 1.6 }}>
              {owned.length}가지 재료 · {matchLoading ? "확인 중..." : `${exactCount}잔 가능`}
              {isLoggedIn && <span style={{ color: T.accent, marginLeft: 6 }}>· 저장됨</span>}
            </p>
          </div>

          <div style={{ padding: "0 24px 20px" }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.6, color: T.darkTextFaint, marginBottom: 12, textTransform: "uppercase" }}>YOUR INVENTORY · {owned.length}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {owned.map((item) => (
                <div key={item} style={{ padding: "8px 10px 8px 14px", borderRadius: 100, background: T.darkSurface, border: `0.5px solid ${T.darkBorderStrong}`, display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  {item}
                  <button onClick={() => removeItem(item)} style={{ background: "none", border: "none", cursor: "pointer", color: T.darkTextFaint, fontSize: 14, lineHeight: 1, padding: "0 2px" }}>×</button>
                </div>
              ))}
            </div>
            {showSearchMob && (
              <div style={{ marginTop: 12 }}>
                <IngredientSearch
                  dark
                  onSelect={(item) => { addItem(item); setShowSearchMob(false); }}
                  placeholder="재료 검색 또는 직접 추가..."
                />
              </div>
            )}
          </div>

          {matchLoading ? (
            <div style={{ textAlign: "center", padding: "24px", color: T.darkTextFaint, fontFamily: T.mono, fontSize: 12 }}>MATCHING...</div>
          ) : (
            <div style={{ padding: "0 24px" }}>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.6, color: T.darkTextFaint, marginBottom: 14, textTransform: "uppercase" }}>MATCHES · {exactCount}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                {result?.exact.map(({ cocktail: c }) => (
                  <div key={c.id} onClick={() => openCocktail(c)} style={{ background: T.darkSurface, border: `0.5px solid ${T.darkBorder}`, borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}>
                    <GlassSilhouette type={pickGlass(c.name)} size={56} stroke={T.accent} liquid={T.accent} fillLevel={0.7} strokeWidth={1.3} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.3 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: T.accent, marginTop: 4, fontFamily: T.mono }}>바로 만들 수 있어요</div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M8 4l6 6-6 6" stroke={T.darkTextFaint} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                ))}
                {result?.exact.length === 0 && <p style={{ fontSize: 13, color: T.darkTextMuted }}>만들 수 있는 칵테일이 없어요.</p>}
              </div>

              {(result?.almost.length ?? 0) > 0 && (
                <>
                  <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.6, color: T.darkTextFaint, marginBottom: 14, textTransform: "uppercase" }}>ALMOST · 한 가지만 더</div>
                  {result?.almost.map(({ cocktail: c, missingIngredients }) => (
                    <div key={c.id} onClick={() => openCocktail(c)} style={{ padding: "14px 0", display: "flex", alignItems: "baseline", borderBottom: `0.5px solid ${T.darkBorder}`, gap: 12, cursor: "pointer" }}>
                      <span style={{ fontSize: 14, color: T.darkTextMuted }}>{c.name}</span>
                      <span style={{ flex: 1, fontSize: 11, color: T.darkTextFaint }}>{missingIngredients[0]} 필요</span>
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M8 4l6 6-6 6" stroke={T.darkTextFaint} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
