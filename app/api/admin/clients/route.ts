import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminSupabase() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase environment variables")
  }
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

const MONTH_NAMES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

function monthLabel(dateStr: string | null): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr + "T00:00:00Z")
  return `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr + "T00:00:00Z")
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / 86_400_000)
}

// GET /api/admin/clients
export async function GET(_req: NextRequest) {
  try {
    const supabase = getAdminSupabase()

    const today = new Date().toISOString().slice(0, 10)
    const currentMonthStart = today.slice(0, 7) + "-01"

    // 1. All client profiles
    const { data: profiles, error: profilesErr } = await supabase
      .from("nova_client_profile")
      .select("client_id, expert_name, business_name, niche, start_date")
      .order("business_name", { ascending: true })

    if (profilesErr) return NextResponse.json({ error: profilesErr.message }, { status: 500 })
    if (!profiles || profiles.length === 0) return NextResponse.json({ clients: [] })

    const clientIds = profiles.map((p: any) => p.client_id)

    // 2. Monthly reports — ordered by month date DESC (month is DATE "YYYY-MM-01")
    const { data: reports } = await supabase
      .from("monthly_reports")
      .select("client_id, month, cash_collected, revenue_share, closes, new_clients, health_score, scheduled_calls, attended_calls")
      .in("client_id", clientIds)
      .order("month", { ascending: false })

    // 3. Active leads in sales_pipeline
    const from90 = new Date()
    from90.setDate(from90.getDate() - 90)
    const { data: leads } = await supabase
      .from("sales_pipeline")
      .select("client_id, stage, closed, attended")
      .in("client_id", clientIds)
      .gte("created_at", from90.toISOString())

    // 4. EOD Setter — last date + current month totals
    const { data: eodSetterRows } = await supabase
      .from("eod_setter")
      .select("client_id, date, aperturas, agendados")
      .in("client_id", clientIds)
      .gte("date", currentMonthStart)
      .order("date", { ascending: false })

    // 5. EOD Closer — last date + current month totals
    const { data: eodCloserRows } = await supabase
      .from("eod_closer")
      .select("client_id, date, cerrados, monto, llamadas_agendadas")
      .in("client_id", clientIds)
      .gte("date", currentMonthStart)
      .order("date", { ascending: false })

    // ── Aggregate per client ──────────────────────────────────────────────────

    const reportsByClient: Record<string, any[]> = {}
    for (const r of (reports ?? [])) {
      if (!reportsByClient[r.client_id]) reportsByClient[r.client_id] = []
      reportsByClient[r.client_id].push(r)
    }

    const leadsByClient: Record<string, any[]> = {}
    for (const l of (leads ?? [])) {
      if (!leadsByClient[l.client_id]) leadsByClient[l.client_id] = []
      leadsByClient[l.client_id].push(l)
    }

    const eodSetterByClient: Record<string, any[]> = {}
    for (const e of (eodSetterRows ?? [])) {
      if (!eodSetterByClient[e.client_id]) eodSetterByClient[e.client_id] = []
      eodSetterByClient[e.client_id].push(e)
    }

    const eodCloserByClient: Record<string, any[]> = {}
    for (const e of (eodCloserRows ?? [])) {
      if (!eodCloserByClient[e.client_id]) eodCloserByClient[e.client_id] = []
      eodCloserByClient[e.client_id].push(e)
    }

    const clients = profiles.map((p: any) => {
      const clientReports = reportsByClient[p.client_id] ?? []
      const latest = clientReports[0] ?? null
      const prev   = clientReports[1] ?? null

      const clientLeads = leadsByClient[p.client_id] ?? []
      const activeLeads = clientLeads.filter((l: any) => l.stage !== "perdido" && !l.closed).length
      const attended    = clientLeads.filter((l: any) => l.attended).length
      const scheduled   = clientLeads.filter((l: any) => l.stage !== "perdido").length
      const attendanceRate = scheduled > 0 ? Math.round((attended / scheduled) * 100) : 0

      // Revenue: prefer EOD closer sum (real-time), fallback to monthly report
      const setterEntries = eodSetterByClient[p.client_id] ?? []
      const closerEntries = eodCloserByClient[p.client_id] ?? []

      const eodRevenue = closerEntries.reduce((s: number, e: any) => s + Number(e.monto ?? 0), 0)
      const eodCerrados = closerEntries.reduce((s: number, e: any) => s + Number(e.cerrados ?? 0), 0)
      const eodAgendados = closerEntries.reduce((s: number, e: any) => s + Number(e.llamadas_agendadas ?? 0), 0)
      const eodAperturas = setterEntries.reduce((s: number, e: any) => s + Number(e.aperturas ?? 0), 0)

      const cash   = eodRevenue > 0 ? eodRevenue : (latest ? Number(latest.cash_collected ?? 0) : 0)
      const closes = eodCerrados > 0 ? eodCerrados : (latest ? Number(latest.closes ?? latest.new_clients ?? 0) : 0)

      const prevCash = prev ? Number(prev.cash_collected ?? 0) : 0
      const trend    = prevCash > 0 ? Math.round(((cash - prevCash) / prevCash) * 100) : null
      const health   = latest ? Number(latest.health_score ?? 0) : 0

      // EOD activity
      const lastSetterDate = setterEntries[0]?.date ?? null
      const lastCloserDate = closerEntries[0]?.date ?? null
      const setterLoggedToday = lastSetterDate === today
      const closerLoggedToday = lastCloserDate === today
      const daysSinceSetter = daysSince(lastSetterDate)
      const daysSinceCloser = daysSince(lastCloserDate)

      return {
        clientId: p.client_id,
        clientName: p.business_name ?? p.expert_name ?? "Sin nombre",
        expertName: p.expert_name ?? null,
        niche: p.niche ?? null,
        healthScore: health,
        cashThisMonth: cash,
        revenueShare: latest ? Number(latest.revenue_share ?? 0) : 0,
        closes,
        callsBooked: eodAgendados > 0 ? eodAgendados : (latest ? Number(latest.scheduled_calls ?? 0) : 0),
        revenueTrend: trend,
        activeLeads,
        attendanceRate,
        lastMonthLabel: monthLabel(latest?.month ?? null),
        totalMonths: clientReports.length,
        // EOD
        eodAperturas,
        eodRevenue,
        setterLoggedToday,
        closerLoggedToday,
        daysSinceSetter,
        daysSinceCloser,
      }
    })

    return NextResponse.json({ clients })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Internal server error" }, { status: 500 })
  }
}
