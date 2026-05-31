"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/shared/lib/api";
import { WebNav } from "@/shared/ui/WebNav";
import { GlassGlyph } from "@/shared/ui/GlassSilhouette";
import type { DrinkingCapacity } from "@/shared/types";
import type { GlassType } from "@/shared/ui/GlassSilhouette";

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

const TABS = [
  { id: "home", label: "홈", glass: "martini" as GlassType, href: "/home" },
  { id: "pantry", label: "내 술장", glass: "rocks" as GlassType, href: "/pantry" },
  { id: "mix", label: "모의 제조", glass: "highball" as GlassType, href: "/mix" },
  { id: "bars", label: "바", glass: "coupe" as GlassType, href: "/bars" },
] as const;

interface Profile {
  name: string | null;
  email: string | null;
  drinkingCapacity: DrinkingCapacity;
  sweetPref: number;
  sourPref: number;
  bitterPref: number;
  strongPref: number;
  freshPref: number;
}

const CAPACITY_OPTIONS: { value: DrinkingCapacity; label: string; sub: string }[] = [
  { value: "LOW", label: "가볍게", sub: "1~2잔" },
  { value: "MEDIUM", label: "적당히", sub: "2~4잔" },
  { value: "HIGH", label: "오늘은 좀", sub: "4잔 이상" },
];

const FLAVOR_KEYS: { key: keyof Omit<Profile, "name" | "email" | "drinkingCapacity">; label: string }[] = [
  { key: "sweetPref", label: "달콤함" },
  { key: "sourPref", label: "새콤함" },
  { key: "bitterPref", label: "쌉쌀함" },
  { key: "strongPref", label: "독함" },
  { key: "freshPref", label: "청량함" },
];

export default function MyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const { isLoading: loading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<Profile>("/user/profile").then(r => r.data),
    enabled: status === "authenticated",
    onSuccess: (data: Profile) => setProfile(data),
  } as Parameters<typeof useQuery>[0]);

  const saveMutation = useMutation({
    mutationFn: (data: Omit<Profile, "name" | "email">) => api.patch("/user/profile", data),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });

  const saving = saveMutation.isPending;

  function handleSave() {
    if (!profile) return;
    const { drinkingCapacity, sweetPref, sourPref, bitterPref, strongPref, freshPref } = profile;
    saveMutation.mutate({ drinkingCapacity, sweetPref, sourPref, bitterPref, strongPref, freshPref });
  }

  function setPref(key: keyof Profile, value: number) {
    setProfile(p => p ? { ...p, [key]: value } : p);
  }

  const isLoading = status === "loading" || loading;

  return (
    <>
      {/* ── WEB ── */}
      <div className="cordial-web" style={{ background: W.bg, minHeight: "100vh", fontFamily: W.sans, color: W.text }}>
        <WebNav active="/mypage" />
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 60px)" }}>
            <p style={{ color: W.textMuted, fontSize: 14 }}>불러오는 중...</p>
          </div>
        ) : !profile ? null : (
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px" }}>
            <div style={{ marginBottom: 40 }}>
              <div style={{ fontFamily: W.mono, fontSize: 11, letterSpacing: 1.8, color: W.accent, marginBottom: 10, textTransform: "uppercase" }}>MY PROFILE</div>
              <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.6, margin: 0 }}>
                {session?.user?.name ?? session?.user?.email ?? "내 프로필"}
              </h1>
              {session?.user?.email && session?.user?.name && (
                <p style={{ fontSize: 13, color: W.textMuted, marginTop: 6, letterSpacing: -0.1 }}>{session.user.email}</p>
              )}
            </div>

            <section style={{ marginBottom: 40 }}>
              <div style={{ fontFamily: W.mono, fontSize: 10, letterSpacing: 1.4, color: W.textMuted, marginBottom: 16, textTransform: "uppercase" }}>주량</div>
              <div style={{ display: "flex", gap: 10 }}>
                {CAPACITY_OPTIONS.map(opt => {
                  const active = profile.drinkingCapacity === opt.value;
                  return (
                    <button key={opt.value} onClick={() => setProfile(p => p ? { ...p, drinkingCapacity: opt.value } : p)} style={{
                      flex: 1, padding: "14px 12px", borderRadius: 12,
                      border: `1px solid ${active ? W.accent : W.borderStrong}`,
                      background: active ? `${W.accent}14` : W.surface,
                      cursor: "pointer", textAlign: "center",
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: active ? W.accent : W.text, letterSpacing: -0.2, fontFamily: W.sans }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: W.textFaint, marginTop: 2, fontFamily: W.mono }}>{opt.sub}</div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section style={{ marginBottom: 48 }}>
              <div style={{ fontFamily: W.mono, fontSize: 10, letterSpacing: 1.4, color: W.textMuted, marginBottom: 16, textTransform: "uppercase" }}>맛 취향</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {FLAVOR_KEYS.map(({ key, label }) => {
                  const val = profile[key] as number;
                  return (
                    <div key={key}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontSize: 13, letterSpacing: -0.1 }}>{label}</span>
                        <span style={{ fontFamily: W.mono, fontSize: 11, color: W.textFaint }}>{Math.round(val * 10) / 10}</span>
                      </div>
                      <input type="range" min={0} max={1} step={0.05} value={val}
                        onChange={e => setPref(key, parseFloat(e.target.value))}
                        style={{ width: "100%", accentColor: W.accent }} />
                    </div>
                  );
                })}
              </div>
            </section>

            <button onClick={handleSave} disabled={saving} style={{
              width: "100%", height: 52, borderRadius: 12,
              background: saved ? "#4CAF50" : W.text, color: W.bg,
              border: "none", fontSize: 15, fontWeight: 600, letterSpacing: -0.2,
              fontFamily: W.sans, cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1, transition: "background 0.3s",
            }}>
              {saving ? "저장 중..." : saved ? "저장됨" : "저장하기"}
            </button>
          </div>
        )}
      </div>

      {/* ── MOBILE ── */}
      <div className="cordial-mob">
        <div style={{ width: "100%", minHeight: "100vh", background: T.darkBg, color: T.darkText, fontFamily: T.sans, maxWidth: 430, margin: "0 auto", paddingBottom: 90 }}>
          {/* Header */}
          <div style={{ paddingTop: 62, paddingBottom: 16, paddingLeft: 20, paddingRight: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/home" style={{ textDecoration: "none", display: "flex" }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12 4 L6 10 L12 16" stroke={T.darkText} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", color: T.darkTextMuted }}>MY PROFILE</div>
            <div style={{ width: 20 }} />
          </div>

          {isLoading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: T.darkTextMuted, fontSize: 14 }}>불러오는 중...</div>
          ) : !profile ? null : (
            <div style={{ padding: "8px 24px" }}>
              {/* Profile info */}
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.4, margin: 0, color: T.darkText }}>
                  {session?.user?.name ?? session?.user?.email ?? "내 프로필"}
                </h1>
                {session?.user?.email && session?.user?.name && (
                  <p style={{ fontSize: 13, color: T.darkTextMuted, marginTop: 4 }}>{session.user.email}</p>
                )}
              </div>

              {/* Drinking capacity */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, color: T.darkTextMuted, marginBottom: 14, textTransform: "uppercase" }}>주량</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {CAPACITY_OPTIONS.map(opt => {
                    const active = profile.drinkingCapacity === opt.value;
                    return (
                      <button key={opt.value} onClick={() => setProfile(p => p ? { ...p, drinkingCapacity: opt.value } : p)} style={{
                        flex: 1, padding: "12px 8px", borderRadius: 12,
                        border: `0.5px solid ${active ? T.accent : T.darkBorderStrong}`,
                        background: active ? `${T.accent}22` : T.darkSurface,
                        cursor: "pointer", textAlign: "center",
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: active ? T.accent : T.darkText }}>{opt.label}</div>
                        <div style={{ fontSize: 11, color: T.darkTextFaint, marginTop: 2, fontFamily: T.mono }}>{opt.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Flavor preferences */}
              <div style={{ marginBottom: 36 }}>
                <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, color: T.darkTextMuted, marginBottom: 16, textTransform: "uppercase" }}>맛 취향</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {FLAVOR_KEYS.map(({ key, label }) => {
                    const val = profile[key] as number;
                    return (
                      <div key={key}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ fontSize: 13, color: T.darkText }}>{label}</span>
                          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.darkTextFaint }}>{Math.round(val * 10) / 10}</span>
                        </div>
                        <input type="range" min={0} max={1} step={0.05} value={val}
                          onChange={e => setPref(key, parseFloat(e.target.value))}
                          style={{ width: "100%", accentColor: T.accent }} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Save button */}
              <button onClick={handleSave} disabled={saving} style={{
                width: "100%", height: 52, borderRadius: 12,
                background: saved ? "#4CAF50" : T.darkText, color: T.darkBg,
                border: "none", fontSize: 15, fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1, transition: "background 0.3s",
              }}>
                {saving ? "저장 중..." : saved ? "저장됨" : "저장하기"}
              </button>
            </div>
          )}

          <MobileTabBar active="" />
        </div>
      </div>
    </>
  );
}

function MobileTabBar({ active }: { active: string }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430,
      paddingBottom: 28, paddingTop: 10,
      background: "linear-gradient(180deg,rgba(21,17,13,0) 0%,rgba(21,17,13,0.92) 30%,rgba(21,17,13,1) 60%)",
      display: "flex", justifyContent: "space-around",
      borderTop: "0.5px solid rgba(255,246,232,0.08)",
    }}>
      {TABS.map(t => {
        const isActive = t.id === active;
        const c = isActive ? "#B88752" : "rgba(245,239,230,0.38)";
        return (
          <Link key={t.id} href={t.href} style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 12px" }}>
              <GlassGlyph type={t.glass} size={22} color={c} strokeWidth={1.4} />
              <span style={{ fontSize: 10, color: c, fontWeight: 500, fontFamily: '"Pretendard Variable","Pretendard",sans-serif' }}>{t.label}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
