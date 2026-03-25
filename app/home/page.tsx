"use client"

import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"

const SECTIONS = [
  {
    href: "/overview",
    n: "01",
    label: "Overview",
    tag: "Resumen ejecutivo",
    desc: "El pulso del mes. Revenue, leads, cierres y el estado general del sistema de un vistazo.",
    accent: "#22c55e",
  },
  {
    href: "/acquisition",
    n: "02",
    label: "Adquisición",
    tag: "Tráfico y conversación",
    desc: "Follow Me Ads, pipeline de ManyChat y rendimiento del contenido orgánico. Cómo entra la gente al sistema.",
    accent: "#3b82f6",
  },
  {
    href: "/sales",
    n: "03",
    label: "Ventas",
    tag: "CRM automático",
    desc: "Pipeline de ventas en tiempo real. Desde el primer contacto hasta el cierre, todo registrado automáticamente.",
    accent: "#f59e0b",
  },
  {
    href: "/traceability",
    n: "04",
    label: "Trazabilidad",
    tag: "Inteligencia de contenido",
    desc: "Qué ángulos de contenido generan revenue real. El dato que cambia qué publicar y qué escalar a ads.",
    accent: "#a855f7",
  },
  {
    href: "/projections",
    n: "05",
    label: "Proyecciones",
    tag: "Estrategia",
    desc: "Health score del sistema completo y forecast de revenue. Sabés cómo va el mes antes de que termine.",
    accent: "#f97316",
  },
]

function HomeContent() {
  const router = useRouter()

  return (
    <>
      <style>{`
        @keyframes blobA {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(24px,-18px) scale(1.07); }
        }
        @keyframes blobB {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-18px,22px) scale(0.94); }
        }
        @keyframes rise {
          from { opacity:0; transform:translateY(22px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .r1 { animation: rise 0.7s 0.05s ease both; }
        .r2 { animation: rise 0.75s 0.18s ease both; }
        .r3 { animation: rise 0.75s 0.28s ease both; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 48px)" }}>

        {/* ── HERO ── */}
        <div className="r1" style={{ position: "relative", paddingTop: "56px", paddingBottom: "60px", borderBottom: "0.5px solid #0d0d0d", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <div style={{ position: "absolute", top: "-20%", left: "35%", width: "520px", height: "520px", borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 65%)", animation: "blobA 22s ease-in-out infinite" }} />
            <div style={{ position: "absolute", bottom: "-30%", right: "5%", width: "360px", height: "360px", borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.03) 0%, transparent 65%)", animation: "blobB 28s ease-in-out infinite" }} />
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.013) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.013) 1px, transparent 1px)", backgroundSize: "58px 58px" }} />
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 50%, #080808 100%)" }} />
          </div>

          <div style={{ position: "relative" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "24px", padding: "6px 14px", borderRadius: "9999px", background: "rgba(34,197,94,0.05)", border: "0.5px solid rgba(34,197,94,0.12)" }}>
              <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.6)" }} />
              <span style={{ fontSize: "9px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "2.5px", textTransform: "uppercase", color: "#22c55e" }}>
                NOVA Scaling · Dashboard
              </span>
            </div>

            <h1 style={{ fontFamily: "Georgia, serif", fontSize: "56px", fontWeight: 400, color: "#f5f5f5", letterSpacing: "-2px", lineHeight: 1.04, marginBottom: "24px" }}>
              Bienvenido a tu<br />
              <span style={{ color: "#1c2b20" }}>sistema operativo.</span>
            </h1>

            <p style={{ fontSize: "14px", fontFamily: "sans-serif", fontWeight: 300, color: "#333", maxWidth: "460px", lineHeight: 1.8, letterSpacing: "0.1px" }}>
              Un dashboard diseñado para expertos que escalan con contenido, DMs y llamadas de ventas. Todo el negocio, en una sola vista.
            </p>
          </div>
        </div>

        {/* ── SECTION LIST ── */}
        <div className="r2" style={{ flex: 1, paddingTop: "40px", paddingBottom: "48px" }}>
          <p style={{ fontSize: "9px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", textTransform: "uppercase", color: "#4ade80", marginBottom: "28px" }}>
            Secciones del sistema
          </p>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {SECTIONS.map((s, i) => (
              <SectionRow
                key={s.href}
                section={s}
                isLast={i === SECTIONS.length - 1}
                onClick={() => router.push(s.href)}
              />
            ))}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="r3" style={{ borderTop: "0.5px solid #0d0d0d", paddingTop: "24px", paddingBottom: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontFamily: "Georgia, serif", fontSize: "13px", fontWeight: 400, color: "#1c1c1c", letterSpacing: "7px" }}>NOVA</span>
            <div style={{ width: "16px", height: "0.5px", background: "#22c55e", opacity: 0.3 }} />
            <span style={{ fontFamily: "sans-serif", fontSize: "6px", fontWeight: 300, color: "#22c55e", letterSpacing: "5px", opacity: 0.5 }}>SCALING</span>
          </div>
          <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 300, color: "#191919", letterSpacing: "0.5px" }}>
            Sistema de inteligencia operativa · v1.0
          </p>
        </div>
      </div>
    </>
  )
}

function SectionRow({ section, isLast, onClick }: {
  section: typeof SECTIONS[0]
  isLast: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "40px 180px 180px 1fr 32px",
        alignItems: "center",
        gap: "0",
        padding: "22px 0",
        background: "transparent",
        border: "none",
        borderBottomStyle: "solid" as const,
        borderBottomWidth: "0.5px",
        borderBottomColor: isLast ? "transparent" : hovered ? "#161616" : "#0e0e0e",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        transition: "all 0.2s",
        paddingLeft: hovered ? "8px" : "0",
      }}
    >
      {/* Number */}
      <span style={{
        fontFamily: "Georgia, serif",
        fontSize: "11px",
        color: hovered ? section.accent : "#2e2e2e",
        letterSpacing: "1px",
        transition: "color 0.2s",
        flexShrink: 0,
      }}>
        {section.n}
      </span>

      {/* Label */}
      <span style={{
        fontFamily: "Georgia, serif",
        fontSize: "19px",
        fontWeight: 400,
        color: hovered ? "#f0f0f0" : "#888",
        letterSpacing: "-0.2px",
        transition: "color 0.2s",
        flexShrink: 0,
      }}>
        {section.label}
      </span>

      {/* Tag */}
      <span style={{
        fontSize: "8px",
        fontFamily: "sans-serif",
        fontWeight: 500,
        letterSpacing: "2px",
        textTransform: "uppercase",
        color: hovered ? section.accent : "#383838",
        transition: "color 0.2s",
        flexShrink: 0,
      }}>
        {section.tag}
      </span>

      {/* Description */}
      <span style={{
        fontSize: "12px",
        fontFamily: "sans-serif",
        fontWeight: 300,
        color: hovered ? "#aaa" : "#444",
        lineHeight: 1.65,
        transition: "color 0.2s",
        paddingRight: "32px",
      }}>
        {section.desc}
      </span>

      {/* Arrow */}
      <span style={{
        fontSize: "15px",
        color: hovered ? section.accent : "#2a2a2a",
        transition: "all 0.2s",
        transform: hovered ? "translateX(4px)" : "translateX(0)",
        flexShrink: 0,
      }}>
        →
      </span>
    </button>
  )
}

// Need useState for SectionRow
import { useState } from "react"

export default function HomePage() {
  return (
    <DashboardLayout>
      <HomeContent />
    </DashboardLayout>
  )
}
