"use client"
import { DashboardLayout } from "../../components/dashboard-layout"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { getResearchResult, getResearchHistory } from "../../lib/marketIntelligence"
import { createClient } from "../../lib/supabaseClient"
import { SECTION_LABEL, CARD_P as CARD } from "@/lib/styles"
const FIELD_LABEL: React.CSSProperties = {
  fontSize: "11px",
  fontFamily: "sans-serif",
  fontWeight: 400,
  letterSpacing: "1px",
  textTransform: "uppercase",
  color: "#666",
  marginBottom: "8px",
}
const INPUT: React.CSSProperties = {
  width: "100%",
  background: "#080808",
  border: "0.5px solid #111",
  borderRadius: "8px",
  padding: "10px 14px",
  color: "#f5f5f5",
  fontSize: "13px",
  fontFamily: "sans-serif",
  fontWeight: 300,
  outline: "none",
  boxSizing: "border-box",
}
const SELECT_BTN = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: "10px 14px",
  borderRadius: "8px",
  background: active ? "rgba(34,197,94,0.06)" : "#080808",
  border: active ? "0.5px solid rgba(34,197,94,0.3)" : "0.5px solid #111",
  color: active ? "#22c55e" : "#555",
  fontSize: "13px",
  fontFamily: "sans-serif",
  fontWeight: 300,
  cursor: "pointer",
  transition: "all 0.2s",
  textAlign: "left" as const,
})

function ResultBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#080808", border: "0.5px solid #111", borderRadius: "10px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", textTransform: "uppercase" }}>{title}</p>
      <div style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#aaaaaa", lineHeight: 1.7 }}>{children}</div>
    </div>
  )
}

function renderList(items: any[], keyField: string, descField: string) {
  if (!Array.isArray(items)) return null
  return (
    <ul style={{ display: "flex", flexDirection: "column", gap: "8px", paddingLeft: "0", listStyle: "none" }}>
      {items.map((item: any, idx: number) => (
        <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#333", marginTop: "8px", flexShrink: 0 }} />
          <div>
            {typeof item === "object" ? (
              <>
                {item[keyField] && <div style={{ fontWeight: 400, color: "#d4d4d4" }}>{item[keyField]}</div>}
                {item[descField] && <div style={{ color: "#666", fontSize: "12px" }}>{item[descField]}</div>}
              </>
            ) : (
              <span>{item}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    completed: { label: "Completado", color: "#22c55e", bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.25)" },
    processing: { label: "Procesando", color: "#60a5fa", bg: "rgba(96,165,250,0.06)", border: "rgba(96,165,250,0.25)" },
    failed: { label: "Fallido", color: "#f87171", bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.25)" },
    pending: { label: "Pendiente", color: "#f59e0b", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.25)" },
  }
  const s = map[status] ?? map.pending
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: "9999px", border: `0.5px solid ${s.border}`, background: s.bg, fontSize: "10px", fontFamily: "sans-serif", letterSpacing: "1px", color: s.color }}>
      {s.label}
    </span>
  )
}

function HookBadge({ hook }: { hook: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      style={{
        marginTop: "8px",
        padding: "6px 10px",
        borderRadius: "6px",
        background: "rgba(34,197,94,0.06)",
        border: "0.5px solid rgba(34,197,94,0.2)",
        fontSize: "11px",
        fontFamily: "sans-serif",
        fontWeight: 400,
        color: "#22c55e",
        cursor: "pointer",
        maxWidth: "180px",
        overflow: "hidden",
        whiteSpace: expanded ? "normal" : "nowrap",
        textOverflow: expanded ? "unset" : "ellipsis",
        letterSpacing: "0.5px",
      }}
      title={expanded ? undefined : hook}
    >
      Hook: {hook}
    </div>
  )
}

export default function MarketIntelligencePage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [platform, setPlatform] = useState<string>("")
  const [timeframe, setTimeframe] = useState<string>("")
  const [competitors, setCompetitors] = useState<string[]>(["", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [result, setResult] = useState<any>(null)
  const [userId, setUserId] = useState<string>("")
  const [hasSession, setHasSession] = useState<boolean>(true)

  useEffect(() => {
    const loadUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) { setHasSession(false); router.replace("/login"); return }
      setHasSession(true)
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return
      setUserId(userData.user.id)
    }
    loadUser()
  }, [router, supabase])

  useEffect(() => {
    if (!userId) return
    const fetchRequests = async () => {
      const data = await getResearchHistory({ userId })
      setRequests(data || [])
      setSelectedRequest(data && data.length ? data[0] : null)
    }
    fetchRequests()
  }, [userId])

  useEffect(() => {
    if (!selectedRequest) { setResult(null); return }
    if (selectedRequest.status === "completed") {
      getResearchResult(selectedRequest.id).then(setResult).catch(() => setResult(null))
    } else { setResult(null) }
  }, [selectedRequest])

  const handleCompetitorChange = (i: number, value: string) => {
    setCompetitors((prev) => prev.map((v, idx) => (idx === i ? value : v)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const filtered = competitors.filter((url) => url.trim() !== "")
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError("No hay sesión activa."); setLoading(false); setHasSession(false); router.replace("/login"); return }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError("No hay sesión activa."); setLoading(false); setHasSession(false); router.replace("/login"); return }
      const res = await fetch("/api/market-intelligence/create-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: platform.toLowerCase(), timeframe_days: Number(timeframe), competitors: filtered, access_token: session.access_token, client_id: user.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al crear request")
      setLoading(false)
      setPlatform("")
      setTimeframe("")
      setCompetitors(["", "", "", "", ""])
      router.refresh()
    } catch (err: any) { setError(err.message); setLoading(false) }
  }

  return (
    <DashboardLayout key={userId}>
      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        {/* Header */}
        <div>
          <p style={SECTION_LABEL}>Herramientas</p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#f5f5f5", letterSpacing: "1px", marginBottom: "8px" }}>
            Market Intelligence IA
          </h1>
          <p style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#666", lineHeight: 1.6 }}>
            Investigación competitiva automatizada con inteligencia artificial para detectar oportunidades y escalar con insights accionables.
          </p>
        </div>

        {/* Form */}
        <div style={CARD}>
          <p style={SECTION_LABEL}>Laboratorio de Inteligencia</p>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: 400, color: "#f5f5f5", marginBottom: "24px" }}>
            Nueva investigación
          </h2>

          {!hasSession && (
            <div style={{ padding: "12px 16px", border: "0.5px solid rgba(239,68,68,0.25)", borderRadius: "8px", background: "rgba(239,68,68,0.04)", fontSize: "13px", fontFamily: "sans-serif", color: "#f87171", marginBottom: "16px" }}>
              No hay sesión activa. Por favor, iniciá sesión para continuar.
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Platform + timeframe */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <p style={FIELD_LABEL}>Entorno de análisis</p>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["youtube"].map((p) => (
                    <button key={p} type="button" onClick={() => setPlatform(p)} style={SELECT_BTN(platform === p)}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p style={FIELD_LABEL}>Horizonte temporal</p>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[
                    { val: "30", label: "30 días" },
                    { val: "60", label: "60 días" },
                    { val: "90", label: "90 días" },
                  ].map(({ val, label }) => (
                    <button key={val} type="button" onClick={() => setTimeframe(val)} style={SELECT_BTN(timeframe === val)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Competitors */}
            <div>
              <p style={FIELD_LABEL}>Referencias estratégicas</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i}>
                    <p style={{ ...FIELD_LABEL, marginBottom: "6px" }}>Referencia {i}</p>
                    <input
                      type="text"
                      id={`competitor-url-${i}`}
                      placeholder="URL de referencia"
                      value={competitors[i - 1]}
                      onChange={(e) => handleCompetitorChange(i - 1, e.target.value)}
                      style={INPUT}
                    />
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ padding: "12px 16px", border: "0.5px solid rgba(239,68,68,0.25)", borderRadius: "8px", background: "rgba(239,68,68,0.04)", fontSize: "13px", fontFamily: "sans-serif", color: "#f87171" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "16px", paddingTop: "8px" }}>
              <button
                type="submit"
                disabled={loading || !hasSession}
                style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "#22c55e", color: "#000", fontSize: "11px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", opacity: loading || !hasSession ? 0.6 : 1, transition: "opacity 0.2s" }}
              >
                {loading ? "Procesando..." : "Iniciar Investigación"}
              </button>
              <p style={{ fontSize: "10px", fontFamily: "sans-serif", color: "#555", letterSpacing: "1px" }}>
                Instagram en proceso
              </p>
            </div>
          </form>
        </div>

        {/* History */}
        <div style={CARD}>
          <p style={SECTION_LABEL}>Historial</p>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: 400, color: "#f5f5f5", marginBottom: "20px" }}>
            Investigaciones anteriores
          </h2>

          {requests && requests.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {requests.map((req: any) => (
                <div
                  key={req.id}
                  style={{
                    padding: "16px",
                    background: selectedRequest?.id === req.id ? "rgba(34,197,94,0.03)" : "#080808",
                    border: selectedRequest?.id === req.id ? "0.5px solid rgba(34,197,94,0.2)" : "0.5px solid #111",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <p style={{ fontSize: "11px", fontFamily: "sans-serif", color: "#555", letterSpacing: "1px" }}>
                      {new Date(req.created_at).toLocaleString("es-AR")}
                    </p>
                    {selectedRequest?.id === req.id ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {Array.isArray(req.competitors) && req.competitors.map((c: any, idx: number) => (
                          <span key={idx} style={{ padding: "3px 10px", borderRadius: "9999px", border: "0.5px solid #1a1a1a", fontSize: "10px", fontFamily: "sans-serif", color: "#666" }}>
                            {typeof c === "string" ? c : c?.name || "Competidor"}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: "12px", fontFamily: "sans-serif", color: "#888" }}>
                        {Array.isArray(req.competitors) ? `${req.competitors.length} referencias` : "Referencias"}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <StatusBadge status={req.status} />
                    <button
                      onClick={() => setSelectedRequest(selectedRequest?.id === req.id ? null : req)}
                      style={{ padding: "6px 14px", borderRadius: "6px", border: "0.5px solid #1a1a1a", background: "transparent", color: "#888", fontSize: "11px", fontFamily: "sans-serif", cursor: "pointer", letterSpacing: "1px" }}
                    >
                      {selectedRequest?.id === req.id ? "Ocultar" : "Ver detalle"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "13px", fontFamily: "sans-serif", color: "#555" }}>No hay investigaciones registradas.</p>
          )}
        </div>

        {/* Analysis status */}
        {selectedRequest && (
          <div style={CARD}>
            <p style={SECTION_LABEL}>Estado del análisis</p>
            <div style={{ display: "flex", alignItems: "center", gap: "32px", flexWrap: "wrap", paddingTop: "8px" }}>
              <div>
                <p style={{ ...FIELD_LABEL, marginBottom: "6px" }}>Estado</p>
                <StatusBadge status={selectedRequest.status} />
              </div>
              <div>
                <p style={{ ...FIELD_LABEL, marginBottom: "6px" }}>Fecha de inicio</p>
                <p style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#d4d4d4" }}>
                  {new Date(selectedRequest.created_at).toLocaleString("es-AR")}
                </p>
              </div>
              <div style={{ flex: 1, minWidth: "160px" }}>
                <p style={{ ...FIELD_LABEL, marginBottom: "8px" }}>Progreso</p>
                <div style={{ height: "3px", background: "#111", borderRadius: "9999px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: selectedRequest.status === "completed" ? "100%" : selectedRequest.status === "processing" ? "50%" : "25%",
                    background: selectedRequest.status === "completed" ? "#22c55e" : "#555",
                    borderRadius: "9999px",
                    transition: "width 0.5s",
                  }} />
                </div>
                <p style={{ fontSize: "10px", fontFamily: "sans-serif", color: "#444", marginTop: "6px" }}>
                  {selectedRequest.status === "completed" ? "100% completado" : selectedRequest.status === "processing" ? "50% completado" : "25% completado"}
                </p>
                {selectedRequest.status === "failed" && selectedRequest.error_message && (
                  <p style={{ fontSize: "11px", fontFamily: "sans-serif", color: "#f87171", marginTop: "4px" }}>{selectedRequest.error_message}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={SECTION_LABEL}>Resultados</p>

            {selectedRequest?.platform === "youtube" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "16px" }}>
                {result.summary && <ResultBlock title="Executive Summary"><p style={{ whiteSpace: "pre-line" }}>{result.summary}</p></ResultBlock>}
                {result.resumen_ejecutivo && <ResultBlock title="Resumen Ejecutivo"><p style={{ whiteSpace: "pre-line" }}>{result.resumen_ejecutivo}</p></ResultBlock>}
                {result.patterns && <ResultBlock title="Patrones">{renderList(Array.isArray(result.patterns) ? result.patterns : result.patterns.split("\n").map((l: string) => l), "pattern", "description")}</ResultBlock>}
                {result.patrones_dominantes && <ResultBlock title="Patrones Dominantes">{renderList(Array.isArray(result.patrones_dominantes) ? result.patrones_dominantes : result.patrones_dominantes.split("\n").map((l: string) => l), "pattern", "description")}</ResultBlock>}
                {result.top_hooks && <ResultBlock title="Top Hooks">{renderList(Array.isArray(result.top_hooks) ? result.top_hooks : result.top_hooks.split("\n").map((l: string) => l), "framework", "description")}</ResultBlock>}
                {result.frameworks_de_ganchos && <ResultBlock title="Frameworks de Ganchos">{renderList(Array.isArray(result.frameworks_de_ganchos) ? result.frameworks_de_ganchos : result.frameworks_de_ganchos.split("\n").map((l: string) => l), "framework", "description")}</ResultBlock>}
                {result.opportunities && <ResultBlock title="Oportunidades">{renderList(Array.isArray(result.opportunities) ? result.opportunities : result.opportunities.split("\n").map((l: string) => l), "opportunity", "description")}</ResultBlock>}
                {result.oportunidades_estrategicas && <ResultBlock title="Oportunidades Estratégicas">{renderList(Array.isArray(result.oportunidades_estrategicas) ? result.oportunidades_estrategicas : result.oportunidades_estrategicas.split("\n").map((l: string) => l), "opportunity", "description")}</ResultBlock>}
                {result.recommended_ideas && <ResultBlock title="Ideas Recomendadas">{renderList(Array.isArray(result.recommended_ideas) ? result.recommended_ideas : result.recommended_ideas.split("\n").map((l: string) => l), "idea", "description")}</ResultBlock>}
                {result.angulos_de_contenido_recomendados && <ResultBlock title="Ángulos de Contenido">{renderList(Array.isArray(result.angulos_de_contenido_recomendados) ? result.angulos_de_contenido_recomendados : result.angulos_de_contenido_recomendados.split("\n").map((l: string) => l), "angle", "description")}</ResultBlock>}
                {result.brechas_de_mercado && <ResultBlock title="Brechas de Mercado">{renderList(Array.isArray(result.brechas_de_mercado) ? result.brechas_de_mercado : result.brechas_de_mercado.split("\n").map((l: string) => l), "gap", "description")}</ResultBlock>}
                {result.estructuras_de_storytelling && <ResultBlock title="Estructuras de Storytelling">{renderList(Array.isArray(result.estructuras_de_storytelling) ? result.estructuras_de_storytelling : result.estructuras_de_storytelling.split("\n").map((l: string) => l), "structure", "description")}</ResultBlock>}
                {result.analisis_de_posicionamiento && <ResultBlock title="Análisis de Posicionamiento"><p style={{ whiteSpace: "pre-line" }}>{result.analisis_de_posicionamiento}</p></ResultBlock>}
                {result.nivel_de_sofisticacion_del_mercado && <ResultBlock title="Nivel de Sofisticación del Mercado"><p style={{ whiteSpace: "pre-line" }}>{result.nivel_de_sofisticacion_del_mercado}</p></ResultBlock>}
                {result.nivel_de_saturacion && <ResultBlock title="Nivel de Saturación"><p style={{ whiteSpace: "pre-line" }}>{result.nivel_de_saturacion}</p></ResultBlock>}
                {result.datos_brutos_de_la_competencia && (
                  <ResultBlock title="Datos Brutos de la Competencia">
                    <pre style={{ whiteSpace: "pre-wrap", fontSize: "11px", color: "#666" }}>{JSON.stringify(result.datos_brutos_de_la_competencia, null, 2)}</pre>
                  </ResultBlock>
                )}
                {result.analisis_completo && (
                  <ResultBlock title="Análisis Completo">
                    <pre style={{ whiteSpace: "pre-wrap", fontSize: "11px", color: "#666" }}>{JSON.stringify(result.analisis_completo, null, 2)}</pre>
                  </ResultBlock>
                )}

                {/* Video analysis */}
                {result.analisis_de_videos && Array.isArray(result.analisis_de_videos) && (
                  <div style={{ gridColumn: "1 / -1", background: "#080808", border: "0.5px solid #111", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
                    <p style={SECTION_LABEL}>Análisis Individual de Videos</p>
                    {result.analisis_de_videos.map((video: any, idx: number) => (
                      <div key={idx} style={{ border: "0.5px solid #111", borderRadius: "10px", padding: "20px", background: "#0d0d0d", display: "flex", flexDirection: "column", gap: "16px" }}>
                        {/* Video header */}
                        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                          {video.thumbnail_url && (
                            <div style={{ flexShrink: 0 }}>
                              <a href={video.video_url || "#"} target="_blank" rel="noreferrer">
                                <img
                                  src={video.thumbnail_url}
                                  alt={video.video_title || "Thumbnail"}
                                  style={{ width: "160px", height: "auto", borderRadius: "8px", border: "0.5px solid #111", display: "block" }}
                                  loading="lazy"
                                />
                              </a>
                              {video.hook_type && <HookBadge hook={video.hook_type} />}
                            </div>
                          )}
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                            {video.creator && (
                              <p style={{ fontSize: "11px", fontFamily: "sans-serif", color: "#666", letterSpacing: "1px" }}>{video.creator}</p>
                            )}
                            {video.video_title && (
                              <p style={{ fontSize: "15px", fontFamily: "sans-serif", fontWeight: 400, color: "#f5f5f5", lineHeight: 1.4 }}>{video.video_title}</p>
                            )}
                            {video.video_url && (
                              <a href={video.video_url} target="_blank" rel="noreferrer" style={{ fontSize: "11px", fontFamily: "sans-serif", color: "#22c55e", textDecoration: "none", wordBreak: "break-all" }}>
                                {video.video_url}
                              </a>
                            )}
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                              {typeof video.views === "number" && (
                                <span style={{ padding: "3px 10px", borderRadius: "9999px", border: "0.5px solid #1a1a1a", fontSize: "10px", fontFamily: "sans-serif", color: "#666" }}>
                                  {video.views.toLocaleString()} vistas
                                </span>
                              )}
                              {video.video_duration && (
                                <span style={{ padding: "3px 10px", borderRadius: "9999px", border: "0.5px solid #1a1a1a", fontSize: "10px", fontFamily: "sans-serif", color: "#666" }}>
                                  {video.video_duration}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ height: "0.5px", background: "#111" }} />

                        {/* Analysis sections */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          {video.video_analysis && (
                            <div style={{ padding: "14px 16px", background: "#080808", border: "0.5px solid rgba(34,197,94,0.15)", borderRadius: "8px" }}>
                              <p style={{ fontSize: "9px", fontFamily: "sans-serif", letterSpacing: "2px", color: "#4ade80", marginBottom: "8px" }}>ANÁLISIS DEL VIDEO</p>
                              <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#aaaaaa", lineHeight: 1.7, whiteSpace: "pre-line" }}>{video.video_analysis}</p>
                            </div>
                          )}
                          {video.structural_breakdown && (
                            <div style={{ padding: "14px 16px", background: "#080808", border: "0.5px solid rgba(96,165,250,0.15)", borderRadius: "8px" }}>
                              <p style={{ fontSize: "9px", fontFamily: "sans-serif", letterSpacing: "2px", color: "#60a5fa", marginBottom: "8px" }}>DESGLOSE ESTRUCTURAL</p>
                              <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#aaaaaa", lineHeight: 1.7, whiteSpace: "pre-line" }}>{video.structural_breakdown}</p>
                            </div>
                          )}
                          {video.why_it_performed && (
                            <div style={{ padding: "14px 16px", background: "#080808", border: "0.5px solid rgba(245,158,11,0.15)", borderRadius: "8px" }}>
                              <p style={{ fontSize: "9px", fontFamily: "sans-serif", letterSpacing: "2px", color: "#f59e0b", marginBottom: "8px" }}>¿POR QUÉ FUNCIONÓ?</p>
                              <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#aaaaaa", lineHeight: 1.7, whiteSpace: "pre-line" }}>{video.why_it_performed}</p>
                            </div>
                          )}
                          {video.replicable_elements && (
                            <div style={{ padding: "14px 16px", background: "#080808", border: "0.5px solid rgba(168,85,247,0.15)", borderRadius: "8px" }}>
                              <p style={{ fontSize: "9px", fontFamily: "sans-serif", letterSpacing: "2px", color: "#a855f7", marginBottom: "8px" }}>ELEMENTOS REPLICABLES</p>
                              <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#aaaaaa", lineHeight: 1.7, whiteSpace: "pre-line" }}>{video.replicable_elements}</p>
                            </div>
                          )}
                          {video.video_transcript && typeof video.video_transcript === "string" && video.video_transcript.trim().length > 0 && (
                            <details style={{ border: "0.5px solid #111", borderRadius: "8px", padding: "12px 14px" }}>
                              <summary style={{ fontSize: "11px", fontFamily: "sans-serif", color: "#666", cursor: "pointer", letterSpacing: "1px" }}>
                                Ver transcripción
                              </summary>
                              <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#555", lineHeight: 1.7, whiteSpace: "pre-line", marginTop: "10px" }}>
                                {video.video_transcript.trim()}
                              </p>
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedRequest?.platform === "instagram" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <ResultBlock title="Devolución Instagram"><p style={{ color: "#555" }}>Contenido Instagram</p></ResultBlock>
                {result.patrones_dominantes && (
                  <ResultBlock title="Patrones Dominantes">
                    <pre style={{ whiteSpace: "pre-wrap", fontSize: "11px" }}>{JSON.stringify(result.patrones_dominantes, null, 2)}</pre>
                  </ResultBlock>
                )}
                {result.analisis_de_posicionamiento && (
                  <ResultBlock title="Análisis de Posicionamiento"><p style={{ whiteSpace: "pre-line" }}>{result.analisis_de_posicionamiento}</p></ResultBlock>
                )}
                {result.nivel_de_sofisticacion_del_mercado && (
                  <ResultBlock title="Nivel de Sofisticación"><p style={{ whiteSpace: "pre-line" }}>{result.nivel_de_sofisticacion_del_mercado}</p></ResultBlock>
                )}
                {result.angulos_de_contenido_recomendados && (
                  <ResultBlock title="Ángulos de Contenido Recomendados">
                    <pre style={{ whiteSpace: "pre-wrap", fontSize: "11px" }}>{JSON.stringify(result.angulos_de_contenido_recomendados, null, 2)}</pre>
                  </ResultBlock>
                )}
              </div>
            )}
          </div>
        )}

        {!result && selectedRequest && selectedRequest.status !== "completed" && (
          <div style={CARD}>
            <p style={{ fontSize: "13px", fontFamily: "sans-serif", color: "#555" }}>No hay hallazgos estratégicos disponibles aún.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
