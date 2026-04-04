import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { topic, slideCount = 10, tone = "educativo", cta = "comentá" } = body

    if (!topic) return NextResponse.json({ error: "Missing topic" }, { status: 400 })
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "Missing ANTHROPIC_API_KEY" }, { status: 500 })

    const toneGuide: Record<string, string> = {
      educativo:   "Mentor que enseña con claridad. Explica el por qué detrás de cada punto. Didáctico sin ser condescendiente.",
      provocador:  "Directo y sin rodeos. Cuestiona lo que el lector da por sentado. Usa afirmaciones fuertes con fundamento.",
      testimonial: "Habla desde la experiencia y los resultados concretos. Usa evidencia, antes/después, transformaciones reales.",
      tutorial:    "Instrucciones accionables y específicas. Paso a paso. Que alguien pueda implementarlo hoy mismo.",
      libre:       "Seguí el estilo que emerge naturalmente del contenido dado. No impongas estructura externa.",
    }

    const ctaMap: Record<string, string> = {
      "comentá": "COMENTÁ QUÉ TE RESUENA →",
      "guardá":  "GUARDÁ ESTO PARA DESPUÉS →",
      "seguime": "SEGUIME PARA MÁS →",
      "dm":      "MANDAME UN DM →",
    }

    const finalCTA = ctaMap[cta] ?? ctaMap["comentá"]
    const styleGuide = toneGuide[tone] ?? toneGuide["educativo"]

    const prompt = `Sos un estratega de contenido para Instagram especializado en coaches, consultores y negocios de alto ticket en Latinoamérica.

El usuario te pasó este contenido o idea para transformar en un carrusel:

---
${topic}
---

Tu trabajo es desarrollar esto en ${slideCount} slides para Instagram. No estás resumiendo ni parafraseando: estás DESARROLLANDO el contenido, expandiendo las ideas, haciéndolas más concretas, más resonantes, más accionables.

ESTILO DE VOZ: ${styleGuide}
Idioma: argentino. Usá "vos", "acá", "tenés". NUNCA "tú", "aquí", "tienes".
CTA del último slide: ${finalCTA}

CÓMO DESARROLLAR CADA SLIDE:
- Cada slide tiene que tener una idea propia, no ser un bullet point de la idea del slide anterior.
- El título puede ser una afirmación fuerte, una pregunta que genera tensión, un dato, una paradoja, o una instrucción directa.
- El subtítulo expande, contrasta, o complementa el título con una capa adicional de información — no lo repite.
- Podés usar humor, ironía, datos, comparaciones, ejemplos, errores comunes — lo que sirva para que esa idea pegue.
- Los labels son descriptivos del contenido real de ese slide, no genéricos.

FORMATO ESTRICTO DE TÍTULOS:
- Máximo 6 palabras por línea
- Máximo 3 líneas (separadas con \\n)
- La última línea va en color acento — usala para el remate, la palabra clave, o el giro de sentido

FORMATO ESTRICTO DE SUBTÍTULOS:
- Máximo 120 caracteres
- Concreto y específico, no genérico
- No empieces con "Es importante..." o "Recordá que..." — directo al punto

DISTRIBUCIÓN SUGERIDA (adaptala al contenido):
- Slide 1: Hook. Tiene que detener el scroll. Pregunta, tensión, dato impactante, o afirmación que desafía.
- Slides 2 a ${slideCount - 2}: Desarrollo. Cada uno profundiza un aspecto diferente. No repitas ideas.
- Slide ${slideCount - 1}: Síntesis o remate. El insight más fuerte, la vuelta de tuerca.
- Slide ${slideCount}: CTA claro. Qué tiene que hacer el lector ahora.

Devolvé ÚNICAMENTE este JSON, sin texto adicional, sin markdown, sin explicaciones:
{
  "slides": [
    {
      "label": "01 · HOOK",
      "title": "Primera línea\\nSegunda línea\\nRemate acento",
      "subtitle": "Subtítulo concreto de máximo 120 caracteres.",
      "cta": "DESLIZÁ →"
    }
  ]
}

CTA intermedios: "DESLIZÁ →"
CTA último slide: "${finalCTA}"
Labels: descriptivos y numerados. Ej: "01 · EL ERROR", "02 · POR QUÉ PASA", "03 · LA TRAMPA DEL PRECIO", etc.
`

    const client = new Anthropic()
    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
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
