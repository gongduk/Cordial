"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false, callbackUrl: "/home" });
      if (result?.error) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else {
        window.location.href = "/home";
      }
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
            오늘의 한 잔을 찾아드릴게요
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          <button
            onClick={() => signIn("google", { callbackUrl: "/home" })}
            style={{
              height: 48, borderRadius: 12, border: `0.5px solid ${T.borderStrong}`,
              background: T.surface, color: T.text, fontSize: 14, fontWeight: 500,
              fontFamily: T.sans, cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 10, letterSpacing: -0.1,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Google로 계속하기
          </button>

          <button
            onClick={() => signIn("github", { callbackUrl: "/home" })}
            style={{
              height: 48, borderRadius: 12, border: `0.5px solid ${T.borderStrong}`,
              background: T.surface, color: T.text, fontSize: 14, fontWeight: 500,
              fontFamily: T.sans, cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 10, letterSpacing: -0.1,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={T.text}>
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub로 계속하기
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 0.5, background: T.border }} />
          <span style={{ fontSize: 11, color: T.textFaint, fontFamily: T.mono, letterSpacing: 1 }}>OR</span>
          <div style={{ flex: 1, height: 0.5, background: T.border }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email" placeholder="이메일"
            value={email} onChange={(e) => setEmail(e.target.value)}
            required style={inputStyle}
          />
          <input
            type="password" placeholder="비밀번호"
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
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link href="/signup" style={{
            fontSize: 13, color: T.textMuted, fontFamily: T.sans,
            letterSpacing: -0.1, textDecoration: "none",
          }}>
            처음이신가요? 회원가입
          </Link>
        </div>

        <div style={{ textAlign: "center", marginTop: 12 }}>
          <button
            onClick={() => router.push("/home")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 12, color: T.textFaint, fontFamily: T.sans,
            }}
          >
            로그인 없이 계속하기
          </button>
        </div>
      </div>
    </div>
  );
}
