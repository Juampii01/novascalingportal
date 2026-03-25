"use client"

import { DashboardLayout, useActiveClient } from "@/components/dashboard-layout"
import { AngleCard } from "@/components/angle-card"
import { SkeletonCard, EmptyState } from "@/components/skeleton"
import { useTraceability } from "@/hooks/useTraceability"
import { createClient } from "@/lib/supabaseClient"
import { SECTION_LABEL, CARD_P, TH, TD } from "@/lib/styles"
import { useEffect, useState } from "react"

const categoryColors: Record<string, string> = {
  Problema: "#3b82f6",
  Solución: "#14b8a6",
  Producto: "#f59e0b",
  Mentalidad: "#a855f7",
}

type SortKey = "date" | "revenue" | "angle"

function TraceabilityContent() {
  const clientId = useActiveClient()
  const { data, loading, refetch } = useTraceability(clientId)
  const [sortBy, setSortBy] = useState<SortKey>("date")
  const [manychatBotId, setManychatBotId] = useState<string | null>(null)

  // Fetch bot ID from profile
  useEffect(() => {
    if (!clientId) return
    const supabase = createClient()
    supabase.from("nova_client_profile").select("manychat_bot_id").eq("client_id", clientId).maybeSingle()
      .then(({ data: p }) => { if (p?.manychat_bot_id) setManychatBotId(p.manychat_bot_id) })
  }, [clientId])
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  const handleSync = async () => {
    if (!clientId) return
    setSyncing(true)
    setSyncMsg(null)
    try {
      const supabase = createClient()
      const { data: leads, error } = await supabase
        .from("sales_pipeline")
        .select("origin_angle, origin_category, amount")
        .eq("client_id", clientId)
        .eq("closed", true)
        .not("origin_angle", "is", null)
      if (error) throw error

      const angleMap = new Map<string, { category: string; total_closes: number; total_revenue: number }>()
      for (const lead of leads ?? []) {
        const key = lead.origin_angle as string
        const existing = angleMap.get(key)
        if (existing) {
          existing.total_closes += 1
          existing.total_revenue += Number(lead.amount ?? 0)
        } else {
          angleMap.set(key, { category: lead.origin_category ?? "Problema", total_closes: 1, total_revenue: Number(lead.amount ?? 0) })
        }
      }

      const now = new Date()
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`

      for (const [angle, d] of angleMap) {
        await supabase.from("content_angles").upsert(
          { client_id: clientId, month: monthStr, angle, category: d.category, total_closes: d.total_closes, total_revenue: d.total_revenue, is_winner: false },
          { onConflict: "client_id,month,angle" }
        )
      }

      // Mark top angle as winner
      if (angleMap.size > 0) {
        const top = Array.from(angleMap.entries()).sort((a, b) => b[1].total_closes - a[1].total_closes)[0][0]
        await supabase.from("content_angles").update({ is_winner: true }).eq("client_id", clientId).eq("month", monthStr).eq("angle", top)
      }

      setSyncMsg("Ángulos sincronizados")
      refetch()
    } catch (e) {
      console.error("[sync angles]", e)
      setSyncMsg("Error al sincronizar")
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(null), 2000)
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        <div>
          <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", marginBottom: "10px", textTransform: "uppercase" }}>Inteligencia comercial</p>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#f5f5f5" }}>Trazabilidad</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: "12px" }}>
          {[1,2,3].map((i) => <SkeletonCard key={i} height="140px" />)}
        </div>
        <SkeletonCard height="260px" />
      </div>
    )
  }

  if (!data || data.records.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", marginBottom: "10px", textTransform: "uppercase" }}>Inteligencia comercial</p>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#f5f5f5" }}>Trazabilidad</h1>
          </div>
        </div>
        <EmptyState message="Sin cierres registrados aún." subMessage="Cuando se registren ventas cerradas, aparecerán aquí con su ángulo de origen." />
      </div>
    )
  }

  const sorted = [...data.records].sort((a, b) => {
    if (sortBy === "date") return new Date(b.date).getTime() - new Date(a.date).getTime()
    if (sortBy === "revenue") return b.revenue - a.revenue
    return a.angle.localeCompare(b.angle)
  })

  const topAngles = [...data.angles]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 3)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", marginBottom: "10px", textTransform: "uppercase" }}>
            Inteligencia comercial
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#f5f5f5", letterSpacing: "1px" }}>
            Trazabilidad
          </h1>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          style={{
            fontSize: "11px",
            fontFamily: "sans-serif",
            fontWeight: 300,
            letterSpacing: "2px",
            textTransform: "uppercase",
            padding: "8px 18px",
            borderRadius: "8px",
            background: "transparent",
            border: "0.5px solid #222",
            color: syncing ? "#555" : "#888",
            cursor: syncing ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {syncing ? "Sincronizando…" : "Sincronizar desde ventas"}
        </button>
      </div>

      {/* Podio top ángulos */}
      <div>
        <p style={SECTION_LABEL}>Top ángulos del mes</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: "12px", alignItems: "end" }}>
          {topAngles[1] && (
            <AngleCard
              angle={topAngles[1].angle}
              category={topAngles[1].category}
              closes={topAngles[1].totalCloses}
              revenue={topAngles[1].totalRevenue}
              rank={2}
            />
          )}
          {topAngles[0] && (
            <AngleCard
              angle={topAngles[0].angle}
              category={topAngles[0].category}
              closes={topAngles[0].totalCloses}
              revenue={topAngles[0].totalRevenue}
              rank={1}
            />
          )}
          {topAngles[2] && (
            <AngleCard
              angle={topAngles[2].angle}
              category={topAngles[2].category}
              closes={topAngles[2].totalCloses}
              revenue={topAngles[2].totalRevenue}
              rank={3}
            />
          )}
        </div>
      </div>

      {/* Tabla de trazabilidad */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <p style={{ ...SECTION_LABEL, marginBottom: 0 }}>Registro de cierres</p>
          <div style={{ display: "flex", gap: "6px" }}>
            {([["date", "Fecha"], ["revenue", "Revenue"], ["angle", "Ángulo"]] as [SortKey, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                style={{
                  fontSize: "8px",
                  fontFamily: "sans-serif",
                  fontWeight: 300,
                  letterSpacing: "2px",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  background: sortBy === key ? "rgba(34,197,94,0.08)" : "#0d0d0d",
                  border: sortBy === key ? "0.5px solid rgba(34,197,94,0.3)" : "0.5px solid #111",
                  color: sortBy === key ? "#22c55e" : "#555",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ ...CARD_P, padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Cierre", "Fecha", "Ángulo origen", "Categoría", "Revenue", ""].map((h) => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const catColor = categoryColors[r.category] ?? "#555"
                const pieceColor = r.pieceCategory ? (categoryColors[r.pieceCategory] ?? "#555") : null
                return (
                  <tr key={r.id}>
                    <td style={{ ...TD, color: "#d4d4d4" }}>{r.closeName}</td>
                    <td style={TD}>{r.date}</td>
                    <td style={{ ...TD, maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.angle}
                    </td>
                    <td style={TD}>
                      <span style={{ fontSize: "8px", padding: "2px 8px", borderRadius: "9999px", background: `${catColor}12`, border: `0.5px solid ${catColor}25`, color: catColor, fontFamily: "sans-serif", letterSpacing: "2px" }}>
                        {r.category.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ ...TD, fontFamily: "Georgia, serif", color: "#22c55e" }}>
                      ${r.revenue.toLocaleString()}
                    </td>
                    <td style={TD}>
                      {r.subscriberId && manychatBotId && (
                        <a
                          href={`https://app.manychat.com/fb${manychatBotId}/subscribers/${r.subscriberId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: "9px", fontFamily: "sans-serif", letterSpacing: "2px", color: "#555", textDecoration: "none", textTransform: "uppercase", borderBottom: "0.5px solid #222", paddingBottom: "1px", transition: "color 0.15s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#888")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
                        >
                          ManyChat →
                        </a>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Todos los ángulos activos */}
      <div>
        <p style={SECTION_LABEL}>Todos los ángulos activos</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px" }}>
          {data.angles.map((a, i) => (
            <AngleCard
              key={a.angle}
              angle={a.angle}
              category={a.category}
              closes={a.totalCloses}
              revenue={a.totalRevenue}
              rank={i + 1}
            />
          ))}
        </div>
      </div>

      {/* Toast */}
      {syncMsg && (
        <div
          style={{
            position: "fixed",
            bottom: "32px",
            right: "32px",
            background: "#0d0d0d",
            border: `0.5px solid ${syncMsg === "Ángulos sincronizados" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
            borderRadius: "10px",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            zIndex: 1000,
          }}
        >
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: syncMsg === "Ángulos sincronizados" ? "#22c55e" : "#ef4444", flexShrink: 0 }} />
          <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#9ca3af" }}>
            {syncMsg}
          </p>
        </div>
      )}
    </div>
  )
}

export default function TraceabilityPage() {
  return (
    <DashboardLayout>
      <TraceabilityContent />
    </DashboardLayout>
  )
}
