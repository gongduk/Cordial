"use client";

import { useId } from "react";

export type GlassType = "martini" | "coupe" | "rocks" | "highball" | "flute";

interface Props {
  type?: GlassType;
  size?: number;
  stroke?: string;
  liquid?: string;
  fillLevel?: number;
  strokeWidth?: number;
  garnish?: boolean;
}

export function GlassSilhouette({
  type = "martini",
  size = 120,
  stroke = "#B88752",
  liquid = "#B88752",
  fillLevel = 0,
  strokeWidth = 1.4,
  garnish = false,
}: Props) {
  const id = useId();
  const clipId = `glass-clip-${type}-${id.replace(/:/g, "")}`;

  type GlassDef = {
    outline: string;
    liquidClip: string;
    liquidTop: number;
    liquidBottom: number;
    garnishEl: React.ReactNode;
  };

  const glasses: Record<GlassType, GlassDef> = {
    martini: {
      outline: "M20 28 L80 28 L52 76 L52 116 M48 116 L48 76 L20 28 M30 122 L70 122",
      liquidClip: "M22 30 L78 30 L51 78 L49 78 Z",
      liquidTop: 30,
      liquidBottom: 78,
      garnishEl: garnish ? (
        <>
          <line x1="62" y1="22" x2="74" y2="6" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
          <circle cx="74" cy="6" r="3" fill={stroke} />
        </>
      ) : null,
    },
    coupe: {
      outline: "M18 36 Q50 80 82 36 M50 80 L50 116 M30 122 L70 122",
      liquidClip: "M20 38 Q50 78 80 38 Z",
      liquidTop: 38,
      liquidBottom: 78,
      garnishEl: garnish ? (
        <circle cx="64" cy="32" r="5" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
      ) : null,
    },
    rocks: {
      outline: "M24 32 L24 116 Q24 122 30 122 L70 122 Q76 122 76 116 L76 32 Z",
      liquidClip: "M26 34 L74 34 L74 114 L26 114 Z",
      liquidTop: 34,
      liquidBottom: 114,
      garnishEl: garnish ? (
        <circle cx="52" cy="42" r="3" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity="0.6" />
      ) : null,
    },
    highball: {
      outline: "M28 18 L28 118 Q28 124 34 124 L66 124 Q72 124 72 118 L72 18",
      liquidClip: "M30 20 L70 20 L70 116 L30 116 Z",
      liquidTop: 20,
      liquidBottom: 116,
      garnishEl: garnish ? (
        <>
          <line x1="50" y1="14" x2="50" y2="36" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
          <circle cx="50" cy="10" r="3" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
        </>
      ) : null,
    },
    flute: {
      outline: "M34 18 L36 78 Q36 88 50 88 Q64 88 64 78 L66 18 M50 88 L50 118 M32 124 L68 124",
      liquidClip: "M35 20 L37 78 Q37 87 50 87 Q63 87 63 78 L65 20 Z",
      liquidTop: 20,
      liquidBottom: 87,
      garnishEl: garnish ? (
        <g>
          <circle cx="50" cy="36" r="1.4" fill={stroke} />
          <circle cx="46" cy="48" r="1" fill={stroke} />
          <circle cx="54" cy="60" r="1.2" fill={stroke} />
          <circle cx="48" cy="72" r="0.8" fill={stroke} />
        </g>
      ) : null,
    },
  };

  const g = glasses[type];
  if (!g) return null;

  const liquidHeight = g.liquidBottom - g.liquidTop;
  const liquidY = g.liquidBottom - liquidHeight * fillLevel;

  return (
    <svg
      width={size}
      height={size * 1.25}
      viewBox="0 0 100 140"
      fill="none"
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={g.liquidClip} />
        </clipPath>
      </defs>
      {fillLevel > 0 && (
        <g clipPath={`url(#${clipId})`}>
          <rect x="0" y={liquidY} width="100" height={140} fill={liquid} opacity="0.85" />
          <rect x="0" y={liquidY} width="100" height="1.2" fill={liquid} opacity="0.4" />
        </g>
      )}
      <path
        d={g.outline}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {g.garnishEl}
    </svg>
  );
}

interface GlyphProps {
  type?: GlassType;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function GlassGlyph({ type = "martini", size = 24, color = "currentColor", strokeWidth = 1.4 }: GlyphProps) {
  return <GlassSilhouette type={type} size={size} stroke={color} strokeWidth={strokeWidth} />;
}
