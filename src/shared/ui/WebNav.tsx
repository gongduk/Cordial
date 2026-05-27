"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { CordialLogo } from "./CordialLogo";

const ITEMS = [
  { label: "홈", href: "/" },
  { label: "칵테일 추천", href: "/emotion" },
  { label: "전체 칵테일", href: "/cocktails" },
  { label: "내 술장", href: "/pantry" },
  { label: "모의 제조", href: "/mix" },
  { label: "바", href: "/bars" },
] as const;

const sans = '"Pretendard Variable","Pretendard",-apple-system,BlinkMacSystemFont,sans-serif';
const text = "#1A1612";
const muted = "rgba(26,22,18,0.55)";
const accent = "#B88752";
const border = "rgba(40,30,20,0.08)";

export function WebNav({ active }: { active?: string }) {
  const { data: session, status } = useSession();

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(252,251,249,0.94)",
      backdropFilter: "blur(12px)",
      borderBottom: `0.5px solid ${border}`,
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto", padding: "0 40px",
        display: "flex", alignItems: "center", height: 60,
      }}>
        <Link href="/" style={{ textDecoration: "none", marginRight: 48, flexShrink: 0 }}>
          <CordialLogo size={13} color={text} tracking={2} />
        </Link>
        <div style={{ flex: 1, display: "flex", gap: 32 }}>
          {ITEMS.map(item => {
            const isActive = active === item.href;
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <span style={{
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  color: isActive ? text : muted,
                  fontFamily: sans, letterSpacing: -0.1,
                  paddingBottom: 4,
                  borderBottom: isActive ? `1.5px solid ${accent}` : "1.5px solid transparent",
                  display: "inline-block",
                }}>{item.label}</span>
              </Link>
            );
          })}
        </div>
        {status === "loading" ? null : session ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/mypage" style={{ textDecoration: "none" }}>
              <span style={{ fontSize: 12, color: muted, fontFamily: sans, letterSpacing: -0.1 }}>
                {session.user?.name ?? session.user?.email}
              </span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{
                padding: "7px 16px", borderRadius: 7,
                border: "0.5px solid rgba(40,30,20,0.18)",
                fontSize: 12, fontWeight: 500, color: text,
                fontFamily: sans, letterSpacing: -0.1,
                background: "none", cursor: "pointer",
              }}
            >로그아웃</button>
          </div>
        ) : (
          <Link href="/login" style={{ textDecoration: "none" }}>
            <div style={{
              padding: "7px 16px", borderRadius: 7,
              border: "0.5px solid rgba(40,30,20,0.18)",
              fontSize: 12, fontWeight: 500, color: text,
              fontFamily: sans, letterSpacing: -0.1,
            }}>로그인</div>
          </Link>
        )}
      </div>
    </nav>
  );
}
