"use client"

import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabaseClient"
import { DashboardLayout, useActiveClient, useSelectedMonth } from "../../components/dashboard-layout"
import { useAnnualMetrics } from "@/components/annual-metrics-context"

// ── CAMBIO 4: nuevo array sections con área por ítem ─────────────────────────
const sections = [
  {
    title: "Auditoría del Sistema NOVA (primeros 90 días)",
    tier: "early",
    description: "Para clientes con menos de 3 meses con el sistema activo.",
    items: [
      // ── ÁNGULOS Y CONTENIDO ────────────────────────────
      {
        id: "C1",
        area: "Contenido",
        label: "Tengo identificados al menos 3 ángulos ganadores basados en trazabilidad inversa de mis ventas anteriores, no por intuición."
      },
      {
        id: "C2",
        area: "Contenido",
        label: "Estoy publicando al menos 2 piezas de contenido por día, 7 días a la semana, con distribución correcta: 50% Problema, 20% Producto, 15% Solución, 15% Mentalidad."
      },
      {
        id: "C3",
        area: "Contenido",
        label: "Cada pieza de contenido que publico tiene un gancho claro en los primeros 3 segundos orientado a un dolor específico de mi nicho."
      },
      {
        id: "C4",
        area: "Contenido",
        label: "Puedo identificar cuáles piezas de contenido generaron conversaciones calificadas en los últimos 30 días."
      },
      // ── FOLLOW ME ADS ──────────────────────────────────
      {
        id: "A1",
        area: "Follow Me Ads",
        label: "Solo estoy poniendo ads a contenido que primero validé orgánicamente — ningún creativo tiene presupuesto sin haber generado conversaciones calificadas de forma orgánica antes."
      },
      {
        id: "A2",
        area: "Follow Me Ads",
        label: "El CTR de mis creativos activos está por encima del 2.5%."
      },
      {
        id: "A3",
        area: "Follow Me Ads",
        label: "La frecuencia de todos mis creativos activos está por debajo de 1.8 y tengo creativos nuevos listos para rotar antes de llegar a ese límite."
      },
      {
        id: "A4",
        area: "Follow Me Ads",
        label: "El costo por seguidor está dentro del rango correcto para mi AOV — no estoy pagando más de lo que tiene sentido financiero para mi ticket."
      },
      // ── MANYCHAT ───────────────────────────────────────
      {
        id: "M1",
        area: "ManyChat",
        label: "Tengo instaladas las secuencias abridoras para los tres puntos de entrada: nuevo seguidor, comentario en reel, y respuesta a historia."
      },
      {
        id: "M2",
        area: "ManyChat",
        label: "La tasa de respuesta de mis secuencias abridoras está por encima del 40%."
      },
      {
        id: "M3",
        area: "ManyChat",
        label: "Mis leads pasan por los 7 pasos de la estructura de prospección: apertura, calificación, filtrado, dolor, solución, prueba social y calendario."
      },
      {
        id: "M4",
        area: "ManyChat",
        label: "Los seguimientos automáticos están configurados y se ejecutan a las 24hs, 72hs y 7 días sin intervención manual."
      },
      {
        id: "M5",
        area: "ManyChat",
        label: "Cada pieza de contenido que publico tiene su etiqueta en ManyChat para poder rastrear qué ángulo generó cada conversación."
      },
    ],
  },
  {
    title: "Auditoría del Sistema NOVA (sistema maduro)",
    tier: "mature",
    description: "Para clientes con más de 3 meses con el sistema activo.",
    items: [
      // ── ÁNGULOS Y CONTENIDO ────────────────────────────
      {
        id: "C1",
        area: "Contenido",
        label: "Mis ángulos ganadores están actualizados con datos reales de los últimos 30 días — sé exactamente qué temas generaron más cierres este mes."
      },
      {
        id: "C2",
        area: "Contenido",
        label: "El calendario de contenido de la semana que viene está construido en base a los ángulos con mejor tasa de conversión del mes anterior, no por intuición."
      },
      {
        id: "C3",
        area: "Contenido",
        label: "Tengo al menos 2 o 3 formatos distintos de contenido activos simultáneamente para evitar la fatiga visual en mi audiencia."
      },
      {
        id: "C4",
        area: "Contenido",
        label: "Puedo trazar el origen exacto de al menos el 70% de mis cierres del último mes hasta la pieza de contenido que los activó."
      },
      // ── FOLLOW ME ADS ──────────────────────────────────
      {
        id: "A1",
        area: "Follow Me Ads",
        label: "Tengo al menos 5 creativos ganadores identificados y corriendo simultáneamente con presupuestos individuales, no concentrados en uno solo."
      },
      {
        id: "A2",
        area: "Follow Me Ads",
        label: "Estoy escalando el presupuesto de los creativos ganadores máximo un 30% cada 2-3 días, sin saltos bruscos que rompan el período de aprendizaje del algoritmo."
      },
      {
        id: "A3",
        area: "Follow Me Ads",
        label: "Tengo un proceso claro y ejecutándose para producir contenido nuevo candidato a ads cada semana, sin depender de los mismos creativos por más de 3 semanas."
      },
      {
        id: "A4",
        area: "Follow Me Ads",
        label: "El costo de adquisición por cliente (CAC) está bajando mes a mes a medida que los ángulos se refinan con datos reales."
      },
      // ── MANYCHAT ───────────────────────────────────────
      {
        id: "M1",
        area: "ManyChat",
        label: "Las secuencias de dolor y solución en ManyChat están personalizadas para los 3-4 dolores principales que mencionan los leads en las conversaciones reales, no dolores genéricos del nicho."
      },
      {
        id: "M2",
        area: "ManyChat",
        label: "Los casos de éxito en ManyChat están organizados por perfil de cliente y el setter envía el caso de éxito correcto para cada tipo de lead."
      },
      {
        id: "M3",
        area: "ManyChat",
        label: "La tasa de asistencia a llamadas está por encima del 60% — los leads que llegan a la llamada son calificados y filtrados correctamente antes de agendar."
      },
      {
        id: "M4",
        area: "ManyChat",
        label: "El sistema de etiquetas está funcionando correctamente: cada cierre tiene registrado el ángulo de contenido que lo originó y esa información se usa para tomar decisiones de contenido."
      },
      {
        id: "M5",
        area: "ManyChat",
        label: "El setter nunca escribe mensajes manuales — todo el proceso de prospección se ejecuta eligiendo automatizaciones, sin improvisar texto en ningún momento."
      },
    ],
  },
]

// ── renderDiagnosisContent ────────────────────────────────────────────────────
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) =>
    /^\*\*.*\*\*$/.test(part)
      ? <strong key={`${keyPrefix}-b${i}`} style={{ fontWeight: 500, color: "#f5f5f5" }}>{part.slice(2, -2)}</strong>
      : <Fragment key={`${keyPrefix}-t${i}`}>{part}</Fragment>
  )
}

function renderDiagnosisContent(content: string) {
  const lines = content.split("\n")

  return lines.map((rawLine, index) => {
    const line = rawLine.trim()
    const k = `line-${index}`

    if (!line) return <div key={k} style={{ height: "12px" }} />

    if (line === "---") {
      return <div key={k} style={{ height: "0.5px", background: "#111", margin: "20px 0" }} />
    }

    if (line.startsWith("# ")) {
      return (
        <h2 key={k} style={{ fontFamily: "Georgia, serif", fontSize: "22px", fontWeight: 400, color: "#f5f5f5", letterSpacing: "0.5px" }}>
          {renderInline(line.replace(/^#\s+/, ""), k)}
        </h2>
      )
    }

    if (line.startsWith("## ")) {
      return (
        <div key={k} style={{ paddingTop: "12px" }}>
          <h3 style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", textTransform: "uppercase", color: "#4ade80", marginBottom: "8px" }}>
            {line.replace(/^##\s+/, "")}
          </h3>
          <div style={{ height: "0.5px", background: "#111" }} />
        </div>
      )
    }

    if (line.startsWith("### ")) {
      return (
        <h4 key={k} style={{ fontSize: "14px", fontFamily: "sans-serif", fontWeight: 500, color: "#f5f5f5", paddingTop: "8px" }}>
          {renderInline(line.replace(/^###\s+/, ""), k)}
        </h4>
      )
    }

    if (line.startsWith("> ")) {
      return (
        <div key={k} style={{ padding: "12px 16px", border: "0.5px solid rgba(34,197,94,0.2)", borderRadius: "8px", background: "rgba(34,197,94,0.03)", fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#aaaaaa", lineHeight: 1.7 }}>
          {renderInline(line.replace(/^>\s+/, ""), k)}
        </div>
      )
    }

    if (line.startsWith("- ")) {
      return (
        <div key={k} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#aaaaaa", lineHeight: 1.7 }}>
          <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#333", marginTop: "9px", flexShrink: 0 }} />
          <span>{renderInline(line.replace(/^-\s+/, ""), k)}</span>
        </div>
      )
    }

    return (
      <p key={k} style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#aaaaaa", lineHeight: 1.7 }}>
        {renderInline(line, k)}
      </p>
    )
  })
}

type DiagnosisHistoryItem = {
  request_id: string
  status: string
  created_at: string | null
  updated_at: string | null
  result: string | null
}

function formatDiagnosisDate(value: string | null) {
  if (!value) return "Sin fecha"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Sin fecha"
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function getStatusMeta(status: string) {
  if (status === "completed") return { label: "Completado", color: "#22c55e", bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.2)" }
  if (status === "failed") return { label: "Fallido", color: "#f87171", bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.2)" }
  return { label: "Pendiente", color: "#f59e0b", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)" }
}

function getStatusCopy(status: string) {
  if (status === "completed") return "Diagnóstico listo para revisar"
  if (status === "failed") return "Hubo un error en la generación"
  return "Todavía en procesamiento"
}

// ── CAMBIO 6: color de área ───────────────────────────────────────────────────
function areaColor(area: string): string {
  if (area === "Contenido") return "#3b82f6"
  if (area === "Follow Me Ads") return "#a855f7"
  return "#14b8a6" // ManyChat
}

function AuditContent() {
  const [scores, setScores] = useState<Record<string, string>>({})
  const [aiResponse, setAiResponse] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [diagnosisHistory, setDiagnosisHistory] = useState<DiagnosisHistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const activeClientId = useActiveClient()
  // ── CAMBIO 1: mes dinámico ────────────────────────────────────────────────
  const selectedMonth = useSelectedMonth() ?? new Date().toISOString().slice(0, 7)
  const { annualMetrics, loading: loadingAudit } = useAnnualMetrics()
  const annualRevenue = annualMetrics?.total_revenue ?? 0
  // ── CAMBIO 5: nuevo sistema de tiers ────────────────────────────────────
  const auditType: "early" | "mature" = annualRevenue >= 20000 ? "mature" : "early"
  const hasClientContext = Boolean(activeClientId)

  // ── CAMBIO 2: limpiar scores al cambiar de tier ──────────────────────────
  useEffect(() => {
    setScores({})
  }, [auditType])

  const diagnosisContent = useMemo(() => {
    if (!aiResponse) return null
    return renderDiagnosisContent(aiResponse)
  }, [aiResponse])

  const selectedAnswersCount = useMemo(() => Object.keys(scores).length, [scores])

  const loadDiagnosisHistory = useCallback(async () => {
    if (!userId) { setDiagnosisHistory([]); return }
    setLoadingHistory(true)
    try {
      const supabase = createClient()
      let query = supabase
        .from("ai_diagnosis_requests")
        .select(`id, status, created_at, updated_at, ai_diagnosis_results (result, created_at)`)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20)
      if (activeClientId) query = query.eq("client_id", activeClientId)
      const { data, error } = await query
      if (error) { setDiagnosisHistory([]); return }
      const normalized: DiagnosisHistoryItem[] = (data ?? []).map((item: any) => {
        const latestResult = Array.isArray(item?.ai_diagnosis_results)
          ? [...item.ai_diagnosis_results].sort((a: any, b: any) => new Date(b?.created_at ?? 0).getTime() - new Date(a?.created_at ?? 0).getTime())[0] ?? null
          : null
        return { request_id: item.id, status: item.status ?? "pending", created_at: item.created_at ?? null, updated_at: item.updated_at ?? null, result: latestResult?.result ?? null }
      })
      setDiagnosisHistory(normalized)
    } catch { setDiagnosisHistory([]) } finally { setLoadingHistory(false) }
  }, [activeClientId, userId])

  // ── CAMBIO 5: filtros actualizados a "early"/"mature" ───────────────────
  const activeSection = sections.find((_, idx) =>
    (auditType === "early" && idx === 0) || (auditType === "mature" && idx === 1)
  )

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      setUserId(data?.user?.id ?? null)
    }
    loadUser()
  }, [])

  useEffect(() => { loadDiagnosisHistory() }, [loadDiagnosisHistory])

  const deleteDiagnosis = useCallback(async (requestId: string) => {
    const supabase = createClient()
    await supabase.from("ai_diagnosis_results").delete().eq("request_id", requestId)
    await supabase.from("ai_diagnosis_requests").delete().eq("id", requestId)
    setDiagnosisHistory(prev => prev.filter(d => d.request_id !== requestId))
    setAiResponse(prev => {
      const item = diagnosisHistory.find(d => d.request_id === requestId)
      return item?.result && prev === item.result ? "" : prev
    })
  }, [diagnosisHistory])

  const setStatus = (id: string, value: string) => {
    setScores((prev) => {
      if (prev[id] === value) { const updated = { ...prev }; delete updated[id]; return updated }
      return { ...prev, [id]: value }
    })
  }

  // ── CAMBIO 7: buildPrompt agrupado por área ──────────────────────────────
  const buildPrompt = () => {
    const activeItems = activeSection?.items ?? []
    const byArea: Record<string, {
      red: typeof activeItems,
      yellow: typeof activeItems,
      green: typeof activeItems,
      unanswered: typeof activeItems,
    }> = {}
    for (const item of activeItems) {
      if (!byArea[item.area]) {
        byArea[item.area] = { red: [], yellow: [], green: [], unanswered: [] }
      }
      const score = scores[item.id]
      if (score === "red") byArea[item.area].red.push(item)
      else if (score === "yellow") byArea[item.area].yellow.push(item)
      else if (score === "green") byArea[item.area].green.push(item)
      else byArea[item.area].unanswered.push(item)
    }
    const formatItems = (items: typeof activeItems, colorLabel: string) => {
      if (items.length === 0) return "  - Ninguno"
      return items.map(i => `  - [${colorLabel}] ${i.id}: ${i.label}`).join("\n")
    }
    const tier = auditType === "mature"
      ? "sistema maduro (más de 90 días activo)"
      : "sistema en instalación (primeros 90 días)"
    let prompt = `AUDITORÍA DEL SISTEMA NOVA SCALING\n`
    prompt += `Tier: ${tier}\n`
    prompt += `Revenue rolling 12 meses: $${annualRevenue.toLocaleString()}\n\n`
    for (const area of Object.keys(byArea)) {
      prompt += `── ${area.toUpperCase()} ──\n`
      prompt += `Críticos (no está):\n${formatItems(byArea[area].red, "ROJO")}\n`
      prompt += `Parciales (en proceso):\n${formatItems(byArea[area].yellow, "NARANJA")}\n`
      prompt += `Funcionando:\n${formatItems(byArea[area].green, "VERDE")}\n`
      if (byArea[area].unanswered.length > 0) {
        prompt += `Sin responder:\n${formatItems(byArea[area].unanswered, "SIN RESPUESTA")}\n`
      }
      prompt += "\n"
    }
    return prompt
  }

  // ── pollDiagnosisResult — NO TOCAR ──────────────────────────────────────
  const pollDiagnosisResult = async (requestId: string, retries = 20, interval = 3000) => {
    for (let i = 0; i < retries; i++) {
      const res = await fetch(`/api/ai-diagnosis?request_id=${requestId}`)
      const data = await res.json()
      if (data.status === "completed" && data.result) { setAiResponse(data.result); setLoading(false); loadDiagnosisHistory(); return }
      if (data.status === "failed") { setAiResponse(data.result || "El diagnóstico falló."); setLoading(false); loadDiagnosisHistory(); return }
      await new Promise((resolve) => setTimeout(resolve, interval))
    }
    setAiResponse("El diagnóstico está tardando más de lo esperado. Intenta actualizar en unos minutos.")
    setLoading(false)
  }

  // ── generateAIResponse — NO TOCAR ───────────────────────────────────────
  const generateAIResponse = async () => {
    setLoading(true)
    setAiResponse("")
    try {
      const prompt = buildPrompt()
      if (!userId) { setAiResponse("No se pudo identificar el usuario autenticado."); setLoading(false); return }
      const res = await fetch("/api/ai-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, auditType, annualRevenue, selectedMonth, clientId: activeClientId, userId }),
      })
      const data = await res.json()
      if (!res.ok) { setAiResponse(data?.detail || data?.error || "No se pudo generar el diagnóstico."); setLoading(false); loadDiagnosisHistory(); return }
      setAiResponse("Diagnóstico en proceso... Esto puede demorar unos segundos.")
      if (data.request_id) { loadDiagnosisHistory(); pollDiagnosisResult(data.request_id) }
      else { setAiResponse("No se pudo obtener el ID del diagnóstico."); setLoading(false) }
    } catch (err: any) { setAiResponse(err?.message || "Error generando diagnóstico."); setLoading(false) }
  }

  const autoSelectRandom = () => {
    if (!activeSection) return
    const options = ["red", "yellow", "green"]
    const randomScores: Record<string, string> = {}
    for (const item of activeSection.items) {
      randomScores[item.id] = options[Math.floor(Math.random() * options.length)]
    }
    setScores(randomScores)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* ── CAMBIO 8: título actualizado ─────────────────────────────────── */}
      <div>
        <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", marginBottom: "10px", textTransform: "uppercase" }}>
          Herramientas
        </p>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#f5f5f5", letterSpacing: "1px" }}>
          Auditoría del Sistema
        </h1>
      </div>

      {/* Revenue + audit type card — CAMBIO 5: badge actualizado */}
      <div style={{ background: "#0d0d0d", border: "0.5px solid #111", borderRadius: "12px", padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: "9px", fontFamily: "sans-serif", letterSpacing: "2px", color: "#555", textTransform: "uppercase", marginBottom: "8px" }}>
            Revenue rolling 12 meses
          </p>
          <p style={{ fontFamily: "Georgia, serif", fontSize: "34px", fontWeight: 400, color: "#f5f5f5", letterSpacing: "1px" }}>
            {annualMetrics && typeof annualMetrics.total_revenue === "number"
              ? annualMetrics.total_revenue.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
              : "—"}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
          <p style={{ fontSize: "9px", fontFamily: "sans-serif", letterSpacing: "2px", color: "#555", textTransform: "uppercase" }}>
            Audit activo
          </p>
          <span style={{
            display: "inline-flex", alignItems: "center", padding: "6px 14px", borderRadius: "9999px",
            background: auditType === "mature" ? "rgba(34,197,94,0.06)" : "rgba(245,158,11,0.06)",
            border: auditType === "mature" ? "0.5px solid rgba(34,197,94,0.25)" : "0.5px solid rgba(245,158,11,0.25)",
            fontSize: "11px", fontFamily: "sans-serif", fontWeight: 400,
            color: auditType === "mature" ? "#22c55e" : "#f59e0b",
            letterSpacing: "1px",
          }}>
            {auditType === "mature" ? "Sistema maduro (+90 días)" : "Sistema en instalación"}
          </span>
        </div>
      </div>

      {/* Client context badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "5px 12px", borderRadius: "9999px",
          background: hasClientContext ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
          border: hasClientContext ? "0.5px solid rgba(34,197,94,0.25)" : "0.5px solid #1a1a1a",
          fontSize: "10px", fontFamily: "sans-serif", letterSpacing: "1.5px",
          color: hasClientContext ? "#22c55e" : "#444",
        }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: hasClientContext ? "#22c55e" : "#333", flexShrink: 0 }} />
          {hasClientContext ? "CONTEXTO DEL CLIENTE CARGADO" : "SIN CONTEXTO DE CLIENTE"}
        </span>
        {hasClientContext && (
          <p style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#555" }}>
            El diagnóstico IA incluirá datos reales del cliente.
          </p>
        )}
      </div>

      {/* Checklist — CAMBIO 5 filtros + CAMBIO 6 área + CAMBIO 8 description */}
      {loadingAudit ? (
        <p style={{ fontSize: "13px", fontFamily: "sans-serif", color: "#555" }}>Cargando tipo de auditoría…</p>
      ) : (
        sections
          .filter((_, idx) => (auditType === "early" && idx === 0) || (auditType === "mature" && idx === 1))
          .map((section) => (
            <div key={section.title} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", textTransform: "uppercase" }}>
                  {section.title}
                </p>
                {/* CAMBIO 8: description del tier */}
                <p style={{
                  fontSize: "12px",
                  fontFamily: "sans-serif",
                  fontWeight: 300,
                  color: "#555",
                  marginTop: "4px",
                  marginBottom: "8px",
                }}>
                  {section.description}
                </p>
              </div>

              {section.items.map((item) => {
                const selected = scores[item.id]
                const itemBorderColor = selected === "red" ? "rgba(239,68,68,0.2)" : selected === "yellow" ? "rgba(245,158,11,0.2)" : selected === "green" ? "rgba(34,197,94,0.2)" : "#111"
                return (
                <div
                  key={item.id}
                  style={{
                    background: "#0d0d0d",
                    border: `0.5px solid ${itemBorderColor}`,
                    borderRadius: "10px",
                    padding: "16px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    transition: "border-color 0.2s",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={{
                        fontSize: "8px",
                        fontFamily: "sans-serif",
                        fontWeight: 500,
                        letterSpacing: "2px",
                        textTransform: "uppercase",
                        color: areaColor(item.area),
                        padding: "2px 7px",
                        borderRadius: "4px",
                        background: `${areaColor(item.area)}12`,
                        border: `0.5px solid ${areaColor(item.area)}30`,
                      }}>
                        {item.area}
                      </span>
                      <span style={{ fontSize: "9px", fontFamily: "sans-serif", letterSpacing: "2px", color: "#333" }}>{item.id}</span>
                    </div>
                    <p style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#d4d4d4", lineHeight: 1.6 }}>{item.label}</p>
                  </div>

                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    {[
                      { value: "red",    label: "No está", activeBg: "rgba(239,68,68,0.15)",  activeBorder: "#ef4444", activeColor: "#f87171" },
                      { value: "yellow", label: "Parcial",  activeBg: "rgba(245,158,11,0.15)", activeBorder: "#f59e0b", activeColor: "#fbbf24" },
                      { value: "green",  label: "Sí está",  activeBg: "rgba(34,197,94,0.15)",  activeBorder: "#22c55e", activeColor: "#4ade80" },
                    ].map(({ value, label, activeBg, activeBorder, activeColor }) => {
                      const isActive = scores[item.id] === value
                      return (
                        <button
                          key={value}
                          onClick={() => setStatus(item.id, value)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            border: isActive ? `0.5px solid ${activeBorder}` : "0.5px solid #1a1a1a",
                            background: isActive ? activeBg : "#111",
                            color: isActive ? activeColor : "#444",
                            fontSize: "11px",
                            fontFamily: "sans-serif",
                            fontWeight: isActive ? 500 : 400,
                            letterSpacing: "0.5px",
                            transition: "all 0.15s",
                            outline: "none",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )})}
            </div>
          ))
      )}

      {/* Controls — CAMBIO 3: validación mínima + CAMBIO 5: badge tier */}
      <div style={{ background: "#0d0d0d", border: "0.5px solid #111", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "0.5px solid #111", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", textTransform: "uppercase", marginBottom: "6px" }}>
              Diagnóstico
            </p>
            <p style={{ fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: 400, color: "#f5f5f5" }}>
              Generar diagnóstico estratégico
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <span style={{ padding: "4px 10px", borderRadius: "9999px", border: "0.5px solid #222", fontSize: "10px", fontFamily: "sans-serif", color: "#666", letterSpacing: "1px" }}>
              {selectedAnswersCount} respuestas
            </span>
            <span style={{ padding: "4px 10px", borderRadius: "9999px", border: "0.5px solid #222", fontSize: "10px", fontFamily: "sans-serif", color: "#666", letterSpacing: "1px" }}>
              {auditType === "mature" ? "Sistema maduro" : "Sistema en instalación"}
            </span>
          </div>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "0" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={autoSelectRandom}
              style={{ padding: "10px 20px", borderRadius: "8px", border: "0.5px solid #222", background: "transparent", color: "#888", fontSize: "11px", fontFamily: "sans-serif", letterSpacing: "1px", cursor: "pointer", transition: "all 0.2s" }}
            >
              Seleccionar al azar
            </button>
            {/* CAMBIO 3: deshabilitar si < 5 respuestas */}
            <button
              onClick={generateAIResponse}
              disabled={loading || selectedAnswersCount < 5}
              style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "#22c55e", color: "#000", fontSize: "11px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", cursor: (loading || selectedAnswersCount < 5) ? "not-allowed" : "pointer", opacity: (loading || selectedAnswersCount < 5) ? 0.4 : 1, transition: "opacity 0.2s" }}
            >
              {loading ? "Generando..." : "Generar Diagnóstico"}
            </button>
          </div>
          {/* CAMBIO 3: aviso cuando < 5 respuestas */}
          {selectedAnswersCount < 5 && (
            <p style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#555", marginTop: "8px" }}>
              Respondé al menos 5 ítems para generar el diagnóstico
            </p>
          )}
        </div>
      </div>

      {/* AI Response — NO TOCAR estructura */}
      {aiResponse && (
        <div style={{ background: "#0d0d0d", border: "0.5px solid #111", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "0.5px solid #111", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", textTransform: "uppercase", marginBottom: "6px" }}>
                Strategic Output
              </p>
              <p style={{ fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: 400, color: "#f5f5f5" }}>
                Diagnóstico Estratégico
              </p>
            </div>
            <span style={{ padding: "4px 10px", borderRadius: "9999px", border: "0.5px solid #222", fontSize: "10px", fontFamily: "sans-serif", color: "#666", letterSpacing: "1px" }}>
              {loading ? "Procesando" : "Listo"}
            </span>
          </div>

          <div style={{ padding: "24px" }}>
            {aiResponse.startsWith("Diagnóstico en proceso") || aiResponse.startsWith("El diagnóstico está tardando") ? (
              <div style={{ padding: "14px 16px", border: "0.5px solid rgba(245,158,11,0.25)", borderRadius: "8px", background: "rgba(245,158,11,0.04)", fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#f59e0b", lineHeight: 1.7 }}>
                {aiResponse}
              </div>
            ) : aiResponse.startsWith("No se pudo") || aiResponse.startsWith("Error") ? (
              <div style={{ padding: "14px 16px", border: "0.5px solid rgba(239,68,68,0.25)", borderRadius: "8px", background: "rgba(239,68,68,0.04)", fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#f87171", lineHeight: 1.7 }}>
                {aiResponse}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {diagnosisContent}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History — NO TOCAR */}
      <div style={{ background: "#0d0d0d", border: "0.5px solid #111", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "0.5px solid #111", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", textTransform: "uppercase", marginBottom: "6px" }}>
              Historial
            </p>
            <p style={{ fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: 400, color: "#f5f5f5" }}>
              Diagnósticos anteriores
            </p>
          </div>
          <div style={{ padding: "10px 16px", background: "#080808", border: "0.5px solid #111", borderRadius: "8px", textAlign: "right" }}>
            <p style={{ fontSize: "9px", fontFamily: "sans-serif", letterSpacing: "2px", color: "#444", marginBottom: "4px" }}>REGISTROS</p>
            <p style={{ fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: 400, color: "#f5f5f5" }}>
              {loadingHistory ? "..." : diagnosisHistory.length}
            </p>
          </div>
        </div>

        <div style={{ padding: "24px" }}>
          {loadingHistory ? (
            <p style={{ fontSize: "13px", fontFamily: "sans-serif", color: "#555" }}>Cargando diagnósticos guardados...</p>
          ) : diagnosisHistory.length === 0 ? (
            <div style={{ padding: "20px", border: "0.5px dashed #1a1a1a", borderRadius: "8px", fontSize: "13px", fontFamily: "sans-serif", color: "#555" }}>
              Todavía no hay diagnósticos guardados para este cliente.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {diagnosisHistory.map((item, index) => {
                const meta = getStatusMeta(item.status)
                const isActive = !!item.result && aiResponse === item.result
                return (
                  <div
                    key={item.request_id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      padding: "18px",
                      borderRadius: "10px",
                      border: isActive ? "0.5px solid rgba(34,197,94,0.3)" : "0.5px solid #111",
                      background: isActive ? "rgba(34,197,94,0.03)" : "#080808",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "9999px", border: "0.5px solid #1a1a1a", fontSize: "9px", fontFamily: "sans-serif", color: "#444", letterSpacing: "1px" }}>
                        #{String(diagnosisHistory.length - index).padStart(2, "0")}
                      </span>
                      <span style={{ padding: "2px 8px", borderRadius: "9999px", border: `0.5px solid ${meta.border}`, background: meta.bg, fontSize: "9px", fontFamily: "sans-serif", color: meta.color, letterSpacing: "1px" }}>
                        {meta.label}
                      </span>
                      <span style={{ marginLeft: "auto", fontSize: "10px", fontFamily: "sans-serif", color: "#444" }}>
                        {formatDiagnosisDate(item.created_at)}
                      </span>
                    </div>

                    <div style={{ padding: "10px 12px", background: "#0d0d0d", border: "0.5px solid #111", borderRadius: "6px", maxHeight: "100px", overflowY: "auto" }}>
                      <p style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#666", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                        {item.result
                          ? item.result
                          : item.status === "pending"
                          ? "Diagnóstico en proceso. Todavía no hay contenido final disponible."
                          : "No hay resultado almacenado para este diagnóstico."}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => { if (item.result) setAiResponse(item.result) }}
                        disabled={!item.result}
                        style={{
                          flex: 1,
                          padding: "8px 14px",
                          borderRadius: "6px",
                          border: isActive ? "none" : "0.5px solid #1a1a1a",
                          background: isActive ? "#22c55e" : "transparent",
                          color: isActive ? "#000" : "#666",
                          fontSize: "10px",
                          fontFamily: "sans-serif",
                          fontWeight: 500,
                          letterSpacing: "1px",
                          cursor: item.result ? "pointer" : "not-allowed",
                          opacity: item.result ? 1 : 0.4,
                          transition: "all 0.2s",
                        }}
                      >
                        {isActive ? "Diagnóstico abierto" : "Ver diagnóstico completo"}
                      </button>
                      <button
                        onClick={() => deleteDiagnosis(item.request_id)}
                        title="Eliminar diagnóstico"
                        style={{
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "0.5px solid #1a1a1a",
                          background: "transparent",
                          color: "#444",
                          fontSize: "12px",
                          fontFamily: "sans-serif",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          flexShrink: 0,
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#ef4444"; (e.currentTarget as HTMLButtonElement).style.color = "#f87171" }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1a1a1a"; (e.currentTarget as HTMLButtonElement).style.color = "#444" }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuditPage() {
  return (
    <DashboardLayout>
      <AuditContent />
    </DashboardLayout>
  )
}
