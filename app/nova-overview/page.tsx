"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabaseClient"
import { DashboardLayout, useUserRole, useSelectedMonth } from "@/components/dashboard-layout"
import { SECTION_LABEL, CARD_P } from "@/lib/styles"

interface ClientSummary {
  clientId: string
  name: string
  email: string | null
  lastMonth: {
    cashCollected: number
    closes: number
    healthScore: number
    newFollowers: number
  } | null
  revenueSharePct: number
}

function StatCell({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <p style={{ fontSize: "9px", fontFamily: "sans-serif", color: "#444", letterSpacing: "2px", textTransform: "uppercase" }}>
        {label}
      </p>
      <p style={{ fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: 400, color: color ?? "#f5f5f5" }}>
        {value}
      </p>
    </div>
  )
}

function ClientCard({ client }: { client: ClientSummary }) {
  const score = client.lastMonth?.healthScore ?? 0
  const scoreColor = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444"

  return (
    <div style={{ ...CARD_P, display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Top accent */}
      <div style={{ height: "2px", background: scoreColor, opacity: 0.4, margin: "-20px -20px 0", borderRadius: "12px 12px 0 0" }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", paddingTop: "4px" }}>
        <div>
          <p style={{ fontSize: "14px", fontFamily: "sans-serif", fontWeight: 400, color: "#f5f5f5" }}>{client.name}</p>
          {client.email && (
            <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 300, color: "#555", marginTop: "2px" }}>{client.email}</p>
          )}
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: "9999px",
          background: "rgba(34,197,94,0.06)", border: "0.5px solid rgba(34,197,94,0.2)",
          fontSize: "9px", fontFamily: "sans-serif", letterSpacing: "1px", color: "#22c55e",
        }}>
          {client.revenueSharePct}% RS
        </span>
      </div>

      {client.lastMonth ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          <StatCell
            label="Cash collected"
            value={`$${client.lastMonth.cashCollected.toLocaleString()}`}
            color="#f5f5f5"
          />
          <StatCell
            label="Health score"
            value={`${score}/100`}
            color={scoreColor}
          />
          <StatCell label="Cierres" value={client.lastMonth.closes} />
          <StatCell label="Seguidores" value={`+${client.lastMonth.newFollowers}`} />
        </div>
      ) : (
        <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#444" }}>
          Sin datos este mes
        </p>
      )}

      <div style={{ height: "0.5px", background: "#111" }} />

      <div style={{ display: "flex", gap: "8px" }}>
        <p style={{ fontSize: "10px", fontFamily: "sans-serif", color: "#444", letterSpacing: "1px" }}>
          ID: {client.clientId.slice(0, 8)}…
        </p>
      </div>
    </div>
  )
}

function NovaOverviewContent() {
  const role = useUserRole()
  const router = useRouter()
  const selectedMonth = useSelectedMonth()
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState({ cashCollected: 0, closes: 0, revenueNova: 0, activeClients: 0 })

  // Guard: redirect non-admins
  useEffect(() => {
    if (role !== null && role.toLowerCase() !== "admin") {
      router.replace("/overview")
    }
  }, [role, router])

  useEffect(() => {
    if (!role || role.toLowerCase() !== "admin") return

    async function load() {
      setLoading(true)
      try {
        const supabase = createClient()

        // Load all client profiles
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, client_id, name, role")
          .order("id", { ascending: false })

        const clientProfiles = (profiles ?? []).filter(
          (p: any) => p.client_id && p.role !== "admin"
        )

        if (clientProfiles.length === 0) {
          setClients([])
          setLoading(false)
          return
        }

        const clientIds = clientProfiles.map((p: any) => p.client_id)

        // Monthly reports — usar month como DATE (YYYY-MM-01)
        const now = new Date()
        const activeMonth = selectedMonth
          ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
        const monthDate = `${activeMonth}-01`

        const { data: reports } = await supabase
          .from("monthly_reports")
          .select("*")
          .in("client_id", clientIds)
          .eq("month", monthDate)

        // Nova client profiles (revenue share pct) — puede no existir, no lanzar error
        const { data: novaProfiles } = await supabase
          .from("nova_client_profile")
          .select("client_id, revenue_share_pct")
          .in("client_id", clientIds)

        const reportMap = new Map<string, any>()
        for (const r of (reports ?? [])) {
          reportMap.set(r.client_id, r)
        }

        const novaProfileMap = new Map<string, any>()
        for (const np of (novaProfiles ?? [])) {
          novaProfileMap.set(np.client_id, np)
        }

        const summaries: ClientSummary[] = clientProfiles.map((p: any) => {
          const rep = reportMap.get(p.client_id)
          const np = novaProfileMap.get(p.client_id)
          const displayName = p.name ?? "Cliente " + p.client_id.slice(0, 6)

          return {
            clientId: p.client_id,
            name: displayName,
            email: null,
            revenueSharePct: Number(np?.revenue_share_pct ?? 30),
            lastMonth: rep
              ? {
                  cashCollected: Number(rep.cash_collected ?? 0),
                  closes: Number(rep.new_clients ?? rep.closes ?? 0),
                  healthScore: Number(rep.health_score ?? 0),
                  newFollowers: Number(rep.new_followers ?? 0),
                }
              : null,
          }
        })

        setClients(summaries)

        // Compute totals
        const totalCash = summaries.reduce((s, c) => s + (c.lastMonth?.cashCollected ?? 0), 0)
        const totalCloses = summaries.reduce((s, c) => s + (c.lastMonth?.closes ?? 0), 0)
        const totalRevNova = summaries.reduce((s, c) => {
          const cash = c.lastMonth?.cashCollected ?? 0
          return s + Math.round(cash * (c.revenueSharePct / 100))
        }, 0)

        setTotals({
          cashCollected: totalCash,
          closes: totalCloses,
          revenueNova: totalRevNova,
          activeClients: summaries.length,
        })
      } catch {
        setClients([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [role, selectedMonth])

  if (role === null || role.toLowerCase() !== "admin") {
    return (
      <div style={{ padding: "40px", fontFamily: "sans-serif", color: "#555", fontSize: "13px" }}>
        Verificando permisos…
      </div>
    )
  }

  const today = new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" })

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
      {/* Header */}
      <div>
        <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", marginBottom: "10px", textTransform: "uppercase" }}>
          Admin
        </p>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#f5f5f5", letterSpacing: "1px", marginBottom: "6px" }}>
          NOVA Overview
        </h1>
        <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#666", letterSpacing: "1px", textTransform: "capitalize" }}>
          {today}
        </p>
      </div>

      {/* Totals */}
      <div>
        <p style={SECTION_LABEL}>Resumen global del mes</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
          {[
            { label: "Clientes activos", value: totals.activeClients, prefix: "", suffix: "" },
            { label: "Cash total (clientes)", value: `$${totals.cashCollected.toLocaleString()}`, prefix: "", suffix: "" },
            { label: "Fee NOVA", value: `$${totals.revenueNova.toLocaleString()}`, prefix: "", suffix: "" },
            { label: "Cierres totales", value: totals.closes, prefix: "", suffix: "" },
          ].map((stat) => (
            <div key={stat.label} style={{ ...CARD_P }}>
              <p style={{ fontSize: "9px", fontFamily: "sans-serif", color: "#444", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>
                {stat.label}
              </p>
              <p style={{ fontFamily: "Georgia, serif", fontSize: "28px", fontWeight: 400, color: "#f5f5f5" }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Clients grid */}
      <div>
        <p style={SECTION_LABEL}>Clientes — este mes</p>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ ...CARD_P, height: "120px", opacity: 0.4 }} />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div style={{ ...CARD_P }}>
            <p style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#555" }}>
              No hay clientes registrados aún.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {clients.map((c) => (
              <ClientCard key={c.clientId} client={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function NovaOverviewPage() {
  return (
    <DashboardLayout>
      <NovaOverviewContent />
    </DashboardLayout>
  )
}
