"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { CordialLogo } from "./CordialLogo";
import { T } from "@/shared/lib/theme";

export function LandingMobileHeader() {
  const { data: session, status } = useSession();

  return (
    <div style={{ padding: "52px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <CordialLogo size={14} color={T.accent} tracking={2} />
      {status === "loading" ? null : session ? (
        <Link href="/mypage" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 12, color: T.darkTextMuted, fontFamily: T.sans, letterSpacing: -0.1 }}>
            {session.user?.name ?? session.user?.email}님
          </span>
        </Link>
      ) : (
        <Link href="/login" style={{ fontSize: 12, color: T.darkTextMuted, textDecoration: "none", fontFamily: T.sans }}>로그인</Link>
      )}
    </div>
  );
}
