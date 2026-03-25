"use client"

import { Fragment, useState, useRef, useEffect } from "react"
import { DashboardLayout, useActiveClient, useSelectedMonth } from "@/components/dashboard-layout"
import { MetricCard } from "@/components/metric-card"
import { FrequencyBar } from "@/components/frequency-bar"
import { StatusBadge } from "@/components/status-badge"
import { PipelineStep } from "@/components/pipeline-step"
import { DataModal, Field, INPUT } from "@/components/data-modal"
import { createClient } from "@/lib/supabaseClient"
import { useAdsMetrics } from "@/hooks/useAdsMetrics"
import { useManychatPipeline } from "@/hooks/useManychatPipeline"
import { useContentPieces, ContentPiece } from "@/hooks/useContentPieces"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SECTION_LABEL, CARD, CARD_P, TH, TD } from "@/lib/styles"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

const categoryColors: Record<string, string> = {
  Problema: "#3b82f6",
  Solución: "#14b8a6",
  Producto: "#f59e0b",
  Mentalidad: "#a855f7",
}

const statusStyles: Record<string, { bg: string; color: string }> = {
  publicado: { bg: "rgba(34,197,94,0.06)", color: "#22c55e" },
  borrador:  { bg: "rgba(85,85,85,0.1)",   color: "#555"    },
  atrasado:  { bg: "rgba(239,68,68,0.06)", color: "#ef4444" },
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "#0d0d0d", border: "0.5px solid #222", borderRadius: "8px", padding: "10px 14px" }}>
      <p style={{ fontSize: "12px", fontFamily: "Georgia, serif", color: "#f5f5f5" }}>
        {payload[0].name}: {payload[0].value}
      </p>
    </div>
  )
}

// ─── Tab: Follow Me Ads ───────────────────────────────────────────────────────
function FollowMeAdsTab({
  adsData,
  clientId,
}: {
  adsData: ReturnType<typeof useAdsMetrics>["data"]
  clientId: string | null
}) {
  const [adsModal, setAdsModal] = useState(false)
  const [adsSaving, setAdsSaving] = useState(false)
  const [adsError, setAdsError] = useState<string | null>(null)
  const today = new Date().toISOString().slice(0, 10)
  const [adsForm, setAdsForm] = useState({
    creative_name: "",
    spend: "",
    followers_gained: "",
    ctr: "",
    frequency: "",
    followers_per_day: "",
    status: "winner",
    date_from: today,
    date_to: today,
  })

  const setAds = (key: string, val: string) => setAdsForm((f) => ({ ...f, [key]: val }))

  const handleSaveAd = async () => {
    if (!clientId) { setAdsError("No hay cliente activo."); return }
    setAdsSaving(true)
    setAdsError(null)
    try {
      const supabase = createClient()
      const spend = Number(adsForm.spend) || 0
      const followers = Number(adsForm.followers_gained) || 0
      const { error: insErr } = await supabase.from("ads_metrics").insert({
        client_id: clientId,
        creative_name: adsForm.creative_name,
        spend,
        followers_gained: followers,
        cost_per_follower: followers > 0 ? spend / followers : 0,
        ctr: Number(adsForm.ctr) || null,
        frequency: Number(adsForm.frequency) || null,
        followers_per_day: Number(adsForm.followers_per_day) || null,
        status: adsForm.status,
        date_from: adsForm.date_from || null,
        date_to: adsForm.date_to || null,
      })
      if (insErr) throw insErr
      setAdsModal(false)
      setAdsError(null)
      setAdsForm({ creative_name: "", spend: "", followers_gained: "", ctr: "", frequency: "", followers_per_day: "", status: "winner", date_from: today, date_to: today })
    } catch (e: any) {
      setAdsError(e?.message ?? "Error al guardar.")
      console.error("[ads_metrics insert]", e)
    } finally {
      setAdsSaving(false)
    }
  }

  if (!adsData) return null

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* KPIs */}
      <div>
        <p style={SECTION_LABEL}>Resumen del mes</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <MetricCard label="Inversión total" value={adsData.totalSpend} prefix="$" />
          <MetricCard label="Costo por seguidor" value={`$${adsData.avgCostPerFollower.toFixed(2)}`} />
          <MetricCard label="Seguidores del mes" value={adsData.totalFollowers} />
        </div>
      </div>

      {/* Table */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <p style={{ ...SECTION_LABEL, marginBottom: 0 }}>Creativos activos</p>
          <button onClick={() => setAdsModal(true)} style={{ background: "rgba(34,197,94,0.08)", border: "0.5px solid rgba(34,197,94,0.25)", borderRadius: "6px", padding: "6px 16px", fontSize: "9px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "2px", color: "#4ade80", cursor: "pointer", textTransform: "uppercase" }}>
            + Agregar creativo
          </button>
        </div>
        <div style={{ ...CARD, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Nombre", "Costo/seg", "CTR", "Frecuencia", "Seg/día", "Estado"].map((h) => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adsData.creatives.map((c) => (
                <tr key={c.id}>
                  <td style={{ ...TD, color: "#d4d4d4" }}>{c.name}</td>
                  <td style={TD}>${c.costPerFollower.toFixed(2)}</td>
                  <td style={{ ...TD, color: c.ctr > 2.5 ? "#22c55e" : "#aaaaaa" }}>{c.ctr}%</td>
                  <td style={{ ...TD, minWidth: "120px" }}>
                    <FrequencyBar value={c.frequency} showLabel={false} />
                  </td>
                  <td style={TD}>{c.followersPerDay}/día</td>
                  <td style={TD}>
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ads Modal */}
      <DataModal open={adsModal} onClose={() => setAdsModal(false)} title="Agregar creativo" subtitle="Se inserta en ads_metrics." onSubmit={handleSaveAd} loading={adsSaving}>
        <Field label="Nombre del creativo">
          <input value={adsForm.creative_name} onChange={(e) => setAds("creative_name", e.target.value)} style={INPUT} placeholder="Historia con dolor — mamá que no puede pagar" />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Field label="Inversión ($)">
            <input type="number" value={adsForm.spend} onChange={(e) => setAds("spend", e.target.value)} style={INPUT} placeholder="980" />
          </Field>
          <Field label="Seguidores ganados">
            <input type="number" value={adsForm.followers_gained} onChange={(e) => setAds("followers_gained", e.target.value)} style={INPUT} placeholder="1127" />
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <Field label="CTR (%)">
            <input type="number" step="0.1" value={adsForm.ctr} onChange={(e) => setAds("ctr", e.target.value)} style={INPUT} placeholder="4.2" />
          </Field>
          <Field label="Frecuencia">
            <input type="number" step="0.1" value={adsForm.frequency} onChange={(e) => setAds("frequency", e.target.value)} style={INPUT} placeholder="1.1" />
          </Field>
          <Field label="Seg/día">
            <input type="number" value={adsForm.followers_per_day} onChange={(e) => setAds("followers_per_day", e.target.value)} style={INPUT} placeholder="48" />
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <Field label="Estado">
            <select value={adsForm.status} onChange={(e) => setAds("status", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
              <option value="winner">Winner</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
              <option value="inactive">Inactivo</option>
            </select>
          </Field>
          <Field label="Desde">
            <input type="date" value={adsForm.date_from} onChange={(e) => setAds("date_from", e.target.value)} style={INPUT} />
          </Field>
          <Field label="Hasta">
            <input type="date" value={adsForm.date_to} onChange={(e) => setAds("date_to", e.target.value)} style={INPUT} />
          </Field>
        </div>
        {adsError && (
          <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.06)", border: "0.5px solid rgba(239,68,68,0.2)", borderRadius: "8px" }}>
            <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#f87171" }}>{adsError}</p>
          </div>
        )}
      </DataModal>
    </div>
  )
}

// ─── Evolución semanal ────────────────────────────────────────────────────────
function WeeklyComparisonTable({ clientId }: { clientId: string | null }) {
  const [rows, setRows] = useState<any[]>([])

  useEffect(() => {
    if (!clientId) return
    const supabase = createClient()
    supabase
      .from("manychat_pipeline")
      .select("period_start, new_conversations, qualified_leads, booked, closed")
      .eq("client_id", clientId)
      .order("period_start", { ascending: false })
      .limit(4)
      .then(({ data }) => setRows((data ?? []).reverse()))
  }, [clientId])

  if (rows.length === 0) return null

  const trend = (curr: number, prev: number | undefined) => {
    if (prev === undefined) return <span style={{ color: "#555" }}>—</span>
    if (curr > prev) return <span style={{ color: "#22c55e" }}>↑</span>
    if (curr < prev) return <span style={{ color: "#ef4444" }}>↓</span>
    return <span style={{ color: "#555" }}>—</span>
  }

  const latestRow = rows[rows.length - 1]
  const prevRow = rows.length >= 2 ? rows[rows.length - 2] : null
  const latestConv = latestRow?.new_conversations ?? 0
  const prevConv = prevRow?.new_conversations ?? 0
  const latestClosed = latestRow?.closed ?? 0
  const prevClosed = prevRow?.closed ?? 0
  const latestConvRate = latestConv > 0 ? Math.round((latestClosed / latestConv) * 100) : 0
  const prevConvRate = prevConv > 0 ? Math.round((prevClosed / prevConv) * 100) : 0
  const trendPct = prevConvRate > 0 ? ((latestConvRate - prevConvRate) / prevConvRate) * 100 : 0

  const trendMsg = trendPct > 20
    ? { text: "El sistema mejoró esta semana", color: "#22c55e" }
    : trendPct < -20
    ? { text: "La conversión cayó esta semana — revisar el pipeline", color: "#ef4444" }
    : { text: "Sistema estable", color: "#888" }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <p style={{ ...SECTION_LABEL, marginBottom: 0 }}>Evolución semanal</p>
        <p style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: trendMsg.color }}>
          {trendMsg.text}
        </p>
      </div>
      <div style={{ ...CARD, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Semana", "Conversaciones", "Calificados", "Agendados", "Cierres", "Conversión"].map((h) => (
                <th key={h} style={TH}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const prev = i > 0 ? rows[i - 1] : undefined
              const conv = r.new_conversations ?? 0
              const closed = r.closed ?? 0
              const convRate = conv > 0 ? Math.round((closed / conv) * 100) : 0
              const prevConvRate2 = prev ? (prev.new_conversations > 0 ? Math.round(((prev.closed ?? 0) / prev.new_conversations) * 100) : 0) : undefined
              const isLatest = i === rows.length - 1
              return (
                <tr key={r.period_start} style={{ background: isLatest ? "rgba(34,197,94,0.04)" : i % 2 === 0 ? "#0d0d0d" : "#080808" }}>
                  <td style={{ ...TD, color: isLatest ? "#d4d4d4" : "#888" }}>{r.period_start}</td>
                  <td style={TD}>{conv} {trend(conv, prev?.new_conversations)}</td>
                  <td style={TD}>{r.qualified_leads ?? 0} {trend(r.qualified_leads ?? 0, prev?.qualified_leads)}</td>
                  <td style={TD}>{r.booked ?? 0} {trend(r.booked ?? 0, prev?.booked)}</td>
                  <td style={TD}>{closed} {trend(closed, prev?.closed)}</td>
                  <td style={{ ...TD, color: convRate > 10 ? "#22c55e" : "#888" }}>{convRate}% {trend(convRate, prevConvRate2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Tab: ManyChat ────────────────────────────────────────────────────────────
const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

function ManychatTab({
  data,
  clientId,
  onSynced,
}: {
  data: ReturnType<typeof useManychatPipeline>["data"]
  clientId: string | null
  onSynced?: () => void
}) {
  const [mcModal, setMcModal] = useState(false)
  const [mcSaving, setMcSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  const handleSync = async () => {
    if (!clientId) return
    setSyncing(true)
    setSyncMsg(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-manychat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
          "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
        },
        body: JSON.stringify({ client_id: clientId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Error al sincronizar")
      setSyncMsg(`Sincronizado — ${json.new_conversations ?? 0} leads nuevos`)
      onSynced?.()
    } catch (e: any) {
      setSyncMsg(e.message ?? "Error al sincronizar")
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(null), 3000)
    }
  }
  const today = new Date().toISOString().slice(0, 10)
  const [mcForm, setMcForm] = useState({
    period_start: today,
    period_end: today,
    new_conversations: "",
    response_rate: "",
    qualified_leads: "",
    unqualified_leads: "",
    calendar_sent: "",
    booked: "",
    closed: "",
    pending_follow_ups: "",
  })
  const [weeklyVals, setWeeklyVals] = useState(["", "", "", "", "", "", ""])

  const setMc = (key: string, val: string) => setMcForm((f) => ({ ...f, [key]: val }))

  const handleSaveMC = async () => {
    if (!clientId) return
    setMcSaving(true)
    try {
      const supabase = createClient()
      const weekly_conversations = DAYS_ES.map((day, i) => ({ day, value: Number(weeklyVals[i]) || 0 }))
      await supabase.from("manychat_pipeline").upsert({
        client_id: clientId,
        period_start: mcForm.period_start || null,
        period_end: mcForm.period_end || null,
        new_conversations: Number(mcForm.new_conversations) || null,
        response_rate: Number(mcForm.response_rate) || null,
        qualified_leads: Number(mcForm.qualified_leads) || null,
        unqualified_leads: Number(mcForm.unqualified_leads) || null,
        calendar_sent: Number(mcForm.calendar_sent) || null,
        booked: Number(mcForm.booked) || null,
        closed: Number(mcForm.closed) || null,
        pending_follow_ups: Number(mcForm.pending_follow_ups) || null,
        weekly_conversations,
      }, { onConflict: "client_id,period_start" })
      setMcModal(false)
    } catch { /* silent */ } finally {
      setMcSaving(false)
    }
  }

  if (!data) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ ...SECTION_LABEL, marginBottom: 0 }}>KPIs ManyChat</p>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{ background: "transparent", border: "0.5px solid #222", borderRadius: "6px", padding: "6px 14px", fontSize: "9px", fontFamily: "sans-serif", fontWeight: 300, letterSpacing: "2px", color: syncing ? "#444" : "#888", cursor: syncing ? "not-allowed" : "pointer", textTransform: "uppercase", transition: "all 0.15s" }}
          >
            {syncing ? "Sincronizando…" : "↻ Sincronizar"}
          </button>
          <button onClick={() => setMcModal(true)} style={{ background: "rgba(34,197,94,0.08)", border: "0.5px solid rgba(34,197,94,0.25)", borderRadius: "6px", padding: "6px 16px", fontSize: "9px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "2px", color: "#4ade80", cursor: "pointer", textTransform: "uppercase" }}>
            + Cargar pipeline
          </button>
        </div>
      </div>
      <div style={{ ...CARD_P, textAlign: "center" }}>
        <p style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#555" }}>
          No hay datos de ManyChat todavía. Sincronizá o cargá el pipeline manualmente.
        </p>
      </div>
      {syncMsg && (
        <div style={{ position: "fixed", bottom: "32px", right: "32px", background: "#0d0d0d", border: `0.5px solid ${syncMsg.startsWith("Error") || syncMsg.startsWith("API") ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`, borderRadius: "10px", padding: "14px 20px", display: "flex", alignItems: "center", gap: "10px", zIndex: 1000 }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: syncMsg.startsWith("Error") || syncMsg.startsWith("API") ? "#ef4444" : "#22c55e", flexShrink: 0 }} />
          <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#9ca3af" }}>{syncMsg}</p>
        </div>
      )}
      <DataModal open={mcModal} onClose={() => setMcModal(false)} title="Pipeline ManyChat" subtitle="Se guarda en manychat_pipeline." onSubmit={handleSaveMC} loading={mcSaving}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Field label="Período inicio"><input type="date" value={mcForm.period_start} onChange={(e) => setMc("period_start", e.target.value)} style={INPUT} /></Field>
          <Field label="Período fin"><input type="date" value={mcForm.period_end} onChange={(e) => setMc("period_end", e.target.value)} style={INPUT} /></Field>
        </div>
        <Field label="Leads nuevos"><input type="number" value={mcForm.new_conversations} onChange={(e) => setMc("new_conversations", e.target.value)} style={INPUT} placeholder="580" /></Field>
        <Field label="Tasa de respuesta (%)"><input type="number" value={mcForm.response_rate} onChange={(e) => setMc("response_rate", e.target.value)} style={INPUT} placeholder="74" /></Field>
      </DataModal>
    </div>
  )

  const pieData = [
    { name: "Calificados",     value: data.qualifiedLeads   },
    { name: "No calificados",  value: data.unqualifiedLeads },
  ]
  const total = data.steps[0]?.count ?? 1

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* KPIs */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <p style={{ ...SECTION_LABEL, marginBottom: 0 }}>KPIs ManyChat</p>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{ background: "transparent", border: "0.5px solid #222", borderRadius: "6px", padding: "6px 14px", fontSize: "9px", fontFamily: "sans-serif", fontWeight: 300, letterSpacing: "2px", color: syncing ? "#444" : "#888", cursor: syncing ? "not-allowed" : "pointer", textTransform: "uppercase", transition: "all 0.15s" }}
            >
              {syncing ? "Sincronizando…" : "↻ Sincronizar"}
            </button>
            <button onClick={() => setMcModal(true)} style={{ background: "rgba(34,197,94,0.08)", border: "0.5px solid rgba(34,197,94,0.25)", borderRadius: "6px", padding: "6px 16px", fontSize: "9px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "2px", color: "#4ade80", cursor: "pointer", textTransform: "uppercase" }}>
              + Cargar pipeline
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          <MetricCard label="Leads nuevos" value={data.newConversations} />
          <MetricCard label="Leads calificados" value={data.qualifiedLeads} />
          <MetricCard label="Descalificados" value={data.unqualifiedLeads} />
          <MetricCard label="Tasa de calificación" value={data.newConversations > 0 ? Math.round((data.qualifiedLeads / data.newConversations) * 100) : 0} suffix="%" alert={data.newConversations > 0 && (data.qualifiedLeads / data.newConversations) < 0.4 ? "warning" : null} />
          <MetricCard label="Calendario enviado" value={data.calendarSent} />
          <MetricCard label="Agendados" value={data.booked} />
          <MetricCard label="Cerrados" value={data.closed} />
          <MetricCard label="Seguimientos pendientes" value={data.pendingFollowUps} alert={data.pendingFollowUps > 10 ? "warning" : null} />
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Donut */}
        <div style={{ ...CARD, padding: "24px" }}>
          <p style={SECTION_LABEL}>Leads calificados vs no calificados</p>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={32} outerRadius={50} dataKey="value" strokeWidth={0}>
                  <Cell fill="#22c55e" opacity={0.8} />
                  <Cell fill="#1a1a1a" />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {pieData.map((d, i) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: i === 0 ? "#22c55e" : "#1a1a1a", border: i === 1 ? "0.5px solid #333" : "none", flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: "9px", color: "#555", fontFamily: "sans-serif", letterSpacing: "2px" }}>{d.name}</p>
                    <p style={{ fontSize: "18px", fontFamily: "Georgia, serif", color: "#f5f5f5" }}>{d.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pipeline */}
        <div style={{ ...CARD, padding: "24px" }}>
          <p style={SECTION_LABEL}>Pipeline de 7 pasos</p>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "4px", overflowX: "auto" }}>
            {data.steps.map((step, i) => (
              <div key={step.label} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
                <PipelineStep step={i + 1} label={step.label} count={step.count} total={total} isActive={step.count > 0} />
                {i < data.steps.length - 1 && (
                  <div style={{ width: "10px", height: "0.5px", background: "#1a1a1a", flexShrink: 0, marginBottom: "20px" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evolución semanal */}
      <WeeklyComparisonTable clientId={clientId} />

      {/* Sync toast */}
      {syncMsg && (
        <div style={{ position: "fixed", bottom: "32px", right: "32px", background: "#0d0d0d", border: `0.5px solid ${syncMsg.startsWith("Error") ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`, borderRadius: "10px", padding: "14px 20px", display: "flex", alignItems: "center", gap: "10px", zIndex: 1000 }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: syncMsg.startsWith("Error") ? "#ef4444" : "#22c55e", flexShrink: 0 }} />
          <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#9ca3af" }}>{syncMsg}</p>
        </div>
      )}

      {/* ManyChat Modal */}
      <DataModal open={mcModal} onClose={() => setMcModal(false)} title="Pipeline ManyChat" subtitle="Se guarda en manychat_pipeline (upsert por período)." onSubmit={handleSaveMC} loading={mcSaving}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Field label="Período inicio">
            <input type="date" value={mcForm.period_start} onChange={(e) => setMc("period_start", e.target.value)} style={INPUT} />
          </Field>
          <Field label="Período fin">
            <input type="date" value={mcForm.period_end} onChange={(e) => setMc("period_end", e.target.value)} style={INPUT} />
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Field label="Conversaciones nuevas">
            <input type="number" value={mcForm.new_conversations} onChange={(e) => setMc("new_conversations", e.target.value)} style={INPUT} placeholder="580" />
          </Field>
          <Field label="Tasa de respuesta (%)">
            <input type="number" value={mcForm.response_rate} onChange={(e) => setMc("response_rate", e.target.value)} style={INPUT} placeholder="74" />
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Field label="Calificados">
            <input type="number" value={mcForm.qualified_leads} onChange={(e) => setMc("qualified_leads", e.target.value)} style={INPUT} placeholder="87" />
          </Field>
          <Field label="No calificados">
            <input type="number" value={mcForm.unqualified_leads} onChange={(e) => setMc("unqualified_leads", e.target.value)} style={INPUT} placeholder="164" />
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <Field label="Calendario enviado">
            <input type="number" value={mcForm.calendar_sent} onChange={(e) => setMc("calendar_sent", e.target.value)} style={INPUT} placeholder="45" />
          </Field>
          <Field label="Agendados">
            <input type="number" value={mcForm.booked} onChange={(e) => setMc("booked", e.target.value)} style={INPUT} placeholder="38" />
          </Field>
          <Field label="Cierres">
            <input type="number" value={mcForm.closed} onChange={(e) => setMc("closed", e.target.value)} style={INPUT} placeholder="8" />
          </Field>
        </div>
        <Field label="Seguimientos pendientes">
          <input type="number" value={mcForm.pending_follow_ups} onChange={(e) => setMc("pending_follow_ups", e.target.value)} style={INPUT} placeholder="12" />
        </Field>
        <div>
          <p style={{ fontSize: "9px", color: "#555", fontFamily: "sans-serif", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>Conversaciones por día</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
            {DAYS_ES.map((day, i) => (
              <div key={day}>
                <p style={{ fontSize: "8px", color: "#333", fontFamily: "sans-serif", letterSpacing: "1px", textAlign: "center", marginBottom: "4px" }}>{day}</p>
                <input type="number" value={weeklyVals[i]} onChange={(e) => setWeeklyVals((v) => { const n = [...v]; n[i] = e.target.value; return n })} style={{ ...INPUT, textAlign: "center", padding: "7px 4px" }} placeholder="0" />
              </div>
            ))}
          </div>
        </div>
      </DataModal>
    </div>
  )
}

// ─── Chat markdown renderer ───────────────────────────────────────────────────
function renderChatInline(text: string, key: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((p, i) =>
    /^\*\*.*\*\*$/.test(p)
      ? <strong key={`${key}-b${i}`} style={{ fontWeight: 500, color: "#d4d4d4" }}>{p.slice(2, -2)}</strong>
      : <Fragment key={`${key}-t${i}`}>{p}</Fragment>
  )
}

function renderChatMessage(content: string) {
  if (!content) return null
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const raw = lines[i]
    const line = raw.trim()

    if (!line) {
      // collapse multiple blank lines into one small spacer
      elements.push(<div key={`sp-${i}`} style={{ height: "6px" }} />)
      i++
      continue
    }

    if (line.startsWith("# ")) {
      elements.push(
        <p key={`h1-${i}`} style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 500, color: "#f5f5f5", lineHeight: 1.5, marginBottom: "2px" }}>
          {renderChatInline(line.replace(/^#\s+/, ""), `h1-${i}`)}
        </p>
      )
      i++; continue
    }

    if (line.startsWith("## ")) {
      elements.push(
        <p key={`h2-${i}`} style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", color: "#4ade80", marginTop: "4px", marginBottom: "2px" }}>
          {line.replace(/^##\s+/, "")}
        </p>
      )
      i++; continue
    }

    if (line.startsWith("### ")) {
      elements.push(
        <p key={`h3-${i}`} style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 500, color: "#ccc", lineHeight: 1.5 }}>
          {renderChatInline(line.replace(/^###\s+/, ""), `h3-${i}`)}
        </p>
      )
      i++; continue
    }

    if (line.startsWith("- ") || line.startsWith("• ")) {
      elements.push(
        <div key={`li-${i}`} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#555", marginTop: "8px", flexShrink: 0 }} />
          <span style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#aaa", lineHeight: 1.6 }}>
            {renderChatInline(line.replace(/^[-•]\s+/, ""), `li-${i}`)}
          </span>
        </div>
      )
      i++; continue
    }

    elements.push(
      <p key={`p-${i}`} style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#aaa", lineHeight: 1.65 }}>
        {renderChatInline(line, `p-${i}`)}
      </p>
    )
    i++
  }

  return elements
}

// ─── Tab: Contenido ───────────────────────────────────────────────────────────
const DAYS_CONTENT = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

const DAY_NAME_TO_NUM: Record<string, number> = {
  Domingo: 0, Lunes: 1, Martes: 2, "Miércoles": 3, Jueves: 4, Viernes: 5, "Sábado": 6,
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00")
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
  return `${d.getDate()} ${months[d.getMonth()]}`
}

function assignDates(pieces: ParsedPiece[], monthStr: string): string[] {
  const [year, month] = monthStr.split("-").map(Number)
  const nextDate: Record<string, Date> = {}
  return pieces.map((p) => {
    const dayNum = DAY_NAME_TO_NUM[p.day]
    if (dayNum === undefined) return `${monthStr}-01`
    if (!nextDate[p.day]) {
      const d = new Date(year, month - 1, 1)
      while (d.getDay() !== dayNum) d.setDate(d.getDate() + 1)
      nextDate[p.day] = d
    }
    const date = new Date(nextDate[p.day])
    nextDate[p.day] = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000)
    return date.toISOString().slice(0, 10)
  })
}

function firstDayOfMonth(dayName: string, monthStr: string): string | null {
  const dayNum = DAY_NAME_TO_NUM[dayName]
  if (dayNum === undefined) return null
  const [year, month] = monthStr.split("-").map(Number)
  const d = new Date(year, month - 1, 1)
  while (d.getDay() !== dayNum) d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}
const CATEGORIES = ["Problema", "Solución", "Producto", "Mentalidad"]
const FORMATS = ["Talking Head", "Carrusel", "Pregunta-Respuesta", "Story"]

const EMPTY_PIECE = {
  day: "Lunes",
  title: "",
  category: "Problema",
  format: "Reel",
  status: "borrador",
  ads_candidate: false,
  hook: "",
  angle: "",
}

type ParsedPiece = {
  day: string; slot?: string; title: string; category: string; format: string
  hook?: string; angle?: string; status: string; ads_candidate: boolean
  ads_candidate_reason?: string; notes?: string
}

type WeekSummary = {
  total_pieces: number
  by_category: { Problema: number; Solucion: number; Producto: number; Mentalidad: number }
  distribution_check: "OK" | "AJUSTAR"
  distribution_note?: string
}

function ContenidoTab({ clientId, selectedMonth }: { clientId: string | null; selectedMonth: string | null }) {
  const { data: pieces, loading, error: piecesError, refetch } = useContentPieces(clientId, selectedMonth)
  const [addModal, setAddModal] = useState(false)
  const [editPiece, setEditPiece] = useState<ContentPiece | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_PIECE })

  // ── Chat constants ─────────────────────────────────────────────────────────
  const MAX_SESSIONS = 10
  const MAX_USER_MSGS = 15
  const EXPIRY_DAYS = 30

  // ── Chat types ──────────────────────────────────────────────────────────────
  type ChatMsg = { role: "user" | "assistant"; content: string }
  type ChatSession = { id: string; title: string | null; messages: ChatMsg[]; user_message_count: number; created_at: string; updated_at: string }

  // ── Chat state ──────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [sessionsLoaded, setSessionsLoaded] = useState(false)
  const [manualSaving, setManualSaving] = useState(false)
  const [manualSaved, setManualSaved] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const isSessionLocked = (s: ChatSession | null) => {
    if (!s) return false
    if (s.user_message_count >= MAX_USER_MSGS) return true
    const days = (Date.now() - new Date(s.updated_at).getTime()) / 86400000
    return days > EXPIRY_DAYS
  }

  const currentLocked = isSessionLocked(currentSession)
  const userMsgCount = currentSession?.user_message_count ?? 0

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages])

  // Load sessions on mount
  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("content_chat_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(MAX_SESSIONS + 1)
      if (data && data.length > 0) {
        const parsed = data.map((s: any) => ({ ...s, messages: Array.isArray(s.messages) ? s.messages : [] }))
        setSessions(parsed)
        // Auto-load the most recent non-expired session
        const recent = parsed[0]
        setCurrentSession(recent)
        setChatMessages(recent.messages)
      }
      setSessionsLoaded(true)
    }
    load()
  }, [])

  const saveSession = async (sessionId: string, msgs: ChatMsg[], userCount: number) => {
    const supabase = createClient()
    await supabase.from("content_chat_sessions").update({
      messages: msgs,
      user_message_count: userCount,
      updated_at: new Date().toISOString(),
    }).eq("id", sessionId)
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: msgs, user_message_count: userCount, updated_at: new Date().toISOString() } : s))
  }

  const createSession = async () => {
    if (sessions.length >= MAX_SESSIONS) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from("content_chat_sessions").insert({
      user_id: user.id,
      client_id: clientId,
      title: null,
      messages: [],
    }).select().single()
    if (data) {
      const newSession = { ...data, messages: [] }
      setSessions(prev => [newSession, ...prev])
      setCurrentSession(newSession)
      setChatMessages([])
      setShowHistory(false)
    }
  }

  const loadSession = (s: ChatSession) => {
    setCurrentSession(s)
    setChatMessages(s.messages)
    setShowHistory(false)
  }

  const deleteSession = async (id: string) => {
    const supabase = createClient()
    await supabase.from("content_chat_sessions").delete().eq("id", id)
    setSessions(prev => prev.filter(s => s.id !== id))
    if (currentSession?.id === id) {
      const remaining = sessions.filter(s => s.id !== id)
      if (remaining.length > 0) { setCurrentSession(remaining[0]); setChatMessages(remaining[0].messages) }
      else { setCurrentSession(null); setChatMessages([]) }
    }
  }

  const handleManualSave = async () => {
    if (!currentSession || chatMessages.length === 0 || manualSaving) return
    setManualSaving(true)
    setManualSaved(false)
    const title = currentSession.title ?? chatMessages.find(m => m.role === "user")?.content.slice(0, 60) ?? null
    const supabase = createClient()
    const { error } = await supabase.from("content_chat_sessions").update({
      messages: chatMessages,
      user_message_count: currentSession.user_message_count,
      title,
      updated_at: new Date().toISOString(),
    }).eq("id", currentSession.id)
    if (!error) {
      setSessions(prev => prev.map(s => s.id === currentSession.id
        ? { ...s, messages: chatMessages, title, updated_at: new Date().toISOString() }
        : s
      ))
      setCurrentSession(prev => prev?.id === currentSession.id ? { ...prev, title: title ?? prev.title } : prev)
      setManualSaved(true)
      setTimeout(() => setManualSaved(false), 2000)
    }
    setManualSaving(false)
  }

  const handleSend = async () => {
    if (!chatInput.trim() || chatLoading || currentLocked) return

    const userText = chatInput.trim()
    const userMsg: ChatMsg = { role: "user", content: userText }
    const newMessages = [...chatMessages, userMsg]

    setChatInput("")
    setChatLoading(true)
    setChatMessages([...newMessages, { role: "assistant", content: "" }])

    // ── Step 1: Ensure session exists BEFORE streaming ──────────────────────
    let sid = currentSession?.id ?? null
    let sessionTitle = currentSession?.title ?? userText.slice(0, 60)
    let sessionCount = currentSession?.user_message_count ?? 0

    if (!sid) {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data, error } = await supabase.from("content_chat_sessions").insert({
            user_id: user.id,
            client_id: clientId,
            title: userText.slice(0, 60),
            messages: [],
          }).select().single()
          if (error) console.error("[chat] Session create error:", error.message, error.code, error.details, error.hint)
          if (data) {
            sid = data.id
            sessionTitle = userText.slice(0, 60)
            const newSess: ChatSession = { ...data, messages: [] }
            setSessions(prev => [newSess, ...prev])
            setCurrentSession(newSess)
          }
        }
      } catch (e) {
        console.error("[chat] Session create failed:", e)
      }
    }

    // ── Step 2: Stream response ─────────────────────────────────────────────
    let assistantText = ""
    try {
      const res = await fetch("/api/chat-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, contentPieces: pieces }),
      })
      if (!res.body) throw new Error("No stream")
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantText += decoder.decode(value)
        setChatMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: "assistant", content: assistantText }
          return updated
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al conectar con la IA."
      assistantText = msg.includes("credit balance") || msg.includes("too low")
        ? "Saldo de API insuficiente. Recargá en console.anthropic.com → Billing."
        : msg
      setChatMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: "assistant", content: assistantText }
        return updated
      })
    } finally {
      setChatLoading(false)
    }

    // ── Step 3: Save final messages to session ──────────────────────────────
    if (!sid) return
    const finalMsgs: ChatMsg[] = [...newMessages, { role: "assistant", content: assistantText }]
    const newCount = sessionCount + 1
    try {
      const supabase = createClient()
      await supabase.from("content_chat_sessions").update({
        messages: finalMsgs,
        user_message_count: newCount,
        title: sessionTitle,
        updated_at: new Date().toISOString(),
      }).eq("id", sid)
      setSessions(prev => prev.map(s => s.id === sid
        ? { ...s, messages: finalMsgs, user_message_count: newCount, title: sessionTitle }
        : s
      ))
      setCurrentSession(prev => prev?.id === sid
        ? { ...prev, messages: finalMsgs, user_message_count: newCount, title: sessionTitle }
        : prev
      )
    } catch (e) {
      console.error("[chat] Session save failed:", e)
    }
  }

  // IA batch state
  const [aiModal, setAiModal] = useState(false)
  const [rawText, setRawText] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiRaw, setAiRaw] = useState<string | null>(null)
  const [preview, setPreview] = useState<ParsedPiece[]>([])
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null)
  const [bulkSaving, setBulkSaving] = useState(false)

  const openAiModal = () => { setRawText(""); setPreview([]); setWeekSummary(null); setAiError(null); setAiModal(true) }

  const looksLikeContentPlan = (text: string) => {
    const signals = [/pieza \d/i, /gancho:/i, /[áa]ngulo:/i, /lunes/i, /martes/i, /mi[eé]rcoles/i, /jueves/i, /viernes/i]
    return signals.filter(s => s.test(text)).length >= 3 && text.length > 300
  }

  const handleParseFromChat = async (content: string) => {
    setRawText("")
    setPreview([])
    setWeekSummary(null)
    setAiError(null)
    setAiRaw(null)
    setAiLoading(true)
    setAiModal(true)
    try {
      const res = await fetch("/api/parse-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: content }),
      })
      const json = await res.json()
      if (!res.ok) {
        setAiError(json.error ?? "Error al procesar.");
        setAiRaw(json.raw ?? null);
        return;
      }
      setPreview(json.pieces ?? [])
      setWeekSummary(json.week_summary ?? null)
    } catch {
      setAiError("No se pudo conectar con la IA.")
    } finally {
      setAiLoading(false)
    }
  }

  const handleParse = async () => {
    if (!rawText.trim()) return
    setAiLoading(true)
    setAiError(null)
    setPreview([])
    try {
      const res = await fetch("/api/parse-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      })
      const json = await res.json()
      if (!res.ok) {
        setAiError(json.error ?? "Error al procesar.");
        setAiRaw(json.raw ?? null);
        return;
      }
      setPreview(json.pieces ?? [])
      setWeekSummary(json.week_summary ?? null)
    } catch {
      setAiError("No se pudo conectar con la IA.")
    } finally {
      setAiLoading(false)
    }
  }

  const updatePreview = (i: number, key: string, val: string | boolean) =>
    setPreview((p) => p.map((item, idx) => idx === i ? { ...item, [key]: val } : item))

  const handleBulkSave = async () => {
    if (!clientId || preview.length === 0) return
    setBulkSaving(true)
    setAiError(null)
    const supabase = createClient()
    const monthStr = selectedMonth ?? new Date().toISOString().slice(0, 7)
    const month = `${monthStr}-01`
    const dates = assignDates(preview, monthStr)
    const rows = preview.map((p, i) => ({
      client_id: clientId,
      month,
      day: p.day,
      date: dates[i] ?? null,
      title: p.title,
      category: p.category,
      format: p.format,
      status: p.status,
      ads_candidate: p.ads_candidate,
      hook: p.hook ?? null,
      angle: p.angle ?? null,
      notes: p.notes ?? null,
    }))
    const { error } = await supabase.from("content_pieces").insert(rows)
    if (error) { setAiError(error.message); setBulkSaving(false); return }
    setAiModal(false)
    setBulkSaving(false)
    refetch()
  }

  const setF = (key: string, val: string | boolean) => setForm((f) => ({ ...f, [key]: val }))

  const openAdd = () => {
    setForm({ ...EMPTY_PIECE })
    setSaveError(null)
    setAddModal(true)
  }

  const openEdit = (piece: ContentPiece) => {
    setForm({
      day: piece.day,
      title: piece.title,
      category: piece.category,
      format: piece.format,
      status: piece.status,
      ads_candidate: piece.adsCandidate,
      hook: piece.hook ?? "",
      angle: piece.angle ?? "",
    })
    setSaveError(null)
    setEditPiece(piece)
  }

  const handleAdd = async () => {
    if (!clientId || !form.title.trim()) { setSaveError("Título requerido."); return }
    setSaving(true)
    setSaveError(null)
    const supabase = createClient()
    const month = selectedMonth ? `${selectedMonth}-01` : new Date().toISOString().slice(0, 7) + "-01"
    const mStr = selectedMonth ?? new Date().toISOString().slice(0, 7)
    const computedDate = firstDayOfMonth(form.day, mStr)
    const { error } = await supabase.from("content_pieces").insert({
      client_id: clientId,
      month,
      day: form.day,
      date: computedDate,
      title: form.title.trim(),
      category: form.category,
      format: form.format,
      status: form.status,
      ads_candidate: form.ads_candidate,
      hook: form.hook?.trim() || null,
      angle: form.angle?.trim() || null,
    })
    if (error) { setSaveError(error.message); setSaving(false); return }
    setAddModal(false)
    setSaving(false)
    refetch()
  }

  const handleEdit = async () => {
    if (!editPiece || !clientId) return
    setSaving(true)
    setSaveError(null)
    const supabase = createClient()
    const { error } = await supabase.from("content_pieces").update({
      day: form.day,
      title: form.title.trim(),
      category: form.category,
      format: form.format,
      status: form.status,
      ads_candidate: form.ads_candidate,
      hook: form.hook?.trim() || null,
      angle: form.angle?.trim() || null,
    }).eq("id", editPiece.id)
    if (error) { setSaveError(error.message); setSaving(false); return }
    setEditPiece(null)
    setSaving(false)
    refetch()
  }

  const handleDelete = async () => {
    if (!editPiece) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from("content_pieces").delete().eq("id", editPiece.id)
    setEditPiece(null)
    setSaving(false)
    refetch()
  }

  const handleQuickDelete = async (pieceId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const supabase = createClient()
    await supabase.from("content_pieces").delete().eq("id", pieceId)
    refetch()
  }

  const handleQuickToggleAds = async (piece: ContentPiece, e: React.MouseEvent) => {
    e.stopPropagation()
    const supabase = createClient()
    await supabase.from("content_pieces").update({ ads_candidate: !piece.adsCandidate }).eq("id", piece.id)
    refetch()
  }

  const STATUS_CYCLE: ContentPiece["status"][] = ["borrador", "publicado", "atrasado"]
  const handleQuickCycleStatus = async (piece: ContentPiece, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(piece.status) + 1) % STATUS_CYCLE.length]
    const supabase = createClient()
    await supabase.from("content_pieces").update({ status: next }).eq("id", piece.id)
    refetch()
  }

  const published = pieces.filter((c) => c.status === "publicado").length
  const total = pieces.length
  const pct = total > 0 ? Math.round((published / total) * 100) : 0

  const PieceForm = () => (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Field label="Día">
          <select value={form.day} onChange={(e) => setF("day", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
            {DAYS_CONTENT.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Categoría">
          <select value={form.category} onChange={(e) => setF("category", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Título">
        <input value={form.title} onChange={(e) => setF("title", e.target.value)} style={INPUT} placeholder="El error que cometen todos los coaches al vender" />
      </Field>
      <Field label="Gancho (primeras palabras exactas)">
        <input value={form.hook} onChange={(e) => setF("hook", e.target.value)} style={INPUT} placeholder="¿Sabés por qué el 90% de los coaches nunca llega a $10k?" />
      </Field>
      <Field label="Ángulo">
        <input value={form.angle} onChange={(e) => setF("angle", e.target.value)} style={INPUT} placeholder="El problema no es la audiencia, es el posicionamiento" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
        <Field label="Formato">
          <select value={form.format} onChange={(e) => setF("format", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
            {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Estado">
          <select value={form.status} onChange={(e) => setF("status", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
            <option value="borrador">Borrador</option>
            <option value="publicado">Publicado</option>
            <option value="atrasado">Atrasado</option>
          </select>
        </Field>
        <Field label="Candidato Ads">
          <select value={form.ads_candidate ? "si" : "no"} onChange={(e) => setF("ads_candidate", e.target.value === "si")} style={{ ...INPUT, cursor: "pointer" }}>
            <option value="no">No</option>
            <option value="si">Sí</option>
          </select>
        </Field>
      </div>
      {saveError && (
        <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.06)", border: "0.5px solid rgba(239,68,68,0.2)", borderRadius: "8px" }}>
          <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#f87171" }}>{saveError}</p>
        </div>
      )}
    </>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Progress */}
      <div style={{ ...CARD, padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <p style={{ ...SECTION_LABEL, marginBottom: 0 }}>
            {loading ? "Cargando…" : `${published}/${total} piezas publicadas`}
          </p>
          <span style={{ fontSize: "11px", fontFamily: "Georgia, serif", color: "#22c55e" }}>{pct}%</span>
        </div>
        <div style={{ height: "3px", background: "#111", borderRadius: "9999px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "#22c55e", borderRadius: "9999px", transition: "width 0.5s" }} />
        </div>
      </div>

      {/* Two-column layout: grid + chat */}
      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>

      {/* Left: Grid */}
      <div style={{ flex: "1 1 0", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <p style={{ ...SECTION_LABEL, marginBottom: 0 }}>Calendario de contenido</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={openAiModal}
              style={{ background: "rgba(34,197,94,0.12)", border: "0.5px solid rgba(34,197,94,0.4)", borderRadius: "6px", padding: "6px 16px", fontSize: "9px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "2px", color: "#4ade80", cursor: "pointer", textTransform: "uppercase" }}
            >
              ✦ Cargar con IA
            </button>
            <button
              onClick={openAdd}
              style={{ background: "transparent", border: "0.5px solid #222", borderRadius: "6px", padding: "6px 16px", fontSize: "9px", fontFamily: "sans-serif", fontWeight: 400, letterSpacing: "2px", color: "#666", cursor: "pointer", textTransform: "uppercase" }}
            >
              + Manual
            </button>
          </div>
        </div>

        {piecesError && (
          <div style={{ ...CARD, padding: "16px 20px", marginBottom: "12px" }}>
            <p style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#ef4444" }}>
              Error al cargar piezas: {piecesError}
            </p>
          </div>
        )}

        {!loading && !piecesError && pieces.length === 0 && (
          <div style={{ ...CARD, padding: "48px 24px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#555" }}>
              No hay piezas para este período. Agregá la primera.
            </p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "16px" }}>
          {pieces.map((piece) => {
            const catColor = categoryColors[piece.category] ?? "#555"
            const ss = statusStyles[piece.status] ?? statusStyles.borrador
            return (
              <div
                key={piece.id}
                onClick={() => openEdit(piece)}
                style={{
                  background: "#0d0d0d",
                  border: `0.5px solid ${catColor}25`,
                  borderRadius: "10px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${catColor}55`)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${catColor}25`)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <p style={{ fontSize: "9px", color: "#444", fontFamily: "sans-serif", letterSpacing: "2px" }}>
                    {piece.date ? formatDate(piece.date) : piece.day}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button
                      onClick={(e) => handleQuickToggleAds(piece, e)}
                      title={piece.adsCandidate ? "Quitar de Ads" : "Marcar para Ads"}
                      style={{
                        fontSize: "8px", padding: "2px 6px", borderRadius: "9999px",
                        background: piece.adsCandidate ? "rgba(34,197,94,0.06)" : "transparent",
                        border: `0.5px solid ${piece.adsCandidate ? "rgba(34,197,94,0.2)" : "#1a1a1a"}`,
                        color: piece.adsCandidate ? "#22c55e" : "#333",
                        fontFamily: "sans-serif", letterSpacing: "2px",
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)"; e.currentTarget.style.color = "#22c55e" }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = piece.adsCandidate ? "rgba(34,197,94,0.2)" : "#1a1a1a"
                        e.currentTarget.style.color = piece.adsCandidate ? "#22c55e" : "#333"
                      }}
                    >
                      ADS
                    </button>
                    <button
                      onClick={(e) => handleQuickDelete(piece.id, e)}
                      title="Eliminar pieza"
                      style={{ background: "transparent", border: "none", color: "#333", cursor: "pointer", fontSize: "12px", lineHeight: 1, padding: "2px 4px", borderRadius: "4px", transition: "color 0.15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444" }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#333" }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#d4d4d4", lineHeight: 1.5 }}>
                  {piece.title}
                </p>

                {(piece.hook || piece.angle) && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {piece.hook && (
                      <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 300, color: "#888", lineHeight: 1.4, borderLeft: "1.5px solid #222", paddingLeft: "8px" }}>
                        <span style={{ color: "#4ade80", fontSize: "8px", letterSpacing: "1.5px", display: "block", marginBottom: "2px" }}>GANCHO</span>
                        {piece.hook}
                      </p>
                    )}
                    {piece.angle && (
                      <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 300, color: "#666", lineHeight: 1.4, borderLeft: "1.5px solid #1a1a1a", paddingLeft: "8px" }}>
                        <span style={{ color: "#444", fontSize: "8px", letterSpacing: "1.5px", display: "block", marginBottom: "2px" }}>ÁNGULO</span>
                        {piece.angle}
                      </p>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                  <span style={{ fontSize: "8px", padding: "2px 8px", borderRadius: "9999px", background: `${catColor}12`, border: `0.5px solid ${catColor}30`, color: catColor, fontFamily: "sans-serif", letterSpacing: "2px" }}>
                    {piece.category.toUpperCase()}
                  </span>
                  <button
                    onClick={(e) => handleQuickCycleStatus(piece, e)}
                    title="Cambiar estado"
                    style={{
                      fontSize: "8px", padding: "2px 8px", borderRadius: "9999px",
                      background: ss.bg, color: ss.color,
                      fontFamily: "sans-serif", letterSpacing: "2px",
                      border: `0.5px solid ${ss.color}30`,
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = `${ss.color}20` }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = ss.bg }}
                  >
                    {piece.status.toUpperCase()}
                  </button>
                </div>

                <p style={{ fontSize: "10px", color: "#555", fontFamily: "sans-serif", letterSpacing: "1px" }}>
                  {piece.format}
                </p>
              </div>
            )
          })}
        </div>
      </div>{/* end left */}

      {/* Right: Chat panel */}
      <div style={{ width: "340px", flexShrink: 0, display: "flex", flexDirection: "column", background: "#0d0d0d", border: "0.5px solid #111", borderRadius: "12px", overflow: "hidden", height: "600px" }}>
        {/* Chat header */}
        <div style={{ padding: "14px 16px", borderBottom: "0.5px solid #111", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "13px", color: "#4ade80" }}>✦</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "10px", color: "#4ade80", fontFamily: "sans-serif", letterSpacing: "3px", textTransform: "uppercase" }}>Estratega IA</p>
            <p style={{ fontSize: "10px", color: "#444", fontFamily: "sans-serif", fontWeight: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {currentSession?.title ?? "Nueva conversación"}
            </p>
          </div>
          {/* Msg counter */}
          {currentSession && (
            <span style={{ fontSize: "9px", fontFamily: "sans-serif", color: userMsgCount >= MAX_USER_MSGS ? "#ef4444" : "#444", letterSpacing: "1px", flexShrink: 0 }}>
              {userMsgCount}/{MAX_USER_MSGS}
            </span>
          )}
          {/* Nueva conversación */}
          <button
            onClick={() => {
              if (sessions.length >= MAX_SESSIONS) { setShowHistory(true); return }
              createSession()
            }}
            title={sessions.length >= MAX_SESSIONS ? `Límite de ${MAX_SESSIONS} conversaciones alcanzado` : "Nueva conversación"}
            style={{ background: "transparent", border: "0.5px solid #1a1a1a", borderRadius: "6px", padding: "5px 8px", fontSize: "11px", color: sessions.length >= MAX_SESSIONS ? "#333" : "#555", cursor: "pointer", flexShrink: 0, fontFamily: "sans-serif", transition: "color 0.15s, border-color 0.15s" }}
            onMouseEnter={e => { if (sessions.length < MAX_SESSIONS) { e.currentTarget.style.color = "#4ade80"; e.currentTarget.style.borderColor = "rgba(34,197,94,0.25)" } }}
            onMouseLeave={e => { e.currentTarget.style.color = sessions.length >= MAX_SESSIONS ? "#333" : "#555"; e.currentTarget.style.borderColor = "#1a1a1a" }}
          >
            +
          </button>
          {/* History toggle */}
          <button
            onClick={() => setShowHistory(h => !h)}
            title="Historial de conversaciones"
            style={{ background: showHistory ? "rgba(34,197,94,0.08)" : "transparent", border: `0.5px solid ${showHistory ? "rgba(34,197,94,0.3)" : "#1a1a1a"}`, borderRadius: "6px", padding: "5px 8px", fontSize: "10px", color: showHistory ? "#4ade80" : "#444", cursor: "pointer", flexShrink: 0, fontFamily: "sans-serif" }}
          >
            ☰
          </button>
        </div>

        {/* History panel */}
        {showHistory ? (
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {/* New conversation button */}
            <div style={{ padding: "12px 16px", borderBottom: "0.5px solid #111" }}>
              {sessions.length >= MAX_SESSIONS ? (
                <p style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#ef4444", lineHeight: 1.5 }}>
                  Límite de {MAX_SESSIONS} conversaciones alcanzado. Eliminá una para crear otra.
                </p>
              ) : (
                <button
                  onClick={createSession}
                  style={{ width: "100%", padding: "8px 14px", borderRadius: "6px", border: "0.5px solid rgba(34,197,94,0.25)", background: "rgba(34,197,94,0.05)", color: "#4ade80", fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" }}
                >
                  + Nueva conversación
                </button>
              )}
            </div>
            {/* Session list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
              {sessions.length === 0 ? (
                <p style={{ fontSize: "11px", fontFamily: "sans-serif", color: "#444", padding: "16px", textAlign: "center" }}>No hay conversaciones guardadas.</p>
              ) : sessions.map(s => {
                const locked = isSessionLocked(s)
                const isActive = s.id === currentSession?.id
                return (
                  <div
                    key={s.id}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 10px", borderRadius: "8px", border: `0.5px solid ${isActive ? "rgba(34,197,94,0.2)" : "transparent"}`, background: isActive ? "rgba(34,197,94,0.04)" : "transparent", marginBottom: "4px", cursor: "pointer" }}
                    onClick={() => loadSession(s)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: isActive ? "#d4d4d4" : "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.title ?? "Sin título"}
                      </p>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "3px" }}>
                        <span style={{ fontSize: "9px", fontFamily: "sans-serif", color: "#444" }}>
                          {new Date(s.updated_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                        </span>
                        <span style={{ fontSize: "9px", fontFamily: "sans-serif", color: s.user_message_count >= MAX_USER_MSGS ? "#ef4444" : "#444" }}>
                          {s.user_message_count}/{MAX_USER_MSGS} msgs
                        </span>
                        {locked && <span style={{ fontSize: "8px", padding: "1px 6px", borderRadius: "9999px", background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.2)", color: "#f87171", fontFamily: "sans-serif", letterSpacing: "1px" }}>BLOQUEADA</span>}
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteSession(s.id) }}
                      style={{ background: "transparent", border: "none", color: "#333", fontSize: "12px", cursor: "pointer", padding: "2px 6px", borderRadius: "4px", flexShrink: 0 }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#333")}
                      title="Eliminar"
                    >✕</button>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
        <>
        {/* Messages */}
        <div ref={chatScrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {chatMessages.length === 0 && !currentLocked && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "auto", paddingBottom: "8px" }}>
              {[
                "Generame 5 hooks para Reel de categoría Problema",
                "¿Qué piezas tienen más potencial para ads?",
                "Cómo mejoraría el mix de formatos esta semana",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setChatInput(suggestion) }}
                  style={{ background: "#080808", border: "0.5px solid #1a1a1a", borderRadius: "8px", padding: "10px 14px", fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#555", cursor: "pointer", textAlign: "left", lineHeight: 1.5, transition: "border-color 0.15s, color 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#222"; e.currentTarget.style.color = "#888" }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.color = "#555" }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          {chatMessages.map((msg, i) => {
            const isUser = msg.role === "user"
            const isStreaming = chatLoading && i === chatMessages.length - 1 && !isUser
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: isUser ? "flex-end" : "flex-start" }}>
                {!isUser && (
                  <span style={{ fontSize: "9px", fontFamily: "sans-serif", letterSpacing: "2px", color: "#333", paddingLeft: "2px" }}>ESTRATEGA IA</span>
                )}
                <div style={{
                  maxWidth: "92%",
                  background: isUser ? "rgba(34,197,94,0.06)" : "transparent",
                  border: `0.5px solid ${isUser ? "rgba(34,197,94,0.15)" : "transparent"}`,
                  borderRadius: isUser ? "12px 12px 2px 12px" : "0px",
                  padding: isUser ? "10px 14px" : "0px 2px",
                }}>
                  {isUser ? (
                    <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#d4d4d4", lineHeight: 1.65 }}>
                      {msg.content}
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {isStreaming && !msg.content
                        ? <span style={{ fontSize: "12px", color: "#444", fontFamily: "sans-serif" }}>…</span>
                        : renderChatMessage(msg.content)}
                      {!isStreaming && msg.content && looksLikeContentPlan(msg.content) && (
                        <button
                          onClick={() => handleParseFromChat(msg.content)}
                          style={{
                            alignSelf: "flex-start",
                            marginTop: "4px",
                            padding: "6px 14px",
                            borderRadius: "6px",
                            border: "0.5px solid rgba(34,197,94,0.3)",
                            background: "rgba(34,197,94,0.06)",
                            color: "#4ade80",
                            fontSize: "9px",
                            fontFamily: "sans-serif",
                            fontWeight: 500,
                            letterSpacing: "2px",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(34,197,94,0.12)" }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(34,197,94,0.06)" }}
                        >
                          ✦ Guardar en calendario
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input / locked state */}
        {currentLocked ? (
          <div style={{ padding: "14px 16px", borderTop: "0.5px solid #111", display: "flex", flexDirection: "column", gap: "8px" }}>
            <p style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#555", lineHeight: 1.5, textAlign: "center" }}>
              {userMsgCount >= MAX_USER_MSGS
                ? `Llegaste al límite de ${MAX_USER_MSGS} mensajes. Abrí una conversación nueva.`
                : "Esta conversación expiró. Abrí una nueva para continuar."}
            </p>
            <button
              onClick={sessions.length < MAX_SESSIONS ? createSession : () => setShowHistory(true)}
              style={{ padding: "8px", borderRadius: "6px", border: "0.5px solid #1a1a1a", background: "transparent", color: "#666", fontSize: "10px", fontFamily: "sans-serif", letterSpacing: "1px", cursor: "pointer" }}
            >
              {sessions.length < MAX_SESSIONS ? "+ Nueva conversación" : "Ver historial"}
            </button>
          </div>
        ) : (
          <div style={{ padding: "12px 16px", borderTop: "0.5px solid #111", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Preguntá sobre el contenido…"
                style={{ flex: 1, background: "#080808", border: "0.5px solid #1a1a1a", borderRadius: "8px", padding: "9px 12px", fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#d4d4d4", outline: "none" }}
              />
              <button
                onClick={handleSend}
                disabled={chatLoading || !chatInput.trim()}
                style={{ background: chatLoading || !chatInput.trim() ? "transparent" : "rgba(34,197,94,0.1)", border: `0.5px solid ${chatLoading || !chatInput.trim() ? "#1a1a1a" : "rgba(34,197,94,0.3)"}`, borderRadius: "8px", padding: "9px 14px", fontSize: "12px", color: chatLoading || !chatInput.trim() ? "#333" : "#4ade80", cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer", transition: "all 0.15s" }}
              >
                ↑
              </button>
            </div>
            {currentSession && chatMessages.length > 0 && (
              <button
                onClick={handleManualSave}
                disabled={manualSaving}
                style={{ width: "100%", padding: "7px", borderRadius: "6px", border: `0.5px solid ${manualSaved ? "rgba(34,197,94,0.3)" : "#1a1a1a"}`, background: manualSaved ? "rgba(34,197,94,0.06)" : "transparent", color: manualSaved ? "#4ade80" : "#444", fontSize: "9px", fontFamily: "sans-serif", letterSpacing: "2px", textTransform: "uppercase", cursor: manualSaving ? "not-allowed" : "pointer", transition: "all 0.2s" }}
              >
                {manualSaving ? "Guardando…" : manualSaved ? "✓ Guardado" : "Guardar conversación"}
              </button>
            )}
          </div>
        )}
        </>
        )}{/* end history/chat toggle */}
      </div>{/* end chat */}

      </div>{/* end two-column */}

      {/* IA modal */}
      {aiModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ background: "#0d0d0d", border: "0.5px solid #1a1a1a", borderRadius: "14px", width: "100%", maxWidth: "720px", maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 28px 0" }}>
              <div>
                <p style={{ fontSize: "10px", color: "#4ade80", fontFamily: "sans-serif", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "4px" }}>IA · Contenido</p>
                <h2 style={{ fontSize: "20px", fontFamily: "Georgia, serif", fontWeight: 400, color: "#f5f5f5" }}>Cargar plan de contenido</h2>
              </div>
              <button onClick={() => setAiModal(false)} style={{ background: "transparent", border: "none", color: "#555", fontSize: "20px", cursor: "pointer", lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Loading state (when triggered from chat) */}
              {aiLoading && preview.length === 0 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "48px 0" }}>
                  <span style={{ fontSize: "20px", color: "#4ade80", animation: "pulse 1.5s infinite" }}>✦</span>
                  <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#555", letterSpacing: "1px" }}>Estructurando el plan con IA…</p>
                </div>
              )}
              {/* Textarea */}
              {!aiLoading && preview.length === 0 && (
                <>
                  <p style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#666", lineHeight: 1.6 }}>
                    Pegá tu plan de contenido en cualquier formato — bullets, guiones, doc de Notion, lista de ideas. La IA lo va a estructurar y clasificar automáticamente.
                  </p>
                  <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={"Lunes - Reel: El error que cometen todos los coaches\nMartes - Carrusel: 5 formas de cerrar sin hacer outreach\nMiércoles: Historia de transformación de Juan (30 días, de 0 a $15k)\n..."}
                    style={{ background: "#080808", border: "0.5px solid #222", borderRadius: "8px", padding: "14px 16px", fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#d4d4d4", resize: "vertical", minHeight: "220px", outline: "none", lineHeight: 1.7 }}
                  />
                  {aiError && (
                    <>
                      <p style={{ fontSize: "12px", color: "#f87171", fontFamily: "sans-serif" }}>{aiError}</p>
                      {aiRaw && (
                        <pre style={{ background: "#181818", color: "#fbbf24", fontSize: "11px", padding: "10px", borderRadius: "8px", marginTop: "8px", overflowX: "auto", maxHeight: "200px" }}>{aiRaw}</pre>
                      )}
                    </>
                  )}
                  <button
                    onClick={handleParse}
                    disabled={aiLoading || !rawText.trim()}
                    style={{ background: aiLoading || !rawText.trim() ? "#111" : "rgba(34,197,94,0.1)", border: `0.5px solid ${aiLoading || !rawText.trim() ? "#1a1a1a" : "rgba(34,197,94,0.35)"}`, borderRadius: "8px", padding: "12px 24px", fontSize: "11px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "2px", color: aiLoading || !rawText.trim() ? "#333" : "#4ade80", cursor: aiLoading || !rawText.trim() ? "not-allowed" : "pointer", textTransform: "uppercase", transition: "all 0.15s" }}
                  >
                    {aiLoading ? "Procesando…" : "✦ Procesar con IA"}
                  </button>
                </>
              )}

              {/* Preview */}
              {preview.length > 0 && (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontSize: "10px", color: "#4ade80", fontFamily: "sans-serif", letterSpacing: "3px", textTransform: "uppercase" }}>
                      {preview.length} piezas detectadas — revisá y editá antes de guardar
                    </p>
                    <button onClick={() => { setPreview([]); setWeekSummary(null) }} style={{ background: "transparent", border: "none", fontSize: "11px", color: "#555", fontFamily: "sans-serif", cursor: "pointer", letterSpacing: "1px" }}>← Volver a editar</button>
                  </div>

                  {/* Week summary */}
                  {weekSummary && (
                    <div style={{ background: "#080808", border: `0.5px solid ${weekSummary.distribution_check === "OK" ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}`, borderRadius: "10px", padding: "14px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <p style={{ fontSize: "9px", fontFamily: "sans-serif", letterSpacing: "3px", color: "#555", textTransform: "uppercase" }}>Distribución detectada</p>
                        <span style={{ fontSize: "9px", padding: "2px 10px", borderRadius: "9999px", fontFamily: "sans-serif", letterSpacing: "1px", background: weekSummary.distribution_check === "OK" ? "rgba(34,197,94,0.08)" : "rgba(245,158,11,0.08)", border: `0.5px solid ${weekSummary.distribution_check === "OK" ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`, color: weekSummary.distribution_check === "OK" ? "#4ade80" : "#fbbf24" }}>
                          {weekSummary.distribution_check}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                        {Object.entries(weekSummary.by_category).map(([cat, count]) => {
                          const label = cat === "Solucion" ? "Solución" : cat
                          return (
                          <div key={cat} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontSize: "9px", fontFamily: "sans-serif", color: categoryColors[label] ?? "#555", letterSpacing: "1px" }}>{label.toUpperCase()}</span>
                            <span style={{ fontSize: "14px", fontFamily: "Georgia, serif", color: "#f5f5f5" }}>{count}</span>
                          </div>
                          )
                        })}
                      </div>
                      {weekSummary.distribution_note && (
                        <p style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#fbbf24", lineHeight: 1.5 }}>{weekSummary.distribution_note}</p>
                      )}
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {preview.map((p, i) => {
                      const catColor = categoryColors[p.category] ?? "#555"
                      return (
                        <div key={i} style={{ background: "#080808", border: `0.5px solid ${catColor}20`, borderRadius: "10px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 130px 120px 90px 60px", gap: "10px", alignItems: "center" }}>
                            {/* Day */}
                            <select value={p.day} onChange={(e) => updatePreview(i, "day", e.target.value)} style={{ ...INPUT, fontSize: "11px", padding: "5px 8px", cursor: "pointer" }}>
                              {DAYS_CONTENT.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                            {/* Title */}
                            <input value={p.title} onChange={(e) => updatePreview(i, "title", e.target.value)} style={{ ...INPUT, fontSize: "11px", padding: "5px 8px" }} />
                            {/* Category */}
                            <select value={p.category} onChange={(e) => updatePreview(i, "category", e.target.value)} style={{ ...INPUT, fontSize: "11px", padding: "5px 8px", cursor: "pointer", color: catColor }}>
                              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {/* Format */}
                            <select value={p.format} onChange={(e) => updatePreview(i, "format", e.target.value)} style={{ ...INPUT, fontSize: "11px", padding: "5px 8px", cursor: "pointer" }}>
                              {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
                            </select>
                            {/* Status */}
                            <select value={p.status} onChange={(e) => updatePreview(i, "status", e.target.value)} style={{ ...INPUT, fontSize: "11px", padding: "5px 8px", cursor: "pointer" }}>
                              <option value="borrador">Borrador</option>
                              <option value="publicado">Publicado</option>
                              <option value="atrasado">Atrasado</option>
                            </select>
                            {/* Ads */}
                            <button
                              onClick={() => updatePreview(i, "ads_candidate", !p.ads_candidate)}
                              style={{ fontSize: "8px", padding: "4px 8px", borderRadius: "9999px", background: p.ads_candidate ? "rgba(34,197,94,0.08)" : "transparent", border: `0.5px solid ${p.ads_candidate ? "rgba(34,197,94,0.3)" : "#222"}`, color: p.ads_candidate ? "#4ade80" : "#444", fontFamily: "sans-serif", letterSpacing: "1px", cursor: "pointer", textTransform: "uppercase" }}
                            >
                              {p.ads_candidate ? "ADS ✓" : "ADS"}
                            </button>
                          </div>
                          {/* Hook / angle / notes row */}
                          {(p.hook || p.angle || p.notes) && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingTop: "6px", borderTop: "0.5px solid #111" }}>
                              {p.hook && <p style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#888", lineHeight: 1.5 }}><span style={{ color: "#555", letterSpacing: "1px", fontSize: "9px" }}>HOOK </span>{p.hook}</p>}
                              {p.angle && <p style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#666", lineHeight: 1.5 }}><span style={{ color: "#555", letterSpacing: "1px", fontSize: "9px" }}>ÁNGULO </span>{p.angle}</p>}
                              {p.notes && <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 300, color: "#555", lineHeight: 1.5 }}><span style={{ color: "#444", letterSpacing: "1px", fontSize: "9px" }}>NOTA </span>{p.notes}</p>}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {aiError && (
                    <>
                      <p style={{ fontSize: "12px", color: "#f87171", fontFamily: "sans-serif" }}>{aiError}</p>
                      {aiRaw && (
                        <pre style={{ background: "#181818", color: "#fbbf24", fontSize: "11px", padding: "10px", borderRadius: "8px", marginTop: "8px", overflowX: "auto", maxHeight: "200px" }}>{aiRaw}</pre>
                      )}
                    </>
                  )}

                  <button
                    onClick={handleBulkSave}
                    disabled={bulkSaving}
                    style={{ background: bulkSaving ? "#111" : "rgba(34,197,94,0.1)", border: `0.5px solid ${bulkSaving ? "#1a1a1a" : "rgba(34,197,94,0.35)"}`, borderRadius: "8px", padding: "12px 24px", fontSize: "11px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "2px", color: bulkSaving ? "#333" : "#4ade80", cursor: bulkSaving ? "not-allowed" : "pointer", textTransform: "uppercase" }}
                  >
                    {bulkSaving ? "Guardando…" : `Guardar ${preview.length} piezas`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add modal */}
      <DataModal open={addModal} onClose={() => setAddModal(false)} title="Nueva pieza de contenido" onSubmit={handleAdd} loading={saving} submitLabel="Agregar">
        <PieceForm />
      </DataModal>

      {/* Edit modal */}
      <DataModal
        open={!!editPiece}
        onClose={() => setEditPiece(null)}
        title="Editar pieza"
        subtitle={editPiece?.title}
        onSubmit={handleEdit}
        loading={saving}
        submitLabel="Guardar"
      >
        <PieceForm />
        <div style={{ paddingTop: "8px", borderTop: "0.5px solid #111" }}>
          <button
            onClick={handleDelete}
            disabled={saving}
            style={{ background: "transparent", border: "0.5px solid rgba(239,68,68,0.3)", borderRadius: "6px", padding: "6px 16px", fontSize: "9px", fontFamily: "sans-serif", letterSpacing: "2px", color: "#f87171", cursor: saving ? "not-allowed" : "pointer", textTransform: "uppercase" }}
          >
            Eliminar pieza
          </button>
        </div>
      </DataModal>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
function AcquisitionContent() {
  const clientId = useActiveClient()
  const selectedMonth = useSelectedMonth()
  const { data: adsData } = useAdsMetrics(clientId)
  const { data: pipelineData, refetch: refetchPipeline } = useManychatPipeline(clientId)

  // ── Pending closures ───────────────────────────────────────────────────────
  const [pendingClosures, setPendingClosures] = useState<any[]>([])
  const [closureModal, setClosureModal] = useState<any | null>(null)
  const [closureForm, setClosureForm] = useState({ lead_name: "", content_piece_id: "", amount: "", notes: "" })
  const [closureSaving, setClosureSaving] = useState(false)
  const [closureMsg, setClosureMsg] = useState<string | null>(null)
  const { data: currentPieces } = useContentPieces(clientId, selectedMonth)

  useEffect(() => {
    if (!clientId) return
    const supabase = createClient()
    supabase
      .from("pending_closures")
      .select("*")
      .eq("client_id", clientId)
      .eq("status", "pending")
      .order("closed_at", { ascending: false })
      .then(({ data }) => setPendingClosures(data ?? []))
  }, [clientId])

  const openClosureModal = (c: any) => {
    setClosureModal(c)
    setClosureForm({ lead_name: c.subscriber_name ?? "", content_piece_id: "", amount: "", notes: "" })
  }

  const handleRegisterClosure = async () => {
    if (!clientId || !closureModal) return
    setClosureSaving(true)
    try {
      const supabase = createClient()
      const piece = currentPieces.find((p) => p.id === closureForm.content_piece_id)
      const today = new Date().toISOString().slice(0, 10)
      await supabase.from("sales_pipeline").insert({
        client_id: clientId,
        lead_name: closureForm.lead_name || closureModal.subscriber_name || "Lead sin nombre",
        origin_angle: piece?.angle ?? null,
        origin_category: piece?.category ?? null,
        content_piece_id: piece?.id ?? null,
        amount: Number(closureForm.amount) || 0,
        closed: true,
        call_date: today,
        stage: "cerrado",
        notes: closureForm.notes || null,
      })
      await supabase.from("pending_closures").update({ status: "completed" }).eq("id", closureModal.id)
      setPendingClosures((prev) => prev.filter((c) => c.id !== closureModal.id))
      setClosureModal(null)
      setClosureMsg("Cierre registrado correctamente")
      setTimeout(() => setClosureMsg(null), 3000)
    } catch { /* silent */ } finally {
      setClosureSaving(false)
    }
  }

  const handleDismissClosure = async () => {
    if (!clientId || !closureModal) return
    const supabase = createClient()
    await supabase.from("pending_closures").update({ status: "dismissed" }).eq("id", closureModal.id)
    setPendingClosures((prev) => prev.filter((c) => c.id !== closureModal.id))
    setClosureModal(null)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Header */}
      <div>
        <p style={SECTION_LABEL}>Sistema de adquisición</p>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#f5f5f5", letterSpacing: "1px" }}>
          Adquisición
        </h1>
      </div>

      {/* Cierres pendientes */}
      {pendingClosures.length > 0 && (
        <div style={{ background: "rgba(34,197,94,0.06)", border: "0.5px solid rgba(34,197,94,0.25)", borderRadius: "12px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ ...SECTION_LABEL, marginBottom: 0 }}>Cierres pendientes de registrar</p>
          {pendingClosures.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
              <div>
                <p style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 400, color: "#d4d4d4" }}>
                  {c.subscriber_name || "Lead sin nombre"}
                </p>
                <p style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#555", marginTop: "2px" }}>
                  {new Date(c.closed_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                </p>
              </div>
              <button
                onClick={() => openClosureModal(c)}
                style={{ background: "#22c55e", border: "none", borderRadius: "6px", padding: "6px 16px", fontSize: "9px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "2px", color: "#000", cursor: "pointer", textTransform: "uppercase", whiteSpace: "nowrap" }}
              >
                Registrar cierre
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de cierre */}
      {closureModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "24px" }}>
          <div style={{ background: "#0d0d0d", border: "0.5px solid #222", borderRadius: "12px", padding: "28px", width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <p style={SECTION_LABEL}>Registrar cierre</p>
              <p style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#555" }}>
                {closureModal.subscriber_name || "Lead sin nombre"}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <p style={{ fontSize: "10px", fontFamily: "sans-serif", color: "#666", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" }}>Nombre del lead</p>
                <input value={closureForm.lead_name} onChange={(e) => setClosureForm((f) => ({ ...f, lead_name: e.target.value }))} placeholder="Nombre del lead" style={INPUT} />
              </div>
              <div>
                <p style={{ fontSize: "10px", fontFamily: "sans-serif", color: "#666", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" }}>Pieza de contenido que lo originó</p>
                <select value={closureForm.content_piece_id} onChange={(e) => setClosureForm((f) => ({ ...f, content_piece_id: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                  <option value="">No sé / No aplica</option>
                  {[...currentPieces].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")).map((p) => (
                    <option key={p.id} value={p.id}>{p.date ?? p.day} — {p.title} ({p.category})</option>
                  ))}
                </select>
              </div>
              <div>
                <p style={{ fontSize: "10px", fontFamily: "sans-serif", color: "#666", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" }}>Monto ($)</p>
                <input type="number" value={closureForm.amount} onChange={(e) => setClosureForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" style={INPUT} />
              </div>
              <div>
                <p style={{ fontSize: "10px", fontFamily: "sans-serif", color: "#666", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" }}>Notas (opcional)</p>
                <textarea value={closureForm.notes} onChange={(e) => setClosureForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notas del cierre" rows={2} style={{ ...INPUT, resize: "vertical" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={handleDismissClosure} style={{ background: "transparent", border: "0.5px solid #222", borderRadius: "8px", padding: "10px 20px", fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#666", cursor: "pointer" }}>
                Descartar
              </button>
              <button onClick={handleRegisterClosure} disabled={closureSaving} style={{ background: "#22c55e", border: "none", borderRadius: "8px", padding: "10px 24px", fontSize: "12px", fontFamily: "sans-serif", fontWeight: 500, color: "#000", cursor: closureSaving ? "not-allowed" : "pointer" }}>
                {closureSaving ? "Guardando…" : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {closureMsg && (
        <div style={{ position: "fixed", bottom: "32px", right: "32px", background: "#0d0d0d", border: "0.5px solid rgba(34,197,94,0.2)", borderRadius: "10px", padding: "14px 20px", display: "flex", alignItems: "center", gap: "10px", zIndex: 1000 }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
          <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#9ca3af" }}>{closureMsg}</p>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="ads">
        <TabsList style={{ background: "#0d0d0d", border: "0.5px solid #111", borderRadius: "8px", padding: "4px", gap: "4px" }}>
          {[
            { value: "ads",       label: "Follow Me Ads" },
            { value: "manychat",  label: "ManyChat"      },
            { value: "contenido", label: "Contenido"     },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 400, letterSpacing: "2px", textTransform: "uppercase", padding: "8px 20px", borderRadius: "6px" }}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="ads" style={{ marginTop: "24px" }}>
          <FollowMeAdsTab adsData={adsData} clientId={clientId} />
        </TabsContent>
        <TabsContent value="manychat" style={{ marginTop: "24px" }}>
          <ManychatTab data={pipelineData} clientId={clientId} onSynced={refetchPipeline} />
        </TabsContent>
        <TabsContent value="contenido" style={{ marginTop: "24px" }}>
          <ContenidoTab clientId={clientId} selectedMonth={selectedMonth} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function AcquisitionPage() {
  return (
    <DashboardLayout>
      <AcquisitionContent />
    </DashboardLayout>
  )
}
