// ─── NOVA Scaling Dashboard — Demo Data ───────────────────────────────────────
// Used when NEXT_PUBLIC_DEMO_MODE=true to preview all sections without Supabase.

import type { ClientMetrics } from "@/hooks/useClientMetrics"
import type { MonthlyRecord } from "@/hooks/useMonthlyMetrics"
import type { AdsMetrics } from "@/hooks/useAdsMetrics"
import type { PipelineData } from "@/hooks/useManychatPipeline"
import type { SalesData } from "@/hooks/useSalesPipeline"
import type { TraceabilityData } from "@/hooks/useTraceability"

export const DEMO_CLIENT_ID = "demo"

// ─── Overview / Client Metrics ────────────────────────────────────────────────
export const DEMO_CLIENT_METRICS: ClientMetrics = {
  cashCollected: 48500,
  revenueShare: 14550,
  qualifiedCalls: 18,
  newFollowers: 3240,
  revenueSharePct: 30,
}

// ─── Monthly Metrics (rolling 12 months) ──────────────────────────────────────
export const DEMO_MONTHLY_METRICS: MonthlyRecord[] = [
  { month: 4,  year: 2025, label: "Abr 25", cashCollected: 22000, revenueShare: 6600,  newFollowers: 1800, totalConversations: 340, callsBooked: 12, callsAttended: 9,  closes: 3, closesTarget: 4,  healthScore: 71, responseRate: 62, ctr: 2.8, frequency: 1.6, attendanceRate: 75, contentPublished: 10, contentPlanned: 14 },
  { month: 5,  year: 2025, label: "May 25", cashCollected: 28000, revenueShare: 8400,  newFollowers: 2100, totalConversations: 420, callsBooked: 15, callsAttended: 12, closes: 4, closesTarget: 5,  healthScore: 76, responseRate: 68, ctr: 3.1, frequency: 1.4, attendanceRate: 80, contentPublished: 12, contentPlanned: 14 },
  { month: 6,  year: 2025, label: "Jun 25", cashCollected: 31000, revenueShare: 9300,  newFollowers: 2400, totalConversations: 380, callsBooked: 14, callsAttended: 11, closes: 4, closesTarget: 5,  healthScore: 79, responseRate: 71, ctr: 3.4, frequency: 1.3, attendanceRate: 79, contentPublished: 13, contentPlanned: 14 },
  { month: 7,  year: 2025, label: "Jul 25", cashCollected: 27000, revenueShare: 8100,  newFollowers: 1950, totalConversations: 310, callsBooked: 11, callsAttended: 8,  closes: 3, closesTarget: 5,  healthScore: 73, responseRate: 58, ctr: 2.6, frequency: 1.8, attendanceRate: 73, contentPublished: 9,  contentPlanned: 14 },
  { month: 8,  year: 2025, label: "Ago 25", cashCollected: 35000, revenueShare: 10500, newFollowers: 2700, totalConversations: 450, callsBooked: 17, callsAttended: 14, closes: 5, closesTarget: 5,  healthScore: 82, responseRate: 74, ctr: 3.6, frequency: 1.2, attendanceRate: 82, contentPublished: 14, contentPlanned: 14 },
  { month: 9,  year: 2025, label: "Sep 25", cashCollected: 38500, revenueShare: 11550, newFollowers: 2900, totalConversations: 480, callsBooked: 18, callsAttended: 15, closes: 6, closesTarget: 6,  healthScore: 84, responseRate: 76, ctr: 3.8, frequency: 1.1, attendanceRate: 83, contentPublished: 14, contentPlanned: 14 },
  { month: 10, year: 2025, label: "Oct 25", cashCollected: 42000, revenueShare: 12600, newFollowers: 3100, totalConversations: 520, callsBooked: 20, callsAttended: 16, closes: 6, closesTarget: 6,  healthScore: 85, responseRate: 78, ctr: 4.0, frequency: 1.1, attendanceRate: 80, contentPublished: 14, contentPlanned: 14 },
  { month: 11, year: 2025, label: "Nov 25", cashCollected: 39000, revenueShare: 11700, newFollowers: 2850, totalConversations: 495, callsBooked: 18, callsAttended: 14, closes: 5, closesTarget: 6,  healthScore: 83, responseRate: 75, ctr: 3.7, frequency: 1.3, attendanceRate: 78, contentPublished: 13, contentPlanned: 14 },
  { month: 12, year: 2025, label: "Dic 25", cashCollected: 44500, revenueShare: 13350, newFollowers: 3200, totalConversations: 540, callsBooked: 21, callsAttended: 17, closes: 7, closesTarget: 7,  healthScore: 87, responseRate: 80, ctr: 4.2, frequency: 1.1, attendanceRate: 81, contentPublished: 14, contentPlanned: 14 },
  { month: 1,  year: 2026, label: "Ene 26", cashCollected: 41000, revenueShare: 12300, newFollowers: 3050, totalConversations: 510, callsBooked: 19, callsAttended: 15, closes: 6, closesTarget: 7,  healthScore: 86, responseRate: 77, ctr: 4.0, frequency: 1.2, attendanceRate: 79, contentPublished: 14, contentPlanned: 14 },
  { month: 2,  year: 2026, label: "Feb 26", cashCollected: 46000, revenueShare: 13800, newFollowers: 3180, totalConversations: 555, callsBooked: 22, callsAttended: 18, closes: 7, closesTarget: 7,  healthScore: 88, responseRate: 82, ctr: 4.3, frequency: 1.0, attendanceRate: 82, contentPublished: 14, contentPlanned: 14 },
  { month: 3,  year: 2026, label: "Mar 26", cashCollected: 48500, revenueShare: 14550, newFollowers: 3240, totalConversations: 580, callsBooked: 23, callsAttended: 18, closes: 8, closesTarget: 8,  healthScore: 89, responseRate: 84, ctr: 4.5, frequency: 1.0, attendanceRate: 83, contentPublished: 14, contentPlanned: 14 },
]

// ─── Ads Metrics ──────────────────────────────────────────────────────────────
export const DEMO_ADS_METRICS: AdsMetrics = {
  totalSpend: 4200,
  avgCostPerFollower: 1.30,
  totalFollowers: 3240,
  creatives: [
    { id: "c1", name: "Historia con dolor — mamá que no puede pagar",  costPerFollower: 0.87, ctr: 4.2, frequency: 1.1, followersPerDay: 48, spend: 980, status: "winner" },
    { id: "c2", name: "Testimonio — Carlos triplicó sus clientes",       costPerFollower: 1.15, ctr: 3.6, frequency: 1.4, followersPerDay: 32, spend: 720, status: "winner" },
    { id: "c3", name: "Carrusel — Sistema de ventas paso a paso",        costPerFollower: 1.34, ctr: 3.2, frequency: 1.6, followersPerDay: 28, spend: 820, status: "winner" },
    { id: "c4", name: "Reel educativo — 3 errores al cerrar",            costPerFollower: 1.62, ctr: 2.8, frequency: 1.9, followersPerDay: 22, spend: 540, status: "warning" },
    { id: "c5", name: "Video largo — Caso de estudio 180 días",          costPerFollower: 1.78, ctr: 2.4, frequency: 2.2, followersPerDay: 18, spend: 690, status: "warning" },
    { id: "c6", name: "Hook directo — $50k en 90 días",                  costPerFollower: 2.44, ctr: 2.1, frequency: 2.6, followersPerDay: 15, spend: 450, status: "critical" },
  ],
}

// ─── ManyChat Pipeline ────────────────────────────────────────────────────────
export const DEMO_MANYCHAT_PIPELINE: PipelineData = {
  newConversations: 580,
  responseRate: 74,
  qualifiedLeads: 87,
  unqualifiedLeads: 164,
  calendarSent: 45,
  booked: 38,
  closed: 8,
  pendingFollowUps: 12,
  steps: [
    { label: "Nuevas conversaciones", count: 580 },
    { label: "Respondieron",          count: 429 },
    { label: "Calificados",           count: 87  },
    { label: "Link enviado",          count: 45  },
    { label: "Agendados",             count: 38  },
    { label: "Cierres",               count: 8   },
  ],
  weeklyConversations: [
    { day: "Lun", value: 72  },
    { day: "Mar", value: 95  },
    { day: "Mié", value: 88  },
    { day: "Jue", value: 110 },
    { day: "Vie", value: 124 },
    { day: "Sáb", value: 64  },
    { day: "Dom", value: 27  },
  ],
}

// ─── Sales Pipeline ───────────────────────────────────────────────────────────
export const DEMO_SALES_PIPELINE: SalesData = {
  callsScheduled: 38,
  attendanceRate: 74,
  closesThisWeek: 2,
  cashCollected: 48500,
  revenueShare: 14550,
  leads: [
    { id: "l1", leadName: "Martín Rodríguez",  originAngle: "Historia con dolor",    originCategory: "Problema",   stage: "Cerrado",     callDate: "2026-03-18", attended: true,  closed: true,  amount: 5500 },
    { id: "l2", leadName: "Sofía Gómez",        originAngle: "Testimonio Carlos",      originCategory: "Solución",   stage: "Cerrado",     callDate: "2026-03-16", attended: true,  closed: true,  amount: 5500 },
    { id: "l3", leadName: "Diego Fernández",    originAngle: "$50k en 90 días",        originCategory: "Producto",   stage: "Agendado",    callDate: "2026-03-22", attended: false, closed: false, amount: 0    },
    { id: "l4", leadName: "Lucía Herrera",      originAngle: "Historia con dolor",    originCategory: "Problema",   stage: "Seguimiento", callDate: "2026-03-15", attended: true,  closed: false, amount: 0    },
    { id: "l5", leadName: "Pablo Castro",       originAngle: "Carrusel sistema",       originCategory: "Solución",   stage: "No asistió",  callDate: "2026-03-14", attended: false, closed: false, amount: 0    },
    { id: "l6", leadName: "Valentina Ruiz",     originAngle: "Historia con dolor",    originCategory: "Problema",   stage: "Cerrado",     callDate: "2026-03-12", attended: true,  closed: true,  amount: 5500 },
    { id: "l7", leadName: "Andrés Torres",      originAngle: "Video caso estudio",     originCategory: "Producto",   stage: "Agendado",    callDate: "2026-03-23", attended: false, closed: false, amount: 0    },
    { id: "l8", leadName: "Camila López",       originAngle: "$50k en 90 días",        originCategory: "Producto",   stage: "Seguimiento", callDate: "2026-03-11", attended: true,  closed: false, amount: 0    },
    { id: "l9", leadName: "Facundo Ibáñez",     originAngle: "Historia con dolor",    originCategory: "Problema",   stage: "Cerrado",     callDate: "2026-03-09", attended: true,  closed: true,  amount: 5500 },
    { id: "l10",leadName: "Renata Sosa",        originAngle: "Carrusel sistema",       originCategory: "Solución",   stage: "No asistió",  callDate: "2026-03-07", attended: false, closed: false, amount: 0    },
  ],
  monthlyRevenue: [
    { month: "Oct", cash: 42000 },
    { month: "Nov", cash: 39000 },
    { month: "Dic", cash: 44500 },
    { month: "Ene", cash: 41000 },
    { month: "Feb", cash: 46000 },
    { month: "Mar", cash: 48500, projected: true },
  ],
}

// ─── Traceability ─────────────────────────────────────────────────────────────
export const DEMO_TRACEABILITY: TraceabilityData = {
  records: [
    { id: "t1",  closeName: "Martín Rodríguez", date: "2026-03-18", angle: "Historia con dolor",   category: "Problema", revenue: 5500, tags: [] },
    { id: "t2",  closeName: "Sofía Gómez",       date: "2026-03-16", angle: "Testimonio Carlos",    category: "Solución", revenue: 5500, tags: [] },
    { id: "t3",  closeName: "Valentina Ruiz",    date: "2026-03-12", angle: "Historia con dolor",   category: "Problema", revenue: 5500, tags: [] },
    { id: "t4",  closeName: "Facundo Ibáñez",    date: "2026-03-09", angle: "Historia con dolor",   category: "Problema", revenue: 5500, tags: [] },
    { id: "t5",  closeName: "Jorge Ibáñez",      date: "2026-02-28", angle: "Carrusel sistema",     category: "Solución", revenue: 5500, tags: [] },
    { id: "t6",  closeName: "María Paz Soto",    date: "2026-02-20", angle: "Historia con dolor",   category: "Problema", revenue: 5500, tags: [] },
    { id: "t7",  closeName: "Rodrigo Vega",      date: "2026-02-15", angle: "$50k en 90 días",      category: "Producto", revenue: 5500, tags: [] },
    { id: "t8",  closeName: "Carla Muñoz",       date: "2026-01-30", angle: "Historia con dolor",   category: "Problema", revenue: 5500, tags: [] },
    { id: "t9",  closeName: "Felipe Reyes",      date: "2026-01-22", angle: "Testimonio Carlos",    category: "Solución", revenue: 5500, tags: [] },
    { id: "t10", closeName: "Ana Belén Cruz",    date: "2026-01-15", angle: "Video caso estudio",   category: "Producto", revenue: 5500, tags: [] },
  ],
  angles: [
    { angle: "Historia con dolor", category: "Problema", totalCloses: 6, totalRevenue: 33000, isWinner: true,  fromPiece: false },
    { angle: "Testimonio Carlos",  category: "Solución", totalCloses: 2, totalRevenue: 11000, isWinner: false, fromPiece: false },
    { angle: "Carrusel sistema",   category: "Solución", totalCloses: 1, totalRevenue: 5500,  isWinner: false, fromPiece: false },
    { angle: "$50k en 90 días",    category: "Producto", totalCloses: 1, totalRevenue: 5500,  isWinner: false, fromPiece: false },
    { angle: "Video caso estudio", category: "Producto", totalCloses: 1, totalRevenue: 5500,  isWinner: false, fromPiece: false },
  ],
}
