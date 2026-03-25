"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabaseClient"
import { DEMO_CLIENT_ID, DEMO_SALES_PIPELINE } from "@/lib/demo-data"

export interface SalesLead {
  id: string
  leadName: string
  originAngle: string
  originCategory: "Problema" | "Solución" | "Producto" | "Mentalidad"
  stage: string
  callDate: string
  attended: boolean
  closed: boolean
  amount: number
  notes?: string
  contentPieceId?: string
  createdAt?: string
}

export interface SalesData {
  callsScheduled: number
  attendanceRate: number
  closesThisWeek: number
  cashCollected: number
  revenueShare: number
  leads: SalesLead[]
  monthlyRevenue: { month: string; cash: number; projected?: boolean }[]
}

const MONTH_NAMES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

export function useSalesPipeline(clientId: string | null) {
  const [data, setData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientId) {
      setData(null)
      setLoading(false)
      return
    }

    if (clientId === DEMO_CLIENT_ID) {
      setData(DEMO_SALES_PIPELINE)
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetch() {
      setLoading(true)
      try {
        const supabase = createClient()

        // Leads from last 90 days
        const from = new Date()
        from.setDate(from.getDate() - 90)
        const fromStr = from.toISOString().slice(0, 10)

        const { data: leads, error: leadsErr } = await supabase
          .from("sales_pipeline")
          .select("*")
          .eq("client_id", clientId)
          .or(`call_date.gte.${fromStr},call_date.is.null`)
          .order("created_at", { ascending: false })

        if (cancelled) return
        // Don't throw on leads error — table may not exist yet
        const safeLeads = leadsErr ? [] : (leads ?? [])

        // Monthly revenue from monthly_reports (last 6 months)
        const { data: reports, error: reportsErr } = await supabase
          .from("monthly_reports")
          .select("month, cash_collected, revenue_share")
          .eq("client_id", clientId)
          .order("month", { ascending: false })
          .limit(6)

        if (cancelled) return
        if (reportsErr) throw reportsErr

        const rows = safeLeads
        const now = new Date()
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)

        const scheduled = rows.filter((r: any) => r.stage !== "perdido")
        const attended = rows.filter((r: any) => r.attended)
        const closedRows = rows.filter((r: any) => r.closed)
        const closedThisWeek = closedRows.filter((r: any) => {
          const d = new Date(r.call_date)
          return d >= weekAgo
        })

        const attendanceRate = scheduled.length > 0
          ? Math.round((attended.length / scheduled.length) * 100)
          : 0

        // Financial KPIs: use monthly_reports (source of truth, same as overview)
        const latestReport = (reports ?? [])[0]
        const cashCollected = latestReport ? Number(latestReport.cash_collected ?? 0) : 0
        const revenueShare = latestReport ? Number(latestReport.revenue_share ?? 0) : 0

        const mappedLeads: SalesLead[] = rows.map((r: any) => ({
          id: r.id,
          leadName: r.lead_name,
          originAngle: r.origin_angle ?? "",
          originCategory: (r.origin_category ?? "Problema") as SalesLead["originCategory"],
          stage: r.stage ?? "Agendado",
          callDate: r.call_date ?? "",
          attended: Boolean(r.attended),
          closed: Boolean(r.closed),
          amount: Number(r.amount ?? 0),
          notes: r.notes ?? undefined,
          contentPieceId: r.content_piece_id ?? undefined,
          createdAt: r.created_at ? String(r.created_at).slice(0, 10) : undefined,
        }))

        // Monthly revenue chart data (oldest first)
        const monthlyRevenue = [...(reports ?? [])]
          .reverse()
          .map((r: any, idx: number, arr: any[]) => {
            const d = new Date((r.month as string) + "T00:00:00Z")
            const monthNum = d.getUTCMonth() + 1
            return {
              month: MONTH_NAMES[monthNum - 1],
              cash: Number(r.cash_collected ?? 0),
              projected: idx === arr.length - 1 ? true : undefined,
            }
          })

        setData({
          callsScheduled: scheduled.length,
          attendanceRate,
          closesThisWeek: closedThisWeek.length,
          cashCollected,
          revenueShare,
          leads: mappedLeads,
          monthlyRevenue,
        })
      } catch {
        setData(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch()

    // Real-time: refetch cuando sales_pipeline cambia
    const supabase = createClient()
    const channel = supabase
      .channel(`sales_pipeline:${clientId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sales_pipeline" }, () => {
        if (!cancelled) fetch()
      })
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [clientId])

  return { data, loading }
}
