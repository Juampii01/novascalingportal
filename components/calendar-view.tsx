"use client"

import Link from "next/link"
import { ExternalLink } from "lucide-react"

type CalendarItem = {
  day: "Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes" | "Sábado" | "Domingo"
  time: string
  tzLabel?: string
  title: string
  description?: string
  zoomUrl?: string
  passcode?: string
  status?: "active" | "cancelled" | "tbd"
}

const ITEMS: CalendarItem[] = [
  {
    day: "Lunes",
    time: "3:00 PM",
    tzLabel: "Miami",
    title: "Q&A: Ads · Content · Mindset",
    description: "Con Ann Sahakyan",
    zoomUrl: "https://us06web.zoom.us/j/88326569602?pwd=En8DhWa6QIeAO4gFSPLSJHsRNHobjX.1",
    passcode: "009382",
    status: "active",
  },
  {
    day: "Martes",
    time: "1:00 PM",
    tzLabel: "Miami",
    title: "Contenido Orgánico & Marca Personal",
    description: "con Juampi Acosta",
    zoomUrl: "https://us06web.zoom.us/j/82480101425?pwd=j6lHTzGjCw1WyL1I24gVX1u6goHmnB.1",
    passcode: "109565",
    status: "active",
  },
  {
    day: "Miércoles",
    time: "3:00 PM",
    tzLabel: "Miami",
    title: "Lab/Q&A",
    description: "Con Ann Sahakyan",
    zoomUrl: "https://us06web.zoom.us/j/84528843654?pwd=knND3qWgX5OxRRffoHiZSmnaPuPaza.1",
    passcode: "585449",
    status: "active",
  },
  {
    day: "Jueves",
    time: "1:00 PM",
    tzLabel: "Miami",
    title: "Cierre de Venta",
    description: "Con Dani",
    zoomUrl: "https://us06web.zoom.us/j/82230842614?pwd=AMtguLNezLsFZ7bJbaZ06nrJxX08ZR.1",
    passcode: "865483",
    status: "active",
  },
  {
    day: "Viernes",
    time: "1:00 PM",
    tzLabel: "Miami",
    title: "Neurociencia y Mentalidad",
    description: "con Santiago Sáez",
    zoomUrl: "https://us06web.zoom.us/j/89666744189?pwd=2GAzmVs8kIUvaXqyHAdoG5K85MmRvl.1",
    passcode: "894865",
    status: "active",
  },
]

const DAY_ORDER: Record<CalendarItem["day"], number> = {
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sábado: 6,
  Domingo: 7,
}

function StatusPill({ status }: { status?: CalendarItem["status"] }) {
  const s = status ?? "active"
  if (s === "cancelled") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "9999px", border: "0.5px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", fontSize: "9px", fontFamily: "sans-serif", letterSpacing: "2px", color: "#f87171" }}>
        CANCELADO
      </span>
    )
  }
  if (s === "tbd") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "9999px", border: "0.5px solid #222", background: "rgba(255,255,255,0.03)", fontSize: "9px", fontFamily: "sans-serif", letterSpacing: "2px", color: "#555" }}>
        PRÓXIMAMENTE
      </span>
    )
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "9999px", border: "0.5px solid rgba(34,197,94,0.25)", background: "rgba(34,197,94,0.06)", fontSize: "9px", fontFamily: "sans-serif", letterSpacing: "2px", color: "#22c55e" }}>
      ACTIVO
    </span>
  )
}

export function CalendarView() {
  const sorted = [...ITEMS].sort((a, b) => DAY_ORDER[a.day] - DAY_ORDER[b.day])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Header */}
      <div>
        <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", marginBottom: "10px", textTransform: "uppercase" }}>
          Herramientas
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#f5f5f5", letterSpacing: "1px" }}>
            Agenda Marzo
          </h1>
          <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: "9999px", border: "0.5px solid #222", background: "rgba(255,255,255,0.03)", fontSize: "9px", fontFamily: "sans-serif", letterSpacing: "2px", color: "#555" }}>
            LLAMADAS SEMANALES
          </span>
        </div>

        {/* Notice */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "8px", border: "0.5px solid rgba(34,197,94,0.25)", background: "rgba(34,197,94,0.04)", marginBottom: "8px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4l2 2" />
          </svg>
          <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#aaaaaa", lineHeight: 1.5 }}>
            <span style={{ color: "#f5f5f5", fontWeight: 400 }}>Aviso:</span> La clase <span style={{ color: "#f5f5f5" }}>Lab/Q&A</span> de Ann originalmente el día <span style={{ color: "#f5f5f5" }}>4</span> se realizará el día <span style={{ color: "#f5f5f5" }}>5</span>.
          </p>
        </div>

        <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#666", lineHeight: 1.6 }}>
          Espacios de trabajo diseñados para resolver bloqueos reales en adquisición, contenido, ventas y mentalidad. Todas las sesiones en horario Miami y quedan grabadas.
        </p>
      </div>

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
        {sorted.map((item) => {
          const cancelled = item.status === "cancelled"
          return (
            <div
              key={`${item.day}-${item.time}-${item.title}`}
              style={{
                background: "#0d0d0d",
                border: cancelled ? "0.5px solid rgba(239,68,68,0.2)" : "0.5px solid #111",
                borderRadius: "12px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Top accent */}
              <div style={{ height: "2px", background: cancelled ? "rgba(239,68,68,0.5)" : "#22c55e", opacity: cancelled ? 0.6 : 0.4 }} />

              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
                {/* Title + status */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                  <div>
                    <p style={{ fontSize: "14px", fontFamily: "sans-serif", fontWeight: 400, color: cancelled ? "#555" : "#f5f5f5", textDecoration: cancelled ? "line-through" : "none", lineHeight: 1.4, marginBottom: "4px" }}>
                      {item.title}
                    </p>
                    {item.description && (
                      <p style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#666" }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                  <StatusPill status={item.status} />
                </div>

                {/* Meta */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                    <span style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: cancelled ? "#444" : "#888", textDecoration: cancelled ? "line-through" : "none" }}>{item.day}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                    <span style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: cancelled ? "#444" : "#888", textDecoration: cancelled ? "line-through" : "none" }}>{item.time} · {item.tzLabel ?? "Miami"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    <span style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#555" }}>Zoom</span>
                  </div>
                </div>

                {/* Passcode */}
                {item.passcode && (
                  <div style={{ padding: "10px 12px", background: "#080808", border: "0.5px solid #111", borderRadius: "6px" }}>
                    <p style={{ fontSize: "9px", fontFamily: "sans-serif", color: "#444", letterSpacing: "1px", marginBottom: "4px" }}>CÓDIGO DE INICIO</p>
                    <p style={{ fontSize: "13px", fontFamily: "Georgia, serif", color: "#aaaaaa", letterSpacing: "2px" }}>{item.passcode}</p>
                  </div>
                )}

                {cancelled && (
                  <p style={{ fontSize: "11px", fontFamily: "sans-serif", color: "#f87171", fontWeight: 300 }}>
                    Esta sesión figura como cancelada.
                  </p>
                )}

                {/* CTA */}
                <div style={{ marginTop: "auto" }}>
                  <Link
                    href={item.zoomUrl ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      background: cancelled ? "transparent" : "#22c55e",
                      border: cancelled ? "0.5px solid #222" : "none",
                      color: cancelled ? "#444" : "#000",
                      fontSize: "11px",
                      fontFamily: "sans-serif",
                      fontWeight: 500,
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      textDecoration: "none",
                      pointerEvents: !item.zoomUrl ? "none" : "auto",
                    }}
                  >
                    Abrir <ExternalLink size={10} />
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Monthly call card */}
      <div style={{ background: "#0d0d0d", border: "0.5px solid #111", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", textTransform: "uppercase" }}>
          Llamada mensual
        </p>
        <p style={{ fontSize: "14px", fontFamily: "sans-serif", fontWeight: 400, color: "#d4d4d4" }}>
          Agenda tu llamada mensual con Ann
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#888", lineHeight: 1.6 }}>
            Agendá tu llamada desde este link:{" "}
            <a
              href="https://calendly.com/strategystudio-mkt/onboarding-call"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#22c55e", textDecoration: "none" }}
            >
              calendly.com/strategystudio-mkt/onboarding-call
            </a>
          </p>
          <ul style={{ display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "16px" }}>
            {[
              "Las llamadas son mensuales y no acumulables.",
              "Cada mes tenés disponible una (1) llamada.",
              "La llamada debe realizarse dentro del mes correspondiente.",
              "Si no se agenda en ese período, no se traslada al mes siguiente.",
            ].map((item, i) => (
              <li key={i} style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#666", lineHeight: 1.6 }}>
                {item}
              </li>
            ))}
          </ul>
          <p style={{ fontSize: "10px", fontFamily: "sans-serif", color: "#444", letterSpacing: "1px" }}>
            Recomendamos agendar con anticipación para asegurar disponibilidad.
          </p>
        </div>
      </div>

      {/* Próximamente */}
      <div style={{ background: "#0d0d0d", border: "0.5px solid #111", borderRadius: "12px", padding: "24px" }}>
        <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", textTransform: "uppercase", marginBottom: "10px" }}>
          Próximamente
        </p>
        <p style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#555", lineHeight: 1.6, maxWidth: "480px" }}>
          La agenda del próximo mes todavía no está publicada. Definimos nuevas sesiones estratégicas según las necesidades del grupo y el momento del negocio.
        </p>
      </div>
    </div>
  )
}
