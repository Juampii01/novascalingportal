"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabaseClient"
import { DEMO_CLIENT_ID } from "@/lib/demo-data"

const DAY_ORDER: Record<string, number> = {
  Lunes: 0, Martes: 1, "Miércoles": 2, Jueves: 3, Viernes: 4, "Sábado": 5, Domingo: 6,
}

export interface ContentPiece {
  id: string
  day: string
  date?: string
  title: string
  category: string
  format: string
  status: "publicado" | "borrador" | "atrasado"
  adsCandidate: boolean
  month: string
  hook?: string
  angle?: string
}

const DEMO_CONTENT: ContentPiece[] = Array.from({ length: 8 }, (_, i) => ({
  id: String(i + 1),
  day: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"][i % 7],
  title: [
    "El error que cometen todos los coaches al vender",
    "Cómo cerré 5 clientes en una semana",
    "Si no tenés esto, no podés escalar",
    "La verdad sobre el follow-up en DMs",
    "Por qué el 90% de los expertos no pasa de $10k",
    "El sistema que cambia todo",
    "Tu contenido no vende porque falta esto",
    "Tres tipos de leads y cómo hablarle a cada uno",
  ][i],
  category: (["Problema", "Solución", "Producto", "Mentalidad"] as const)[i % 4],
  format: ["Reel", "Carrusel", "Story", "Post estático"][i % 4],
  status: (["publicado", "publicado", "borrador", "atrasado"] as const)[i % 4],
  adsCandidate: i % 3 === 0,
  month: new Date().toISOString().slice(0, 7),
}))

export function useContentPieces(clientId: string | null, selectedMonth?: string | null) {
  const [data, setData] = useState<ContentPiece[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!clientId) {
      setData([])
      setLoading(false)
      return
    }

    if (clientId === DEMO_CLIENT_ID) {
      setData(DEMO_CONTENT)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const supabase = createClient()

    let query = supabase
      .from("content_pieces")
      .select("id, day, date, title, category, format, status, ads_candidate, month, hook, angle")
      .eq("client_id", clientId)

    if (selectedMonth) {
      query = query.eq("month", `${selectedMonth}-01`)
    }

    let rows: any[] | null = null
    let err: any = null
    ;({ data: rows, error: err } = await query)

    // PGRST204: 'date' column doesn't exist yet — retry without it
    if (err && err.code === "PGRST204") {
      let fallback = supabase
        .from("content_pieces")
        .select("id, day, title, category, format, status, ads_candidate, month, hook, angle")
        .eq("client_id", clientId)
      if (selectedMonth) {
        fallback = fallback.eq("month", `${selectedMonth}-01`)
      }
      const res = await fallback
      rows = res.data
      err = res.error
    }

    if (err) {
      console.error("[useContentPieces]", err)
      setError(err.message)
      setLoading(false)
      return
    }

    const mapped = (rows ?? []).map((r) => ({
      id: r.id,
      day: r.day ?? "",
      date: r.date ?? undefined,
      title: r.title ?? "",
      category: r.category ?? "",
      format: r.format ?? "",
      status: (r.status ?? "borrador") as ContentPiece["status"],
      adsCandidate: r.ads_candidate ?? false,
      month: (r.month as string)?.slice(0, 7) ?? "",
      hook: r.hook ?? undefined,
      angle: r.angle ?? undefined,
    }))

    mapped.sort((a, b) => {
      if (a.date && b.date) return a.date.localeCompare(b.date)
      if (a.date) return -1
      if (b.date) return 1
      const da = DAY_ORDER[a.day] ?? 99
      const db = DAY_ORDER[b.day] ?? 99
      return da - db
    })

    setData(mapped)
    setLoading(false)
  }, [clientId, selectedMonth])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refetch: load }
}
