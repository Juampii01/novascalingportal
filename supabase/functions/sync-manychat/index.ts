// supabase/functions/sync-manychat/index.ts
// Cuenta subscribers por tag en ManyChat y guarda snapshot en manychat_pipeline.
// Sistema de tags requerido en ManyChat Pro del cliente:
//   nova_apertura, nova_calificado, nova_filtrado, nova_dolor,
//   nova_solucion, nova_prueba_social, nova_calendario,
//   nova_agendado, nova_cerrado, nova_perdido
//
// Invocar: POST /functions/v1/sync-manychat
// Body: { client_id, manychat_api_key }
// O sin api_key para leerla desde nova_client_profile.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const NOVA_TAGS = [
  "apertura",
  "calificado",
  "filtrado",
  "dolor",
  "solucion",
  "prueba_social",
  "calendario_enviado",
  "agendado",
  "cerrado",
  "perdido",
]

// Lee los conteos desde subscriber_tags en Supabase (acumulados por webhooks)
async function getTagCountsFromDB(
  supabase: any,
  clientId: string
): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  for (const tag of NOVA_TAGS) {
    const { count } = await supabase
      .from("subscriber_tags")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("tag_name", tag)
    map.set(tag, count ?? 0)
  }
  return map
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const body = await req.json().catch(() => ({}))
    const { client_id } = body

    // Buscar clientes a sincronizar
    let profiles: { client_id: string; manychat_api_key: string }[] = []

    if (client_id) {
      // Sincronizar solo el cliente especificado
      const { data } = await supabase
        .from("nova_client_profile")
        .select("client_id, manychat_api_key")
        .eq("client_id", client_id)
        .not("manychat_api_key", "is", null)
        .maybeSingle()
      if (data) profiles = [data]
    } else {
      // Modo cron: sincronizar todos los clientes con API key configurada
      const { data } = await supabase
        .from("nova_client_profile")
        .select("client_id, manychat_api_key")
        .not("manychat_api_key", "is", null)
      profiles = data ?? []
    }

    if (profiles.length === 0) {
      return new Response(
        JSON.stringify({ error: "No hay clientes con API key de ManyChat configurada." }),
        { status: 422, headers: CORS }
      )
    }

    const today = new Date().toISOString().slice(0, 10)
    const results = []

    for (const profile of profiles) {
      const apiKey = profile.manychat_api_key
      const tagMap = await getTagCountsFromDB(supabase, profile.client_id)
      const get = (name: string) => tagMap.get(name) ?? 0
      const apertura      = get("apertura")
      const calificado    = get("calificado")
      const filtrado      = get("filtrado")
      const dolor         = get("dolor")
      const solucion      = get("solucion")
      const prueba_social = get("prueba_social")
      const calendario    = get("calendario_enviado")
      const agendado      = get("agendado")
      const cerrado       = get("cerrado")
      const perdido       = get("perdido")

      const newConversations = apertura
      const qualifiedLeads   = calificado
      const calendarSent     = calendario
      const booked           = agendado
      const closed           = cerrado
      const unqualifiedLeads = filtrado + dolor
      const pendingFollowUps = solucion + prueba_social
      const responseRate     = newConversations > 0 ? Math.round((qualifiedLeads / newConversations) * 100) : 0

      const steps = [
        { label: "Apertura",      count: apertura },
        { label: "Calificado",    count: calificado },
        { label: "Filtrado",      count: filtrado },
        { label: "Dolor",         count: dolor },
        { label: "Solución",      count: solucion },
        { label: "Prueba Social", count: prueba_social },
        { label: "Calendario",    count: calendario },
        { label: "Agendado",      count: agendado },
        { label: "Cerrado",       count: cerrado },
        { label: "Perdido",       count: perdido },
      ]

      await supabase.from("manychat_pipeline").upsert({
        client_id: profile.client_id,
        period_start: today,
        period_end: today,
        new_conversations:   newConversations,
        response_rate:       responseRate,
        qualified_leads:     qualifiedLeads,
        unqualified_leads:   unqualifiedLeads,
        calendar_sent:       calendarSent,
        booked,
        closed,
        pending_follow_ups:  pendingFollowUps,
        steps,
        weekly_conversations: [],
      }, { onConflict: "client_id,period_start" })

      results.push({ client_id: profile.client_id, new_conversations: newConversations, qualified_leads: qualifiedLeads, booked, closed })
    }

    return new Response(
      JSON.stringify({ ok: true, synced: results.length, results }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS })
  }
})
