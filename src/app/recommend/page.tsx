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

const GLASS_ORDER: GlassType[] = ["rocks", "coupe", "martini"];

const ANALYSIS_STEPS = [
  { label: "감정 톤 분석" },
  { label: "맛 프로필 매칭" },
  { label: "오늘의 한 잔 선정" },
];

function AnalyzingDots({ doneCount }: { doneCount: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: T.mono, fontSize: 12, letterSpacing: 0.2 }}>
      {ANALYSIS_STEPS.map((s, i) => {
        const done = i < doneCount;
        const current = i === doneCount;
        return (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              width: 14, height: 14, borderRadius: 7, flexShrink: 0,
              border: `1px solid ${done ? T.accent : T.darkBorderStrong}`,
              background: done ? T.accent : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {done && <svg width="8" height="6" viewBox="0 0 8 6"><path d="M1 3 L3 5 L7 1" stroke={T.darkBg} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </span>
            <span style={{ color: done ? T.darkText : T.darkTextMuted }}>{s.label}</span>
            {current && <span style={{ marginLeft: "auto", color: T.accent }}>···</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function RecommendPage() {
  const [list, setList] = useState<RecommendedCocktail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batch, setBatch] = useState(0);
  const [innerIndex, setInnerIndex] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const ev = typeof window !== "undefined" ? sessionStorage.getItem("emotionVector") : null;
    if (!ev) { router.replace("/emotion"); return; }

    // Use cached results if emotionVector hasn't changed (prevents re-fetch on back navigation)
    const cachedEv = sessionStorage.getItem("recommendCacheEv");
    const cachedList = sessionStorage.getItem("recommendCache");
    if (cachedList && cachedEv === ev) {
      setList(JSON.parse(cachedList) as RecommendedCocktail[]);
      setDoneCount(3);
      setLoading(false);
      return;
    }

    const emotionVector = JSON.parse(ev) as Record<string, number>;
    const drinkingCapacity = sessionStorage.getItem("drinkingCapacity") ?? "MEDIUM";

    const t1 = setTimeout(() => setDoneCount(1), 600);
    const t2 = setTimeout(() => setDoneCount(2), 1200);

    fetch("/api/ai/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emotionVector, drinkingCapacity }),
    })
      .then(async res => { if (!res.ok) throw new Error((await res.json() as { error?: string }).error || "추천 실패"); return res.json() as Promise<RecommendedCocktail[]>; })
      .then(data => {
        setList(data);
        sessionStorage.setItem("recommendCache", JSON.stringify(data));
        sessionStorage.setItem("recommendCacheEv", ev);
      })
      .catch(e => setError(String((e as Error).message || e)))
      .finally(() => setLoading(false));

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [router]);

  function toBar(val: number) { return Math.round(val * 5); }

  function goToDetail(c: RecommendedCocktail) {
    sessionStorage.setItem("selectedCocktail", JSON.stringify(c));
    router.push(`/cocktail/${c.id}`);
  }

  function nextBatch() {
    setBatch(b => b + 1);
    setInnerIndex(0);
  }

  /* Loading */
  if (loading) {
    return (
      <>
        <div className="cordial-web" style={{ background: W.bg, minHeight: "100vh", fontFamily: W.sans }}>
          <WebNav />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 60px)", gap: 40 }}>
            <GlassSilhouette type="martini" size={140} stroke={W.accent} liquid={W.accent} fillLevel={0.55} strokeWidth={1.3} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: W.mono, fontSize: 11, letterSpacing: 1.8, color: W.accent, marginBottom: 14, textTransform: "uppercase" }}>READING YOU</div>
              <h2 style={{ fontSize: 24, fontWeight: 500, letterSpacing: -0.4, lineHeight: 1.45, margin: 0, color: W.text }}>오늘의 당신을<br />읽고 있어요.</h2>
            </div>
          </div>
        </div>
        <div className="cordial-mob">
          <div style={{ width: "100%", minHeight: "100vh", background: T.darkBg, color: T.darkText, fontFamily: T.sans, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ paddingTop: 62, paddingLeft: 20, paddingRight: 20, paddingBottom: 16 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40, padding: "0 40px" }}>
              <GlassSilhouette type="martini" size={140} stroke={T.accent} liquid={T.accent} fillLevel={0.55} strokeWidth={1.3} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.8, color: T.accent, marginBottom: 16, textTransform: "uppercase" }}>READING YOU</div>
                <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: -0.4, lineHeight: 1.45, margin: 0 }}>오늘의 당신을<br />읽고 있어요.</h2>
              </div>
              <div style={{ width: "100%" }}><AnalyzingDots doneCount={doneCount} /></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* Error */
  if (error || list.length === 0) {
    const msg = error || "추천 결과가 없어요.";
    return (
      <>
        <div className="cordial-web" style={{ background: W.bg, minHeight: "100vh", fontFamily: W.sans, display: "flex", flexDirection: "column" }}>
          <WebNav />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: "0 24px" }}>
            <p style={{ fontSize: 17, color: W.textMuted, textAlign: "center" }}>{msg}</p>
            <button onClick={() => router.push("/emotion")} style={{ padding: "14px 28px", borderRadius: 12, background: W.accent, color: W.bg, border: "none", fontSize: 15, fontWeight: 600, fontFamily: W.sans, cursor: "pointer" }}>다시 시도하기</button>
          </div>
        </div>
        <div className="cordial-mob">
          <div style={{ width: "100%", minHeight: "100vh", background: T.darkBg, color: T.darkText, fontFamily: T.sans, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: "0 24px" }}>
            <p style={{ fontSize: 17, color: T.darkTextMuted, textAlign: "center" }}>{msg}</p>
            <button onClick={() => router.push("/emotion")} style={{ padding: "14px 28px", borderRadius: 14, background: T.accent, color: T.darkBg, border: "none", fontSize: 15, fontWeight: 600, fontFamily: T.sans, cursor: "pointer" }}>다시 시도하기</button>
          </div>
        </div>
      </>
    );
  }

  /* Success */
  const currentBatch = list.slice(batch * 3, batch * 3 + 3);
  const safeInner = Math.min(innerIndex, currentBatch.length - 1);
  const c = currentBatch[safeInner];
  const globalIndex = batch * 3 + safeInner;
  const glassType: GlassType = (c.glassType as GlassType | null) ?? GLASS_ORDER[globalIndex % GLASS_ORDER.length];
  const hasMoreBatch = list.length > (batch + 1) * 3;
  const profile = [
    ["SOUR", toBar(c.sourness)],
    ["SWEET", toBar(c.sweetness)],
    ["BITTER", toBar(c.bitterness)],
    ["STRONG", toBar(c.strength)],
  ] as const;

  const Dots = ({ dark }: { dark?: boolean }) => (
    <div style={{ display: "flex", gap: 6 }}>
      {currentBatch.map((_, i) => (
        <button key={i} onClick={() => setInnerIndex(i)} style={{
          width: i === safeInner ? 18 : 6, height: 6, borderRadius: 3,
          background: i === safeInner ? T.accent : (dark ? T.darkBorderStrong : W.borderStrong),
          border: "none", cursor: "pointer", padding: 0, transition: "width 0.25s",
        }} />
      ))}
    </div>
  );

  return (
    <>
      {/* ── WEB ── */}
      <div className="cordial-web" style={{ background: W.bg, minHeight: "100vh", color: W.text, fontFamily: W.sans }}>
        <WebNav active="/emotion" />
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 40px", display: "flex", gap: 64, alignItems: "center", minHeight: "calc(100vh - 60px)" }}>
          {/* Left: glass + name + dots */}
          <div style={{ flex: "0 0 420px", display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
            <div style={{ fontFamily: W.mono, fontSize: 11, letterSpacing: 1.6, color: W.accent }}>
              {String(globalIndex + 1).padStart(2, "0")} · {globalIndex === 0 ? "TOP PICK" : `TOP #${globalIndex + 1}`}
            </div>
            <GlassSilhouette type={glassType} size={240} stroke={W.accent} liquid={W.accent} fillLevel={0.7} garnish strokeWidth={1.1} />
            <div style={{ textAlign: "center" }}>
              <h1 style={{ fontSize: 38, fontWeight: 600, letterSpacing: -0.8, margin: "0 0 8px", lineHeight: 1.1 }}>{c.name}</h1>
              <div style={{ fontSize: 14, color: W.textMuted }}>{c.description || "칵테일"} · ABV {Math.round(c.abv)}%</div>
            </div>
            <Dots />
          </div>

          {/* Right: details */}
          <div style={{ flex: 1 }}>
            <div style={{ padding: "20px 22px", borderLeft: `2px solid ${W.accent}`, marginBottom: 36 }}>
              <div style={{ fontFamily: W.mono, fontSize: 9, letterSpacing: 1.4, color: W.accent, marginBottom: 10, textTransform: "uppercase" }}>WHY THIS</div>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, letterSpacing: -0.25, color: W.text }}>{c.aiDescription}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px", marginBottom: 40 }}>
              {profile.map(([label, val]) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontFamily: W.mono, fontSize: 10, letterSpacing: 1.2, color: W.textMuted }}>{label}</span>
                    <span style={{ fontFamily: W.mono, fontSize: 10, color: W.textFaint }}>{val}/5</span>
                  </div>
                  <div style={{ height: 3, background: W.border, borderRadius: 2 }}>
                    <div style={{ width: `${(val / 5) * 100}%`, height: "100%", background: W.accent, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              {hasMoreBatch && (
                <button onClick={nextBatch} style={{
                  flex: "0 0 auto", height: 52, padding: "0 22px", borderRadius: 12,
                  background: "transparent", color: W.text,
                  border: `1px solid ${W.borderStrong}`, fontSize: 14, fontWeight: 500, letterSpacing: -0.2,
                  fontFamily: W.sans, cursor: "pointer",
                }}>다른 추천</button>
              )}
              <button onClick={() => goToDetail(c)} style={{
                flex: 1, height: 52, borderRadius: 12,
                background: W.text, color: W.bg,
                border: "none", fontSize: 15, fontWeight: 600, letterSpacing: -0.2,
                fontFamily: W.sans, cursor: "pointer",
              }}>레시피 보기</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="cordial-mob">
        <div style={{ width: "100%", minHeight: "100vh", background: T.darkBg, color: T.darkText, fontFamily: T.sans, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>
          <div style={{ paddingTop: 62, paddingBottom: 16, paddingLeft: 20, paddingRight: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 4 L6 10 L12 16" stroke={T.darkText} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", color: T.darkTextMuted }}>{globalIndex + 1} / {list.length}</div>
            <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: T.darkTextMuted, fontFamily: T.sans }}>저장</button>
          </div>

          <div style={{ padding: "8px 24px 0", flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
              <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.6, color: T.accent }}>{String(globalIndex + 1).padStart(2, "0")} · {globalIndex === 0 ? "TOP PICK" : `TOP #${globalIndex + 1}`}</span>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 280 }}>
              <GlassSilhouette type={glassType} size={210} stroke={T.accent} liquid={T.accent} fillLevel={0.7} garnish strokeWidth={1.1} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <h1 style={{ fontSize: 36, fontWeight: 600, letterSpacing: -0.8, margin: 0, lineHeight: 1.1 }}>{c.name}</h1>
              <div style={{ fontSize: 14, color: T.darkTextMuted, marginTop: 6, letterSpacing: -0.1 }}>{c.description || "칵테일"} · ABV {Math.round(c.abv)}%</div>
            </div>
            <div style={{ padding: "16px 18px", borderLeft: `2px solid ${T.accent}`, marginBottom: 24 }}>
              <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: 1.4, color: T.accent, marginBottom: 8, textTransform: "uppercase" }}>WHY THIS</div>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, letterSpacing: -0.25 }}>{c.aiDescription}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", paddingBottom: 28 }}>
              {profile.map(([label, val]) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: 1.2, color: T.darkTextMuted }}>{label}</span>
                    <span style={{ fontFamily: T.mono, fontSize: 9, color: T.darkTextFaint }}>{val}/5</span>
                  </div>
                  <div style={{ height: 2, background: T.darkBorder, borderRadius: 1 }}>
                    <div style={{ width: `${(val / 5) * 100}%`, height: "100%", background: T.accent, borderRadius: 1 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: "16px 24px 36px", borderTop: `0.5px solid ${T.darkBorder}`, display: "flex", alignItems: "center", gap: 12 }}>
            <Dots dark />
            {hasMoreBatch && (
              <button onClick={nextBatch} style={{
                flex: "0 0 auto", height: 48, padding: "0 16px", borderRadius: 12,
                background: "transparent", color: T.darkText,
                border: `0.5px solid ${T.darkBorderStrong}`, fontSize: 13, fontWeight: 500,
                fontFamily: T.sans, cursor: "pointer", letterSpacing: -0.2,
              }}>다른 추천</button>
            )}
            <button onClick={() => goToDetail(c)} style={{
              flex: 1, height: 48, borderRadius: 12,
              background: T.darkText, color: T.darkBg,
              border: "none", fontSize: 14, fontWeight: 600, letterSpacing: -0.2,
              fontFamily: T.sans, cursor: "pointer",
            }}>레시피 보기</button>
          </div>
        </div>
      </div>
    </>
  );
}
