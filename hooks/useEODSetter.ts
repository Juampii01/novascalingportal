"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabaseClient"
import { DEMO_CLIENT_ID } from "@/lib/demo-data"

// SQL to create table:
// CREATE TABLE eod_setter (
//   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//   client_id uuid NOT NULL,
//   date date NOT NULL,
//   aperturas integer NOT NULL DEFAULT 0,
//   respuestas integer NOT NULL DEFAULT 0,
//   calificados integer NOT NULL DEFAULT 0,
//   agendados integer NOT NULL DEFAULT 0,
//   notas text,
//   created_at timestamptz DEFAULT now(),
//   UNIQUE(client_id, date)
// );
// ALTER TABLE eod_setter ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "client owns eod_setter" ON eod_setter
//   USING (client_id::text = auth.uid()::text)
//   WITH CHECK (client_id::text = auth.uid()::text);

export interface EODSetterEntry {
  id: string
  date: string
  aperturas: number
  respuestas: number
  calificados: number
  agendados: number
  notas: string
}

const DEMO: EODSetterEntry[] = [
  { id: "d1", date: "2026-03-24", aperturas: 45, respuestas: 18, calificados: 7, agendados: 3, notas: "" },
  { id: "d2", date: "2026-03-23", aperturas: 38, respuestas: 14, calificados: 5, agendados: 2, notas: "" },
  { id: "d3", date: "2026-03-22", aperturas: 52, respuestas: 21, calificados: 9, agendados: 4, notas: "" },
  { id: "d4", date: "2026-03-21", aperturas: 41, respuestas: 16, calificados: 6, agendados: 2, notas: "" },
  { id: "d5", date: "2026-03-20", aperturas: 30, respuestas: 11, calificados: 4, agendados: 1, notas: "" },
  { id: "d6", date: "2026-03-19", aperturas: 47, respuestas: 19, calificados: 8, agendados: 3, notas: "" },
  { id: "d7", date: "2026-03-18", aperturas: 35, respuestas: 13, calificados: 5, agendados: 2, notas: "" },
]

export function useEODSetter(clientId: string | null) {
  const [entries, setEntries] = useState<EODSetterEntry[]>([])
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
        .from("eod_setter")
        .select("*")
        .eq("client_id", clientId)
        .gte("date", from.toISOString().slice(0, 10))
        .order("date", { ascending: false })

      if (error) throw error
      setEntries(
        (data ?? []).map((r: any) => ({
          id: r.id,
          date: r.date,
          aperturas: r.aperturas ?? 0,
          respuestas: r.respuestas ?? 0,
          calificados: r.calificados ?? 0,
          agendados: r.agendados ?? 0,
          notas: r.notas ?? "",
        }))
      )
    } catch (e) {
      console.error("useEODSetter:", e)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    load()
  }, [load])

  const save = useCallback(
    async (entry: Omit<EODSetterEntry, "id">) => {
      if (!clientId || clientId === DEMO_CLIENT_ID) return { error: null }
      const supabase = createClient()
      const { error } = await supabase.from("eod_setter").upsert(
        {
          client_id: clientId,
          date: entry.date,
          aperturas: entry.aperturas,
          respuestas: entry.respuestas,
          calificados: entry.calificados,
          agendados: entry.agendados,
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
