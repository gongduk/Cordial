"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import Link from "next/link";
import { GlassGlyph } from "@/shared/ui/GlassSilhouette";
import { WebNav } from "@/shared/ui/WebNav";
import type { GlassType } from "@/shared/ui/GlassSilhouette";
import type { BarData } from "@/shared/types";

const W = {
  accent: "#B88752",
  accentTint: "rgba(184,135,82,0.1)",
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
  accentTint: "rgba(184,135,82,0.12)",
  darkBg: "#15110D",
  darkSurface: "#1C1814",
  darkSurface2: "#241F1A",
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

const FALLBACK_BARS: BarData[] = [
  { id: "1", name: "Le Chamber", address: "서울 강남구 청담동", area: "청담", moodTags: ["조용함", "클래식", "스피크이지"], signature: "Old Fashioned", imageUrl: null, description: "말없이 한 잔 기울이기 좋은 어두운 카운터." },
  { id: "2", name: "Bar Cham", address: "서울 종로구 안국동", area: "안국", moodTags: ["아늑함", "한국적", "시즈널"], signature: "연(蓮)", imageUrl: null, description: "계절 재료를 쓰는 한국적 시그니처. 여운이 길어요." },
  { id: "3", name: "Alice Cheongdam", address: "서울 강남구 청담동", area: "청담", moodTags: ["로맨틱", "플로럴", "히든"], signature: "Aviation", imageUrl: null, description: "책장 너머의 작은 정원 같은 곳." },
];

function pickGlass(signature?: string | null): GlassType {
  if (!signature) return "coupe";
  const s = signature.toLowerCase();
  if (s.includes("old") || s.includes("fashion") || s.includes("whiskey")) return "rocks";
  if (s.includes("martini") || s.includes("gimlet")) return "martini";
  if (s.includes("highball") || s.includes("collins")) return "highball";
  return "coupe";
}

export default function BarsPage() {
  const [activeMood, setActiveMood] = useState<string | null>(null);

  const { data, isLoading: loading } = useQuery({
    queryKey: ["bars"],
    queryFn: () => api.get<BarData[]>("/bars").then(r => r.data),
  });
  const bars = data && data.length > 0 ? data : FALLBACK_BARS;

  const allMoods = Array.from(new Set(bars.flatMap((b) => b.moodTags))).slice(0, 6);
  const filtered = activeMood ? bars.filter((b) => b.moodTags.includes(activeMood)) : bars;

  function BarCard({ b, dark }: { b: BarData; dark?: boolean }) {
    const accent = T.accent;
    const accentTint = dark ? T.accentTint : W.accentTint;
    const surface = dark ? T.darkSurface : W.surface;
    const surface2 = dark ? T.darkSurface2 : "#F4F0EA";
    const border1 = dark ? T.darkBorder : W.border;
    const borderS = dark ? T.darkBorderStrong : W.borderStrong;
    const txt = dark ? T.darkText : W.text;
    const txtMuted = dark ? T.darkTextMuted : W.textMuted;
    const txtFaint = dark ? T.darkTextFaint : W.textFaint;
    const mono = T.mono;
    const glassType = pickGlass(b.signature);
    return (
      <div style={{ background: surface, border: `0.5px solid ${border1}`, borderRadius: 16, padding: "20px 20px 18px", position: "relative", overflow: "hidden" }}>
        {b === filtered[0] && (
          <div style={{ position: "absolute", top: 16, right: 16, fontFamily: mono, fontSize: 9, color: accent, letterSpacing: 1.4, background: accentTint, padding: "4px 8px", borderRadius: 4 }}>추천</div>
        )}
        <div style={{ marginBottom: 6 }}>
          <h3 style={{ fontSize: 19, fontWeight: 600, letterSpacing: -0.4, margin: 0, color: txt }}>{b.name}</h3>
        </div>
        <div style={{ fontSize: 12, color: txtMuted, marginBottom: 14 }}>{b.area} · {b.address}</div>
        {b.description && <p style={{ margin: 0, marginBottom: 14, fontSize: 13, lineHeight: 1.6, color: txt, letterSpacing: -0.2 }}>{b.description}</p>}
        {b.signature && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", marginBottom: 14, background: surface2, borderRadius: 10 }}>
            <GlassGlyph type={glassType} size={20} color={accent} />
            <span style={{ fontSize: 12, color: txtMuted }}>
              <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: 1.4, marginRight: 8, color: txtFaint, textTransform: "uppercase" }}>SIGNATURE</span>
              {b.signature}
            </span>
          </div>
        )}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {b.moodTags.map((m) => (
            <span key={m} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 100, border: `0.5px solid ${borderS}`, color: txtMuted }}>{m}</span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── WEB ── */}
      <div className="cordial-web" style={{ background: W.bg, minHeight: "100vh", color: W.text, fontFamily: W.sans }}>
        <WebNav active="/bars" />
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 40px" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontFamily: W.mono, fontSize: 10, letterSpacing: 1.8, color: W.accent, marginBottom: 14, textTransform: "uppercase" }}>Bars Near You</div>
            <h1 style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1, lineHeight: 1.1, margin: "0 0 14px" }}>오늘 밤<br />당신을 위한 바.</h1>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 36, flexWrap: "wrap" }}>
            <button onClick={() => setActiveMood(null)} style={{
              padding: "8px 16px", borderRadius: 100, flexShrink: 0,
              background: !activeMood ? W.accent : "transparent",
              border: `0.5px solid ${!activeMood ? W.accent : W.borderStrong}`,
              color: !activeMood ? "#FCFBF9" : W.textMuted,
              fontSize: 13, fontWeight: !activeMood ? 600 : 500,
              cursor: "pointer", fontFamily: W.sans,
            }}>전체</button>
            {allMoods.map((m) => (
              <button key={m} onClick={() => setActiveMood(activeMood === m ? null : m)} style={{
                padding: "8px 16px", borderRadius: 100, flexShrink: 0,
                background: activeMood === m ? W.accent : "transparent",
                border: `0.5px solid ${activeMood === m ? W.accent : W.borderStrong}`,
                color: activeMood === m ? "#FCFBF9" : W.textMuted,
                fontSize: 13, fontWeight: activeMood === m ? 600 : 500,
                cursor: "pointer", fontFamily: W.sans,
              }}>{m}</button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: W.textFaint, fontFamily: W.mono, fontSize: 12, letterSpacing: 0.5 }}>LOADING BARS...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {filtered.map((b) => <BarCard key={b.id} b={b} />)}
              {filtered.length === 0 && <p style={{ color: W.textMuted, fontSize: 14 }}>해당 분위기의 바가 없어요.</p>}
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="cordial-mob">
        <div style={{ width: "100%", minHeight: "100vh", background: T.darkBg, color: T.darkText, fontFamily: T.sans, maxWidth: 430, margin: "0 auto", paddingBottom: 90, overflowY: "auto" }}>
          <div style={{ paddingTop: 62, paddingBottom: 16, paddingLeft: 20, paddingRight: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/home" style={{ textDecoration: "none", display: "flex" }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 4 L6 10 L12 16" stroke={T.darkText} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", color: T.darkTextMuted }}>BARS NEAR YOU</div>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 5 L15 5 M5 9 L13 9 M7 13 L11 13" stroke={T.darkText} strokeWidth="1.4" strokeLinecap="round" /></svg>
          </div>

          <div style={{ padding: "8px 24px 20px" }}>
            <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.6, margin: 0, lineHeight: 1.2 }}>오늘 밤<br />당신을 위한 바.</h1>
          </div>

          <div style={{ padding: "0 24px 20px", display: "flex", gap: 8, overflowX: "auto" }}>
            <button onClick={() => setActiveMood(null)} style={{ padding: "8px 14px", borderRadius: 100, flexShrink: 0, background: !activeMood ? T.accent : "transparent", border: `0.5px solid ${!activeMood ? T.accent : T.darkBorderStrong}`, color: !activeMood ? T.darkBg : T.darkTextMuted, fontSize: 12, fontWeight: !activeMood ? 600 : 500, cursor: "pointer", fontFamily: T.sans }}>전체</button>
            {allMoods.map((m) => (
              <button key={m} onClick={() => setActiveMood(activeMood === m ? null : m)} style={{ padding: "8px 14px", borderRadius: 100, flexShrink: 0, background: activeMood === m ? T.accent : "transparent", border: `0.5px solid ${activeMood === m ? T.accent : T.darkBorderStrong}`, color: activeMood === m ? T.darkBg : T.darkTextMuted, fontSize: 12, fontWeight: activeMood === m ? 600 : 500, cursor: "pointer", fontFamily: T.sans }}>{m}</button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: T.darkTextFaint, fontFamily: T.mono, fontSize: 12 }}>LOADING...</div>
          ) : (
            <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              {filtered.map((b) => <BarCard key={b.id} b={b} dark />)}
            </div>
          )}

          <MobileTabBar active="bars" />
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
