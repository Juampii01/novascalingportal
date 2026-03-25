"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout, useUserRole } from "@/components/dashboard-layout"
import { SECTION_LABEL } from "@/lib/styles"

interface ClientSummary {
  clientId: string
  clientName: string
  expertName: string | null
  niche: string | null
  healthScore: number
  cashThisMonth: number
  revenueShare: number
  closes: number
  callsBooked: number
  revenueTrend: number | null
  activeLeads: number
  attendanceRate: number
  lastMonthLabel: string | null
  totalMonths: number
  eodAperturas: number
  eodRevenue: number
  setterLoggedToday: boolean
  closerLoggedToday: boolean
  daysSinceSetter: number | null
  daysSinceCloser: number | null
}

function healthColor(s: number) {
  if (s >= 75) return "#22c55e"
  if (s >= 50) return "#f59e0b"
  if (s > 0)  return "#ef4444"
  return "#333"
}

function fmt(n: number) {
  return n.toLocaleString("es-AR")
}

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) return null
  const up = value >= 0
  return (
    <span style={{ fontSize: "9px", fontFamily: "sans-serif", color: up ? "#22c55e" : "#ef4444" }}>
      {up ? "↑" : "↓"}{Math.abs(value)}%
    </span>
  )
}

function EODPill({ logged, daysSince, label }: { logged: boolean; daysSince: number | null; label: string }) {
  if (logged) return (
    <span style={{ fontSize: "8px", padding: "2px 7px", borderRadius: "9999px", background: "rgba(34,197,94,0.08)", border: "0.5px solid rgba(34,197,94,0.2)", color: "#22c55e", fontFamily: "sans-serif", letterSpacing: "1.5px" }}>
      {label} ✓
    </span>
  )
  if (daysSince !== null && daysSince <= 3) return (
    <span style={{ fontSize: "8px", padding: "2px 7px", borderRadius: "9999px", background: "rgba(245,158,11,0.06)", border: "0.5px solid rgba(245,158,11,0.2)", color: "#f59e0b", fontFamily: "sans-serif", letterSpacing: "1.5px" }}>
      {label} {daysSince}d
    </span>
  )
  if (daysSince !== null && daysSince > 3) return (
    <span style={{ fontSize: "8px", padding: "2px 7px", borderRadius: "9999px", background: "rgba(239,68,68,0.06)", border: "0.5px solid rgba(239,68,68,0.15)", color: "#ef4444", fontFamily: "sans-serif", letterSpacing: "1.5px" }}>
      {label} {daysSince}d
    </span>
  )
  return (
    <span style={{ fontSize: "8px", padding: "2px 7px", borderRadius: "9999px", border: "0.5px solid #1a1a1a", color: "#333", fontFamily: "sans-serif", letterSpacing: "1.5px" }}>
      {label} —
    </span>
  )
}

function ClientCard({ client, onSelect }: { client: ClientSummary; onSelect: (id: string) => void }) {
  const [hovered, setHovered] = useState(false)
  const hc = healthColor(client.healthScore)

  return (
    <div
      onClick={() => onSelect(client.clientId)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#0f0f0f" : "#0d0d0d",
        border: `0.5px solid ${hovered ? "#222" : "#111"}`,
        borderRadius: "12px", padding: "22px 24px", cursor: "pointer",
        transition: "all 0.18s ease", display: "flex", flexDirection: "column", gap: "18px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: "Georgia, serif", fontSize: "16px", fontWeight: 400,
            color: hovered ? "#f5f5f5" : "#e5e5e5", letterSpacing: "-0.2px",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", transition: "color 0.18s",
          }}>
            {client.clientName}
          </p>
          {client.niche && (
            <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 300, color: "#444", marginTop: "3px" }}>
              {client.niche}
            </p>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: "26px", fontWeight: 400, color: hc, lineHeight: 1 }}>
            {client.healthScore > 0 ? client.healthScore : "—"}
          </p>
          <p style={{ fontSize: "7px", fontFamily: "sans-serif", color: "#333", letterSpacing: "2px", textTransform: "uppercase", marginTop: "3px" }}>health</p>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
        <div>
          <p style={{ fontSize: "8px", fontFamily: "sans-serif", color: "#444", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "5px" }}>Revenue</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
            <p style={{ fontFamily: "Georgia, serif", fontSize: "15px", color: client.cashThisMonth > 0 ? "#f5f5f5" : "#2a2a2a" }}>
              {client.cashThisMonth > 0 ? `$${fmt(client.cashThisMonth)}` : "—"}
            </p>
            <TrendBadge value={client.revenueTrend} />
          </div>
        </div>
        <div>
          <p style={{ fontSize: "8px", fontFamily: "sans-serif", color: "#444", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "5px" }}>Cierres</p>
          <p style={{ fontFamily: "Georgia, serif", fontSize: "15px", color: client.closes > 0 ? "#f5f5f5" : "#2a2a2a" }}>
            {client.closes > 0 ? client.closes : "—"}
          </p>
        </div>
        <div>
          <p style={{ fontSize: "8px", fontFamily: "sans-serif", color: "#444", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "5px" }}>Pipeline</p>
          <p style={{ fontFamily: "Georgia, serif", fontSize: "15px", color: client.activeLeads > 0 ? "#f5f5f5" : "#2a2a2a" }}>
            {client.activeLeads > 0 ? client.activeLeads : "—"}
          </p>
        </div>
      </div>

      {/* EOD pills */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        <EODPill logged={client.setterLoggedToday} daysSince={client.daysSinceSetter} label="Setter" />
        <EODPill logged={client.closerLoggedToday} daysSince={client.daysSinceCloser} label="Closer" />
        {client.eodAperturas > 0 && (
          <span style={{ fontSize: "8px", padding: "2px 7px", borderRadius: "9999px", border: "0.5px solid #1a1a1a", color: "#444", fontFamily: "sans-serif", letterSpacing: "1px" }}>
            {client.eodAperturas} aperturas
          </span>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "0.5px solid #111", paddingTop: "12px" }}>
        <div style={{ display: "flex", gap: "14px" }}>
          {client.attendanceRate > 0 && (
            <p style={{ fontSize: "10px", fontFamily: "sans-serif", color: "#555" }}>
              <span style={{ color: client.attendanceRate >= 70 ? "#22c55e" : client.attendanceRate >= 50 ? "#f59e0b" : "#ef4444" }}>
                {client.attendanceRate}%
              </span>{" "}asistencia
            </p>
          )}
          {client.callsBooked > 0 && (
            <p style={{ fontSize: "10px", fontFamily: "sans-serif", color: "#555" }}>
              {client.callsBooked} llamadas
            </p>
          )}
        </div>
        <p style={{ fontSize: "9px", fontFamily: "sans-serif", color: hovered ? "#555" : "#222", transition: "color 0.18s" }}>
          {client.lastMonthLabel ?? "Sin datos"} →
        </p>
      </div>
    </div>
  )
}

function AdminContent() {
  useUserRole()
  const router = useRouter()
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"health" | "revenue" | "activity" | "name">("health")

  useEffect(() => {
    fetch("/api/admin/clients")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) setError(json.error)
        else setClients(json.clients ?? [])
      })
      .catch(() => setError("No se pudo cargar la lista de clientes."))
      .finally(() => setLoading(false))
  }, [])

  const filtered = clients
    .filter((c) =>
      !search ||
      c.clientName.toLowerCase().includes(search.toLowerCase()) ||
      (c.niche ?? "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "revenue")  return b.cashThisMonth - a.cashThisMonth
      if (sortBy === "name")     return a.clientName.localeCompare(b.clientName)
      if (sortBy === "activity") {
        const aDay = Math.min(a.daysSinceSetter ?? 99, a.daysSinceCloser ?? 99)
        const bDay = Math.min(b.daysSinceSetter ?? 99, b.daysSinceCloser ?? 99)
        return aDay - bDay
      }
      if (a.healthScore === 0 && b.healthScore > 0) return 1
      if (b.healthScore === 0 && a.healthScore > 0) return -1
      return b.healthScore - a.healthScore
    })

  const handleSelect = (clientId: string) => {
    if (typeof window !== "undefined") localStorage.setItem("activeClientId", clientId)
    router.push("/overview")
  }

  const totalRevenue = clients.reduce((s, c) => s + c.cashThisMonth, 0)
  const totalLeads   = clients.reduce((s, c) => s + c.activeLeads, 0)
  const totalCloses  = clients.reduce((s, c) => s + c.closes, 0)
  const avgHealth    = clients.length > 0 ? Math.round(clients.reduce((s, c) => s + c.healthScore, 0) / clients.length) : 0
  const loggedToday  = clients.filter((c) => c.setterLoggedToday || c.closerLoggedToday).length
  const sinActividad = clients.filter((c) => Math.min(c.daysSinceSetter ?? 99, c.daysSinceCloser ?? 99) > 3).length
  const alertClients = clients.filter((c) => c.healthScore > 0 && c.healthScore < 50).length

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", textTransform: "uppercase", marginBottom: "10px" }}>
            Admin · Vista global
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "28px", fontWeight: 400, color: "#f5f5f5", letterSpacing: "-0.5px" }}>
            Todos los clientes
          </h1>
        </div>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente…"
          style={{ background: "#0d0d0d", border: "0.5px solid #1a1a1a", borderRadius: "8px", padding: "10px 16px", color: "#f5f5f5", fontSize: "12px", fontFamily: "sans-serif", outline: "none", width: "220px", transition: "border-color 0.2s" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)")}
          onBlur={(e)  => (e.currentTarget.style.borderColor = "#1a1a1a")}
        />
      </div>

      {/* Summary KPIs */}
      {clients.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: "10px" }}>
          {[
            { label: "Clientes activos",  value: String(clients.length),         color: "#f5f5f5" },
            { label: "Revenue total mes", value: totalRevenue > 0 ? `$${fmt(totalRevenue)}` : "—", color: totalRevenue > 0 ? "#22c55e" : "#333" },
            { label: "Cierres del mes",   value: String(totalCloses),            color: "#f5f5f5" },
            { label: "Leads pipeline",    value: String(totalLeads),             color: "#f5f5f5" },
            { label: "Health promedio",   value: avgHealth > 0 ? String(avgHealth) : "—", color: healthColor(avgHealth) },
            { label: "EOD hoy",           value: `${loggedToday}/${clients.length}`, color: loggedToday === clients.length ? "#22c55e" : "#f59e0b" },
            { label: "Sin actividad +3d", value: String(sinActividad),           color: sinActividad > 0 ? "#ef4444" : "#22c55e" },
            { label: "En alerta",         value: String(alertClients),           color: alertClients > 0 ? "#ef4444" : "#22c55e" },
          ].map((item) => (
            <div key={item.label} style={{ background: "#0d0d0d", border: "0.5px solid #111", borderRadius: "10px", padding: "16px 18px" }}>
              <p style={{ fontSize: "8px", fontFamily: "sans-serif", color: "#444", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>{item.label}</p>
              <p style={{ fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: 400, color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sort tabs */}
      {clients.length > 0 && (
        <div style={{ display: "flex", borderBottom: "0.5px solid #111" }}>
          {(["health", "revenue", "activity", "name"] as const).map((s) => {
            const labels = { health: "Health", revenue: "Revenue", activity: "Actividad EOD", name: "Nombre" }
            return (
              <button key={s} onClick={() => setSortBy(s)} style={{
                background: "none", border: "none", cursor: "pointer", padding: "10px 18px",
                fontSize: "11px", fontFamily: "sans-serif", fontWeight: sortBy === s ? 500 : 400,
                color: sortBy === s ? "#f5f5f5" : "#555",
                borderBottom: sortBy === s ? "1.5px solid #22c55e" : "1.5px solid transparent",
                marginBottom: "-0.5px", transition: "all 0.15s",
              }}>
                {labels[s]}
              </button>
            )
          })}
        </div>
      )}

      {/* Grid */}
      <div>
        <p style={{ ...SECTION_LABEL, marginBottom: "16px" }}>
          {filtered.length} {filtered.length === 1 ? "cliente" : "clientes"}
          {search ? ` · "${search}"` : ""}
        </p>

        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ background: "#0d0d0d", border: "0.5px solid #111", borderRadius: "12px", height: "200px", opacity: 0.3 }} />
            ))}
          </div>
        )}

        {error && (
          <div style={{ padding: "16px", background: "rgba(239,68,68,0.05)", border: "0.5px solid rgba(239,68,68,0.15)", borderRadius: "8px" }}>
            <p style={{ fontSize: "12px", fontFamily: "sans-serif", color: "#f87171" }}>{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p style={{ fontSize: "13px", fontFamily: "sans-serif", color: "#444", padding: "40px 0", textAlign: "center" }}>
            {search ? "No hay clientes que coincidan." : "No hay clientes registrados todavía."}
          </p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
            {filtered.map((c) => (
              <ClientCard key={c.clientId} client={c} onSelect={handleSelect} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <DashboardLayout>
      <AdminContent />
    </DashboardLayout>
  )
}
