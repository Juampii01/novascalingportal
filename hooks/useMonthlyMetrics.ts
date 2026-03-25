"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabaseClient"
import { DEMO_CLIENT_ID, DEMO_MONTHLY_METRICS } from "@/lib/demo-data"

export interface MonthlyRecord {
  month: number
  year: number
  label: string
  cashCollected: number
  revenueShare: number
  newFollowers: number
  totalConversations: number
  callsBooked: number
  callsAttended: number
  closes: number
  closesTarget: number
  healthScore: number
  responseRate: number
  ctr: number
  frequency: number
  attendanceRate: number
  contentPublished: number
  contentPlanned: number
}

const MONTH_NAMES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

function toLabel(month: number, year: number): string {
  return `${MONTH_NAMES[(month - 1) % 12]} ${String(year).slice(2)}`
}

export function useMonthlyMetrics(clientId: string | null) {
  const [data, setData] = useState<MonthlyRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientId) {
      setData([])
      setLoading(false)
      return
    }

    if (clientId === DEMO_CLIENT_ID) {
      setData(DEMO_MONTHLY_METRICS)
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetch() {
      setLoading(true)
      try {
        const supabase = createClient()

        // Rolling 12 months — month column is DATE type
        const now = new Date()
        const cutoff = new Date(now)
        cutoff.setFullYear(cutoff.getFullYear() - 1)
        const cutoffStr = cutoff.toISOString().slice(0, 10)

        const { data: rows, error } = await supabase
          .from("monthly_reports")
          .select(
            "month, cash_collected, revenue_share, new_followers, inbound_messages, scheduled_calls, attended_calls, new_clients, health_score, closes, closes_target, response_rate, ctr, frequency, attendance_rate, content_published, content_planned"
          )
          .eq("client_id", clientId)
          .gte("month", cutoffStr)
          .order("month", { ascending: true })

        if (cancelled) return
        if (error) throw error

        const records: MonthlyRecord[] = (rows ?? []).map((r: any) => {
          const d = new Date((r.month as string) + "T00:00:00Z")
          const monthNum = d.getUTCMonth() + 1
          const yearNum = d.getUTCFullYear()
          return {
            month: monthNum,
            year: yearNum,
            label: toLabel(monthNum, yearNum),
            cashCollected: Number(r.cash_collected ?? 0),
            revenueShare: Number(r.revenue_share ?? 0),
            newFollowers: Number(r.new_followers ?? 0),
            totalConversations: Number(r.inbound_messages ?? 0),
            callsBooked: Number(r.scheduled_calls ?? 0),
            callsAttended: Number(r.attended_calls ?? 0),
            closes: Number(r.closes ?? r.new_clients ?? 0),
            closesTarget: Number(r.closes_target ?? 0),
            healthScore: Number(r.health_score ?? 0),
            responseRate: Number(r.response_rate ?? 0),
            ctr: Number(r.ctr ?? 0),
            frequency: Number(r.frequency ?? 0),
            attendanceRate: Number(r.attendance_rate ?? 0),
            contentPublished: Number(r.content_published ?? 0),
            contentPlanned: Number(r.content_planned ?? 14),
          }
        })

        setData(records)
      } catch {
        setData([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch()
    return () => { cancelled = true }
  }, [clientId])

  return { data, loading }
}
