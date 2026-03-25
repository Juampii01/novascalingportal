"use client"

interface HealthScoreRingProps {
  score: number
  size?: number
}

export function HealthScoreRing({ score, size = 80 }: HealthScoreRingProps) {
  const radius = size / 2 - 8
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444"
  const label = score >= 75 ? "Saludable" : score >= 50 ? "Atención" : "Crítico"

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}
    >
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#111"
          strokeWidth="2.5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text
          x={size / 2}
          y={size / 2 + 6}
          textAnchor="middle"
          fill="#f5f5f5"
          fontSize={size * 0.22}
          fontFamily="Georgia, serif"
          fontWeight="400"
        >
          {score}
        </text>
      </svg>
      <span
        style={{
          fontSize: "8px",
          fontFamily: "sans-serif",
          fontWeight: 300,
          letterSpacing: "4px",
          color,
        }}
      >
        {label.toUpperCase()}
      </span>
    </div>
  )
}
