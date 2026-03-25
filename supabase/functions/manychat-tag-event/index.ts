// supabase/functions/manychat-tag-event/index.ts
// Recibe eventos de tag desde ManyChat (External Request en cada flujo)
// y los acumula en subscriber_tags para contar por tag.
//
// Body esperado:
// {
//   client_id: string,
//   subscriber_id: string,
//   tag: string,          // nombre del tag: "apertura", "calificado", etc.
//   action?: "add" | "remove"  // default: "add"
// }

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
    const { client_id, subscriber_id, tag, action = "add" } = body

    if (!client_id || !subscriber_id || !tag) {
      return new Response(
        JSON.stringify({ error: "Faltan campos: client_id, subscriber_id, tag" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      )
    }

    const { subscriber_name } = body

    if (action === "remove") {
      await supabase
        .from("subscriber_tags")
        .delete()
        .eq("client_id", client_id)
        .eq("subscriber_id", subscriber_id)
        .eq("tag_name", tag)
    } else {
      await supabase
        .from("subscriber_tags")
        .upsert(
          { client_id, subscriber_id, tag_name: tag },
          { onConflict: "client_id,subscriber_id,tag_name", ignoreDuplicates: true }
        )

      // CRM automático
      if (tag === "calificado") {
        const { error: spErr } = await supabase
          .from("sales_pipeline")
          .upsert(
            {
              client_id,
              subscriber_id: String(subscriber_id),
              lead_name: subscriber_name || `Lead ${subscriber_id}`,
              stage: "calificacion",
              closed: false,
            },
            { onConflict: "client_id,subscriber_id", ignoreDuplicates: true }
          )
        if (spErr) console.error("[tag-event] sales_pipeline error:", JSON.stringify(spErr))
      } else if (tag === "agendado") {
        await supabase
          .from("sales_pipeline")
          .update({ stage: "llamada" })
          .eq("client_id", client_id)
          .eq("subscriber_id", String(subscriber_id))
      } else if (tag === "cerrado") {
        // Snapshot de todos los tags acumulados del subscriber
        const { data: allTags } = await supabase
          .from("subscriber_tags")
          .select("tag_name")
          .eq("client_id", client_id)
          .eq("subscriber_id", String(subscriber_id))
        const tagsList: string[] = (allTags ?? []).map((t: any) => t.tag_name)
        if (!tagsList.includes("cerrado")) tagsList.push("cerrado")

        await supabase
          .from("sales_pipeline")
          .update({
            stage: "cerrado",
            closed: true,
            call_date: new Date().toISOString().slice(0, 10),
            tags: tagsList,
          })
          .eq("client_id", client_id)
          .eq("subscriber_id", String(subscriber_id))
      }
    }

    console.log(`[tag-event] ${action} → ${tag} | subscriber: ${subscriber_id} | client: ${client_id}`)

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
    )
  } catch (err: any) {
    console.error("[tag-event] error:", err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    )
  }
})
