import Link from "next/link";
import { GlassSilhouette } from "@/shared/ui/GlassSilhouette";
import { CordialLogo } from "@/shared/ui/CordialLogo";

const T = {
  accent: "#B88752",
  lightBg: "#FCFBF9",
  lightSurface: "#FFFFFF",
  lightSurface2: "#F4F0EA",
  lightBorder: "rgba(40, 30, 20, 0.08)",
  lightBorderStrong: "rgba(40, 30, 20, 0.16)",
  lightText: "#1A1612",
  lightTextMuted: "rgba(26, 22, 18, 0.62)",
  lightTextFaint: "rgba(26, 22, 18, 0.38)",
  sans: '"Pretendard Variable", "Pretendard", -apple-system, BlinkMacSystemFont, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
} as const;

const NAV_ITEMS = [
  { id: "home", label: "홈", href: "/" },
  { id: "mood", label: "감정 추천", href: "/emotion" },
  { id: "pantry", label: "내 술장", href: "/pantry" },
  { id: "mix", label: "모의 제조", href: "/mix" },
  { id: "bars", label: "바", href: "/bars" },
] as const;

const FEATURES = [
  { num: "01", glass: "martini" as const, name: "감정 추천", desc: "4가지 질문에 답하면 감정에 맞는 칵테일 Top 3와 추천 이유를 받을 수 있어요.", fill: 0.65, href: "/emotion" },
  { num: "02", glass: "rocks" as const, name: "내 술로 추천", desc: "술장에 있는 재료를 등록하세요. 지금 만들 수 있는 칵테일을 찾아드려요.", fill: 0.78, href: "/pantry" },
  { num: "03", glass: "highball" as const, name: "모의 제조", desc: "재료를 자유롭게 조합하면 예상되는 맛과 도수, 향까지 분석해 드려요.", fill: 0.55, href: "/mix" },
  { num: "04", glass: "coupe" as const, name: "바 매칭", desc: "원하는 분위기와 칵테일을 알려주세요. 주변의 어울리는 바를 매칭해요.", fill: 0.5, href: "/bars" },
] as const;

export default function LandingPage() {
  return (
    <div style={{ background: T.lightBg, color: T.lightText, fontFamily: T.sans, minHeight: "100vh" }}>
      {/* Nav */}
      <nav style={{
        padding: "20px 56px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `0.5px solid ${T.lightBorder}`,
        background: T.lightBg,
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <CordialLogo size={15} color={T.lightText} tracking={2} />
        <div style={{ display: "flex", gap: 32 }}>
          {NAV_ITEMS.map(({ id, label, href }) => (
            <Link key={id} href={href} style={{
              fontSize: 13, fontWeight: id === "home" ? 600 : 500,
              color: id === "home" ? T.lightText : T.lightTextMuted,
              letterSpacing: -0.1, textDecoration: "none",
              paddingBottom: 4,
              borderBottom: id === "home" ? `1.5px solid ${T.accent}` : "1.5px solid transparent",
            }}>{label}</Link>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/emotion" style={{
            padding: "8px 18px", borderRadius: 8,
            background: T.lightText, color: T.lightBg,
            fontSize: 13, fontWeight: 600, letterSpacing: -0.1, textDecoration: "none",
            fontFamily: T.sans,
          }}>시작하기</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        padding: "100px 56px 80px",
        display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 60, alignItems: "center",
        maxWidth: 1280, margin: "0 auto",
      }}>
        <div>
          <div style={{
            fontFamily: T.mono, fontSize: 11, letterSpacing: 1.8,
            color: T.accent, marginBottom: 22, textTransform: "uppercase",
          }}>AI BARTENDER · BETA</div>
          <h1 style={{
            fontSize: 64, fontWeight: 600, letterSpacing: -1.6,
            lineHeight: 1.05, margin: 0, color: T.lightText,
          }}>
            오늘의 당신을<br />
            <span style={{ color: T.accent }}>한 잔</span>으로<br />
            읽어드릴게요.
          </h1>
          <p style={{
            fontSize: 17, color: T.lightTextMuted, marginTop: 28,
            lineHeight: 1.65, letterSpacing: -0.2, maxWidth: 460,
          }}>
            네 가지 짧은 질문에 답하세요. AI 바텐더가 당신의 감정을 읽고
            오늘 밤 어울릴 칵테일 세 잔을 골라드려요.
          </p>
          <div style={{ marginTop: 40, display: "flex", gap: 14, alignItems: "center" }}>
            <Link href="/emotion" style={{
              padding: "14px 28px", borderRadius: 10,
              background: T.lightText, color: T.lightBg,
              fontSize: 14, fontWeight: 600, letterSpacing: -0.1, textDecoration: "none",
              fontFamily: T.sans,
            }}>오늘의 한 잔 찾기</Link>
            <Link href="/pantry" style={{
              padding: "14px 24px", borderRadius: 10,
              background: "transparent", color: T.lightText,
              border: `0.5px solid ${T.lightBorderStrong}`,
              fontSize: 14, fontWeight: 500, letterSpacing: -0.1, textDecoration: "none",
              fontFamily: T.sans,
            }}>레시피 둘러보기</Link>
          </div>
          <div style={{
            marginTop: 32, fontFamily: T.mono, fontSize: 11,
            color: T.lightTextFaint, letterSpacing: 0.4,
          }}>2,400+ COCKTAILS · 320 BARS · KOREA</div>
        </div>

        {/* Glass visuals */}
        <div style={{
          display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 24,
          height: 480,
        }}>
          <div style={{ paddingBottom: 60 }}>
            <GlassSilhouette type="coupe" size={140} stroke={T.accent} liquid={T.accent} fillLevel={0.55} garnish strokeWidth={1.1} />
          </div>
          <div>
            <GlassSilhouette type="martini" size={170} stroke={T.accent} liquid={T.accent} fillLevel={0.65} garnish strokeWidth={1.1} />
          </div>
          <div style={{ paddingBottom: 80 }}>
            <GlassSilhouette type="rocks" size={120} stroke={T.accent} liquid={T.accent} fillLevel={0.78} strokeWidth={1.1} />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{
        padding: "60px 56px 100px", maxWidth: 1280, margin: "0 auto",
        borderTop: `0.5px solid ${T.lightBorder}`,
      }}>
        <div style={{
          fontFamily: T.mono, fontSize: 11, letterSpacing: 1.8,
          color: T.accent, marginBottom: 16, textTransform: "uppercase",
        }}>HOW IT WORKS</div>
        <h2 style={{
          fontSize: 36, fontWeight: 600, letterSpacing: -0.8,
          margin: 0, marginBottom: 64, lineHeight: 1.2, maxWidth: 700,
        }}>
          기분, 재료, 조합, 그리고 바.<br />
          <span style={{ color: T.lightTextMuted }}>네 가지 방식으로 한 잔을 만나요.</span>
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
          {FEATURES.map((f) => (
            <Link key={f.num} href={f.href} style={{ textDecoration: "none" }}>
              <div style={{
                background: T.lightSurface,
                border: `0.5px solid ${T.lightBorder}`,
                borderRadius: 18, padding: "32px 28px 28px",
                display: "flex", flexDirection: "column", gap: 20,
                minHeight: 320, cursor: "pointer",
                transition: "box-shadow 0.15s",
              }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.accent, letterSpacing: 1.4 }}>{f.num}</div>
                <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
                  <GlassSilhouette type={f.glass} size={86} stroke={T.accent} liquid={T.accent} fillLevel={f.fill} strokeWidth={1.3} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.3, marginBottom: 8, color: T.lightText }}>{f.name}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.65, letterSpacing: -0.15, color: T.lightTextMuted }}>{f.desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Philosophy quote */}
      <section style={{
        padding: "80px 56px",
        background: T.lightSurface2,
        borderTop: `0.5px solid ${T.lightBorder}`,
        borderBottom: `0.5px solid ${T.lightBorder}`,
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div style={{
            fontFamily: T.mono, fontSize: 11, letterSpacing: 1.8,
            color: T.accent, marginBottom: 24, textTransform: "uppercase",
          }}>OUR PHILOSOPHY</div>
          <p style={{
            margin: 0, fontSize: 28, fontWeight: 500, lineHeight: 1.45,
            letterSpacing: -0.5, color: T.lightText,
          }}>
            &ldquo;좋은 바텐더는 칵테일을 만들기 전에<br />
            손님을 먼저 읽습니다. Cordial은 그 한 호흡을<br />
            모두에게 건네고 싶었어요.&rdquo;
          </p>
          <div style={{ marginTop: 28, fontSize: 13, color: T.lightTextMuted, letterSpacing: -0.1 }}>
            — 이도현, Founder &amp; Head Bartender
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: "40px 56px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        maxWidth: 1280, margin: "0 auto",
      }}>
        <CordialLogo size={13} color={T.lightTextMuted} tracking={2} />
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <Link href="/login" style={{ fontSize: 12, color: T.lightTextFaint, letterSpacing: -0.1, textDecoration: "none" }}>
            로그인
          </Link>
          <div style={{
            fontFamily: T.mono, fontSize: 10,
            color: T.lightTextFaint, letterSpacing: 1.4,
          }}>© 2026 · DRINK RESPONSIBLY</div>
        </div>
      </footer>
    </div>
  );
}
