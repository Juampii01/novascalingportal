"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabaseClient"
import { useToast } from "@/components/toast"

/**
 * Escucha cambios en tiempo real en sales_pipeline y manychat_pipeline
 * y dispara notificaciones toast cuando hay eventos relevantes.
 *
 * IMPORTANTE: Replication debe estar habilitada en Supabase para estas tablas:
 *   Dashboard → Database → Replication → sales_pipeline, manychat_pipeline
 */
export function useRealtimeAlerts(clientId: string | null) {
  const { toast } = useToast()
  // Track IDs already notified as closed to avoid duplicates on re-render
  const notifiedClosedIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!clientId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`realtime_alerts:${clientId}`)

      // ── Nuevo lead en sales_pipeline ─────────────────────────────────────
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sales_pipeline",
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          const name = (row.lead_name as string | undefined) ?? "Sin nombre"
          const stage = (row.stage as string | undefined) ?? ""
          toast({
            type: "info",
            title: "Nuevo lead registrado",
            message: stage ? `${name} · ${stage}` : name,
          })
        }
      )

      // ── Venta cerrada en sales_pipeline ──────────────────────────────────
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sales_pipeline",
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          const id = String(row.id ?? "")
          const closed = Boolean(row.closed)

          if (closed && id && !notifiedClosedIds.current.has(id)) {
            notifiedClosedIds.current.add(id)
            const name = (row.lead_name as string | undefined) ?? "Lead"
            const rawAmount = Number(row.amount ?? 0)
            const amount = rawAmount > 0
              ? `$${rawAmount.toLocaleString("es-AR")}`
              : ""

            toast({
              type: "success",
              title: "¡Venta cerrada!",
              message: [name, amount].filter(Boolean).join(" — "),
              duration: 8000,
            })
          }
        }
      )

      // ── Nuevo prospecto en ManyChat ───────────────────────────────────────
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "manychat_pipeline",
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          const name =
            (row.subscriber_name as string | undefined) ??
            (row.subscriber_id as string | undefined) ??
            ""
          toast({
            type: "success",
            title: "Nuevo prospecto en ManyChat",
            message: name || undefined,
          })
        }
      )

      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clientId, toast])
}
