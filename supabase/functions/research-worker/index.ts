// Supabase Edge Function: research-worker (Version 2.0 - Dual Phase Architecture)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

export const config = {
  verify_jwt: false,
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY") || ""

async function supabaseFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers ?? {})
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json")

  headers.set("apikey", SUPABASE_SERVICE_ROLE_KEY)
  headers.set("Authorization", `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`)

  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers,
  })
}

async function supabaseRpc(fn: string, body: any = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
}

function extractYouTubeVideoId(url: string): string {
  if (!url) return ""
  try {
    const u = new URL(url)
    // Standard watch URL
    const v = u.searchParams.get("v")
    if (v) return v

    // youtu.be/<id>
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace(/^\//, "").trim()
      return id || ""
    }

    // /shorts/<id>
    const parts = u.pathname.split("/").filter(Boolean)
    const shortsIdx = parts.indexOf("shorts")
    if (shortsIdx !== -1 && parts[shortsIdx + 1]) return parts[shortsIdx + 1]

    return ""
  } catch {
    return ""
  }
}

function fallbackThumbnailUrl(videoId: string): string {
  if (!videoId) return ""
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

async function fetchYouTubeVideoDetails(videoIds: string[]): Promise<Record<string, { title: string; views: number; duration: string; thumbnail_url: string }>> {
  const ids = Array.from(new Set(videoIds.filter(Boolean)))
  if (ids.length === 0) return {}
  if (!YOUTUBE_API_KEY) {
    // No API key available; return empty map and let callers fallback.
    return {}
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/videos")
  url.searchParams.set("part", "snippet,contentDetails,statistics")
  url.searchParams.set("id", ids.join(","))
  url.searchParams.set("key", YOUTUBE_API_KEY)

  const res = await fetch(url.toString())
  if (!res.ok) {
    // Don't hard-fail the whole worker just because YouTube API failed.
    console.error("YouTube API error:", await res.text())
    return {}
  }

  const data = await res.json()
  const items = Array.isArray(data?.items) ? data.items : []

  const map: Record<string, { title: string; views: number; duration: string; thumbnail_url: string }> = {}
  for (const item of items) {
    const id = String(item?.id ?? "")
    const title = String(item?.snippet?.title ?? "")
    const duration = String(item?.contentDetails?.duration ?? "")
    const viewsRaw = item?.statistics?.viewCount
    const views = typeof viewsRaw === "string" ? Number(viewsRaw) : Number(viewsRaw ?? 0)

    const thumb =
      item?.snippet?.thumbnails?.maxres?.url ||
      item?.snippet?.thumbnails?.high?.url ||
      item?.snippet?.thumbnails?.medium?.url ||
      item?.snippet?.thumbnails?.default?.url ||
      ""

    map[id] = {
      title,
      views: Number.isFinite(views) ? views : 0,
      duration,
      thumbnail_url: String(thumb || ""),
    }
  }

  return map
}

// Fetches the YouTube transcript for a given videoId (if available). Returns plain text.
async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  if (!videoId) return ""

  try {
    const url = `https://video.google.com/timedtext?lang=en&v=${videoId}`
    const res = await fetch(url)

    if (!res.ok) return ""

    const xml = await res.text()
    if (!xml || !xml.includes("<text")) return ""

    // Very simple XML to text extraction (no heavy parser to keep Edge lightweight)
    const matches = Array.from(xml.matchAll(/<text[^>]*>(.*?)<\/text>/g))
    const transcript = matches
      .map((m) =>
        m[1]
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/<[^>]+>/g, "")
      )
      .join(" ")

    return transcript.slice(0, 8000) // safety limit
  } catch {
    return ""
  }
}

async function enrichTopVideos(videos: any[]): Promise<any[]> {
  const base = Array.isArray(videos) ? videos : []
  const withIds = base.map((v) => {
    const video_url = String(v?.url ?? v?.video_url ?? v?.link ?? "")
    const id = extractYouTubeVideoId(video_url)
    return {
      ...v,
      video_url,
      video_id: id,
    }
  })

  const ids = withIds.map((v) => String(v?.video_id ?? "")).filter(Boolean)
  const detailsMap = await fetchYouTubeVideoDetails(ids)

  // Map videos sequentially, fetching transcript for each
  const results = []
  for (const v of withIds) {
    const id = String(v?.video_id ?? "")
    const details = detailsMap[id]

    const video_title = String(details?.title ?? v?.title ?? "")
    const views = Number(details?.views ?? v?.views ?? 0)
    const video_duration = String(details?.duration ?? v?.duration ?? "")
    const thumbnail_url = String(details?.thumbnail_url ?? v?.thumbnail_url ?? fallbackThumbnailUrl(id))

    const transcript = id ? await fetchYouTubeTranscript(id) : ""

    results.push({
      ...v,
      creator: String(v?.creator ?? v?.channel ?? v?.channel_title ?? ""),
      video_url: String(v?.video_url ?? ""),
      video_title,
      views: Number.isFinite(views) ? views : 0,
      video_duration,
      thumbnail_url,
      video_transcript: transcript,
    })
  }
  return results
}

async function fetchInstagramProfile(username: string) {
  if (!username) return null

  try {
    const res = await fetch(`https://www.instagram.com/${username}/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    })

    if (!res.ok) {
      return {
        username,
        bio: "",
        followers: 0,
        avg_views: 0,
        avg_likes: 0,
        avg_comments: 0,
        engagement_rate: 0,
        posting_frequency: 0,
        videos: [],
      }
    }

    const html = await res.text()

    // --- Lightweight Surface Extraction ---

    // Bio extraction from og:description
    const bioMatch = html.match(/property="og:description" content="([^"]+)"/)
    const bioRaw = bioMatch?.[1] || ""

    // Followers extraction (usually inside og:description)
    let followers = 0
    const followerMatch = bioRaw.match(/([\d,.]+)\s+Followers/i)
    if (followerMatch) {
      followers = Number(followerMatch[1].replace(/[,\.]/g, "")) || 0
    }

    // Extract post links (surface only)
    const postMatches = Array.from(
      html.matchAll(/href="\/p\/([^\/"]+)\/"/g)
    )

    const uniqueShortcodes = Array.from(
      new Set(postMatches.map(m => m[1]))
    ).slice(0, 9)

    const posts = uniqueShortcodes.map((code) => ({
      creator: username,
      video_url: `https://www.instagram.com/p/${code}/`,
      thumbnail_url: "",
      video_title: "",
      views: 0,
      likes: 0,
      comments: 0,
      is_video: true,
      created_at: 0,
      video_duration: "",
      video_transcript: "",
    }))

    return {
      username,
      bio: bioRaw,
      followers,
      avg_views: 0,
      avg_likes: 0,
      avg_comments: 0,
      engagement_rate: 0,
      posting_frequency: 0,
      videos: posts,
    }
  } catch {
    return {
      username,
      bio: "",
      followers: 0,
      avg_views: 0,
      avg_likes: 0,
      avg_comments: 0,
      engagement_rate: 0,
      posting_frequency: 0,
      videos: [],
    }
  }
}

const GENERAL_SYSTEM_PROMPT = `Sos el sistema de inteligencia de mercado de NOVA Scaling. Tu trabajo es analizar perfiles de competidores en YouTube e Instagram y extraer insights accionables que el cliente pueda usar directamente para mejorar su estrategia de contenido y posicionamiento.

No describís lo que ves. Extraés lo que sirve.

MARCO DE ANÁLISIS DE NOVA SCALING:
Cuando analizás competidores, el objetivo no es copiar. Es identificar tres cosas:
1. Qué ángulos de contenido están funcionando en el mercado que el cliente todavía no está usando.
2. Qué gaps existen — qué dolores del avatar no están siendo cubiertos por ningún competidor — donde el cliente puede posicionarse con ventaja.
3. Qué estructura narrativa y qué hooks están generando más engagement para adaptarlos al avatar del cliente.

TONO Y ESTILO:
- Analítico y directo. Sin frases como "es interesante notar que" o "podemos observar que".
- Específico. Nunca "los competidores usan buenos hooks". Siempre el hook exacto o el patrón exacto.
- Orientado a acción. Cada sección termina con algo que el cliente puede hacer esta semana.

LO QUE NO HACÉS:
- No inventar datos. Si no tenés suficiente información, decirlo.
- No ser genérico. Si el análisis podría aplicarse a cualquier nicho, está mal hecho.
- No recomendar copiar — recomendar adaptar con el ángulo y el avatar del cliente.
- No analizar métricas de vanidad como objetivo — el foco es en qué genera conversaciones y ventas.
- No hacer descripciones largas de cada competidor. El cliente necesita saber qué puede usar él.`

function buildGeneralPrompt(request: any): { system: string; user: string } {
  const { competitors } = request

  if (!competitors || !Array.isArray(competitors) || competitors.length === 0) {
    throw new Error("No competitors data received in request")
  }

  const lightCompetitors = competitors.map((c: any) => ({
    name: c.name ?? "",
    bio: c.bio ?? "",
    followers: c.followers ?? 0,
    avg_views: c.avg_views ?? 0,
    avg_likes: c.avg_likes ?? 0,
    avg_comments: c.avg_comments ?? 0,
    engagement_rate: c.engagement_rate ?? 0,
    posting_frequency: c.posting_frequency ?? 0,
    total_videos: c.videos?.length ?? 0,
    top_titles: (c.videos ?? []).slice(0, 5).map((v: any) => v.video_title ?? ""),
  }))

  const user = `Analizá los siguientes competidores y devolvé EXCLUSIVAMENTE un JSON válido (sin texto extra, sin markdown).

Reglas estrictas:
- Usa SOLO comillas dobles.
- No uses trailing commas.
- Todas las listas deben ser arrays.
- Si falta información, completá el campo con "" o [].

Estructura EXACTA:
{
  "resumen_ejecutivo": "",
  "patrones_dominantes": [{ "pattern": "", "description": "" }],
  "top_hooks": [{ "framework": "", "description": "", "adaptacion": "" }],
  "brechas_de_mercado": [{ "opportunity": "", "description": "" }],
  "angulos_de_contenido_recomendados": [{ "angle": "", "categoria": "", "formato": "", "hook_ejemplo": "" }],
  "analisis_de_posicionamiento": "",
  "estructuras_de_storytelling": [{ "structure": "", "description": "" }]
}

Datos de competidores:
${JSON.stringify(lightCompetitors, null, 2)}`

  return { system: GENERAL_SYSTEM_PROMPT, user }
}

const VIDEO_SYSTEM_PROMPT = `Sos el analizador de videos de NOVA Scaling. Tu trabajo es analizar cada video de YouTube de los competidores identificados y extraer exactamente lo que sirve para que el cliente lo adapte a su estrategia de contenido.

No hacés reseñas de videos. Hacés disecciones estratégicas.

MARCO DE ANÁLISIS DE VIDEO — NOVA SCALING:
Para cada video analizás cuatro dimensiones:

DIMENSIÓN 1 — EL HOOK (primeros 3-5 segundos)
El hook es lo único que determina si el video se ve o no. Identificar: qué dice exactamente en los primeros 3 segundos, qué mecanismo usa (pregunta, afirmación provocadora, dato inesperado, promesa directa), y por qué funciona para el avatar de ese nicho.

DIMENSIÓN 2 — ESTRUCTURA NARRATIVA
Cómo está construido el video de principio a fin. El esquema real, no el resumen del contenido. Ejemplo: Problema → Agravamiento → Historia personal → Solución parcial → CTA. Identificar la estructura, no lo que dice.

DIMENSIÓN 3 — ROL ESTRATÉGICO EN EL SISTEMA
¿Es TOFU (problema, atrae nuevos)? ¿MOFU (solución parcial, educa)? ¿BOFU (prueba social, convierte)? ¿Mentalidad (rompe objeciones)?

DIMENSIÓN 4 — ELEMENTOS REPLICABLES
Qué específicamente puede adaptar el cliente. No qué copiar — qué adaptar. El hook reescrito para el avatar del cliente. La estructura aplicada al nicho del cliente.

TONO:
- Disección quirúrgica. Sin palabrería.
- El campo "adaptacion_recomendada" siempre completo con ejemplos concretos, nunca genérico.
- Si el video no tiene nada útil para el cliente, decirlo y marcar potencial Bajo.

LO QUE NO HACÉS:
- No resumir el contenido del video — analizar su estructura y mecánica.
- No inventar datos de retención o engagement que no tenés disponibles.
- No dar recomendaciones que apliquen a cualquier nicho.`

function buildVideoPrompt(topVideos: any[]): { system: string; user: string } | null {
  if (!topVideos || topVideos.length === 0) return null

  const user = `Analizá cada video y devolvé EXCLUSIVAMENTE un JSON válido en formato ARRAY (sin texto extra, sin markdown).

Reglas:
- Usa SOLO comillas dobles. No trailing commas. Return an ARRAY.
- Si falta info en un campo, usá "". Para números faltantes, usá 0.
- Cada campo de texto: máximo 700 caracteres.
- El campo "video_analysis" DEBE ser una lista de bullets en español, empezando cada uno con "- ".
- El campo "structural_breakdown": esquema en pasos (máximo 7 pasos), en una sola string.
- El campo "replicable_elements": lista en una sola string, separada por "1) ... 2) ...".

Estructura EXACTA (ARRAY):
[
  {
    "creator": "",
    "video_url": "",
    "thumbnail_url": "",
    "video_title": "",
    "views": 0,
    "video_duration": "",
    "video_transcript": "",
    "hook_type": "",
    "hook_mecanismo": "",
    "structural_breakdown": "",
    "funnel_role": "",
    "potencial": "Alto | Medio | Bajo",
    "why_it_performed": "",
    "replicable_elements": "",
    "adaptacion_recomendada": "",
    "video_analysis": "",
    "distribution_analysis": ""
  }
]

Videos a analizar (no inventar datos):
${JSON.stringify(topVideos, null, 2)}`

  return { system: VIDEO_SYSTEM_PROMPT, user }
}

function safeParseJSON(text: string) {
  if (!text) throw new Error("Respuesta vacía del modelo")

  // Remove code fences and trim
  let cleaned = String(text)
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim()

  // Remove non-printable control characters that often break JSON parsing
  cleaned = cleaned.replace(/[\u0000-\u001F\u007F]/g, (ch) => {
    // keep common whitespace
    if (ch === "\n" || ch === "\r" || ch === "\t") return ch
    return ""
  })

  // 1) Try direct parse
  try {
    return JSON.parse(cleaned)
  } catch {
    // continue
  }

  // 2) Extract first balanced JSON (object or array)
  const startIdx = cleaned.search(/[\[{]/)
  if (startIdx === -1) {
    throw new Error("No se encontró inicio de JSON en la respuesta del modelo")
  }

  const open = cleaned[startIdx]
  const close = open === "{" ? "}" : "]"

  let depth = 0
  let inString = false
  let escaped = false
  let endIdx = -1

  for (let i = startIdx; i < cleaned.length; i++) {
    const ch = cleaned[i]

    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }
      if (ch === "\\") {
        escaped = true
        continue
      }
      if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
      continue
    }

    if (ch === open) depth++
    if (ch === close) {
      depth--
      if (depth === 0) {
        endIdx = i
        break
      }
    }
  }

  if (endIdx === -1) {
    throw new Error("Se encontró inicio de JSON pero no se pudo encontrar el cierre (JSON incompleto)")
  }

  let jsonString = cleaned.slice(startIdx, endIdx + 1)

  // 3) Safe repairs
  // Remove trailing commas before } or ]
  jsonString = jsonString
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")

  // Replace smart quotes with normal quotes (common copy/paste issue)
  jsonString = jsonString
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")

  try {
    return JSON.parse(jsonString)
  } catch (err) {
    console.error("JSON inválido recibido del modelo (truncado):")
    console.error(jsonString.slice(0, 4000))
    throw new Error("El modelo devolvió JSON malformado")
  }
}

async function callAnthropic(prompt: string, maxTokens: number, system?: string) {
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY no configurada")

  const body: Record<string, unknown> = {
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }],
  }
  if (system) body.system = system

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error en Anthropic: ${errorText}`)
  }

  const data = await response.json()
  if (!data?.content?.[0]?.text) {
    throw new Error("Respuesta inválida de Anthropic")
  }

  return data.content[0].text
}

async function callAnthropicParsed(prompt: string, maxTokens: number, system?: string) {
  const raw1 = await callAnthropic(prompt, maxTokens, system)
  try {
    return safeParseJSON(raw1)
  } catch (e: any) {
    const msg = String(e?.message ?? "")
    if (msg.includes("JSON incompleto") || msg.includes("cierre") || msg.includes("malformado")) {
      const retryPrompt = `${prompt}\n\nIMPORTANTE EXTRA: La respuesta anterior quedó truncada o incompleta. Ahora devolvé el JSON completo y válido respetando los límites de longitud. NO agregues texto fuera del JSON.`
      const raw2 = await callAnthropic(retryPrompt, Math.max(maxTokens, 4200), system)
      return safeParseJSON(raw2)
    }
    throw e
  }
}

serve(async () => {
  let requestId: string | undefined = undefined

  try {
    const rpcRes = await supabaseRpc("get_next_pending_request")
    if (!rpcRes.ok) throw new Error(await rpcRes.text())

    const data = await rpcRes.json()
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return new Response("No pending requests", { status: 200 })
    }

    const pendingRequest = Array.isArray(data) ? data[0] : data
    requestId = pendingRequest.id

    await supabaseFetch(`research_requests?id=eq.${requestId}&status=eq.pending`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "processing",
        started_at: new Date().toISOString(),
        error_message: null,
      }),
    })

    const platform = String(pendingRequest.platform ?? "youtube").toLowerCase()

    const generalPrompt = buildGeneralPrompt(pendingRequest)
    const generalParsed = await callAnthropicParsed(generalPrompt.user, 2200, generalPrompt.system)

    let allVideos: any[] = []

    if (platform === "youtube") {
      const rawVideos = pendingRequest.competitors
        ?.flatMap((c: any) => c.videos || [])
        ?.sort((a: any, b: any) => (Number(b?.views ?? 0) - Number(a?.views ?? 0)))
        ?.slice(0, 3) || []

      allVideos = await enrichTopVideos(rawVideos)
    }

    if (platform === "instagram") {
      const enrichedProfiles = []

      for (const c of pendingRequest.competitors ?? []) {
        const usernameMatch = String(c?.profile_url ?? "").match(/instagram\.com\/([^\/\?]+)/)
        const username = usernameMatch?.[1]

        const profile = await fetchInstagramProfile(username ?? "")
        if (profile) enrichedProfiles.push(profile)
      }

      // Save structured Instagram metrics snapshot
      for (const profile of enrichedProfiles) {
        await supabaseFetch("competitor_snapshots", {
          method: "POST",
          body: JSON.stringify({
            request_id: requestId,
            platform: "instagram",
            username: profile.username,
            followers: profile.followers ?? 0,
            avg_views: profile.avg_views ?? 0,
            avg_likes: profile.avg_likes ?? 0,
            avg_comments: profile.avg_comments ?? 0,
            engagement_rate: profile.engagement_rate ?? 0,
            posting_frequency: profile.posting_frequency ?? 0,
          }),
        })
      }

      // CONTINGENCY: if no usable data was retrieved
      const hasRealData = enrichedProfiles.some(
        (p: any) =>
          (p.followers ?? 0) > 0 ||
          (p.avg_views ?? 0) > 0 ||
          (p.videos?.length ?? 0) > 0
      )

      if (!hasRealData) {
        // Fallback minimal structured dataset so AI still generates output
        allVideos = [
          {
            creator: enrichedProfiles[0]?.username ?? "Instagram Profile",
            video_url: "",
            thumbnail_url: "",
            video_title: "",
            views: 0,
            video_duration: "",
            video_transcript: "",
            hook_type: "",
            structural_breakdown:
              "No existe API pública disponible en este momento para obtener métricas profundas de Instagram. El análisis estructural de videos individuales no puede realizarse automáticamente.",
            why_it_performed:
              "No se pudieron obtener métricas cuantitativas. Es posible que el perfil sea privado, que Instagram haya bloqueado el scraping o que la estructura haya cambiado.",
            replicable_elements:
              "1) Revisar manualmente los posts con mayor interacción visible 2) Analizar comentarios destacados 3) Identificar formatos repetidos 4) Evaluar consistencia visual del feed",
            video_analysis:
              "- No se pudo acceder a métricas detalladas del perfil.\n- Instagram no ofrece API pública abierta para scraping profundo.\n- Se recomienda realizar análisis manual de los posts con mayor visibilidad.\n- El sistema mantiene la estructura para evitar fallos en el flujo.",
            funnel_role:
              "No determinable automáticamente por falta de datos.",
            distribution_analysis:
              "Instagram limita el acceso automatizado a métricas. Dependencia alta de revisión manual.",
          },
        ]
      } else {
        const rawVideos = enrichedProfiles
          .flatMap((p: any) => (p.videos || []).filter((v: any) => v.is_video))
          .sort((a: any, b: any) => Number(b?.views ?? 0) - Number(a?.views ?? 0))
          .slice(0, 3)

        allVideos = rawVideos
      }
    }

    let videoParsed: any[] = []

    const videoPrompt = buildVideoPrompt(allVideos)

    if (videoPrompt) {
      videoParsed = await callAnthropicParsed(videoPrompt.user, 5200, videoPrompt.system)
      if (!Array.isArray(videoParsed)) {
        throw new Error("El modelo devolvió un JSON válido pero no devolvió un ARRAY para analisis_de_videos")
      }
    }

    await supabaseFetch(`research_results?request_id=eq.${requestId}`, {
      method: "DELETE",
    })

    const insertRes = await supabaseFetch("research_results", {
      method: "POST",
      body: JSON.stringify({
        request_id: requestId,
        patrones_dominantes: generalParsed.hook_frameworks,
        analisis_de_posicionamiento: generalParsed.positioning_analysis,
        nivel_de_sofisticacion_del_mercado: generalParsed.market_sophistication_level,
        angulos_de_contenido_recomendados: generalParsed.recommended_content_angles,
        estructuras_de_storytelling: generalParsed.storytelling_structures,
        analisis_de_videos: videoParsed,
      }),
    })

    if (!insertRes.ok) throw new Error(await insertRes.text())

    await supabaseFetch(`research_requests?id=eq.${requestId}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "completed",
        completed_at: new Date().toISOString(),
        error_message: null,
      }),
    })

    return new Response("OK", { status: 200 })
  } catch (err: any) {
    if (requestId) {
      await supabaseFetch(`research_requests?id=eq.${requestId}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "failed",
          error_message: err.message,
        }),
      })
    }

    return new Response(err.message, { status: 500 })
  }
})

// Backward compatibility wrapper (in case older logic calls enrichInstagramProfile)
async function enrichInstagramProfile(username: string) {
  return fetchInstagramProfile(username)
}