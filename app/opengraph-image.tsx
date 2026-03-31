import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "NOVA Scaling — Sistema de adquisición"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#080808",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "28px", position: "relative" }}>
          <span style={{ fontFamily: "serif", fontSize: "96px", fontWeight: 400, color: "#22c55e", letterSpacing: "16px" }}>
            NOVA
          </span>
          <div style={{ width: "40px", height: "1px", background: "#22c55e", opacity: 0.5, display: "flex" }} />
          <span style={{ fontFamily: "sans-serif", fontSize: "18px", fontWeight: 300, color: "#555", letterSpacing: "12px" }}>
            SCALING
          </span>
        </div>

        {/* Divider line */}
        <div style={{ width: "80px", height: "0.5px", background: "#1a1a1a", marginBottom: "28px", display: "flex" }} />

        {/* Tagline */}
        <p style={{ fontFamily: "sans-serif", fontSize: "18px", fontWeight: 300, color: "#333", letterSpacing: "4px", textTransform: "uppercase", display: "flex" }}>
          Sistema de adquisición para negocios de expertos
        </p>
      </div>
    ),
    { ...size }
  )
}
