export interface HealthMetrics {
  responseRate: number        // % de respuesta abridoras (0-100)
  avgCtr: number              // CTR promedio creativos activos (0-100)
  avgFrequency: number        // Frecuencia promedio creativos activos
  callAttendanceRate: number  // % asistencia a llamadas (0-100)
  contentPublishedPct: number // % contenido publicado vs planificado (0-100)
  closesVsProjection: number  // % cierres vs proyección (0-100)
}

interface ScoreComponent {
  name: string
  value: number
  formatted: string
  weight: number
  points: number
  maxPoints: number
}

function scoreResponseRate(rate: number): number {
  if (rate >= 60) return 100
  if (rate >= 40) return 70
  if (rate >= 25) return 40
  return 10
}

function scoreCtr(ctr: number): number {
  if (ctr >= 3) return 100
  if (ctr >= 2.5) return 80
  if (ctr >= 1.5) return 50
  return 20
}

function scoreFrequency(freq: number): number {
  if (freq < 1.2) return 100
  if (freq < 1.5) return 70
  if (freq < 1.8) return 40
  return 10
}

function scoreAttendance(rate: number): number {
  if (rate >= 75) return 100
  if (rate >= 60) return 70
  if (rate >= 45) return 40
  return 15
}

function scoreContent(pct: number): number {
  if (pct >= 90) return 100
  if (pct >= 70) return 75
  if (pct >= 50) return 50
  return 20
}

function scoreCloses(pct: number): number {
  if (pct >= 100) return 100
  if (pct >= 80) return 80
  if (pct >= 60) return 55
  return 25
}

export function calculateHealthScore(metrics: HealthMetrics): number {
  const weights = {
    responseRate: 0.20,
    ctr: 0.20,
    frequency: 0.15,
    attendance: 0.20,
    content: 0.15,
    closes: 0.10,
  }

  const score =
    scoreResponseRate(metrics.responseRate) * weights.responseRate +
    scoreCtr(metrics.avgCtr) * weights.ctr +
    scoreFrequency(metrics.avgFrequency) * weights.frequency +
    scoreAttendance(metrics.callAttendanceRate) * weights.attendance +
    scoreContent(metrics.contentPublishedPct) * weights.content +
    scoreCloses(metrics.closesVsProjection) * weights.closes

  return Math.round(score)
}

export function getHealthScoreComponents(metrics: HealthMetrics): ScoreComponent[] {
  const weights = [
    { name: "Tasa respuesta abridoras", value: metrics.responseRate, weight: 20, score: scoreResponseRate(metrics.responseRate), formatted: `${metrics.responseRate.toFixed(0)}%` },
    { name: "CTR creativos activos", value: metrics.avgCtr, weight: 20, score: scoreCtr(metrics.avgCtr), formatted: `${metrics.avgCtr.toFixed(1)}%` },
    { name: "Frecuencia promedio", value: metrics.avgFrequency, weight: 15, score: scoreFrequency(metrics.avgFrequency), formatted: metrics.avgFrequency.toFixed(2) },
    { name: "Tasa asistencia llamadas", value: metrics.callAttendanceRate, weight: 20, score: scoreAttendance(metrics.callAttendanceRate), formatted: `${metrics.callAttendanceRate.toFixed(0)}%` },
    { name: "Contenido publicado", value: metrics.contentPublishedPct, weight: 15, score: scoreContent(metrics.contentPublishedPct), formatted: `${metrics.contentPublishedPct.toFixed(0)}%` },
    { name: "Cierres vs proyección", value: metrics.closesVsProjection, weight: 10, score: scoreCloses(metrics.closesVsProjection), formatted: `${metrics.closesVsProjection.toFixed(0)}%` },
  ]

  return weights.map((w) => ({
    name: w.name,
    value: w.value,
    formatted: w.formatted,
    weight: w.weight,
    points: Math.round((w.score * w.weight) / 100),
    maxPoints: w.weight,
  }))
}
