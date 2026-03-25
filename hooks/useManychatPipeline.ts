"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabaseClient"
import { DEMO_CLIENT_ID, DEMO_MANYCHAT_PIPELINE } from "@/lib/demo-data"

export interface PipelineData {
  newConversations: number
  responseRate: number
  qualifiedLeads: number
  unqualifiedLeads: number
  calendarSent: number
  booked: number
  closed: number
  pendingFollowUps: number
  steps: {
    label: string
    count: number
  }[]
  weeklyConversations: { day: string; value: number }[]
}

export function useManychatPipeline(clientId: string | null) {
  const [data, setData] = useState<PipelineData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientId) {
      setData(null)
      setLoading(false)
      return
    }

    if (clientId === DEMO_CLIENT_ID) {
      setData(DEMO_MANYCHAT_PIPELINE)
      setLoading(false)
      return
    }

    let cancelled = false
    const supabase = createClient()

    async function load() {
      setLoading(true)
      try {
        const { data: row, error } = await supabase
          .from("manychat_pipeline")
          .select("*")
          .eq("client_id", clientId)
          .order("period_start", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (cancelled) return
        if (error) throw error

        if (!row) { setData(null); setLoading(false); return }

        setData({
          newConversations: Number(row.new_conversations ?? 0),
          responseRate: Number(row.response_rate ?? 0),
          qualifiedLeads: Number(row.qualified_leads ?? 0),
          unqualifiedLeads: Number(row.unqualified_leads ?? 0),
          calendarSent: Number(row.calendar_sent ?? 0),
          booked: Number(row.booked ?? 0),
          closed: Number(row.closed ?? 0),
          pendingFollowUps: Number(row.pending_follow_ups ?? 0),
          steps: Array.isArray(row.steps) ? row.steps : [],
          weeklyConversations: Array.isArray(row.weekly_conversations) ? row.weekly_conversations : [],
        })
      } catch {
        setData(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    // Real-time: refetch cuando manychat_pipeline o subscriber_tags cambia
    const channel = supabase
      .channel(`manychat_pipeline:${clientId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "manychat_pipeline" }, () => {
        if (!cancelled) load()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriber_tags" }, () => {
        if (!cancelled) load()
      })
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [clientId])

  const refetch = useCallback(() => {
    if (!clientId || clientId === DEMO_CLIENT_ID) return
    setLoading(true)
    const supabase = createClient()
    supabase
      .from("manychat_pipeline")
      .select("*")
      .eq("client_id", clientId)
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data: row }) => {
        if (!row) { setData(null); setLoading(false); return }
        setData({
          newConversations: Number(row.new_conversations ?? 0),
          responseRate: Number(row.response_rate ?? 0),
          qualifiedLeads: Number(row.qualified_leads ?? 0),
          unqualifiedLeads: Number(row.unqualified_leads ?? 0),
          calendarSent: Number(row.calendar_sent ?? 0),
          booked: Number(row.booked ?? 0),
          closed: Number(row.closed ?? 0),
          pendingFollowUps: Number(row.pending_follow_ups ?? 0),
          steps: Array.isArray(row.steps) ? row.steps : [],
          weeklyConversations: Array.isArray(row.weekly_conversations) ? row.weekly_conversations : [],
        })
        setLoading(false)
      })
  }, [clientId])

  return { data, loading, refetch }
}
