"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabaseClient"
import { DEMO_CLIENT_ID, DEMO_ADS_METRICS } from "@/lib/demo-data"

export interface AdCreative {
  id: string
  name: string
  costPerFollower: number
  ctr: number
  frequency: number
  followersPerDay: number
  spend: number
  status: "winner" | "warning" | "critical" | "inactive"
}

export interface AdsMetrics {
  totalSpend: number
  avgCostPerFollower: number
  totalFollowers: number
  creatives: AdCreative[]
}

export function useAdsMetrics(
  clientId: string | null,
  dateRange?: { from: string; to: string }
) {
  const [data, setData] = useState<AdsMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientId) {
      setData(null)
      setLoading(false)
      return
    }

    if (clientId === DEMO_CLIENT_ID) {
      setData(DEMO_ADS_METRICS)
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetch() {
      setLoading(true)
      try {
        const supabase = createClient()

        let query = supabase
          .from("ads_metrics")
          .select(
            "id, creative_name, spend, followers_gained, cost_per_follower, ctr, frequency, followers_per_day, status"
          )
          .eq("client_id", clientId)
          .order("date_from", { ascending: false })

        if (dateRange?.from) query = query.gte("date_from", dateRange.from)
        if (dateRange?.to)   query = query.lte("date_to", dateRange.to)

        const { data: rows, error } = await query

        if (cancelled) return
        if (error) throw error

        if (!rows || rows.length === 0) {
          setData(null)
          setLoading(false)
          return
        }

        const creatives: AdCreative[] = rows.map((r: any) => ({
          id: r.id,
          name: r.creative_name,
          costPerFollower: Number(r.cost_per_follower ?? 0),
          ctr: Number(r.ctr ?? 0),
          frequency: Number(r.frequency ?? 0),
          followersPerDay: Number(r.followers_per_day ?? 0),
          spend: Number(r.spend ?? 0),
          status: (r.status ?? "inactive") as AdCreative["status"],
        }))

        const totalSpend = creatives.reduce((s, c) => s + c.spend, 0)
        const totalFollowers = rows.reduce((s: number, r: any) => s + Number(r.followers_gained ?? 0), 0)
        const avgCostPerFollower = totalFollowers > 0 ? totalSpend / totalFollowers : 0

        setData({ totalSpend, avgCostPerFollower, totalFollowers, creatives })
      } catch {
        setData(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch()
    return () => { cancelled = true }
  }, [clientId, dateRange?.from, dateRange?.to])

  return { data, loading }
}
