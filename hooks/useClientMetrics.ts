"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabaseClient"
import { DEMO_CLIENT_ID, DEMO_CLIENT_METRICS } from "@/lib/demo-data"

export interface ClientMetrics {
  cashCollected: number
  revenueShare: number
  qualifiedCalls: number
  newFollowers: number
  revenueSharePct: number
}

export function useClientMetrics(clientId: string | null, selectedMonth?: string | null) {
  const [data, setData] = useState<ClientMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!clientId) {
      setData(null)
      setLoading(false)
      return
    }

    if (clientId === DEMO_CLIENT_ID) {
      setData(DEMO_CLIENT_METRICS)
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetch() {
      setLoading(true)
      setError(null)
      try {
        const supabase = createClient()

        // Filter by selected month (YYYY-MM) or fallback to latest
        let query = supabase
          .from("monthly_reports")
          .select("*")
          .eq("client_id", clientId)

        if (selectedMonth) {
          const monthDate = `${selectedMonth}-01`
          query = query.eq("month", monthDate)
        } else {
          query = query.order("month", { ascending: false })
        }

        const { data: row, error: err } = await query
          .limit(1)
          .maybeSingle()

        if (cancelled) return
        if (err) throw err

        if (!row) {
          setData(null)
          setLoading(false)
          return
        }

        setData({
          cashCollected: Number(row.cash_collected ?? 0),
          revenueShare: Number(row.revenue_share ?? 0),
          qualifiedCalls: Number(row.attended_calls ?? 0),
          newFollowers: Number(row.new_followers ?? 0),
          revenueSharePct: 30,
        })
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Error al cargar métricas")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch()
    return () => { cancelled = true }
  }, [clientId, selectedMonth])

  return { data, loading, error }
}
