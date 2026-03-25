"use client"

import { DashboardLayout, useActiveClient, useSelectedMonth } from "@/components/dashboard-layout"
import { HealthScoreRing } from "@/components/health-score-ring"
import { SkeletonCard, EmptyState } from "@/components/skeleton"
import { useMonthlyMetrics } from "@/hooks/useMonthlyMetrics"
import { useSalesPipeline } from "@/hooks/useSalesPipeline"
import { useAdsMetrics } from "@/hooks/useAdsMetrics"
import { useManychatPipeline } from "@/hooks/useManychatPipeline"
import { calculateHealthScore, getHealthScoreComponents } from "@/lib/health-score"
import { useContentPieces } from "@/hooks/useContentPieces"
import { SECTION_LABEL, CARD_P, TH, TD } from "@/lib/styles"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "#0d0d0d", border: "0.5px solid #222", borderRadius: "8px", padding: "12px 16px" }}>
      <p style={{ fontSize: "9px", color: "#555", fontFamily: "sans-serif", letterSpacing: "2px", marginBottom: "8px" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: p.color, marginBottom: "2px" }}>
          {p.name}: ${Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  )
}

function getHealthColor(score: number) {
  if (score >= 75) return "#22c55e"
  if (score >= 50) return "#f59e0b"
  return "#ef4444"
}

function ProjectionsContent() {
  const clientId = useActiveClient()
  const selectedMonth = useSelectedMonth()
  const { data: monthly, loading: monthlyLoading } = useMonthlyMetrics(clientId)
  const { data: sales, loading: salesLoading } = useSalesPipeline(clientId)
  const { data: ads } = useAdsMetrics(clientId)
  const { data: pipeline } = useManychatPipeline(clientId)
  const { data: contentPieces } = useContentPieces(clientId, selectedMonth)

  const loading = monthlyLoading || salesLoading

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        <div>
          <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", marginBottom: "10px", textTransform: "uppercase" }}>Visibilidad del negocio</p>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#f5f5f5" }}>Proyecciones</div>
        </div>
        <SkeletonCard height="220px" />
        <SkeletonCard height="160px" />
        <SkeletonCard height="280px" />
      </div>
    )
  }

  if (!sales && monthly.length === 0 && !ads && !pipeline) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        <div>
          <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", marginBottom: "10px", textTransform: "uppercase" }}>Visibilidad del negocio</p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#f5f5f5" }}>Proyecciones</h1>
        </div>
        <EmptyState message="Sin datos suficientes para proyectar." subMessage="Las proyecciones aparecerán cuando haya registros de ventas y métricas mensuales." />
      </div>
    )
  }

  // Derive projection constants from real data
  const sortedMonthly = [...monthly].sort((a, b) =>
    b.year !== a.year ? b.year - a.year : b.month - a.month
  )
  const lastMonth = sortedMonthly[0]

  const pendingCalls = sales?.callsScheduled ?? 0
  const totalAttended = sales?.leads.filter((l) => l.attended).length ?? 0
  const totalClosed = sales?.leads.filter((l) => l.closed).length ?? 0
  const closeRate = totalAttended > 0 ? totalClosed / totalAttended : 0

  // Use monthly_reports if available, otherwise derive from sales_pipeline closed leads
  const closedLeadsRevenue = sales?.leads.filter((l) => l.closed).reduce((s, l) => s + l.amount, 0) ?? 0
  const aov = lastMonth && lastMonth.closes > 0
    ? Math.round(lastMonth.cashCollected / lastMonth.closes)
    : totalClosed > 0 ? Math.round(closedLeadsRevenue / totalClosed) : 0

  const revenueSharePct = 30
  const monthlyGoal = lastMonth?.cashCollected ? Math.round(lastMonth.cashCollected * 1.2) : 50000

  const projectedCash = Math.round(pendingCalls * closeRate * aov)
  const projectedNova = Math.round(projectedCash * revenueSharePct / 100)
  const progressPct = monthlyGoal > 0 ? Math.min((projectedCash / monthlyGoal) * 100, 100) : 0

  // Real content published %
  const contentPublishedPct = contentPieces.length > 0
    ? Math.round((contentPieces.filter((p) => p.status === "publicado").length / contentPieces.length) * 100)
    : 50

  // Real closes vs projection
  const projectedCloses = Math.round(pendingCalls * closeRate)
  const closesVsProjection = projectedCloses > 0
    ? Math.min(Math.round((totalClosed / projectedCloses) * 100), 100)
    : 50

  // Derive health score inputs from real data
  const avgCtr = ads?.creatives.length
    ? ads.creatives.reduce((s, c) => s + c.ctr, 0) / ads.creatives.length
    : 0
  const avgFrequency = ads?.creatives.length
    ? ads.creatives.reduce((s, c) => s + c.frequency, 0) / ads.creatives.length
    : 0

  const healthInputs = {
    responseRate: pipeline?.responseRate ?? 50,
    avgCtr: avgCtr > 0 ? avgCtr : 2.0,
    avgFrequency: avgFrequency > 0 ? avgFrequency : 1.5,
    callAttendanceRate: sales?.attendanceRate ?? 50,
    contentPublishedPct,
    closesVsProjection,
  }

  const healthScore = calculateHealthScore(healthInputs)
  const components = getHealthScoreComponents(healthInputs)

  // 6-month projection from last known cash (fallback: closed leads revenue, then 30000)
  const baseCash = lastMonth?.cashCollected ?? (closedLeadsRevenue > 0 ? closedLeadsRevenue : 30000)
  const MONTH_NAMES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
  const projectionData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() + i + 1)
    return {
      month: MONTH_NAMES[d.getMonth()],
      conservador: Math.round(baseCash * Math.pow(1.03, i + 1)),
      medio: Math.round(baseCash * Math.pow(1.08, i + 1)),
      optimista: Math.round(baseCash * Math.pow(1.15, i + 1)),
    }
  })

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
      {/* Header */}
      <div>
        <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", marginBottom: "10px", textTransform: "uppercase" }}>
          Visibilidad del negocio
        </p>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#f5f5f5", letterSpacing: "1px" }}>
          Proyecciones
        </h1>
      </div>

      {/* Health Score */}
      <div>
        <p style={SECTION_LABEL}>Health score del sistema</p>
        <div style={{ ...CARD_P, display: "flex", flexDirection: "column", alignItems: "center", gap: "32px" }}>
          <HealthScoreRing score={healthScore} size={100} />

          <div style={{ width: "100%", maxWidth: "600px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Componente", "Valor actual", "Peso", "Puntos"].map((h) => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {components.map((c) => {
                  const pct = Math.min((c.points / c.maxPoints) * 100, 100)
                  const barColor = pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444"
                  return (
                    <tr key={c.name}>
                      <td style={{ ...TD, color: "#d4d4d4" }}>{c.name}</td>
                      <td style={TD}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontFamily: "Georgia, serif", fontSize: "13px", color: "#f5f5f5", minWidth: "42px" }}>
                            {c.formatted}
                          </span>
                          <div style={{ flex: 1, height: "2px", background: "#1a1a1a", borderRadius: "9999px", overflow: "hidden", minWidth: "80px" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: "9999px", transition: "width 0.4s" }} />
                          </div>
                        </div>
                      </td>
                      <td style={TD}>{c.weight}%</td>
                      <td style={{ ...TD, fontFamily: "Georgia, serif", color: barColor }}>
                        {c.points}/{c.maxPoints}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Proyección del mes */}
      <div>
        <p style={SECTION_LABEL}>Proyección del mes actual</p>
        <div style={{ ...CARD_P, display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
            <div>
              <p style={{ fontSize: "9px", color: "#333", fontFamily: "sans-serif", letterSpacing: "3px", marginBottom: "6px" }}>LLAMADAS AGENDADAS</p>
              <p style={{ fontFamily: "Georgia, serif", fontSize: "28px", color: "#f5f5f5" }}>{pendingCalls}</p>
            </div>
            <div>
              <p style={{ fontSize: "9px", color: "#333", fontFamily: "sans-serif", letterSpacing: "3px", marginBottom: "6px" }}>TASA CIERRE HISTÓRICA</p>
              <p style={{ fontFamily: "Georgia, serif", fontSize: "28px", color: "#f5f5f5" }}>{(closeRate * 100).toFixed(0)}%</p>
            </div>
            <div>
              <p style={{ fontSize: "9px", color: "#333", fontFamily: "sans-serif", letterSpacing: "3px", marginBottom: "6px" }}>AOV PROMEDIO</p>
              <p style={{ fontFamily: "Georgia, serif", fontSize: "28px", color: "#f5f5f5" }}>{aov > 0 ? `$${aov.toLocaleString()}` : "—"}</p>
            </div>
          </div>

          <div style={{ height: "0.5px", background: "#111" }} />

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "9px", color: "#4ade80", fontFamily: "sans-serif", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "6px" }}>
                Revenue proyectado NOVA
              </p>
              <p style={{ fontFamily: "Georgia, serif", fontSize: "48px", fontWeight: 400, color: "#22c55e", letterSpacing: "2px", lineHeight: 1 }}>
                {projectedNova > 0 ? `$${projectedNova.toLocaleString()}` : "—"}
              </p>
              <p style={{ fontSize: "10px", color: "#333", fontFamily: "sans-serif", marginTop: "6px", letterSpacing: "2px" }}>
                {revenueSharePct}% de {projectedCash > 0 ? `$${projectedCash.toLocaleString()}` : "$0"} proyectado
              </p>
            </div>
            {monthlyGoal > 0 && (
              <div style={{ width: "200px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <p style={{ fontSize: "9px", color: "#333", fontFamily: "sans-serif", letterSpacing: "2px" }}>Objetivo del mes</p>
                  <p style={{ fontSize: "9px", color: "#22c55e", fontFamily: "sans-serif" }}>{progressPct.toFixed(0)}%</p>
                </div>
                <div style={{ height: "3px", background: "#111", borderRadius: "9999px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progressPct}%`, background: "#22c55e", borderRadius: "9999px", transition: "width 0.5s ease" }} />
                </div>
                <p style={{ fontSize: "9px", color: "#333", fontFamily: "sans-serif", marginTop: "4px", letterSpacing: "2px" }}>
                  Meta: ${monthlyGoal.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Proyección 6 meses */}
      {baseCash > 0 && (
        <div>
          <p style={SECTION_LABEL}>Proyección a 6 meses (cash collected)</p>
          <div style={CARD_P}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={projectionData}>
                <defs>
                  <linearGradient id="optimista" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="medio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="conservador" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.04} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="1 4" stroke="#111" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#333", fontSize: 9, fontFamily: "sans-serif" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="optimista" name="Optimista" stroke="#22c55e" strokeWidth={1.5} fill="url(#optimista)" />
                <Area type="monotone" dataKey="medio" name="Medio" stroke="#22c55e" strokeWidth={1.5} strokeOpacity={0.6} fill="url(#medio)" />
                <Area type="monotone" dataKey="conservador" name="Conservador" stroke="#22c55e" strokeWidth={1} strokeOpacity={0.3} strokeDasharray="4 3" fill="url(#conservador)" />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: "20px", marginTop: "12px" }}>
              {[
                { label: "Optimista (+15%/mes)", opacity: 1 },
                { label: "Medio (+8%/mes)", opacity: 0.6 },
                { label: "Conservador (+3%/mes)", opacity: 0.3 },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "16px", height: "1px", background: "#22c55e", opacity: s.opacity }} />
                  <span style={{ fontSize: "9px", color: "#333", fontFamily: "sans-serif", letterSpacing: "2px" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProjectionsPage() {
  return (
    <DashboardLayout>
      <ProjectionsContent />
    </DashboardLayout>
  )
}
