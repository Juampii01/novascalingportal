"use client"

import { DashboardLayout, useActiveClient } from "@/components/dashboard-layout"
import { createClient } from "@/lib/supabaseClient"
import { SECTION_LABEL, CARD } from "@/lib/styles"
import { useEffect, useState } from "react"

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "11px",
  fontFamily: "sans-serif",
  fontWeight: 400,
  letterSpacing: "1px",
  textTransform: "uppercase",
  color: "#777",
  marginBottom: "8px",
}

const INPUT_STYLE: React.CSSProperties = {
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
  transition: "border-color 0.2s",
}

interface ProfileData {
  businessName: string
  expertName: string
  niche: string
  offerDescription: string
  instagramUrl: string
  aov: string
  revenueSharePct: number
  startDate: string
  winningAngles: string[]
  mainPains: string[]
  notes: string
  manychatApiKey: string
  manychatBotId: string
  metaAdAccountId: string
  metaAccessToken: string
}

const DEFAULT_PROFILE: ProfileData = {
  businessName: "",
  expertName: "",
  niche: "",
  offerDescription: "",
  instagramUrl: "",
  aov: "",
  revenueSharePct: 30,
  startDate: "",
  winningAngles: [],
  mainPains: [],
  notes: "",
  manychatApiKey: "",
  manychatBotId: "",
  metaAdAccountId: "",
  metaAccessToken: "",
}

function TagList({
  tags,
  onAdd,
  onRemove,
  placeholder,
}: {
  tags: string[]
  onAdd: (tag: string) => void
  onRemove: (i: number) => void
  placeholder: string
}) {
  const [input, setInput] = useState("")

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      onAdd(input.trim())
      setInput("")
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {tags.map((tag, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "9999px",
              background: "rgba(34,197,94,0.06)",
              border: "0.5px solid rgba(34,197,94,0.2)",
              fontSize: "11px",
              fontFamily: "sans-serif",
              fontWeight: 300,
              color: "#9ca3af",
            }}
          >
            {tag}
            <button
              onClick={() => onRemove(i)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#333",
                fontSize: "12px",
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`${placeholder} (Enter para agregar)`}
        style={INPUT_STYLE}
      />
    </div>
  )
}

function ProfileContent() {
  const clientId = useActiveClient()
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Load from Supabase, fallback to localStorage
  useEffect(() => {
    async function load() {
      // Try Supabase first
      if (clientId) {
        try {
          const supabase = createClient()
          const { data: row } = await supabase
            .from("nova_client_profile")
            .select("*")
            .eq("client_id", clientId)
            .maybeSingle()

          if (row) {
            setProfile({
              businessName: row.business_name ?? "",
              expertName: row.expert_name ?? "",
              niche: row.niche ?? row.industry ?? "",
              offerDescription: row.offer_description ?? row.offer_name ?? "",
              instagramUrl: row.instagram_url ?? "",
              aov: row.aov ? String(row.aov) : "",
              revenueSharePct: Number(row.revenue_share_pct ?? 30),
              startDate: row.start_date ?? row.program_start_date ?? "",
              winningAngles: Array.isArray(row.winning_angles) ? row.winning_angles : [],
              mainPains: Array.isArray(row.main_pains) ? row.main_pains : [],
              notes: row.notes ?? "",
              manychatApiKey: row.manychat_api_key ?? "",
              manychatBotId: row.manychat_bot_id ?? row.manychatBotId ?? "",
              metaAdAccountId: row.meta_ad_account_id ?? "",
              metaAccessToken: row.meta_access_token ?? "",
            })
            return
          }
        } catch {}
      }

      // Fallback to localStorage
      const stored = localStorage.getItem("nova_client_profile")
      if (stored) {
        try { setProfile(JSON.parse(stored)) } catch {}
      }
    }

    load()
  }, [clientId])

  const update = (key: keyof ProfileData, value: any) => {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaveError(null)
    // Always persist to localStorage as fallback
    localStorage.setItem("nova_client_profile", JSON.stringify(profile))

    // Upsert to Supabase if we have a clientId
    if (clientId) {
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from("nova_client_profile")
          .upsert(
            {
              client_id: clientId,
              business_name: profile.businessName || null,
              expert_name: profile.expertName || null,
              niche: profile.niche || null,
              offer_description: profile.offerDescription || null,
              instagram_url: profile.instagramUrl || null,
              aov: profile.aov ? Number(profile.aov) : null,
              revenue_share_pct: profile.revenueSharePct,
              start_date: profile.startDate || null,
              winning_angles: profile.winningAngles,
              main_pains: profile.mainPains,
              notes: profile.notes || null,
              manychat_api_key: profile.manychatApiKey || null,
              manychat_bot_id: profile.manychatBotId || null,
              meta_ad_account_id: profile.metaAdAccountId || null,
              meta_access_token: profile.metaAccessToken || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "client_id" }
          )

        if (error) {
          setSaveError("Guardado localmente. Error al sincronizar con servidor.")
        }
      } catch {
        setSaveError("Guardado localmente. Sin conexión al servidor.")
      }
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <>
    <style>{`
      @media (max-width: 767px) {
        .prof-title { font-size: clamp(20px, 5vw, 30px) !important; }
      }
    `}</style>
    <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
      {/* Header */}
      <div>
        <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", marginBottom: "10px", textTransform: "uppercase" }}>
          Configuración
        </p>
        <h1 className="prof-title" style={{ fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#f5f5f5", letterSpacing: "1px" }}>
          Perfil del cliente
        </h1>
      </div>

      {/* Negocio */}
      <div>
        <p style={SECTION_LABEL}>Negocio</p>
        <div style={{ ...CARD, padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {[
            { label: "Nombre del negocio", key: "businessName" as const, placeholder: "Ej. Expert Academy" },
            { label: "Nombre del experto", key: "expertName" as const, placeholder: "Ej. Martín Gómez" },
            { label: "Nicho", key: "niche" as const, placeholder: "Ej. Coaches de vida" },
            { label: "URL de Instagram", key: "instagramUrl" as const, placeholder: "https://instagram.com/..." },
          ].map((field) => (
            <div key={field.key}>
              <p style={LABEL_STYLE}>{field.label}</p>
              <input
                type="text"
                value={profile[field.key] as string}
                onChange={(e) => update(field.key, e.target.value)}
                placeholder={field.placeholder}
                style={INPUT_STYLE}
              />
            </div>
          ))}

          <div>
            <p style={LABEL_STYLE}>Descripción de la oferta</p>
            <textarea
              value={profile.offerDescription}
              onChange={(e) => update("offerDescription", e.target.value)}
              placeholder="Describí brevemente el programa o servicio que ofrece el experto..."
              rows={3}
              style={{ ...INPUT_STYLE, resize: "vertical" }}
            />
          </div>
        </div>
      </div>

      {/* Acuerdo comercial */}
      <div>
        <div style={{ height: "0.5px", background: "#111", marginBottom: "32px" }} />
        <p style={SECTION_LABEL}>Acuerdo comercial</p>
        <div style={{ ...CARD, padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <p style={LABEL_STYLE}>AOV promedio ($)</p>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#555", fontSize: "13px", fontFamily: "sans-serif" }}>$</span>
              <input
                type="number"
                value={profile.aov}
                onChange={(e) => update("aov", e.target.value)}
                placeholder="0"
                style={{ ...INPUT_STYLE, paddingLeft: "26px" }}
              />
            </div>
          </div>

          <div>
            <p style={LABEL_STYLE}>Porcentaje revenue share</p>
            <div style={{ display: "flex", gap: "8px" }}>
              {[20, 30, 50].map((p) => (
                <button
                  key={p}
                  onClick={() => update("revenueSharePct", p)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontFamily: "Georgia, serif",
                    fontWeight: 400,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: profile.revenueSharePct === p ? "rgba(34,197,94,0.08)" : "#080808",
                    border: profile.revenueSharePct === p ? "0.5px solid rgba(34,197,94,0.3)" : "0.5px solid #111",
                    color: profile.revenueSharePct === p ? "#22c55e" : "#555",
                  }}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={LABEL_STYLE}>Fecha de inicio del contrato</p>
            <input
              type="date"
              value={profile.startDate}
              onChange={(e) => update("startDate", e.target.value)}
              style={{ ...INPUT_STYLE, colorScheme: "dark" }}
            />
          </div>
        </div>
      </div>

      {/* Sistema */}
      <div>
        <div style={{ height: "0.5px", background: "#111", marginBottom: "32px" }} />
        <p style={SECTION_LABEL}>Sistema</p>
        <div style={{ ...CARD, padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <p style={LABEL_STYLE}>Ángulos ganadores identificados</p>
            <TagList
              tags={profile.winningAngles}
              onAdd={(tag) => update("winningAngles", [...profile.winningAngles, tag])}
              onRemove={(i) => update("winningAngles", profile.winningAngles.filter((_, idx) => idx !== i))}
              placeholder="Escribí un ángulo"
            />
          </div>

          <div>
            <p style={LABEL_STYLE}>Dolores principales del nicho</p>
            <TagList
              tags={profile.mainPains}
              onAdd={(tag) => update("mainPains", [...profile.mainPains, tag])}
              onRemove={(i) => update("mainPains", profile.mainPains.filter((_, idx) => idx !== i))}
              placeholder="Escribí un dolor"
            />
          </div>

          <div>
            <p style={LABEL_STYLE}>Notas internas</p>
            <textarea
              value={profile.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Notas, observaciones, contexto del cliente..."
              rows={4}
              style={{ ...INPUT_STYLE, resize: "vertical" }}
            />
          </div>
        </div>
      </div>

      {/* Integraciones */}
      <div>
        <div style={{ height: "0.5px", background: "#111", marginBottom: "32px" }} />
        <p style={SECTION_LABEL}>Integraciones</p>
        <div style={{ ...CARD, padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* ManyChat */}
          <div>
            <p style={{ ...LABEL_STYLE, color: "#4ade80", marginBottom: "4px" }}>ManyChat</p>
            <p style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#444", marginBottom: "12px" }}>
              Credenciales de ManyChat Pro para sincronizar el pipeline y generar links directos a contactos.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <p style={LABEL_STYLE}>Bot ID</p>
                <p style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#444", marginBottom: "8px" }}>
                  Número que aparece en la URL de ManyChat: app.manychat.com/fb<strong style={{ color: "#777" }}>XXXXXXXX</strong>/...
                </p>
                <input
                  type="text"
                  value={profile.manychatBotId ?? ""}
                  onChange={(e) => update("manychatBotId", e.target.value)}
                  placeholder="Ej. 1918784"
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <p style={LABEL_STYLE}>API Key</p>
                <input
                  type="password"
                  value={profile.manychatApiKey}
                  onChange={(e) => update("manychatApiKey", e.target.value)}
                  placeholder="••••••••••••••••••••"
                  style={INPUT_STYLE}
                />
              </div>
            </div>
          </div>

          <div style={{ height: "0.5px", background: "#111" }} />

          {/* Meta Ads */}
          <div>
            <p style={{ ...LABEL_STYLE, color: "#4ade80", marginBottom: "4px" }}>Meta Ads</p>
            <p style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#444", marginBottom: "12px" }}>
              Credenciales de Meta Marketing API para sincronizar métricas de Follow Me Ads.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <p style={LABEL_STYLE}>Ad Account ID</p>
                <input
                  type="text"
                  value={profile.metaAdAccountId}
                  onChange={(e) => update("metaAdAccountId", e.target.value)}
                  placeholder="act_123456789"
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <p style={LABEL_STYLE}>Access Token</p>
                <input
                  type="password"
                  value={profile.metaAccessToken}
                  onChange={(e) => update("metaAccessToken", e.target.value)}
                  placeholder="••••••••••••••••••••"
                  style={INPUT_STYLE}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          onClick={handleSave}
          style={{
            padding: "12px 28px",
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
            transition: "opacity 0.2s",
          }}
        >
          Guardar cambios
        </button>
        {saved && (
          <p style={{ fontSize: "10px", color: "#22c55e", fontFamily: "sans-serif", fontWeight: 300, letterSpacing: "2px" }}>
            Guardado correctamente
          </p>
        )}
        {saveError && (
          <p style={{ fontSize: "10px", color: "#f87171", fontFamily: "sans-serif", fontWeight: 300, letterSpacing: "1px" }}>
            {saveError}
          </p>
        )}
      </div>
    </div>
    </>
  )
}

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <ProfileContent />
    </DashboardLayout>
  )
}
