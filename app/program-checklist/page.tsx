"use client";

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "../../components/dashboard-layout"
import { createClient } from "@/lib/supabaseClient"
import { ExternalLink } from "lucide-react"

const programData = [
  // ══════════════════════════════════════════════════════
  // FASE 1 — DIAGNÓSTICO
  // ══════════════════════════════════════════════════════
  {
    month: "Fase 1 — Diagnóstico del negocio",
    weeks: [
      {
        title: "Semana 1 — Entender el negocio antes de instalar nada",
        tasks: [
          { label: "Completar el perfil del negocio en el dashboard: nicho, oferta, AOV, Instagram, dolores principales del avatar", link: "/profile" },
          { label: "Hacer la trazabilidad inversa de los últimos 90 días: revisar todos los cierres y rastrear qué contenido vio cada cliente antes de pagar. Si hay menos de 10 cierres, extender a 6 meses.", link: "/traceability" },
          { label: "Identificar los primeros 3 ángulos ganadores basados en la trazabilidad. Si no hay datos suficientes, identificar los 3 dolores que el avatar menciona más frecuentemente en conversaciones reales.", link: "/profile" },
          { label: "Cargar los ángulos ganadores identificados en el perfil del dashboard", link: "/profile" },
          { label: "Completar la Auditoría del Sistema para tener una línea de base del estado actual", link: "/audit" },
          { label: "Definir el porcentaje de revenue share acordado con NOVA y cargarlo en el perfil", link: "/profile" },
        ],
      },
    ],
  },
  // ══════════════════════════════════════════════════════
  // FASE 2 — CONTENIDO
  // ══════════════════════════════════════════════════════
  {
    month: "Fase 2 — Sistema de contenido",
    weeks: [
      {
        title: "Semana 2 — Estructura y primeras piezas",
        tasks: [
          { label: "Definir el avatar específico del negocio: quién es, qué problema tiene hoy, qué ya intentó que no funcionó, qué palabras exactas usa para describir su situación", link: "/profile" },
          { label: "Armar el calendario de la primera semana: 14 piezas con distribución correcta — 7 Problema (50%), 3 Producto (20%), 2 Solución (15%), 2 Mentalidad (15%)", link: "/acquisition" },
          { label: "Grabar las primeras 14 piezas en bloque — no una por una. Todo en el mismo día o en dos sesiones máximo. Formato cámara frontal casual.", link: "/acquisition" },
          { label: "Publicar las primeras 2 piezas del día 1: una AM entre 8-10hs y una PM entre 18-20hs. Nunca las dos al mismo tiempo.", link: "/acquisition" },
          { label: "Configurar en el dashboard el estado de cada pieza: por escribir / guión listo / grabado / publicado", link: "/acquisition" },
          { label: "Arrancar con las historias diarias: mínimo 3 por día con la estructura correcta — 1 que nombra un dolor del avatar, 1 que muestra el proceso, 1 que cierra con pregunta directa que invite a responder", link: "/acquisition" },
        ],
      },
      {
        title: "Semana 3 — Validación orgánica",
        tasks: [
          { label: "Revisar qué piezas de la semana 1 generaron conversaciones calificadas en DM. No medir vistas ni likes — medir mensajes de personas que preguntan por lo que hacés.", link: "/acquisition" },
          { label: "Marcar como candidatas a Follow Me Ads las piezas de Problema que generaron conversaciones calificadas. Estas son las únicas que van a ads — ninguna otra.", link: "/acquisition" },
          { label: "Producir la segunda semana de contenido: refinar los ganchos de las piezas de Problema basándose en cuáles resonaron más la semana anterior", link: "/acquisition" },
          { label: "Revisar la retención de las historias: la caída de la primera a la última no puede superar el 30%. Si supera ese límite, cambiar el orden o el tema de la historia que causa la caída.", link: "/acquisition" },
          { label: "Identificar qué dolores específicos mencionaron los leads que respondieron a las historias esta semana y agregarlos al perfil del avatar", link: "/profile" },
        ],
      },
    ],
  },
  // ══════════════════════════════════════════════════════
  // FASE 3 — MANYCHAT
  // ══════════════════════════════════════════════════════
  {
    month: "Fase 3 — Sistema de conversación ManyChat",
    weeks: [
      {
        title: "Semana 3 — Instalación de las secuencias base",
        tasks: [
          { label: "Crear la estructura de carpetas en ManyChat: Abridoras / Calificación / Filtros / Dolores / Soluciones / Casos de éxito / Calendario / Seguimientos", link: "https://manychat.com" },
          { label: "Instalar las 3 secuencias abridoras según el punto de entrada: nuevo seguidor, comentario en reel o posteo, y respuesta a historia", link: "https://manychat.com" },
          { label: "Instalar la secuencia de calificación: verificar que el lead es del nicho correcto antes de avanzar. Si no califica, cierre educado automático.", link: "https://manychat.com" },
          { label: "Instalar la secuencia de filtrado: verificar poder adquisitivo del lead antes de invertir tiempo en la conversación", link: "https://manychat.com" },
          { label: "Crear al menos 3 secuencias de Dolor — una por cada dolor principal del avatar identificado en el perfil", link: "https://manychat.com" },
          { label: "Crear las secuencias de Solución correspondientes a cada dolor instalado", link: "https://manychat.com" },
        ],
      },
      {
        title: "Semana 4 — Completar el pipeline y activar",
        tasks: [
          { label: "Cargar los casos de éxito disponibles en ManyChat organizados por perfil de cliente. Si no hay casos de éxito propios, usar la demostración del sistema en tiempo real como prueba social.", link: "https://manychat.com" },
          { label: "Instalar la automatización de envío del link de calendario con el mensaje correcto", link: "https://manychat.com" },
          { label: "Configurar los 3 seguimientos automáticos: día 1, día 3 y día 7 después de enviar el calendario sin respuesta", link: "https://manychat.com" },
          { label: "Asignar una etiqueta única a cada pieza de contenido publicada en ManyChat para rastrear el origen de cada lead y cada cierre", link: "https://manychat.com" },
          { label: "Hacer una prueba completa del flujo de los 7 pasos: apertura → calificación → filtrado → dolor → solución → prueba social → calendario", link: "https://manychat.com" },
          { label: "Verificar que la tasa de respuesta de las abridoras supera el 40% en los primeros 50 mensajes enviados. Si está por debajo, reescribir el mensaje de apertura antes de activar los ads.", link: "/acquisition" },
        ],
      },
    ],
  },
  // ══════════════════════════════════════════════════════
  // FASE 4 — FOLLOW ME ADS
  // ══════════════════════════════════════════════════════
  {
    month: "Fase 4 — Follow Me Ads",
    weeks: [
      {
        title: "Semana 5 — Activar los ads sobre contenido validado",
        tasks: [
          { label: "ANTES DE ARRANCAR: verificar que hay al menos 3 piezas de Problema validadas orgánicamente (que generaron conversaciones calificadas sin ads). Si no hay 3, esperar a tenerlas.", link: "/acquisition" },
          { label: "Verificar que ManyChat está funcionando correctamente y la tasa de respuesta de las abridoras supera el 40%. No activar ads sin este paso.", link: "/acquisition" },
          { label: "Crear la cuenta de Meta Business Manager del cliente si no existe. Configurar el píxel de Instagram.", link: "https://business.facebook.com" },
          { label: "Lanzar los primeros creativos de Follow Me Ads: las 3 piezas de Problema validadas con $5-$15 por día cada una. Solo contenido de Problema — ninguna otra categoría.", link: "https://business.facebook.com" },
          { label: "Configurar las métricas de control en el dashboard: CTR mínimo 2.5%, frecuencia máxima 1.8, costo por seguidor según el AOV del cliente", link: "/acquisition" },
          { label: "Monitorear los primeros 5-7 días: apagar los creativos que no alcanzan los umbrales de CTR y costo por seguidor. Identificar el creativo ganador.", link: "/acquisition" },
          { label: "Escalar el creativo ganador máximo un 30% cada 2-3 días. No hacer saltos bruscos de presupuesto.", link: "/acquisition" },
        ],
      },
    ],
  },
  // ══════════════════════════════════════════════════════
  // FASE 5 — SISTEMA COMPLETO
  // ══════════════════════════════════════════════════════
  {
    month: "Fase 5 — Sistema completo funcionando",
    weeks: [
      {
        title: "Semana 6 — Verificación del ciclo completo",
        tasks: [
          { label: "Verificar que el ciclo completo está funcionando: contenido genera seguidores → ManyChat convierte seguidores en conversaciones → conversaciones generan llamadas → llamadas generan cierres", link: "/overview" },
          { label: "Revisar el health score del sistema en el dashboard. Tiene que estar por encima de 60 para considerar que el sistema está correctamente instalado.", link: "/projections" },
          { label: "Hacer la primera trazabilidad inversa con datos reales: revisar todos los cierres de las últimas 4 semanas y rastrear qué ángulo de contenido originó cada uno. Cargar los resultados en la sección de Trazabilidad.", link: "/traceability" },
          { label: "Actualizar los ángulos ganadores en el perfil basándose en la primera trazabilidad real. Estos reemplazan a las hipótesis iniciales.", link: "/profile" },
          { label: "Construir el calendario del segundo mes basándose en los ángulos con mejor tasa de conversión del primer mes. No en intuición — en datos.", link: "/acquisition" },
          { label: "Completar la Auditoría del Sistema para comparar el estado actual con la línea de base de la Semana 1. Ver qué mejoró y qué necesita ajuste.", link: "/audit" },
          { label: "Verificar que el revenue share del primer mes está calculado correctamente en el dashboard y coincide con el acuerdo firmado.", link: "/sales" },
        ],
      },
    ],
  },
]

export default function ProgramChecklistPage() {
  useEffect(() => { document.title = "NOVA Scaling" }, [])

  const [openWeeks, setOpenWeeks]     = useState<Record<string, boolean>>({})
  const [completed, setCompleted]     = useState<Record<string, boolean>>({})
  const [justCompleted, setJustCompleted] = useState<string | null>(null)
  const [saving, setSaving]           = useState(false)
  const [loaded, setLoaded]           = useState(false)

  // ── Load from Supabase on mount ──────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          // Fallback to localStorage if not logged in
          const savedCompleted  = localStorage.getItem("program-checklist-completed")
          const savedOpenWeeks  = localStorage.getItem("program-checklist-openWeeks")
          if (savedCompleted) setCompleted(JSON.parse(savedCompleted))
          if (savedOpenWeeks) setOpenWeeks(JSON.parse(savedOpenWeeks))
          setLoaded(true)
          return
        }

        const { data } = await supabase
          .from("checklist_progress")
          .select("completed, open_weeks")
          .eq("user_id", user.id)
          .maybeSingle()

        if (data) {
          setCompleted(data.completed ?? {})
          setOpenWeeks(data.open_weeks ?? {})
        } else {
          // Migrate from localStorage if first time
          const savedCompleted = localStorage.getItem("program-checklist-completed")
          const savedOpenWeeks = localStorage.getItem("program-checklist-openWeeks")
          if (savedCompleted) setCompleted(JSON.parse(savedCompleted))
          if (savedOpenWeeks) setOpenWeeks(JSON.parse(savedOpenWeeks))
        }
      } catch {
        const savedCompleted = localStorage.getItem("program-checklist-completed")
        const savedOpenWeeks = localStorage.getItem("program-checklist-openWeeks")
        if (savedCompleted) setCompleted(JSON.parse(savedCompleted))
        if (savedOpenWeeks) setOpenWeeks(JSON.parse(savedOpenWeeks))
      } finally {
        setLoaded(true)
      }
    }
    load()
  }, [])

  // ── Save to Supabase ─────────────────────────────────────────────────────────
  const persist = useCallback(async (newCompleted: Record<string, boolean>, newOpenWeeks: Record<string, boolean>) => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from("checklist_progress").upsert({
          user_id: user.id,
          completed: newCompleted,
          open_weeks: newOpenWeeks,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" })
      }
      // Also keep localStorage in sync
      localStorage.setItem("program-checklist-completed", JSON.stringify(newCompleted))
      localStorage.setItem("program-checklist-openWeeks", JSON.stringify(newOpenWeeks))
    } catch {
      localStorage.setItem("program-checklist-completed", JSON.stringify(newCompleted))
    } finally {
      setSaving(false)
    }
  }, [])

  const toggleWeek = (key: string) => {
    const next = { ...openWeeks, [key]: !openWeeks[key] }
    setOpenWeeks(next)
    persist(completed, next)
  }

  const toggleTask = (key: string) => {
    const next = { ...completed, [key]: !completed[key] }
    setCompleted(next)
    if (!completed[key]) {
      setJustCompleted(key)
      setTimeout(() => setJustCompleted(null), 400)
    }
    persist(next, openWeeks)
  }

  const totalTasks     = programData.flatMap((m) => m.weeks.flatMap((w) => w.tasks)).length
  const completedCount = Object.values(completed).filter(Boolean).length
  const progress       = totalTasks ? Math.round((completedCount / totalTasks) * 100) : 0

  if (!loaded) return (
    <DashboardLayout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}>
        <p style={{ fontSize: "12px", fontFamily: "sans-serif", color: "#444" }}>Cargando progreso…</p>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        {/* Header */}
        <div>
          <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#4ade80", marginBottom: "10px", textTransform: "uppercase" }}>
            Herramientas
          </p>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#f5f5f5", letterSpacing: "1px" }}>
              Instalación del sistema NOVA Scaling
            </h1>
            {saving && (
              <span style={{ fontSize: "10px", fontFamily: "sans-serif", color: "#444", letterSpacing: "1px", marginTop: "8px" }}>
                Guardando…
              </span>
            )}
          </div>

          <p style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#555", marginBottom: "16px", lineHeight: 1.6 }}>
            Seguí este orden. Cada fase depende de la anterior.
            No actives los ads sin tener el contenido validado.
            No actives los ads sin tener ManyChat instalado.
            El sistema funciona cuando los tres componentes están conectados y corriendo juntos.
          </p>

          {/* Progress bar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ width: "100%", height: "3px", background: "#111", borderRadius: "9999px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "#22c55e", borderRadius: "9999px", transition: "width 0.7s ease" }} />
            </div>
            <p style={{ fontSize: "11px", fontFamily: "sans-serif", color: "#666", letterSpacing: "1px" }}>
              {completedCount}/{totalTasks} pasos completados · {progress}% del sistema instalado
            </p>
          </div>
        </div>

        {/* Program data */}
        {programData.map((month) => (
          <div key={month.month} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Phase header */}
            <div style={{ background: "#0d0d0d", border: "0.5px solid #111", borderRadius: "10px", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: 400, color: "#f5f5f5", letterSpacing: "0.5px" }}>
                {month.month}
              </p>
              <span style={{ fontSize: "9px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", color: "#22c55e", textTransform: "uppercase", flexShrink: 0 }}>
                {month.month.split("—")[0].trim()}
              </span>
            </div>

            {/* Weeks */}
            {month.weeks.map((week) => {
              const weekKey = week.title
              const isOpen  = openWeeks[weekKey]

              return (
                <div key={week.title} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {/* Week toggle */}
                  <div
                    onClick={() => toggleWeek(weekKey)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#0d0d0d", border: "0.5px solid #111", borderRadius: "8px", cursor: "pointer", transition: "border-color 0.2s" }}
                  >
                    <span style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 400, color: "#d4d4d4" }}>
                      {week.title}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>

                  {/* Task list */}
                  {isOpen && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "16px" }}>
                      {week.tasks.map((task) => {
                        const taskKey = week.title + task.label
                        const isDone  = completed[taskKey]
                        const isJust  = justCompleted === taskKey

                        return (
                          <div
                            key={task.label}
                            onClick={() => toggleTask(taskKey)}
                            style={{
                              background: isDone ? "rgba(34,197,94,0.05)" : "#0d0d0d",
                              border: isDone ? "0.5px solid rgba(34,197,94,0.25)" : "0.5px solid #111",
                              borderRadius: "8px",
                              padding: "14px 16px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "16px",
                              cursor: "pointer",
                              transition: "all 0.25s",
                              transform: isJust ? "scale(1.01)" : "scale(1)",
                            }}
                          >
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              <span style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: isDone ? "#555" : "#d4d4d4", textDecoration: isDone ? "line-through" : "none" }}>
                                {task.label}
                              </span>
                              <a
                                href={task.link}
                                target={task.link.startsWith("http") ? "_blank" : "_self"}
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontFamily: "sans-serif", color: "#22c55e", letterSpacing: "1px", textDecoration: "none" }}
                              >
                                Ir al recurso <ExternalLink size={10} />
                              </a>
                            </div>

                            {/* Checkbox */}
                            <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: isDone ? "#22c55e" : "#0a0a0a", border: isDone ? "none" : "0.5px solid #222", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s" }}>
                              {isDone && (
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                  <path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}
