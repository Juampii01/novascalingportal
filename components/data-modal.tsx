"use client"

import { useEffect } from "react"
import { X } from "lucide-react"

interface DataModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  onSubmit?: () => void
  submitLabel?: string
  loading?: boolean
}

// ─── Shared form input styles ─────────────────────────────────────────────────
export const INPUT: React.CSSProperties = {
  width: "100%",
  background: "#111",
  border: "0.5px solid #1a1a1a",
  borderRadius: "6px",
  padding: "9px 12px",
  fontSize: "13px",
  fontFamily: "sans-serif",
  fontWeight: 300,
  color: "#f5f5f5",
  outline: "none",
  boxSizing: "border-box",
}

export const LABEL: React.CSSProperties = {
  display: "block",
  fontSize: "9px",
  color: "#555",
  fontFamily: "sans-serif",
  letterSpacing: "2px",
  textTransform: "uppercase",
  marginBottom: "6px",
}

export const FIELD_ROW: React.CSSProperties = {
  display: "grid",
  gap: "16px",
}

export function Field({
  label,
  children,
  style,
}: {
  label: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={style}>
      <label style={LABEL}>{label}</label>
      {children}
    </div>
  )
}

export function FormSection({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "9px", color: "#4ade80", fontFamily: "sans-serif", letterSpacing: "3px", textTransform: "uppercase", fontWeight: 500, whiteSpace: "nowrap" }}>{label}</span>
        <div style={{ flex: 1, height: "0.5px", background: "#1a1a1a" }} />
      </div>
      {children}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function DataModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  onSubmit,
  submitLabel = "Guardar",
  loading = false,
}: DataModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "680px",
          maxHeight: "90vh",
          background: "#0d0d0d",
          border: "0.5px solid #1a1a1a",
          borderRadius: "14px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "0.5px solid #111",
            flexShrink: 0,
          }}
        >
          <div>
            <p
              style={{
                fontSize: "9px",
                color: "#4ade80",
                fontFamily: "sans-serif",
                letterSpacing: "3px",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              Cargar datos
            </p>
            <h2
              style={{
                fontSize: "18px",
                fontFamily: "Georgia, serif",
                fontWeight: 400,
                color: "#f5f5f5",
                letterSpacing: "0.5px",
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                style={{
                  fontSize: "12px",
                  color: "#555",
                  fontFamily: "sans-serif",
                  fontWeight: 300,
                  marginTop: "4px",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "#444",
              flexShrink: 0,
              marginTop: "2px",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {onSubmit && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "0.5px solid #111",
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end",
              flexShrink: 0,
            }}
          >
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "0.5px solid #1a1a1a",
                borderRadius: "8px",
                padding: "8px 20px",
                fontSize: "11px",
                fontFamily: "sans-serif",
                fontWeight: 400,
                letterSpacing: "1px",
                color: "#555",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={onSubmit}
              disabled={loading}
              style={{
                background: loading ? "rgba(34,197,94,0.3)" : "#22c55e",
                border: "none",
                borderRadius: "8px",
                padding: "8px 24px",
                fontSize: "11px",
                fontFamily: "sans-serif",
                fontWeight: 500,
                letterSpacing: "1px",
                color: "#080808",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "Guardando..." : submitLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
