"use client"

interface FrequencyBarProps {
  value: number
  showLabel?: boolean
}

export function FrequencyBar({ value, showLabel = true }: FrequencyBarProps) {
  const pct = Math.min((value / 2.5) * 100, 100)
  const color =
    value < 1.2
      ? "#22c55e"
      : value < 1.5
        ? "#f59e0b"
        : value < 1.8
          ? "#f97316"
          : "#ef4444"

  const label =
    value < 1.2
      ? "OK"
      : value < 1.5
        ? "Atención"
        : value < 1.8
          ? "Urgente"
          : "ROTAR YA"

  const shouldPulse = value >= 1.5

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}
      >
        <span style={{ fontSize: "10px", color: "#555", fontFamily: "sans-serif" }}>
          {value.toFixed(2)}
        </span>
        {showLabel && (
          <span
            style={{
              fontSize: "9px",
              fontFamily: "sans-serif",
              fontWeight: 500,
              letterSpacing: "3px",
              color,
              animation: shouldPulse ? "pulse 2s infinite" : "none",
            }}
          >
            {label}
          </span>
        )}
      </div>
      <div
        style={{
          height: "3px",
          width: "100%",
          background: "#111",
          borderRadius: "9999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: "9999px",
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  )
}
