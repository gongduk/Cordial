"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CordialLogo } from "@/shared/ui/CordialLogo";

const T = {
  accent: "#B88752",
  bg: "#15110D",
  surface: "#1C1814",
  border: "rgba(255,246,232,0.08)",
  borderStrong: "rgba(255,246,232,0.14)",
  text: "#F5EFE6",
  textMuted: "rgba(245,239,230,0.62)",
  textFaint: "rgba(245,239,230,0.38)",
  sans: '"Pretendard Variable","Pretendard",-apple-system,BlinkMacSystemFont,sans-serif',
  mono: '"JetBrains Mono",ui-monospace,"SF Mono",Menlo,monospace',
} as const;

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "회원가입에 실패했습니다."); return; }
      router.push("/login?registered=1");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    height: 48, borderRadius: 12, border: `0.5px solid ${T.borderStrong}`,
    background: T.surface, color: T.text, fontSize: 14, fontFamily: T.sans,
    padding: "0 16px", outline: "none", letterSpacing: -0.1, width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, color: T.text,
      fontFamily: T.sans, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <CordialLogo size={16} color={T.accent} tracking={2} />
          <p style={{ fontSize: 13, color: T.textMuted, marginTop: 12, letterSpacing: -0.1 }}>
            계정을 만들어 개인화 추천을 받아보세요
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="text" placeholder="이름 (선택)"
            value={name} onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
          <input
            type="email" placeholder="이메일"
            value={email} onChange={(e) => setEmail(e.target.value)}
            required style={inputStyle}
          />
          <input
            type="password" placeholder="비밀번호 (8자 이상)"
            value={password} onChange={(e) => setPassword(e.target.value)}
            required style={inputStyle}
          />

          {error && (
            <p style={{ fontSize: 13, color: "#E57373", margin: 0, letterSpacing: -0.1 }}>{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              height: 48, borderRadius: 12, background: T.accent, color: T.bg,
              border: "none", fontSize: 15, fontWeight: 600, fontFamily: T.sans,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
              letterSpacing: -0.2, marginTop: 4,
            }}
          >
            {loading ? "처리 중..." : "회원가입"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link href="/login" style={{
            fontSize: 13, color: T.textMuted, fontFamily: T.sans,
            letterSpacing: -0.1, textDecoration: "none",
          }}>
            이미 계정이 있어요 · 로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
