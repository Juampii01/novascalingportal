"use client"

import { useState } from "react"

interface RevenueShareCalculatorProps {
  defaultAmount?: number
  defaultPct?: number
}

export function RevenueShareCalculator({
  defaultAmount = 0,
  defaultPct = 30,
}: RevenueShareCalculatorProps) {
  const [amount, setAmount] = useState(defaultAmount)
  const [pct, setPct] = useState(defaultPct)
  const result = Math.round((amount * pct) / 100)

  return (
    <div
      style={{
        background: "#0d0d0d",
        border: "0.5px solid #111",
        borderRadius: "12px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <p
        style={{
          fontSize: "10px",
          color: "#4ade80",
          fontFamily: "sans-serif",
          fontWeight: 500,
          letterSpacing: "3px",
          textTransform: "uppercase",
        }}
      >
        Calculadora revenue share
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label
          style={{
            fontSize: "11px",
            color: "#777",
            fontFamily: "sans-serif",
            fontWeight: 400,
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          Cash collected del mes ($)
        </label>
        <input
          type="number"
          value={amount || ""}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="0"
          style={{
            background: "#080808",
            border: "0.5px solid #111",
            borderRadius: "8px",
            padding: "10px 14px",
            color: "#f5f5f5",
            fontSize: "14px",
            fontFamily: "sans-serif",
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label
          style={{
            fontSize: "11px",
            color: "#777",
            fontFamily: "sans-serif",
            fontWeight: 400,
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          Porcentaje acordado
        </label>
        <div style={{ display: "flex", gap: "8px" }}>
          {[20, 30, 50].map((p) => (
            <button
              key={p}
              onClick={() => setPct(p)}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                fontSize: "13px",
                fontFamily: "sans-serif",
                fontWeight: 300,
                cursor: "pointer",
                transition: "all 0.2s",
                background: pct === p ? "rgba(34,197,94,0.08)" : "#080808",
                border: pct === p ? "0.5px solid rgba(34,197,94,0.3)" : "0.5px solid #111",
                color: pct === p ? "#22c55e" : "#555",
              }}
            >
              {p}%
            </button>
          ))}
        </div>
      </div>

      <div style={{ paddingTop: "16px", borderTop: "0.5px solid #111" }}>
        <p
          style={{
            fontSize: "10px",
            color: "#4ade80",
            fontFamily: "sans-serif",
            fontWeight: 500,
            letterSpacing: "3px",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Fee NOVA
        </p>
        <p
          style={{
            fontFamily: "Georgia, serif",
            fontWeight: 400,
            fontSize: "42px",
            color: "#22c55e",
            letterSpacing: "2px",
            lineHeight: 1,
          }}
        >
          ${result.toLocaleString()}
        </p>
        <p
          style={{
            fontSize: "10px",
            color: "#333",
            fontFamily: "sans-serif",
            marginTop: "6px",
            letterSpacing: "2px",
          }}
        >
          {pct}% de ${amount.toLocaleString()}
        </p>
      </div>
    </div>
  )
}
