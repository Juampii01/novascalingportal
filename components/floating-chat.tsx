"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useActiveClient } from "@/components/dashboard-layout"
import { useContentPieces } from "@/hooks/useContentPieces"
import { useSalesPipeline } from "@/hooks/useSalesPipeline"

interface Message {
  role: "user" | "assistant"
  content: string
}

// ─── Markdown-lite renderer ───────────────────────────────────────────────────
function renderText(text: string) {
  const lines = text.split("\n")
  return lines.map((line, i) => {
    if (!line.trim()) return <br key={i} />
    return (
      <span key={i} style={{ display: "block", marginBottom: "2px" }}>
        {line}
      </span>
    )
  })
}

// ─── Main component ───────────────────────────────────────────────────────────
export function FloatingChat() {
  const clientId  = useActiveClient()
  const { data: contentPieces } = useContentPieces(clientId)
  const { data: salesData } = useSalesPipeline(clientId)

  const [open, setOpen]           = useState(false)
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState("")
  const [streaming, setStreaming] = useState(false)
  const [dotFrame, setDotFrame]   = useState(0)

  const bottomRef  = useRef<HTMLDivElement | null>(null)
  const inputRef   = useRef<HTMLTextAreaElement | null>(null)
  const abortRef   = useRef<AbortController | null>(null)

  // Animate typing dots
  useEffect(() => {
    if (!streaming) return
    const t = setInterval(() => setDotFrame((f) => (f + 1) % 4), 380)
    return () => clearInterval(t)
  }, [streaming])

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streaming])

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const send = useCallback(async () => {
    if (!input.trim() || streaming) return
    const userMsg = input.trim()
    setInput("")
    const updated: Message[] = [...messages, { role: "user", content: userMsg }]
    setMessages(updated)
    setStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      // Build sales summary to inject as context
      const salesSummary = salesData ? (() => {
        const closed = salesData.leads.filter((l) => l.closed)
        const attended = salesData.leads.filter((l) => l.attended)
        const closeRate = attended.length > 0 ? Math.round((closed.length / attended.length) * 100) : 0

        const angleGroups: Record<string, { closes: number; revenue: number }> = {}
        for (const l of closed) {
          const a = l.originAngle || "Sin ángulo"
          if (!angleGroups[a]) angleGroups[a] = { closes: 0, revenue: 0 }
          angleGroups[a].closes++
          angleGroups[a].revenue += l.amount
        }
        const topAngles = Object.entries(angleGroups)
          .sort((a, b) => b[1].revenue - a[1].revenue)
          .slice(0, 5)
          .map(([angle, d]) => ({ angle, closes: d.closes, revenue: d.revenue }))

        return {
          totalLeads: salesData.leads.length,
          attended: attended.length,
          closed: closed.length,
          closeRate,
          cashCollected: salesData.cashCollected,
          topAngles,
        }
      })() : null

      const res = await fetch("/api/chat-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
          contentPieces,
          salesSummary,
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        setMessages((prev) => [...prev, { role: "assistant", content: err || "Error al conectar." }])
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let assistantText = ""

      setMessages((prev) => [...prev, { role: "assistant", content: "" }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          assistantText += decoder.decode(value, { stream: true })
          setMessages((prev) => {
            const copy = [...prev]
            copy[copy.length - 1] = { role: "assistant", content: assistantText }
            return copy
          })
        }
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setMessages((prev) => [...prev, { role: "assistant", content: "No se pudo conectar con el servidor." }])
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }, [input, messages, streaming, contentPieces])

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const clear = () => {
    if (streaming) {
      abortRef.current?.abort()
      setStreaming(false)
    }
    setMessages([])
  }

  return (
    <>
      {/* ── Panel ── */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            right: "24px",
            zIndex: 9998,
            width: "380px",
            maxHeight: "560px",
            display: "flex",
            flexDirection: "column",
            background: "#0a0a0a",
            border: "0.5px solid #1a1a1a",
            borderRadius: "14px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: "0.5px solid #111",
            background: "#080808",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.5)" }} />
              <p style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 500, color: "#e5e5e5", letterSpacing: "0.5px" }}>
                Asistente de contenido
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {messages.length > 0 && (
                <button onClick={clear} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#444", fontSize: "10px", fontFamily: "sans-serif", letterSpacing: "1px", padding: "3px 8px" }}>
                  limpiar
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#555", fontSize: "16px", lineHeight: 1, padding: "2px 4px" }}>
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>

            {messages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "8px" }}>
                <p style={{ fontSize: "13px", fontFamily: "Georgia, serif", color: "#555", textAlign: "center", marginBottom: "6px" }}>
                  ¿Qué publicamos esta semana?
                </p>
                {[
                  "¿Qué ángulos usar esta semana?",
                  "Armame un plan de 3 piezas para mañana",
                  "¿Qué pieza va a Follow Me Ads?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); setTimeout(() => inputRef.current?.focus(), 50) }}
                    style={{
                      background: "#0d0d0d", border: "0.5px solid #1a1a1a", borderRadius: "8px",
                      padding: "9px 12px", color: "#666", fontSize: "11px", fontFamily: "sans-serif",
                      fontWeight: 300, cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                      letterSpacing: "0.2px",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#333"; (e.currentTarget as HTMLButtonElement).style.color = "#aaa" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1a1a1a"; (e.currentTarget as HTMLButtonElement).style.color = "#666" }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "88%",
                  padding: m.role === "user" ? "9px 13px" : "0",
                  background: m.role === "user" ? "rgba(34,197,94,0.08)" : "transparent",
                  border: m.role === "user" ? "0.5px solid rgba(34,197,94,0.12)" : "none",
                  borderRadius: "10px",
                }}>
                  <div style={{
                    fontSize: "12px",
                    fontFamily: "sans-serif",
                    fontWeight: 300,
                    color: m.role === "user" ? "#d4d4d4" : "#9ca3af",
                    lineHeight: 1.7,
                    letterSpacing: "0.15px",
                    whiteSpace: "pre-wrap",
                  }}>
                    {m.content || (streaming && i === messages.length - 1 ? (
                      <span style={{ color: "#22c55e" }}>{"·".repeat(dotFrame + 1)}</span>
                    ) : null)}
                  </div>
                </div>
              </div>
            ))}

            {streaming && messages.length > 0 && messages[messages.length - 1].content === "" && (
              <p style={{ fontSize: "12px", color: "#22c55e", fontFamily: "sans-serif" }}>
                {"·".repeat(dotFrame + 1)}
              </p>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 14px", borderTop: "0.5px solid #111", flexShrink: 0, background: "#080808" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Escribí tu pregunta…"
                rows={1}
                style={{
                  flex: 1,
                  background: "#0d0d0d",
                  border: "0.5px solid #1a1a1a",
                  borderRadius: "8px",
                  padding: "9px 12px",
                  color: "#e5e5e5",
                  fontSize: "12px",
                  fontFamily: "sans-serif",
                  fontWeight: 300,
                  outline: "none",
                  resize: "none",
                  lineHeight: 1.5,
                  maxHeight: "100px",
                  overflowY: "auto",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(34,197,94,0.25)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#1a1a1a")}
                onInput={(e) => {
                  const t = e.currentTarget
                  t.style.height = "auto"
                  t.style.height = Math.min(t.scrollHeight, 100) + "px"
                }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || streaming}
                style={{
                  width: "34px", height: "34px", borderRadius: "8px", border: "none",
                  background: input.trim() && !streaming ? "#22c55e" : "#111",
                  color: input.trim() && !streaming ? "#000" : "#333",
                  fontSize: "14px", cursor: input.trim() && !streaming ? "pointer" : "not-allowed",
                  flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}
              >
                ↑
              </button>
            </div>
            <p style={{ fontSize: "9px", fontFamily: "sans-serif", color: "#2a2a2a", marginTop: "7px", letterSpacing: "0.5px" }}>
              Enter para enviar · Shift+Enter para nueva línea
            </p>
          </div>
        </div>
      )}

      {/* ── Toggle button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Asistente de contenido"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          width: "46px",
          height: "46px",
          borderRadius: "50%",
          border: "0.5px solid rgba(34,197,94,0.2)",
          background: open ? "#22c55e" : "#0d0d0d",
          color: open ? "#000" : "#22c55e",
          fontSize: "18px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: open ? "0 0 20px rgba(34,197,94,0.3)" : "0 4px 16px rgba(0,0,0,0.5)",
          transition: "all 0.2s ease",
        }}
      >
        {open ? "×" : "✦"}
      </button>
    </>
  )
}
