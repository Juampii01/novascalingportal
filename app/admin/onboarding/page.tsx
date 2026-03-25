"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { SECTION_LABEL, CARD, CARD_P } from "@/lib/styles"

interface OnboardResult {
  clientId: string
  clientName: string
  webhookUrl: string
  setupInstructions: {
    webhookUrl: string
    clientId: string
    headers: Record<string, string>
    bodyFields: Record<string, string>
  }
}

const INPUT: React.CSSProperties = {
  background: "#0a0a0a",
  border: "0.5px solid #1a1a1a",
  borderRadius: "8px",
  padding: "11px 14px",
  color: "#f5f5f5",
  fontSize: "13px",
  fontFamily: "sans-serif",
  fontWeight: 300,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  hint?: string
  required?: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "9px", fontFamily: "sans-serif", color: focused ? "#4ade80" : "#555", letterSpacing: "1.5px", textTransform: "uppercase", transition: "color 0.15s" }}>
        {label}{required && <span style={{ color: "#ef4444", marginLeft: "3px" }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...INPUT, borderColor: focused ? "rgba(34,197,94,0.3)" : "#1a1a1a" }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {hint && <p style={{ fontSize: "10px", fontFamily: "sans-serif", color: "#333", letterSpacing: "0.2px" }}>{hint}</p>}
    </div>
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      style={{
        background: copied ? "rgba(34,197,94,0.1)" : "transparent",
        border: `0.5px solid ${copied ? "rgba(34,197,94,0.3)" : "#222"}`,
        borderRadius: "6px",
        padding: "5px 12px",
        color: copied ? "#22c55e" : "#555",
        fontSize: "9px",
        fontFamily: "sans-serif",
        letterSpacing: "1px",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "all 0.15s",
        flexShrink: 0,
      }}
    >
      {copied ? "Copiado ✓" : "Copiar"}
    </button>
  )
}

function CodeBlock({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: "9px", fontFamily: "sans-serif", color: "#444", letterSpacing: "1.5px", textTransform: "uppercase" }}>{label}</p>
        <CopyButton value={value} />
      </div>
      <div style={{ background: "#050505", border: "0.5px solid #111", borderRadius: "8px", padding: "12px 14px", overflowX: "auto" }}>
        <code style={{ fontSize: "11px", fontFamily: "monospace", color: "#9ca3af", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
          {value}
        </code>
      </div>
    </div>
  )
}

function OnboardingContent() {
  const [form, setForm] = useState({
    clientName: "",
    expertName: "",
    businessName: "",
    niche: "",
    offerDescription: "",
    aov: "",
    revenueSharePct: "20",
    email: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<OnboardResult | null>(null)

  const set = (field: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [field]: v }))

  const submit = async () => {
    if (!form.clientName.trim()) { setError("El nombre del cliente es requerido."); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Error al crear el cliente."); return }
      setResult(json)
    } catch {
      setError("No se pudo conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setResult(null)
    setError(null)
    setForm({ clientName: "", expertName: "", businessName: "", niche: "", offerDescription: "", aov: "", revenueSharePct: "20", email: "" })
  }

  const webhookBodyExample = result
    ? JSON.stringify({
        client_id: result.clientId,
        subscriber_id: "{{subscriber id}}",
        subscriber_name: "{{full name}}",
        tags: "{{tags}}",
      }, null, 2)
    : ""

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "40px", maxWidth: "680px" }}>

      {/* Header */}
      <div>
        <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", textTransform: "uppercase", marginBottom: "10px" }}>
          Admin · Nuevo cliente
        </p>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#f5f5f5", letterSpacing: "-0.5px", marginBottom: "8px" }}>
          Onboarding automatizado
        </h1>
        <p style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#555", lineHeight: 1.6 }}>
          Completá el formulario y el sistema genera el perfil del cliente, el UUID, y las instrucciones de ManyChat pre-configuradas.
        </p>
      </div>

      {result ? (
        /* ── SUCCESS STATE ── */
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

          {/* Success badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 18px", background: "rgba(34,197,94,0.05)", border: "0.5px solid rgba(34,197,94,0.15)", borderRadius: "10px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,0.5)", flexShrink: 0 }} />
            <p style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 400, color: "#22c55e" }}>
              Cliente <strong>{result.clientName}</strong> creado correctamente.
            </p>
          </div>

          {/* Client ID */}
          <div>
            <p style={SECTION_LABEL}>Identificador del cliente</p>
            <div style={{ ...CARD, padding: "18px 20px" }}>
              <CodeBlock label="client_id" value={result.clientId} />
            </div>
          </div>

          {/* ManyChat setup */}
          <div>
            <p style={SECTION_LABEL}>Configuración ManyChat · Webhook</p>
            <div style={{ ...CARD, display: "flex", flexDirection: "column", gap: "20px", padding: "20px" }}>

              <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#888", lineHeight: 1.7 }}>
                En ManyChat andá a <span style={{ color: "#f5f5f5" }}>Settings → Integrations → Webhooks</span> y creá un nuevo webhook con estos datos:
              </p>

              <CodeBlock label="URL del webhook" value={result.webhookUrl} />

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <p style={{ fontSize: "9px", fontFamily: "sans-serif", color: "#444", letterSpacing: "1.5px", textTransform: "uppercase" }}>Método</p>
                <p style={{ fontSize: "12px", fontFamily: "sans-serif", color: "#f5f5f5" }}>POST</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <p style={{ fontSize: "9px", fontFamily: "sans-serif", color: "#444", letterSpacing: "1.5px", textTransform: "uppercase" }}>Header requerido</p>
                <p style={{ fontSize: "12px", fontFamily: "sans-serif", color: "#f5f5f5" }}>Content-Type: application/json</p>
              </div>

              <CodeBlock
                label="Body del webhook (JSON)"
                value={webhookBodyExample}
              />

              <div style={{ background: "rgba(245,158,11,0.04)", border: "0.5px solid rgba(245,158,11,0.12)", borderRadius: "8px", padding: "14px" }}>
                <p style={{ fontSize: "11px", fontFamily: "sans-serif", color: "#d97706", lineHeight: 1.7 }}>
                  El campo <code style={{ background: "rgba(245,158,11,0.08)", padding: "1px 6px", borderRadius: "4px" }}>client_id</code> ya está pre-llenado con el UUID de este cliente.
                  Los campos entre <code style={{ background: "rgba(245,158,11,0.08)", padding: "1px 6px", borderRadius: "4px" }}>{"{{ }}"}</code> son variables dinámicas de ManyChat — reemplazalos con los campos correspondientes en el builder de ManyChat.
                </p>
              </div>
            </div>
          </div>

          {/* Next steps */}
          <div>
            <p style={SECTION_LABEL}>Próximos pasos</p>
            <div style={{ ...CARD, padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { n: "01", text: "Configurar el webhook en ManyChat con los datos de arriba." },
                { n: "02", text: "Pedir al cliente que se registre con su email en el dashboard." },
                { n: "03", text: "Una vez registrado, vincular su auth.uid() con el client_id generado (si usaron email distinto)." },
                { n: "04", text: "Cargar el primer mes desde Overview → + Cargar mes para activar el Health Score." },
                { n: "05", text: "Habilitar Replication en Supabase para sales_pipeline y manychat_pipeline (alertas en tiempo real)." },
              ].map((step) => (
                <div key={step.n} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <p style={{ fontFamily: "Georgia, serif", fontSize: "11px", color: "#333", flexShrink: 0, minWidth: "20px" }}>{step.n}</p>
                  <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#888", lineHeight: 1.6 }}>{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={reset}
            style={{
              alignSelf: "flex-start",
              background: "transparent",
              border: "0.5px solid #222",
              borderRadius: "8px",
              padding: "10px 20px",
              color: "#555",
              fontSize: "12px",
              fontFamily: "sans-serif",
              fontWeight: 300,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#444"; (e.currentTarget as HTMLButtonElement).style.color = "#888" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#222"; (e.currentTarget as HTMLButtonElement).style.color = "#555" }}
          >
            Onboardear otro cliente
          </button>
        </div>
      ) : (
        /* ── FORM STATE ── */
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

          <div>
            <p style={SECTION_LABEL}>Datos del cliente</p>
            <div style={{ ...CARD, display: "flex", flexDirection: "column", gap: "20px", padding: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <Field label="Nombre del cliente" value={form.clientName} onChange={set("clientName")} placeholder="Ej: Juan García" required />
                <Field label="Nombre del experto" value={form.expertName} onChange={set("expertName")} placeholder="Ej: Juan García" />
              </div>
              <Field label="Nombre del negocio" value={form.businessName} onChange={set("businessName")} placeholder="Ej: Coach de Negocios JG" />
              <Field label="Email (opcional)" value={form.email} onChange={set("email")} placeholder="juan@ejemplo.com" type="email" hint="Si el cliente ya tiene una cuenta, este email vincula el perfil con su usuario." />
            </div>
          </div>

          <div>
            <p style={SECTION_LABEL}>Contexto del negocio</p>
            <div style={{ ...CARD, display: "flex", flexDirection: "column", gap: "20px", padding: "24px" }}>
              <Field label="Nicho" value={form.niche} onChange={set("niche")} placeholder="Ej: Coaches de vida que quieren escalar a $10k/mes" />
              <Field label="Descripción de la oferta" value={form.offerDescription} onChange={set("offerDescription")} placeholder="Ej: Mentoring 1:1 de 3 meses para coaches que quieren sistematizar su captación" />
            </div>
          </div>

          <div>
            <p style={SECTION_LABEL}>Parámetros comerciales</p>
            <div style={{ ...CARD, display: "flex", flexDirection: "column", gap: "20px", padding: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <Field label="Ticket promedio (AOV)" value={form.aov} onChange={set("aov")} placeholder="Ej: 2500" type="number" />
                <Field label="Revenue share NOVA (%)" value={form.revenueSharePct} onChange={set("revenueSharePct")} placeholder="20" type="number" hint="Default: 20%" />
              </div>
            </div>
          </div>

          {error && (
            <div style={{ padding: "14px 16px", background: "rgba(239,68,68,0.05)", border: "0.5px solid rgba(239,68,68,0.15)", borderRadius: "8px" }}>
              <p style={{ fontSize: "12px", fontFamily: "sans-serif", color: "#f87171" }}>{error}</p>
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading || !form.clientName.trim()}
            style={{
              alignSelf: "flex-start",
              background: !loading && form.clientName.trim() ? "#22c55e" : "#111",
              border: "none",
              borderRadius: "8px",
              padding: "13px 28px",
              color: !loading && form.clientName.trim() ? "#000" : "#333",
              fontSize: "13px",
              fontFamily: "sans-serif",
              fontWeight: 500,
              cursor: !loading && form.clientName.trim() ? "pointer" : "not-allowed",
              transition: "all 0.15s",
              letterSpacing: "0.2px",
            }}
          >
            {loading ? "Creando cliente…" : "Crear cliente y generar instrucciones →"}
          </button>
        </div>
      )}
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <DashboardLayout>
      <OnboardingContent />
    </DashboardLayout>
  )
}
