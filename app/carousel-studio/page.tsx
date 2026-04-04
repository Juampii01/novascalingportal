"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { DashboardLayout, useActiveClient } from "@/components/dashboard-layout"
import { Maximize2, GripVertical, Download, ChevronDown, ChevronRight } from "lucide-react"

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type SlideTheme    = "dark" | "light" | "cream"
type FontPair      = "georgia" | "playfair" | "impact" | "inter" | "dm" | "bebas" | "mono"
type CarouselStatus = "draft" | "exported" | "published"
type CharPos       = "bottom-right" | "bottom-left" | "center"
type TextAlign     = "left" | "center"
type FontScale     = "large" | "medium" | "compact"
type BgStyle       = "solid" | "gradient-tb" | "gradient-br" | "grid" | "diagonal" | "noise"

interface Slide {
  id: string
  label: string
  title: string
  subtitle: string
  cta: string
  badge?: string
  stat?: string
  quoteStyle?: boolean
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
  bgColor: string
  bgGradientEnd: string
  bgStyle: BgStyle
  showCharacter: boolean
  characterPosition: CharPos
  showLogo: boolean
  logoText: string
  textAlign: TextAlign
  fontScale: FontScale
  showLabel: boolean
  showFooter: boolean
  accentLine: boolean
  accentLineBottom: boolean
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

const FONTS: Record<FontPair, { title: string; body: string; name: string }> = {
  georgia:  { title: "Georgia, serif",                      body: "Georgia, serif",            name: "Georgia"   },
  playfair: { title: "'Playfair Display', Georgia, serif",  body: "'Lora', Georgia, serif",    name: "Playfair"  },
  impact:   { title: "Impact, 'Arial Black', sans-serif",   body: "Arial, sans-serif",         name: "Impact"    },
  inter:    { title: "'Inter', sans-serif",                  body: "'Inter', sans-serif",       name: "Inter"     },
  dm:       { title: "'DM Serif Display', Georgia, serif",  body: "'DM Sans', sans-serif",     name: "DM Serif"  },
  bebas:    { title: "'Bebas Neue', Impact, sans-serif",     body: "'Inter', sans-serif",       name: "Bebas"     },
  mono:     { title: "'Space Mono', monospace",              body: "'Space Mono', monospace",   name: "Mono"      },
}

const BG_STYLES: { id: BgStyle; label: string; icon: string }[] = [
  { id: "solid",       label: "Sólido",    icon: "■" },
  { id: "gradient-tb", label: "Gradiente ↓", icon: "▼" },
  { id: "gradient-br", label: "Gradiente ↘", icon: "◢" },
  { id: "grid",        label: "Grilla",    icon: "⊞" },
  { id: "diagonal",    label: "Diagonal",  icon: "╱" },
  { id: "noise",       label: "Textura",   icon: "▒" },
]

const FONT_SIZES: Record<FontScale, { title: number; subtitle: number; label: number; cta: number }> = {
  large:   { title: 104, subtitle: 38, label: 26, cta: 24 },
  medium:  { title: 80,  subtitle: 32, label: 22, cta: 20 },
  compact: { title: 60,  subtitle: 28, label: 18, cta: 17 },
}

const ACCENT_PRESETS = ["#22c55e","#4ade80","#d4836b","#f97316","#3b82f6","#06b6d4","#f59e0b","#ec4899","#a855f7","#ffffff","#e2e8f0","#111111"]

const PALETTE_PRESETS: { name: string; bg: string; accent: string; gradEnd?: string }[] = [
  { name: "NOVA",      bg: "#080808", accent: "#22c55e" },
  { name: "Bosque",    bg: "#0a1a0d", accent: "#4ade80" },
  { name: "Salmon",    bg: "#1a0d0d", accent: "#d4836b" },
  { name: "Naranja",   bg: "#140800", accent: "#f97316" },
  { name: "Azul",      bg: "#0a0f1a", accent: "#3b82f6" },
  { name: "Cian",      bg: "#001414", accent: "#06b6d4" },
  { name: "Dorado",    bg: "#0d0a00", accent: "#f59e0b" },
  { name: "Rosa",      bg: "#1a0d14", accent: "#ec4899" },
  { name: "Violeta",   bg: "#0d0a1a", accent: "#a855f7" },
  { name: "Blanco",    bg: "#f5f5f0", accent: "#111111" },
  { name: "Crema",     bg: "#EAE6DD", accent: "#141310" },
  { name: "Gris",      bg: "#111111", accent: "#e2e8f0" },
]

const CTA_SUGG   = ["DESLIZÁ →", "SEGUÍ →", "GUARDÁ ESTO →", "COMENTÁ ABAJO →"]
const LABEL_SUGG = [
  "01 · HOOK", "02 · EL PROBLEMA", "03 · LA SOLUCIÓN", "04 · EL MÉTODO",
  "05 · RESULTADO", "06 · PRUEBA SOCIAL", "07 · CTA", "08 · BONUS",
]

function genId() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36) }

function emptySlide(i: number): Slide {
  return { id: genId(), label: LABEL_SUGG[i] ?? `${String(i + 1).padStart(2, "0")} · SLIDE`, title: "", subtitle: "", cta: "DESLIZÁ →" }
}

function makeCarousel(name: string, clientId?: string | null): Carousel {
  return {
    id: genId(), name: String(name ?? "").slice(0, 80),
    clientId: clientId ?? null, createdAt: new Date().toISOString(),
    status: "draft", theme: "dark", fontPair: "georgia", accentColor: "#22c55e",
    bgColor: "#080808", bgGradientEnd: "#111827", bgStyle: "solid",
    showCharacter: false, characterPosition: "bottom-right",
    showLogo: false, logoText: "NOVA",
    textAlign: "left", fontScale: "large", showLabel: true, showFooter: true,
    accentLine: false, accentLineBottom: false,
    slides: [0, 1, 2, 3, 4].map(emptySlide),
  }
}

function migrateCarousel(c: any): Carousel {
  return {
    textAlign: "left", fontScale: "large", showLabel: true, showFooter: true,
    accentLine: false, accentLineBottom: false,
    bgColor: c?.theme ? THEMES[c.theme as SlideTheme]?.bg ?? "#080808" : "#080808",
    bgGradientEnd: "#111827", bgStyle: "solid",
    showLogo: false, logoText: "NOVA",
    ...c,
    name: String(c?.name ?? "Sin nombre").slice(0, 80),
  }
}

const LS_KEY = "nova_carousels_v3"
const lsLoad = (): Carousel[] => {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null
    if (!raw) {
      // Migrate from v2
      const old = typeof window !== "undefined" ? localStorage.getItem("nova_carousels_v2") : null
      if (old) return JSON.parse(old).map(migrateCarousel)
      return []
    }
    return JSON.parse(raw).map(migrateCarousel)
  } catch { return [] }
}
const lsSave = (cs: Carousel[]) => { try { localStorage.setItem(LS_KEY, JSON.stringify(cs)) } catch {} }

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE RENDER
// ═══════════════════════════════════════════════════════════════════════════════

function getSlideBackground(carousel: Carousel): React.CSSProperties {
  const bg = carousel.bgColor ?? "#080808"
  const g  = carousel.bgGradientEnd ?? "#111827"
  switch (carousel.bgStyle ?? "solid") {
    case "gradient-tb": return { background: `linear-gradient(180deg, ${bg} 0%, ${g} 100%)` }
    case "gradient-br": return { background: `linear-gradient(135deg, ${bg} 0%, ${g} 100%)` }
    default:            return { background: bg }
  }
}

function SlideRender({ slide, carousel, scale = 1 }: { slide: Slide; carousel: Carousel; scale?: number }) {
  const t     = THEMES[carousel.theme ?? "dark"]
  const f     = FONTS[carousel.fontPair ?? "georgia"]
  const sz    = FONT_SIZES[carousel.fontScale ?? "large"]
  const lines = (slide.title || "").split("\n")
  const align = carousel.textAlign ?? "left"
  const bgStyle = carousel.bgStyle ?? "solid"
  const bgCSS = getSlideBackground(carousel)
  const fgText = t.text
  const fgSub  = t.sub
  const border = t.border

  // Pattern overlay element
  const patternOverlay = (() => {
    if (bgStyle === "grid") return (
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${fgText}08 1px, transparent 1px), linear-gradient(90deg, ${fgText}08 1px, transparent 1px)`, backgroundSize: "90px 90px", pointerEvents: "none" }} />
    )
    if (bgStyle === "diagonal") return (
      <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(45deg, ${fgText}06 0px, ${fgText}06 1px, transparent 1px, transparent 60px)`, pointerEvents: "none" }} />
    )
    if (bgStyle === "noise") return (
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`, backgroundSize: "256px 256px", pointerEvents: "none" }} />
    )
    return null
  })()

  return (
    <div style={{ width: 1080, height: 1350, transform: scale !== 1 ? `scale(${scale})` : undefined, transformOrigin: "top left", position: "relative", overflow: "hidden", flexShrink: 0, ...bgCSS }}>

      {patternOverlay}

      {/* Top accent line */}
      {carousel.accentLine && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: carousel.accentColor, zIndex: 2 }} />
      )}

      {/* Bottom accent line */}
      {carousel.accentLineBottom && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 5, background: carousel.accentColor, zIndex: 2 }} />
      )}

      {/* Label */}
      {(carousel.showLabel ?? true) && (
        <div style={{ position: "absolute", top: 72, left: align === "center" ? "50%" : 72, transform: align === "center" ? "translateX(-50%)" : undefined, fontSize: sz.label, fontFamily: f.body, letterSpacing: 6, color: fgSub, textTransform: "uppercase", whiteSpace: "nowrap", zIndex: 1 }}>
          {slide.label || "01 · SLIDE"}
        </div>
      )}

      {/* Logo */}
      {carousel.showLogo && (
        <div style={{ position: "absolute", top: 56, right: 72, border: `1px solid ${border}`, borderRadius: 6, padding: "7px 14px", fontSize: 20, color: fgSub, letterSpacing: 3, fontFamily: f.title, zIndex: 1 }}>
          {carousel.logoText || "LOGO"}
        </div>
      )}

      {/* Badge pill */}
      {slide.badge && (
        <div style={{ position: "absolute", top: carousel.showLabel ? 130 : 72, left: align === "center" ? "50%" : 72, transform: align === "center" ? "translateX(-50%)" : undefined, display: "inline-flex", alignItems: "center", gap: 10, background: `${carousel.accentColor}22`, border: `1px solid ${carousel.accentColor}55`, borderRadius: 999, padding: "10px 28px", zIndex: 1 }}>
          <span style={{ fontSize: 22, fontFamily: f.body, letterSpacing: 3, color: carousel.accentColor, textTransform: "uppercase" }}>{slide.badge}</span>
        </div>
      )}

      {/* Big stat / number */}
      {slide.stat && (
        <div style={{ position: "absolute", top: "50%", left: align === "center" ? "50%" : 72, transform: align === "center" ? "translate(-50%,-160%)" : "translateY(-160%)", fontSize: 260, fontFamily: f.title, fontWeight: 700, lineHeight: 1, color: carousel.accentColor, opacity: 0.12, userSelect: "none", pointerEvents: "none", whiteSpace: "nowrap", zIndex: 0 }}>
          {slide.stat}
        </div>
      )}
      {slide.stat && (
        <div style={{ position: "absolute", top: "18%", left: align === "center" ? "50%" : 72, transform: align === "center" ? "translateX(-50%)" : undefined, textAlign: align as any, zIndex: 1 }}>
          <div style={{ fontSize: 180, fontFamily: f.title, fontWeight: 700, lineHeight: 1, color: carousel.accentColor }}>{slide.stat}</div>
        </div>
      )}

      {/* Title + Subtitle block */}
      <div style={{ position: "absolute", left: align === "center" ? 64 : 72, right: align === "center" ? 64 : 72, top: slide.stat ? "46%" : "50%", transform: "translateY(-58%)", textAlign: align as any, zIndex: 1 }}>

        {/* Quote decoration */}
        {slide.quoteStyle && (
          <div style={{ fontSize: 200, fontFamily: "Georgia, serif", lineHeight: 0.6, marginBottom: 20, color: carousel.accentColor, opacity: 0.4, textAlign: align as any }}>&#8220;</div>
        )}

        <div style={{ fontSize: sz.title, fontFamily: f.title, fontWeight: carousel.fontPair === "inter" || carousel.fontPair === "mono" ? 800 : 700, lineHeight: 1.08, marginBottom: 44 }}>
          {lines.map((ln, i) => (
            <div key={i} style={{ color: i === lines.length - 1 ? carousel.accentColor : fgText }}>
              {ln || "\u00A0"}
            </div>
          ))}
        </div>

        {slide.subtitle && (
          slide.quoteStyle
            ? <div style={{ borderLeft: `4px solid ${carousel.accentColor}`, paddingLeft: 36, fontSize: sz.subtitle, fontFamily: f.body, fontWeight: 300, lineHeight: 1.65, color: fgSub, fontStyle: "italic" }}>{slide.subtitle}</div>
            : <div style={{ fontSize: sz.subtitle, fontFamily: f.body, fontWeight: 300, lineHeight: 1.65, color: fgSub }}>{slide.subtitle}</div>
        )}
      </div>

      {/* Character silhouette */}
      {carousel.showCharacter && (
        <div style={{
          position: "absolute", bottom: 0, zIndex: 0,
          ...(carousel.characterPosition === "bottom-right" ? { right: 0, borderTopLeftRadius: 999 }
            : carousel.characterPosition === "bottom-left" ? { left: 0, borderTopRightRadius: 999 }
            : { left: "50%", transform: "translateX(-50%)", borderRadius: "999px 999px 0 0" }),
          width: 380, height: 580, background: fgText, opacity: 0.08,
        }} />
      )}

      {/* Footer */}
      {(carousel.showFooter ?? true) && (
        <div style={{ position: "absolute", bottom: 72, left: 72, right: 72, textAlign: align as any, zIndex: 1 }}>
          <div style={{ height: 1, background: border, marginBottom: 32 }} />
          <div style={{ fontSize: sz.cta, fontFamily: f.body, letterSpacing: 8, color: fgSub, textTransform: "uppercase" }}>
            {slide.cta || "DESLIZÁ →"}
          </div>
        </div>
      )}
    </div>
  )
}

// Thumbnail
function Thumb({ slide, carousel, active, onClick }: { slide: Slide; carousel: Carousel; active?: boolean; onClick?: () => void }) {
  const W = 64, H = 80, scale = W / 1080
  return (
    <div onClick={onClick} style={{ width: W, height: H, overflow: "hidden", borderRadius: 5, cursor: "pointer", flexShrink: 0, border: `1.5px solid ${active ? "#22c55e" : "#1a1a1a"}`, transition: "border-color 0.15s", boxShadow: active ? "0 0 0 3px rgba(34,197,94,0.18)" : "none", background: "#000" }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", pointerEvents: "none", width: 1080, height: 1350 }}>
        <SlideRender slide={slide} carousel={carousel} />
      </div>
    </div>
  )
}

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
    <div ref={ref} style={{ width: "100%", height: scale * 1350, overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1350, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <SlideRender slide={slide} carousel={carousel} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACCORDION SECTION
// ═══════════════════════════════════════════════════════════════════════════════

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom: "0.5px solid #111" }}>
      <button onClick={() => setOpen(v => !v)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", background: "transparent", border: "none", cursor: "pointer" }}>
        <span style={{ fontSize: 8, fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", textTransform: "uppercase", color: "#555" }}>{title}</span>
        {open ? <ChevronDown size={10} color="#333" /> : <ChevronRight size={10} color="#333" />}
      </button>
      {open && <div style={{ padding: "0 20px 18px" }}>{children}</div>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOGGLE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function Toggle({ on, onChange, label, sub }: { on: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div>
        <p style={{ fontSize: 12, fontFamily: "sans-serif", fontWeight: 300, color: "#888", lineHeight: 1.3 }}>{label}</p>
        {sub && <p style={{ fontSize: 9, color: "#333", fontFamily: "sans-serif", marginTop: 2 }}>{sub}</p>}
      </div>
      <button onClick={() => onChange(!on)} style={{ width: 36, height: 20, borderRadius: 10, background: on ? "#22c55e" : "#1a1a1a", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
        <span style={{ position: "absolute", top: 3, left: on ? 18 : 3, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function CarouselStudioInner() {
  const clientId = useActiveClient()

  const [carousels, setCarousels]     = useState<Carousel[]>([])
  const [activeId, setActiveId]       = useState<string | null>(null)
  const [slideIdx, setSlideIdx]       = useState(0)
  const [aiOpen, setAiOpen]           = useState(false)
  const [aiForm, setAiForm]           = useState({ topic: "", slideCount: 10, tone: "educativo", cta: "comentá" })
  const [aiStatus, setAiStatus]       = useState<string | null>(null)
  const [fullscreen, setFullscreen]   = useState(false)
  const [newName, setNewName]         = useState("")
  const [showNew, setShowNew]         = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [dragIdx, setDragIdx]         = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [downloading, setDownloading]     = useState(false)
  const [downloadingZip, setDownloadingZip] = useState(false)
  const [editingName, setEditingName]     = useState<string | null>(null)
  const [confirmDlg, setConfirmDlg]       = useState<{ msg: string; onOk: () => void } | null>(null)
  const [selectedSlides, setSelectedSlides] = useState<Set<number>>(new Set())
  const hiddenRef  = useRef<HTMLDivElement>(null)
  const batchRefs  = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => { setCarousels(lsLoad()) }, [])
  useEffect(() => { setSelectedSlides(new Set()) }, [activeId])

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

  const uc = useCallback((patch: Partial<Carousel>) => {
    if (!activeCarousel) return
    updateCarousel({ ...activeCarousel, ...patch })
  }, [activeCarousel, updateCarousel])

  // ── Actions ──
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

  // Download PNG via html-to-image
  const downloadPNG = async () => {
    if (!hiddenRef.current || !activeSlide || !activeCarousel) return
    setDownloading(true)
    try {
      const { toPng } = await import("html-to-image")
      const dataUrl = await toPng(hiddenRef.current, { quality: 1, pixelRatio: 1, cacheBust: true })
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = `slide_${String(slideIdx + 1).padStart(2, "0")}_${activeCarousel.name.toLowerCase().replace(/\s+/g, "-")}.png`
      a.click()
    } catch (e) {
      console.error("PNG export error:", e)
    } finally {
      setDownloading(false)
    }
  }

  // Download ZIP of selected (or all) slides
  const downloadZIP = async () => {
    if (!activeCarousel) return
    setDownloadingZip(true)
    try {
      const [{ default: JSZip }, { toPng }] = await Promise.all([
        import("jszip") as any,
        import("html-to-image"),
      ])
      const zip = new JSZip()
      const allIdx = activeCarousel.slides.map((_, i) => i)
      const indices = selectedSlides.size > 0 ? [...selectedSlides].sort((a, b) => a - b) : allIdx
      for (const i of indices) {
        const el = batchRefs.current[i]
        if (!el) continue
        const dataUrl = await toPng(el, { quality: 1, pixelRatio: 1, cacheBust: true })
        const base64 = dataUrl.split(",")[1]
        zip.file(`slide_${String(i + 1).padStart(2, "0")}.png`, base64, { base64: true })
      }
      const blob = await zip.generateAsync({ type: "blob" })
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `${activeCarousel.name.toLowerCase().replace(/\s+/g, "-")}.zip`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) { console.error("ZIP error:", e) }
    finally { setDownloadingZip(false) }
  }

  // AI generate
  const generateAI = async (regenerateSlideIdx?: number) => {
    if (!aiForm.topic.trim()) return
    setAiStatus("Analizando tema...")
    const t1 = setTimeout(() => setAiStatus("Armando estructura..."), 900)
    const t2 = setTimeout(() => setAiStatus("Escribiendo slides..."), 2000)
    try {
      const res = await fetch("/api/carousel-generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiForm.topic, slideCount: regenerateSlideIdx !== undefined ? 1 : aiForm.slideCount, tone: aiForm.tone, cta: aiForm.cta }),
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
          updateCarousel({ ...activeCarousel, slides: withIds }); setSlideIdx(0)
        } else {
          const c = makeCarousel(aiForm.topic.slice(0, 60), clientId)
          c.slides = withIds
          save([...carousels, c]); setActiveId(c.id); setSlideIdx(0)
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

  // DnD
  const onDrop = (overIdx: number) => {
    if (dragIdx === null || !activeCarousel) return
    const slides = [...activeCarousel.slides]
    const [removed] = slides.splice(dragIdx, 1)
    slides.splice(overIdx, 0, removed)
    updateCarousel({ ...activeCarousel, slides })
    setSlideIdx(overIdx); setDragIdx(null); setDragOverIdx(null)
  }

  // ── Shared styles ──
  const card: React.CSSProperties = { background: "#0d0d0d", border: "0.5px solid #111", borderRadius: 10 }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lora:wght@300;400&family=Inter:wght@300;400;600;800&family=DM+Serif+Display&family=DM+Sans:wght@300;400&family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap');
        .cs-row:hover .cs-del { opacity:1!important; }
        .cs-hist-row:hover { background:rgba(255,255,255,0.012)!important; }
        .cs-pill { transition:all 0.15s; }
        .cs-pill:hover { opacity:0.8; }
        * { scrollbar-width:none; }
        ::-webkit-scrollbar { display:none; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 9, fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", textTransform: "uppercase", color: "#4ade80", marginBottom: 6 }}>Herramientas</p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 400, color: "#f5f5f5", letterSpacing: -0.5 }}>Carousel Studio</h1>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button className="cs-pill" onClick={() => setAiOpen(v => !v)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 8, border: `0.5px solid rgba(34,197,94,${aiOpen ? 0.5 : 0.25})`, background: aiOpen ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.05)", color: "#4ade80", fontSize: 11, fontFamily: "sans-serif", letterSpacing: 1.5, cursor: "pointer" }}>
            ✦ Generar con IA
          </button>
          <button className="cs-pill" onClick={() => setShowNew(v => !v)}
            style={{ padding: "9px 18px", borderRadius: 8, border: "0.5px solid #1a1a1a", background: showNew ? "#1a1a1a" : "transparent", color: "#f5f5f5", fontSize: 11, fontFamily: "sans-serif", letterSpacing: 1.5, cursor: "pointer" }}>
            + Nuevo
          </button>
        </div>
      </div>

      {/* ── New carousel ─────────────────────────────────────────── */}
      {showNew && (
        <div style={{ ...card, padding: "14px 18px", marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
          <input autoFocus placeholder="Nombre del carrusel..." value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") createCarousel(); if (e.key === "Escape") setShowNew(false) }}
            style={{ flex: 1, background: "transparent", border: "none", borderBottom: "0.5px solid #222", padding: "8px 0", color: "#f5f5f5", fontSize: 14, fontFamily: "sans-serif", outline: "none" }} />
          <button onClick={createCarousel} style={{ padding: "7px 16px", borderRadius: 6, background: "#22c55e", border: "none", color: "#000", fontSize: 11, fontWeight: 600, letterSpacing: 1, cursor: "pointer", fontFamily: "sans-serif" }}>Crear</button>
          <button onClick={() => setShowNew(false)} style={{ padding: "7px 12px", borderRadius: 6, background: "transparent", border: "0.5px solid #222", color: "#555", fontSize: 13, cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* ── AI Panel ─────────────────────────────────────────────── */}
      {aiOpen && (
        <div style={{ ...card, padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div>
              <p style={{ fontSize: 9, fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", textTransform: "uppercase", color: "#4ade80", marginBottom: 4 }}>✦ Generar con IA</p>
              <p style={{ fontSize: 11, fontFamily: "sans-serif", fontWeight: 300, color: "#444", lineHeight: 1.5 }}>Pegá ideas, notas, un guión, un texto, lo que tengas. La IA lo desarrolla en un carrusel completo.</p>
            </div>
            <button onClick={() => setAiOpen(false)} style={{ background: "transparent", border: "none", color: "#444", cursor: "pointer", fontSize: 16, flexShrink: 0, marginLeft: 24 }}>✕</button>
          </div>

          {/* Big textarea */}
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <textarea
              autoFocus
              placeholder={"Ejemplo:\n'Quiero hablar de por qué los coaches no cierran ventas. El problema es que hablan del precio antes de mostrar el valor. Primero tenés que hacer sentir el dolor, después mostrar la transformación, y recién ahí mencionar el precio. También quiero meter objeciones comunes...'\n\nO simplemente: Cómo dejar de competir por precio y cerrar clientes que te valoran."}
              value={aiForm.topic}
              onChange={e => setAiForm(f => ({ ...f, topic: e.target.value }))}
              rows={6}
              style={{ width: "100%", background: "#080808", border: "0.5px solid #1a1a1a", borderRadius: 8, padding: "14px 16px", color: "#f5f5f5", fontSize: 13, fontFamily: "sans-serif", fontWeight: 300, outline: "none", resize: "vertical", lineHeight: 1.7, boxSizing: "border-box", minHeight: 120 }}
            />
            <p style={{ fontSize: 9, color: "#333", fontFamily: "sans-serif", marginTop: 6, letterSpacing: 0.5 }}>{aiForm.topic.length} caracteres · cuanto más detalle, mejor resultado</p>
          </div>

          {/* Controls row */}
          <div style={{ display: "grid", gridTemplateColumns: "100px 160px 140px", gap: 12, alignItems: "end", marginBottom: 18 }}>
            {[
              { key: "slideCount", label: "Cantidad de slides", opts: [[6,"6"],[7,"7"],[8,"8"],[9,"9"],[10,"10"],[11,"11"],[12,"12"]] },
              { key: "tone", label: "Estilo de voz", opts: [["educativo","Educativo / Mentor"],["provocador","Provocador / Directo"],["testimonial","Testimonial / Resultados"],["tutorial","Tutorial / Paso a paso"],["libre","Libre / Del contenido"]] },
              { key: "cta", label: "CTA final", opts: [["comentá","Comentá"],["guardá","Guardá"],["seguime","Seguime"],["dm","Mandame un DM"]] },
            ].map(({ key, label, opts }) => (
              <div key={key}>
                <p style={{ fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: "#444", fontFamily: "sans-serif", marginBottom: 7 }}>{label}</p>
                <select value={(aiForm as any)[key]} onChange={e => setAiForm(f => ({ ...f, [key]: key === "slideCount" ? Number(e.target.value) : e.target.value }))}
                  style={{ width: "100%", background: "#111", border: "0.5px solid #222", borderRadius: 6, padding: "9px 10px", color: "#f5f5f5", fontSize: 11, cursor: "pointer", outline: "none" }}>
                  {opts.map(([v, l]) => <option key={String(v)} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button onClick={() => generateAI()} disabled={!aiForm.topic.trim() || !!aiStatus}
              style={{ padding: "10px 28px", borderRadius: 8, background: "#22c55e", border: "none", color: "#000", fontSize: 11, fontFamily: "sans-serif", fontWeight: 700, letterSpacing: 2, cursor: "pointer", opacity: (!aiForm.topic.trim() || !!aiStatus) ? 0.4 : 1 }}>
              Generar {aiForm.slideCount} slides
            </button>
            {activeCarousel && (
              <button onClick={() => generateAI()} disabled={!aiForm.topic.trim() || !!aiStatus}
                style={{ padding: "10px 20px", borderRadius: 8, background: "transparent", border: "0.5px solid #222", color: "#555", fontSize: 11, fontFamily: "sans-serif", letterSpacing: 1.5, cursor: "pointer", opacity: !!aiStatus ? 0.4 : 1 }}>
                Regenerar todo
              </button>
            )}
            {aiStatus && <p style={{ fontSize: 12, fontFamily: "sans-serif", color: aiStatus.startsWith("✓") ? "#22c55e" : "#555", letterSpacing: 0.5 }}>{aiStatus}</p>}
          </div>
        </div>
      )}

      {/* ── EDITOR ───────────────────────────────────────────────── */}
      {activeCarousel && activeSlide ? (
        <>
        {/* Editor header bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "10px 16px", background: "#0d0d0d", border: "0.5px solid #111", borderRadius: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", flexShrink: 0 }} />
            <p style={{ fontSize: 13, fontFamily: "sans-serif", fontWeight: 300, color: "#f5f5f5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>{activeCarousel.name}</p>
            <span style={{ fontSize: 9, fontFamily: "monospace", color: "#333", letterSpacing: 2 }}>{activeCarousel.slides.length} SLIDES</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={downloadZIP} disabled={downloadingZip}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6, background: "rgba(34,197,94,0.08)", border: "0.5px solid rgba(34,197,94,0.25)", color: downloadingZip ? "#4ade80" : "#22c55e", fontSize: 10, fontFamily: "sans-serif", letterSpacing: 1, cursor: "pointer", opacity: downloadingZip ? 0.6 : 1 }}>
              <Download size={10} />
              {downloadingZip
                ? "Generando…"
                : selectedSlides.size > 0
                  ? `ZIP (${selectedSlides.size} seleccionados)`
                  : `ZIP (${activeCarousel.slides.length} slides)`}
            </button>
            <button onClick={() => { setActiveId(null); setSlideIdx(0) }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, background: "transparent", border: "0.5px solid #1a1a1a", color: "#555", fontSize: 11, fontFamily: "sans-serif", cursor: "pointer" }}>
              ✕ Cerrar
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "210px 1fr 290px", gap: 16, marginBottom: 32, alignItems: "start" }}>

          {/* LEFT — Slide list */}
          <div style={{ ...card }}>
            <div style={{ padding: "10px 14px", borderBottom: "0.5px solid #111", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} title="Seleccionar todos">
                <input type="checkbox"
                  checked={selectedSlides.size === activeCarousel.slides.length}
                  ref={el => { if (el) el.indeterminate = selectedSlides.size > 0 && selectedSlides.size < activeCarousel.slides.length }}
                  onChange={e => setSelectedSlides(e.target.checked ? new Set(activeCarousel.slides.map((_,i) => i)) : new Set())}
                  style={{ accentColor: "#22c55e", width: 11, height: 11, cursor: "pointer" }} />
                <p style={{ fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: selectedSlides.size > 0 ? "#4ade80" : "#444", fontFamily: "sans-serif" }}>
                  {selectedSlides.size > 0 ? `${selectedSlides.size}/${activeCarousel.slides.length}` : `${activeCarousel.slides.length} slides`}
                </p>
              </label>
              <button onClick={addSlide} style={{ width: 22, height: 22, borderRadius: 4, background: "rgba(34,197,94,0.1)", border: "0.5px solid rgba(34,197,94,0.2)", color: "#22c55e", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
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
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 10px 8px 6px", cursor: "pointer",
                    borderLeft: `2px solid ${i === slideIdx ? "#22c55e" : "transparent"}`,
                    background: i === slideIdx ? "rgba(34,197,94,0.04)" : dragOverIdx === i ? "rgba(34,197,94,0.06)" : "transparent",
                    transition: "all 0.1s",
                    borderTop: dragOverIdx === i && dragIdx !== null && dragIdx !== i ? "1.5px solid rgba(34,197,94,0.5)" : "1.5px solid transparent",
                  }}
                >
                  <GripVertical size={10} color="#222" style={{ flexShrink: 0, cursor: "grab" }} />
                  <input type="checkbox"
                    checked={selectedSlides.has(i)}
                    onClick={e => e.stopPropagation()}
                    onChange={e => {
                      e.stopPropagation()
                      setSelectedSlides(prev => {
                        const next = new Set(prev)
                        e.target.checked ? next.add(i) : next.delete(i)
                        return next
                      })
                    }}
                    style={{ accentColor: "#22c55e", width: 11, height: 11, cursor: "pointer", flexShrink: 0 }} />
                  <Thumb slide={slide} carousel={activeCarousel} active={i === slideIdx} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 7, color: i === slideIdx ? "#4ade80" : "#444", fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>
                      {slide.label}
                    </p>
                    <p style={{ fontSize: 10, color: i === slideIdx ? "#f5f5f5" : "#666", fontFamily: "sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {slide.title.replace("\n", " ") || "Sin título"}
                    </p>
                  </div>
                  <button className="cs-del" onClick={e => { e.stopPropagation(); setConfirmDlg({ msg: "¿Eliminar este slide?", onOk: () => deleteSlide(i) }) }}
                    style={{ opacity: 0, background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11, transition: "opacity 0.15s", flexShrink: 0 }}>✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER — Preview */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
            {/* Font selector */}
            <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
              {(Object.keys(FONTS) as FontPair[]).map(fp => (
                <button key={fp} onClick={() => uc({ fontPair: fp })}
                  style={{ padding: "5px 11px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: FONTS[fp].title, background: activeCarousel.fontPair === fp ? "rgba(34,197,94,0.1)" : "transparent", border: `0.5px solid ${activeCarousel.fontPair === fp ? "rgba(34,197,94,0.3)" : "#1a1a1a"}`, color: activeCarousel.fontPair === fp ? "#4ade80" : "#555", whiteSpace: "nowrap" }}>
                  {FONTS[fp].name}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              {/* Download PNG */}
              <button onClick={downloadPNG} disabled={downloading}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, background: "rgba(34,197,94,0.07)", border: "0.5px solid rgba(34,197,94,0.2)", color: downloading ? "#4ade80" : "#22c55e", fontSize: 10, fontFamily: "sans-serif", letterSpacing: 1, cursor: "pointer", opacity: downloading ? 0.6 : 1 }}>
                <Download size={11} /> {downloading ? "Generando…" : "PNG"}
              </button>
              <button onClick={() => setFullscreen(true)}
                style={{ padding: "6px 10px", borderRadius: 6, background: "transparent", border: "0.5px solid #1a1a1a", color: "#555", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <Maximize2 size={11} />
              </button>
            </div>

            {/* Preview card with shadow */}
            <div style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 0 0.5px #111" }}>
              <ScaledPreview slide={activeSlide} carousel={activeCarousel} />
            </div>

            {/* Navigation dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
              {activeCarousel.slides.map((_, i) => (
                <button key={i} onClick={() => setSlideIdx(i)}
                  style={{ width: i === slideIdx ? 22 : 6, height: 6, borderRadius: 3, background: i === slideIdx ? "#22c55e" : "#1a1a1a", border: "none", cursor: "pointer", transition: "all 0.2s", padding: 0 }} />
              ))}
            </div>

            {/* Thumbnail strip */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "2px 0", justifyContent: "center" }}>
              {activeCarousel.slides.map((s, i) => (
                <Thumb key={s.id} slide={s} carousel={activeCarousel} active={i === slideIdx} onClick={() => setSlideIdx(i)} />
              ))}
            </div>

            {/* Slide counter */}
            <p style={{ textAlign: "center", fontSize: 10, color: "#333", fontFamily: "monospace", letterSpacing: 2 }}>
              {slideIdx + 1} / {activeCarousel.slides.length}
            </p>
          </div>

          {/* RIGHT — Edit panel */}
          <div style={{ ...card, overflow: "hidden" }}>

            {/* ─ COLORES ─ */}
            <Section title="Colores" defaultOpen>
              {/* Paletas */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 8, letterSpacing: "2px", color: "#444", fontFamily: "sans-serif", textTransform: "uppercase", marginBottom: 8 }}>Paletas</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {PALETTE_PRESETS.map(p => (
                    <button key={p.name} onClick={() => uc({ bgColor: p.bg, accentColor: p.accent })}
                      title={p.name}
                      style={{ width: 30, height: 30, borderRadius: 6, background: p.bg, border: `2px solid ${activeCarousel.accentColor === p.accent && activeCarousel.bgColor === p.bg ? "#22c55e" : p.accent}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.accent, display: "block" }} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color fondo */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 8, letterSpacing: "2px", color: "#444", fontFamily: "sans-serif", textTransform: "uppercase", marginBottom: 8 }}>Color de fondo</p>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="color" value={activeCarousel.bgColor ?? "#080808"} onChange={e => uc({ bgColor: e.target.value })}
                    style={{ width: 36, height: 36, borderRadius: 8, border: "0.5px solid #222", cursor: "pointer", padding: 2, background: "transparent" }} />
                  <span style={{ fontSize: 11, fontFamily: "monospace", color: "#444" }}>{(activeCarousel.bgColor ?? "#080808").toUpperCase()}</span>
                  <input type="color" value={activeCarousel.bgGradientEnd ?? "#111827"} onChange={e => uc({ bgGradientEnd: e.target.value })}
                    style={{ width: 36, height: 36, borderRadius: 8, border: "0.5px solid #222", cursor: "pointer", padding: 2, background: "transparent" }} title="Color 2 (gradiente)" />
                  <span style={{ fontSize: 9, color: "#333", fontFamily: "sans-serif" }}>→ 2</span>
                </div>
              </div>

              {/* Color acento */}
              <div style={{ marginBottom: 0 }}>
                <p style={{ fontSize: 8, letterSpacing: "2px", color: "#444", fontFamily: "sans-serif", textTransform: "uppercase", marginBottom: 8 }}>Color acento</p>
                <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
                  {ACCENT_PRESETS.map(c => (
                    <button key={c} onClick={() => uc({ accentColor: c })}
                      style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: `2px solid ${activeCarousel.accentColor === c ? "#f5f5f5" : "transparent"}`, cursor: "pointer", transition: "transform 0.1s", transform: activeCarousel.accentColor === c ? "scale(1.25)" : "scale(1)", flexShrink: 0 }} />
                  ))}
                  <input type="color" value={activeCarousel.accentColor} onChange={e => uc({ accentColor: e.target.value })}
                    style={{ width: 20, height: 20, borderRadius: "50%", border: "2px dashed #333", cursor: "pointer", padding: 0, background: "transparent" }} title="Color libre" />
                </div>
              </div>
            </Section>

            {/* ─ FONDO ─ */}
            <Section title="Fondo" defaultOpen={false}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5 }}>
                {BG_STYLES.map(s => (
                  <button key={s.id} onClick={() => uc({ bgStyle: s.id })}
                    style={{ padding: "8px 4px", borderRadius: 6, cursor: "pointer", border: `0.5px solid ${(activeCarousel.bgStyle ?? "solid") === s.id ? "rgba(34,197,94,0.4)" : "#1a1a1a"}`, background: (activeCarousel.bgStyle ?? "solid") === s.id ? "rgba(34,197,94,0.08)" : "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 14, color: (activeCarousel.bgStyle ?? "solid") === s.id ? "#4ade80" : "#555" }}>{s.icon}</span>
                    <span style={{ fontSize: 8, fontFamily: "sans-serif", letterSpacing: 1, color: (activeCarousel.bgStyle ?? "solid") === s.id ? "#4ade80" : "#444", textTransform: "uppercase" }}>{s.label}</span>
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                <Toggle label="Línea acento arriba" on={activeCarousel.accentLine} onChange={v => uc({ accentLine: v })} />
                <Toggle label="Línea acento abajo"  on={activeCarousel.accentLineBottom ?? false} onChange={v => uc({ accentLineBottom: v })} />
              </div>
            </Section>

            {/* ─ DISEÑO ─ */}
            <Section title="Diseño" defaultOpen>
              {/* Text align */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 8, letterSpacing: "2px", color: "#444", fontFamily: "sans-serif", textTransform: "uppercase", marginBottom: 8 }}>Alineación</p>
                <div style={{ display: "flex", gap: 6 }}>
                  {([["left","← Izquierda"],["center","Centrado"]] as [TextAlign, string][]).map(([v, l]) => (
                    <button key={v} onClick={() => uc({ textAlign: v })}
                      style={{ flex: 1, padding: "7px 0", borderRadius: 6, fontSize: 10, cursor: "pointer", background: activeCarousel.textAlign === v ? "rgba(34,197,94,0.1)" : "transparent", border: `0.5px solid ${activeCarousel.textAlign === v ? "rgba(34,197,94,0.3)" : "#1a1a1a"}`, color: activeCarousel.textAlign === v ? "#4ade80" : "#555", fontFamily: "sans-serif", letterSpacing: 0.5 }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font scale */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 8, letterSpacing: "2px", color: "#444", fontFamily: "sans-serif", textTransform: "uppercase", marginBottom: 8 }}>Tamaño de texto</p>
                <div style={{ display: "flex", gap: 6 }}>
                  {([["large","Grande"],["medium","Medio"],["compact","Compacto"]] as [FontScale, string][]).map(([v, l]) => (
                    <button key={v} onClick={() => uc({ fontScale: v })}
                      style={{ flex: 1, padding: "7px 0", borderRadius: 6, fontSize: 9, cursor: "pointer", background: (activeCarousel.fontScale ?? "large") === v ? "rgba(34,197,94,0.1)" : "transparent", border: `0.5px solid ${(activeCarousel.fontScale ?? "large") === v ? "rgba(34,197,94,0.3)" : "#1a1a1a"}`, color: (activeCarousel.fontScale ?? "large") === v ? "#4ade80" : "#555", fontFamily: "sans-serif" }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Toggle label="Label" sub="Indicador superior" on={activeCarousel.showLabel ?? true} onChange={v => uc({ showLabel: v })} />
                <Toggle label="Footer CTA" sub="Separador + texto abajo" on={activeCarousel.showFooter ?? true} onChange={v => uc({ showFooter: v })} />
              </div>
            </Section>

            {/* ─ CONTENIDO ─ */}
            <Section title="Contenido" defaultOpen>
              {/* Label */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 8, letterSpacing: "2px", color: "#444", fontFamily: "sans-serif", textTransform: "uppercase", marginBottom: 6 }}>Label del slide</p>
                <input value={activeSlide.label} onChange={e => updateSlide({ ...activeSlide, label: e.target.value })} placeholder="01 · HOOK"
                  style={{ width: "100%", background: "transparent", border: "none", borderBottom: "0.5px solid #1a1a1a", padding: "7px 0", color: "#f5f5f5", fontSize: 11, fontFamily: "monospace", letterSpacing: 2, outline: "none", boxSizing: "border-box", marginBottom: 6 }} />
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {LABEL_SUGG.slice(0, 5).map(l => (
                    <button key={l} onClick={() => updateSlide({ ...activeSlide, label: l })}
                      style={{ fontSize: 7, padding: "3px 6px", borderRadius: 4, background: "transparent", border: "0.5px solid #1a1a1a", color: "#444", cursor: "pointer", letterSpacing: 1, fontFamily: "monospace" }}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Título */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <p style={{ fontSize: 8, letterSpacing: "2px", color: "#444", fontFamily: "sans-serif", textTransform: "uppercase" }}>Título</p>
                  <span style={{ fontSize: 9, color: "#333", fontFamily: "sans-serif" }}>{activeSlide.title.length} car</span>
                </div>
                <textarea value={activeSlide.title} onChange={e => updateSlide({ ...activeSlide, title: e.target.value })}
                  placeholder={"Primera línea\nSegunda línea\nÚltima en color acento"} rows={3}
                  style={{ width: "100%", background: "transparent", border: "0.5px solid #1a1a1a", borderRadius: 6, padding: 10, color: "#f5f5f5", fontSize: 12, fontFamily: "Georgia, serif", outline: "none", resize: "none", lineHeight: 1.6, boxSizing: "border-box" }} />
              </div>

              {/* Subtítulo */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <p style={{ fontSize: 8, letterSpacing: "2px", color: "#444", fontFamily: "sans-serif", textTransform: "uppercase" }}>Subtítulo</p>
                  <span style={{ fontSize: 9, color: activeSlide.subtitle.length > 100 ? "#f59e0b" : "#333", fontFamily: "sans-serif" }}>{activeSlide.subtitle.length}/120</span>
                </div>
                <textarea value={activeSlide.subtitle} onChange={e => updateSlide({ ...activeSlide, subtitle: e.target.value.slice(0, 120) })}
                  placeholder="Complemento breve, 1-2 líneas." rows={2}
                  style={{ width: "100%", background: "transparent", border: "0.5px solid #1a1a1a", borderRadius: 6, padding: 10, color: "#f5f5f5", fontSize: 12, fontFamily: "sans-serif", fontWeight: 300, outline: "none", resize: "none", lineHeight: 1.6, boxSizing: "border-box" }} />
              </div>

              {/* CTA */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 8, letterSpacing: "2px", color: "#444", fontFamily: "sans-serif", textTransform: "uppercase", marginBottom: 6 }}>Footer CTA</p>
                <input value={activeSlide.cta} onChange={e => updateSlide({ ...activeSlide, cta: e.target.value })}
                  style={{ width: "100%", background: "transparent", border: "none", borderBottom: "0.5px solid #1a1a1a", padding: "7px 0", color: "#f5f5f5", fontSize: 11, fontFamily: "monospace", letterSpacing: 2, outline: "none", boxSizing: "border-box", marginBottom: 6 }} />
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {CTA_SUGG.map(s => (
                    <button key={s} onClick={() => updateSlide({ ...activeSlide, cta: s })}
                      style={{ fontSize: 7, padding: "3px 7px", borderRadius: 4, background: "transparent", border: "0.5px solid #1a1a1a", color: "#444", cursor: "pointer", letterSpacing: 1, fontFamily: "monospace" }}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Elementos del slide */}
              <div style={{ borderTop: "0.5px solid #111", paddingTop: 14 }}>
                <p style={{ fontSize: 8, letterSpacing: "2px", color: "#444", fontFamily: "sans-serif", textTransform: "uppercase", marginBottom: 12 }}>Elementos extra</p>

                {/* Badge */}
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 9, color: "#333", fontFamily: "sans-serif", marginBottom: 5 }}>Badge / chip</p>
                  <input value={activeSlide.badge ?? ""} onChange={e => updateSlide({ ...activeSlide, badge: e.target.value })}
                    placeholder="🔥 DATO CLAVE  ·  NUEVO  ·  CASO REAL"
                    style={{ width: "100%", background: "transparent", border: "none", borderBottom: "0.5px solid #1a1a1a", padding: "6px 0", color: "#f5f5f5", fontSize: 11, fontFamily: "sans-serif", outline: "none", boxSizing: "border-box" }} />
                </div>

                {/* Stat */}
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 9, color: "#333", fontFamily: "sans-serif", marginBottom: 5 }}>Número / stat grande</p>
                  <input value={activeSlide.stat ?? ""} onChange={e => updateSlide({ ...activeSlide, stat: e.target.value })}
                    placeholder="73%  ·  x3  ·  #1  ·  30 días"
                    style={{ width: "100%", background: "transparent", border: "none", borderBottom: "0.5px solid #1a1a1a", padding: "6px 0", color: "#f5f5f5", fontSize: 11, fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
                </div>

                {/* Quote style */}
                <Toggle label="Estilo cita" sub="Comillas + barra lateral en subtítulo" on={activeSlide.quoteStyle ?? false} onChange={v => updateSlide({ ...activeSlide, quoteStyle: v })} />
              </div>
            </Section>

            {/* ─ EXTRAS ─ */}
            <Section title="Extras" defaultOpen={false}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Toggle label="Personaje" sub="Silueta decorativa" on={activeCarousel.showCharacter} onChange={v => uc({ showCharacter: v })} />
                {activeCarousel.showCharacter && (
                  <div style={{ display: "flex", gap: 5 }}>
                    {([["bottom-right","↘ Der"],["bottom-left","↙ Izq"],["center","Centro"]] as [CharPos,string][]).map(([p,l]) => (
                      <button key={p} onClick={() => uc({ characterPosition: p })}
                        style={{ flex: 1, padding: "5px 2px", borderRadius: 5, fontSize: 9, background: activeCarousel.characterPosition === p ? "rgba(34,197,94,0.1)" : "transparent", border: `0.5px solid ${activeCarousel.characterPosition === p ? "rgba(34,197,94,0.3)" : "#1a1a1a"}`, color: activeCarousel.characterPosition === p ? "#4ade80" : "#555", cursor: "pointer" }}>
                        {l}
                      </button>
                    ))}
                  </div>
                )}
                <Toggle label="Logo de marca" sub="Esquina superior derecha" on={activeCarousel.showLogo} onChange={v => uc({ showLogo: v })} />
                {activeCarousel.showLogo && (
                  <input value={activeCarousel.logoText ?? "NOVA"} onChange={e => uc({ logoText: e.target.value })}
                    placeholder="NOVA"
                    style={{ width: "100%", background: "transparent", border: "none", borderBottom: "0.5px solid #1a1a1a", padding: "6px 0", color: "#f5f5f5", fontSize: 12, fontFamily: "sans-serif", outline: "none", boxSizing: "border-box" }} />
                )}
              </div>
            </Section>

            {/* ─ IA ─ */}
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {aiForm.topic.trim() && (
                <button onClick={() => generateAI(slideIdx)} disabled={!!aiStatus}
                  style={{ width: "100%", padding: 9, borderRadius: 7, background: "transparent", border: "0.5px solid rgba(34,197,94,0.2)", color: "#4ade80", fontSize: 10, fontFamily: "sans-serif", letterSpacing: 1.5, cursor: "pointer", opacity: aiStatus ? 0.4 : 1 }}>
                  ✦ Regenerar este slide
                </button>
              )}
              <button onClick={() => exportJSON(activeCarousel)}
                style={{ width: "100%", padding: 9, borderRadius: 7, background: "rgba(34,197,94,0.06)", border: "0.5px solid rgba(34,197,94,0.15)", color: "#22c55e", fontSize: 10, fontFamily: "sans-serif", letterSpacing: 1.5, cursor: "pointer" }}>
                ↓ Exportar JSON
              </button>
              <button onClick={downloadPNG} disabled={downloading}
                style={{ width: "100%", padding: 9, borderRadius: 7, background: "transparent", border: "0.5px solid #1a1a1a", color: "#888", fontSize: 10, fontFamily: "sans-serif", letterSpacing: 1.5, cursor: "pointer", opacity: downloading ? 0.5 : 1 }}>
                {downloading ? "Generando PNG…" : "↓ Descargar slide (PNG)"}
              </button>
            </div>
          </div>
        </div>
        </>
      ) : (
        <div style={{ ...card, padding: "56px 32px", textAlign: "center", marginBottom: 32 }}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>🎠</p>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 20, color: "#f5f5f5", marginBottom: 10 }}>Ningún carrusel activo</p>
          <p style={{ fontSize: 12, fontFamily: "sans-serif", fontWeight: 300, color: "#444", marginBottom: 24, lineHeight: 1.7 }}>Creá uno nuevo o generá uno con IA en segundos.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => setShowNew(true)} style={{ padding: "10px 24px", borderRadius: 8, background: "#22c55e", border: "none", color: "#000", fontSize: 11, fontFamily: "sans-serif", fontWeight: 600, letterSpacing: 2, cursor: "pointer" }}>+ Nuevo</button>
            <button onClick={() => setAiOpen(true)} style={{ padding: "10px 24px", borderRadius: 8, border: "0.5px solid rgba(34,197,94,0.3)", background: "transparent", color: "#4ade80", fontSize: 11, fontFamily: "sans-serif", letterSpacing: 1.5, cursor: "pointer" }}>✦ Generar con IA</button>
          </div>
        </div>
      )}

      {/* ── HISTORIAL ────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ padding: "14px 20px", borderBottom: "0.5px solid #111", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 8, letterSpacing: "2.5px", textTransform: "uppercase", color: "#444", fontFamily: "sans-serif" }}>Historial · {carousels.length} carruseles</p>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ background: "#111", border: "0.5px solid #222", borderRadius: 6, padding: "5px 10px", color: "#666", fontSize: 11, cursor: "pointer", outline: "none" }}>
            {[["all","Todos"],["draft","Borrador"],["exported","Exportado"],["published","Publicado"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {carousels.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <p style={{ fontSize: 12, fontFamily: "sans-serif", fontWeight: 300, color: "#333" }}>No hay carruseles todavía.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid #111" }}>
                  {[["Nombre","auto"],["Fecha","110px"],["Slides","70px"],["Estado","130px"],["Acciones","260px"]].map(([h, w]) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 8, fontFamily: "sans-serif", fontWeight: 500, letterSpacing: 2.5, color: "#444", textTransform: "uppercase", width: w === "auto" ? undefined : w, whiteSpace: "nowrap" }}>{h}</th>
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
                        <td style={{ padding: "12px 16px", maxWidth: 200 }}>
                          {editingName === c.id ? (
                            <input autoFocus defaultValue={c.name}
                              onBlur={e => { save(carousels.map(x => x.id === c.id ? { ...x, name: e.target.value.slice(0, 80) || c.name } : x)); setEditingName(null) }}
                              onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") (e.target as HTMLInputElement).blur() }}
                              style={{ background: "transparent", border: "none", borderBottom: "0.5px solid #22c55e", color: "#f5f5f5", fontSize: 12, fontFamily: "sans-serif", outline: "none", width: "100%" }} />
                          ) : (
                            <p onClick={() => setEditingName(c.id)} title={c.name}
                              style={{ fontSize: 13, fontFamily: "sans-serif", fontWeight: 300, color: "#f5f5f5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "text", maxWidth: 180 }}>
                              {c.name}
                            </p>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                          <p style={{ fontSize: 11, fontFamily: "sans-serif", fontWeight: 300, color: "#444" }}>
                            {new Date(c.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <p style={{ fontSize: 13, fontFamily: "Georgia, serif", color: "#666" }}>{c.slides.length}</p>
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
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => { setActiveId(c.id); setSlideIdx(0); window.scrollTo({ top: 0, behavior: "smooth" }) }}
                              style={{ padding: "4px 11px", borderRadius: 5, background: "transparent", border: "0.5px solid #1a1a1a", color: "#888", fontSize: 10, cursor: "pointer", fontFamily: "sans-serif", whiteSpace: "nowrap" }}>
                              Editar
                            </button>
                            <button onClick={() => duplicateCarousel(c)}
                              style={{ padding: "4px 11px", borderRadius: 5, background: "transparent", border: "0.5px solid #1a1a1a", color: "#888", fontSize: 10, cursor: "pointer", fontFamily: "sans-serif", whiteSpace: "nowrap" }}>
                              Duplicar
                            </button>
                            <button onClick={() => exportJSON(c)}
                              style={{ padding: "4px 11px", borderRadius: 5, background: "rgba(34,197,94,0.06)", border: "0.5px solid rgba(34,197,94,0.15)", color: "#22c55e", fontSize: 10, cursor: "pointer", fontFamily: "sans-serif" }}>
                              JSON
                            </button>
                            <button onClick={() => setConfirmDlg({ msg: `¿Eliminar "${c.name}"?`, onOk: () => deleteCarousel(c.id) })}
                              style={{ padding: "4px 10px", borderRadius: 5, background: "transparent", border: "0.5px solid rgba(239,68,68,0.15)", color: "#ef4444", fontSize: 10, cursor: "pointer" }}>
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

        <div style={{ padding: "12px 20px", borderTop: "0.5px solid #0d0d0d" }}>
          <p style={{ fontSize: 9, fontFamily: "sans-serif", color: "#2a2a2a", letterSpacing: 0.5 }}>Los PNG se exportan a 1080×1350px · Seleccioná slides individuales para ZIP parcial</p>
        </div>
      </div>

      {/* ── Hidden full-size for single PNG export ───────────────── */}
      <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none", zIndex: -1 }}>
        <div ref={hiddenRef} style={{ width: 1080, height: 1350 }}>
          {activeCarousel && activeSlide && (
            <SlideRender slide={activeSlide} carousel={activeCarousel} scale={1} />
          )}
        </div>
      </div>

      {/* ── Hidden batch render for ZIP export ───────────────────── */}
      <div style={{ position: "fixed", left: -199999, top: 0, pointerEvents: "none", zIndex: -1 }}>
        {activeCarousel?.slides.map((slide, i) => (
          <div key={slide.id} ref={el => { batchRefs.current[i] = el }} style={{ width: 1080, height: 1350 }}>
            <SlideRender slide={slide} carousel={activeCarousel} scale={1} />
          </div>
        ))}
      </div>

      {/* ── Confirm Dialog ──────────────────────────────────────── */}
      {confirmDlg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setConfirmDlg(null)}>
          <div style={{ background: "#0d0d0d", border: "0.5px solid #1a1a1a", borderRadius: 12, padding: "32px 32px 24px", maxWidth: 360, width: "90%", boxShadow: "0 16px 64px rgba(0,0,0,0.8)" }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 8, fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3px", textTransform: "uppercase", color: "#ef4444", marginBottom: 16 }}>Confirmar</p>
            <p style={{ fontSize: 14, fontFamily: "sans-serif", fontWeight: 300, color: "#f5f5f5", lineHeight: 1.6, marginBottom: 28 }}>{confirmDlg.msg}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDlg(null)}
                style={{ padding: "8px 20px", borderRadius: 7, background: "transparent", border: "0.5px solid #222", color: "#666", fontSize: 12, fontFamily: "sans-serif", cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={() => { confirmDlg.onOk(); setConfirmDlg(null) }}
                style={{ padding: "8px 20px", borderRadius: 7, background: "rgba(239,68,68,0.15)", border: "0.5px solid rgba(239,68,68,0.4)", color: "#ef4444", fontSize: 12, fontFamily: "sans-serif", fontWeight: 600, cursor: "pointer" }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Fullscreen ───────────────────────────────────────────── */}
      {fullscreen && activeCarousel && activeSlide && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button onClick={() => setFullscreen(false)} style={{ position: "absolute", top: 24, right: 24, background: "transparent", border: "none", color: "#444", cursor: "pointer", fontSize: 22 }}>✕</button>
          <button onClick={() => setSlideIdx(i => Math.max(0, i - 1))} style={{ position: "absolute", left: "calc(50% - 210px)", background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: 32, lineHeight: 1 }}>‹</button>
          <button onClick={() => setSlideIdx(i => Math.min((activeCarousel.slides.length) - 1, i + 1))} style={{ position: "absolute", right: "calc(50% - 210px)", background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: 32, lineHeight: 1 }}>›</button>

          {/* Phone frame */}
          <div style={{ width: 320, background: "#111", borderRadius: 44, border: "8px solid #1a1a1a", overflow: "hidden", boxShadow: "0 0 80px rgba(0,0,0,0.9), 0 0 0 1px #222" }}>
            <div style={{ height: 40, background: "#111", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px" }}>
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 600, fontFamily: "sans-serif" }}>9:41</span>
              <div style={{ width: 90, height: 16, background: "#080808", borderRadius: 12 }} />
              <span style={{ fontSize: 9, color: "#fff", fontFamily: "sans-serif" }}>●●●</span>
            </div>
            <div style={{ height: 42, borderBottom: "0.5px solid #222", display: "flex", alignItems: "center", padding: "0 12px", gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, #f59e0b, #ec4899)", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 11, color: "#fff", fontWeight: 600, fontFamily: "sans-serif" }}>novascaling</p>
                <p style={{ fontSize: 9, color: "#555", fontFamily: "sans-serif" }}>Ver perfil</p>
              </div>
            </div>
            <div style={{ width: "100%", height: 376, overflow: "hidden" }}>
              <SlideRender slide={activeSlide} carousel={activeCarousel} scale={304 / 1080} />
            </div>
            <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 14 }}>{["♡","✦","▷"].map(i => <span key={i} style={{ fontSize: 18, color: "#fff" }}>{i}</span>)}</div>
              <span style={{ fontSize: 18, color: "#fff" }}>⊹</span>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 5, paddingBottom: 12 }}>
              {activeCarousel.slides.map((_, i) => (
                <button key={i} onClick={() => setSlideIdx(i)}
                  style={{ width: i === slideIdx ? 14 : 5, height: 5, borderRadius: 3, background: i === slideIdx ? "#22c55e" : "#333", border: "none", cursor: "pointer", padding: 0, transition: "all 0.2s" }} />
              ))}
            </div>
          </div>
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
