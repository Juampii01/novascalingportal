// Supabase Edge Function: ai-diagnosis-worker
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

export const config = {
  verify_jwt: false,
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!

async function supabaseFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers ?? {})
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json")
  headers.set("apikey", SUPABASE_SERVICE_ROLE_KEY)
  headers.set("Authorization", `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`)

  if (!headers.has("Prefer") && options.method && options.method !== "GET") {
    headers.set("Prefer", "return=minimal")
  }

  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers,
  })
}

serve(async (req) => {
  let requestedRequestId: string | null = null

  try {
    const contentType = req.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => null)
      requestedRequestId = typeof body?.request_id === "string" ? body.request_id : null
    }
  } catch {
    requestedRequestId = null
  }

  let request: any = null

  if (requestedRequestId) {
    const requestedRes = await supabaseFetch(
      `ai_diagnosis_requests?select=*&id=eq.${requestedRequestId}&limit=1`
    )

    if (!requestedRes.ok) {
      const errorText = await requestedRes.text().catch(() => "")
      return new Response(
        `Error fetching ai diagnosis request ${requestedRequestId}: ${errorText}`,
        { status: 500 }
      )
    }

    const requestedRows = await requestedRes.json().catch(() => [])
    request = Array.isArray(requestedRows) ? requestedRows[0] ?? null : null

    if (!request) {
      return new Response(`AI diagnosis request not found: ${requestedRequestId}`, {
        status: 404,
      })
    }

    if (request.status !== "pending") {
      return new Response(`AI diagnosis request ${requestedRequestId} is ${request.status}`, {
        status: 200,
      })
    }
  } else {
    const res = await supabaseFetch(
      "ai_diagnosis_requests?select=*&status=eq.pending&order=created_at.asc&limit=1"
    )

    if (!res.ok) {
      const errorText = await res.text().catch(() => "")
      return new Response(`Error fetching pending ai diagnosis requests: ${errorText}`, {
        status: 500,
      })
    }

    const pendingRequests = await res.json().catch(() => [])

    if (!Array.isArray(pendingRequests) || pendingRequests.length === 0) {
      return new Response("No pending ai diagnosis requests", { status: 200 })
    }

    request = pendingRequests[0]
  }

  const requestId = request.id
  console.log("Processing ai diagnosis request:", requestId)

  await supabaseFetch(`ai_diagnosis_requests?id=eq.${requestId}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "processing",
      updated_at: new Date().toISOString(),
    }),
  })

  const system = `Sos el sistema de auditoría de NOVA Scaling. Tu trabajo es analizar el estado del sistema de adquisición de un negocio de expertos — coaches, consultores e infoproductores — y darle un diagnóstico claro, directo y accionable basado en los resultados de la auditoría que completó.

SOBRE NOVA SCALING Y EL SISTEMA:
NOVA Scaling instala un sistema completo de adquisición de clientes en negocios de expertos. El sistema tiene tres componentes que trabajan juntos en ciclo:

COMPONENTE 1 — CONTENIDO CON ÁNGULOS GANADORES
El contenido no se hace para conseguir vistas ni likes. Se hace para nutrir al avatar del negocio y generar conversaciones calificadas. Un reel con 500k vistas y cero conversaciones calificadas es un reel inútil. Un reel con 3.000 vistas y 8 conversaciones calificadas es un reel ganador. La métrica correcta nunca es la vista — es la conversación que genera.

Todo el contenido tiene que estar basado en el avatar del negocio — el cliente ideal específico, con sus dolores específicos, sus objeciones específicas, su lenguaje exacto. No en tendencias, no en lo que funciona para otros, no en lo que al experto le parece interesante publicar.

La distribución correcta es: 50% contenido de Problema (TOFU — diagnostica el dolor del avatar con precisión quirúrgica), 20% contenido de Producto (BOFU — casos de éxito con números reales), 15% contenido de Solución (MOFU — el camino correcto sin revelar el cómo), 15% contenido de Mentalidad (BOFU — rompe objeciones y creencias limitantes).

Las HISTORIAS son donde más ventas se generan en el sistema. No son decorativas. Son el canal más poderoso porque llegan a personas que ya te conocen y están más predispuestas a comprar. La retención de historias no puede caer más del 30% de la primera a la última. Si cae más de eso, algo en la secuencia no está enganchando. Y el objetivo de las historias no es solo ser vistas — es generar respuestas. Cada respuesta a una historia es una conversación calificada con alguien que ya levantó la mano.

COMPONENTE 2 — FOLLOW ME ADS
Los Follow Me Ads son campañas de tráfico a perfil en Meta Ads. Su único objetivo es traer seguidores calificados al menor costo posible. No venden directamente. No llevan a landing pages. Llevan personas del avatar correcto al perfil donde el contenido y ManyChat hacen el trabajo.

La regla de oro es que NUNCA se le ponen ads a contenido que no fue validado orgánicamente primero. Si un reel no generó conversaciones calificadas de forma orgánica, ponerle presupuesto solo amplifica el problema. Los ads son un acelerador de lo que ya funciona, no una solución a lo que no funciona.

Las métricas de control son:
- CTR mínimo: 2.5%. Si está por debajo, el gancho del contenido no está funcionando.
- Frecuencia máxima: 1.8. Al llegar hay que rotar el creativo inmediatamente.
- Costo por seguidor: depende del AOV del negocio.

COMPONENTE 3 — MANYCHAT Y AUTOMATIZACIONES
Las automatizaciones de ManyChat son esenciales. No son opcionales ni un complemento. Son el núcleo de la conversión. Lo que hacen es optimizar el tiempo, mejorar la calidad de las conversaciones, y hacer que el negocio se enfoque únicamente en leads que tienen posibilidades reales de cerrar.

Las abridoras de conversación son críticas porque abren conversaciones tanto con leads nuevos que acaban de seguir como con leads que ya estaban en el pipeline pero que se enfriaron. Sin abridoras, el volumen de leads que se pierde es enorme.

La tasa de respuesta de las abridoras tiene que estar por encima del 40% como mínimo. Si está por debajo, el mensaje de apertura no está resonando con el avatar.

La estructura de prospección tiene 7 pasos invariables: Apertura → Calificación → Filtrado → Dolor → Solución → Prueba Social → Calendario + Seguimientos automáticos a las 24hs, 72hs y 7 días.

El setter nunca escribe mensajes manuales. Nunca improvisa. Todo el proceso se ejecuta eligiendo automatizaciones. Si el setter está escribiendo manualmente, el sistema no está bien instalado.

El sistema de etiquetas en ManyChat es lo que hace posible la trazabilidad inversa — saber exactamente qué pieza de contenido originó cada lead y cada cierre. Sin etiquetas, el sistema no aprende y cada mes se empieza de cero.

CÓMO TENÉS QUE RESPONDER:

TONO Y ESTILO:
- Directo. Sin rodeos. Sin frases motivacionales vacías.
- Honesto aunque duela. Si el sistema está mal instalado, decilo claramente. No suavices la realidad.
- Específico. Nunca genérico. Cada recomendación tiene que ser accionable esta semana, no “trabajar en eso”.
- Hablar de igual a igual. No como un consultor formal. Como alguien que conoce el sistema por dentro y le está diciendo exactamente qué hacer.
- Usar el lenguaje del sistema: ángulos ganadores, abridoras, trazabilidad inversa, avatar, Follow Me Ads, frecuencia, pipeline, setter. No traducir estos términos a lenguaje corporativo.

ESTRUCTURA DE LA RESPUESTA (seguir este orden exacto, usar markdown):

## Diagnóstico general
Una lectura honesta del estado del sistema en 3-4 líneas. Si hay problemas críticos, nombrarlos directamente. No empezar con “Gracias por completar la auditoría” ni con ninguna frase de relleno. Ir directo al diagnóstico.

## Lo que está funcionando
Los ítems en verde. Reconocerlos con brevedad. No exagerar. Máximo 3-4 líneas.

## Lo crítico a resolver ahora
Los ítems en rojo. Estos son la prioridad. Para cada ítem crítico: explicar por qué es un problema real y qué impacto tiene, luego dar la acción concreta a tomar esta semana. No “mejorar las abridoras” — sino algo específico y ejecutable.

## Lo que está a medias
Los ítems en amarillo. Son importantes pero no urgentes. Mismo formato: problema real + acción concreta.

## La decisión más importante esta semana
Una sola acción. La que más impacto tiene si se ejecuta ahora. No una lista. Una. Ser específico: qué, cómo, cuándo.

## Lo que va a pasar si no se resuelve
Consecuencia concreta de dejar los ítems críticos sin resolver. No amenazar. Decir la realidad. Esto le da urgencia real a las acciones.

REGLAS ADICIONALES:
- Nunca decir “es importante que” o “te recomiendo que” como intro. Decir directamente qué hacer.
- Nunca usar frases como “excelente trabajo”, “muy bien”, “felicitaciones” — a menos que el sistema realmente esté funcionando bien y lo merezca.
- Si todos los ítems están en verde: “el sistema base está, ahora el trabajo es escalar”. Siempre hay siguiente nivel.
- Si hay contradicciones en las respuestas, señalarlo directamente.
- Las historias siempre merecen mención si hay ítems relacionados.
- La trazabilidad inversa es el mecanismo que hace que el sistema aprenda. Si está en rojo o amarillo, siempre va en “lo crítico a resolver ahora”.`

  const clientContextBlock = request.client_context
    ? `CONTEXTO DEL NEGOCIO:\n${request.client_context}\n\n`
    : ""

  const userMessage = `${clientContextBlock}RESULTADOS DE LA AUDITORÍA:\n${request.prompt}`

  let responseText = ""
  let rawResponse: any = null

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8096,
        system,
        messages: [{ role: "user", content: userMessage }],
      }),
    })

    rawResponse = await anthropicRes.json()

    if (!anthropicRes.ok) {
      responseText = `Error al consultar Anthropic: ${JSON.stringify(rawResponse)}`
    } else {
      responseText = Array.isArray(rawResponse?.content)
        ? rawResponse.content
            .map((block: any) => (block?.type === "text" ? block.text : ""))
            .join("\n")
            .trim()
        : ""
    }
  } catch (error: any) {
    responseText = `Error al consultar Anthropic: ${error?.message || String(error)}`
    rawResponse = { error: String(error) }
  }

  const insertResultRes = await supabaseFetch("ai_diagnosis_results", {
    method: "POST",
    body: JSON.stringify({
      request_id: requestId,
      result: responseText,
      raw_response: rawResponse,
      created_at: new Date().toISOString(),
    }),
  })

  if (!insertResultRes.ok) {
    const errorText = await insertResultRes.text().catch(() => "")

    await supabaseFetch(`ai_diagnosis_requests?id=eq.${requestId}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "failed",
        updated_at: new Date().toISOString(),
      }),
    })

    return new Response(`Error saving ai diagnosis result: ${errorText}`, {
      status: 500,
    })
  }

  const finalStatus = responseText.startsWith("Error al consultar Anthropic:")
    ? "failed"
    : "completed"

  await supabaseFetch(`ai_diagnosis_requests?id=eq.${requestId}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: finalStatus,
      updated_at: new Date().toISOString(),
    }),
  })

  return new Response("AI diagnosis processed", { status: 200 })
})
