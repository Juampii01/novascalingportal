"use client"

import { useState, useMemo } from "react"
import { DashboardLayout, useActiveClient } from "@/components/dashboard-layout"
import { DataModal, Field, INPUT, FormSection } from "@/components/data-modal"
import { useEODSetter, type EODSetterEntry } from "@/hooks/useEODSetter"
import { useEODCloser, type EODCloserEntry } from "@/hooks/useEODCloser"
import { SECTION_LABEL, CARD_P, TH, TD, COLOR } from "@/lib/styles"

const todayStr = new Date().toISOString().slice(0, 10)

function fmt(n: number) {
  return n.toLocaleString("es-AR")
}

function convRate(a: number, b: number) {
  if (!b) return "—"
  return (a / b * 100).toFixed(0) + "%"
}

function barStyle(val: number, max: number, color: string) {
  const pct = max > 0 ? Math.min((val / max) * 100, 100) : 0
  return {
    display: "inline-block",
    width: `${pct}%`,
    minWidth: pct > 0 ? "2px" : "0",
    height: "2px",
    background: color,
    borderRadius: "1px",
    verticalAlign: "middle",
    marginLeft: "8px",
    transition: "width 0.4s ease",
  }
}

// ── Setter Tab ────────────────────────────────────────────────────────────────

const EMPTY_SETTER = {
  date: todayStr,
  aperturas: "",
  respuestas: "",
  calificados: "",
  agendados: "",
  notas: "",
}

function SetterTab({ clientId }: { clientId: string | null }) {
  const { entries, loading, save } = useEODSetter(clientId)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<typeof EMPTY_SETTER>(EMPTY_SETTER)

  const openModal = (entry?: EODSetterEntry) => {
    if (entry) {
      setForm({
        date: entry.date,
        aperturas: String(entry.aperturas),
        respuestas: String(entry.respuestas),
        calificados: String(entry.calificados),
        agendados: String(entry.agendados),
        notas: entry.notas,
      })
    } else {
      setForm({ ...EMPTY_SETTER, date: todayStr })
    }
    setError(null)
    setModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const n = (v: string) => parseInt(v) || 0
    const { error: err } = await save({
      date: form.date,
      aperturas: n(form.aperturas),
      respuestas: n(form.respuestas),
      calificados: n(form.calificados),
      agendados: n(form.agendados),
      notas: form.notas,
    })
    setSaving(false)
    if (err) { setError((err as any).message ?? "Error al guardar"); return }
    setModal(false)
  }

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  // Totals this month
  const now = new Date()
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const thisMonth = entries.filter((e) => e.date.startsWith(monthStr))
  const totals = thisMonth.reduce(
    (acc, e) => ({
      aperturas: acc.aperturas + e.aperturas,
      respuestas: acc.respuestas + e.respuestas,
      calificados: acc.calificados + e.calificados,
      agendados: acc.agendados + e.agendados,
    }),
    { aperturas: 0, respuestas: 0, calificados: 0, agendados: 0 }
  )

  const maxAperturas = Math.max(...entries.map((e) => e.aperturas), 1)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={SECTION_LABEL}>Setter · EOD Diario</p>
          <p style={{ fontSize: "13px", color: "#555", fontFamily: "sans-serif", marginTop: "4px" }}>
            Aperturas, respuestas, calificados y agendados por día
          </p>
        </div>
        <button
          onClick={() => openModal()}
          style={{
            background: "#22c55e", color: "#000", border: "none", borderRadius: "8px",
            padding: "10px 20px", fontSize: "13px", fontFamily: "sans-serif",
            fontWeight: 500, cursor: "pointer", letterSpacing: "0.2px",
          }}
        >
          + Registrar hoy
        </button>
      </div>

      {/* Monthly totals */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { label: "Aperturas", value: totals.aperturas, color: "#60a5fa" },
          { label: "Respuestas", value: totals.respuestas, rate: convRate(totals.respuestas, totals.aperturas), color: "#a78bfa" },
          { label: "Calificados", value: totals.calificados, rate: convRate(totals.calificados, totals.respuestas), color: "#f59e0b" },
          { label: "Agendados", value: totals.agendados, rate: convRate(totals.agendados, totals.calificados), color: "#22c55e" },
        ].map((m) => (
          <div key={m.label} style={{ ...CARD_P, padding: "20px 24px" }}>
            <p style={{ fontSize: "9px", color: "#555", fontFamily: "sans-serif", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>
              {m.label}
            </p>
            <p style={{ fontFamily: "Georgia, serif", fontSize: "28px", fontWeight: 400, color: "#f5f5f5" }}>
              {fmt(m.value)}
            </p>
            {m.rate && (
              <p style={{ fontSize: "11px", color: m.color, fontFamily: "sans-serif", marginTop: "4px" }}>
                {m.rate} conversión
              </p>
            )}
            <div style={{ marginTop: "10px", height: "2px", background: "#111", borderRadius: "1px" }}>
              <div style={{ height: "2px", background: m.color, borderRadius: "1px", width: `${totals.aperturas > 0 ? Math.min((m.value / totals.aperturas) * 100, 100) : 0}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={CARD_P}>
        <p style={{ ...SECTION_LABEL, marginBottom: "20px" }}>Historial</p>
        {loading ? (
          <p style={{ color: "#555", fontSize: "13px", fontFamily: "sans-serif" }}>Cargando...</p>
        ) : entries.length === 0 ? (
          <p style={{ color: "#555", fontSize: "13px", fontFamily: "sans-serif" }}>Sin registros aún. Empezá hoy.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Fecha", "Aperturas", "Respuestas", "Conv.", "Calificados", "Conv.", "Agendados", "Conv.", ""].map((h, i) => (
                  <th key={i} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => openModal(e)}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(ev) => (ev.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
                >
                  <td style={{ ...TD, color: e.date === todayStr ? "#22c55e" : "#888" }}>
                    {e.date === todayStr ? "Hoy" : e.date}
                  </td>
                  <td style={TD}>
                    <span style={{ color: "#f5f5f5" }}>{e.aperturas}</span>
                    <span style={barStyle(e.aperturas, maxAperturas, "#60a5fa")} />
                  </td>
                  <td style={TD}>{e.respuestas}</td>
                  <td style={{ ...TD, color: "#a78bfa" }}>{convRate(e.respuestas, e.aperturas)}</td>
                  <td style={TD}>{e.calificados}</td>
                  <td style={{ ...TD, color: "#f59e0b" }}>{convRate(e.calificados, e.respuestas)}</td>
                  <td style={TD}>{e.agendados}</td>
                  <td style={{ ...TD, color: "#22c55e" }}>{convRate(e.agendados, e.calificados)}</td>
                  <td style={{ ...TD, color: "#333", fontSize: "11px" }}>editar</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <DataModal
        open={modal}
        onClose={() => setModal(false)}
        title="EOD Setter"
        subtitle={form.date === todayStr ? "Registro de hoy" : `Editando ${form.date}`}
        onSubmit={handleSave}
        submitLabel="Guardar"
        loading={saving}
      >
        <FormSection label="Fecha">
          <Field label="Fecha">
            <input type="date" value={form.date} onChange={f("date")} style={INPUT} />
          </Field>
        </FormSection>

        <FormSection label="Métricas del día">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Aperturas enviadas">
              <input type="number" value={form.aperturas} onChange={f("aperturas")} style={INPUT} placeholder="0" min="0" />
            </Field>
            <Field label="Respuestas recibidas">
              <input type="number" value={form.respuestas} onChange={f("respuestas")} style={INPUT} placeholder="0" min="0" />
            </Field>
            <Field label="Calificados">
              <input type="number" value={form.calificados} onChange={f("calificados")} style={INPUT} placeholder="0" min="0" />
            </Field>
            <Field label="Agendados">
              <input type="number" value={form.agendados} onChange={f("agendados")} style={INPUT} placeholder="0" min="0" />
            </Field>
          </div>
        </FormSection>

        <FormSection label="Notas">
          <Field label="Notas opcionales">
            <textarea
              value={form.notas}
              onChange={f("notas")}
              style={{ ...INPUT, minHeight: "72px", resize: "vertical" }}
              placeholder="Algo que destacar del día..."
            />
          </Field>
        </FormSection>

        {error && <p style={{ color: "#ef4444", fontSize: "12px", fontFamily: "sans-serif" }}>{error}</p>}
      </DataModal>
    </div>
  )
}

// ── Closer Tab ────────────────────────────────────────────────────────────────

const EMPTY_CLOSER = {
  date: todayStr,
  llamadasAgendadas: "",
  llamadasAsistidas: "",
  cerrados: "",
  monto: "",
  notas: "",
}

function CloserTab({ clientId }: { clientId: string | null }) {
  const { entries, loading, save } = useEODCloser(clientId)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<typeof EMPTY_CLOSER>(EMPTY_CLOSER)

  const openModal = (entry?: EODCloserEntry) => {
    if (entry) {
      setForm({
        date: entry.date,
        llamadasAgendadas: String(entry.llamadasAgendadas),
        llamadasAsistidas: String(entry.llamadasAsistidas),
        cerrados: String(entry.cerrados),
        monto: String(entry.monto),
        notas: entry.notas,
      })
    } else {
      setForm({ ...EMPTY_CLOSER, date: todayStr })
    }
    setError(null)
    setModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const n = (v: string) => parseFloat(v) || 0
    const { error: err } = await save({
      date: form.date,
      llamadasAgendadas: Math.round(n(form.llamadasAgendadas)),
      llamadasAsistidas: Math.round(n(form.llamadasAsistidas)),
      cerrados: Math.round(n(form.cerrados)),
      monto: n(form.monto),
      notas: form.notas,
    })
    setSaving(false)
    if (err) { setError((err as any).message ?? "Error al guardar"); return }
    setModal(false)
  }

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  const now = new Date()
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const thisMonth = entries.filter((e) => e.date.startsWith(monthStr))
  const totals = thisMonth.reduce(
    (acc, e) => ({
      agendadas: acc.agendadas + e.llamadasAgendadas,
      asistidas: acc.asistidas + e.llamadasAsistidas,
      cerrados: acc.cerrados + e.cerrados,
      monto: acc.monto + e.monto,
    }),
    { agendadas: 0, asistidas: 0, cerrados: 0, monto: 0 }
  )

  const maxMonto = Math.max(...entries.map((e) => e.monto), 1)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={SECTION_LABEL}>Closer · EOD Diario</p>
          <p style={{ fontSize: "13px", color: "#555", fontFamily: "sans-serif", marginTop: "4px" }}>
            Llamadas, cierres y revenue por día
          </p>
        </div>
        <button
          onClick={() => openModal()}
          style={{
            background: "#22c55e", color: "#000", border: "none", borderRadius: "8px",
            padding: "10px 20px", fontSize: "13px", fontFamily: "sans-serif",
            fontWeight: 500, cursor: "pointer",
          }}
        >
          + Registrar hoy
        </button>
      </div>

      {/* Monthly totals */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { label: "Llamadas agendadas", value: fmt(totals.agendadas), color: "#60a5fa", raw: totals.agendadas },
          { label: "Asistencia", value: fmt(totals.asistidas), rate: convRate(totals.asistidas, totals.agendadas), color: "#f59e0b", raw: totals.asistidas },
          { label: "Cierres", value: fmt(totals.cerrados), rate: convRate(totals.cerrados, totals.asistidas), color: "#4ade80", raw: totals.cerrados },
          { label: "Revenue", value: `$${fmt(totals.monto)}`, color: "#22c55e", raw: totals.monto },
        ].map((m) => (
          <div key={m.label} style={{ ...CARD_P, padding: "20px 24px" }}>
            <p style={{ fontSize: "9px", color: "#555", fontFamily: "sans-serif", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>
              {m.label}
            </p>
            <p style={{ fontFamily: "Georgia, serif", fontSize: m.label === "Revenue" ? "22px" : "28px", fontWeight: 400, color: "#f5f5f5" }}>
              {m.value}
            </p>
            {m.rate && (
              <p style={{ fontSize: "11px", color: m.color, fontFamily: "sans-serif", marginTop: "4px" }}>
                {m.rate} conversión
              </p>
            )}
            <div style={{ marginTop: "10px", height: "2px", background: "#111", borderRadius: "1px" }}>
              <div style={{ height: "2px", background: m.color, borderRadius: "1px", width: `${totals.agendadas > 0 ? Math.min((m.raw / Math.max(totals.agendadas, totals.monto / 1000)) * 100, 100) : 0}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={CARD_P}>
        <p style={{ ...SECTION_LABEL, marginBottom: "20px" }}>Historial</p>
        {loading ? (
          <p style={{ color: "#555", fontSize: "13px", fontFamily: "sans-serif" }}>Cargando...</p>
        ) : entries.length === 0 ? (
          <p style={{ color: "#555", fontSize: "13px", fontFamily: "sans-serif" }}>Sin registros aún. Empezá hoy.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Fecha", "Agendadas", "Asistidas", "Asist. %", "Cerrados", "Cierre %", "Revenue", ""].map((h, i) => (
                  <th key={i} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => openModal(e)}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(ev) => (ev.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
                >
                  <td style={{ ...TD, color: e.date === todayStr ? "#22c55e" : "#888" }}>
                    {e.date === todayStr ? "Hoy" : e.date}
                  </td>
                  <td style={TD}>{e.llamadasAgendadas}</td>
                  <td style={TD}>{e.llamadasAsistidas}</td>
                  <td style={{ ...TD, color: "#f59e0b" }}>{convRate(e.llamadasAsistidas, e.llamadasAgendadas)}</td>
                  <td style={TD}>{e.cerrados}</td>
                  <td style={{ ...TD, color: "#4ade80" }}>{convRate(e.cerrados, e.llamadasAsistidas)}</td>
                  <td style={{ ...TD, color: e.monto > 0 ? "#22c55e" : "#555" }}>
                    {e.monto > 0 ? `$${fmt(e.monto)}` : "—"}
                    {e.monto > 0 && <span style={barStyle(e.monto, maxMonto, "#22c55e")} />}
                  </td>
                  <td style={{ ...TD, color: "#333", fontSize: "11px" }}>editar</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <DataModal
        open={modal}
        onClose={() => setModal(false)}
        title="EOD Closer"
        subtitle={form.date === todayStr ? "Registro de hoy" : `Editando ${form.date}`}
        onSubmit={handleSave}
        submitLabel="Guardar"
        loading={saving}
      >
        <FormSection label="Fecha">
          <Field label="Fecha">
            <input type="date" value={form.date} onChange={f("date")} style={INPUT} />
          </Field>
        </FormSection>

        <FormSection label="Llamadas">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Llamadas agendadas">
              <input type="number" value={form.llamadasAgendadas} onChange={f("llamadasAgendadas")} style={INPUT} placeholder="0" min="0" />
            </Field>
            <Field label="Llamadas asistidas">
              <input type="number" value={form.llamadasAsistidas} onChange={f("llamadasAsistidas")} style={INPUT} placeholder="0" min="0" />
            </Field>
          </div>
        </FormSection>

        <FormSection label="Cierres">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Cerrados">
              <input type="number" value={form.cerrados} onChange={f("cerrados")} style={INPUT} placeholder="0" min="0" />
            </Field>
            <Field label="Revenue ($)">
              <input type="number" value={form.monto} onChange={f("monto")} style={INPUT} placeholder="0" min="0" />
            </Field>
          </div>
        </FormSection>

        <FormSection label="Notas">
          <Field label="Notas opcionales">
            <textarea
              value={form.notas}
              onChange={f("notas")}
              style={{ ...INPUT, minHeight: "72px", resize: "vertical" }}
              placeholder="Algo que destacar del día..."
            />
          </Field>
        </FormSection>

        {error && <p style={{ color: "#ef4444", fontSize: "12px", fontFamily: "sans-serif" }}>{error}</p>}
      </DataModal>
    </div>
  )
}

// ── Monthly Tracker Tab ───────────────────────────────────────────────────────

function MonthlyTrackerTab({ clientId }: { clientId: string | null }) {
  const { entries: setterEntries } = useEODSetter(clientId)
  const { entries: closerEntries } = useEODCloser(clientId)

  // Build last 3 months
  const months = useMemo(() => {
    const result = []
    const now = new Date()
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const label = d.toLocaleString("es-AR", { month: "long", year: "numeric" })

      const sEntries = setterEntries.filter((e) => e.date.startsWith(key))
      const cEntries = closerEntries.filter((e) => e.date.startsWith(key))

      const setter = sEntries.reduce(
        (a, e) => ({ aperturas: a.aperturas + e.aperturas, respuestas: a.respuestas + e.respuestas, calificados: a.calificados + e.calificados, agendados: a.agendados + e.agendados }),
        { aperturas: 0, respuestas: 0, calificados: 0, agendados: 0 }
      )
      const closer = cEntries.reduce(
        (a, e) => ({ agendadas: a.agendadas + e.llamadasAgendadas, asistidas: a.asistidas + e.llamadasAsistidas, cerrados: a.cerrados + e.cerrados, monto: a.monto + e.monto }),
        { agendadas: 0, asistidas: 0, cerrados: 0, monto: 0 }
      )

      result.push({ key, label, setter, closer, days: sEntries.length || cEntries.length, isCurrent: i === 0 })
    }
    return result
  }, [setterEntries, closerEntries])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <div>
        <p style={SECTION_LABEL}>Monthly Tracker</p>
        <p style={{ fontSize: "13px", color: "#555", fontFamily: "sans-serif", marginTop: "4px" }}>
          Resumen mensual consolidado desde los EODs diarios
        </p>
      </div>

      {months.map((m) => (
        <div key={m.key} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <p style={{
              fontSize: "13px", fontFamily: "sans-serif", fontWeight: 500,
              color: m.isCurrent ? "#f5f5f5" : "#666", textTransform: "capitalize",
            }}>
              {m.label}
            </p>
            {m.isCurrent && (
              <span style={{ fontSize: "9px", color: "#22c55e", fontFamily: "sans-serif", letterSpacing: "2px", textTransform: "uppercase", background: "rgba(34,197,94,0.08)", padding: "2px 8px", borderRadius: "20px" }}>
                Mes actual
              </span>
            )}
            <span style={{ fontSize: "11px", color: "#444", fontFamily: "sans-serif" }}>
              {m.days} días registrados
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {/* Setter block */}
            <div style={{ ...CARD_P, padding: "20px 24px" }}>
              <p style={{ fontSize: "9px", color: "#4ade80", fontFamily: "sans-serif", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "16px" }}>
                Setter
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { label: "Aperturas", value: m.setter.aperturas, color: "#60a5fa" },
                  { label: "Respuestas", value: m.setter.respuestas, rate: convRate(m.setter.respuestas, m.setter.aperturas), color: "#a78bfa" },
                  { label: "Calificados", value: m.setter.calificados, rate: convRate(m.setter.calificados, m.setter.respuestas), color: "#f59e0b" },
                  { label: "Agendados", value: m.setter.agendados, rate: convRate(m.setter.agendados, m.setter.calificados), color: "#22c55e" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p style={{ fontSize: "9px", color: "#555", fontFamily: "sans-serif", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" }}>
                      {stat.label}
                    </p>
                    <p style={{ fontFamily: "Georgia, serif", fontSize: "20px", color: "#f5f5f5" }}>
                      {fmt(stat.value)}
                    </p>
                    {stat.rate && (
                      <p style={{ fontSize: "10px", color: stat.color, fontFamily: "sans-serif", marginTop: "2px" }}>
                        {stat.rate}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Closer block */}
            <div style={{ ...CARD_P, padding: "20px 24px" }}>
              <p style={{ fontSize: "9px", color: "#4ade80", fontFamily: "sans-serif", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "16px" }}>
                Closer
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { label: "Llamadas agend.", value: fmt(m.closer.agendadas), color: "#60a5fa" },
                  { label: "Asistencia", value: fmt(m.closer.asistidas), rate: convRate(m.closer.asistidas, m.closer.agendadas), color: "#f59e0b" },
                  { label: "Cierres", value: fmt(m.closer.cerrados), rate: convRate(m.closer.cerrados, m.closer.asistidas), color: "#4ade80" },
                  { label: "Revenue", value: `$${fmt(m.closer.monto)}`, color: "#22c55e" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p style={{ fontSize: "9px", color: "#555", fontFamily: "sans-serif", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" }}>
                      {stat.label}
                    </p>
                    <p style={{ fontFamily: "Georgia, serif", fontSize: "20px", color: "#f5f5f5" }}>
                      {stat.value}
                    </p>
                    {stat.rate && (
                      <p style={{ fontSize: "10px", color: stat.color, fontFamily: "sans-serif", marginTop: "2px" }}>
                        {stat.rate}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS = ["Setter", "Closer", "Monthly Tracker"] as const
type Tab = (typeof TABS)[number]

export default function EODPage() {
  const clientId = useActiveClient()
  const [tab, setTab] = useState<Tab>("Setter")

  return (
    <DashboardLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: "0", borderBottom: "0.5px solid #111" }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "12px 20px",
                fontSize: "13px", fontFamily: "sans-serif", fontWeight: tab === t ? 500 : 400,
                color: tab === t ? "#f5f5f5" : "#555",
                borderBottom: tab === t ? "1.5px solid #22c55e" : "1.5px solid transparent",
                marginBottom: "-0.5px",
                transition: "all 0.15s ease",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Setter" && <SetterTab clientId={clientId} />}
        {tab === "Closer" && <CloserTab clientId={clientId} />}
        {tab === "Monthly Tracker" && <MonthlyTrackerTab clientId={clientId} />}
      </div>
    </DashboardLayout>
  )
}
