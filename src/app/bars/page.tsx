"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import Link from "next/link";
import { GlassGlyph } from "@/shared/ui/GlassSilhouette";
import { WebNav } from "@/shared/ui/WebNav";
import { MobileTabBar } from "@/shared/ui/MobileTabBar";
import type { GlassType } from "@/shared/ui/GlassSilhouette";
import type { RecommendedBar, BarSurvey, BarMood, CocktailStyle, BarPurpose, BarBudget } from "@/shared/types";

const W = {
  accent: "#B88752", accentTint: "rgba(184,135,82,0.1)", bg: "#FCFBF9", surface: "#FFFFFF",
  border: "rgba(40,30,20,0.08)", borderStrong: "rgba(40,30,20,0.16)",
  text: "#1A1612", textMuted: "rgba(26,22,18,0.62)", textFaint: "rgba(26,22,18,0.38)",
  sans: '"Pretendard Variable","Pretendard",-apple-system,BlinkMacSystemFont,sans-serif',
  mono: '"JetBrains Mono",ui-monospace,"SF Mono",Menlo,monospace',
} as const;

const T = {
  accent: "#B88752", accentTint: "rgba(184,135,82,0.12)", darkBg: "#15110D",
  darkSurface: "#1C1814", darkSurface2: "#241F1A",
  darkBorder: "rgba(255,246,232,0.08)", darkBorderStrong: "rgba(255,246,232,0.14)",
  darkText: "#F5EFE6", darkTextMuted: "rgba(245,239,230,0.62)", darkTextFaint: "rgba(245,239,230,0.38)",
  sans: '"Pretendard Variable","Pretendard",-apple-system,BlinkMacSystemFont,sans-serif',
  mono: '"JetBrains Mono",ui-monospace,"SF Mono",Menlo,monospace',
} as const;

const MOODS: BarMood[] = ["조용한", "활기찬", "로맨틱", "힙한", "클래식"];
const STYLES: CocktailStyle[] = ["달콤한", "신", "쓴", "강한", "가벼운"];
const PURPOSES: BarPurpose[] = ["혼술", "데이트", "친구모임", "비즈니스"];
const BUDGETS: BarBudget[] = ["3만원 이하", "3~5만원", "5만원 이상"];

type Step = "location" | "survey" | "loading" | "result" | "error";

function pickGlass(signature?: string | null): GlassType {
  if (!signature) return "coupe";
  const s = signature.toLowerCase();
  if (s.includes("old") || s.includes("fashion") || s.includes("whiskey")) return "rocks";
  if (s.includes("martini") || s.includes("gimlet")) return "martini";
  if (s.includes("highball") || s.includes("spritz")) return "highball";
  return "coupe";
}

function PriceTag({ level, dark }: { level: number | null; dark?: boolean }) {
  if (!level) return null;
  const txt = dark ? T.darkTextFaint : W.textFaint;
  return (
    <span style={{ fontFamily: T.mono, fontSize: 11, color: txt }}>
      {"₩".repeat(level)}{"₩".repeat(4 - level).split("").map(() => "·").join("")}
    </span>
  );
}

export default function BarsPage() {
  const [step, setStep] = useState<Step>("location");
  const [survey, setSurvey] = useState<Partial<BarSurvey>>({});
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [manualArea, setManualArea] = useState("");
  const [results, setResults] = useState<RecommendedBar[]>([]);
  const [locating, setLocating] = useState(false);

  const recommendMutation = useMutation({
    mutationFn: async ({ lat, lng, s }: { lat: number; lng: number; s: BarSurvey }) => {
      await api.post("/bars/nearby", { lat, lng });
      const res = await api.post<RecommendedBar[]>("/bars/recommend", { lat, lng, survey: s });
      return res.data;
    },
    onSuccess: (data) => {
      setResults(data);
      setStep("result");
    },
    onError: () => setStep("error"),
  });

  // 지역명 → 좌표 변환 (Google Geocoding)
  const geocodeMutation = useMutation({
    mutationFn: async (area: string) => {
      const res = await api.get<{ lat: number; lng: number }>(`/bars/geocode?area=${encodeURIComponent(area)}`);
      return res.data;
    },
    onSuccess: (coords) => {
      setLocation(coords);
      setStep("survey");
    },
    onError: () => setStep("error"),
  });

  function requestLocation() {
    if (locating) return;
    if (!navigator.geolocation) {
      setStep("survey");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        setStep("survey");
      },
      () => { setLocating(false); setStep("survey"); }
    );
  }

  function handleSurveySubmit() {
    const s = survey as BarSurvey;
    if (!s.mood || !s.cocktailStyle || !s.purpose || !s.budget) return;
    setStep("loading");

    const coords = location ?? { lat: 37.4979, lng: 127.0276 }; // 강남역 기본값
    recommendMutation.mutate({ lat: coords.lat, lng: coords.lng, s });
  }

  function BarCard({ b, dark, rank }: { b: RecommendedBar; dark?: boolean; rank: number }) {
    const accent = T.accent;
    const surface = dark ? T.darkSurface : W.surface;
    const surface2 = dark ? T.darkSurface2 : "#F4F0EA";
    const border1 = dark ? T.darkBorder : W.border;
    const txt = dark ? T.darkText : W.text;
    const txtMuted = dark ? T.darkTextMuted : W.textMuted;
    const txtFaint = dark ? T.darkTextFaint : W.textFaint;
    const mono = T.mono;

    return (
      <div style={{ background: surface, border: `0.5px solid ${border1}`, borderRadius: 16, padding: "20px 20px 18px", position: "relative" }}>
        <div style={{ position: "absolute", top: 16, right: 16, fontFamily: mono, fontSize: 9, color: accent, letterSpacing: 1.4, background: dark ? T.accentTint : W.accentTint, padding: "4px 8px", borderRadius: 4 }}>
          #{rank}
        </div>
        <h3 style={{ fontSize: 19, fontWeight: 600, letterSpacing: -0.4, margin: "0 0 4px", color: txt }}>{b.name}</h3>
        <div style={{ fontSize: 12, color: txtMuted, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <span>{b.area} · {b.distanceKm}km</span>
          {b.rating && <span>★ {b.rating}</span>}
          <PriceTag level={b.priceLevel} dark={dark} />
        </div>
        {b.description && <p style={{ margin: "0 0 14px", fontSize: 13, lineHeight: 1.6, color: txt }}>{b.description}</p>}
        {b.signature && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginBottom: 14, background: surface2, borderRadius: 10 }}>
            <GlassGlyph type={pickGlass(b.signature)} size={18} color={accent} />
            <span style={{ fontSize: 12, color: txtMuted }}>
              <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: 1.4, marginRight: 8, color: txtFaint, textTransform: "uppercase" }}>SIG</span>
              {b.signature}
            </span>
          </div>
        )}
        {b.matchReasons.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {b.matchReasons.map((r) => (
              <span key={r} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 100, background: dark ? T.accentTint : W.accentTint, color: accent }}>{r}</span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {b.moodTags.map((m) => (
            <span key={m} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 100, border: `0.5px solid ${dark ? T.darkBorderStrong : W.borderStrong}`, color: txtMuted }}>{m}</span>
          ))}
        </div>
      </div>
    );
  }

  function SurveyStep({ dark }: { dark?: boolean }) {
    const txt = dark ? T.darkText : W.text;
    const txtMuted = dark ? T.darkTextMuted : W.textMuted;
    const surface2 = dark ? T.darkSurface2 : "#F4F0EA";
    const accent = T.accent;
    const border = dark ? T.darkBorderStrong : W.borderStrong;

    function Chip<T extends string>({ value, selected, onSelect }: { value: T; selected: boolean; onSelect: () => void }) {
      return (
        <button onClick={onSelect} style={{
          padding: "8px 14px", borderRadius: 100, flexShrink: 0,
          background: selected ? accent : "transparent",
          border: `0.5px solid ${selected ? accent : border}`,
          color: selected ? (dark ? T.darkBg : "#FCFBF9") : txtMuted,
          fontSize: 13, fontWeight: selected ? 600 : 500, cursor: "pointer",
          fontFamily: dark ? T.sans : W.sans,
        }}>{value}</button>
      );
    }

    const allFilled = survey.mood && survey.cocktailStyle && survey.purpose && survey.budget;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {([
          { label: "분위기", key: "mood" as const, options: MOODS },
          { label: "선호 칵테일 스타일", key: "cocktailStyle" as const, options: STYLES },
          { label: "방문 목적", key: "purpose" as const, options: PURPOSES },
          { label: "예산", key: "budget" as const, options: BUDGETS },
        ] as const).map(({ label, key, options }) => (
          <div key={key}>
            <div style={{ fontSize: 13, color: txtMuted, marginBottom: 10 }}>{label}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(options as readonly string[]).map((opt) => (
                <Chip key={opt} value={opt} selected={survey[key] === opt} onSelect={() => setSurvey((p) => ({ ...p, [key]: opt }))} />
              ))}
            </div>
          </div>
        ))}
        <button
          onClick={handleSurveySubmit}
          disabled={!allFilled}
          style={{
            marginTop: 8, padding: "14px 0", borderRadius: 12, border: "none",
            background: allFilled ? accent : surface2,
            color: allFilled ? "#FCFBF9" : txtMuted,
            fontSize: 15, fontWeight: 600, cursor: allFilled ? "pointer" : "not-allowed",
            fontFamily: dark ? T.sans : W.sans, width: "100%",
          }}
        >
          바 추천받기
        </button>
      </div>
    );
  }

  // ── WEB RENDER ──────────────────────────────────────────────────────────────
  function WebContent() {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 40px" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: W.mono, fontSize: 10, letterSpacing: 1.8, color: W.accent, marginBottom: 14, textTransform: "uppercase" }}>Bars Near You</div>
          <h1 style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1, lineHeight: 1.1, margin: "0 0 14px" }}>오늘 밤<br />당신을 위한 바.</h1>
        </div>

        {step === "location" && (
          <div style={{ maxWidth: 480 }}>
            <p style={{ color: W.textMuted, fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
              현재 위치를 기반으로 주변 칵테일 바를 추천해드려요.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button onClick={requestLocation} disabled={locating} style={{ padding: "14px 24px", borderRadius: 12, background: W.accent, border: "none", color: "#FCFBF9", fontSize: 15, fontWeight: 600, cursor: locating ? "not-allowed" : "pointer", opacity: locating ? 0.7 : 1, fontFamily: W.sans }}>
                {locating ? "위치 확인 중..." : "현재 위치 사용"}
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  placeholder="지역 직접 입력 (예: 해운대, 강남)"
                  value={manualArea}
                  onChange={(e) => setManualArea(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && manualArea && !geocodeMutation.isPending && geocodeMutation.mutate(manualArea)}
                  style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: `1px solid ${W.borderStrong}`, fontSize: 14, fontFamily: W.sans, outline: "none", background: W.surface }}
                />
                <button onClick={() => manualArea && !geocodeMutation.isPending && geocodeMutation.mutate(manualArea)} disabled={geocodeMutation.isPending || !manualArea} style={{ padding: "12px 18px", borderRadius: 10, background: W.accentTint, border: `1px solid ${W.borderStrong}`, color: W.accent, fontSize: 14, fontWeight: 600, cursor: geocodeMutation.isPending ? "not-allowed" : "pointer", opacity: geocodeMutation.isPending ? 0.6 : 1, fontFamily: W.sans }}>
                  {geocodeMutation.isPending ? "..." : "검색"}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "survey" && (
          <div style={{ maxWidth: 560 }}>
            <p style={{ color: W.textMuted, fontSize: 14, marginBottom: 28 }}>
              {location ? "위치 확인됨 ·" : "위치 없이 진행 ·"} 4가지 취향을 알려주세요.
            </p>
            <SurveyStep />
          </div>
        )}

        {step === "loading" && (
          <div style={{ textAlign: "center", padding: "80px 0", color: W.textFaint, fontFamily: W.mono, fontSize: 12, letterSpacing: 0.5 }}>
            주변 바를 분석 중이에요...
          </div>
        )}

        {step === "result" && (
          <>
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ color: W.textMuted, fontSize: 14, margin: 0 }}>취향에 맞는 바 TOP {results.length}</p>
              <button onClick={() => { setStep("location"); setSurvey({}); setResults([]); }} style={{ padding: "8px 16px", borderRadius: 100, border: `0.5px solid ${W.borderStrong}`, background: "transparent", color: W.textMuted, fontSize: 13, cursor: "pointer", fontFamily: W.sans }}>
                다시 검색
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {results.map((b, i) => <BarCard key={b.id} b={b} rank={i + 1} />)}
              {results.length === 0 && <p style={{ color: W.textMuted, fontSize: 14 }}>조건에 맞는 바가 없어요.</p>}
            </div>
          </>
        )}

        {step === "error" && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ color: W.textMuted }}>오류가 발생했어요.</p>
            <button onClick={() => setStep("location")} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 10, background: W.accent, border: "none", color: "#fff", cursor: "pointer" }}>다시 시도</button>
          </div>
        )}
      </div>
    );
  }

  // ── MOBILE RENDER ────────────────────────────────────────────────────────────
  function MobileContent() {
    return (
      <div style={{ width: "100%", minHeight: "100vh", background: T.darkBg, color: T.darkText, fontFamily: T.sans, maxWidth: 430, margin: "0 auto", paddingBottom: 90, overflowY: "auto" }}>
        <div style={{ paddingTop: 62, paddingBottom: 16, paddingLeft: 20, paddingRight: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/home" style={{ textDecoration: "none" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 4 L6 10 L12 16" stroke={T.darkText} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
          <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", color: T.darkTextMuted }}>BARS NEAR YOU</div>
          <div style={{ width: 20 }} />
        </div>

        <div style={{ padding: "8px 24px 24px" }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.6, margin: "0 0 20px", lineHeight: 1.2 }}>오늘 밤<br />당신을 위한 바.</h1>

          {step === "location" && (
            <>
              <p style={{ color: T.darkTextMuted, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>현재 위치를 기반으로 주변 칵테일 바를 추천해드려요.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={requestLocation} disabled={locating} style={{ padding: "14px", borderRadius: 12, background: T.accent, border: "none", color: T.darkBg, fontSize: 15, fontWeight: 600, cursor: locating ? "not-allowed" : "pointer", opacity: locating ? 0.7 : 1, fontFamily: T.sans }}>
                  {locating ? "위치 확인 중..." : "현재 위치 사용"}
                </button>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    placeholder="지역 직접 입력"
                    value={manualArea}
                    onChange={(e) => setManualArea(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && manualArea && !geocodeMutation.isPending && geocodeMutation.mutate(manualArea)}
                    style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: `1px solid ${T.darkBorderStrong}`, fontSize: 14, fontFamily: T.sans, outline: "none", background: T.darkSurface, color: T.darkText }}
                  />
                  <button onClick={() => manualArea && !geocodeMutation.isPending && geocodeMutation.mutate(manualArea)} disabled={geocodeMutation.isPending || !manualArea} style={{ padding: "12px 14px", borderRadius: 10, background: T.accentTint, border: `1px solid ${T.darkBorderStrong}`, color: T.accent, fontSize: 14, fontWeight: 600, cursor: geocodeMutation.isPending ? "not-allowed" : "pointer", opacity: geocodeMutation.isPending ? 0.6 : 1 }}>
                    {geocodeMutation.isPending ? "..." : "검색"}
                  </button>
                </div>
              </div>
            </>
          )}

          {step === "survey" && (
            <>
              <p style={{ color: T.darkTextMuted, fontSize: 13, marginBottom: 24 }}>
                {location ? "위치 확인됨 ·" : "위치 없이 진행 ·"} 취향을 알려주세요.
              </p>
              <SurveyStep dark />
            </>
          )}

          {step === "loading" && (
            <div style={{ textAlign: "center", padding: "60px 0", color: T.darkTextFaint, fontFamily: T.mono, fontSize: 12 }}>
              주변 바를 분석 중이에요...
            </div>
          )}

          {step === "result" && (
            <>
              <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ color: T.darkTextMuted, fontSize: 13, margin: 0 }}>취향에 맞는 바 TOP {results.length}</p>
                <button onClick={() => { setStep("location"); setSurvey({}); setResults([]); }} style={{ padding: "6px 14px", borderRadius: 100, border: `0.5px solid ${T.darkBorderStrong}`, background: "transparent", color: T.darkTextMuted, fontSize: 12, cursor: "pointer" }}>
                  다시 검색
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {results.map((b, i) => <BarCard key={b.id} b={b} dark rank={i + 1} />)}
                {results.length === 0 && <p style={{ color: T.darkTextMuted, fontSize: 14 }}>조건에 맞는 바가 없어요.</p>}
              </div>
            </>
          )}

          {step === "error" && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ color: T.darkTextMuted }}>오류가 발생했어요.</p>
              <button onClick={() => setStep("location")} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 10, background: T.accent, border: "none", color: T.darkBg, cursor: "pointer" }}>다시 시도</button>
            </div>
          )}
        </div>
        <MobileTabBar />
      </div>
    );
  }

  return (
    <>
      <div className="cordial-web" style={{ background: W.bg, minHeight: "100vh", color: W.text, fontFamily: W.sans }}>
        <WebNav active="/bars" />
        <WebContent />
      </div>
      <div className="cordial-mob">
        <MobileContent />
      </div>
    </>
  );
}
