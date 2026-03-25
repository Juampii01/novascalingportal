import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const SYSTEM_PROMPT = `Sos el parser de contenido de NOVA Scaling. Tu trabajo es convertir texto libre en piezas de contenido estructuradas. Devolvés ÚNICAMENTE JSON válido, sin texto extra, sin markdown, sin comentarios.

CATEGORÍAS (exactamente una):
- Problema: diagnostica un dolor del avatar. No enseña cómo resolverlo. Único tipo que va a Follow Me Ads.
- Solución: muestra el camino correcto sin revelar el cómo completo.
- Producto: resultados reales, casos de éxito, transformaciones con números.
- Mentalidad: rompe creencias limitantes, rebate objeciones, genera urgencia.

FORMATOS (exactamente uno):
- Talking Head: video directo a cámara. Para Mentalidad y Problema de alto impacto.
- Carrusel: slides. Para Solución (pasos) y Producto (antes/después).
- Pregunta-Respuesta: video con texto en pantalla que funciona en mute.
- Story: Instagram Stories. Para generar respuestas y conversaciones.

REGLA ADS: ads_candidate es true SOLO si: categoría es Problema, el gancho nombra un dolor específico en los primeros 3 segundos, no menciona el servicio ni hace CTA de venta, funciona con tráfico frío. Si no cumple los 4, false.

DISTRIBUCIÓN CORRECTA: 50% Problema, 20% Producto, 15% Solución, 15% Mentalidad.

Devolvé este JSON exacto (sin trailing commas, solo comillas dobles):
{
  "pieces": [
    {
      "day": "Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo",
      "slot": "AM|PM",
      "title": "título descriptivo máximo 60 caracteres",
      "category": "Problema|Solución|Producto|Mentalidad",
      "format": "Talking Head|Carrusel|Pregunta-Respuesta|Story",
      "hook": "las primeras palabras exactas que abren el contenido",
      "angle": "el ángulo que trabaja esta pieza",
      "ads_candidate": true,
      "ads_candidate_reason": "por qué sí o no cumple los 4 criterios",
      "status": "borrador",
      "notes": "instrucciones de producción si aplica, sino string vacío"
    }
  ],
  "week_summary": {
    "total_pieces": 0,
    "by_category": { "Problema": 0, "Solucion": 0, "Producto": 0, "Mentalidad": 0 },
    "distribution_check": "OK|AJUSTAR",
    "distribution_note": "si AJUSTAR: qué falta o sobra, sino string vacío"
  }
}`

export async function POST(req: NextRequest) {
  try {
    const { rawText } = await req.json()

    if (!rawText?.trim()) {
      return NextResponse.json({ error: "Texto vacío." }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY no configurada." }, { status: 500 })
    }

    const client = new Anthropic({ apiKey })

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Parseá el siguiente plan de contenido y devolvé el JSON:\n\n${rawText}`,
        },
      ],
    })

    const raw = response.content[0].type === "text" ? response.content[0].text : ""

    // Clean and parse JSON
    let cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()
    const start = cleaned.search(/\{/)
    const end = cleaned.lastIndexOf("}")
    if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1)

    // Limpieza automática: si falta cierre de array y week_summary
    if (cleaned.match(/"pieces"\s*:\s*\[[\s\S]*$/) && !/\],\s*"week_summary"/.test(cleaned)) {
      // Buscar el último objeto del array
      const lastObj = cleaned.lastIndexOf("}")
      if (lastObj !== -1) {
        // Insertar cierre de array y week_summary si week_summary está en el texto
        const weekSummaryMatch = cleaned.match(/"week_summary"\s*:\s*\{[\s\S]*$/)
        if (weekSummaryMatch) {
          const before = cleaned.slice(0, lastObj + 1)
          const after = cleaned.slice(lastObj + 1)
          cleaned = before + "]" + after
        }
      }
      // Si aún falta el cierre final, agregarlo
      if (!cleaned.trim().endsWith("}")) {
        cleaned += "}"
      }
    }

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch (parseError) {
      return NextResponse.json({
        error: `Error al parsear JSON: ${(parseError instanceof Error ? parseError.message : parseError)}`,
        raw: cleaned
      }, { status: 500 })
    }

    return NextResponse.json({
      pieces: parsed.pieces ?? [],
      week_summary: parsed.week_summary ?? null,
    })
  } catch (error: unknown) {
    console.error("[parse-content]", error)
    const message = error instanceof Error ? error.message : "Error inesperado."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
