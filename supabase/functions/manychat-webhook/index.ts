// supabase/functions/manychat-webhook/index.ts
//
// Recibe eventos de ManyChat (subscriber_tag_added).
// Cuando tag_name === "cerrado", inserta en pending_closures.
//
// Configuración en ManyChat:
//   Settings → Integrations → Webhooks → New Webhook
//   URL: https://[proyecto].supabase.co/functions/v1/manychat-webhook
//   Evento: subscriber_tag_added
//   El campo client_id del subscriber debe tener el UUID del cliente en Supabase.

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
    const { event, subscriber_id, subscriber_name, tag_name, timestamp, client_id } = body

    if (!client_id || !subscriber_id) {
      return new Response(
        JSON.stringify({ error: "client_id y subscriber_id requeridos" }),
        { status: 400, headers: CORS }
      )
    }

    // Solo procesar el tag de cierre
    if (tag_name !== "cerrado") {
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: `tag '${tag_name}' ignorado` }),
        { status: 200, headers: CORS }
      )
    }

    const { error } = await supabase.from("pending_closures").upsert({
      client_id,
      subscriber_id: String(subscriber_id),
      subscriber_name: subscriber_name ?? null,
      closed_at: timestamp ?? new Date().toISOString(),
      status: "pending",
    }, { onConflict: "client_id,subscriber_id" })

    if (error) throw error

    return new Response(
      JSON.stringify({ ok: true, event: "cierre_registrado", subscriber_id }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS })
  }
})
