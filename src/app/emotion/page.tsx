"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WebNav } from "@/shared/ui/WebNav";

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

const Q2_OPTIONS = ["비 오는 창가", "늦은 저녁의 부엌", "도시의 야경", "조용한 서재"] as const;
const Q3_CHIPS = ["산뜻한 시트러스", "깊은 단맛", "약간의 쓴맛", "허브향", "드라이한 끝맛", "플로럴"] as const;
const Q4_HINTS = ["평온", "약간 들뜸", "아련함", "여유롭게"] as const;

type Q2Option = (typeof Q2_OPTIONS)[number];
type Q3Chip = (typeof Q3_CHIPS)[number];

interface StepContentProps {
  theme: "dark" | "light";
  step: number;
  q1Value: number;
  setQ1Value: (v: number) => void;
  q2Selected: Q2Option | null;
  setQ2Selected: (v: Q2Option) => void;
  q3Selected: Set<Q3Chip>;
  toggleQ3: (chip: Q3Chip) => void;
  q4Text: string;
  setQ4Text: (v: string) => void;
  error: string | null;
}

function StepContent({
  theme, step,
  q1Value, setQ1Value,
  q2Selected, setQ2Selected,
  q3Selected, toggleQ3,
  q4Text, setQ4Text,
  error,
}: StepContentProps) {
  const dark = theme === "dark";
  const accent = T.accent;
  const txt = dark ? T.darkText : W.text;
  const txtMuted = dark ? T.darkTextMuted : W.textMuted;
  const txtFaint = dark ? T.darkTextFaint : W.textFaint;
  const surface = dark ? T.darkSurface : W.surface;
  const border1 = dark ? T.darkBorder : W.border;
  const borderS = dark ? T.darkBorderStrong : W.borderStrong;
  const bg = dark ? T.darkBg : W.bg;
  const sans = T.sans;
  const mono = T.mono;

  if (step === 1) return (
    <div>
      <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 1.6, color: accent, marginBottom: 14 }}>QUESTION 01</div>
      <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5, lineHeight: 1.35, margin: "0 0 10px", color: txt }}>
        오늘 하루,<br />마음의 톤은 어떤가요?
      </h2>
      <p style={{ fontSize: 13, color: txtMuted, lineHeight: 1.6, letterSpacing: -0.2, marginBottom: 48, marginTop: 0 }}>
        정확하지 않아도 괜찮아요. 가까운 쪽으로 옮겨주세요.
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 22, fontSize: 13, fontWeight: 500 }}>
        <span style={{ color: txtMuted }}>차분함</span>
        <span style={{ color: txtMuted }}>활기참</span>
      </div>
      <div style={{ position: "relative", height: 4, background: border1, borderRadius: 2 }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${q1Value}%`, background: accent, borderRadius: 2 }} />
        <input
          type="range" min={0} max={100} value={q1Value}
          onChange={e => setQ1Value(Number(e.target.value))}
          style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer", height: "100%", margin: 0 }}
        />
        <div style={{
          position: "absolute", left: `${q1Value}%`, top: "50%", transform: "translate(-50%,-50%)",
          width: 26, height: 26, borderRadius: 13,
          background: txt, boxShadow: `0 0 0 4px ${bg},0 4px 16px rgba(184,135,82,0.4)`, pointerEvents: "none",
        }} />
      </div>
      <div style={{ marginTop: 24, fontSize: 13, color: txtFaint, textAlign: "center", fontFamily: mono, letterSpacing: 0.3 }}>
        {q1Value < 30 ? "매우 차분한" : q1Value < 50 ? "조금 가라앉은" : q1Value < 70 ? "보통인" : "활기찬"} · {q1Value}
      </div>
    </div>
  );

  if (step === 2) return (
    <div>
      <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 1.6, color: accent, marginBottom: 14 }}>QUESTION 02</div>
      <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5, lineHeight: 1.35, margin: "0 0 10px", color: txt }}>
        지금 가장<br />가까운 풍경은?
      </h2>
      <p style={{ fontSize: 13, color: txtMuted, lineHeight: 1.6, letterSpacing: -0.2, marginBottom: 28, marginTop: 0 }}>
        지금 이 순간 떠오르는 장면을 고르세요.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {Q2_OPTIONS.map(opt => (
          <button key={opt} onClick={() => setQ2Selected(opt)} style={{
            padding: "20px 18px", borderRadius: 14,
            background: q2Selected === opt ? txt : surface,
            color: q2Selected === opt ? bg : txt,
            border: q2Selected === opt ? "none" : `0.5px solid ${border1}`,
            fontSize: 14, fontWeight: 500, letterSpacing: -0.2,
            cursor: "pointer", textAlign: "left", fontFamily: sans, transition: "all 0.15s",
          }}>{opt}</button>
        ))}
      </div>
    </div>
  );

  if (step === 3) return (
    <div>
      <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 1.6, color: accent, marginBottom: 14 }}>QUESTION 03</div>
      <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5, lineHeight: 1.35, margin: "0 0 10px", color: txt }}>
        오늘 어울리는<br />맛은 어떤가요?
      </h2>
      <p style={{ fontSize: 13, color: txtMuted, lineHeight: 1.6, letterSpacing: -0.2, marginBottom: 28, marginTop: 0 }}>
        여러 개 골라도 괜찮아요.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {Q3_CHIPS.map(chip => {
          const sel = q3Selected.has(chip);
          return (
            <button key={chip} onClick={() => toggleQ3(chip)} style={{
              padding: "12px 18px", borderRadius: 100,
              background: sel ? accent : "transparent",
              border: `0.5px solid ${sel ? accent : borderS}`,
              color: sel ? bg : txtMuted,
              fontSize: 13, fontWeight: sel ? 600 : 500, letterSpacing: -0.1,
              cursor: "pointer", fontFamily: sans, transition: "all 0.15s",
            }}>{chip}</button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 1.6, color: accent, marginBottom: 14 }}>QUESTION 04</div>
      <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5, lineHeight: 1.35, margin: "0 0 10px", color: txt }}>
        오늘 하루를<br />한 줄로 적어주세요.
      </h2>
      <p style={{ fontSize: 13, color: txtMuted, lineHeight: 1.6, letterSpacing: -0.2, marginBottom: 24, marginTop: 0 }}>
        짧아도, 길어도 괜찮아요. 비워둬도 돼요.
      </p>
      <div style={{ background: surface, border: `0.5px solid ${borderS}`, borderRadius: 14, padding: "18px", minHeight: 140 }}>
        <textarea
          value={q4Text}
          onChange={e => setQ4Text(e.target.value)}
          maxLength={200}
          style={{
            width: "100%", background: "transparent", border: "none", outline: "none",
            resize: "none", fontSize: 15, lineHeight: 1.65, letterSpacing: -0.2,
            color: txt, fontFamily: sans, minHeight: 100,
          }}
        />
      </div>
      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 11, color: txtFaint, fontFamily: mono, letterSpacing: 0.3 }}>
        <span>한 줄도 충분해요</span>
        <span>{q4Text.length} / 200</span>
      </div>
      <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 8 }}>
        {Q4_HINTS.map(hint => (
          <button key={hint} onClick={() => setQ4Text(q4Text ? q4Text + " " + hint : hint)} style={{
            padding: "8px 14px", borderRadius: 100,
            border: `0.5px solid ${borderS}`, background: "transparent",
            fontSize: 12, color: txtMuted, letterSpacing: -0.1, cursor: "pointer", fontFamily: sans,
          }}>{hint}</button>
        ))}
      </div>
      {error && <p style={{ marginTop: 16, color: accent, fontSize: 13 }}>{error}</p>}
    </div>
  );
}

export default function EmotionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [q1Value, setQ1Value] = useState(35);
  const [q2Selected, setQ2Selected] = useState<Q2Option | null>(null);
  const [q3Selected, setQ3Selected] = useState<Set<Q3Chip>>(new Set());
  const [q4Text, setQ4Text] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function buildEmotionText(): string {
    const moodLabel = q1Value < 30 ? "매우 차분함" : q1Value < 50 ? "차분함" : q1Value < 70 ? "보통" : "활기참";
    const scene = q2Selected ? `가장 가까운 풍경: ${q2Selected}.` : "";
    const tastes = q3Selected.size > 0 ? `선호하는 맛: ${Array.from(q3Selected).join(", ")}.` : "";
    const freeText = q4Text.trim() ? `오늘 하루: ${q4Text.trim()}.` : "";
    return [`오늘 기분의 톤: ${moodLabel} (${q1Value}/100).`, scene, tastes, freeText].filter(Boolean).join(" ");
  }

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/analyze-emotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: buildEmotionText() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data?.error || "감정 분석에 실패했습니다.");
        return;
      }
      const emotionVector = await res.json();
      sessionStorage.setItem("emotionVector", JSON.stringify(emotionVector));
      router.push("/recommend");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function next() { if (step < 4) setStep(s => s + 1); else submit(); }
  function prev() { if (step > 1) setStep(s => s - 1); else router.back(); }
  function toggleQ3(chip: Q3Chip) {
    setQ3Selected(prev => { const n = new Set(prev); n.has(chip) ? n.delete(chip) : n.add(chip); return n; });
  }

  const ctaLabel = loading ? "분석 중..." : step < 4 ? "다음" : "오늘의 한 잔 찾기";
  const progressWidth = `${(step / 4) * 100}%`;

  const stepProps: Omit<StepContentProps, "theme"> = {
    step, q1Value, setQ1Value,
    q2Selected, setQ2Selected,
    q3Selected, toggleQ3,
    q4Text, setQ4Text,
    error,
  };

  return (
    <>
      {/* ── WEB ── */}
      <div className="cordial-web" style={{ background: W.bg, minHeight: "100vh", color: W.text, fontFamily: W.sans }}>
        <WebNav active="/emotion" />
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "56px 40px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 48 }}>
            {[1, 2, 3, 4].map(n => (
              <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: n <= step ? W.accent : W.border, transition: "background 0.3s" }} />
            ))}
          </div>
          <StepContent theme="light" {...stepProps} />
          <div style={{ marginTop: 40, display: "flex", gap: 12 }}>
            {step > 1 && (
              <button onClick={prev} style={{
                padding: "0 24px", height: 52, borderRadius: 12,
                border: `0.5px solid ${W.borderStrong}`, background: "transparent",
                fontSize: 14, color: W.textMuted, fontFamily: W.sans, cursor: "pointer",
              }}>이전</button>
            )}
            <button onClick={next} disabled={loading} style={{
              flex: 1, height: 52, borderRadius: 12,
              background: W.accent, color: "#FCFBF9",
              border: "none", fontSize: 15, fontWeight: 600,
              fontFamily: W.sans, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}>{ctaLabel}</button>
          </div>
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="cordial-mob">
        <div style={{ width: "100%", minHeight: "100vh", background: T.darkBg, color: T.darkText, fontFamily: T.sans, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>
          <div style={{ paddingTop: 62, paddingBottom: 16, paddingLeft: 20, paddingRight: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <button onClick={prev} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12 4 L6 10 L12 16" stroke={T.darkText} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", color: T.darkTextMuted }}>
              {step < 4 ? `0${step} / 04` : "04 / 04"}
            </div>
            <button onClick={next} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: T.darkTextMuted, fontFamily: T.sans }}>건너뛰기</button>
          </div>

          <div style={{ padding: "0 24px", marginBottom: 40 }}>
            <div style={{ height: 2, background: T.darkBorder, borderRadius: 1, position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: progressWidth, background: T.accent, borderRadius: 1, transition: "width 0.3s" }} />
            </div>
          </div>

          <div style={{ flex: 1, padding: "0 24px" }}>
            <StepContent theme="dark" {...stepProps} />
          </div>

          <div style={{ padding: "20px 24px 40px" }}>
            <button onClick={next} disabled={loading} style={{
              width: "100%", height: 54, borderRadius: 14,
              background: T.accent, color: "#15110D",
              border: "none", fontSize: 15, fontWeight: 600, letterSpacing: -0.2,
              fontFamily: T.sans, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}>{ctaLabel}</button>
          </div>
        </div>
      </div>
    </>
  );
}
