"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useState } from "react"

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastType = "success" | "info" | "warning"

export interface ToastItem {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextValue {
  toast: (opts: Omit<ToastItem, "id">) => void
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((opts: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((prev) => [...prev.slice(-4), { ...opts, id }]) // max 5 at once
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

// ─── Container ───────────────────────────────────────────────────────────────

function ToastContainer({
  toasts,
  dismiss,
}: {
  toasts: ToastItem[]
  dismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} dismiss={dismiss} />
      ))}
    </div>
  )
}

// ─── Single Toast ─────────────────────────────────────────────────────────────

const COLORS: Record<ToastType, { dot: string; border: string; bg: string }> = {
  success: {
    dot: "#22c55e",
    border: "rgba(34,197,94,0.18)",
    bg: "rgba(34,197,94,0.04)",
  },
  info: {
    dot: "#60a5fa",
    border: "rgba(96,165,250,0.18)",
    bg: "rgba(96,165,250,0.04)",
  },
  warning: {
    dot: "#f59e0b",
    border: "rgba(245,158,11,0.18)",
    bg: "rgba(245,158,11,0.04)",
  },
}

function ToastCard({
  toast,
  dismiss,
}: {
  toast: ToastItem
  dismiss: (id: string) => void
}) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const close = useCallback(() => {
    setLeaving(true)
    setTimeout(() => dismiss(toast.id), 280)
  }, [dismiss, toast.id])

  // Animate in
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  // Auto-dismiss
  useEffect(() => {
    const duration = toast.duration ?? 5500
    const timer = setTimeout(close, duration)
    return () => clearTimeout(timer)
  }, [close, toast.duration])

  const c = COLORS[toast.type]
  const isVisible = visible && !leaving

  return (
    <div
      onClick={close}
      style={{
        pointerEvents: "auto",
        cursor: "pointer",
        background: c.bg,
        border: `0.5px solid ${c.border}`,
        borderLeft: `2px solid ${c.dot}`,
        borderRadius: "8px",
        padding: "14px 18px",
        minWidth: "260px",
        maxWidth: "340px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        transform: isVisible ? "translateX(0)" : "translateX(28px)",
        opacity: isVisible ? 1 : 0,
        transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1), opacity 0.28s ease",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Dot + title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "9px",
          marginBottom: toast.message ? "5px" : 0,
        }}
      >
        <div
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: c.dot,
            flexShrink: 0,
            boxShadow: `0 0 6px ${c.dot}88`,
          }}
        />
        <p
          style={{
            fontSize: "12px",
            fontFamily: "sans-serif",
            fontWeight: 500,
            color: "#e5e5e5",
            letterSpacing: "0.2px",
            lineHeight: 1,
          }}
        >
          {toast.title}
        </p>
      </div>

      {/* Message */}
      {toast.message && (
        <p
          style={{
            fontSize: "11px",
            fontFamily: "sans-serif",
            fontWeight: 300,
            color: "#666",
            letterSpacing: "0.2px",
            paddingLeft: "14px",
            lineHeight: 1.5,
          }}
        >
          {toast.message}
        </p>
      )}

      {/* Progress bar */}
      <ProgressBar duration={toast.duration ?? 5500} color={c.dot} />
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ duration, color }: { duration: number; color: string }) {
  const [width, setWidth] = useState(100)

  useEffect(() => {
    const start = performance.now()
    let raf: number

    const tick = (now: number) => {
      const elapsed = now - start
      const pct = Math.max(0, 100 - (elapsed / duration) * 100)
      setWidth(pct)
      if (pct > 0) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [duration, color])

  return (
    <div
      style={{
        marginTop: "10px",
        height: "1px",
        background: "#111",
        borderRadius: "9999px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${width}%`,
          background: color,
          opacity: 0.5,
          borderRadius: "9999px",
        }}
      />
    </div>
  )
}
