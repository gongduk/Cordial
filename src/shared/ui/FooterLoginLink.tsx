"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { W } from "@/shared/lib/theme";

export function FooterLoginLink() {
  const { data: session, status } = useSession();
  if (status === "loading" || session) return null;
  return (
    <Link href="/login" style={{ fontSize: 12, color: W.textFaint, letterSpacing: -0.1, textDecoration: "none" }}>
      로그인
    </Link>
  );
}
