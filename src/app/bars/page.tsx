"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import api from "@/shared/lib/api";
import Link from "next/link";
import { GlassGlyph } from "@/shared/ui/GlassSilhouette";
import { WebNav } from "@/shared/ui/WebNav";
import { MobileTabBar } from "@/shared/ui/MobileTabBar";
import type { GlassType } from "@/shared/ui/GlassSilhouette";
import type { RecommendedBar, BarSurvey, BarMood, CocktailStyle, BarPurpose, BarBudget } from "@/shared/types";

const C = {
  accent: "#B88752",
  accentTint: "rgba(184,135,82,0.12)",
  bg: "#FCFBF9",
  surface: "#FFFFFF",
  surface2: "#F4F0EA",
  border: "rgba(40,30,20,0.08)",
  borderStrong: "rgba(40,30,20,0.16)",
  text: "#1A1612",
  muted: "rgba(26,22,18,0.62)",
  faint: "rgba(26,22,18,0.38)",
  sans: '"Pretendard Variable","Pretendard",-apple-system,BlinkMacSystemFont,sans-serif',
  mono: '"JetBrains Mono",ui-monospace,"SF Mono",Menlo,monospace',
  darkBg: "#15110D",
  darkSurface: "#1C1814",
  darkSurface2: "#241F1A",
  darkBorder: "rgba(255,246,232,0.08)",
  darkBorderStrong: "rgba(255,246,232,0.14)",
  darkText: "#F5EFE6",
  darkMuted: "rgba(245,239,230,0.62)",
  darkFaint: "rgba(245,239,230,0.38)",
} as const;

const MOODS: BarMood[] = ["조용한", "활기찬", "로맨틱", "힙한", "클래식"];
const STYLES: CocktailStyle[] = ["달콤한", "신", "쓴", "강한", "가벼운"];
const PURPOSES: BarPurpose[] = ["혼술", "데이트", "친구모임", "비즈니스"];
const BUDGETS: BarBudget[] = ["3만원 이하", "3~5만원", "5만원 이상"];

type LocState = "pending" | "ok" | "denied";
type Step = "survey" | "loading" | "result";

function pickGlass(sig?: string | null): GlassType {
  if (!sig) return "coupe";
  const s = sig.toLowerCase();
  if (s.includes("old") || s.includes("fashion") || s.includes("whiskey")) return "rocks";
  if (s.includes("martini") || s.includes("gimlet")) return "martini";
  if (s.includes("highball") || s.includes("spritz")) return "highball";
  return "coupe";
}

function PriceTag({ level }: { level: number | null }) {
  if (!level) return null;
  return (
    <span style={{ fontFamily: C.mono, fontSize: 11, color: C.faint }}>
      {"₩".repeat(level)}{"·".repeat(Math.max(0, 4 - level))}
    </span>
  );
}

function MapController({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (map && target) {
      map.panTo(target);
      map.setZoom(16);
    }
  }, [map, target]);
  return null;
}

function NumberPin({ num, active }: { num: number; active?: boolean }) {
  return (
    <div style={{
      width: 28, height: 36, display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50% 50% 50% 0",
        transform: "rotate(-45deg)",
        background: active ? C.accent : "#555",
        border: `2px solid ${active ? "#8B6035" : "#333"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ transform: "rotate(45deg)", color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: C.mono }}>
          {num}
        </span>
      </div>
    </div>
  );
}

export default function BarsPage() {
  const [step, setStep] = useState<Step>("survey");
  const [locState, setLocState] = useState<LocState>("pending");
  const [survey, setSurvey] = useState<Partial<BarSurvey>>({});
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [results, setResults] = useState<RecommendedBar[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [infoOpen, setInfoOpen] = useState<string | null>(null);
  const [mapTarget, setMapTarget] = useState<{ lat: number; lng: number } | null>(null);

  const requestLocation = useCallback(() => {
    setLocState("pending");
    if (!navigator.geolocation) { setLocState("denied"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocState("ok");
      },
      () => setLocState("denied"),
      { timeout: 10000 }
    );
  }, []);

  useEffect(() => { requestLocation(); }, [requestLocation]);

  // 위치 확인되는 순간 파이프라인을 백그라운드에서 선제 실행
  useEffect(() => {
    if (location) {
      api.post("/bars/nearby", { lat: location.lat, lng: location.lng }).catch(() => {});
    }
  }, [location]);

  const recommendMutation = useMutation({
    mutationFn: async ({ lat, lng, s }: { lat: number; lng: number; s: BarSurvey }) => {
      const res = await api.post<RecommendedBar[]>("/bars/recommend", { lat, lng, survey: s });
      return res.data;
    },
    onSuccess: (data) => {
      setResults(data);
      setActiveIdx(0);
      setStep("result");
    },
    onError: () => alert("추천 중 오류가 발생했어요. 다시 시도해주세요."),
  });

  function handleSubmit() {
    const s = survey as BarSurvey;
    if (!s.mood || !s.cocktailStyle || !s.purpose || !s.budget) return;
    if (!location) return;
    setStep("loading");
    recommendMutation.mutate({ lat: location.lat, lng: location.lng, s });
  }

  function openMaps(b: RecommendedBar) {
    const url = b.placeId
      ? `https://www.google.com/maps/place/?q=place_id:${b.placeId}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name)}`;
    window.open(url, "_blank");
  }

  function goTo(idx: number) {
    setActiveIdx(idx);
    setInfoOpen(null);
    const bar = results[idx];
    if (bar?.latitude && bar?.longitude) {
      setMapTarget({ lat: bar.latitude, lng: bar.longitude });
    }
  }

  const activeBar = results[activeIdx] ?? null;
  const mapCenter = location ?? { lat: 37.4979, lng: 127.0276 };
  const allFilled = survey.mood && survey.cocktailStyle && survey.purpose && survey.budget;

  // ── Survey ──
  function Chip({ value, selected, onSelect }: { value: string; selected: boolean; onSelect: () => void }) {
    return (
      <button onClick={onSelect} style={{
        padding: "8px 16px", borderRadius: 100,
        background: selected ? C.accent : "transparent",
        border: `1px solid ${selected ? C.accent : C.borderStrong}`,
        color: selected ? "#fff" : C.muted,
        fontSize: 13, fontWeight: selected ? 600 : 400, cursor: "pointer", fontFamily: C.sans,
        transition: "all 0.15s",
      }}>{value}</button>
    );
  }

  function SurveyForm() {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {locState === "denied" && (
          <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(220,60,60,0.07)", border: "1px solid rgba(220,60,60,0.2)", display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ margin: 0, fontSize: 14, color: "#C43C3C", fontWeight: 600 }}>위치 정보를 동의하지 않았어요!</p>
            <p style={{ margin: 0, fontSize: 12, color: "#C43C3C", opacity: 0.8 }}>주변 바를 찾으려면 위치 접근이 필요해요.</p>
            <button
              onClick={requestLocation}
              style={{ alignSelf: "flex-start", padding: "7px 14px", borderRadius: 8, background: "#C43C3C", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: C.sans }}
            >
              위치정보 허락하기
            </button>
          </div>
        )}
        {locState === "pending" && (
          <div style={{ fontSize: 13, color: C.muted, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, display: "inline-block", animation: "pulse 1.2s infinite" }} />
            위치 확인 중...
          </div>
        )}
        {locState === "ok" && (
          <div style={{ fontSize: 13, color: C.accent, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            위치 확인됨 — 주변 바를 매칭할 준비가 됐어요.
          </div>
        )}

        {([
          { label: "분위기", key: "mood" as const, options: MOODS },
          { label: "선호 칵테일 스타일", key: "cocktailStyle" as const, options: STYLES },
          { label: "방문 목적", key: "purpose" as const, options: PURPOSES },
          { label: "예산", key: "budget" as const, options: BUDGETS },
        ] as const).map(({ label, key, options }) => (
          <div key={key}>
            <div style={{ fontSize: 11, color: C.faint, fontFamily: C.mono, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>{label}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(options as readonly string[]).map((opt) => (
                <Chip key={opt} value={opt} selected={survey[key] === opt} onSelect={() => setSurvey((p) => ({ ...p, [key]: opt }))} />
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={handleSubmit}
          disabled={!allFilled || locState !== "ok"}
          style={{
            padding: "14px 0", borderRadius: 12, border: "none",
            background: allFilled && locState === "ok" ? C.accent : C.surface2,
            color: allFilled && locState === "ok" ? "#fff" : C.faint,
            fontSize: 15, fontWeight: 600,
            cursor: allFilled && locState === "ok" ? "pointer" : "not-allowed",
            fontFamily: C.sans, width: "100%",
            transition: "all 0.2s",
          }}
        >
          {locState === "pending" ? "위치 확인 중..." : locState === "denied" ? "위치 권한 필요" : "주변 바 추천받기"}
        </button>
      </div>
    );
  }

  // ── Bar Detail Card ──
  function BarDetailCard({ b, rank, dark }: { b: RecommendedBar; rank: number; dark?: boolean }) {
    const txt = dark ? C.darkText : C.text;
    const muted = dark ? C.darkMuted : C.muted;
    const faint = dark ? C.darkFaint : C.faint;
    const surface2 = dark ? C.darkSurface2 : C.surface2;
    const borderStrong = dark ? C.darkBorderStrong : C.borderStrong;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: C.mono, fontSize: 10, color: C.accent, background: C.accentTint, padding: "2px 8px", borderRadius: 4, letterSpacing: 1 }}>#{rank}</span>
              {b.rating && <span style={{ fontSize: 12, color: muted }}>★ {b.rating}</span>}
              <PriceTag level={b.priceLevel} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, margin: 0, color: txt }}>{b.name}</h2>
            <p style={{ fontSize: 12, color: muted, margin: "4px 0 0" }}>{b.area} · {b.distanceKm}km</p>
          </div>
          <button
            onClick={() => openMaps(b)}
            style={{ flexShrink: 0, padding: "8px 12px", borderRadius: 10, border: `1px solid ${borderStrong}`, background: "transparent", color: muted, fontSize: 12, cursor: "pointer", fontFamily: C.sans, display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>
            Google Maps
          </button>
        </div>

        {b.description && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: txt }}>{b.description}</p>}

        {b.signature && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: surface2, borderRadius: 10 }}>
            <GlassGlyph type={pickGlass(b.signature)} size={18} color={C.accent} />
            <div>
              <div style={{ fontSize: 10, fontFamily: C.mono, letterSpacing: 1.2, color: faint, textTransform: "uppercase", marginBottom: 2 }}>Signature</div>
              <div style={{ fontSize: 13, color: txt, fontWeight: 500 }}>{b.signature}</div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {b.matchReasons.map((r) => (
            <span key={r} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 100, background: C.accentTint, color: C.accent }}>{r}</span>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {b.moodTags.map((m) => (
            <span key={m} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 100, border: `1px solid ${borderStrong}`, color: muted }}>{m}</span>
          ))}
          {b.cocktailStyles.map((s) => (
            <span key={s} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 100, border: `1px solid ${borderStrong}`, color: muted }}>🍹 {s}</span>
          ))}
        </div>
      </div>
    );
  }

  // ── WEB ──────────────────────────────────────────────────────────────────────
  function WebContent() {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 40px" }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: C.mono, fontSize: 10, letterSpacing: 1.8, color: C.accent, marginBottom: 12, textTransform: "uppercase" }}>Bars Near You</div>
          <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1, lineHeight: 1.1, margin: 0 }}>오늘 밤<br />당신을 위한 바.</h1>
        </div>

        {step === "survey" && (
          <div style={{ maxWidth: 520 }}>
            <SurveyForm />
          </div>
        )}

        {step === "loading" && (
          <div style={{ textAlign: "center", padding: "100px 0", color: C.faint, fontFamily: C.mono, fontSize: 12, letterSpacing: 0.5 }}>
            주변 바를 분석하고 있어요...
          </div>
        )}

        {step === "result" && results.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 24, alignItems: "start" }}>
            {/* 지도 */}
            <div style={{ borderRadius: 20, overflow: "hidden", border: `1px solid ${C.border}`, height: 580, position: "sticky", top: 20 }}>
              <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}>
                <Map
                  defaultCenter={mapCenter}
                  defaultZoom={14}
                  mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
                  style={{ width: "100%", height: "100%" }}
                  gestureHandling="greedy"
                  onCameraChanged={() => {}}
                >
                  <MapController target={mapTarget} />
                  {/* 내 위치 */}
                  {location && (
                    <AdvancedMarker position={location} title="현재 위치">
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#4285F4", border: "3px solid #fff", boxShadow: "0 2px 8px rgba(66,133,244,0.5)" }} />
                    </AdvancedMarker>
                  )}
                  {/* 바 마커 */}
                  {results.map((b, i) => b.latitude && b.longitude && (
                    <AdvancedMarker
                      key={b.id}
                      position={{ lat: b.latitude, lng: b.longitude }}
                      onClick={() => { goTo(i); setInfoOpen(b.id); }}
                    >
                      <NumberPin num={i + 1} active={activeIdx === i} />
                    </AdvancedMarker>
                  ))}
                  {/* InfoWindow */}
                  {infoOpen && (() => {
                    const b = results.find((r) => r.id === infoOpen);
                    if (!b?.latitude || !b?.longitude) return null;
                    return (
                      <InfoWindow
                        position={{ lat: b.latitude, lng: b.longitude }}
                        onCloseClick={() => setInfoOpen(null)}
                      >
                        <div style={{ fontFamily: C.sans, minWidth: 160 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{b.name}</div>
                          <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>{b.distanceKm}km · {b.area}</div>
                          <button onClick={() => openMaps(b)} style={{ padding: "5px 10px", borderRadius: 6, background: C.accent, border: "none", color: "#fff", fontSize: 11, cursor: "pointer" }}>
                            Google Maps에서 보기
                          </button>
                        </div>
                      </InfoWindow>
                    );
                  })()}
                </Map>
              </APIProvider>
            </div>

            {/* 우측 패널 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: C.muted }}>취향에 맞는 바 TOP {results.length}</span>
                <button onClick={() => { setStep("survey"); setSurvey({}); setResults([]); }} style={{ padding: "6px 14px", borderRadius: 100, border: `1px solid ${C.borderStrong}`, background: "transparent", color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: C.sans }}>
                  다시 검색
                </button>
              </div>

              {activeBar && (
                <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px 20px 18px" }}>
                  <BarDetailCard b={activeBar} rank={activeIdx + 1} />
                </div>
              )}

              {/* 화살표 네비 */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <button
                  onClick={() => goTo(activeIdx - 1)}
                  disabled={activeIdx === 0}
                  style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${C.borderStrong}`, background: "transparent", color: activeIdx === 0 ? C.faint : C.text, fontSize: 18, cursor: activeIdx === 0 ? "not-allowed" : "pointer", opacity: activeIdx === 0 ? 0.4 : 1 }}
                >
                  ←
                </button>
                <span style={{ fontSize: 12, color: C.muted, fontFamily: C.mono, minWidth: 50, textAlign: "center" }}>
                  {activeIdx + 1} / {results.length}
                </span>
                <button
                  onClick={() => goTo(activeIdx + 1)}
                  disabled={activeIdx === results.length - 1}
                  style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${C.borderStrong}`, background: "transparent", color: activeIdx === results.length - 1 ? C.faint : C.text, fontSize: 18, cursor: activeIdx === results.length - 1 ? "not-allowed" : "pointer", opacity: activeIdx === results.length - 1 ? 0.4 : 1 }}
                >
                  →
                </button>
              </div>

              {/* 목록 미리보기 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {results.map((b, i) => (
                  <button
                    key={b.id}
                    onClick={() => goTo(i)}
                    style={{
                      padding: "12px 14px", borderRadius: 10, border: `1px solid ${i === activeIdx ? C.accent : C.border}`,
                      background: i === activeIdx ? C.accentTint : "transparent",
                      textAlign: "left", cursor: "pointer", fontFamily: C.sans,
                      display: "flex", alignItems: "center", gap: 10,
                    }}
                  >
                    <span style={{ fontFamily: C.mono, fontSize: 11, color: C.accent, minWidth: 20 }}>#{i + 1}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{b.distanceKm}km · {b.moodTags[0]}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === "result" && results.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ color: C.muted, fontSize: 15 }}>조건에 맞는 바가 없어요.</p>
            <button onClick={() => { setStep("survey"); setSurvey({}); }} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 10, background: C.accent, border: "none", color: "#fff", cursor: "pointer", fontFamily: C.sans }}>
              다시 검색
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── MOBILE ───────────────────────────────────────────────────────────────────
  function MobileContent() {
    return (
      <div style={{ width: "100%", minHeight: "100vh", background: C.darkBg, color: C.darkText, fontFamily: C.sans, maxWidth: 430, margin: "0 auto", paddingBottom: 90 }}>
        <div style={{ paddingTop: 60, paddingLeft: 20, paddingRight: 20, paddingBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/home" style={{ textDecoration: "none" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 4L6 10L12 16" stroke={C.darkText} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
          <div style={{ fontFamily: C.mono, fontSize: 10, letterSpacing: 1.6, textTransform: "uppercase", color: C.darkMuted }}>Bars Near You</div>
          <div style={{ width: 20 }} />
        </div>

        {step === "survey" && (
          <div style={{ padding: "0 20px" }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.6, margin: "0 0 24px", lineHeight: 1.2 }}>오늘 밤<br />당신을 위한 바.</h1>

            {locState === "denied" && (
              <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(220,60,60,0.1)", border: "1px solid rgba(220,60,60,0.25)", marginBottom: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ margin: 0, fontSize: 14, color: "#E05555", fontWeight: 600 }}>위치 정보를 동의하지 않았어요!</p>
                <button onClick={requestLocation} style={{ alignSelf: "flex-start", padding: "7px 14px", borderRadius: 8, background: "#E05555", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: C.sans }}>
                  위치정보 허락하기
                </button>
              </div>
            )}
            {locState === "pending" && (
              <p style={{ fontSize: 12, color: C.darkMuted, marginBottom: 20 }}>📍 위치 확인 중...</p>
            )}
            {locState === "ok" && (
              <p style={{ fontSize: 12, color: C.accent, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                위치 확인됨
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {([
                { label: "분위기", key: "mood" as const, options: MOODS },
                { label: "선호 칵테일 스타일", key: "cocktailStyle" as const, options: STYLES },
                { label: "방문 목적", key: "purpose" as const, options: PURPOSES },
                { label: "예산", key: "budget" as const, options: BUDGETS },
              ] as const).map(({ label, key, options }) => (
                <div key={key}>
                  <div style={{ fontSize: 10, color: C.darkFaint, fontFamily: C.mono, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>{label}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {(options as readonly string[]).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSurvey((p) => ({ ...p, [key]: opt }))}
                        style={{
                          padding: "7px 14px", borderRadius: 100,
                          background: survey[key] === opt ? C.accent : "transparent",
                          border: `1px solid ${survey[key] === opt ? C.accent : C.darkBorderStrong}`,
                          color: survey[key] === opt ? C.darkBg : C.darkMuted,
                          fontSize: 13, fontWeight: survey[key] === opt ? 600 : 400, cursor: "pointer", fontFamily: C.sans,
                        }}
                      >{opt}</button>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={handleSubmit}
                disabled={!allFilled || locState !== "ok"}
                style={{
                  padding: "14px", borderRadius: 12, border: "none", width: "100%",
                  background: allFilled && locState === "ok" ? C.accent : C.darkSurface2,
                  color: allFilled && locState === "ok" ? C.darkBg : C.darkFaint,
                  fontSize: 15, fontWeight: 600,
                  cursor: allFilled && locState === "ok" ? "pointer" : "not-allowed",
                  fontFamily: C.sans,
                }}
              >
                {locState === "pending" ? "위치 확인 중..." : locState === "denied" ? "위치 권한 필요" : "주변 바 추천받기"}
              </button>
            </div>
          </div>
        )}

        {step === "loading" && (
          <div style={{ textAlign: "center", padding: "80px 0", color: C.darkFaint, fontFamily: C.mono, fontSize: 12 }}>
            주변 바를 분석하고 있어요...
          </div>
        )}

        {step === "result" && results.length > 0 && (
          <>
            {/* 지도 */}
            <div style={{ height: 300, width: "100%" }}>
              <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}>
                <Map
                  defaultCenter={mapCenter}
                  defaultZoom={14}
                  mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
                  style={{ width: "100%", height: "100%" }}
                  gestureHandling="greedy"
                  disableDefaultUI
                >
                  <MapController target={mapTarget} />
                  {location && (
                    <AdvancedMarker position={location}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#4285F4", border: "2px solid #fff", boxShadow: "0 2px 6px rgba(66,133,244,0.5)" }} />
                    </AdvancedMarker>
                  )}
                  {results.map((b, i) => b.latitude && b.longitude && (
                    <AdvancedMarker key={b.id} position={{ lat: b.latitude, lng: b.longitude }} onClick={() => goTo(i)}>
                      <NumberPin num={i + 1} active={activeIdx === i} />
                    </AdvancedMarker>
                  ))}
                </Map>
              </APIProvider>
            </div>

            {/* 하단 카드 */}
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              {/* 화살표 네비 */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={() => goTo(activeIdx - 1)} disabled={activeIdx === 0} style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.darkBorderStrong}`, background: "transparent", color: activeIdx === 0 ? C.darkFaint : C.darkText, fontSize: 18, cursor: activeIdx === 0 ? "not-allowed" : "pointer", opacity: activeIdx === 0 ? 0.3 : 1 }}>←</button>
                <span style={{ flex: 1, textAlign: "center", fontSize: 12, color: C.darkMuted, fontFamily: C.mono }}>{activeIdx + 1} / {results.length}</span>
                <button onClick={() => goTo(activeIdx + 1)} disabled={activeIdx === results.length - 1} style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.darkBorderStrong}`, background: "transparent", color: activeIdx === results.length - 1 ? C.darkFaint : C.darkText, fontSize: 18, cursor: activeIdx === results.length - 1 ? "not-allowed" : "pointer", opacity: activeIdx === results.length - 1 ? 0.3 : 1 }}>→</button>
              </div>

              {activeBar && (
                <div style={{ background: C.darkSurface, borderRadius: 16, border: `1px solid ${C.darkBorder}`, padding: "16px" }}>
                  <BarDetailCard b={activeBar} rank={activeIdx + 1} dark />
                </div>
              )}

              <button onClick={() => { setStep("survey"); setSurvey({}); setResults([]); }} style={{ padding: "10px", borderRadius: 10, border: `1px solid ${C.darkBorderStrong}`, background: "transparent", color: C.darkMuted, fontSize: 13, cursor: "pointer" }}>
                다시 검색
              </button>
            </div>
          </>
        )}

        <MobileTabBar />
      </div>
    );
  }

  return (
    <>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      <div className="cordial-web" style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: C.sans }}>
        <WebNav active="/bars" />
        {WebContent()}
      </div>
      <div className="cordial-mob">
        {MobileContent()}
      </div>
    </>
  );
}
