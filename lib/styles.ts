import type { CSSProperties } from "react"

// ── Section label: green uppercase caption above each section ────────────────
export const SECTION_LABEL: CSSProperties = {
  fontSize: "10px",
  fontFamily: "sans-serif",
  fontWeight: 500,
  letterSpacing: "3px",
  textTransform: "uppercase",
  color: "#4ade80",
  marginBottom: "16px",
}

// ── Card surface ─────────────────────────────────────────────────────────────
export const CARD: CSSProperties = {
  background: "#0d0d0d",
  border: "0.5px solid #111",
  borderRadius: "12px",
}

export const CARD_P: CSSProperties = {
  ...CARD,
  padding: "24px",
}

// ── Table header cell ────────────────────────────────────────────────────────
export const TH: CSSProperties = {
  fontSize: "9px",
  fontFamily: "sans-serif",
  fontWeight: 500,
  letterSpacing: "2px",
  textTransform: "uppercase",
  color: "#555",
  padding: "12px 16px",
  textAlign: "left",
  borderBottom: "0.5px solid #111",
  whiteSpace: "nowrap",
}

// ── Table data cell ──────────────────────────────────────────────────────────
export const TD: CSSProperties = {
  fontSize: "13px",
  fontFamily: "sans-serif",
  fontWeight: 300,
  color: "#888",
  padding: "12px 16px",
  borderBottom: "0.5px solid #0a0a0a",
  whiteSpace: "nowrap",
}

// ── Brand colors ─────────────────────────────────────────────────────────────
export const COLOR = {
  accent: "#4ade80",      // green label
  highlight: "#22c55e",   // green value / chart line
  bg: "#080808",          // page background
  surface: "#0d0d0d",     // card background
  border: "#111",         // card border
  text: "#f5f5f5",        // primary text
  muted: "#888",          // secondary text
  dim: "#555",            // tertiary text
  warning: "#f59e0b",
  danger: "#ef4444",
}
