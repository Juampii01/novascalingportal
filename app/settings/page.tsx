"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { createClient } from "@/lib/supabaseClient"
import { SECTION_LABEL, CARD } from "@/lib/styles"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const LABEL: React.CSSProperties = {
  fontSize: "11px",
  fontFamily: "sans-serif",
  fontWeight: 400,
  letterSpacing: "1px",
  textTransform: "uppercase",
  color: "#777",
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

const INPUT_DISABLED: React.CSSProperties = {
  ...INPUT,
  color: "#555",
  cursor: "not-allowed",
}

const DIVIDER: React.CSSProperties = {
  height: "0.5px",
  background: "#111",
  marginBottom: "32px",
}

const BTN_PRIMARY: React.CSSProperties = {
  padding: "11px 24px",
  borderRadius: "8px",
  background: "#22c55e",
  border: "none",
  color: "#000",
  fontSize: "11px",
  fontFamily: "sans-serif",
  fontWeight: 500,
  letterSpacing: "3px",
  textTransform: "uppercase",
  cursor: "pointer",
}

const BTN_DANGER: React.CSSProperties = {
  padding: "11px 24px",
  borderRadius: "8px",
  background: "transparent",
  border: "0.5px solid #3a1a1a",
  color: "#f87171",
  fontSize: "11px",
  fontFamily: "sans-serif",
  fontWeight: 500,
  letterSpacing: "3px",
  textTransform: "uppercase",
  cursor: "pointer",
}

const BTN_GHOST: React.CSSProperties = {
  padding: "11px 24px",
  borderRadius: "8px",
  background: "transparent",
  border: "0.5px solid #1a1a1a",
  color: "#888",
  fontSize: "11px",
  fontFamily: "sans-serif",
  fontWeight: 400,
  letterSpacing: "2px",
  textTransform: "uppercase",
  cursor: "pointer",
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        width: "40px",
        height: "22px",
        borderRadius: "9999px",
        background: on ? "rgba(34,197,94,0.15)" : "#111",
        border: on ? "0.5px solid rgba(34,197,94,0.3)" : "0.5px solid #222",
        position: "relative",
        cursor: "pointer",
        transition: "all 0.2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "3px",
          left: on ? "20px" : "3px",
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          background: on ? "#22c55e" : "#333",
          transition: "left 0.2s, background 0.2s",
        }}
      />
    </button>
  )
}

// ─── Feedback line ────────────────────────────────────────────────────────────

function Feedback({ ok, error }: { ok: boolean; error: string | null }) {
  if (ok)
    return (
      <p style={{ fontSize: "10px", color: "#22c55e", fontFamily: "sans-serif", fontWeight: 300, letterSpacing: "2px" }}>
        Guardado correctamente
      </p>
    )
  if (error)
    return (
      <p style={{ fontSize: "10px", color: "#f87171", fontFamily: "sans-serif", fontWeight: 300 }}>
        {error}
      </p>
    )
  return null
}

// ─── Preferencias guardadas en localStorage ───────────────────────────────────

interface Prefs {
  currency: "MXN" | "USD"
  defaultGoal: string
  emailAlerts: boolean
  weeklyDigest: boolean
}

const DEFAULT_PREFS: Prefs = {
  currency: "MXN",
  defaultGoal: "",
  emailAlerts: true,
  weeklyDigest: false,
}

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS
  try {
    const raw = localStorage.getItem("nova_settings_prefs")
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) }
  } catch {}
  return DEFAULT_PREFS
}

// ─── Contenido de la página ────────────────────────────────────────────────────

function SettingsContent() {
  const router = useRouter()
  const supabase = createClient()

  // Cuenta
  const [email, setEmail] = useState("")
  const [currentPwd, setCurrentPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [pwdOk, setPwdOk] = useState(false)
  const [pwdError, setPwdError] = useState<string | null>(null)
  const [pwdLoading, setPwdLoading] = useState(false)

  // Preferencias
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS)
  const [prefsOk, setPrefsOk] = useState(false)

  // Sesión
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setEmail(data.user.email)
    })
    setPrefs(loadPrefs())
  }, [])

  const updatePref = <K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    setPrefs((prev) => ({ ...prev, [key]: value }))
  }

  const savePrefs = () => {
    localStorage.setItem("nova_settings_prefs", JSON.stringify(prefs))
    setPrefsOk(true)
    setTimeout(() => setPrefsOk(false), 2500)
  }

  const changePassword = async () => {
    setPwdError(null)
    setPwdOk(false)
    if (!newPwd) return setPwdError("Ingresá la nueva contraseña.")
    if (newPwd.length < 8) return setPwdError("La contraseña debe tener al menos 8 caracteres.")
    if (newPwd !== confirmPwd) return setPwdError("Las contraseñas no coinciden.")
    setPwdLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd })
      if (error) throw error
      setPwdOk(true)
      setCurrentPwd("")
      setNewPwd("")
      setConfirmPwd("")
      setTimeout(() => setPwdOk(false), 2500)
    } catch (e: any) {
      setPwdError(e?.message ?? "Error al cambiar contraseña.")
    } finally {
      setPwdLoading(false)
    }
  }

  const signOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.replace("/login")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>

      {/* Header */}
      <div>
        <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", marginBottom: "10px", textTransform: "uppercase" }}>
          Configuración
        </p>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#f5f5f5", letterSpacing: "1px" }}>
          Ajustes
        </h1>
      </div>

      {/* ── Cuenta ── */}
      <div>
        <p style={SECTION_LABEL}>Cuenta</p>
        <div style={{ ...CARD, padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Email (solo lectura) */}
          <div>
            <p style={LABEL}>Correo electrónico</p>
            <input
              type="email"
              value={email}
              disabled
              style={INPUT_DISABLED}
            />
            <p style={{ marginTop: "6px", fontSize: "11px", fontFamily: "sans-serif", color: "#444", fontWeight: 300 }}>
              Para cambiar el correo contactá al equipo NOVA.
            </p>
          </div>

          <div style={{ height: "0.5px", background: "#111" }} />

          {/* Cambiar contraseña */}
          <div>
            <p style={{ ...LABEL, marginBottom: "16px" }}>Cambiar contraseña</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <p style={LABEL}>Nueva contraseña</p>
                <input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  style={INPUT}
                />
              </div>
              <div>
                <p style={LABEL}>Confirmar nueva contraseña</p>
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="Repetí la contraseña"
                  style={INPUT}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button onClick={changePassword} disabled={pwdLoading} style={{ ...BTN_PRIMARY, opacity: pwdLoading ? 0.6 : 1 }}>
              {pwdLoading ? "Actualizando..." : "Actualizar contraseña"}
            </button>
            <Feedback ok={pwdOk} error={pwdError} />
          </div>
        </div>
      </div>

      {/* ── Preferencias ── */}
      <div>
        <div style={DIVIDER} />
        <p style={SECTION_LABEL}>Preferencias</p>
        <div style={{ ...CARD, padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Moneda */}
          <div>
            <p style={LABEL}>Moneda de referencia</p>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["MXN", "USD"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => updatePref("currency", c)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontFamily: "Georgia, serif",
                    fontWeight: 400,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: prefs.currency === c ? "rgba(34,197,94,0.08)" : "#080808",
                    border: prefs.currency === c ? "0.5px solid rgba(34,197,94,0.3)" : "0.5px solid #111",
                    color: prefs.currency === c ? "#22c55e" : "#555",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Meta mensual */}
          <div>
            <p style={LABEL}>Meta mensual por defecto ({prefs.currency})</p>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#555", fontSize: "13px" }}>
                {prefs.currency === "MXN" ? "$" : "USD"}
              </span>
              <input
                type="number"
                value={prefs.defaultGoal}
                onChange={(e) => updatePref("defaultGoal", e.target.value)}
                placeholder="0"
                style={{ ...INPUT, paddingLeft: prefs.currency === "MXN" ? "26px" : "46px" }}
              />
            </div>
            <p style={{ marginTop: "6px", fontSize: "11px", fontFamily: "sans-serif", color: "#444", fontWeight: 300 }}>
              Se usa como base en proyecciones cuando no hay meta configurada.
            </p>
          </div>

          <div style={{ height: "0.5px", background: "#111" }} />

          {/* Notificaciones */}
          <div>
            <p style={{ ...LABEL, marginBottom: "16px" }}>Notificaciones</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                { key: "emailAlerts" as const, label: "Alertas por correo", desc: "Recibí alertas automáticas cuando un KPI sale del rango normal." },
                { key: "weeklyDigest" as const, label: "Resumen semanal", desc: "Un correo cada lunes con el estado general del sistema." },
              ].map(({ key, label, desc }) => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                  <div>
                    <p style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 400, color: "#d4d4d4", marginBottom: "4px" }}>
                      {label}
                    </p>
                    <p style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#555" }}>
                      {desc}
                    </p>
                  </div>
                  <Toggle on={prefs[key] as boolean} onChange={(v) => updatePref(key, v)} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button onClick={savePrefs} style={BTN_PRIMARY}>
              Guardar preferencias
            </button>
            <Feedback ok={prefsOk} error={null} />
          </div>
        </div>
      </div>

      {/* ── Sesión ── */}
      <div>
        <div style={DIVIDER} />
        <p style={SECTION_LABEL}>Sesión</p>
        <div style={{ ...CARD, padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 400, color: "#d4d4d4", marginBottom: "4px" }}>
                Cerrar sesión
              </p>
              <p style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#555" }}>
                Salís del dashboard en este dispositivo.
              </p>
            </div>
            <button
              onClick={signOut}
              disabled={signingOut}
              style={{ ...BTN_DANGER, opacity: signingOut ? 0.6 : 1, whiteSpace: "nowrap" }}
            >
              {signingOut ? "Saliendo..." : "Cerrar sesión"}
            </button>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div style={{ height: "40px" }} />
    </div>
  )
}

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsContent />
    </DashboardLayout>
  )
}
