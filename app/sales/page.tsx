"use client"

import { DashboardLayout, useActiveClient } from "@/components/dashboard-layout"
import { MetricCard } from "@/components/metric-card"
import { RevenueShareCalculator } from "@/components/revenue-share-calculator"
import { SkeletonCard, EmptyState } from "@/components/skeleton"
import { DataModal, Field, INPUT } from "@/components/data-modal"
import { createClient } from "@/lib/supabaseClient"
import { useSalesPipeline } from "@/hooks/useSalesPipeline"
import { useContentPieces } from "@/hooks/useContentPieces"
import { SECTION_LABEL, CARD_P, TH, TD } from "@/lib/styles"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { useState } from "react"

const categoryColors: Record<string, string> = {
  Problema: "#3b82f6",
  Solución: "#14b8a6",
  Producto: "#f59e0b",
  Mentalidad: "#a855f7",
}

const STAGES = [
  { value: "apertura",     label: "Apertura" },
  { value: "calificacion", label: "Calificación" },
  { value: "filtrado",     label: "Filtrado" },
  { value: "dolor",        label: "Dolor" },
  { value: "solucion",     label: "Solución" },
  { value: "prueba_social",label: "Prueba Social" },
  { value: "calendario",   label: "Calendario" },
  { value: "llamada",      label: "Llamada" },
  { value: "cerrado",      label: "Cerrado" },
  { value: "perdido",      label: "Perdido" },
]

const STAGE_LABELS: Record<string, string> = Object.fromEntries(STAGES.map((s) => [s.value, s.label]))

const stageColors: Record<string, string> = {
  cerrado:      "#22c55e",
  llamada:      "#f59e0b",
  calendario:   "#f59e0b",
  prueba_social:"#a78bfa",
  solucion:     "#14b8a6",
  dolor:        "#f97316",
  filtrado:     "#818cf8",
  calificacion: "#60a5fa",
  apertura:     "#9ca3af",
  perdido:      "#ef4444",
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "#0d0d0d", border: "0.5px solid #222", borderRadius: "8px", padding: "10px 14px" }}>
      <p style={{ fontSize: "9px", color: "#555", fontFamily: "sans-serif", letterSpacing: "2px", marginBottom: "4px" }}>{label}</p>
      <p style={{ fontSize: "16px", fontFamily: "Georgia, serif", color: "#22c55e" }}>
        ${Number(payload[0]?.value ?? 0).toLocaleString()}
      </p>
    </div>
  )
}

function SalesContent() {
  const clientId = useActiveClient()
  const { data, loading } = useSalesPipeline(clientId)
  const { data: contentPieces } = useContentPieces(clientId)
  const [stageFilter, setStageFilter] = useState("todos")

  // ── Lead modal ────────────────────────────────────────────────────────────
  const [leadModal, setLeadModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [leadSaving, setLeadSaving] = useState(false)
  const [leadError, setLeadError] = useState<string | null>(null)
  const todayStr = new Date().toISOString().slice(0, 10)
  const emptyForm = { lead_name: "", origin_angle: "", origin_category: "Problema", stage: "apertura", call_date: todayStr, attended: false, closed: false, amount: "", notes: "", content_piece_id: "" }
  const [leadForm, setLeadForm] = useState<typeof emptyForm>(emptyForm)

  const setLead = (key: string, val: string | boolean) => setLeadForm((f) => ({ ...f, [key]: val }))

  const openAdd = () => { setEditingId(null); setLeadForm(emptyForm); setLeadError(null); setLeadModal(true) }
  const openEdit = (lead: any) => {
    setEditingId(lead.id)
    setLeadForm({
      lead_name: lead.leadName,
      origin_angle: lead.originAngle,
      origin_category: lead.originCategory,
      stage: lead.stage,
      call_date: lead.callDate || todayStr,
      attended: lead.attended,
      closed: lead.closed,
      amount: lead.amount > 0 ? String(lead.amount) : "",
      notes: lead.notes ?? "",
      content_piece_id: lead.contentPieceId ?? "",
    })
    setLeadError(null)
    setLeadModal(true)
  }

  const handleSaveLead = async () => {
    if (!clientId) { setLeadError("No hay cliente activo."); return }
    setLeadSaving(true)
    setLeadError(null)
    try {
      const supabase = createClient()
      const selectedPiece = leadForm.content_piece_id
        ? contentPieces.find((p) => p.id === leadForm.content_piece_id)
        : null
      const payload = {
        lead_name: leadForm.lead_name,
        origin_angle: (selectedPiece?.angle ?? leadForm.origin_angle) || null,
        origin_category: selectedPiece?.category ?? leadForm.origin_category,
        stage: leadForm.stage,
        call_date: leadForm.call_date || null,
        attended: leadForm.attended,
        closed: leadForm.closed,
        amount: Number(leadForm.amount) || null,
        notes: leadForm.notes || null,
        content_piece_id: leadForm.content_piece_id || null,
      }
      if (editingId) {
        const { error } = await supabase.from("sales_pipeline").update(payload).eq("id", editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from("sales_pipeline").insert({ client_id: clientId, ...payload })
        if (error) throw error
      }
      setLeadModal(false)
      setLeadError(null)
    } catch (e: any) {
      setLeadError(e?.message ?? "Error al guardar.")
    } finally {
      setLeadSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        <div>
          <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", marginBottom: "10px", textTransform: "uppercase" }}>Resultados comerciales</p>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#f5f5f5" }}>Ventas</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
          {[1,2,3,4,5].map((i) => <SkeletonCard key={i} height="90px" />)}
        </div>
        <SkeletonCard height="220px" />
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        <div>
          <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", marginBottom: "10px", textTransform: "uppercase" }}>Resultados comerciales</p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#f5f5f5" }}>Ventas</h1>
        </div>
        <EmptyState message="Sin datos de ventas para este cliente." subMessage="Los datos aparecerán cuando se registren leads en el pipeline." />
      </div>
    )
  }

  const stages = ["todos", ...Array.from(new Set(data.leads.map((l) => l.stage)))]
  const filtered = stageFilter === "todos" ? data.leads : data.leads.filter((l) => l.stage === stageFilter)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
      {/* Header */}
      <div>
        <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", marginBottom: "10px", textTransform: "uppercase" }}>
          Resultados comerciales
        </p>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#f5f5f5", letterSpacing: "1px" }}>
          Ventas
        </h1>
      </div>

      {/* KPI Cards */}
      <div>
        <p style={SECTION_LABEL}>Métricas de la semana</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
          <MetricCard label="Llamadas agendadas" value={data.callsScheduled} />
          <MetricCard
            label="Tasa de asistencia"
            value={data.attendanceRate}
            suffix="%"
            alert={data.attendanceRate < 60 ? "warning" : null}
          />
          <MetricCard label="Cierres esta semana" value={data.closesThisWeek} highlight />
          <MetricCard label="Cash collected" value={data.cashCollected} prefix="$" previousValue={35000} />
          <MetricCard label="Fee NOVA" value={data.revenueShare} prefix="$" previousValue={10500} />
        </div>
      </div>

      {/* Calculator + Chart */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "20px", alignItems: "start" }}>
        <RevenueShareCalculator defaultAmount={data.cashCollected} defaultPct={30} />

        <div style={CARD_P}>
          <p style={SECTION_LABEL}>Cash collected últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data.monthlyRevenue}>
              <CartesianGrid strokeDasharray="1 4" stroke="#111" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#333", fontSize: 9, fontFamily: "sans-serif" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="cash"
                stroke="#22c55e"
                strokeWidth={1.5}
                dot={{ r: 3, fill: "#22c55e", stroke: "#22c55e" }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pipeline Table */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <p style={{ ...SECTION_LABEL, marginBottom: 0 }}>Pipeline de leads</p>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={openAdd} style={{ background: "rgba(34,197,94,0.08)", border: "0.5px solid rgba(34,197,94,0.25)", borderRadius: "6px", padding: "6px 16px", fontSize: "9px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "2px", color: "#4ade80", cursor: "pointer", textTransform: "uppercase" }}>
              + Agregar lead
            </button>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {stages.map((s) => (
              <button
                key={s}
                onClick={() => setStageFilter(s)}
                style={{
                  fontSize: "8px",
                  fontFamily: "sans-serif",
                  fontWeight: 300,
                  letterSpacing: "2px",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  background: stageFilter === s ? "rgba(34,197,94,0.08)" : "#0d0d0d",
                  border: stageFilter === s ? "0.5px solid rgba(34,197,94,0.3)" : "0.5px solid #111",
                  color: stageFilter === s ? "#22c55e" : "#555",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textTransform: "uppercase",
                }}
              >
                {s}
              </button>
            ))}
            </div>
          </div>
        </div>

        <div style={{ ...CARD_P, padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Lead", "Ángulo origen", "Categoría", "Etapa", "Fecha", "Asistió", "Monto", ""].map((h) => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => {
                const catColor = categoryColors[lead.originCategory] ?? "#555"
                const stageColor = stageColors[lead.stage] ?? "#555"
                return (
                  <tr key={lead.id}>
                    <td style={{ ...TD, color: "#d4d4d4" }}>{lead.leadName}</td>
                    <td style={{ ...TD, maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {lead.originAngle}
                    </td>
                    <td style={TD}>
                      <span style={{
                        fontSize: "8px",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        background: `${catColor}12`,
                        border: `0.5px solid ${catColor}25`,
                        color: catColor,
                        fontFamily: "sans-serif",
                        letterSpacing: "2px",
                      }}>
                        {lead.originCategory.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ ...TD, color: stageColor }}>{STAGE_LABELS[lead.stage] ?? lead.stage}</td>
                    <td style={TD}>{lead.callDate}</td>
                    <td style={TD}>
                      <span style={{ color: lead.attended ? "#22c55e" : "#ef4444" }}>
                        {lead.attended ? "Sí" : "No"}
                      </span>
                    </td>
                    <td style={{ ...TD, fontFamily: "Georgia, serif", color: lead.amount > 0 ? "#22c55e" : "#333" }}>
                      {lead.amount > 0 ? `$${lead.amount.toLocaleString()}` : "—"}
                    </td>
                    <td style={{ ...TD, padding: "8px 16px" }}>
                      <button onClick={() => openEdit(lead)} style={{ background: "none", border: "0.5px solid #222", borderRadius: "4px", padding: "3px 10px", fontSize: "9px", fontFamily: "sans-serif", color: "#555", cursor: "pointer", letterSpacing: "1px" }}>
                        Editar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Lead modal ── */}
      <DataModal open={leadModal} onClose={() => setLeadModal(false)} title={editingId ? "Editar lead" : "Agregar lead"} subtitle={editingId ? "Modificar datos del lead." : "Se inserta en sales_pipeline."} onSubmit={handleSaveLead} loading={leadSaving}>
        <Field label="Nombre del lead">
          <input value={leadForm.lead_name} onChange={(e) => setLead("lead_name", e.target.value)} style={INPUT} placeholder="Martín Rodríguez" />
        </Field>
        <Field label="Pieza de contenido origen">
          <select
            value={leadForm.content_piece_id}
            onChange={(e) => {
              const id = e.target.value
              setLead("content_piece_id", id)
              if (id) {
                const piece = contentPieces.find((p) => p.id === id)
                if (piece?.angle) setLead("origin_angle", piece.angle)
                if (piece?.category) setLead("origin_category", piece.category)
              }
            }}
            style={{ ...INPUT, cursor: "pointer" }}
          >
            <option value="">Sin pieza vinculada</option>
            {contentPieces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title.length > 50 ? p.title.slice(0, 50) + "…" : p.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ángulo de origen">
          <input value={leadForm.origin_angle} onChange={(e) => setLead("origin_angle", e.target.value)} style={INPUT} placeholder="Historia con dolor" />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Field label="Categoría">
            <select value={leadForm.origin_category} onChange={(e) => setLead("origin_category", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
              {["Problema", "Solución", "Producto", "Mentalidad"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Etapa">
            <select value={leadForm.stage} onChange={(e) => {
              const val = e.target.value
              setLead("stage", val)
              if (val === "cerrado") { setLead("closed", true); setLead("attended", true) }
              if (val === "perdido") setLead("closed", false)
            }} style={{ ...INPUT, cursor: "pointer" }}>
              {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Fecha de llamada">
          <input type="date" value={leadForm.call_date} onChange={(e) => setLead("call_date", e.target.value)} style={INPUT} />
        </Field>
        <div style={{ display: "flex", gap: "24px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input type="checkbox" checked={leadForm.attended} onChange={(e) => setLead("attended", e.target.checked)} style={{ accentColor: "#22c55e" }} />
            <span style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#aaa" }}>Asistió</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input type="checkbox" checked={leadForm.closed} onChange={(e) => { setLead("closed", e.target.checked); if (e.target.checked) setLead("attended", true) }} style={{ accentColor: "#22c55e" }} />
            <span style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#aaa" }}>Cerrado</span>
          </label>
        </div>
        {leadForm.closed && (
          <Field label="Monto ($)">
            <input type="number" value={leadForm.amount} onChange={(e) => setLead("amount", e.target.value)} style={INPUT} placeholder="5500" />
          </Field>
        )}
        <Field label="Notas">
          <textarea value={leadForm.notes} onChange={(e) => setLead("notes", e.target.value)} style={{ ...INPUT, resize: "vertical", minHeight: "72px" }} placeholder="Objeción principal, contexto del lead…" />
        </Field>
        {leadError && (
          <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.06)", border: "0.5px solid rgba(239,68,68,0.2)", borderRadius: "8px" }}>
            <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#f87171" }}>{leadError}</p>
          </div>
        )}
      </DataModal>
    </div>
  )
}

export default function SalesPage() {
  return (
    <DashboardLayout>
      <SalesContent />
    </DashboardLayout>
  )
}
