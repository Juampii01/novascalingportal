"use client"

type BadgeStatus = "winner" | "warning" | "critical" | "inactive" | "ok"

interface StatusBadgeProps {
  status: BadgeStatus
  label?: string
}

const config: Record<BadgeStatus, { bg: string; color: string; dot: string; default: string }> = {
  winner: { bg: "rgba(34,197,94,0.08)", color: "#22c55e", dot: "#22c55e", default: "Ganador" },
  ok: { bg: "rgba(34,197,94,0.08)", color: "#22c55e", dot: "#22c55e", default: "OK" },
  warning: { bg: "rgba(245,158,11,0.08)", color: "#f59e0b", dot: "#f59e0b", default: "Atención" },
  critical: { bg: "rgba(239,68,68,0.08)", color: "#ef4444", dot: "#ef4444", default: "Rotar ya" },
  inactive: { bg: "rgba(63,63,70,0.3)", color: "#555", dot: "#3f3f46", default: "Inactivo" },
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const c = config[status]
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "9999px",
        background: c.bg,
        border: `0.5px solid ${c.dot}40`,
        fontSize: "9px",
        fontFamily: "sans-serif",
        fontWeight: 300,
        letterSpacing: "3px",
        color: c.color,
      }}
    >
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: c.dot,
          flexShrink: 0,
        }}
      />
      {label ?? c.default}
    </span>
  )
}
