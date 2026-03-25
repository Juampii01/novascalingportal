"use client"

interface PipelineStepProps {
  step: number
  label: string
  count: number
  total: number
  isActive?: boolean
}

export function PipelineStep({
  step,
  label,
  count,
  total,
  isActive = false,
}: PipelineStepProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isActive ? "rgba(34,197,94,0.1)" : "#0d0d0d",
          border: `0.5px solid ${isActive ? "rgba(34,197,94,0.3)" : "#111"}`,
          fontFamily: "Georgia, serif",
          fontSize: "14px",
          color: isActive ? "#22c55e" : "#333",
          transition: "all 0.2s",
        }}
      >
        {count}
      </div>
      <p
        style={{
          fontSize: "8px",
          fontFamily: "sans-serif",
          fontWeight: 300,
          letterSpacing: "2px",
          color: isActive ? "#9ca3af" : "#333",
          textAlign: "center",
          lineHeight: 1.3,
        }}
      >
        {label.toUpperCase()}
      </p>
      <p
        style={{
          fontSize: "9px",
          color: isActive ? "#22c55e" : "#2a2a2a",
          fontFamily: "sans-serif",
        }}
      >
        {pct}%
      </p>
    </div>
  )
}
