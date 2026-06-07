"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import { CordialLogo } from "@/shared/ui/CordialLogo";
import type { DrinkingCapacity } from "@/shared/types";
import { W, T } from "@/shared/lib/theme";

const CAPACITY_OPTIONS: { value: DrinkingCapacity; label: string; sub: string }[] = [
  { value: "VERY_LOW", label: "거의 못 마셔요",  sub: "소주 1~2잔이면 충분해요 · 쉽게 취하는 편" },
  { value: "LOW",      label: "가볍게 한 잔",    sub: "소주 반 병 정도 · 조금씩 천천히 즐겨요" },
  { value: "MEDIUM",   label: "적당히 즐겨요",   sub: "소주 1병 내외 · 보통 정도예요" },
  { value: "HIGH",     label: "꽤 마시는 편",    sub: "소주 1~2병 · 잘 마시는 편이에요" },
  { value: "VERY_HIGH", label: "주량이 강해요",  sub: "소주 2병 이상 · 웬만해선 안 취해요" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { status } = useSession();
  const [selected, setSelected] = useState<DrinkingCapacity | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (drinkingCapacity: DrinkingCapacity) =>
      api.post("/user/onboarding", { drinkingCapacity }),
    onSuccess: () => router.replace("/home"),
    onError: () => setError("저장 중 오류가 발생했습니다. 다시 시도해주세요."),
  });

  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  function handleConfirm() {
    if (!selected) { setError("주량을 선택해주세요."); return; }
    mutation.mutate(selected);
  }

  const loading = mutation.isPending;

  return (
    <>
      {/* ── WEB ── */}
      <div className="cordial-web" style={{ background: W.bg, minHeight: "100vh", color: W.text, fontFamily: W.sans, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 480, width: "100%", padding: "0 40px" }}>
          <div style={{ marginBottom: 48, textAlign: "center" }}>
            <CordialLogo size={14} color={W.accent} tracking={2} />
          </div>
          <div style={{ fontFamily: W.mono, fontSize: 11, letterSpacing: 1.6, color: W.accent, marginBottom: 16, textTransform: "uppercase" }}>
            WELCOME
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.8, lineHeight: 1.3, margin: "0 0 12px", color: W.text }}>
            평소에 얼마나<br />드시는 편인가요?
          </h1>
          <p style={{ fontSize: 14, color: W.textMuted, lineHeight: 1.65, letterSpacing: -0.2, marginBottom: 40, marginTop: 0 }}>
            주량에 맞는 칵테일을 더 정확하게 추천해드릴 수 있어요.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
            {CAPACITY_OPTIONS.map(({ value, label, sub }) => {
              const sel = selected === value;
              return (
                <button
                  key={value}
                  onClick={() => { if (loading) return; setSelected(value); setError(null); }}
                  disabled={loading}
                  style={{
                    padding: "18px 24px", borderRadius: 14, textAlign: "left", cursor: loading ? "not-allowed" : "pointer",
                    background: sel ? W.text : W.surface,
                    color: sel ? W.bg : W.text,
                    border: sel ? "none" : `0.5px solid ${W.borderStrong}`,
                    fontFamily: W.sans, transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>{label}</div>
                  <div style={{ fontSize: 12, opacity: 0.62, marginTop: 4, letterSpacing: -0.1 }}>{sub}</div>
                </button>
              );
            })}
          </div>

          {error && <p style={{ color: W.accent, fontSize: 13, marginBottom: 16, letterSpacing: -0.1 }}>{error}</p>}

          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              width: "100%", height: 52, borderRadius: 12,
              background: W.accent, color: "#FCFBF9",
              border: "none", fontSize: 15, fontWeight: 600,
              fontFamily: W.sans, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
              letterSpacing: -0.2,
            }}
          >
            {loading ? "저장 중..." : "시작하기"}
          </button>
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="cordial-mob">
        <div style={{
          width: "100%", minHeight: "100vh",
          background: T.darkBg, color: T.darkText, fontFamily: T.sans,
          maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column",
          padding: "0 24px",
        }}>
          <div style={{ paddingTop: 72, paddingBottom: 16, display: "flex", justifyContent: "center" }}>
            <CordialLogo size={14} color={T.accent} tracking={2} />
          </div>

          <div style={{ flex: 1, paddingTop: 48 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.6, color: T.accent, marginBottom: 16, textTransform: "uppercase" }}>
              WELCOME
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.6, lineHeight: 1.3, margin: "0 0 12px", color: T.darkText }}>
              평소에 얼마나<br />드시는 편인가요?
            </h1>
            <p style={{ fontSize: 13, color: T.darkTextMuted, lineHeight: 1.65, letterSpacing: -0.2, marginBottom: 40, marginTop: 0 }}>
              주량에 맞는 칵테일을 더 정확하게 추천해드릴 수 있어요.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
              {CAPACITY_OPTIONS.map(({ value, label, sub }) => {
                const sel = selected === value;
                return (
                  <button
                    key={value}
                    onClick={() => { setSelected(value); setError(null); }}
                    style={{
                      padding: "16px 20px", borderRadius: 14, textAlign: "left", cursor: "pointer",
                      background: sel ? T.darkText : T.darkSurface,
                      color: sel ? T.darkBg : T.darkText,
                      border: sel ? "none" : `0.5px solid ${T.darkBorderStrong}`,
                      fontFamily: T.sans, transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>{label}</div>
                    <div style={{ fontSize: 11, opacity: 0.62, marginTop: 4, letterSpacing: -0.1 }}>{sub}</div>
                  </button>
                );
              })}
            </div>

            {error && <p style={{ color: T.accent, fontSize: 13, marginBottom: 16, letterSpacing: -0.1 }}>{error}</p>}
          </div>

          <div style={{ padding: "20px 0 48px" }}>
            <button
              onClick={handleConfirm}
              disabled={loading}
              style={{
                width: "100%", height: 54, borderRadius: 14,
                background: T.accent, color: "#15110D",
                border: "none", fontSize: 15, fontWeight: 600, letterSpacing: -0.2,
                fontFamily: T.sans, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "저장 중..." : "시작하기"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
