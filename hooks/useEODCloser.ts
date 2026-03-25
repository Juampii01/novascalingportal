"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabaseClient"
import { DEMO_CLIENT_ID } from "@/lib/demo-data"

// SQL to create table:
// CREATE TABLE eod_closer (
//   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//   client_id uuid NOT NULL,
//   date date NOT NULL,
//   llamadas_agendadas integer NOT NULL DEFAULT 0,
//   llamadas_asistidas integer NOT NULL DEFAULT 0,
//   cerrados integer NOT NULL DEFAULT 0,
//   monto numeric NOT NULL DEFAULT 0,
//   notas text,
//   created_at timestamptz DEFAULT now(),
//   UNIQUE(client_id, date)
// );
// ALTER TABLE eod_closer ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "client owns eod_closer" ON eod_closer
//   USING (client_id::text = auth.uid()::text)
//   WITH CHECK (client_id::text = auth.uid()::text);

export interface EODCloserEntry {
  id: string
  date: string
  llamadasAgendadas: number
  llamadasAsistidas: number
  cerrados: number
  monto: number
  notas: string
}

const DEMO: EODCloserEntry[] = [
  { id: "c1", date: "2026-03-24", llamadasAgendadas: 4, llamadasAsistidas: 3, cerrados: 1, monto: 4800, notas: "" },
  { id: "c2", date: "2026-03-23", llamadasAgendadas: 3, llamadasAsistidas: 3, cerrados: 2, monto: 9600, notas: "" },
  { id: "c3", date: "2026-03-22", llamadasAgendadas: 5, llamadasAsistidas: 4, cerrados: 1, monto: 4800, notas: "" },
  { id: "c4", date: "2026-03-21", llamadasAgendadas: 2, llamadasAsistidas: 2, cerrados: 0, monto: 0, notas: "" },
  { id: "c5", date: "2026-03-20", llamadasAgendadas: 4, llamadasAsistidas: 3, cerrados: 2, monto: 9600, notas: "" },
  { id: "c6", date: "2026-03-19", llamadasAgendadas: 3, llamadasAsistidas: 2, cerrados: 1, monto: 4800, notas: "" },
  { id: "c7", date: "2026-03-18", llamadasAgendadas: 5, llamadasAsistidas: 4, cerrados: 2, monto: 9600, notas: "" },
]

export function useEODCloser(clientId: string | null) {
  const [entries, setEntries] = useState<EODCloserEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!clientId) { setEntries([]); setLoading(false); return }
    if (clientId === DEMO_CLIENT_ID) { setEntries(DEMO); setLoading(false); return }

    setLoading(true)
    try {
      const supabase = createClient()
      const from = new Date()
      from.setDate(from.getDate() - 60)
      const { data, error } = await supabase
        .from("eod_closer")
        .select("*")
        .eq("client_id", clientId)
        .gte("date", from.toISOString().slice(0, 10))
        .order("date", { ascending: false })

      if (error) throw error
      setEntries(
        (data ?? []).map((r: any) => ({
          id: r.id,
          date: r.date,
          llamadasAgendadas: r.llamadas_agendadas ?? 0,
          llamadasAsistidas: r.llamadas_asistidas ?? 0,
          cerrados: r.cerrados ?? 0,
          monto: r.monto ?? 0,
          notas: r.notas ?? "",
        }))
      )
    } catch (e) {
      console.error("useEODCloser:", e)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    load()
  }, [load])

  const save = useCallback(
    async (entry: Omit<EODCloserEntry, "id">) => {
      if (!clientId || clientId === DEMO_CLIENT_ID) return { error: null }
      const supabase = createClient()
      const { error } = await supabase.from("eod_closer").upsert(
        {
          client_id: clientId,
          date: entry.date,
          llamadas_agendadas: entry.llamadasAgendadas,
          llamadas_asistidas: entry.llamadasAsistidas,
          cerrados: entry.cerrados,
          monto: entry.monto,
          notas: entry.notas,
        },
        { onConflict: "client_id,date" }
      )
      if (!error) await load()
      return { error }
    },
    [clientId, load]
  )

  return { entries, loading, refetch: load, save }
}
