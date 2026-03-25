"use client"

import type React from "react"

export function SkeletonBlock({
  width = "100%",
  height = "16px",
  borderRadius = "4px",
  style,
}: {
  width?: string | number
  height?: string | number
  borderRadius?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, #111 0%, #1a1a1a 50%, #111 100%)",
        backgroundSize: "200% 100%",
        animation: "nova-skeleton-shimmer 1.6s ease-in-out infinite",
        flexShrink: 0,
        ...style,
      }}
    />
  )
}

export function SkeletonCard({
  height = "120px",
  style,
}: {
  height?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        background: "#0d0d0d",
        border: "0.5px solid #111",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        height,
        ...style,
      }}
    >
      <SkeletonBlock width="40%" height="10px" />
      <SkeletonBlock width="60%" height="28px" />
      <SkeletonBlock width="80%" height="10px" />
    </div>
  )
}

export function EmptyState({
  message = "No hay datos disponibles.",
  subMessage,
}: {
  message?: string
  subMessage?: string
}) {
  return (
    <div
      style={{
        background: "#0d0d0d",
        border: "0.5px solid #111",
        borderRadius: "12px",
        padding: "32px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#555" }}>
        {message}
      </p>
      {subMessage && (
        <p style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#333" }}>
          {subMessage}
        </p>
      )}
    </div>
  )
}
