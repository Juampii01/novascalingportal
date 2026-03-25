"use client"

interface MetricCardProps {
  label: string
  value: string | number
  previousValue?: number
  prefix?: string
  suffix?: string
  highlight?: boolean
  alert?: "warning" | "danger" | null
}

export function MetricCard({
  label,
  value,
  previousValue,
  prefix = "",
  suffix = "",
  highlight = false,
  alert = null,
}: MetricCardProps) {
  const numValue = typeof value === "number" ? value : null
  const change =
    numValue && previousValue
      ? ((numValue - previousValue) / previousValue) * 100
      : null

  const bgColor = highlight
    ? "#0a1a10"
    : alert === "danger"
      ? "#1a0a0a"
      : alert === "warning"
        ? "#1a120a"
        : "#0d0d0d"

  const borderColor = highlight
    ? "rgba(34,197,94,0.2)"
    : alert === "danger"
      ? "rgba(239,68,68,0.2)"
      : alert === "warning"
        ? "rgba(245,158,11,0.2)"
        : "#111111"

  const labelColor =
    alert === "danger"
      ? "#f87171"
      : alert === "warning"
        ? "#fbbf24"
        : "#4ade80"

  return (
    <div
      style={{
        background: bgColor,
        border: `0.5px solid ${borderColor}`,
        borderRadius: "12px",
        padding: "20px",
        transition: "border-color 0.2s",
      }}
    >
      <p
        style={{
          fontSize: "10px",
          fontFamily: "sans-serif",
          fontWeight: 400,
          letterSpacing: "3px",
          textTransform: "uppercase",
          color: labelColor,
          marginBottom: "14px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "Georgia, serif",
          fontWeight: 400,
          fontSize: "34px",
          color: "#f5f5f5",
          letterSpacing: "1px",
          lineHeight: 1,
        }}
      >
        {prefix}
        {value}
        {suffix}
      </p>
      {change !== null && (
        <p
          style={{
            fontSize: "11px",
            marginTop: "10px",
            fontFamily: "sans-serif",
            fontWeight: 400,
            color: change >= 0 ? "#22c55e" : "#f87171",
          }}
        >
          {change >= 0 ? "+" : ""}
          {change.toFixed(1)}% vs mes anterior
        </p>
      )}
    </div>
  )
}
