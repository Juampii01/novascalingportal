import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { buildClientContext, clientContextToText } from "@/lib/build-client-context"

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

// POST /api/smart-alert
// Body: { clientId, alertTitle, alertDescription, alertType }
// Returns: { recommendation: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientId, alertTitle, alertDescription, alertType } = body ?? {}

    if (!alertTitle || !alertDescription) {
      return NextResponse.json({ error: "Missing alertTitle or alertDescription" }, { status: 400 })
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Missing Supabase environment variables" }, { status: 500 })
    }

    // Build client context
    let contextText = ""
    if (clientId) {
      try {
        const ctx = await buildClientContext(clientId)
        contextText = clientContextToText(ctx)
      } catch {}
    }

    const prompt = [
      contextText ? contextText + "\n\n" : "",
      `=== ALERTA ACTIVA ===`,
      `Tipo: ${alertType === "danger" ? "CRÍTICA" : "ADVERTENCIA"}`,
      `Alerta: ${alertTitle}`,
      `Descripción: ${alertDescription}`,
      ``,
      `Eres el sistema de inteligencia estratégica de NOVA Scaling.`,
      `Genera una respuesta CONCRETA y ACCIONABLE en 2-3 pasos para resolver esta alerta HOY.`,
      `Formato: lista numerada, sin introducciones, directo al punto.`,
      `Máximo 120 palabras.`,
    ].join("\n")

    const supabase = getAdminSupabase()

    // Invoke ai-diagnosis-worker in synchronous mode to get a quick recommendation
    const { data: fnData, error: fnErr } = await supabase.functions.invoke("ai-diagnosis-worker", {
      body: {
        mode: "smart_alert",
        prompt,
        client_context: contextText,
      },
    })

    if (fnErr) {
      // Fallback: return static recommendation based on alert type
      const fallback = generateFallbackRecommendation(alertTitle, alertDescription)
      return NextResponse.json({ recommendation: fallback, source: "fallback" })
    }

    const recommendation =
      fnData?.result ??
      fnData?.content ??
      generateFallbackRecommendation(alertTitle, alertDescription)

    return NextResponse.json({ recommendation, source: "ai" })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Internal server error" }, { status: 500 })
  }
}

function generateFallbackRecommendation(title: string, description: string): string {
  const lower = (title + " " + description).toLowerCase()

  if (lower.includes("frecuencia") || lower.includes("creativo")) {
    return "1. Pausá el creativo con frecuencia ≥ 1.8 de inmediato.\n2. Duplicá el anuncio ganador con nueva imagen/copy.\n3. Reducí el presupuesto del creativo saturado al 20% mientras se estabiliza la frecuencia."
  }

  if (lower.includes("respuesta") || lower.includes("manychat")) {
    return "1. Revisá el mensaje de bienvenida del flow de ManyChat (primeras 3 respuestas).\n2. Probá un CTA más directo con pregunta de dolor específica.\n3. Desactivá cualquier delay de más de 30 minutos en el primer mensaje."
  }

  return "1. Identificá la causa raíz revisando los datos de los últimos 7 días.\n2. Tomá acción correctiva inmediata en el área más impactada.\n3. Monitoreá el indicador diariamente durante 3 días para confirmar mejora."
}
