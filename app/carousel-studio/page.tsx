"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { DashboardLayout, useActiveClient } from "@/components/dashboard-layout"
import { Maximize2, GripVertical } from "lucide-react"

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type SlideTheme    = "dark" | "light" | "cream"
type FontPair      = "georgia" | "playfair" | "impact"
type CarouselStatus = "draft" | "exported" | "published"
type CharPos       = "bottom-right" | "bottom-left" | "center"

interface Slide {
  id: string
  label: string
  title: string
  subtitle: string
  cta: string
}

interface Carousel {
  id: string
  name: string
  clientId: string | null
  createdAt: string
  status: CarouselStatus
  theme: SlideTheme
  fontPair: FontPair
  accentColor: string
  showCharacter: boolean
  characterPosition: CharPos
  showLogo: boolean
  slides: Slide[]
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const THEMES = {
  dark:  { bg: "#080808", text: "#ffffff", sub: "#a1a1aa", border: "#1a1a1a", label: "Dark"  },
  light: { bg: "#f5f5f0", text: "#111111", sub: "#6b7280", border: "#e0e0da", label: "Light" },
  cream: { bg: "#EAE6DD", text: "#141310", sub: "#6b7280", border: "#d4cfc5", label: "Cream" },
}

const FONTS = {
  georgia:  { title: "Georgia, serif",                             body: "Georgia, serif",       name: "Georgia"        },
  playfair: { title: "'Playfair Display', Georgia, serif",         body: "'Lora', Georgia, serif", name: "Playfair / Lora" },
  impact:   { title: "Impact, 'Arial Black', sans-serif",          body: "Arial, sans-serif",    name: "Impact / Arial" },
}

const ACCENT_PRESETS = ["#22c55e", "#d4836b", "#3b82f6", "#f59e0b", "#ec4899", "#ffffff"]
const CTA_SUGG       = ["DESLIZÁ →", "SEGUÍ →", "GUARDÁ ESTO →", "COMENTÁ ABAJO →"]
const LABEL_SUGG     = [
  "01 · HOOK", "02 · EL PROBLEMA", "03 · LA SOLUCIÓN", "04 · EL MÉTODO",
  "05 · RESULTADO", "06 · PRUEBA SOCIAL", "07 · CTA", "08 · BONUS",
]

function genId() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36) }

function emptySlide(i: number): Slide {
  return { id: genId(), label: LABEL_SUGG[i] ?? `${String(i + 1).padStart(2, "0")} · SLIDE`, title: "", subtitle: "", cta: "DESLIZÁ →" }
}

function makeCarousel(name: string, clientId?: string | null): Carousel {
  return {
    id: genId(), name,
    clientId: clientId ?? null,
    createdAt: new Date().toISOString(),
    status: "draft",
    theme: "dark", fontPair: "georgia", accentColor: "#22c55e",
    showCharacter: false, characterPosition: "bottom-right", showLogo: false,
    slides: [0, 1, 2, 3].map(emptySlide),
  }
}

const LS_KEY = "nova_carousels_v2"
const lsLoad = (): Carousel[] => { try { return JSON.parse(typeof window !== "undefined" ? (localStorage.getItem(LS_KEY) ?? "[]") : "[]") } catch { return [] } }
const lsSave = (cs: Carousel[]) => { try { localStorage.setItem(LS_KEY, JSON.stringify(cs)) } catch {} }

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE RENDER
// ═══════════════════════════════════════════════════════════════════════════════

function SlideRender({ slide, carousel, scale = 1 }: { slide: Slide; carousel: Carousel; scale?: number }) {
  const t = THEMES[carousel.theme]
  const f = FONTS[carousel.fontPair]
  const lines = (slide.title || "").split("\n")

  return (
    <div style={{ width: 1080, height: 1350, transform: `scale(${scale})`, transformOrigin: "top left", background: t.bg, position: "relative", overflow: "hidden", flexShrink: 0 }}>
      {/* Label */}
      <div style={{ position: "absolute", top: 72, left: 72, fontSize: 26, fontFamily: "monospace", letterSpacing: 6, color: t.sub, textTransform: "uppercase" }}>
        {slide.label || "01 · SLIDE"}
      </div>

      {/* Logo placeholder */}
      {carousel.showLogo && (
        <div style={{ position: "absolute", top: 56, right: 72, border: `1px solid ${t.border}`, borderRadius: 6, padding: "7px 14px", fontSize: 9, color: t.sub, letterSpacing: 3, fontFamily: "monospace" }}>
          LOGO
        </div>
      )}

      {/* Title + Subtitle */}
      <div style={{ position: "absolute", left: 72, right: 72, top: "50%", transform: "translateY(-58%)" }}>
        <div style={{ fontSize: 104, fontFamily: f.title, fontWeight: 700, lineHeight: 1.08, marginBottom: 48 }}>
          {lines.map((ln, i) => (
            <div key={i} style={{ color: i === lines.length - 1 ? carousel.accentColor : t.text }}>
              {ln || "\u00A0"}
            </div>
          ))}
        </div>
        {slide.subtitle && (
          <div style={{ fontSize: 38, fontFamily: f.body, fontWeight: 300, lineHeight: 1.65, color: t.sub }}>
            {slide.subtitle}
          </div>
        )}
      </div>

      {/* Character silhouette */}
      {carousel.showCharacter && (
        <div style={{
          position: "absolute", bottom: 0,
          ...(carousel.characterPosition === "bottom-right" ? { right: 0, borderTopLeftRadius: 999 }
            : carousel.characterPosition === "bottom-left" ? { left: 0, borderTopRightRadius: 999 }
            : { left: "50%", transform: "translateX(-50%)", borderRadius: "999px 999px 0 0" }),
          width: 380, height: 580, background: t.text, opacity: 0.08,
        }} />
      )}

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 72, left: 72, right: 72 }}>
        <div style={{ height: 1, background: t.border, marginBottom: 32 }} />
        <div style={{ fontSize: 24, fontFamily: "monospace", letterSpacing: 8, color: t.sub, textTransform: "uppercase" }}>
          {slide.cta || "DESLIZÁ →"}
        </div>
      </div>
    </div>
  )
}

// Thumbnail
function Thumb({ slide, carousel, active, onClick }: { slide: Slide; carousel: Carousel; active?: boolean; onClick?: () => void }) {
  const W = 36, scale = W / 1080
  return (
    <div onClick={onClick} style={{ width: W, height: 45, overflow: "hidden", borderRadius: 3, cursor: "pointer", flexShrink: 0, border: `1.5px solid ${active ? "#22c55e" : "transparent"}`, transition: "border-color 0.15s" }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", pointerEvents: "none" }}>
        <SlideRender slide={slide} carousel={carousel} />
      </div>
    </div>
  )
}

// Scaled preview that fits its container
function ScaledPreview({ slide, carousel }: { slide: Slide; carousel: Carousel }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.38)
  useEffect(() => {
    if (!ref.current) return
    const obs = new ResizeObserver(([e]) => setScale((e.contentRect.width || 400) / 1080))
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ width: "100%", height: scale * 1350, overflow: "hidden", borderRadius: 8 }}>
      <SlideRender slide={slide} carousel={carousel} scale={scale} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function CarouselStudioInner() {
  const clientId = useActiveClient()

  // ── State ──
  const [carousels, setCarousels]   = useState<Carousel[]>([])
  const [activeId, setActiveId]     = useState<string | null>(null)
  const [slideIdx, setSlideIdx]     = useState(0)
  const [aiOpen, setAiOpen]         = useState(false)
  const [aiForm, setAiForm]         = useState({ topic: "", slideCount: 5, tone: "educativo", cta: "comentá" })
  const [aiStatus, setAiStatus]     = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [newName, setNewName]       = useState("")
  const [showNew, setShowNew]       = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [dragIdx, setDragIdx]       = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  useEffect(() => { setCarousels(lsLoad()) }, [])

  const save = useCallback((cs: Carousel[]) => { setCarousels(cs); lsSave(cs) }, [])

  const activeCarousel = carousels.find(c => c.id === activeId) ?? null
  const activeSlide    = activeCarousel?.slides[slideIdx] ?? null

  const updateCarousel = useCallback((updated: Carousel) => {
    save(carousels.map(c => c.id === updated.id ? updated : c))
  }, [carousels, save])

  const updateSlide = useCallback((updated: Slide) => {
    if (!activeCarousel) return
    updateCarousel({ ...activeCarousel, slides: activeCarousel.slides.map(s => s.id === updated.id ? updated : s) })
  }, [activeCarousel, updateCarousel])

  // ── Carousel actions ──
  const createCarousel = () => {
    if (!newName.trim()) return
    const c = makeCarousel(newName.trim(), clientId)
    save([...carousels, c])
    setActiveId(c.id); setSlideIdx(0)
    setNewName(""); setShowNew(false)
  }

  const addSlide = () => {
    if (!activeCarousel) return
    const s = emptySlide(activeCarousel.slides.length)
    updateCarousel({ ...activeCarousel, slides: [...activeCarousel.slides, s] })
    setSlideIdx(activeCarousel.slides.length)
  }

  const deleteSlide = (i: number) => {
    if (!activeCarousel || activeCarousel.slides.length <= 1) return
    const slides = activeCarousel.slides.filter((_, idx) => idx !== i)
    updateCarousel({ ...activeCarousel, slides })
    setSlideIdx(Math.min(slideIdx, slides.length - 1))
  }

  const exportJSON = (c: Carousel) => {
    const blob = new Blob([JSON.stringify(c, null, 2)], { type: "application/json" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `carrusel-${c.name.toLowerCase().replace(/\s+/g, "-")}.json`
    a.click(); URL.revokeObjectURL(a.href)
    save(carousels.map(x => x.id === c.id ? { ...x, status: "exported" as CarouselStatus } : x))
  }

  const duplicateCarousel = (c: Carousel) => {
    const dup: Carousel = { ...c, id: genId(), name: `Copia de ${c.name}`, createdAt: new Date().toISOString(), status: "draft", slides: c.slides.map(s => ({ ...s, id: genId() })) }
    save([...carousels, dup])
  }

  const deleteCarousel = (id: string) => {
    save(carousels.filter(c => c.id !== id))
    if (activeId === id) { setActiveId(null); setSlideIdx(0) }
  }

  // ── AI generate ──
  const generateAI = async (regenerateSlideIdx?: number) => {
    if (!aiForm.topic.trim()) return
    setAiStatus("Analizando tema...")
    const t1 = setTimeout(() => setAiStatus("Armando estructura..."), 900)
    const t2 = setTimeout(() => setAiStatus("Escribiendo slides..."), 2000)
    try {
      const res = await fetch("/api/carousel-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiForm.topic,
          slideCount: regenerateSlideIdx !== undefined ? 1 : aiForm.slideCount,
          tone: aiForm.tone, cta: aiForm.cta,
        }),
      })
      const json = await res.json()
      clearTimeout(t1); clearTimeout(t2)
      if (json.slides?.length) {
        const withIds = json.slides.map((s: Omit<Slide, "id">) => ({ ...s, id: genId() }))
        if (regenerateSlideIdx !== undefined && activeCarousel) {
          const slides = [...activeCarousel.slides]
          slides[regenerateSlideIdx] = { ...withIds[0], id: slides[regenerateSlideIdx].id }
          updateCarousel({ ...activeCarousel, slides })
        } else if (activeCarousel) {
          updateCarousel({ ...activeCarousel, slides: withIds })
          setSlideIdx(0)
        } else {
          const c = makeCarousel(aiForm.topic, clientId)
          c.slides = withIds
          const next = [...carousels, c]
          save(next); setActiveId(c.id); setSlideIdx(0)
        }
      }
      setAiStatus("✓ Listo")
      setTimeout(() => { setAiStatus(null); if (regenerateSlideIdx === undefined) setAiOpen(false) }, 1400)
    } catch {
      clearTimeout(t1); clearTimeout(t2)
      setAiStatus("Error al generar. Intentá de nuevo.")
      setTimeout(() => setAiStatus(null), 2500)
    }
  }

  // ── Drag and drop ──
  const onDrop = (overIdx: number) => {
    if (dragIdx === null || !activeCarousel) return
    const slides = [...activeCarousel.slides]
    const [removed] = slides.splice(dragIdx, 1)
    slides.splice(overIdx, 0, removed)
    updateCarousel({ ...activeCarousel, slides })
    setSlideIdx(overIdx)
    setDragIdx(null); setDragOverIdx(null)
  }

  // ── Shared styles ──
  const card: React.CSSProperties = { background: "#0d0d0d", border: "0.5px solid #111", borderRadius: 10 }
  const sectionLabel: React.CSSProperties = { fontSize: 9, fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", textTransform: "uppercase", color: "#4ade80" }
  const smallLabel: React.CSSProperties = { ...sectionLabel, color: "#555", fontSize: 8 }
  const toggle = (on: boolean): React.CSSProperties => ({
    width: 36, height: 20, borderRadius: 10, background: on ? "#22c55e" : "#1a1a1a",
    border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0,
  })

  // ═══ RENDER ═══════════════════════════════════════════════════════════════════

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lora:wght@300;400&display=swap');
        .cs-btn { transition: opacity 0.15s; }
        .cs-btn:hover { opacity: 0.75; }
        .cs-row:hover .cs-del { opacity: 1 !important; }
        .cs-hist-row:hover { background: rgba(255,255,255,0.015) !important; }
        .cs-hist-row select { background: transparent !important; }
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }
      `}</style>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
        <div>
          <p style={{ ...sectionLabel, marginBottom: 6 }}>Herramientas</p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 400, color: "#f5f5f5", letterSpacing: -0.5 }}>
            Carousel Studio
          </h1>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="cs-btn" onClick={() => setAiOpen(v => !v)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 8, border: "0.5px solid rgba(34,197,94,0.3)", background: aiOpen ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.05)", color: "#4ade80", fontSize: 11, fontFamily: "sans-serif", letterSpacing: 1.5, cursor: "pointer" }}>
            ✦ Generar con IA
          </button>
          <button className="cs-btn" onClick={() => setShowNew(v => !v)} style={{ padding: "9px 18px", borderRadius: 8, border: "0.5px solid #1a1a1a", background: "transparent", color: "#f5f5f5", fontSize: 11, fontFamily: "sans-serif", letterSpacing: 1.5, cursor: "pointer" }}>
            + Nuevo carrusel
          </button>
        </div>
      </div>

      {/* ── New carousel form ─────────────────────────────────────── */}
      {showNew && (
        <div style={{ ...card, padding: "14px 18px", marginBottom: 18, display: "flex", gap: 12, alignItems: "center" }}>
          <input autoFocus placeholder="Nombre del carrusel..." value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") createCarousel(); if (e.key === "Escape") setShowNew(false) }}
            style={{ flex: 1, background: "transparent", border: "none", borderBottom: "0.5px solid #222", padding: "8px 0", color: "#f5f5f5", fontSize: 14, fontFamily: "sans-serif", outline: "none" }}
          />
          <button onClick={createCarousel} style={{ padding: "7px 16px", borderRadius: 6, background: "#22c55e", border: "none", color: "#000", fontSize: 11, fontWeight: 600, letterSpacing: 1, cursor: "pointer", fontFamily: "sans-serif" }}>Crear</button>
          <button onClick={() => setShowNew(false)} style={{ padding: "7px 12px", borderRadius: 6, background: "transparent", border: "0.5px solid #222", color: "#555", fontSize: 13, cursor: "pointer", fontFamily: "sans-serif" }}>✕</button>
        </div>
      )}

      {/* ── AI Panel ──────────────────────────────────────────────── */}
      {aiOpen && (
        <div style={{ ...card, padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <p style={sectionLabel}>✦ Generar con IA</p>
            <button onClick={() => setAiOpen(false)} style={{ background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr repeat(3, auto)", gap: 16, alignItems: "end" }}>
            <div>
              <p style={{ ...smallLabel, marginBottom: 8 }}>¿Sobre qué es el carrusel?</p>
              <input placeholder="Ej: Cómo cerrar clientes sin bajar precios" value={aiForm.topic}
                onChange={e => setAiForm(f => ({ ...f, topic: e.target.value }))}
                style={{ width: "100%", background: "transparent", border: "none", borderBottom: "0.5px solid #222", padding: "10px 0", color: "#f5f5f5", fontSize: 13, fontFamily: "sans-serif", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <p style={{ ...smallLabel, marginBottom: 8 }}>Slides</p>
              <select value={aiForm.slideCount} onChange={e => setAiForm(f => ({ ...f, slideCount: Number(e.target.value) }))}
                style={{ background: "#111", border: "0.5px solid #222", borderRadius: 6, padding: "9px 12px", color: "#f5f5f5", fontSize: 12, cursor: "pointer", outline: "none" }}>
                {[4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n} slides</option>)}
              </select>
            </div>
            <div>
              <p style={{ ...smallLabel, marginBottom: 8 }}>Tono</p>
              <select value={aiForm.tone} onChange={e => setAiForm(f => ({ ...f, tone: e.target.value }))}
                style={{ background: "#111", border: "0.5px solid #222", borderRadius: 6, padding: "9px 12px", color: "#f5f5f5", fontSize: 12, cursor: "pointer", outline: "none" }}>
                {[["educativo","Educativo"],["provocador","Provocador"],["testimonial","Testimonial"],["tutorial","Tutorial paso a paso"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <p style={{ ...smallLabel, marginBottom: 8 }}>CTA final</p>
              <select value={aiForm.cta} onChange={e => setAiForm(f => ({ ...f, cta: e.target.value }))}
                style={{ background: "#111", border: "0.5px solid #222", borderRadius: 6, padding: "9px 12px", color: "#f5f5f5", fontSize: 12, cursor: "pointer", outline: "none" }}>
                {[["comentá","Comentá"],["guardá","Guardá"],["seguime","Seguime"],["dm","Mandame DM"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 20, alignItems: "center" }}>
            <button onClick={() => generateAI()} disabled={!aiForm.topic.trim() || !!aiStatus}
              style={{ padding: "10px 24px", borderRadius: 8, background: "#22c55e", border: "none", color: "#000", fontSize: 11, fontFamily: "sans-serif", fontWeight: 600, letterSpacing: 2, cursor: "pointer", opacity: (!aiForm.topic.trim() || !!aiStatus) ? 0.4 : 1 }}>
              Generar
            </button>
            {activeCarousel && (
              <button onClick={() => generateAI()} disabled={!aiForm.topic.trim() || !!aiStatus}
                style={{ padding: "10px 20px", borderRadius: 8, background: "transparent", border: "0.5px solid #222", color: "#555", fontSize: 11, fontFamily: "sans-serif", letterSpacing: 1.5, cursor: "pointer", opacity: !!aiStatus ? 0.4 : 1 }}>
                Regenerar todo
              </button>
            )}
            {aiStatus && (
              <p style={{ fontSize: 12, fontFamily: "sans-serif", color: aiStatus.startsWith("✓") ? "#22c55e" : "#555", fontWeight: 300, letterSpacing: 0.8 }}>
                {aiStatus}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Editor (3 columnas) ───────────────────────────────────── */}
      {activeCarousel && activeSlide ? (
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 280px", gap: 16, marginBottom: 32, alignItems: "start" }}>

          {/* ─ LEFT: Slide list ─ */}
          <div style={{ ...card }}>
            <div style={{ padding: "12px 14px", borderBottom: "0.5px solid #111", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ ...smallLabel }}>Slides ({activeCarousel.slides.length})</p>
              <button onClick={addSlide} style={{ width: 22, height: 22, borderRadius: 4, background: "rgba(34,197,94,0.1)", border: "0.5px solid rgba(34,197,94,0.2)", color: "#22c55e", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>+</button>
            </div>
            <div>
              {activeCarousel.slides.map((slide, i) => (
                <div key={slide.id} className="cs-row"
                  draggable
                  onDragStart={() => setDragIdx(i)}
                  onDragOver={e => { e.preventDefault(); setDragOverIdx(i) }}
                  onDrop={() => onDrop(i)}
                  onDragEnd={() => { setDragIdx(null); setDragOverIdx(null) }}
                  onClick={() => setSlideIdx(i)}
                  style={{
                    display: "flex", alignItems: "center", gap: 7, padding: "7px 10px 7px 6px",
                    cursor: "pointer",
                    borderLeft: `2px solid ${i === slideIdx ? "#22c55e" : "transparent"}`,
                    background: i === slideIdx ? "rgba(34,197,94,0.04)" : dragOverIdx === i ? "rgba(34,197,94,0.08)" : "transparent",
                    transition: "all 0.1s", borderTop: dragOverIdx === i && dragIdx !== null && dragIdx !== i ? "1.5px solid #22c55e" : "1.5px solid transparent",
                  }}
                >
                  <GripVertical size={10} color="#2a2a2a" style={{ flexShrink: 0, cursor: "grab" }} />
                  <span style={{ fontSize: 9, color: "#2a2a2a", fontFamily: "monospace", flexShrink: 0, minWidth: 12 }}>{i + 1}</span>
                  <Thumb slide={slide} carousel={activeCarousel} active={i === slideIdx} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 7, color: i === slideIdx ? "#4ade80" : "#444", fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>
                      {slide.label}
                    </p>
                    <p style={{ fontSize: 10, color: i === slideIdx ? "#f5f5f5" : "#777", fontFamily: "sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {slide.title.replace("\n", " ") || "Sin título"}
                    </p>
                  </div>
                  <button className="cs-del" onClick={e => { e.stopPropagation(); if (confirm("¿Eliminar slide?")) deleteSlide(i) }}
                    style={{ opacity: 0, background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11, transition: "opacity 0.15s", flexShrink: 0, padding: "2px 3px" }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ─ CENTER: Preview ─ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Font + fullscreen bar */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {(Object.keys(FONTS) as FontPair[]).map(fp => (
                <button key={fp} onClick={() => updateCarousel({ ...activeCarousel, fontPair: fp })}
                  style={{ padding: "6px 14px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: FONTS[fp].title, background: activeCarousel.fontPair === fp ? "rgba(34,197,94,0.1)" : "transparent", border: `0.5px solid ${activeCarousel.fontPair === fp ? "rgba(34,197,94,0.3)" : "#1a1a1a"}`, color: activeCarousel.fontPair === fp ? "#4ade80" : "#555" }}>
                  {FONTS[fp].name}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <button onClick={() => setFullscreen(true)} style={{ padding: "6px 10px", borderRadius: 6, background: "transparent", border: "0.5px solid #1a1a1a", color: "#555", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <Maximize2 size={12} />
              </button>
            </div>

            {/* Preview */}
            <div style={{ ...card, overflow: "hidden" }}>
              <ScaledPreview slide={activeSlide} carousel={activeCarousel} />
            </div>

            {/* Navigation dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
              {activeCarousel.slides.map((_, i) => (
                <button key={i} onClick={() => setSlideIdx(i)}
                  style={{ width: i === slideIdx ? 20 : 6, height: 6, borderRadius: 3, background: i === slideIdx ? "#22c55e" : "#1a1a1a", border: "none", cursor: "pointer", transition: "all 0.2s", padding: 0 }} />
              ))}
            </div>

            {/* Thumbnail strip */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "2px 0" }}>
              {activeCarousel.slides.map((s, i) => (
                <Thumb key={s.id} slide={s} carousel={activeCarousel} active={i === slideIdx} onClick={() => setSlideIdx(i)} />
              ))}
            </div>
          </div>

          {/* ─ RIGHT: Edit panel ─ */}
          <div style={{ ...card, padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Tema */}
            <div>
              <p style={{ ...smallLabel, marginBottom: 10 }}>Tema</p>
              <div style={{ display: "flex", gap: 6 }}>
                {(Object.keys(THEMES) as SlideTheme[]).map(th => (
                  <button key={th} onClick={() => updateCarousel({ ...activeCarousel, theme: th })}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 6, cursor: "pointer", background: THEMES[th].bg, color: THEMES[th].text, border: `1.5px solid ${activeCarousel.theme === th ? "#22c55e" : THEMES[th].border}`, fontSize: 9, fontFamily: "sans-serif", letterSpacing: 1 }}>
                    {THEMES[th].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color acento */}
            <div>
              <p style={{ ...smallLabel, marginBottom: 10 }}>Color acento</p>
              <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
                {ACCENT_PRESETS.map(c => (
                  <button key={c} onClick={() => updateCarousel({ ...activeCarousel, accentColor: c })}
                    style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: `2.5px solid ${activeCarousel.accentColor === c ? "#f5f5f5" : "transparent"}`, cursor: "pointer", transition: "transform 0.1s", transform: activeCarousel.accentColor === c ? "scale(1.2)" : "scale(1)" }} />
                ))}
                <input type="color" value={activeCarousel.accentColor} onChange={e => updateCarousel({ ...activeCarousel, accentColor: e.target.value })}
                  style={{ width: 22, height: 22, borderRadius: "50%", border: "none", cursor: "pointer", padding: 0, background: "none" }} title="Color personalizado" />
              </div>
            </div>

            <div style={{ height: "0.5px", background: "#111" }} />

            {/* Label */}
            <div>
              <p style={{ ...smallLabel, marginBottom: 8 }}>Label del slide</p>
              <input value={activeSlide.label} onChange={e => updateSlide({ ...activeSlide, label: e.target.value })} placeholder="01 · HOOK"
                style={{ width: "100%", background: "transparent", border: "none", borderBottom: "0.5px solid #1a1a1a", padding: "8px 0", color: "#f5f5f5", fontSize: 11, fontFamily: "monospace", letterSpacing: 2, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {LABEL_SUGG.slice(0, 5).map(l => (
                  <button key={l} onClick={() => updateSlide({ ...activeSlide, label: l })}
                    style={{ fontSize: 7, padding: "3px 6px", borderRadius: 4, background: "transparent", border: "0.5px solid #1a1a1a", color: "#444", cursor: "pointer", letterSpacing: 1, fontFamily: "monospace" }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Título */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={smallLabel}>Título</p>
                <span style={{ fontSize: 9, color: "#333", fontFamily: "sans-serif" }}>{activeSlide.title.length} car</span>
              </div>
              <textarea value={activeSlide.title} onChange={e => updateSlide({ ...activeSlide, title: e.target.value })}
                placeholder={"Primera línea\nSegunda línea\nÚltima en color acento"} rows={3}
                style={{ width: "100%", background: "transparent", border: "0.5px solid #1a1a1a", borderRadius: 6, padding: 10, color: "#f5f5f5", fontSize: 12, fontFamily: "Georgia, serif", outline: "none", resize: "none", lineHeight: 1.6, boxSizing: "border-box" }} />
            </div>

            {/* Subtítulo */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={smallLabel}>Subtítulo</p>
                <span style={{ fontSize: 9, color: activeSlide.subtitle.length > 100 ? "#f59e0b" : "#333", fontFamily: "sans-serif" }}>{activeSlide.subtitle.length}/120</span>
              </div>
              <textarea value={activeSlide.subtitle} onChange={e => updateSlide({ ...activeSlide, subtitle: e.target.value.slice(0, 120) })}
                placeholder="Complemento del título, 1-2 líneas." rows={2}
                style={{ width: "100%", background: "transparent", border: "0.5px solid #1a1a1a", borderRadius: 6, padding: 10, color: "#f5f5f5", fontSize: 12, fontFamily: "sans-serif", fontWeight: 300, outline: "none", resize: "none", lineHeight: 1.6, boxSizing: "border-box" }} />
            </div>

            {/* Footer CTA */}
            <div>
              <p style={{ ...smallLabel, marginBottom: 8 }}>Footer CTA</p>
              <input value={activeSlide.cta} onChange={e => updateSlide({ ...activeSlide, cta: e.target.value })}
                style={{ width: "100%", background: "transparent", border: "none", borderBottom: "0.5px solid #1a1a1a", padding: "8px 0", color: "#f5f5f5", fontSize: 11, fontFamily: "monospace", letterSpacing: 2, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {CTA_SUGG.map(s => (
                  <button key={s} onClick={() => updateSlide({ ...activeSlide, cta: s })}
                    style={{ fontSize: 7, padding: "3px 7px", borderRadius: 4, background: "transparent", border: "0.5px solid #1a1a1a", color: "#444", cursor: "pointer", letterSpacing: 1, fontFamily: "monospace" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ height: "0.5px", background: "#111" }} />

            {/* Toggles */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Personaje */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 12, fontFamily: "sans-serif", fontWeight: 300, color: "#888" }}>Personaje</p>
                  <p style={{ fontSize: 9, color: "#333", fontFamily: "sans-serif" }}>Silueta decorativa</p>
                </div>
                <button onClick={() => updateCarousel({ ...activeCarousel, showCharacter: !activeCarousel.showCharacter })} style={toggle(activeCarousel.showCharacter)}>
                  <span style={{ position: "absolute", top: 3, left: activeCarousel.showCharacter ? 18 : 3, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </button>
              </div>
              {activeCarousel.showCharacter && (
                <div style={{ display: "flex", gap: 5 }}>
                  {([["bottom-right", "↘ Der"], ["bottom-left", "↙ Izq"], ["center", "↓ Centro"]] as [CharPos, string][]).map(([p, l]) => (
                    <button key={p} onClick={() => updateCarousel({ ...activeCarousel, characterPosition: p })}
                      style={{ flex: 1, padding: "5px 2px", borderRadius: 5, fontSize: 9, background: activeCarousel.characterPosition === p ? "rgba(34,197,94,0.1)" : "transparent", border: `0.5px solid ${activeCarousel.characterPosition === p ? "rgba(34,197,94,0.3)" : "#1a1a1a"}`, color: activeCarousel.characterPosition === p ? "#4ade80" : "#555", cursor: "pointer" }}>
                      {l}
                    </button>
                  ))}
                </div>
              )}
              {/* Logo */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 12, fontFamily: "sans-serif", fontWeight: 300, color: "#888" }}>Logo de marca</p>
                  <p style={{ fontSize: 9, color: "#333", fontFamily: "sans-serif" }}>Esquina superior derecha</p>
                </div>
                <button onClick={() => updateCarousel({ ...activeCarousel, showLogo: !activeCarousel.showLogo })} style={toggle(activeCarousel.showLogo)}>
                  <span style={{ position: "absolute", top: 3, left: activeCarousel.showLogo ? 18 : 3, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </button>
              </div>
            </div>

            <div style={{ height: "0.5px", background: "#111" }} />

            {/* Regenerar slide */}
            {aiForm.topic.trim() && (
              <button onClick={() => generateAI(slideIdx)} disabled={!!aiStatus}
                style={{ width: "100%", padding: 9, borderRadius: 7, background: "transparent", border: "0.5px solid rgba(34,197,94,0.2)", color: "#4ade80", fontSize: 10, fontFamily: "sans-serif", letterSpacing: 1.5, cursor: "pointer", opacity: aiStatus ? 0.4 : 1 }}>
                ✦ Regenerar este slide
              </button>
            )}

            {/* Export */}
            <button onClick={() => exportJSON(activeCarousel)}
              style={{ width: "100%", padding: 9, borderRadius: 7, background: "rgba(34,197,94,0.07)", border: "0.5px solid rgba(34,197,94,0.2)", color: "#22c55e", fontSize: 10, fontFamily: "sans-serif", letterSpacing: 1.5, cursor: "pointer" }}>
              ↓ Exportar JSON
            </button>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div style={{ ...card, padding: "56px 32px", textAlign: "center", marginBottom: 32 }}>
          <p style={{ fontSize: 36, marginBottom: 16 }}>🎠</p>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 20, color: "#f5f5f5", marginBottom: 10 }}>
            Ningún carrusel activo
          </p>
          <p style={{ fontSize: 12, fontFamily: "sans-serif", fontWeight: 300, color: "#444", marginBottom: 24, lineHeight: 1.6 }}>
            Creá uno nuevo o generá uno con IA.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => setShowNew(true)} style={{ padding: "10px 24px", borderRadius: 8, background: "#22c55e", border: "none", color: "#000", fontSize: 11, fontFamily: "sans-serif", fontWeight: 600, letterSpacing: 2, cursor: "pointer" }}>
              + Nuevo carrusel
            </button>
            <button onClick={() => setAiOpen(true)} style={{ padding: "10px 24px", borderRadius: 8, border: "0.5px solid rgba(34,197,94,0.3)", background: "transparent", color: "#4ade80", fontSize: 11, fontFamily: "sans-serif", letterSpacing: 1.5, cursor: "pointer" }}>
              ✦ Generar con IA
            </button>
          </div>
        </div>
      )}

      {/* ── Historial ────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ padding: "14px 20px", borderBottom: "0.5px solid #111", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={smallLabel}>Historial · {carousels.length} carruseles</p>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ background: "#111", border: "0.5px solid #222", borderRadius: 6, padding: "5px 10px", color: "#888", fontSize: 11, cursor: "pointer", outline: "none" }}>
            {[["all","Todos"],["draft","Borrador"],["exported","Exportado"],["published","Publicado"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {carousels.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 12, fontFamily: "sans-serif", fontWeight: 300, color: "#333" }}>No hay carruseles todavía.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid #111" }}>
                  {["Nombre", "Fecha", "Slides", "Estado", "Acciones"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 8, fontFamily: "sans-serif", fontWeight: 500, letterSpacing: 2.5, color: "#444", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {carousels
                  .filter(c => filterStatus === "all" || c.status === filterStatus)
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map(c => {
                    const statusColor: Record<CarouselStatus, string> = { draft: "#555", exported: "#f59e0b", published: "#22c55e" }
                    return (
                      <tr key={c.id} className="cs-hist-row" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.02)", transition: "background 0.1s" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <p style={{ fontSize: 13, fontFamily: "sans-serif", fontWeight: 300, color: "#f5f5f5" }}>{c.name}</p>
                        </td>
                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                          <p style={{ fontSize: 11, fontFamily: "sans-serif", fontWeight: 300, color: "#555" }}>
                            {new Date(c.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <p style={{ fontSize: 13, fontFamily: "Georgia, serif", color: "#888" }}>{c.slides.length}</p>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <select value={c.status} onChange={e => save(carousels.map(x => x.id === c.id ? { ...x, status: e.target.value as CarouselStatus } : x))}
                            style={{ background: "transparent", border: "none", color: statusColor[c.status], fontSize: 10, cursor: "pointer", outline: "none", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: 1 }}>
                            <option value="draft">Borrador</option>
                            <option value="exported">Exportado</option>
                            <option value="published">Publicado</option>
                          </select>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 7 }}>
                            <button onClick={() => { setActiveId(c.id); setSlideIdx(0); window.scrollTo({ top: 0, behavior: "smooth" }) }}
                              style={{ padding: "4px 11px", borderRadius: 5, background: "transparent", border: "0.5px solid #1a1a1a", color: "#888", fontSize: 10, cursor: "pointer", fontFamily: "sans-serif" }}>
                              Editar
                            </button>
                            <button onClick={() => duplicateCarousel(c)}
                              style={{ padding: "4px 11px", borderRadius: 5, background: "transparent", border: "0.5px solid #1a1a1a", color: "#888", fontSize: 10, cursor: "pointer", fontFamily: "sans-serif" }}>
                              Duplicar
                            </button>
                            <button onClick={() => exportJSON(c)}
                              style={{ padding: "4px 11px", borderRadius: 5, background: "rgba(34,197,94,0.06)", border: "0.5px solid rgba(34,197,94,0.15)", color: "#22c55e", fontSize: 10, cursor: "pointer", fontFamily: "sans-serif" }}>
                              JSON
                            </button>
                            <button onClick={() => { if (confirm(`¿Eliminar "${c.name}"?`)) deleteCarousel(c.id) }}
                              style={{ padding: "4px 11px", borderRadius: 5, background: "transparent", border: "0.5px solid rgba(239,68,68,0.15)", color: "#ef4444", fontSize: 10, cursor: "pointer", fontFamily: "sans-serif" }}>
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* Build instructions */}
        <div style={{ padding: "16px 20px", borderTop: "0.5px solid #111", background: "rgba(34,197,94,0.02)" }}>
          <p style={{ ...smallLabel, marginBottom: 8 }}>Para exportar PNG (resolución real 1080×1350)</p>
          <p style={{ fontSize: 11, fontFamily: "monospace", color: "#444", lineHeight: 1.8 }}>
            1. Exportá el JSON del carrusel<br/>
            2. Movelo a la raíz del proyecto<br/>
            3. <span style={{ color: "#22c55e" }}>pnpm add puppeteer</span> (primera vez)<br/>
            4. <span style={{ color: "#22c55e" }}>node scripts/build-carousel.js --file=carrusel-nombre.json</span><br/>
            5. Los PNG quedan en <span style={{ color: "#22c55e" }}>~/Desktop/Instagram/[nombre]/</span>
          </p>
        </div>
      </div>

      {/* ── Fullscreen modal ─────────────────────────────────────── */}
      {fullscreen && activeCarousel && activeSlide && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button onClick={() => setFullscreen(false)} style={{ position: "absolute", top: 24, right: 24, background: "transparent", border: "none", color: "#444", cursor: "pointer", fontSize: 22 }}>✕</button>

          {/* Phone frame */}
          <div style={{ width: 320, background: "#111", borderRadius: 44, border: "8px solid #1a1a1a", overflow: "hidden", boxShadow: "0 0 80px rgba(0,0,0,0.9)" }}>
            {/* Status bar */}
            <div style={{ height: 40, background: "#111", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px" }}>
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 600, fontFamily: "sans-serif" }}>9:41</span>
              <div style={{ width: 100, height: 18, background: "#080808", borderRadius: 12 }} />
              <span style={{ fontSize: 9, color: "#fff", fontFamily: "sans-serif" }}>●●●</span>
            </div>
            {/* IG top bar */}
            <div style={{ height: 42, borderBottom: "0.5px solid #222", display: "flex", alignItems: "center", padding: "0 12px", gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, #f59e0b, #ec4899)", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 11, color: "#fff", fontWeight: 600, lineHeight: 1.2, fontFamily: "sans-serif" }}>novascaling</p>
                <p style={{ fontSize: 9, color: "#555", lineHeight: 1.2, fontFamily: "sans-serif" }}>Ver perfil</p>
              </div>
            </div>
            {/* Slide preview */}
            <div style={{ width: "100%", height: 376, overflow: "hidden" }}>
              <SlideRender slide={activeSlide} carousel={activeCarousel} scale={304 / 1080} />
            </div>
            {/* Actions */}
            <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 14 }}>
                {["♡", "✦", "▷"].map(i => <span key={i} style={{ fontSize: 18, color: "#fff" }}>{i}</span>)}
              </div>
              <span style={{ fontSize: 18, color: "#fff" }}>⊹</span>
            </div>
            {/* Dots nav */}
            <div style={{ display: "flex", justifyContent: "center", gap: 5, paddingBottom: 10 }}>
              {activeCarousel.slides.map((_, i) => (
                <button key={i} onClick={() => setSlideIdx(i)}
                  style={{ width: i === slideIdx ? 14 : 5, height: 5, borderRadius: 3, background: i === slideIdx ? "#22c55e" : "#333", border: "none", cursor: "pointer", padding: 0, transition: "all 0.2s" }} />
              ))}
            </div>
          </div>

          {/* Arrows */}
          <button onClick={() => setSlideIdx(i => Math.max(0, i - 1))} style={{ position: "absolute", left: "calc(50% - 200px)", background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: 28 }}>‹</button>
          <button onClick={() => setSlideIdx(i => Math.min((activeCarousel?.slides.length ?? 1) - 1, i + 1))} style={{ position: "absolute", right: "calc(50% - 200px)", background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: 28 }}>›</button>
        </div>
      )}
    </>
  )
}

export default function CarouselStudioPage() {
  return (
    <DashboardLayout>
      <CarouselStudioInner />
    </DashboardLayout>
  )
}
