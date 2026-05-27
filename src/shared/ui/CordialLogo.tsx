interface Props {
  size?: number;
  color?: string;
  tracking?: number;
}

export function CordialLogo({ size = 18, color = "#B88752", tracking = 0.5 }: Props) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        fontSize: size,
        fontWeight: 500,
        letterSpacing: tracking,
        color,
      }}
    >
      <svg width={size * 0.9} height={size * 1.1} viewBox="0 0 100 140" fill="none">
        <path
          d="M20 28 L80 28 L52 76 L52 116 M48 116 L48 76 L20 28 M30 122 L70 122"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span>cordial</span>
    </div>
  );
}
