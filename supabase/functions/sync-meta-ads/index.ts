// supabase/functions/sync-meta-ads/index.ts
// Llama a la Meta Marketing API y guarda las métricas en ads_metrics.
// Invocar: POST /functions/v1/sync-meta-ads
// Body: { client_id, ad_account_id, access_token }
// O sin body para leer desde nova_client_profile (usa auth del usuario).

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const body = await req.json().catch(() => ({}))
    let { client_id, ad_account_id, access_token } = body

    // Si no vienen en el body, leer desde nova_client_profile
    if (!ad_account_id || !access_token) {
      if (!client_id) {
        return new Response(JSON.stringify({ error: "client_id requerido" }), { status: 400, headers: CORS })
      }
      const { data: profile } = await supabase
        .from("nova_client_profile")
        .select("meta_ad_account_id, meta_access_token")
        .eq("client_id", client_id)
        .maybeSingle()

      ad_account_id = profile?.meta_ad_account_id
      access_token  = profile?.meta_access_token
    }

    if (!ad_account_id || !access_token) {
      return new Response(
        JSON.stringify({ error: "Credenciales de Meta no configuradas. Completalas en tu perfil." }),
        { status: 422, headers: CORS }
      )
    }

    // Llamada a Meta Marketing API
    const fields = "campaign_name,ad_name,impressions,clicks,spend,reach,frequency,actions"
    const url = `https://graph.facebook.com/v19.0/act_${ad_account_id}/insights?fields=${fields}&date_preset=last_7d&level=ad&access_token=${access_token}`

    const metaRes = await fetch(url)
    const metaJson = await metaRes.json()

    if (metaJson.error) {
      return new Response(JSON.stringify({ error: metaJson.error.message }), { status: 400, headers: CORS })
    }

    const today = new Date().toISOString().slice(0, 10)
    const rows = (metaJson.data ?? []) as any[]

    let inserted = 0
    for (const ad of rows) {
      const impressions   = Number(ad.impressions ?? 0)
      const clicks        = Number(ad.clicks ?? 0)
      const spend         = Number(ad.spend ?? 0)
      const frequency     = Number(ad.frequency ?? 0)
      const ctr           = impressions > 0 ? (clicks / impressions) * 100 : 0

      // Contar follows desde actions[]
      const actions: any[] = Array.isArray(ad.actions) ? ad.actions : []
      const followAction = actions.find((a: any) => a.action_type === "follow")
      const newFollowers  = followAction ? Number(followAction.value ?? 0) : 0
      const costPerFollower = newFollowers > 0 ? spend / newFollowers : 0

      const creativeName = ad.ad_name ?? ad.campaign_name ?? "Sin nombre"

      // Determinar status según CTR y frecuencia
      let status = "inactive"
      if (ctr >= 2.5 && frequency < 1.8) status = "winner"
      else if (ctr >= 1.5 || frequency < 2.5) status = "warning"
      else if (spend > 0) status = "critical"

      const { error: insErr } = await supabase.from("ads_metrics").insert({
        client_id,
        date: today,
        date_from: today,
        date_to: today,
        creative_name: creativeName,
        spend,
        followers_gained: newFollowers,
        cost_per_follower: costPerFollower,
        ctr,
        frequency,
        followers_per_day: newFollowers / 7,
        status,
      })

      if (!insErr) inserted++
    }

    return new Response(
      JSON.stringify({ ok: true, ads_synced: inserted }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS })
  }
})
