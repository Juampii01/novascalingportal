"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabaseClient"
import { DEMO_CLIENT_ID, DEMO_TRACEABILITY } from "@/lib/demo-data"

export interface TraceabilityRecord {
  id: string
  closeName: string
  date: string
  angle: string
  category: "Problema" | "Solución" | "Producto" | "Mentalidad"
  revenue: number
  subscriberId?: string
  tags: string[]
  // Pieza de contenido de origen (si fue registrada)
  pieceId?: string
  pieceTitle?: string
  pieceCategory?: string
  pieceAngle?: string
  pieceDate?: string
  pieceFormat?: string
}

export interface AngleSummary {
  angle: string
  category: "Problema" | "Solución" | "Producto" | "Mentalidad"
  totalCloses: number
  totalRevenue: number
  isWinner: boolean
  fromPiece: boolean // true si viene de content_piece_id real
}

export interface TraceabilityData {
  records: TraceabilityRecord[]
  angles: AngleSummary[]
}

export function useTraceability(
  clientId: string | null,
  month?: number,
  year?: number
) {
  const [data, setData] = useState<TraceabilityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const refetch = () => setRefreshKey((k) => k + 1)

  useEffect(() => {
    if (!clientId) {
      setData(null)
      setLoading(false)
      return
    }

    if (clientId === DEMO_CLIENT_ID) {
      setData(DEMO_TRACEABILITY)
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetch() {
      setLoading(true)
      try {
        const supabase = createClient()

        // Cierres con JOIN a content_pieces via content_piece_id
        let query = supabase
          .from("sales_pipeline")
          .select(`
            id, lead_name, call_date, origin_angle, origin_category, amount, content_piece_id, subscriber_id, tags,
            content_pieces!sales_pipeline_content_piece_id_fkey(id, title, category, angle, date, format)
          `)
          .eq("client_id", clientId)
          .eq("closed", true)
          .order("call_date", { ascending: false })

        if (month != null && year != null) {
          const from = `${year}-${String(month).padStart(2, "0")}-01`
          const lastDay = new Date(year, month, 0).getDate()
          const to = `${year}-${String(month).padStart(2, "0")}-${lastDay}`
          query = query.gte("call_date", from).lte("call_date", to)
        } else if (year != null) {
          query = query.gte("call_date", `${year}-01-01`).lte("call_date", `${year}-12-31`)
        }

        let { data: rows, error: rowsErr } = await query

        // Si falla el JOIN (FK no configurada), fallback sin content_pieces
        if (rowsErr) {
          const fallback = await supabase
            .from("sales_pipeline")
            .select("id, lead_name, call_date, origin_angle, origin_category, amount, content_piece_id, subscriber_id, tags")
            .eq("client_id", clientId)
            .eq("closed", true)
            .order("call_date", { ascending: false })
          rows = (fallback.data ?? []).map((r: any) => ({ ...r, content_pieces: null }))
          if (fallback.error) throw fallback.error
        }

        if (cancelled) return

        if (cancelled) return

        const TAG_ORDER = ["apertura", "calificado", "agendado", "cerrado"]

        const records: TraceabilityRecord[] = (rows ?? []).map((r: any) => {
          const cp = r.content_pieces ?? null
          const rawTags: string[] = Array.isArray(r.tags) ? r.tags : []
          const tags = [...rawTags].sort((a, b) => {
            const ai = TAG_ORDER.indexOf(a)
            const bi = TAG_ORDER.indexOf(b)
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
          })
          return {
            id: r.id,
            closeName: r.lead_name,
            date: r.call_date ?? "",
            angle: cp?.angle ?? r.origin_angle ?? "Sin ángulo",
            category: (cp?.category ?? r.origin_category ?? "Problema") as TraceabilityRecord["category"],
            revenue: Number(r.amount ?? 0),
            subscriberId: r.subscriber_id ?? undefined,
            tags,
            pieceId: cp?.id ?? undefined,
            pieceTitle: cp?.title ?? undefined,
            pieceCategory: cp?.category ?? undefined,
            pieceAngle: cp?.angle ?? undefined,
            pieceDate: cp?.date ?? undefined,
            pieceFormat: cp?.format ?? undefined,
          }
        })

        // Ranking desde cierres con content_piece_id (prioridad)
        const pieceAngleMap = new Map<string, AngleSummary>()
        const fallbackAngleMap = new Map<string, AngleSummary>()

        for (const rec of records) {
          const key = rec.angle
          const fromPiece = Boolean(rec.pieceId)
          const map = fromPiece ? pieceAngleMap : fallbackAngleMap

          const existing = map.get(key)
          if (existing) {
            existing.totalCloses += 1
            existing.totalRevenue += rec.revenue
          } else {
            map.set(key, {
              angle: key,
              category: rec.category,
              totalCloses: 1,
              totalRevenue: rec.revenue,
              isWinner: false,
              fromPiece,
            })
          }
        }

        // Combinar: los de pieza real van primero, luego los manuales
        const pieceAngles = Array.from(pieceAngleMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue)
        const fallbackAngles = Array.from(fallbackAngleMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue)
        const angles = [...pieceAngles, ...fallbackAngles]

        if (angles.length > 0) angles[0].isWinner = true

        // Merge con content_angles para is_winner override
        const { data: angleRows } = await supabase
          .from("content_angles")
          .select("angle, category, is_winner")
          .eq("client_id", clientId)

        if (!cancelled && angleRows) {
          for (const ar of angleRows) {
            const match = angles.find((a) => a.angle === ar.angle)
            if (match) {
              match.isWinner = Boolean(ar.is_winner)
            } else if (ar.is_winner) {
              angles.push({
                angle: ar.angle,
                category: ar.category as TraceabilityRecord["category"],
                totalCloses: 0,
                totalRevenue: 0,
                isWinner: true,
                fromPiece: false,
              })
            }
          }
        }

        if (!cancelled) setData({ records, angles })
      } catch {
        if (!cancelled) setData(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch()
    return () => { cancelled = true }
  }, [clientId, month, year, refreshKey])

  return { data, loading, refetch }
}
