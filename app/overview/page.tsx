"use client"

import { useEffect, useState } from "react"
import { DashboardLayout, useActiveClient, useSelectedMonth } from "@/components/dashboard-layout"
import { MetricCard } from "@/components/metric-card"
import { HealthScoreRing } from "@/components/health-score-ring"
import { SkeletonCard, EmptyState } from "@/components/skeleton"
import { DataModal, Field, FormSection, INPUT } from "@/components/data-modal"
import { createClient } from "@/lib/supabaseClient"
import { useClientMetrics } from "@/hooks/useClientMetrics"
import { useManychatPipeline } from "@/hooks/useManychatPipeline"
import { useAdsMetrics } from "@/hooks/useAdsMetrics"
import { useSalesPipeline } from "@/hooks/useSalesPipeline"
import { useContentPieces } from "@/hooks/useContentPieces"
import { useMonthlyMetrics } from "@/hooks/useMonthlyMetrics"
import { useEODCloser } from "@/hooks/useEODCloser"
import { useEODSetter } from "@/hooks/useEODSetter"
import { calculateHealthScore } from "@/lib/health-score"
import { SECTION_LABEL, CARD_P } from "@/lib/styles"
import { WeeklyComparison } from "@/components/weekly-comparison"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: "#0d0d0d",
        border: "0.5px solid #222",
        borderRadius: "8px",
        padding: "10px 14px",
      }}
    >
      <p style={{ fontSize: "10px", color: "#555", fontFamily: "sans-serif", marginBottom: "4px", letterSpacing: "2px" }}>
        {label}
      </p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ fontSize: "13px", fontFamily: "Georgia, serif", color: "#f5f5f5" }}>
          {p.value}
        </p>
      ))}
    </div>
  )
}


function SmartAlertButton({
  clientId,
  alert,
}: {
  clientId: string | null
  alert: { type: "warning" | "danger"; title: string; description: string }
}) {
  const [loading, setLoading] = useState(false)
  const [recommendation, setRecommendation] = useState<string | null>(null)

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    setRecommendation(null)
    try {
      const res = await fetch("/api/smart-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          alertTitle: alert.title,
          alertDescription: alert.description,
          alertType: alert.type,
        }),
      })
      const json = await res.json()
      setRecommendation(json.recommendation ?? "No se pudo generar una recomendación.")
    } catch {
      setRecommendation("Error al conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingLeft: "13px" }}>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          alignSelf: "flex-start",
          padding: "6px 14px",
          borderRadius: "6px",
          border: `0.5px solid ${alert.type === "danger" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
          background: "transparent",
          color: alert.type === "danger" ? "#f87171" : "#fbbf24",
          fontSize: "10px",
          fontFamily: "sans-serif",
          fontWeight: 400,
          letterSpacing: "1px",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
          transition: "opacity 0.2s",
        }}
      >
        {loading ? "Analizando…" : "¿Qué hago?"}
      </button>
      {recommendation && (
        <div style={{
          padding: "12px 14px",
          background: "#080808",
          border: "0.5px solid #1a1a1a",
          borderRadius: "8px",
          maxWidth: "480px",
        }}>
          {recommendation.split("\n").filter(Boolean).map((line, i) => (
            <p key={i} style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#9ca3af", lineHeight: 1.7 }}>
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function AlertsSection({
  clientId,
  adsData,
  pipelineData,
  pendingClosuresCount,
}: {
  clientId: string | null
  adsData: ReturnType<typeof useAdsMetrics>["data"]
  pipelineData: ReturnType<typeof useManychatPipeline>["data"]
  pendingClosuresCount: number
}) {
  const alerts: { type: "warning" | "danger"; title: string; description: string; action: string; link?: string }[] = []

  // Frecuencia de creativos
  if (adsData) {
    for (const c of adsData.creatives) {
      if (c.frequency >= 1.8) {
        alerts.push({
          type: "danger",
          title: `Creativo con frecuencia crítica`,
          description: `"${c.name}" tiene frecuencia ${c.frequency.toFixed(2)} — audiencia agotada.`,
          action: "Pausar creativo y rotar inmediatamente",
        })
      } else if (c.frequency >= 1.5) {
        alerts.push({
          type: "warning",
          title: `Creativo con frecuencia elevada`,
          description: `"${c.name}" tiene frecuencia ${c.frequency.toFixed(2)} — empezando a saturar.`,
          action: "Preparar creativo de reemplazo",
        })
      }
    }
  }

  // ManyChat — sistema parado
  if (pipelineData && pipelineData.newConversations === 0) {
    alerts.push({
      type: "danger",
      title: "Sistema ManyChat parado",
      description: "No entraron conversaciones nuevas. Verificar que los disparadores de ManyChat están activos.",
      action: "Revisar disparadores en ManyChat",
    })
  }

  // Tasa de respuesta ManyChat
  if (pipelineData && pipelineData.responseRate < 40) {
    alerts.push({
      type: "danger",
      title: "Tasa de respuesta crítica",
      description: `La tasa de respuesta de las abridoras está en ${pipelineData.responseRate}%. Por debajo del 40% el sistema no es viable. Reescribir el mensaje de apertura.`,
      action: "Reescribir abridoras en ManyChat",
    })
  } else if (pipelineData && pipelineData.responseRate < 55) {
    alerts.push({
      type: "warning",
      title: "Tasa de respuesta baja",
      description: `La tasa de respuesta está en ${pipelineData.responseRate}%. El óptimo es 70%+. Considerar ajustar el mensaje de apertura.`,
      action: "Optimizar mensaje de apertura",
    })
  }

  // Seguimientos acumulados
  if (pipelineData && pipelineData.pendingFollowUps > 20) {
    alerts.push({
      type: "warning",
      title: "Seguimientos acumulados",
      description: `${pipelineData.pendingFollowUps} seguimientos pendientes sin atender. El setter tiene que revisar y ejecutar.`,
      action: "Revisar pipeline en ManyChat",
    })
  }

  // Cierres pendientes de registrar
  if (pendingClosuresCount > 0) {
    alerts.push({
      type: "warning",
      title: "Cierres pendientes de registrar",
      description: `Hay ${pendingClosuresCount} cierre${pendingClosuresCount > 1 ? "s" : ""} detectado${pendingClosuresCount > 1 ? "s" : ""} en ManyChat sin registrar en el dashboard.`,
      action: "Registrar ahora",
      link: "/acquisition",
    })
  }

  if (alerts.length === 0) {
    return (
      <div
        style={{
          ...CARD_P,
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#22c55e",
            flexShrink: 0,
            animation: "pulse-dot 2s infinite",
          }}
        />
        <p style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#9ca3af" }}>
          Sistema funcionando correctamente — sin alertas activas.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {alerts.map((alert, i) => (
        <div
          key={i}
          style={{
            background: alert.type === "danger" ? "#1a0a0a" : "#1a120a",
            border: `0.5px solid ${alert.type === "danger" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
            borderRadius: "10px",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: alert.type === "danger" ? "#ef4444" : "#f59e0b",
                flexShrink: 0,
              }}
            />
            <p
              style={{
                fontSize: "11px",
                fontFamily: "sans-serif",
                fontWeight: 400,
                color: alert.type === "danger" ? "#f87171" : "#fbbf24",
                letterSpacing: "1px",
              }}
            >
              {alert.title}
            </p>
          </div>
          <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#9ca3af", paddingLeft: "13px" }}>
            {alert.description}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingLeft: "13px" }}>
            <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 300, color: "#555", letterSpacing: "1px" }}>
              Acción → {alert.link ? (
                <a href={alert.link} style={{ color: "#22c55e", textDecoration: "none" }}>{alert.action}</a>
              ) : alert.action}
            </p>
          </div>
          <SmartAlertButton clientId={clientId} alert={alert} />
        </div>
      ))}
    </div>
  )
}

interface MonthlyAnalysis {
  analysis_text: string | null
  key_insights: { insight: string; type: "positive" | "negative" | "neutral" }[]
  recommendations: { action: string; priority: "alta" | "media" | "baja" }[]
  status: string
}

const MONTH_NAMES_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

function AnalysisDots() {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setFrame((f) => (f + 1) % 4), 420)
    return () => clearInterval(t)
  }, [])
  return <span style={{ color: "#22c55e", letterSpacing: "2px" }}>{"·".repeat(frame + 1)}</span>
}

function MonthlyAnalysisSection({ clientId }: { clientId: string | null }) {
  const [analysis, setAnalysis] = useState<MonthlyAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const monthLabel = MONTH_NAMES_ES[month - 1]

  useEffect(() => {
    if (!clientId) return
    setLoading(true)
    setError(null)
    fetch(`/api/monthly-analysis?client_id=${clientId}&month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.status === "completed") setAnalysis(json.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [clientId, month, year])

  const handleGenerate = async () => {
    if (!clientId || generating) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch("/api/monthly-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, month, year }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "Error al generar el análisis.")
      } else if (json.data?.status === "completed") {
        setAnalysis(json.data)
      }
    } catch {
      setError("No se pudo conectar con el servidor.")
    } finally {
      setGenerating(false)
    }
  }

  const priorityColor = (p: string) =>
    p === "alta" ? "#ef4444" : p === "media" ? "#f59e0b" : "#22c55e"

  const priorityBg = (p: string) =>
    p === "alta" ? "rgba(239,68,68,0.05)" : p === "media" ? "rgba(245,158,11,0.05)" : "rgba(34,197,94,0.05)"

  const priorityBorder = (p: string) =>
    p === "alta" ? "rgba(239,68,68,0.1)" : p === "media" ? "rgba(245,158,11,0.1)" : "rgba(34,197,94,0.1)"

  const insightDot = (t: string) =>
    t === "positive" ? "#22c55e" : t === "negative" ? "#ef4444" : "#555"

  return (
    <div>
      <p style={SECTION_LABEL}>Análisis mensual IA</p>
      <div style={{ ...CARD_P, display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <p style={{ fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: 400, color: "#e5e5e5", letterSpacing: "-0.3px" }}>
              {monthLabel} {year}
            </p>
            <p style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#444", marginTop: "4px", letterSpacing: "0.2px" }}>
              {analysis ? "Análisis generado con datos reales del mes." : "Diagnóstico estratégico generado por IA con los datos del cliente."}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {analysis && !generating && (
              <button
                onClick={() => { setAnalysis(null); handleGenerate() }}
                style={{ padding: "7px 14px", borderRadius: "6px", border: "0.5px solid #1a1a1a", background: "transparent", color: "#444", fontSize: "9px", fontFamily: "sans-serif", letterSpacing: "1.5px", textTransform: "uppercase", cursor: "pointer" }}
              >
                Regenerar
              </button>
            )}
            {!analysis && !generating && (
              <button
                onClick={handleGenerate}
                disabled={!clientId}
                style={{ padding: "9px 22px", borderRadius: "7px", border: "none", background: !clientId ? "#111" : "#22c55e", color: !clientId ? "#333" : "#000", fontSize: "10px", fontFamily: "sans-serif", fontWeight: 600, letterSpacing: "2.5px", textTransform: "uppercase", cursor: !clientId ? "not-allowed" : "pointer" }}
              >
                Generar análisis
              </button>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && !analysis && (
          <p style={{ fontSize: "12px", fontFamily: "sans-serif", color: "#333" }}>Cargando análisis…</p>
        )}

        {/* Generating */}
        {generating && (
          <div style={{ padding: "24px", background: "#080808", border: "0.5px solid #111", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,0.5)" }} />
              <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 400, color: "#888" }}>
                Claude está analizando los datos del mes <AnalysisDots />
              </p>
            </div>
            <p style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#333", paddingLeft: "16px", lineHeight: 1.6 }}>
              Revisando KPIs, pipeline de ventas, ángulos de contenido y adquisición. Esto puede tardar entre 10 y 30 segundos.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !analysis && !generating && !error && (
          <div style={{ padding: "32px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <p style={{ fontSize: "28px", lineHeight: 1, color: "#1a1a1a" }}>◎</p>
            <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#444", textAlign: "center", maxWidth: "320px", lineHeight: 1.7 }}>
              {clientId
                ? `No hay análisis generado para ${monthLabel} ${year}. Presioná el botón para obtener el diagnóstico estratégico del mes.`
                : "Seleccioná un cliente para ver el análisis mensual."}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: "14px 16px", background: "rgba(239,68,68,0.04)", border: "0.5px solid rgba(239,68,68,0.12)", borderRadius: "8px" }}>
            <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#f87171", lineHeight: 1.5 }}>{error}</p>
          </div>
        )}

        {/* Result */}
        {analysis && analysis.status === "completed" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

            {/* Narrative */}
            {analysis.analysis_text && (
              <div>
                <p style={{ fontSize: "9px", fontFamily: "sans-serif", letterSpacing: "2.5px", color: "#333", marginBottom: "14px", textTransform: "uppercase" }}>Diagnóstico</p>
                <div style={{ borderLeft: "1.5px solid #1a1a1a", paddingLeft: "18px" }}>
                  {analysis.analysis_text.split("\n").filter(Boolean).map((para, i, arr) => (
                    <p key={i} style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#9ca3af", lineHeight: 1.8, marginBottom: i < arr.length - 1 ? "14px" : 0 }}>
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {analysis.key_insights.length > 0 && (
              <div>
                <p style={{ fontSize: "9px", fontFamily: "sans-serif", letterSpacing: "2.5px", color: "#333", marginBottom: "14px", textTransform: "uppercase" }}>Insights clave</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {analysis.key_insights.map((ins, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: insightDot(ins.type), flexShrink: 0, marginTop: "7px" }} />
                      <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: ins.type === "positive" ? "#6ee7b7" : ins.type === "negative" ? "#fca5a5" : "#9ca3af", lineHeight: 1.65 }}>
                        {ins.insight}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div>
                <p style={{ fontSize: "9px", fontFamily: "sans-serif", letterSpacing: "2.5px", color: "#333", marginBottom: "14px", textTransform: "uppercase" }}>Próximos pasos</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 16px", background: priorityBg(rec.priority), border: `0.5px solid ${priorityBorder(rec.priority)}`, borderRadius: "8px" }}>
                      <span style={{ fontSize: "8px", fontFamily: "sans-serif", color: priorityColor(rec.priority), letterSpacing: "1.5px", flexShrink: 0, marginTop: "3px", textTransform: "uppercase", minWidth: "32px" }}>
                        {rec.priority}
                      </span>
                      <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#aaa", lineHeight: 1.65 }}>{rec.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  )
}

const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

function OverviewContent() {
  const clientId = useActiveClient()
  const selectedMonth = useSelectedMonth()
  const { data: metrics, loading: metricsLoading } = useClientMetrics(clientId, selectedMonth)
  const { data: pipelineData } = useManychatPipeline(clientId)
  const { data: adsData } = useAdsMetrics(clientId)
  const { data: sales } = useSalesPipeline(clientId)
  const { data: contentPieces } = useContentPieces(clientId, selectedMonth)
  const { data: monthly } = useMonthlyMetrics(clientId)
  const { entries: eodCloserEntries } = useEODCloser(clientId)
  const { entries: eodSetterEntries } = useEODSetter(clientId)

  // Tendencias: últimos 6 meses reales
  const recentMonths = [...monthly].sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  ).slice(-6)
  const conversationsData = recentMonths.map((m) => ({ mes: m.label, value: m.totalConversations }))
  const followersData = recentMonths.map((m) => ({ mes: m.label, value: m.newFollowers }))
  const callsData = recentMonths.map((m) => ({ mes: m.label, value: m.callsBooked }))

  // Previous month for MetricCard comparison
  const prevMonth = recentMonths.length >= 2 ? recentMonths[recentMonths.length - 2] : null

  // ── Health score dinámico ─────────────────────────────────────────────────
  const avgCtr = adsData?.creatives.length
    ? adsData.creatives.reduce((s, c) => s + c.ctr, 0) / adsData.creatives.length : 0
  const avgFrequency = adsData?.creatives.length
    ? adsData.creatives.reduce((s, c) => s + c.frequency, 0) / adsData.creatives.length : 0
  const totalAttended = sales?.leads.filter((l) => l.attended).length ?? 0
  const totalClosed = sales?.leads.filter((l) => l.closed).length ?? 0
  const closeRate = totalAttended > 0 ? totalClosed / totalAttended : 0
  const pendingCalls = sales?.callsScheduled ?? 0
  const projectedCloses = Math.round(pendingCalls * closeRate)
  const contentPublishedPct = contentPieces.length > 0
    ? Math.round((contentPieces.filter((p) => p.status === "publicado").length / contentPieces.length) * 100)
    : 50
  const closesVsProjection = projectedCloses > 0
    ? Math.min(Math.round((totalClosed / projectedCloses) * 100), 100)
    : 50
  const healthScore = calculateHealthScore({
    responseRate: pipelineData?.responseRate ?? 50,
    avgCtr: avgCtr > 0 ? avgCtr : 2.0,
    avgFrequency: avgFrequency > 0 ? avgFrequency : 1.5,
    callAttendanceRate: sales?.attendanceRate ?? 50,
    contentPublishedPct,
    closesVsProjection,
  })

  // ── Pending closures count ────────────────────────────────────────────────
  const [pendingClosuresCount, setPendingClosuresCount] = useState(0)
  useEffect(() => {
    if (!clientId) return
    const supabase = createClient()
    supabase
      .from("pending_closures")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("status", "pending")
      .then(({ count }) => setPendingClosuresCount(count ?? 0))
  }, [clientId])

  // ── Monthly report modal ──────────────────────────────────────────────────
  const [monthModal, setMonthModal] = useState(false)
  const [monthSaving, setMonthSaving] = useState(false)
  const [monthError, setMonthError] = useState<string | null>(null)
  const _now = new Date()
  const [monthForm, setMonthForm] = useState({
    mes: String(_now.getMonth() + 1),
    anio: String(_now.getFullYear()),
    // Financiero
    cash_collected: "",
    revenue_share: "",
    total_revenue: "",
    mrr: "",
    ad_spend: "",
    software_costs: "",
    variable_costs: "",
    // Ventas
    calls_booked: "",
    calls_attended: "",
    closes: "",
    qualified_calls: "",
    offer_docs_sent: "",
    offer_docs_responded: "",
    cierres_por_offerdoc: "",
    // Adquisición
    new_followers: "",
    total_conversations: "",
    aplications: "",
    active_clients: "",
    // Contenido corto
    short_followers: "",
    short_reach: "",
    short_posts: "",
    // YouTube
    yt_subscribers: "",
    yt_new_subscribers: "",
    yt_views: "",
    yt_monthly_audience: "",
    yt_watch_time: "",
    yt_videos: "",
    // Email
    email_subscribers: "",
    email_new_subscribers: "",
    // General
    health_score: "",
    // Cualitativo
    biggest_win: "",
    next_focus: "",
    support_needed: "",
    improvements: "",
  })

  const handleSaveMonth = async () => {
    if (!clientId) {
      setMonthError("No hay cliente activo. Iniciá sesión con un usuario vinculado a un cliente.")
      return
    }
    setMonthSaving(true)
    setMonthError(null)
    try {
      const supabase = createClient()

      const monthDateStr = `${monthForm.anio}-${String(monthForm.mes).padStart(2, "0")}-01`
      const n = (v: string) => (v !== "" ? Number(v) : null)
      const t = (v: string) => (v.trim() !== "" ? v.trim() : null)
      const payload = {
        client_id: clientId,
        month: monthDateStr,
        report_date: monthDateStr,
        // Financiero
        cash_collected:    n(monthForm.cash_collected),
        revenue_share:     n(monthForm.revenue_share),
        total_revenue:     n(monthForm.total_revenue),
        mrr:               n(monthForm.mrr),
        ad_spend:          n(monthForm.ad_spend),
        software_costs:    n(monthForm.software_costs),
        variable_costs:    n(monthForm.variable_costs),
        // Ventas
        scheduled_calls:         n(monthForm.calls_booked),
        attended_calls:          n(monthForm.calls_attended),
        new_clients:             n(monthForm.closes),
        qualified_calls:         n(monthForm.qualified_calls),
        offer_docs_sent:         n(monthForm.offer_docs_sent),
        offer_docs_responded:    n(monthForm.offer_docs_responded),
        cierres_por_offerdoc:    n(monthForm.cierres_por_offerdoc),
        // Adquisición
        new_followers:     n(monthForm.new_followers),
        inbound_messages:  n(monthForm.total_conversations),
        aplications:       n(monthForm.aplications),
        active_clients:    n(monthForm.active_clients),
        // Contenido corto
        short_followers:   n(monthForm.short_followers),
        short_reach:       n(monthForm.short_reach),
        short_posts:       n(monthForm.short_posts),
        // YouTube
        yt_subscribers:        n(monthForm.yt_subscribers),
        yt_new_subscribers:    n(monthForm.yt_new_subscribers),
        yt_views:              n(monthForm.yt_views),
        yt_monthly_audience:   n(monthForm.yt_monthly_audience),
        yt_watch_time:         n(monthForm.yt_watch_time),
        yt_videos:             n(monthForm.yt_videos),
        // Email
        email_subscribers:      n(monthForm.email_subscribers),
        email_new_subscribers:  n(monthForm.email_new_subscribers),
        // General
        health_score:  n(monthForm.health_score),
        // Cualitativo
        biggest_win:      t(monthForm.biggest_win),
        next_focus:       t(monthForm.next_focus),
        support_needed:   t(monthForm.support_needed),
        improvements:     t(monthForm.improvements),
      }
      console.log("[monthly_reports payload]", payload)

      const { data, error } = await supabase
        .from("monthly_reports")
        .upsert(payload, { onConflict: "client_id,month" })

      if (error) {
        console.error("[monthly_reports upsert][SUPABASE ERROR RAW]", error)
        console.error("[monthly_reports upsert][SUPABASE ERROR PARSED]", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        })
        setMonthError(error.message || "Error al guardar.")
        return
      }

      console.log("[monthly_reports upsert][OK]", data)
      setMonthModal(false)
      setMonthError(null)
      // Recargar para actualizar el selector de meses y todos los hooks
      window.location.reload()
    } catch (e: any) {
      console.error("[monthly_reports upsert][JS ERROR RAW]", e)
      const msg = e instanceof Error ? e.message : e?.message || "Error al guardar. Revisá la consola."
      setMonthError(msg)
    } finally {
      setMonthSaving(false)
    }
  }

  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div>
          <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", marginBottom: "10px", textTransform: "uppercase" }}>
            Resumen del mes
          </p>
          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "30px",
              fontWeight: 400,
              color: "#f5f5f5",
              letterSpacing: "1px",
              lineHeight: 1.1,
              marginBottom: "10px",
            }}
          >
            Panel de control
          </h1>
          <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#666", letterSpacing: "1px" }}>
            {today}
          </p>
        </div>
        <HealthScoreRing score={healthScore} size={80} />
      </div>

      {/* KPI Cards */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <p style={{ ...SECTION_LABEL, marginBottom: 0 }}>Métricas clave</p>
          <button
            onClick={() => {
              // Auto-fill from EOD data for current month
              const now = new Date()
              const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
              const cEntries = eodCloserEntries.filter((e) => e.date.startsWith(monthStr))
              const sEntries = eodSetterEntries.filter((e) => e.date.startsWith(monthStr))
              if (cEntries.length > 0 || sEntries.length > 0) {
                const closerTotals = cEntries.reduce(
                  (a, e) => ({ agendadas: a.agendadas + e.llamadasAgendadas, asistidas: a.asistidas + e.llamadasAsistidas, cerrados: a.cerrados + e.cerrados, monto: a.monto + e.monto }),
                  { agendadas: 0, asistidas: 0, cerrados: 0, monto: 0 }
                )
                setMonthForm((f) => ({
                  ...f,
                  calls_booked: closerTotals.agendadas > 0 ? String(closerTotals.agendadas) : f.calls_booked,
                  calls_attended: closerTotals.asistidas > 0 ? String(closerTotals.asistidas) : f.calls_attended,
                  closes: closerTotals.cerrados > 0 ? String(closerTotals.cerrados) : f.closes,
                  cash_collected: closerTotals.monto > 0 ? String(closerTotals.monto) : f.cash_collected,
                }))
              }
              setMonthModal(true)
            }}
            style={{ background: "rgba(34,197,94,0.08)", border: "0.5px solid rgba(34,197,94,0.25)", borderRadius: "6px", padding: "6px 16px", fontSize: "9px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "2px", color: "#4ade80", cursor: "pointer", textTransform: "uppercase" }}
          >
            + Cargar mes
          </button>
        </div>
        {metricsLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} height="100px" />)}
          </div>
        ) : !metrics ? (
          <EmptyState
            message="Sin datos para este período."
            subMessage="Los datos aparecerán cuando se carguen los registros del cliente."
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
            <MetricCard
              label="Cash collected"
              value={metrics.cashCollected}
              previousValue={prevMonth?.cashCollected ?? undefined}
              prefix="$"
              highlight
            />
            <MetricCard
              label="Fee NOVA"
              value={metrics.revenueShare}
              previousValue={prevMonth?.revenueShare ?? undefined}
              prefix="$"
            />
            <MetricCard
              label="Llamadas calificadas"
              value={metrics.qualifiedCalls}
              previousValue={prevMonth?.callsBooked ?? undefined}
              alert={metrics.qualifiedCalls < 60 ? "warning" : null}
            />
            <MetricCard
              label="Seguidores nuevos"
              value={metrics.newFollowers}
              previousValue={prevMonth?.newFollowers ?? undefined}
              suffix=" seg"
            />
          </div>
        )}
      </div>

      {/* Alerts */}
      <div>
        <p style={SECTION_LABEL}>Alertas activas</p>
        <AlertsSection clientId={clientId} adsData={adsData} pipelineData={pipelineData} pendingClosuresCount={pendingClosuresCount} />
      </div>

      {/* Weekly Comparison */}
      {sales?.leads && sales.leads.length > 0 && (
        <WeeklyComparison leads={sales.leads} />
      )}

      {/* Mini Charts */}
      <div>
        <p style={SECTION_LABEL}>Tendencias</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "12px",
          }}
        >
          {/* Conversaciones ManyChat */}
          <div style={CARD_P}>
            <p style={{ fontSize: "9px", color: "#333", fontFamily: "sans-serif", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "16px" }}>
              Conversaciones por mes
            </p>
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={conversationsData}>
                <CartesianGrid strokeDasharray="1 4" stroke="#111" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: "#333", fontSize: 9, fontFamily: "sans-serif" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#22c55e"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3, fill: "#22c55e" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Seguidores nuevos */}
          <div style={CARD_P}>
            <p style={{ fontSize: "9px", color: "#333", fontFamily: "sans-serif", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "16px" }}>
              Seguidores nuevos por mes
            </p>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={followersData}>
                <CartesianGrid strokeDasharray="1 4" stroke="#111" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: "#333", fontSize: 9, fontFamily: "sans-serif" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#22c55e" radius={[2, 2, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Llamadas agendadas */}
          <div style={CARD_P}>
            <p style={{ fontSize: "9px", color: "#333", fontFamily: "sans-serif", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "16px" }}>
              Llamadas agendadas por mes
            </p>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={callsData}>
                <CartesianGrid strokeDasharray="1 4" stroke="#111" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: "#333", fontSize: 9, fontFamily: "sans-serif" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#f5f5f5" radius={[2, 2, 0, 0]} opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly AI Analysis */}
      <MonthlyAnalysisSection clientId={clientId} />

      {/* ── Monthly report modal ── */}
      <DataModal
        open={monthModal}
        onClose={() => setMonthModal(false)}
        title="Reporte mensual"
        subtitle="Se guarda en monthly_reports (upsert por mes/año)."
        onSubmit={handleSaveMonth}
        loading={monthSaving}
      >
        {/* Período */}
        <FormSection label="Período">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field label="Mes">
              <select value={monthForm.mes} onChange={(e) => setMonthForm((f) => ({ ...f, mes: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                {MONTHS_ES.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
              </select>
            </Field>
            <Field label="Año">
              <input type="number" value={monthForm.anio} onChange={(e) => setMonthForm((f) => ({ ...f, anio: e.target.value }))} style={INPUT} placeholder="2026" />
            </Field>
          </div>
        </FormSection>

        {/* Financiero */}
        <FormSection label="Financiero">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field label="Cash Collected ($)"><input type="number" value={monthForm.cash_collected} onChange={(e) => setMonthForm((f) => ({ ...f, cash_collected: e.target.value }))} style={INPUT} placeholder="48500" /></Field>
            <Field label="Revenue Share ($)"><input type="number" value={monthForm.revenue_share} onChange={(e) => setMonthForm((f) => ({ ...f, revenue_share: e.target.value }))} style={INPUT} placeholder="14550" /></Field>
            <Field label="Revenue Total ($)"><input type="number" value={monthForm.total_revenue} onChange={(e) => setMonthForm((f) => ({ ...f, total_revenue: e.target.value }))} style={INPUT} placeholder="60000" /></Field>
            <Field label="MRR ($)"><input type="number" value={monthForm.mrr} onChange={(e) => setMonthForm((f) => ({ ...f, mrr: e.target.value }))} style={INPUT} placeholder="20000" /></Field>
            <Field label="Ad Spend ($)"><input type="number" value={monthForm.ad_spend} onChange={(e) => setMonthForm((f) => ({ ...f, ad_spend: e.target.value }))} style={INPUT} placeholder="4200" /></Field>
            <Field label="Software Costs ($)"><input type="number" value={monthForm.software_costs} onChange={(e) => setMonthForm((f) => ({ ...f, software_costs: e.target.value }))} style={INPUT} placeholder="800" /></Field>
            <Field label="Variable Costs ($)"><input type="number" value={monthForm.variable_costs} onChange={(e) => setMonthForm((f) => ({ ...f, variable_costs: e.target.value }))} style={INPUT} placeholder="1200" /></Field>
          </div>
        </FormSection>

        {/* Ventas */}
        <FormSection label="Ventas">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <Field label="Llamadas agendadas"><input type="number" value={monthForm.calls_booked} onChange={(e) => setMonthForm((f) => ({ ...f, calls_booked: e.target.value }))} style={INPUT} placeholder="23" /></Field>
            <Field label="Llamadas atendidas"><input type="number" value={monthForm.calls_attended} onChange={(e) => setMonthForm((f) => ({ ...f, calls_attended: e.target.value }))} style={INPUT} placeholder="18" /></Field>
            <Field label="Calificadas"><input type="number" value={monthForm.qualified_calls} onChange={(e) => setMonthForm((f) => ({ ...f, qualified_calls: e.target.value }))} style={INPUT} placeholder="12" /></Field>
            <Field label="Cierres"><input type="number" value={monthForm.closes} onChange={(e) => setMonthForm((f) => ({ ...f, closes: e.target.value }))} style={INPUT} placeholder="8" /></Field>
            <Field label="Offer Docs enviados"><input type="number" value={monthForm.offer_docs_sent} onChange={(e) => setMonthForm((f) => ({ ...f, offer_docs_sent: e.target.value }))} style={INPUT} placeholder="10" /></Field>
            <Field label="Offer Docs respondidos"><input type="number" value={monthForm.offer_docs_responded} onChange={(e) => setMonthForm((f) => ({ ...f, offer_docs_responded: e.target.value }))} style={INPUT} placeholder="7" /></Field>
            <Field label="Cierres por Offer Doc"><input type="number" value={monthForm.cierres_por_offerdoc} onChange={(e) => setMonthForm((f) => ({ ...f, cierres_por_offerdoc: e.target.value }))} style={INPUT} placeholder="3" /></Field>
          </div>
        </FormSection>

        {/* Adquisición */}
        <FormSection label="Adquisición">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field label="Seguidores nuevos"><input type="number" value={monthForm.new_followers} onChange={(e) => setMonthForm((f) => ({ ...f, new_followers: e.target.value }))} style={INPUT} placeholder="3240" /></Field>
            <Field label="Conversaciones ManyChat"><input type="number" value={monthForm.total_conversations} onChange={(e) => setMonthForm((f) => ({ ...f, total_conversations: e.target.value }))} style={INPUT} placeholder="580" /></Field>
            <Field label="Aplicaciones"><input type="number" value={monthForm.aplications} onChange={(e) => setMonthForm((f) => ({ ...f, aplications: e.target.value }))} style={INPUT} placeholder="45" /></Field>
            <Field label="Clientes activos"><input type="number" value={monthForm.active_clients} onChange={(e) => setMonthForm((f) => ({ ...f, active_clients: e.target.value }))} style={INPUT} placeholder="12" /></Field>
          </div>
        </FormSection>

        {/* Contenido corto */}
        <FormSection label="Contenido (Short / Reels)">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <Field label="Seguidores totales"><input type="number" value={monthForm.short_followers} onChange={(e) => setMonthForm((f) => ({ ...f, short_followers: e.target.value }))} style={INPUT} placeholder="28400" /></Field>
            <Field label="Alcance"><input type="number" value={monthForm.short_reach} onChange={(e) => setMonthForm((f) => ({ ...f, short_reach: e.target.value }))} style={INPUT} placeholder="120000" /></Field>
            <Field label="Posts publicados"><input type="number" value={monthForm.short_posts} onChange={(e) => setMonthForm((f) => ({ ...f, short_posts: e.target.value }))} style={INPUT} placeholder="20" /></Field>
          </div>
        </FormSection>

        {/* YouTube */}
        <FormSection label="YouTube">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <Field label="Suscriptores totales"><input type="number" value={monthForm.yt_subscribers} onChange={(e) => setMonthForm((f) => ({ ...f, yt_subscribers: e.target.value }))} style={INPUT} placeholder="4200" /></Field>
            <Field label="Suscriptores nuevos"><input type="number" value={monthForm.yt_new_subscribers} onChange={(e) => setMonthForm((f) => ({ ...f, yt_new_subscribers: e.target.value }))} style={INPUT} placeholder="320" /></Field>
            <Field label="Views"><input type="number" value={monthForm.yt_views} onChange={(e) => setMonthForm((f) => ({ ...f, yt_views: e.target.value }))} style={INPUT} placeholder="18000" /></Field>
            <Field label="Audiencia mensual"><input type="number" value={monthForm.yt_monthly_audience} onChange={(e) => setMonthForm((f) => ({ ...f, yt_monthly_audience: e.target.value }))} style={INPUT} placeholder="9000" /></Field>
            <Field label="Watch time (hs)"><input type="number" value={monthForm.yt_watch_time} onChange={(e) => setMonthForm((f) => ({ ...f, yt_watch_time: e.target.value }))} style={INPUT} placeholder="850" /></Field>
            <Field label="Videos publicados"><input type="number" value={monthForm.yt_videos} onChange={(e) => setMonthForm((f) => ({ ...f, yt_videos: e.target.value }))} style={INPUT} placeholder="4" /></Field>
          </div>
        </FormSection>

        {/* Email */}
        <FormSection label="Email">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field label="Suscriptores totales"><input type="number" value={monthForm.email_subscribers} onChange={(e) => setMonthForm((f) => ({ ...f, email_subscribers: e.target.value }))} style={INPUT} placeholder="2800" /></Field>
            <Field label="Suscriptores nuevos"><input type="number" value={monthForm.email_new_subscribers} onChange={(e) => setMonthForm((f) => ({ ...f, email_new_subscribers: e.target.value }))} style={INPUT} placeholder="180" /></Field>
          </div>
        </FormSection>

        {/* General */}
        <FormSection label="General">
          <Field label="Health Score (0–100)">
            <input type="number" min="0" max="100" value={monthForm.health_score} onChange={(e) => setMonthForm((f) => ({ ...f, health_score: e.target.value }))} style={INPUT} placeholder="89" />
          </Field>
        </FormSection>

        {/* Cualitativo */}
        <FormSection label="Notas">
          <Field label="Mayor logro del mes">
            <textarea value={monthForm.biggest_win} onChange={(e) => setMonthForm((f) => ({ ...f, biggest_win: e.target.value }))} style={{ ...INPUT, minHeight: "64px", resize: "vertical" }} placeholder="Cerramos el cliente más grande hasta ahora..." />
          </Field>
          <Field label="Foco del próximo mes">
            <textarea value={monthForm.next_focus} onChange={(e) => setMonthForm((f) => ({ ...f, next_focus: e.target.value }))} style={{ ...INPUT, minHeight: "64px", resize: "vertical" }} placeholder="Mejorar tasa de asistencia a llamadas..." />
          </Field>
          <Field label="Soporte necesario">
            <textarea value={monthForm.support_needed} onChange={(e) => setMonthForm((f) => ({ ...f, support_needed: e.target.value }))} style={{ ...INPUT, minHeight: "64px", resize: "vertical" }} placeholder="Necesito ayuda con..." />
          </Field>
          <Field label="Mejoras sugeridas">
            <textarea value={monthForm.improvements} onChange={(e) => setMonthForm((f) => ({ ...f, improvements: e.target.value }))} style={{ ...INPUT, minHeight: "64px", resize: "vertical" }} placeholder="Podríamos mejorar..." />
          </Field>
        </FormSection>

        {monthError && (
          <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.06)", border: "0.5px solid rgba(239,68,68,0.2)", borderRadius: "8px" }}>
            <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#f87171" }}>{monthError}</p>
          </div>
        )}
      </DataModal>
    </div>
  )
}

export default function OverviewPage() {
  return (
    <DashboardLayout>
      <OverviewContent />
    </DashboardLayout>
  )
}
