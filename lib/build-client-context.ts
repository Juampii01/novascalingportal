import { createClient } from "@supabase/supabase-js"

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

export interface ClientContext {
  clientId: string
  businessName: string | null
  expertName: string | null
  niche: string | null
  offerDescription: string | null
  aov: number | null
  revenueSharePct: number
  startDate: string | null
  winningAngles: string[]
  mainPains: string[]
  notes: string | null
  // Latest monthly KPIs
  latestMonth: {
    month: number
    year: number
    cashCollected: number
    revenueShare: number
    newFollowers: number
    totalConversations: number
    callsBooked: number
    callsAttended: number
    closes: number
    healthScore: number
  } | null
  // Latest ads snapshot
  topCreatives: {
    name: string
    ctr: number
    frequency: number
    spend: number
    status: string
  }[]
  // Latest pipeline snapshot
  pipeline: {
    newConversations: number
    responseRate: number
    qualifiedLeads: number
    booked: number
    closed: number
  } | null
}

export async function buildClientContext(clientId: string): Promise<ClientContext> {
  const supabase = getAdminSupabase()

  const [profileRes, monthlyRes, adsRes, pipelineRes] = await Promise.allSettled([
    supabase
      .from("nova_client_profile")
      .select("business_name, expert_name, niche, offer_description, aov, revenue_share_pct, start_date, winning_angles, main_pains, notes")
      .eq("client_id", clientId)
      .maybeSingle(),

    supabase
      .from("monthly_reports")
      .select("month, cash_collected, revenue_share, new_followers, inbound_messages, scheduled_calls, attended_calls, closes, new_clients, health_score")
      .eq("client_id", clientId)
      .order("month", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("ads_metrics")
      .select("creative_name, ctr, frequency, spend, status")
      .eq("client_id", clientId)
      .order("date_from", { ascending: false })
      .limit(5),

    supabase
      .from("manychat_pipeline")
      .select("new_conversations, response_rate, qualified_leads, booked, closed")
      .eq("client_id", clientId)
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const profile = profileRes.status === "fulfilled" ? profileRes.value.data : null
  const monthly = monthlyRes.status === "fulfilled" ? monthlyRes.value.data : null
  const ads = adsRes.status === "fulfilled" ? (adsRes.value.data ?? []) : []
  const pipeline = pipelineRes.status === "fulfilled" ? pipelineRes.value.data : null

  return {
    clientId,
    businessName: profile?.business_name ?? null,
    expertName: profile?.expert_name ?? null,
    niche: profile?.niche ?? null,
    offerDescription: profile?.offer_description ?? null,
    aov: profile?.aov ? Number(profile.aov) : null,
    revenueSharePct: Number(profile?.revenue_share_pct ?? 30),
    startDate: profile?.start_date ?? null,
    winningAngles: (Array.isArray(profile?.winning_angles) ? profile?.winning_angles : []) as string[],
    mainPains: (Array.isArray(profile?.main_pains) ? profile?.main_pains : []) as string[],
    notes: profile?.notes ?? null,
    latestMonth: monthly
      ? (() => {
          const d = new Date((monthly.month as string) + "T00:00:00Z")
          return {
            month: d.getUTCMonth() + 1,
            year: d.getUTCFullYear(),
            cashCollected: Number(monthly.cash_collected ?? 0),
            revenueShare: Number(monthly.revenue_share ?? 0),
            newFollowers: Number(monthly.new_followers ?? 0),
            totalConversations: Number(monthly.inbound_messages ?? 0),
            callsBooked: Number(monthly.scheduled_calls ?? 0),
            callsAttended: Number(monthly.attended_calls ?? 0),
            closes: Number(monthly.closes ?? monthly.new_clients ?? 0),
            healthScore: Number(monthly.health_score ?? 0),
          }
        })()
      : null,
    topCreatives: (ads as any[]).map((a) => ({
      name: a.creative_name,
      ctr: Number(a.ctr ?? 0),
      frequency: Number(a.frequency ?? 0),
      spend: Number(a.spend ?? 0),
      status: a.status ?? "inactive",
    })),
    pipeline: pipeline
      ? {
          newConversations: Number(pipeline.new_conversations ?? 0),
          responseRate: Number(pipeline.response_rate ?? 0),
          qualifiedLeads: Number(pipeline.qualified_leads ?? 0),
          booked: Number(pipeline.booked ?? 0),
          closed: Number(pipeline.closed ?? 0),
        }
      : null,
  }
}

export function clientContextToText(ctx: ClientContext): string {
  const lines: string[] = []

  lines.push(`=== CONTEXTO DEL CLIENTE ===`)
  if (ctx.businessName) lines.push(`Negocio: ${ctx.businessName}`)
  if (ctx.expertName)   lines.push(`Experto: ${ctx.expertName}`)
  if (ctx.niche)        lines.push(`Nicho: ${ctx.niche}`)
  if (ctx.offerDescription) lines.push(`Oferta: ${ctx.offerDescription}`)
  if (ctx.aov)          lines.push(`AOV promedio: $${ctx.aov}`)
  lines.push(`Revenue share NOVA: ${ctx.revenueSharePct}%`)
  if (ctx.startDate)    lines.push(`Inicio de contrato: ${ctx.startDate}`)

  if (ctx.winningAngles.length > 0) {
    lines.push(`Ángulos ganadores: ${ctx.winningAngles.join(", ")}`)
  }
  if (ctx.mainPains.length > 0) {
    lines.push(`Dolores del nicho: ${ctx.mainPains.join(", ")}`)
  }
  if (ctx.notes) {
    lines.push(`Notas: ${ctx.notes}`)
  }

  if (ctx.latestMonth) {
    const m = ctx.latestMonth
    lines.push(`\n=== KPIs ÚLTIMO MES (${m.month}/${m.year}) ===`)
    lines.push(`Cash collected: $${m.cashCollected.toLocaleString()}`)
    lines.push(`Revenue NOVA: $${m.revenueShare.toLocaleString()}`)
    lines.push(`Seguidores nuevos: ${m.newFollowers}`)
    lines.push(`Conversaciones ManyChat: ${m.totalConversations}`)
    lines.push(`Llamadas agendadas: ${m.callsBooked}`)
    lines.push(`Llamadas asistidas: ${m.callsAttended}`)
    lines.push(`Cierres: ${m.closes}`)
    lines.push(`Health score: ${m.healthScore}/100`)
  }

  if (ctx.topCreatives.length > 0) {
    lines.push(`\n=== CREATIVOS ACTIVOS ===`)
    for (const c of ctx.topCreatives) {
      lines.push(`- ${c.name}: CTR ${c.ctr}%, frecuencia ${c.frequency}, spend $${c.spend}, estado: ${c.status}`)
    }
  }

  if (ctx.pipeline) {
    const p = ctx.pipeline
    lines.push(`\n=== PIPELINE MANYCHAT ===`)
    lines.push(`Conversaciones nuevas: ${p.newConversations}`)
    lines.push(`Tasa de respuesta: ${p.responseRate}%`)
    lines.push(`Leads calificados: ${p.qualifiedLeads}`)
    lines.push(`Agendados: ${p.booked}`)
    lines.push(`Cerrados: ${p.closed}`)
  }

  return lines.join("\n")
}
