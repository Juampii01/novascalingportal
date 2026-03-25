"use client"

import { SECTION_LABEL, CARD_P } from "@/lib/styles"
import { SalesLead } from "@/hooks/useSalesPipeline"

interface WeekData {
  label: string
  dateRange: string
  newLeads: number
  calls: number
  closes: number
  revenue: number
  isCurrentWeek: boolean
}

function getWeekStart(weeksAgo: number): Date {
  const now = new Date()
  const day = now.getDay() // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1 // Monday = 0
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff - weeksAgo * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function formatDateRange(start: Date): string {
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const fmt = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`
  return `${fmt(start)} — ${fmt(end)}`
}

function buildWeeks(leads: SalesLead[]): WeekData[] {
  return Array.from({ length: 4 }, (_, i) => {
    const weeksAgo = 3 - i // 3, 2, 1, 0
    const start = getWeekStart(weeksAgo)
    const end = new Date(start)
    end.setDate(start.getDate() + 7)

    const inWeek = (dateStr: string | undefined | null) => {
      if (!dateStr) return false
      const d = new Date(dateStr + "T00:00:00")
      return d >= start && d < end
    }

    const weekLeads = leads.filter((l) => {
      const created = (l as any).createdAt ?? null
      return inWeek(created) || inWeek(l.callDate)
    })

    const newLeads = leads.filter((l) => inWeek((l as any).createdAt)).length
    const calls = leads.filter((l) => inWeek(l.callDate)).length
    const closes = leads.filter((l) => l.closed && inWeek(l.callDate)).length
    const revenue = leads
      .filter((l) => l.closed && inWeek(l.callDate))
      .reduce((sum, l) => sum + (l.amount ?? 0), 0)

    const labels = ["Hace 3 sem", "Hace 2 sem", "Semana pasada", "Esta semana"]

    return {
      label: labels[i],
      dateRange: formatDateRange(start),
      newLeads,
      calls,
      closes,
      revenue,
      isCurrentWeek: weeksAgo === 0,
    }
  })
}

const METRICS = [
  { key: "newLeads" as const, label: "Leads nuevos" },
  { key: "calls" as const, label: "Llamadas" },
  { key: "closes" as const, label: "Cierres" },
  { key: "revenue" as const, label: "Revenue", isCurrency: true },
]

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ height: "2px", background: "#0f0f0f", borderRadius: "9999px", marginTop: "6px", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "9999px", transition: "width 0.6s ease" }} />
    </div>
  )
}

export function WeeklyComparison({ leads }: { leads: SalesLead[] }) {
  const weeks = buildWeeks(leads)

  // Max per metric for bar scaling
  const maxValues = {
    newLeads: Math.max(...weeks.map((w) => w.newLeads), 1),
    calls:    Math.max(...weeks.map((w) => w.calls), 1),
    closes:   Math.max(...weeks.map((w) => w.closes), 1),
    revenue:  Math.max(...weeks.map((w) => w.revenue), 1),
  }

  const hasAnyData = weeks.some((w) => w.newLeads + w.calls + w.closes + w.revenue > 0)

  if (!hasAnyData) return null

  return (
    <div>
      <p style={SECTION_LABEL}>Vista comparativa — últimas 4 semanas</p>
      <div style={{ ...CARD_P, padding: 0, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "160px repeat(4, 1fr)", borderBottom: "0.5px solid #0f0f0f" }}>
          <div style={{ padding: "12px 20px" }} />
          {weeks.map((w) => (
            <div
              key={w.label}
              style={{
                padding: "14px 16px",
                borderLeft: "0.5px solid #0f0f0f",
                background: w.isCurrentWeek ? "rgba(34,197,94,0.03)" : "transparent",
              }}
            >
              <p style={{ fontSize: "9px", fontFamily: "sans-serif", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: w.isCurrentWeek ? "#22c55e" : "#2a2a2a", marginBottom: "3px" }}>
                {w.label}
              </p>
              <p style={{ fontSize: "9px", fontFamily: "sans-serif", fontWeight: 300, color: "#222", letterSpacing: "0.3px" }}>
                {w.dateRange}
              </p>
            </div>
          ))}
        </div>

        {/* Rows */}
        {METRICS.map((metric, mi) => {
          const max = maxValues[metric.key]
          return (
            <div
              key={metric.key}
              style={{
                display: "grid",
                gridTemplateColumns: "160px repeat(4, 1fr)",
                borderBottom: mi < METRICS.length - 1 ? "0.5px solid #0a0a0a" : "none",
              }}
            >
              <div style={{ padding: "16px 20px", display: "flex", alignItems: "center" }}>
                <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 400, color: "#2e2e2e", letterSpacing: "1px" }}>
                  {metric.label}
                </p>
              </div>
              {weeks.map((w) => {
                const raw = w[metric.key]
                const val = metric.isCurrency
                  ? raw >= 1000 ? `$${(raw / 1000).toFixed(1)}k` : `$${raw}`
                  : String(raw)
                const isMax = raw === max && raw > 0
                const color = metric.key === "revenue" ? "#22c55e"
                  : metric.key === "closes" ? "#4ade80"
                  : metric.key === "calls" ? "#60a5fa"
                  : "#9ca3af"

                return (
                  <div
                    key={w.label}
                    style={{
                      padding: "16px 16px",
                      borderLeft: "0.5px solid #0a0a0a",
                      background: w.isCurrentWeek ? "rgba(34,197,94,0.02)" : "transparent",
                    }}
                  >
                    <p style={{
                      fontFamily: "Georgia, serif",
                      fontSize: "18px",
                      fontWeight: 400,
                      color: raw === 0 ? "#181818" : isMax ? color : "#444",
                      letterSpacing: "-0.3px",
                      transition: "color 0.2s",
                    }}>
                      {raw === 0 ? "—" : val}
                    </p>
                    {raw > 0 && <Bar value={raw} max={max} color={color} />}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
