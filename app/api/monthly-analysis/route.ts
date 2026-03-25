import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Anthropic from "@anthropic-ai/sdk"
import { buildClientContext, clientContextToText } from "@/lib/build-client-context"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
// Allow up to 60s for AI generation
export const maxDuration = 60

const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

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

// ─── GET /api/monthly-analysis?client_id=...&month=3&year=2026 ───────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get("client_id")
    const month    = searchParams.get("month")
    const year     = searchParams.get("year")

    if (!clientId || !month || !year) {
      return NextResponse.json({ error: "Missing client_id, month or year" }, { status: 400 })
    }

    const supabase = getAdminSupabase()
    const { data, error } = await supabase
      .from("monthly_analysis")
      .select("*")
      .eq("client_id", clientId)
      .eq("month", Number(month))
      .eq("year",  Number(year))
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data ?? null })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Internal server error" }, { status: 500 })
  }
}

// ─── POST /api/monthly-analysis ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientId, month, year } = body ?? {}

    if (!clientId || !month || !year) {
      return NextResponse.json({ error: "Missing clientId, month or year" }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Missing ANTHROPIC_API_KEY" }, { status: 500 })
    }

    const supabase = getAdminSupabase()

    // Mark as pending while generating
    await supabase.from("monthly_analysis").upsert(
      { client_id: clientId, month: Number(month), year: Number(year), status: "pending", updated_at: new Date().toISOString() },
      { onConflict: "client_id,month,year" }
    )

    // ── Build context ────────────────────────────────────────────────────────
    let contextText = ""
    try {
      const ctx = await buildClientContext(clientId)
      contextText = clientContextToText(ctx)
    } catch {}

    // ── Fetch this month's sales pipeline data ───────────────────────────────
    let salesContext = ""
    try {
      const monthStr = String(month).padStart(2, "0")
      const from = `${year}-${monthStr}-01`
      const toDate = new Date(Number(year), Number(month), 0)
      const to = `${year}-${monthStr}-${String(toDate.getDate()).padStart(2, "0")}`

      const { data: leads } = await supabase
        .from("sales_pipeline")
        .select("lead_name, stage, call_date, attended, closed, amount, origin_angle, origin_category")
        .eq("client_id", clientId)
        .gte("call_date", from)
        .lte("call_date", to)

      if (leads && leads.length > 0) {
        const closed = leads.filter((l: any) => l.closed)
        const totalRevenue = closed.reduce((s: number, l: any) => s + Number(l.amount ?? 0), 0)
        const attended = leads.filter((l: any) => l.attended)
        const attendanceRate = leads.length > 0 ? Math.round((attended.length / leads.length) * 100) : 0

        const angleGroups: Record<string, { closes: number; revenue: number }> = {}
        for (const l of closed) {
          const angle = (l.origin_angle as string) || "Sin ángulo"
          if (!angleGroups[angle]) angleGroups[angle] = { closes: 0, revenue: 0 }
          angleGroups[angle].closes++
          angleGroups[angle].revenue += Number(l.amount ?? 0)
        }

        const topAngles = Object.entries(angleGroups)
          .sort((a, b) => b[1].revenue - a[1].revenue)
          .slice(0, 3)
          .map(([angle, data]) => `${angle}: ${data.closes} cierres, $${data.revenue.toLocaleString("es-AR")}`)

        salesContext = [
          `\n=== VENTAS DEL MES (${MONTH_NAMES[Number(month) - 1]} ${year}) ===`,
          `Total leads en pipeline: ${leads.length}`,
          `Asistencia a llamadas: ${attendanceRate}%`,
          `Cierres totales: ${closed.length}`,
          `Revenue total pipeline: $${totalRevenue.toLocaleString("es-AR")}`,
          topAngles.length > 0 ? `Ángulos con mayor revenue:\n${topAngles.map(a => `  - ${a}`).join("\n")}` : "",
        ].filter(Boolean).join("\n")
      }
    } catch {}

    // ── Prompt ───────────────────────────────────────────────────────────────
    const fullContext = [contextText, salesContext].filter(Boolean).join("\n")

    const prompt = `${fullContext ? fullContext + "\n\n" : ""}Generá el análisis mensual de ${MONTH_NAMES[Number(month) - 1]} ${year} para este cliente de NOVA Scaling.

Responde ÚNICAMENTE con un JSON válido, sin texto adicional, con esta estructura exacta:
{
  "analysis_text": "Análisis narrativo del mes en 3-4 párrafos. Diagnóstico honesto del sistema: qué funcionó, qué no, y cuál es el estado real del negocio este mes. Tono directo, sin rodeos.",
  "key_insights": [
    { "insight": "Texto del insight concreto y específico", "type": "positive" },
    { "insight": "Texto del insight", "type": "negative" },
    { "insight": "Texto del insight", "type": "neutral" }
  ],
  "recommendations": [
    { "action": "Acción concreta y ejecutable para la próxima semana", "priority": "alta" },
    { "action": "Acción concreta", "priority": "media" },
    { "action": "Acción concreta", "priority": "baja" }
  ]
}

Reglas:
- Entre 4 y 7 key_insights (mezcla de positive/negative/neutral según los datos reales)
- Entre 3 y 5 recommendations ordenadas por prioridad real
- analysis_text debe ser sustancioso: 150-250 palabras, con datos específicos del mes
- Si no hay datos suficientes, decilo honestamente en el analysis_text
- Cada recommendation debe ser ejecutable esta semana, no genérica`

    // ── Call Claude ──────────────────────────────────────────────────────────
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: `Sos el sistema de inteligencia operativa de NOVA Scaling. Analizás los KPIs mensuales de expertos (coaches, consultores, infoproductores) que escalan con contenido, Follow Me Ads y ManyChat. Sos directo, específico, y usás el lenguaje del sistema: ángulos ganadores, trazabilidad, pipeline, setter, abridoras, avatar. Nunca genérico. Nunca motivacional vacío. Solo datos y acción.`,
      messages: [{ role: "user", content: prompt }],
    })

    const rawText = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim()

    // ── Parse JSON response ──────────────────────────────────────────────────
    let parsed: {
      analysis_text: string
      key_insights: { insight: string; type: string }[]
      recommendations: { action: string; priority: string }[]
    } | null = null

    try {
      // Extract JSON from possible markdown code block
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
    } catch {}

    const analysisText  = parsed?.analysis_text ?? rawText
    const keyInsights   = Array.isArray(parsed?.key_insights) ? parsed!.key_insights : []
    const recommendations = Array.isArray(parsed?.recommendations) ? parsed!.recommendations : []

    // ── Save to DB ───────────────────────────────────────────────────────────
    const { error: upsertErr } = await supabase.from("monthly_analysis").upsert(
      {
        client_id: clientId,
        month: Number(month),
        year: Number(year),
        status: "completed",
        analysis_text: analysisText,
        key_insights: keyInsights,
        recommendations,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id,month,year" }
    )

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        status: "completed",
        analysis_text: analysisText,
        key_insights: keyInsights,
        recommendations,
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Internal server error" }, { status: 500 })
  }
}
