import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { topic, slideCount = 5, tone = "educativo", cta = "comentá" } = body

    if (!topic) return NextResponse.json({ error: "Missing topic" }, { status: 400 })
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "Missing ANTHROPIC_API_KEY" }, { status: 500 })

    const toneMap: Record<string, string> = {
      educativo:   "educativo y claro, como un mentor que explica con ejemplos concretos",
      provocador:  "provocador y directo, cuestionando creencias comunes con hechos",
      testimonial: "basado en resultados reales y transformaciones de clientes",
      tutorial:    "paso a paso, muy concreto, con instrucciones accionables",
    }

    const ctaMap: Record<string, string> = {
      "comentá": "COMENTÁ QUÉ TE RESUENA →",
      "guardá":  "GUARDÁ ESTO PARA DESPUÉS →",
      "seguime": "SEGUIME PARA MÁS →",
      "dm":      "MANDAME UN DM →",
    }

    const finalCTA = ctaMap[cta] ?? ctaMap["comentá"]

    const prompt = `Sos un experto en contenido de Instagram para coaches y consultores latinoamericanos.
Creá un carrusel de ${slideCount} slides sobre: "${topic}".

Tono: ${toneMap[tone] ?? toneMap["educativo"]}
CTA del último slide: ${finalCTA}

REGLAS ESTRICTAS:
- Usá siempre "vos" (NUNCA "tú")
- Directo, sin frases cliché, sin relleno
- Slide 1 = HOOK poderoso que para el scroll (pregunta, afirmación fuerte, o dato impactante)
- Slides 2 a N-1 = desarrollo del método/contenido, un punto clave por slide
- Último slide = CTA claro y motivador
- Títulos: máximo 6 palabras por línea, máximo 3 líneas (separadas con \\n)
- Subtítulos: máximo 110 caracteres, concretos y directos
- Labels descriptivos según el contenido de cada slide

Devolvé ÚNICAMENTE este JSON, sin texto adicional, sin markdown:
{
  "slides": [
    {
      "label": "01 · HOOK",
      "title": "Primera línea\\nSegunda línea",
      "subtitle": "Subtítulo corto y concreto",
      "cta": "DESLIZÁ →"
    }
  ]
}

Formato de labels: "01 · HOOK", "02 · EL PROBLEMA", "03 · LA CAUSA", "04 · EL MÉTODO", "05 · CTA", etc.
CTA slides intermedios: "DESLIZÁ →"
CTA último slide: "${finalCTA}"
`

    const client = new Anthropic()
    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    })

    const text = response.content[0].type === "text" ? response.content[0].text : ""
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })

    const data = JSON.parse(match[0])
    return NextResponse.json({ slides: data.slides ?? [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Internal server error" }, { status: 500 })
  }
}
