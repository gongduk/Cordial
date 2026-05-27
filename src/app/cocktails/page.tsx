"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { WebNav } from "@/shared/ui/WebNav";
import { GlassSilhouette } from "@/shared/ui/GlassSilhouette";
import type { GlassType } from "@/shared/ui/GlassSilhouette";

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

interface CocktailItem {
  id: string;
  name: string;
  nameEn: string | null;
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
  isCustom: boolean;
  description: string | null;
}

function pickGlass(name: string): GlassType {
  const n = name.toLowerCase();
  if (n.includes("martini") || n.includes("aviation") || n.includes("gimlet")) return "martini";
  if (n.includes("coupe") || n.includes("sidecar") || n.includes("negroni")) return "coupe";
  if (n.includes("highball") || n.includes("mojito") || n.includes("collins") || n.includes("mule")) return "highball";
  if (n.includes("flute") || n.includes("champagne")) return "flute";
  return "rocks";
}

const CATEGORIES = ["전체", "커스텀", "IBA", "Classic"];

export default function CocktailsPage() {
  const router = useRouter();
  const [cocktails, setCocktails] = useState<CocktailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("전체");

  useEffect(() => {
    fetch("/api/cocktails")
      .then(r => r.json())
      .then((data: CocktailItem[]) => setCocktails(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let items = cocktails;
    if (categoryFilter === "커스텀") items = items.filter(c => c.isCustom);
    else if (categoryFilter !== "전체") items = items.filter(c => c.category === categoryFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      items = items.filter(c => c.name.toLowerCase().includes(q) || (c.nameEn ?? "").toLowerCase().includes(q));
    }
    return items;
  }, [cocktails, query, categoryFilter]);

  function openDetail(c: CocktailItem) {
    sessionStorage.setItem("selectedCocktail", JSON.stringify({
      ...c,
      aiDescription: "",
      score: 0,
    }));
    router.push(`/cocktail/${c.id}`);
  }

  const categories = useMemo(() => {
    const cats = new Set(cocktails.map(c => c.category ?? "").filter(Boolean));
    return ["전체", ...(cocktails.some(c => c.isCustom) ? ["커스텀"] : []), ...Array.from(cats).filter(c => c !== "커스텀")];
  }, [cocktails]);

  return (
    <div style={{ background: W.bg, minHeight: "100vh", color: W.text, fontFamily: W.sans }}>
      <WebNav active="/cocktails" />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 40px" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: W.mono, fontSize: 10, letterSpacing: 1.8, color: W.accent, marginBottom: 14, textTransform: "uppercase" }}>All Cocktails</div>
          <h1 style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1, lineHeight: 1.1, margin: "0 0 14px" }}>전체 칵테일</h1>
          <p style={{ fontSize: 15, color: W.textMuted, margin: 0 }}>
            {loading ? "로딩 중..." : `${cocktails.length}가지 칵테일`}
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 32, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 360 }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="칵테일 검색..."
              style={{
                width: "100%", padding: "10px 16px", borderRadius: 100,
                border: `0.5px solid ${W.borderStrong}`, background: W.surface,
                fontSize: 13, color: W.text, fontFamily: W.sans, outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)} style={{
                padding: "8px 14px", borderRadius: 100, fontSize: 12,
                background: categoryFilter === cat ? W.text : "transparent",
                color: categoryFilter === cat ? W.bg : W.textMuted,
                border: `0.5px solid ${categoryFilter === cat ? W.text : W.borderStrong}`,
                cursor: "pointer", fontFamily: W.sans, transition: "all 0.15s",
              }}>{cat}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: W.textFaint, fontFamily: W.mono, fontSize: 12, letterSpacing: 0.5 }}>LOADING...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: W.textMuted, fontSize: 14 }}>검색 결과가 없어요.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
            {filtered.map(c => (
              <div
                key={c.id}
                onClick={() => openDetail(c)}
                style={{
                  background: W.surface,
                  border: `0.5px solid ${W.border}`,
                  borderRadius: 16,
                  padding: "20px 20px 18px",
                  cursor: "pointer",
                  transition: "box-shadow 0.15s, border-color 0.15s",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(184,135,82,0.12)";
                  e.currentTarget.style.borderColor = "rgba(184,135,82,0.3)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = W.border;
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", paddingBottom: 4 }}>
                  {c.imageUrl ? (
                    <img src={c.imageUrl} alt={c.name} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10 }} />
                  ) : (
                    <GlassSilhouette type={pickGlass(c.name)} size={72} stroke={W.accent} liquid={W.accent} fillLevel={0.7} strokeWidth={1.2} />
                  )}
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <div style={{ fontFamily: W.mono, fontSize: 9, letterSpacing: 1.2, color: W.accent, textTransform: "uppercase" }}>
                      {c.isCustom ? "CUSTOM" : (c.category ?? "Classic")}
                    </div>
                    {c.isCustom && (
                      <span style={{ background: W.accent, color: W.bg, fontSize: 8, padding: "1px 5px", borderRadius: 3, letterSpacing: 0.6 }}>MY</span>
                    )}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.3, lineHeight: 1.2 }}>{c.name}</div>
                  {c.nameEn && <div style={{ fontSize: 11, color: W.textFaint, marginTop: 2 }}>{c.nameEn}</div>}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: W.mono, fontSize: 11, color: W.textMuted }}>ABV {Math.round(c.abv)}%</span>
                  <div style={{ display: "flex", gap: 3 }}>
                    {[c.sweetness, c.sourness, c.bitterness, c.strength, c.freshness].map((v, i) => (
                      <div key={i} style={{ width: 5, height: Math.round(v * 20) + 4, borderRadius: 2, background: W.accent, opacity: 0.3 + v * 0.7 }} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
