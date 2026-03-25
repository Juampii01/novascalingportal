"use client"

import { useEffect, useState } from "react"
import { DashboardLayout, useActiveClient, useSelectedMonth } from "@/components/dashboard-layout"
import { SkeletonCard, EmptyState } from "@/components/skeleton"
import { useMonthlyMetrics } from "@/hooks/useMonthlyMetrics"
import { useContentPieces, ContentPiece } from "@/hooks/useContentPieces"
import { SECTION_LABEL, CARD, CARD_P, TH, TD } from "@/lib/styles"
import { createClient } from "@/lib/supabaseClient"
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function healthColor(s: number) {
  if (s >= 75) return "#22c55e"
  if (s >= 50) return "#f59e0b"
  return "#ef4444"
}

const CATEGORY_META: Record<string, { label: string; color: string; desc: string }> = {
  Problema:   { label: "Problema",  color: "#60a5fa", desc: "TOFU · Ads candidato" },
  Solución:   { label: "Solución",  color: "#f59e0b", desc: "MOFU · Educa sin revelar el cómo" },
  Producto:   { label: "Producto",  color: "#22c55e", desc: "BOFU · Casos de éxito" },
  Mentalidad: { label: "Mentalidad",color: "#a855f7", desc: "BOFU · Rompe objeciones" },
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  publicado: { label: "Publicado", color: "#22c55e" },
  borrador:  { label: "Borrador",  color: "#f59e0b" },
  atrasado:  { label: "Atrasado",  color: "#ef4444" },
}

// Target distribution
const TARGETS: Record<string, number> = { Problema: 50, Producto: 20, Solución: 15, Mentalidad: 15 }

// ─── Tab: Por pieza ───────────────────────────────────────────────────────────

const STATUS_CYCLE: ContentPiece["status"][] = ["publicado", "borrador", "atrasado"]

function StatusToggle({
  piece,
  onStatusChange,
}: {
  piece: ContentPiece
  onStatusChange: (id: string, val: ContentPiece["status"]) => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const meta = STATUS_META[piece.status] ?? { label: piece.status, color: "#555" }

  const choose = async (next: ContentPiece["status"]) => {
    if (next === piece.status) { setOpen(false); return }
    setLoading(true)
    setOpen(false)
    try {
      const supabase = createClient()
      await supabase.from("content_pieces").update({ status: next }).eq("id", piece.id)
      onStatusChange(piece.id, next)
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        style={{
          padding: "3px 10px",
          borderRadius: "5px",
          border: `0.5px solid ${open ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)"}`,
          background: open ? "rgba(255,255,255,0.04)" : "transparent",
          color: meta.color,
          fontSize: "9px",
          fontFamily: "sans-serif",
          fontWeight: 500,
          letterSpacing: "1px",
          textTransform: "uppercase",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.15s",
          opacity: loading ? 0.5 : 1,
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          gap: "5px",
        }}
      >
        {meta.label}
        <span style={{ fontSize: "7px", color: "#444", opacity: open ? 1 : 0.5 }}>▾</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 100,
            background: "#0d0d0d",
            border: "0.5px solid #222",
            borderRadius: "8px",
            overflow: "hidden",
            minWidth: "110px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
          }}>
            {STATUS_CYCLE.map((s) => {
              const m = STATUS_META[s]
              const active = s === piece.status
              return (
                <button
                  key={s}
                  onClick={() => choose(s)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "9px 14px",
                    background: active ? "rgba(255,255,255,0.04)" : "transparent",
                    border: "none",
                    borderBottom: s !== "atrasado" ? "0.5px solid #111" : "none",
                    color: active ? m.color : "#555",
                    fontSize: "9px",
                    fontFamily: "sans-serif",
                    fontWeight: active ? 500 : 300,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.color = m.color }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = active ? "rgba(255,255,255,0.04)" : "transparent"; (e.currentTarget as HTMLButtonElement).style.color = active ? m.color : "#555" }}
                >
                  {m.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function AdsToggle({ piece, onToggle }: { piece: ContentPiece; onToggle: (id: string, val: boolean) => void }) {
  const [loading, setLoading] = useState(false)
  const isCandidate = piece.adsCandidate

  const toggle = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      await supabase
        .from("content_pieces")
        .update({ ads_candidate: !isCandidate })
        .eq("id", piece.id)
      onToggle(piece.id, !isCandidate)
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        padding: "3px 10px",
        borderRadius: "5px",
        border: `0.5px solid ${isCandidate ? "rgba(34,197,94,0.25)" : "#1a1a1a"}`,
        background: isCandidate ? "rgba(34,197,94,0.08)" : "transparent",
        color: isCandidate ? "#22c55e" : "#444",
        fontSize: "8px",
        fontFamily: "sans-serif",
        fontWeight: 500,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "all 0.15s",
        opacity: loading ? 0.5 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {isCandidate ? "✓ ADS" : "ADS"}
    </button>
  )
}

function ContentTab({ clientId, selectedMonth }: { clientId: string | null; selectedMonth: string | null }) {
  const { data: pieces, loading, refetch } = useContentPieces(clientId, selectedMonth)
  const [localPieces, setLocalPieces] = useState<ContentPiece[] | null>(null)

  const displayPieces = localPieces ?? pieces

  const handleToggle = (id: string, val: boolean) => {
    setLocalPieces((prev) =>
      (prev ?? pieces).map((p) => p.id === id ? { ...p, adsCandidate: val } : p)
    )
  }

  const handleStatusChange = (id: string, val: ContentPiece["status"]) => {
    setLocalPieces((prev) =>
      (prev ?? pieces).map((p) => p.id === id ? { ...p, status: val } : p)
    )
  }

  if (loading) return <SkeletonCard height="300px" />

  if (displayPieces.length === 0) {
    return (
      <EmptyState
        message="Sin piezas de contenido para este período."
        subMessage="Cargá piezas desde la sección Calendario."
      />
    )
  }

  // Distribution stats
  const total = displayPieces.length
  const byCategory: Record<string, number> = {}
  for (const p of displayPieces) {
    byCategory[p.category] = (byCategory[p.category] ?? 0) + 1
  }

  const published = displayPieces.filter((p) => p.status === "publicado").length
  const adsCandidates = displayPieces.filter((p) => p.adsCandidate).length
  const publishedAds = displayPieces.filter((p) => p.adsCandidate && p.status === "publicado").length

  const catOrder = ["Problema", "Solución", "Producto", "Mentalidad"]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

      {/* Distribution bars */}
      <div>
        <p style={SECTION_LABEL}>Distribución de categorías</p>
        <div style={{ ...CARD_P, display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
            {catOrder.map((cat) => {
              const count = byCategory[cat] ?? 0
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              const target = TARGETS[cat] ?? 0
              const meta = CATEGORY_META[cat]
              const diff = pct - target
              return (
                <div key={cat}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div>
                      <p style={{ fontSize: "11px", fontFamily: "sans-serif", color: meta.color, fontWeight: 500 }}>{cat}</p>
                      <p style={{ fontSize: "8px", fontFamily: "sans-serif", color: "#444", letterSpacing: "0.5px" }}>{meta.desc}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontFamily: "Georgia, serif", fontSize: "18px", color: "#f5f5f5" }}>{pct}%</p>
                      <p style={{ fontSize: "8px", fontFamily: "sans-serif", color: diff > 5 ? "#22c55e" : diff < -5 ? "#ef4444" : "#555" }}>
                        meta {target}% {diff > 0 ? `+${diff}` : diff < 0 ? diff : "✓"}
                      </p>
                    </div>
                  </div>
                  <div style={{ height: "3px", background: "#111", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: meta.color, borderRadius: "9999px", transition: "width 0.6s ease" }} />
                  </div>
                  <p style={{ fontSize: "9px", fontFamily: "sans-serif", color: "#333", marginTop: "5px" }}>{count} pieza{count !== 1 ? "s" : ""}</p>
                </div>
              )
            })}
          </div>

          {/* Summary pills */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", borderTop: "0.5px solid #111", paddingTop: "16px" }}>
            {[
              { label: "Total piezas", value: String(total) },
              { label: "Publicadas", value: String(published), color: "#22c55e" },
              { label: "Candidatas ADS", value: String(adsCandidates), color: "#60a5fa" },
              { label: "ADS publicadas", value: String(publishedAds), color: "#22c55e" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <p style={{ fontFamily: "Georgia, serif", fontSize: "16px", color: item.color ?? "#f5f5f5" }}>{item.value}</p>
                <p style={{ fontSize: "9px", fontFamily: "sans-serif", color: "#444", letterSpacing: "1px" }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pieces table */}
      <div>
        <p style={SECTION_LABEL}>Piezas del período · {total} total</p>
        <div style={{ ...CARD, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "640px" }}>
              <thead>
                <tr>
                  {["Día", "Título", "Categoría", "Formato", "Estado", "Ads"].map((h) => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayPieces.map((p, i) => {
                  const catMeta = CATEGORY_META[p.category]
                  return (
                    <tr key={p.id} style={{ borderBottom: i < displayPieces.length - 1 ? "0.5px solid #0d0d0d" : "none" }}>
                      <td style={{ ...TD, fontSize: "11px", color: "#444", whiteSpace: "nowrap" }}>
                        {p.date ?? p.day}
                      </td>
                      <td style={{ ...TD, color: "#d4d4d4", maxWidth: "260px" }}>
                        <p style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</p>
                        {p.hook && (
                          <p style={{ fontSize: "10px", color: "#444", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            Hook: {p.hook}
                          </p>
                        )}
                      </td>
                      <td style={TD}>
                        <span style={{ fontSize: "10px", fontFamily: "sans-serif", color: catMeta?.color ?? "#888", fontWeight: 500 }}>
                          {p.category}
                        </span>
                      </td>
                      <td style={{ ...TD, fontSize: "11px" }}>{p.format}</td>
                      <td style={TD}>
                        <StatusToggle piece={p} onStatusChange={handleStatusChange} />
                      </td>
                      <td style={{ ...TD, textAlign: "center" }}>
                        <AdsToggle piece={p} onToggle={handleToggle} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  )
}

// ─── Tab: Evolución mensual ───────────────────────────────────────────────────

function CashTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "#0d0d0d", border: "0.5px solid #222", borderRadius: "8px", padding: "10px 14px" }}>
      <p style={{ fontSize: "9px", color: "#555", fontFamily: "sans-serif", letterSpacing: "2px", marginBottom: "6px" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ fontSize: "12px", fontFamily: "Georgia, serif", color: p.color }}>
          {p.name}: ${Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  )
}

function EvolucionTab({ clientId }: { clientId: string | null }) {
  const { data: monthly, loading } = useMonthlyMetrics(clientId)

  if (loading) return <SkeletonCard height="300px" />
  if (monthly.length === 0) {
    return <EmptyState message="Sin registros mensuales todavía." subMessage="Cargá el primer mes desde Overview → + Cargar mes." />
  }

  const totalCash = monthly.reduce((s, m) => s + m.cashCollected, 0)
  const totalNova = monthly.reduce((s, m) => s + m.revenueShare, 0)
  const totalCloses = monthly.reduce((s, m) => s + m.closes, 0)
  const totalFollowers = monthly.reduce((s, m) => s + m.newFollowers, 0)
  const totalConversations = monthly.reduce((s, m) => s + m.totalConversations, 0)
  const avgHealth = monthly.length > 0
    ? Math.round(monthly.reduce((s, m) => s + m.healthScore, 0) / monthly.length)
    : 0
  const avgCloseRate = monthly.reduce((s, m) => {
    const attended = m.callsAttended
    return s + (attended > 0 ? m.closes / attended : 0)
  }, 0) / monthly.length

  const chartData = monthly.map((m) => ({
    mes: m.label,
    cash: m.cashCollected,
    nova: m.revenueShare,
    cierres: m.closes,
    seguidores: m.newFollowers,
    health: m.healthScore,
  }))

  const summaryItems = [
    { label: "Cash total", value: `$${totalCash.toLocaleString()}`, accent: true },
    { label: "Revenue NOVA", value: `$${totalNova.toLocaleString()}`, green: true },
    { label: "Cierres totales", value: String(totalCloses) },
    { label: "Nuevos seguidores", value: totalFollowers.toLocaleString() },
    { label: "Conversaciones", value: totalConversations.toLocaleString() },
    { label: "Tasa cierre prom.", value: `${(avgCloseRate * 100).toFixed(0)}%` },
    { label: "Health prom.", value: String(avgHealth), healthVal: avgHealth },
    { label: "Meses registrados", value: String(monthly.length) },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

      {/* KPIs */}
      <div>
        <p style={SECTION_LABEL}>Acumulado del período</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
          {summaryItems.map((item) => (
            <div key={item.label} style={{ ...CARD, padding: "18px 20px" }}>
              <p style={{ fontSize: "9px", fontFamily: "sans-serif", letterSpacing: "2px", color: "#444", textTransform: "uppercase", marginBottom: "8px" }}>
                {item.label}
              </p>
              <p style={{
                fontFamily: "Georgia, serif",
                fontSize: "22px",
                fontWeight: 400,
                color: item.healthVal !== undefined ? healthColor(item.healthVal)
                  : item.green ? "#22c55e"
                  : "#f5f5f5",
              }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div>
        <p style={SECTION_LABEL}>Cash collected vs Revenue NOVA</p>
        <div style={CARD_P}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="vgCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="vgNova" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ade80" stopOpacity={0.06} />
                  <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="1 4" stroke="#111" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: "#333", fontSize: 9, fontFamily: "sans-serif" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CashTooltip />} />
              <Area type="monotone" dataKey="cash" name="Cash" stroke="#22c55e" strokeWidth={1.5} fill="url(#vgCash)" />
              <Area type="monotone" dataKey="nova" name="NOVA" stroke="#4ade80" strokeWidth={1} strokeOpacity={0.5} fill="url(#vgNova)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div>
          <p style={SECTION_LABEL}>Cierres por mes</p>
          <div style={CARD_P}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} barSize={20}>
                <CartesianGrid strokeDasharray="1 4" stroke="#111" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: "#333", fontSize: 9, fontFamily: "sans-serif" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={({ active, payload, label }: any) => {
                  if (!active || !payload?.length) return null
                  return <div style={{ background: "#0d0d0d", border: "0.5px solid #222", borderRadius: "8px", padding: "10px 14px" }}>
                    <p style={{ fontSize: "9px", color: "#555", fontFamily: "sans-serif", letterSpacing: "2px", marginBottom: "4px" }}>{label}</p>
                    <p style={{ fontSize: "12px", fontFamily: "Georgia, serif", color: "#22c55e" }}>Cierres: {payload[0]?.value}</p>
                  </div>
                }} />
                <Bar dataKey="cierres" fill="rgba(34,197,94,0.18)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <p style={SECTION_LABEL}>Health score por mes</p>
          <div style={CARD_P}>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="vgHealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="1 4" stroke="#111" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: "#333", fontSize: 9, fontFamily: "sans-serif" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} hide />
                <Tooltip content={({ active, payload, label }: any) => {
                  if (!active || !payload?.length) return null
                  const val = payload[0]?.value
                  return <div style={{ background: "#0d0d0d", border: "0.5px solid #222", borderRadius: "8px", padding: "10px 14px" }}>
                    <p style={{ fontSize: "9px", color: "#555", fontFamily: "sans-serif", letterSpacing: "2px", marginBottom: "4px" }}>{label}</p>
                    <p style={{ fontSize: "12px", fontFamily: "Georgia, serif", color: healthColor(val) }}>Health: {val}</p>
                  </div>
                }} />
                <Area type="monotone" dataKey="health" stroke="#22c55e" strokeWidth={1.5} fill="url(#vgHealth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <div>
        <p style={SECTION_LABEL}>Detalle por mes</p>
        <div style={{ ...CARD, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
              <thead>
                <tr>
                  {["Mes", "Seguidores", "Conversaciones", "Llamadas", "Asistieron", "Cierres", "Cash", "Rev NOVA", "Health"].map((h) => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...monthly].reverse().map((m) => (
                  <tr key={`${m.year}-${m.month}`}>
                    <td style={{ ...TD, color: "#d4d4d4", fontFamily: "sans-serif" }}>{m.label}</td>
                    <td style={TD}>{m.newFollowers > 0 ? `+${m.newFollowers.toLocaleString()}` : "—"}</td>
                    <td style={TD}>{m.totalConversations > 0 ? m.totalConversations : "—"}</td>
                    <td style={TD}>{m.callsBooked > 0 ? m.callsBooked : "—"}</td>
                    <td style={TD}>{m.callsAttended > 0 ? m.callsAttended : "—"}</td>
                    <td style={{ ...TD, fontFamily: "Georgia, serif", color: "#f5f5f5" }}>{m.closes > 0 ? m.closes : "—"}</td>
                    <td style={{ ...TD, fontFamily: "Georgia, serif", color: "#f5f5f5" }}>{m.cashCollected > 0 ? `$${m.cashCollected.toLocaleString()}` : "—"}</td>
                    <td style={{ ...TD, fontFamily: "Georgia, serif", color: "#22c55e" }}>{m.revenueShare > 0 ? `$${m.revenueShare.toLocaleString()}` : "—"}</td>
                    <td style={TD}>
                      {m.healthScore > 0
                        ? <span style={{ color: healthColor(m.healthScore), fontFamily: "Georgia, serif" }}>{m.healthScore}</span>
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Comparativa de períodos ─────────────────────────────────────────────

interface MonthOption {
  key: string // "2026-3"
  label: string
  data: ReturnType<typeof useMonthlyMetrics>["data"][0]
}

const COMPARE_METRICS: { key: keyof ReturnType<typeof useMonthlyMetrics>["data"][0]; label: string; prefix?: string; color: string }[] = [
  { key: "cashCollected",       label: "Cash collected",       prefix: "$", color: "#22c55e" },
  { key: "revenueShare",        label: "Revenue NOVA",         prefix: "$", color: "#4ade80" },
  { key: "closes",              label: "Cierres",                            color: "#f5f5f5" },
  { key: "callsBooked",         label: "Llamadas agendadas",                 color: "#f5f5f5" },
  { key: "callsAttended",       label: "Llamadas asistidas",                 color: "#f5f5f5" },
  { key: "newFollowers",        label: "Nuevos seguidores",                  color: "#60a5fa" },
  { key: "totalConversations",  label: "Conversaciones",                     color: "#60a5fa" },
  { key: "healthScore",         label: "Health score",                       color: "#f59e0b" },
]

function delta(a: number, b: number): { pct: number; dir: "up" | "down" | "flat" } {
  if (a === 0 && b === 0) return { pct: 0, dir: "flat" }
  if (a === 0) return { pct: 100, dir: "up" }
  const pct = Math.round(((b - a) / a) * 100)
  return { pct: Math.abs(pct), dir: pct > 0 ? "up" : pct < 0 ? "down" : "flat" }
}

function ComparativaTab({ clientId }: { clientId: string | null }) {
  const { data: monthly, loading } = useMonthlyMetrics(clientId)

  const options: MonthOption[] = [...monthly]
    .sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month)
    .map((m) => ({ key: `${m.year}-${m.month}`, label: m.label, data: m }))

  const [selA, setSelA] = useState<string>("")
  const [selB, setSelB] = useState<string>("")

  // Auto-select latest 2 months when data loads
  useEffect(() => {
    if (options.length >= 2 && !selA && !selB) {
      setSelA(options[1].key)
      setSelB(options[0].key)
    }
  }, [options.length])

  if (loading) return <SkeletonCard height="300px" />
  if (monthly.length < 2) {
    return <EmptyState message="Necesitás al menos 2 meses registrados para comparar." subMessage="Cargá más meses desde Overview → + Cargar mes." />
  }

  const monthA = options.find((o) => o.key === selA)
  const monthB = options.find((o) => o.key === selB)

  const selectStyle: React.CSSProperties = {
    background: "#0d0d0d",
    border: "0.5px solid #1a1a1a",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#f5f5f5",
    fontSize: "12px",
    fontFamily: "sans-serif",
    fontWeight: 300,
    outline: "none",
    cursor: "pointer",
    minWidth: "160px",
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

      {/* Month selectors */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <p style={{ fontSize: "9px", fontFamily: "sans-serif", color: "#444", letterSpacing: "2px", textTransform: "uppercase" }}>Mes base</p>
          <select value={selA} onChange={(e) => setSelA(e.target.value)} style={selectStyle}>
            {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>

        <div style={{ fontSize: "20px", color: "#222", marginTop: "18px", userSelect: "none" }}>→</div>

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <p style={{ fontSize: "9px", fontFamily: "sans-serif", color: "#4ade80", letterSpacing: "2px", textTransform: "uppercase" }}>Mes a comparar</p>
          <select value={selB} onChange={(e) => setSelB(e.target.value)} style={{ ...selectStyle, borderColor: "rgba(34,197,94,0.2)" }}>
            {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Comparison grid */}
      {monthA && monthB && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px 80px", gap: "8px", padding: "0 16px" }}>
            <p style={{ fontSize: "9px", fontFamily: "sans-serif", color: "#333", letterSpacing: "1.5px" }}>MÉTRICA</p>
            <p style={{ fontSize: "9px", fontFamily: "sans-serif", color: "#555", letterSpacing: "1.5px", textAlign: "right" }}>{monthA.label.toUpperCase()}</p>
            <p style={{ fontSize: "9px", fontFamily: "sans-serif", color: "#4ade80", letterSpacing: "1.5px", textAlign: "right" }}>{monthB.label.toUpperCase()}</p>
            <p style={{ fontSize: "9px", fontFamily: "sans-serif", color: "#333", letterSpacing: "1.5px", textAlign: "right" }}>DELTA</p>
          </div>

          {COMPARE_METRICS.map((m) => {
            const valA = Number(monthA.data[m.key] ?? 0)
            const valB = Number(monthB.data[m.key] ?? 0)
            const d = delta(valA, valB)
            const fmtA = m.prefix ? `${m.prefix}${valA.toLocaleString()}` : String(valA)
            const fmtB = m.prefix ? `${m.prefix}${valB.toLocaleString()}` : String(valB)
            const deltaColor = d.dir === "up" ? "#22c55e" : d.dir === "down" ? "#ef4444" : "#555"
            const deltaSign  = d.dir === "up" ? "↑" : d.dir === "down" ? "↓" : "—"

            return (
              <div
                key={String(m.key)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 140px 140px 80px",
                  gap: "8px",
                  background: "#0d0d0d",
                  border: "0.5px solid #111",
                  borderRadius: "10px",
                  padding: "16px",
                  alignItems: "center",
                }}
              >
                <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#888", letterSpacing: "0.2px" }}>
                  {m.label}
                </p>
                <p style={{ fontFamily: "Georgia, serif", fontSize: "16px", color: valA > 0 ? "#888" : "#333", textAlign: "right" }}>
                  {valA > 0 ? fmtA : "—"}
                </p>
                <p style={{ fontFamily: "Georgia, serif", fontSize: "16px", color: valB > 0 ? m.color : "#333", textAlign: "right" }}>
                  {valB > 0 ? fmtB : "—"}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                  {d.dir !== "flat" && (valA > 0 || valB > 0) ? (
                    <>
                      <span style={{ fontSize: "13px", color: deltaColor }}>{deltaSign}</span>
                      <span style={{ fontFamily: "Georgia, serif", fontSize: "13px", color: deltaColor }}>{d.pct}%</span>
                    </>
                  ) : (
                    <span style={{ fontSize: "12px", color: "#333" }}>—</span>
                  )}
                </div>
              </div>
            )
          })}

          {/* Close rate comparison */}
          {(() => {
            const crA = monthA.data.callsAttended > 0 ? Math.round((monthA.data.closes / monthA.data.callsAttended) * 100) : 0
            const crB = monthB.data.callsAttended > 0 ? Math.round((monthB.data.closes / monthB.data.callsAttended) * 100) : 0
            const d = delta(crA, crB)
            const deltaColor = d.dir === "up" ? "#22c55e" : d.dir === "down" ? "#ef4444" : "#555"
            const deltaSign  = d.dir === "up" ? "↑" : d.dir === "down" ? "↓" : "—"
            return (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px 80px", gap: "8px", background: "#0d0d0d", border: "0.5px solid #111", borderRadius: "10px", padding: "16px", alignItems: "center" }}>
                <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#888" }}>Tasa de cierre</p>
                <p style={{ fontFamily: "Georgia, serif", fontSize: "16px", color: crA > 0 ? "#888" : "#333", textAlign: "right" }}>{crA > 0 ? `${crA}%` : "—"}</p>
                <p style={{ fontFamily: "Georgia, serif", fontSize: "16px", color: crB > 0 ? "#f59e0b" : "#333", textAlign: "right" }}>{crB > 0 ? `${crB}%` : "—"}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                  {d.dir !== "flat" && (crA > 0 || crB > 0) ? (
                    <><span style={{ fontSize: "13px", color: deltaColor }}>{deltaSign}</span><span style={{ fontFamily: "Georgia, serif", fontSize: "13px", color: deltaColor }}>{d.pct}%</span></>
                  ) : <span style={{ fontSize: "12px", color: "#333" }}>—</span>}
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "contenido" | "evolucion" | "comparar"

function VisibilityContent() {
  const clientId     = useActiveClient()
  const selectedMonth = useSelectedMonth()
  const [tab, setTab] = useState<Tab>("contenido")

  const tabs: { id: Tab; label: string; desc: string }[] = [
    { id: "contenido",  label: "Contenido",  desc: "Piezas, distribución y candidatos ADS" },
    { id: "evolucion",  label: "Evolución",  desc: "KPIs mensuales acumulados" },
    { id: "comparar",   label: "Comparar",   desc: "Mes A vs mes B · delta" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

      {/* Header */}
      <div>
        <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", marginBottom: "10px", textTransform: "uppercase" }}>
          Visibilidad del negocio
        </p>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#f5f5f5", letterSpacing: "-0.5px" }}>
          Contenido & evolución
        </h1>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", borderBottom: "0.5px solid #111" }}>
        {tabs.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "12px 24px",
                background: "transparent",
                border: "none",
                borderBottom: `1.5px solid ${active ? "#22c55e" : "transparent"}`,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
                transition: "all 0.15s",
                marginBottom: "-0.5px",
              }}
            >
              <span style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: active ? 500 : 400, color: active ? "#f5f5f5" : "#555", transition: "color 0.15s" }}>
                {t.label}
              </span>
              <span style={{ fontSize: "9px", fontFamily: "sans-serif", color: active ? "#4ade80" : "#333", letterSpacing: "0.3px" }}>
                {t.desc}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === "contenido" && (
        <ContentTab clientId={clientId} selectedMonth={selectedMonth} />
      )}
      {tab === "evolucion" && (
        <EvolucionTab clientId={clientId} />
      )}
      {tab === "comparar" && (
        <ComparativaTab clientId={clientId} />
      )}

    </div>
  )
}

export default function VisibilityPage() {
  return (
    <DashboardLayout>
      <VisibilityContent />
    </DashboardLayout>
  )
}
