"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabaseClient"
import { useUserRole } from "@/components/dashboard-layout"

// ── Scroll animation primitives ───────────────────────────────────────────────

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function FadeUp({ children, delay = 0, distance = 28, style = {} }: {
  children: React.ReactNode
  delay?: number
  distance?: number
  style?: React.CSSProperties
}) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0px)" : `translateY(${distance}px)`,
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// Para elementos ya visibles al cargar (hero, above the fold)
function FadeIn({ children, delay = 0, style = {} }: {
  children: React.ReactNode
  delay?: number
  style?: React.CSSProperties
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0px)" : "translateY(20px)",
      transition: "opacity 0.7s ease, transform 0.7s ease",
      ...style,
    }}>
      {children}
    </div>
  )
}

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: string; prefix?: string; suffix?: string }) {
  const { ref, inView } = useInView(0.3)
  const [display, setDisplay] = useState("0")
  const numericVal = parseFloat(value.replace(/[^0-9.]/g, ""))
  const isNumeric = !isNaN(numericVal) && value !== "Real time" && value !== "0 manual"

  useEffect(() => {
    if (!inView || !isNumeric) { setDisplay(value); return }
    const duration = 1200
    const steps = 40
    const step = numericVal / steps
    let current = 0
    let count = 0
    const interval = setInterval(() => {
      count++
      current = Math.min(current + step, numericVal)
      const fmt = Number.isInteger(numericVal) ? Math.round(current).toString() : current.toFixed(1)
      setDisplay(prefix + fmt + suffix)
      if (count >= steps) { setDisplay(prefix + value + suffix); clearInterval(interval) }
    }, duration / steps)
    return () => clearInterval(interval)
  }, [inView, isNumeric, numericVal, value, prefix, suffix])

  return <span ref={ref}>{isNumeric ? display : value}</span>
}

// ── Video embed detection ─────────────────────────────────────────────────────
function getEmbedUrl(url: string): string | null {
  if (!url) return null
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/)
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return null
}

// ── Logo ──────────────────────────────────────────────────────────────────────
function NovaLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ fontFamily: "Georgia, serif", fontSize: "22px", fontWeight: 400, color: "#f5f5f5", letterSpacing: "-0.5px" }}>
        NOVA
      </span>
      <div style={{ width: "1px", height: "20px", background: "#22c55e" }} />
      <span style={{ fontFamily: "sans-serif", fontSize: "12px", fontWeight: 400, color: "#888", letterSpacing: "3px", textTransform: "uppercase" as const }}>
        SCALING
      </span>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div style={{
      position: "fixed", top: "24px", right: "24px", zIndex: 99999,
      background: "#0d0d0d", border: "0.5px solid rgba(34,197,94,0.4)",
      borderRadius: "8px", padding: "12px 20px",
      fontSize: "13px", fontFamily: "sans-serif", color: "#4ade80",
      letterSpacing: "0.3px",
    }}>
      {msg}
    </div>
  )
}

// ── FAQ Item ──────────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      onClick={() => setOpen((v) => !v)}
      style={{
        borderBottom: "0.5px solid #111",
        padding: "24px 0",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px" }}>
        <p style={{
          fontFamily: "sans-serif", fontSize: "15px", fontWeight: 400,
          color: open ? "#f5f5f5" : "#d4d4d4", margin: 0, lineHeight: 1.5,
          transition: "color 0.15s",
        }}>
          {q}
        </p>
        <span style={{
          fontSize: "18px", color: open ? "#22c55e" : "#444",
          flexShrink: 0, transition: "all 0.15s",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
          display: "inline-block",
        }}>
          +
        </span>
      </div>
      {open && (
        <p style={{
          fontFamily: "sans-serif", fontSize: "14px", color: "#666",
          lineHeight: 1.7, margin: "16px 0 0", fontWeight: 300,
          maxWidth: "640px",
        }}>
          {a}
        </p>
      )}
    </div>
  )
}

// ── Dashboard mockup screens ──────────────────────────────────────────────────
function MockHealthScore() {
  return (
    <div style={{ background: "#0d0d0d", border: "0.5px solid #111", borderRadius: "12px", padding: "24px" }}>
      <p style={{ fontSize: "9px", color: "#4ade80", fontFamily: "sans-serif", letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 20px" }}>Health Score</p>
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ position: "relative", width: "72px", height: "72px", flexShrink: 0 }}>
          <svg viewBox="0 0 72 72" style={{ width: "72px", height: "72px", transform: "rotate(-90deg)" }}>
            <circle cx="36" cy="36" r="30" fill="none" stroke="#111" strokeWidth="6" />
            <circle cx="36" cy="36" r="30" fill="none" stroke="#22c55e" strokeWidth="6"
              strokeDasharray={`${(78 / 100) * 188.5} 188.5`} strokeLinecap="round" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "Georgia, serif", fontSize: "18px", color: "#f5f5f5" }}>78</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {[
            { label: "Contenido", val: 85, color: "#22c55e" },
            { label: "Ads", val: 72, color: "#f59e0b" },
            { label: "Pipeline", val: 90, color: "#22c55e" },
            { label: "Ventas", val: 65, color: "#f59e0b" },
          ].map((item) => (
            <div key={item.label} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                <span style={{ fontSize: "9px", color: "#555", fontFamily: "sans-serif", letterSpacing: "1px" }}>{item.label.toUpperCase()}</span>
                <span style={{ fontSize: "9px", color: item.color, fontFamily: "sans-serif" }}>{item.val}</span>
              </div>
              <div style={{ height: "2px", background: "#111", borderRadius: "1px" }}>
                <div style={{ height: "2px", background: item.color, borderRadius: "1px", width: `${item.val}%`, opacity: 0.7 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MockPipeline() {
  const stages = [
    { label: "ManyChat", count: 47, color: "#60a5fa" },
    { label: "Calificado", count: 23, color: "#a78bfa" },
    { label: "Agendado", count: 11, color: "#f59e0b" },
    { label: "Llamada", count: 6, color: "#f97316" },
    { label: "Cerrado", count: 4, color: "#22c55e" },
  ]
  return (
    <div style={{ background: "#0d0d0d", border: "0.5px solid #111", borderRadius: "12px", padding: "24px" }}>
      <p style={{ fontSize: "9px", color: "#4ade80", fontFamily: "sans-serif", letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 20px" }}>Pipeline en vivo</p>
      {stages.map((s) => (
        <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
          <span style={{ fontSize: "10px", color: "#555", fontFamily: "sans-serif", width: "72px", letterSpacing: "0.5px" }}>{s.label}</span>
          <div style={{ flex: 1, height: "4px", background: "#111", borderRadius: "2px" }}>
            <div style={{ height: "4px", background: s.color, borderRadius: "2px", width: `${(s.count / 47) * 100}%`, opacity: 0.8 }} />
          </div>
          <span style={{ fontFamily: "Georgia, serif", fontSize: "13px", color: s.color, width: "20px", textAlign: "right" }}>{s.count}</span>
        </div>
      ))}
      <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "0.5px solid #111", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: "9px", color: "#333", fontFamily: "sans-serif", letterSpacing: "1px" }}>CONV. ManyChat → Cierre</span>
        <span style={{ fontSize: "11px", color: "#22c55e", fontFamily: "Georgia, serif" }}>8.5%</span>
      </div>
    </div>
  )
}

function MockTraceability() {
  const angles = [
    { angle: "Historia con dolor", revenue: 33000, closes: 6, pct: 100 },
    { angle: "Testimonio cliente", revenue: 16500, closes: 3, pct: 50 },
    { angle: "Carrusel sistema", revenue: 11000, closes: 2, pct: 33 },
    { angle: "$50k en 90 días", revenue: 5500, closes: 1, pct: 17 },
  ]
  return (
    <div style={{ background: "#0d0d0d", border: "0.5px solid #111", borderRadius: "12px", padding: "24px" }}>
      <p style={{ fontSize: "9px", color: "#4ade80", fontFamily: "sans-serif", letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 20px" }}>Trazabilidad · Ángulos</p>
      {angles.map((a, i) => (
        <div key={a.angle} style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "5px" }}>
            <span style={{ fontSize: "11px", color: i === 0 ? "#f5f5f5" : "#888", fontFamily: "sans-serif", fontWeight: i === 0 ? 500 : 300 }}>{a.angle}</span>
            <div style={{ display: "flex", gap: "12px", alignItems: "baseline" }}>
              <span style={{ fontSize: "9px", color: "#555", fontFamily: "sans-serif" }}>{a.closes} cierres</span>
              <span style={{ fontFamily: "Georgia, serif", fontSize: "12px", color: i === 0 ? "#22c55e" : "#555" }}>${(a.revenue / 1000).toFixed(0)}k</span>
            </div>
          </div>
          <div style={{ height: "2px", background: "#111", borderRadius: "1px" }}>
            <div style={{ height: "2px", background: i === 0 ? "#22c55e" : "#333", borderRadius: "1px", width: `${a.pct}%` }} />
          </div>
        </div>
      ))}
      <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "0.5px solid #111" }}>
        <span style={{ fontSize: "9px", color: "#22c55e", fontFamily: "sans-serif", letterSpacing: "1px", background: "rgba(34,197,94,0.06)", padding: "3px 8px", borderRadius: "20px", border: "0.5px solid rgba(34,197,94,0.2)" }}>
          ✦ ÁNGULO GANADOR: Historia con dolor
        </span>
      </div>
    </div>
  )
}

function MockAds() {
  const creatives = [
    { name: "Historia dolor — mamá", ctr: 4.2, freq: 1.1, status: "ok" },
    { name: "Testimonio Carlos M.", ctr: 3.8, freq: 1.4, status: "ok" },
    { name: "Reel sistema 90 días", ctr: 2.1, freq: 1.7, status: "warn" },
  ]
  return (
    <div style={{ background: "#0d0d0d", border: "0.5px solid #111", borderRadius: "12px", padding: "24px" }}>
      <p style={{ fontSize: "9px", color: "#4ade80", fontFamily: "sans-serif", letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 20px" }}>Ads activos</p>
      {creatives.map((c) => (
        <div key={c.name} style={{ marginBottom: "12px", padding: "12px", background: "#111", borderRadius: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", color: "#d4d4d4", fontFamily: "sans-serif", fontWeight: 300 }}>{c.name}</span>
            <span style={{
              fontSize: "8px", padding: "2px 6px", borderRadius: "9999px",
              background: c.status === "ok" ? "rgba(34,197,94,0.08)" : "rgba(245,158,11,0.08)",
              border: `0.5px solid ${c.status === "ok" ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}`,
              color: c.status === "ok" ? "#22c55e" : "#f59e0b",
              fontFamily: "sans-serif", letterSpacing: "1px",
            }}>
              {c.status === "ok" ? "ACTIVO" : "ROTAR PRONTO"}
            </span>
          </div>
          <div style={{ display: "flex", gap: "16px" }}>
            <span style={{ fontSize: "10px", color: "#555", fontFamily: "sans-serif" }}>CTR <span style={{ color: c.ctr >= 2.5 ? "#22c55e" : "#ef4444" }}>{c.ctr}%</span></span>
            <span style={{ fontSize: "10px", color: "#555", fontFamily: "sans-serif" }}>Frec. <span style={{ color: c.freq < 1.5 ? "#22c55e" : c.freq < 1.8 ? "#f59e0b" : "#ef4444" }}>{c.freq}</span></span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const role = useUserRole()
  const isAdmin = role?.toLowerCase() === "admin"

  const [videoUrl, setVideoUrl] = useState("")
  const [calendlyUrl, setCalendlyUrl] = useState("")
  const [adminVideo, setAdminVideo] = useState("")
  const [adminCalendly, setAdminCalendly] = useState("")
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    document.title = "NOVA Scaling — Sistema de adquisición"
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("landing_config")
      .select("video_url, calendly_url")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setVideoUrl(data.video_url ?? "")
          setCalendlyUrl(data.calendly_url ?? "")
          setAdminVideo(data.video_url ?? "")
          setAdminCalendly(data.calendly_url ?? "")
        }
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("landing_config")
      .upsert({ video_url: adminVideo, calendly_url: adminCalendly, updated_at: new Date().toISOString() })
    setSaving(false)
    if (!error) {
      setVideoUrl(adminVideo)
      setCalendlyUrl(adminCalendly)
      setToast("Guardado ✓")
    }
  }

  const embedUrl = getEmbedUrl(videoUrl)

  const LABEL: React.CSSProperties = {
    fontSize: "10px", fontFamily: "sans-serif", fontWeight: 500,
    letterSpacing: "4px", textTransform: "uppercase", color: "#4ade80",
  }

  const CYCLE_STEPS = [
    { n: "01", label: "Contenido", sub: "Publicás piezas basadas en ángulos que ya generaron ventas anteriores." },
    { n: "02", label: "Follow Me Ads", sub: "El contenido que funciona orgánicamente se amplifica con presupuesto." },
    { n: "03", label: "ManyChat", sub: "Nuevos seguidores entran a secuencias automáticas de calificación." },
    { n: "04", label: "Cierres", sub: "Leads calificados llegan a llamada. El closer cierra con contexto." },
    { n: "05", label: "Trazabilidad", sub: "Cada cierre queda vinculado al ángulo que lo originó." },
    { n: "06", label: "Optimización", sub: "Los ángulos ganadores guían el contenido del mes siguiente." },
  ]

  const NUMBERS = [
    { value: "40–70%", label: "Tasa de respuesta objetivo en abridoras ManyChat" },
    { value: "2.5%", label: "CTR mínimo de creativos para escalar con presupuesto" },
    { value: "6 sem.", label: "Tiempo de instalación completa del sistema" },
    { value: "1.8", label: "Frecuencia máxima antes de rotar un creativo" },
    { value: "3", label: "Seguimientos automáticos en 7 días sin intervención manual" },
  ]

  const FAQS = [
    {
      q: "¿Cuánto tiempo me lleva a mí?",
      a: "Una vez instalado el sistema, tu tiempo de operación es grabar el contenido y asistir a las llamadas agendadas. ManyChat, los follow-ups y la calificación son automáticos. La mayoría de los clientes invierte menos de 2 horas diarias en el sistema.",
    },
    {
      q: "¿Necesito muchos seguidores para que funcione?",
      a: "No. El sistema está diseñado para funcionar desde los 2.000 seguidores. Los Follow Me Ads traen tráfico calificado mientras el orgánico crece. Tener muchos seguidores no garantiza nada si no hay sistema detrás — tener el sistema es lo que hace que cada seguidor cuente.",
    },
    {
      q: "¿Qué pasa si no tengo casos de éxito todavía?",
      a: "Los primeros ángulos se construyen con los dolores del nicho y los resultados del proceso, no necesariamente con testimonios de clientes. Durante las primeras 6 semanas identificamos qué ángulos generan conversaciones y a partir de ahí la trazabilidad empieza a funcionar.",
    },
    {
      q: "¿Tengo que grabar contenido todos los días?",
      a: "El sistema está optimizado para 2 piezas por día, 7 días a la semana. Pero muchos clientes graban en batches de 2–3 horas una o dos veces por semana y programan la distribución. La clave no es la frecuencia absoluta — es la consistencia y la calidad del ángulo.",
    },
    {
      q: "¿Funciona para mi nicho?",
      a: "El sistema funciona para cualquier negocio que venda servicios o programas de alto ticket a través de conversaciones uno a uno. Coaches, consultores, agencias, profesionales independientes. Si tu proceso de venta incluye una llamada, este sistema es para vos.",
    },
  ]

  return (
    <div style={{ background: "#080808", minHeight: "100vh", color: "#f5f5f5" }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: "64px", background: "#080808", borderBottom: "0.5px solid #111",
        padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <NovaLogo />
        <button
          onClick={() => document.getElementById("cta")?.scrollIntoView({ behavior: "smooth" })}
          style={{
            background: "#22c55e", color: "#000", border: "none", borderRadius: "8px",
            padding: "10px 20px", fontSize: "11px", fontFamily: "sans-serif",
            fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer",
          }}
        >
          Agendar llamada
        </button>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: isMobile ? "120px 24px 80px" : "120px 40px 80px",
      }}>
        <FadeIn delay={80}>
          <p style={{ ...LABEL, marginBottom: "24px" }}>Sistema de adquisición</p>
        </FadeIn>
        <FadeIn delay={200}>
          <h1 style={{
            fontFamily: "Georgia, serif", fontSize: isMobile ? "42px" : "72px",
            fontWeight: 400, color: "#f5f5f5", lineHeight: 1.1, letterSpacing: "-1px", margin: 0,
          }}>
            El negocio que no podés<br />predecir, no escala.
          </h1>
        </FadeIn>
        <FadeIn delay={360}>
          <p style={{
            fontFamily: "sans-serif", fontSize: "18px", color: "#666",
            marginTop: "24px", fontWeight: 300, maxWidth: "520px", lineHeight: 1.6,
          }}>
            Del contenido al DM. Del DM a la llamada. De la llamada al revenue.
          </p>
        </FadeIn>
        <FadeIn delay={520}>
          <div style={{ width: "60px", height: "1px", background: "#22c55e", margin: "40px auto" }} />
          <div style={{ display: "flex", gap: isMobile ? "32px" : "60px", flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { value: "100%", label: "Automatizado" },
              { value: "Real time", label: "Data en vivo" },
              { value: "0 manual", label: "Calificación automática" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "Georgia, serif", fontSize: "20px", color: "#f5f5f5", margin: 0 }}>{s.value}</p>
                <p style={{ fontFamily: "sans-serif", fontSize: "9px", color: "#555", letterSpacing: "2px", textTransform: "uppercase", marginTop: "6px" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ── Video ── */}
      <section style={{ background: "#080808", padding: isMobile ? "60px 24px" : "80px 40px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <p style={{ ...LABEL, textAlign: "center", marginBottom: "16px" }}>El método</p>
          <h2 style={{
            fontFamily: "Georgia, serif", fontSize: isMobile ? "28px" : "36px",
            fontWeight: 400, color: "#f5f5f5", textAlign: "center", margin: "0 0 48px",
          }}>
            Mirá cómo funciona el sistema
          </h2>
          <div style={{
            background: "#0d0d0d", border: "0.5px solid #111", borderRadius: "12px",
            overflow: "hidden", aspectRatio: "16/9", width: "100%",
          }}>
            {embedUrl ? (
              <iframe
                src={embedUrl}
                style={{ width: "100%", height: "100%", border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div style={{
                width: "100%", height: "100%",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px",
              }}>
                <span style={{ fontSize: "48px", color: "#333" }}>▶</span>
                <p style={{ fontFamily: "sans-serif", fontSize: "14px", color: "#444", margin: 0 }}>Video próximamente</p>
                <p style={{ fontFamily: "sans-serif", fontSize: "12px", color: "#333", margin: 0 }}>El VSL se cargará aquí cuando esté disponible</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Tres pilares ── */}
      <section style={{ background: "#080808", padding: isMobile ? "60px 24px" : "80px 40px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <FadeUp delay={0}>
            <p style={{ ...LABEL, textAlign: "center", marginBottom: "16px" }}>El sistema</p>
            <h2 style={{
              fontFamily: "Georgia, serif", fontSize: isMobile ? "28px" : "36px",
              fontWeight: 400, color: "#f5f5f5", textAlign: "center", margin: "0 0 48px",
            }}>
              Tres componentes. Un ciclo.
            </h2>
          </FadeUp>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "16px" }}>
            {[
              { n: "01", title: "Ángulos ganadores", desc: "Contenido construido con trazabilidad inversa. Cada pieza se basa en lo que ya generó ventas en tu negocio, no en intuición ni tendencias." },
              { n: "02", title: "Automatización del DM", desc: "ManyChat convierte seguidores en conversaciones calificadas y llamadas agendadas de forma automática. Sin intervención manual, sin que dependas de estar pendiente del DM." },
              { n: "03", title: "Tráfico calificado", desc: "Follow Me Ads que amplifican el contenido que ya funciona orgánicamente. Solo se invierte en lo que ya demostró que convierte." },
            ].map((card, i) => (
              <FadeUp key={card.n} delay={i * 120}>
                <div style={{ background: "#0d0d0d", border: "0.5px solid #111", borderRadius: "12px", padding: "32px 28px", height: "100%" }}>
                  <p style={{ fontFamily: "Georgia, serif", fontSize: "48px", fontWeight: 400, color: "#22c55e", margin: "0 0 16px" }}>{card.n}</p>
                  <p style={{ fontFamily: "Georgia, serif", fontSize: "22px", fontWeight: 400, color: "#f5f5f5", margin: "0 0 12px" }}>{card.title}</p>
                  <p style={{ fontFamily: "sans-serif", fontSize: "14px", color: "#aaaaaa", lineHeight: 1.7, margin: 0, fontWeight: 300 }}>{card.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── 1. El ciclo visual ── */}
      <section style={{ background: "#080808", borderTop: "0.5px solid #0f0f0f", padding: isMobile ? "60px 24px" : "80px 40px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <p style={{ ...LABEL, textAlign: "center", marginBottom: "16px" }}>El ciclo</p>
          <h2 style={{
            fontFamily: "Georgia, serif", fontSize: isMobile ? "28px" : "36px",
            fontWeight: 400, color: "#f5f5f5", textAlign: "center", margin: "0 0 16px",
          }}>
            Un ciclo que se retroalimenta solo.
          </h2>
          <p style={{ textAlign: "center", fontFamily: "sans-serif", fontSize: "15px", color: "#555", margin: "0 0 56px", fontWeight: 300 }}>
            Cada elemento produce el siguiente. Cada cierre mejora el contenido del mes que viene.
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: "1px",
            background: "#111",
            borderRadius: "12px",
            overflow: "hidden",
            border: "0.5px solid #111",
          }}>
            {CYCLE_STEPS.map((step, i) => (
              <div key={step.n} style={{
                background: "#0d0d0d",
                padding: "28px 28px",
                position: "relative",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  <span style={{
                    fontFamily: "Georgia, serif", fontSize: "13px", color: "#22c55e",
                    flexShrink: 0, marginTop: "2px", opacity: 0.7,
                  }}>
                    {step.n}
                  </span>
                  <div>
                    <p style={{ fontFamily: "Georgia, serif", fontSize: "18px", color: "#f5f5f5", margin: "0 0 8px", fontWeight: 400 }}>
                      {step.label}
                    </p>
                    <p style={{ fontFamily: "sans-serif", fontSize: "13px", color: "#666", lineHeight: 1.6, margin: 0, fontWeight: 300 }}>
                      {step.sub}
                    </p>
                  </div>
                </div>
                {/* Arrow connector */}
                {i < CYCLE_STEPS.length - 1 && !isMobile && (i + 1) % 3 !== 0 && (
                  <div style={{
                    position: "absolute", right: "-8px", top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "12px", color: "#22c55e", zIndex: 2,
                    background: "#0d0d0d", padding: "4px 2px",
                  }}>
                    →
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Loop label */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginTop: "24px" }}>
            <div style={{ flex: 1, height: "0.5px", background: "#111" }} />
            <span style={{ fontSize: "10px", color: "#333", fontFamily: "sans-serif", letterSpacing: "3px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              El ciclo no para
            </span>
            <div style={{ flex: 1, height: "0.5px", background: "#111" }} />
          </div>
        </div>
      </section>

      {/* ── 2. Screenshots del dashboard ── */}
      <section style={{ background: "#080808", padding: isMobile ? "60px 24px" : "80px 40px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <p style={{ ...LABEL, textAlign: "center", marginBottom: "16px" }}>El dashboard</p>
          <h2 style={{
            fontFamily: "Georgia, serif", fontSize: isMobile ? "28px" : "36px",
            fontWeight: 400, color: "#f5f5f5", textAlign: "center", margin: "0 0 16px",
          }}>
            Todo el sistema en una pantalla.
          </h2>
          <p style={{ textAlign: "center", fontFamily: "sans-serif", fontSize: "15px", color: "#555", margin: "0 0 56px", fontWeight: 300, maxWidth: "560px", marginLeft: "auto", marginRight: "auto" }}>
            Un dashboard propio para cada cliente. Health score, pipeline en tiempo real, trazabilidad de ángulos y métricas de ads — sin salir del sistema.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "16px" }}>
            <MockHealthScore />
            <MockPipeline />
            <MockTraceability />
            <MockAds />
          </div>

          <p style={{ textAlign: "center", fontFamily: "sans-serif", fontSize: "12px", color: "#333", marginTop: "24px", letterSpacing: "0.5px" }}>
            Datos en tiempo real · Actualización automática · Sin exportar nada manualmente
          </p>
        </div>
      </section>

      {/* ── 3. Trazabilidad inversa ── */}
      <section style={{ background: "#0d0d0d", borderTop: "0.5px solid #111", borderBottom: "0.5px solid #111", padding: isMobile ? "60px 24px" : "80px 40px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <p style={{ ...LABEL, textAlign: "center", marginBottom: "16px" }}>Trazabilidad inversa</p>
          <h2 style={{
            fontFamily: "Georgia, serif", fontSize: isMobile ? "28px" : "36px",
            fontWeight: 400, color: "#f5f5f5", textAlign: "center", margin: "0 0 16px",
          }}>
            Sabés exactamente qué pieza generó cada cierre.
          </h2>
          <p style={{ textAlign: "center", fontFamily: "sans-serif", fontSize: "15px", color: "#555", margin: "0 0 56px", fontWeight: 300 }}>
            Un ejemplo real del proceso:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {[
              {
                step: "01",
                title: "Publicás el reel",
                detail: "\"La historia del dolor\" — un reel sobre el problema que tu cliente tiene antes de encontrarte.",
                tag: "Contenido · Ángulo: Problema",
                tagColor: "#3b82f6",
              },
              {
                step: "02",
                title: "El lead lo ve y escribe",
                detail: "Un seguidor responde la historia o comenta el reel. ManyChat captura el contacto automáticamente.",
                tag: "ManyChat · Apertura automática",
                tagColor: "#a78bfa",
              },
              {
                step: "03",
                title: "Se califica y agenda",
                detail: "La secuencia de DM califica al lead en 7 pasos. Si pasa el filtro, agenda la llamada solo.",
                tag: "Pipeline · Calificado → Agendado",
                tagColor: "#f59e0b",
              },
              {
                step: "04",
                title: "La llamada cierra",
                detail: "El closer conduce la llamada con contexto del lead. El cierre queda registrado en el dashboard.",
                tag: "Ventas · Cerrado $5.500",
                tagColor: "#22c55e",
              },
              {
                step: "05",
                title: "El sistema registra el origen",
                detail: "El cierre queda vinculado al reel que lo originó. El ángulo suma revenue y closes.",
                tag: "Trazabilidad · Origen confirmado",
                tagColor: "#4ade80",
              },
              {
                step: "06",
                title: "Ese ángulo se duplica",
                detail: "El mes siguiente, el calendario de contenido prioriza ese ángulo. Más piezas del mismo tipo, más cierres.",
                tag: "Optimización · Ciclo completado",
                tagColor: "#22c55e",
              },
            ].map((item, i, arr) => (
              <div key={item.step} style={{ display: "flex", gap: "0" }}>
                {/* Left: step number + line */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "48px", flexShrink: 0 }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: "rgba(34,197,94,0.08)", border: "0.5px solid rgba(34,197,94,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <span style={{ fontFamily: "Georgia, serif", fontSize: "11px", color: "#22c55e" }}>{item.step}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ width: "1px", flex: 1, background: "#1a1a1a", margin: "4px 0" }} />
                  )}
                </div>

                {/* Right: content */}
                <div style={{ flex: 1, paddingLeft: "20px", paddingBottom: i < arr.length - 1 ? "32px" : "0" }}>
                  <p style={{ fontFamily: "Georgia, serif", fontSize: "17px", color: "#f5f5f5", margin: "4px 0 8px", fontWeight: 400 }}>
                    {item.title}
                  </p>
                  <p style={{ fontFamily: "sans-serif", fontSize: "14px", color: "#666", lineHeight: 1.6, margin: "0 0 10px", fontWeight: 300 }}>
                    {item.detail}
                  </p>
                  <span style={{
                    fontSize: "9px", color: item.tagColor, fontFamily: "sans-serif",
                    letterSpacing: "1.5px", textTransform: "uppercase",
                    background: `${item.tagColor}10`, border: `0.5px solid ${item.tagColor}30`,
                    padding: "3px 8px", borderRadius: "20px",
                  }}>
                    {item.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Números del sistema ── */}
      <section style={{ background: "#080808", padding: isMobile ? "60px 24px" : "80px 40px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <p style={{ ...LABEL, textAlign: "center", marginBottom: "16px" }}>Los números</p>
          <h2 style={{
            fontFamily: "Georgia, serif", fontSize: isMobile ? "28px" : "36px",
            fontWeight: 400, color: "#f5f5f5", textAlign: "center", margin: "0 0 56px",
          }}>
            El sistema tiene métricas. No suposiciones.
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)",
            gap: "1px",
            background: "#111",
            borderRadius: "12px",
            overflow: "hidden",
            border: "0.5px solid #111",
          }}>
            {NUMBERS.map((n, i) => (
              <FadeUp key={n.value} delay={i * 80}>
                <div style={{ background: "#0d0d0d", padding: "28px 24px", textAlign: "center" }}>
                  <p style={{
                    fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: 400,
                    color: "#22c55e", margin: "0 0 12px", lineHeight: 1,
                  }}>
                    <AnimatedNumber value={n.value} />
                  </p>
                  <p style={{
                    fontFamily: "sans-serif", fontSize: "11px", color: "#555",
                    lineHeight: 1.5, margin: 0, fontWeight: 300,
                  }}>
                    {n.label}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. FAQ ── */}
      <section style={{ background: "#080808", padding: isMobile ? "60px 24px" : "80px 40px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <FadeUp delay={0}>
            <p style={{ ...LABEL, textAlign: "center", marginBottom: "16px" }}>Preguntas frecuentes</p>
            <h2 style={{
              fontFamily: "Georgia, serif", fontSize: isMobile ? "28px" : "36px",
              fontWeight: 400, color: "#f5f5f5", textAlign: "center", margin: "0 0 48px",
            }}>
              Las dudas más comunes, respondidas.
            </h2>
          </FadeUp>
          <div>
            {FAQS.map((faq, i) => (
              <FadeUp key={faq.q} delay={i * 60}>
                <FAQItem q={faq.q} a={faq.a} />
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Frase de cierre ── */}
      <section style={{ background: "#080808", padding: isMobile ? "60px 24px 40px" : "80px 40px 40px", textAlign: "center" }}>
        <FadeUp delay={0} distance={20}>
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            <div style={{ width: "60px", height: "1px", background: "#22c55e", margin: "0 auto 40px" }} />
            <h2 style={{
              fontFamily: "Georgia, serif",
              fontSize: isMobile ? "32px" : "48px",
              fontWeight: 400, color: "#f5f5f5",
              lineHeight: 1.2, letterSpacing: "-0.5px",
              margin: 0,
            }}>
              Cada cierre tiene un origen.<br />Ahora lo sabés.
            </h2>
          </div>
        </FadeUp>
      </section>

      {/* ── CTA ── */}
      <section id="cta" style={{
        background: "#0d0d0d", borderTop: "0.5px solid #111", borderBottom: "0.5px solid #111",
        padding: isMobile ? "80px 24px" : "100px 40px", textAlign: "center",
      }}>
        <FadeUp delay={0}>
          <p style={{ ...LABEL, marginBottom: "24px" }}>El siguiente paso</p>
        </FadeUp>
        <FadeUp delay={100}>
          <h2 style={{
            fontFamily: "Georgia, serif", fontSize: isMobile ? "36px" : "52px",
            fontWeight: 400, color: "#f5f5f5", margin: "0 0 16px", letterSpacing: "-0.5px",
          }}>
            Una conversación de 60 minutos.
          </h2>
        </FadeUp>
        <FadeUp delay={200}>
          <p style={{ fontFamily: "sans-serif", fontSize: "18px", color: "#666", margin: "0 0 48px", fontWeight: 300 }}>
            No es una llamada de ventas. Es un diagnóstico real.
          </p>
        </FadeUp>
        <FadeUp delay={300}>
          <div style={{ display: "flex", gap: isMobile ? "32px" : "60px", flexWrap: "wrap", justifyContent: "center", marginBottom: "48px" }}>
            {[
              { value: "60 min", label: "Duración" },
              { value: "Gratis", label: "Sin compromiso" },
              { value: "Diagnóstico", label: "Real" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "Georgia, serif", fontSize: "20px", color: "#f5f5f5", margin: 0 }}>{s.value}</p>
                <p style={{ fontFamily: "sans-serif", fontSize: "9px", color: "#555", letterSpacing: "2px", textTransform: "uppercase", marginTop: "6px" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </FadeUp>
        {calendlyUrl ? (
          <a
            href={calendlyUrl} target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-block", background: "#22c55e", color: "#000",
              padding: "18px 48px", borderRadius: "8px",
              fontSize: "13px", fontFamily: "sans-serif", fontWeight: 500,
              letterSpacing: "3px", textTransform: "uppercase", textDecoration: "none",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Agendar llamada de diagnóstico
          </a>
        ) : (
          <button disabled style={{
            background: "#1a1a1a", color: "#444", padding: "18px 48px", borderRadius: "8px",
            fontSize: "13px", fontFamily: "sans-serif", fontWeight: 500,
            letterSpacing: "3px", textTransform: "uppercase", border: "none", cursor: "not-allowed",
          }}>
            Próximamente
          </button>
        )}
        <p style={{
          fontFamily: "sans-serif", fontSize: "13px", color: "#444",
          margin: "24px auto 0", maxWidth: "480px", lineHeight: 1.6, fontWeight: 300,
        }}>
          Si después de la llamada tiene sentido trabajar juntos, te explicamos exactamente cómo sería el proceso.
        </p>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        background: "#080808", borderTop: "0.5px solid #111", padding: "40px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px",
      }}>
        <NovaLogo />
        <p style={{ fontFamily: "sans-serif", fontSize: "12px", color: "#444", margin: 0 }}>© 2026 NOVA Scaling</p>
      </footer>

      {/* ── Admin panel ── */}
      {isAdmin && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#0d0d0d", borderTop: "0.5px solid #22c55e",
          padding: "16px 40px", display: "flex", alignItems: "center", gap: "16px",
          zIndex: 9999, overflowX: "auto",
        }}>
          <p style={{ fontFamily: "sans-serif", fontSize: "10px", color: "#4ade80", letterSpacing: "2px", textTransform: "uppercase", flexShrink: 0, margin: 0 }}>
            Modo admin
          </p>
          <input
            value={adminVideo} onChange={(e) => setAdminVideo(e.target.value)}
            placeholder="URL del video (YouTube, Loom o Vimeo)"
            style={{
              background: "#080808", border: "0.5px solid #222", borderRadius: "8px",
              padding: "8px 14px", color: "#f5f5f5", fontSize: "13px", fontFamily: "sans-serif",
              width: "340px", outline: "none", flexShrink: 0,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#222")}
          />
          <input
            value={adminCalendly} onChange={(e) => setAdminCalendly(e.target.value)}
            placeholder="URL de Calendly"
            style={{
              background: "#080808", border: "0.5px solid #222", borderRadius: "8px",
              padding: "8px 14px", color: "#f5f5f5", fontSize: "13px", fontFamily: "sans-serif",
              width: "280px", outline: "none", flexShrink: 0,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#222")}
          />
          <button
            onClick={handleSave} disabled={saving}
            style={{
              background: saving ? "#1a1a1a" : "#22c55e", color: saving ? "#444" : "#000",
              border: "none", borderRadius: "8px", padding: "9px 20px",
              fontSize: "11px", fontFamily: "sans-serif", fontWeight: 500,
              letterSpacing: "2px", textTransform: "uppercase",
              cursor: saving ? "not-allowed" : "pointer", flexShrink: 0,
            }}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      )}

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
