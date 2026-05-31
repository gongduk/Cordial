"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import { WebNav } from "@/shared/ui/WebNav";
import type { DrinkingCapacity } from "@/shared/types";

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

  if (status === "loading" || loading) {
    return (
      <div style={{ background: W.bg, minHeight: "100vh", fontFamily: W.sans }}>
        <WebNav />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 60px)" }}>
          <p style={{ color: W.textMuted, fontSize: 14 }}>불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div style={{ background: W.bg, minHeight: "100vh", fontFamily: W.sans, color: W.text }}>
      <WebNav active="/mypage" />
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

        {/* Drinking capacity */}
        <section style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: W.mono, fontSize: 10, letterSpacing: 1.4, color: W.textMuted, marginBottom: 16, textTransform: "uppercase" }}>주량</div>
          <div style={{ display: "flex", gap: 10 }}>
            {CAPACITY_OPTIONS.map(opt => {
              const active = profile.drinkingCapacity === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setProfile(p => p ? { ...p, drinkingCapacity: opt.value } : p)}
                  style={{
                    flex: 1, padding: "14px 12px", borderRadius: 12,
                    border: `1px solid ${active ? W.accent : W.borderStrong}`,
                    background: active ? `${W.accent}14` : W.surface,
                    cursor: "pointer", textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: active ? W.accent : W.text, letterSpacing: -0.2, fontFamily: W.sans }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: W.textFaint, marginTop: 2, fontFamily: W.mono }}>{opt.sub}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Flavor preferences */}
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
                  <input
                    type="range" min={0} max={1} step={0.05}
                    value={val}
                    onChange={e => setPref(key, parseFloat(e.target.value))}
                    style={{ width: "100%", accentColor: W.accent }}
                  />
                </div>
              );
            })}
          </div>
        </section>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%", height: 52, borderRadius: 12,
            background: saved ? "#4CAF50" : W.text, color: W.bg,
            border: "none", fontSize: 15, fontWeight: 600, letterSpacing: -0.2,
            fontFamily: W.sans, cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1, transition: "background 0.3s",
          }}
        >
          {saving ? "저장 중..." : saved ? "저장됨" : "저장하기"}
        </button>
      </div>
    </div>
  );
}
