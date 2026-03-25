"use client"

interface AngleCardProps {
  angle: string
  category: "Problema" | "Solución" | "Producto" | "Mentalidad"
  closes: number
  revenue: number
  rank?: number
}

const categoryColors: Record<string, string> = {
  Problema: "#3b82f6",
  Solución: "#14b8a6",
  Producto: "#f59e0b",
  Mentalidad: "#a855f7",
}

export function AngleCard({ angle, category, closes, revenue, rank }: AngleCardProps) {
  const color = categoryColors[category] ?? "#555"

  return (
    <div
      style={{
        background: "#0d0d0d",
        border: `0.5px solid ${color}20`,
        borderRadius: "10px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {rank && rank <= 3 && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            fontFamily: "Georgia, serif",
            fontSize: "11px",
            color:
              rank === 1 ? "#f59e0b" : rank === 2 ? "#9ca3af" : "#cd7c2f",
            letterSpacing: "1px",
          }}
        >
          #{rank}
        </div>
      )}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "3px 8px",
          borderRadius: "9999px",
          background: `${color}15`,
          border: `0.5px solid ${color}30`,
          fontSize: "8px",
          fontFamily: "sans-serif",
          color,
          letterSpacing: "3px",
          width: "fit-content",
        }}
      >
        {category.toUpperCase()}
      </span>
      <p
        style={{
          fontSize: "13px",
          fontFamily: "sans-serif",
          fontWeight: 400,
          color: "#d4d4d4",
          lineHeight: 1.5,
        }}
      >
        {angle}
      </p>
      <div style={{ display: "flex", gap: "20px" }}>
        <div>
          <p
            style={{
              fontSize: "9px",
              color: "#666",
              fontFamily: "sans-serif",
              letterSpacing: "2px",
              marginBottom: "4px",
            }}
          >
            CIERRES
          </p>
          <p
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "20px",
              color: "#f5f5f5",
              fontWeight: 400,
            }}
          >
            {closes}
          </p>
        </div>
        <div>
          <p
            style={{
              fontSize: "9px",
              color: "#666",
              fontFamily: "sans-serif",
              letterSpacing: "2px",
              marginBottom: "4px",
            }}
          >
            REVENUE
          </p>
          <p
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "18px",
              color: "#22c55e",
              fontWeight: 400,
            }}
          >
            ${revenue.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
