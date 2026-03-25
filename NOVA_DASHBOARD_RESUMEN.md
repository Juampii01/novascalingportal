# NOVA Scaling Dashboard — Resumen Global Completo
> Documento para transferir contexto completo a otra instancia de Claude o al equipo.
> Última actualización: Marzo 2026

---

## 1. IDENTIDAD Y MARCA

- **Nombre del producto:** NOVA Scaling Dashboard
- **Descripción:** Portal interno de inteligencia comercial para clientes de la agencia NOVA Scaling. Cada cliente tiene su propio acceso y ve únicamente sus datos.
- **Slogan visual:** NOVA · SCALING (logo con línea separadora verde)
- **Antes se llamaba:** Smart Scale (renombrado completamente)

---

## 2. STACK TÉCNICO

| Item | Detalle |
|------|---------|
| Framework | Next.js 16, App Router |
| UI Library | React 19 |
| CSS | Tailwind CSS v4 — pero páginas propias usan inline styles, NO clases Tailwind |
| Componentes UI | shadcn/ui (dark theme, new-york style) — solo Tabs, Card, Select, Input, Button en páginas legacy |
| Charts | Recharts (LineChart, BarChart, AreaChart, PieChart) |
| Backend/Auth | Supabase (auth + database + Edge Functions) |
| Package manager | **pnpm** |
| Dev server | `pnpm dev` → puerto 3000 |
| Lenguaje | TypeScript |
| Ruta del proyecto | `/Users/juanpabloacostacaminos/Downloads/Nova Scaling Dashboard` |

---

## 3. SISTEMA DE DISEÑO

### 3.1 Colores

```
Background global:   #080808
Surfaces (cards):    #0d0d0d
Borders:             #111  (0.5px solid)
Accent principal:    #22c55e  (botones, líneas, valores positivos, CTAs)
Accent labels:       #4ade80  (section labels, títulos de sección)
Text primario:       #f5f5f5
Text secundario:     #d4d4d4
Text terciario:      #aaaaaa
Text muted:          #666
Text muy muted:      #555 / #444
Text casi invisible: #333 / #222
```

### 3.2 Tipografía

```
Títulos de página:   Georgia, serif — 30px, weight 400, color #f5f5f5, letterSpacing 1px
Números / KPIs:      Georgia, serif — tamaño variable (34px en cards grandes)
Section labels:      sans-serif — 10px, weight 500, letterSpacing 3px, color #4ade80, UPPERCASE
Body / UI:           sans-serif (Geist por defecto del sistema)
Table TH:            sans-serif — 9px, weight 400, letterSpacing 2px, color #666, UPPERCASE
Table TD:            sans-serif — 13px, weight 300, color #aaaaaa
Inputs / Forms:      sans-serif — 13px, weight 300, color #f5f5f5
Badges / Labels:     sans-serif — 8-10px, letterSpacing 2-3px
```

**NUNCA usar:** Inter, Poppins, ni ninguna font externa. Solo Georgia + sans-serif del sistema.

### 3.3 Componentes base

```
Cards:           background #0d0d0d, border 0.5px solid #111, borderRadius 12px
Inputs:          background #080808, border 0.5px solid #111, borderRadius 8px
Buttons primary: background #22c55e, color #000, borderRadius 8px, 11px sans-serif weight 500, letterSpacing 2px, UPPERCASE
Buttons ghost:   background transparent, border 0.5px solid #222, color #888
Badges:          borderRadius 9999px, padding 2-3px 8-10px
Dividers:        height 0.5px, background #111
Progress bars:   height 3px, background #111 track, #22c55e fill
```

### 3.4 Lo que NO se hace

- ❌ Sin shadows (box-shadow)
- ❌ Sin glassmorphism / backdrop-blur
- ❌ Sin gradients en fondos o botones
- ❌ Sin text-shadow
- ❌ Sin border-radius mayor a 12px en cards
- ❌ Sin colores azules como acento principal — solo verde
- ❌ Sin Tailwind classes en páginas propias — todo inline styles

---

## 4. AUTENTICACIÓN Y ROLES

### 4.1 Flujo de auth

- **Supabase Auth** maneja sesiones con JWT
- `DashboardLayout` verifica sesión en cada render. Si no hay sesión → redirect a `/login`
- El rol está en `app_metadata.role` o `user_metadata.role`

### 4.2 Roles

- **`admin`**: ve todos los clientes. Tiene dropdown en el header para cambiar de cliente activo.
- **`client`**: ve solo sus propios datos. `activeClientId` = su propio UUID de Auth.

### 4.3 Contextos expuestos por DashboardLayout

```typescript
useActiveClient()    // string | null — ID del cliente activo
useSelectedMonth()   // string | null — mes seleccionado en formato "YYYY-MM"
```

---

## 5. ESTRUCTURA DE ARCHIVOS

```
/app
  /login              → Login con logo NOVA
  /signup             → Crear cuenta
  /forgot-password    → Recuperar contraseña
  /reset-password     → Resetear contraseña
  /overview           → Dashboard principal (página de inicio)
  /acquisition        → Adquisición (3 tabs: Ads, ManyChat, Contenido)
  /sales              → Pipeline de ventas + CRM
  /traceability       → Trazabilidad de ángulos y cierres
  /projections        → Proyecciones + Health Score
  /profile            → Perfil y configuración del cliente
  /audit              → Auditoría estratégica con IA
  /market-intelligence → Investigación competitiva con IA
  /program-checklist  → Checklist del programa
  /calendar           → Agenda de llamadas Zoom
  /visibility         → (en construcción)
  /page.tsx           → Root → redirect a /overview

/components
  nova-logo.tsx
  sidebar.tsx
  dashboard-layout.tsx
  metric-card.tsx
  frequency-bar.tsx
  status-badge.tsx
  health-score-ring.tsx
  revenue-share-calculator.tsx
  pipeline-step.tsx
  angle-card.tsx
  data-modal.tsx           → Modal reutilizable (DataModal, Field, FormSection, INPUT)
  skeleton.tsx             → SkeletonCard, EmptyState

/hooks
  useClientMetrics.ts      → KPIs generales del cliente (Supabase)
  useAdsMetrics.ts         → Métricas de Follow Me Ads (Supabase)
  useManychatPipeline.ts   → Pipeline de 7 pasos ManyChat (Supabase)
  useSalesPipeline.ts      → Pipeline de ventas (Supabase)
  useMonthlyMetrics.ts     → Métricas mensuales (Supabase)
  useTraceability.ts       → Trazabilidad de ángulos (Supabase)
  useContentPieces.ts      → Piezas de contenido (Supabase)

/lib
  supabaseClient.ts        → createClient() con env vars
  health-score.ts          → calculateHealthScore() + getHealthScoreComponents()
  styles.ts                → Constantes SECTION_LABEL, CARD_P, TH, TD

/supabase/functions
  manychat-tag-event/      → Webhook de ManyChat → CRM automation
  sync-manychat/           → Sync diario de tags a manychat_pipeline
  sync-meta-ads/           → Sync de métricas Meta Ads
```

---

## 6. SIDEBAR Y NAVEGACIÓN

```
PRINCIPAL
  → Overview          /overview
  → Adquisición       /acquisition
  → Ventas            /sales
  → Trazabilidad      /traceability
  → Proyecciones      /projections
  → Visibilidad       /visibility

HERRAMIENTAS
  → Auditoría IA      /audit
  → Market Intel.     /market-intelligence
  → Checklist         /program-checklist
  → Calendario        /calendar

CONFIGURACIÓN
  → Perfil del cliente /profile
  → Ajustes           /settings
```

---

## 7. BASE DE DATOS — TABLAS SUPABASE

Todas las tablas tienen **RLS habilitado** con policy: `client_id::uuid = auth.uid()` + policy adicional para admin: `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')`.

### 7.1 `profiles`
```sql
id uuid PK (= auth.uid())
role text ('admin' | 'client')
client_id uuid (= auth.uid() para clientes)
client_name text
```

### 7.2 `nova_client_profile`
```sql
id uuid PK
client_id uuid UNIQUE
business_name text
expert_name text
niche text
sub_niche text
offer_name text
offer_description text
offer_price numeric
aov numeric
target_audience text
main_platform text
instagram_url text
current_monthly_revenue numeric
revenue_share_pct numeric DEFAULT 30
monthly_ad_budget numeric
start_date date
winning_angles jsonb DEFAULT '[]'
main_pains jsonb DEFAULT '[]'
goals text
notes text
manychat_api_key text
meta_ad_account_id text
meta_access_token text
```

### 7.3 `monthly_reports`
```sql
client_id uuid
month date (YYYY-MM-01) — UNIQUE con client_id
report_date date
-- Financiero
cash_collected numeric
revenue_share numeric
total_revenue numeric
mrr numeric
ad_spend numeric
software_costs numeric
variable_costs numeric
-- Ventas
scheduled_calls int
attended_calls int
new_clients int
qualified_calls int
offer_docs_sent int
offer_docs_responded int
cierres_por_offerdoc int
closes int
closes_target int
-- Adquisición
new_followers int
inbound_messages int
aplications int
active_clients int
-- Contenido
short_followers int
short_reach int
short_posts int
-- YouTube
yt_subscribers int
yt_new_subscribers int
yt_views int
yt_monthly_audience int
yt_watch_time numeric
yt_videos int
-- Email
email_subscribers int
email_new_subscribers int
-- Health Score (calculado externamente)
health_score numeric
response_rate numeric
ctr numeric
frequency numeric
attendance_rate numeric
content_published int
content_planned int
-- Cualitativo
biggest_win text
next_focus text
support_needed text
improvements text
```

### 7.4 `ads_metrics`
```sql
client_id uuid
month date
creative_name text
spend numeric
followers_gained int
ctr numeric
frequency numeric
impressions int
reach int
```

### 7.5 `manychat_pipeline`
```sql
client_id uuid
month date
tag_name text
subscriber_count int
-- UNIQUE(client_id, month, tag_name)
```

### 7.6 `sales_pipeline`
```sql
id uuid PK
client_id uuid
subscriber_id text        -- ID del contacto en ManyChat
lead_name text
stage text                -- 'apertura' | 'calificacion' | 'llamada' | 'cerrado'
closed boolean DEFAULT false
attended boolean DEFAULT false
call_date date
amount numeric
origin_angle text
origin_category text      -- 'Problema' | 'Solución' | 'Producto' | 'Mentalidad'
notes text
content_piece_id uuid     -- FK a content_pieces (opcional)
tags jsonb DEFAULT '[]'   -- snapshot de tags ManyChat al momento del cierre
created_at timestamptz
-- UNIQUE(client_id, subscriber_id)
```

### 7.7 `subscriber_tags`
```sql
id uuid PK
client_id text
subscriber_id text
tag_name text
added_at timestamptz
-- UNIQUE(client_id, subscriber_id, tag_name)
```

### 7.8 `content_pieces`
```sql
id uuid PK
client_id uuid
month date
title text
format text
angle text
category text
status text               -- 'publicado' | 'borrador' | 'atrasado'
is_ads_candidate boolean
published_at date
```

### 7.9 `content_pipeline`
```sql
id uuid PK
client_id uuid
content_piece_id uuid FK content_pieces
status text
notes text
```

### 7.10 `content_angles`
```sql
id uuid PK
client_id uuid
month date
angle text
category text
total_closes int
total_revenue numeric
is_winner boolean DEFAULT false
-- UNIQUE(client_id, month, angle)
```

### 7.11 `ai_diagnosis_requests` / `ai_diagnosis_results`
```sql
-- Requests de auditoría IA + resultados generados
```

### 7.12 `market_intelligence_requests`
```sql
-- Requests de investigación de mercado IA
```

---

## 8. EDGE FUNCTIONS (Supabase)

### 8.1 `manychat-tag-event` — CRM Automation
**URL:** `https://nygcxwaxfvxximehybzv.supabase.co/functions/v1/manychat-tag-event`
**Método:** POST (sin JWT requerido — `--no-verify-jwt`)

**Body esperado:**
```json
{
  "client_id": "uuid-del-cliente",
  "subscriber_id": "id-manychat",
  "subscriber_name": "Nombre Apellido",
  "tag": "calificado",
  "action": "add"
}
```

**Lógica por tag:**
- `calificado` → INSERT en `sales_pipeline` con stage="calificacion" (ignora duplicados por UNIQUE client_id,subscriber_id)
- `agendado` → UPDATE `sales_pipeline` SET stage="llamada"
- `cerrado` → Query todos los tags del subscriber en `subscriber_tags` → UPDATE `sales_pipeline` SET stage="cerrado", closed=true, call_date=hoy, **tags=[snapshot de todos sus tags]**

**Tags se acumulan en `subscriber_tags`** con UNIQUE(client_id, subscriber_id, tag_name) para idempotencia.

### 8.2 `sync-manychat` — Sync diario de conteos
Cuenta distinct subscribers por tag_name desde `subscriber_tags` y hace upsert en `manychat_pipeline`.

### 8.3 `sync-meta-ads`
Sincroniza métricas de Meta Ads a `ads_metrics`.

---

## 9. PÁGINAS — DETALLE COMPLETO

### 9.1 `/overview` — Dashboard principal

**Header:** HealthScoreRing (80px) + título "Overview" + fecha actual + botón "+ Reporte mensual"

**Métricas principales:** 4 MetricCards
- Revenue del mes (cash collected)
- Conversaciones DM (ManyChat)
- Seguidores nuevos
- Health Score

**Alertas automáticas:** Si frecuencia > 1.5 → warning. Si > 1.8 → danger. Si response rate < 40% → alerta.

**SmartAlertButton:** cada alerta tiene botón "Ver recomendación IA" → POST `/api/smart-alert` → respuesta de Claude con acción concreta.

**Análisis mensual IA:** sección que muestra resumen del mes generado por IA.

**Modal "Reporte mensual":** formulario completo para cargar datos en `monthly_reports`:
- Período (mes/año)
- Financiero: cash collected, revenue share, total revenue, MRR, ad spend, software costs, variable costs
- Ventas: llamadas agendadas/atendidas/calificadas, cierres, offer docs
- Adquisición: seguidores nuevos, conversaciones ManyChat, aplicaciones, clientes activos
- Contenido: seguidores, alcance, posts publicados
- YouTube: suscriptores, views, audiencia, watch time, videos
- Cualitativo: mayor logro, próximo foco, soporte necesario, mejoras

**Datos:** `useClientMetrics` + `useMonthlyMetrics` + `useManychatPipeline` + `useAdsMetrics`

---

### 9.2 `/acquisition` — Adquisición

3 tabs: **Follow Me Ads | ManyChat | Contenido**

#### Tab Ads
- MetricCards: Inversión total, Costo por seguidor, Seguidores del mes
- Tabla de creativos: nombre, costo/seguidor, CTR, frecuencia (FrequencyBar), seguidores/día, status (StatusBadge)
- Botón "Sincronizar desde Meta Ads" → llama edge function `sync-meta-ads`

#### Tab ManyChat
- MetricCards: **Leads nuevos**, Leads calificados, Descalificados, **Tasa de calificación**, Calendario enviado, Agendados, Cerrados, Seguimientos pendientes
- PieChart donut: calificados vs no calificados
- Pipeline visual de 7 pasos (PipelineStep): Apertura → Calificado → Filtrado → Dolor → Solución → Prueba Social → Agendado
- Botón "Sincronizar" → llama edge function `sync-manychat`
- Botón "+ Cargar pipeline" → modal para cargar datos manualmente

#### Tab Contenido
- Barra de progreso: X piezas publicadas
- Grid de content cards: título, categoría, formato, status, badge ADS si es candidato
- Botón "+ Agregar pieza" → modal para cargar nueva pieza en `content_pieces`

**Datos:** `useAdsMetrics` + `useManychatPipeline` + `useContentPieces`

---

### 9.3 `/sales` — Ventas y CRM

**Header:** "Inteligencia Comercial" + título "Ventas"

**MetricCards:** Revenue del mes, Llamadas agendadas, Tasa de asistencia, Cierres, AOV

**RevenueShareCalculator:** input monto + botones 20/30/50% → muestra "NOVA recibe $X"

**Tabla de leads (pipeline):**
- Columnas: Cierre, Fecha, Etapa, Asistió, Estado, Monto, Acciones
- Etapas con badges de color: apertura (gris), calificación (azul), llamada (amber), cerrado (verde)
- Botón **"Editar"** en cada fila → abre modal pre-llenado con datos del lead
- Botón **"+ Agregar lead"** → modal vacío

**Modal de lead (agregar/editar):**
- Campos: Nombre, Ángulo de origen, Categoría, Etapa, Fecha llamada, Asistió (checkbox), Cerrado (checkbox), Monto, Notas
- Si stage="cerrado" → attended se pone automáticamente en true
- Si closed checkbox = true → attended se pone automáticamente en true
- Guarda en `sales_pipeline` con INSERT (nuevo) o UPDATE (editar por id)

**Lógica del hook `useSalesPipeline`:**
- Filtra por `client_id`
- Incluye leads sin call_date (creados por ManyChat webhook): `.or('call_date.gte.X,call_date.is.null')`
- Ordena por created_at DESC

**CRM automático (via ManyChat webhooks):**
- Tag "calificado" → lead aparece automáticamente en la tabla con stage "calificacion"
- Tag "agendado" → lead se mueve a stage "llamada"
- Tag "cerrado" → lead se marca closed=true, stage="cerrado", call_date=hoy, tags guardados como snapshot

**Datos:** `useSalesPipeline`

---

### 9.4 `/traceability` — Trazabilidad

**Header:** "Inteligencia Comercial" + título "Trazabilidad" + botón "Sincronizar desde ventas"

**TOP ÁNGULOS DEL MES:**
- AngleCards ordenadas por revenue (winner badge #1 dorado)
- Cada card muestra: badge categoría, nombre del ángulo, cierres, revenue total

**REGISTRO DE CIERRES:**
- Tabla de todos los leads cerrados del mes
- Columnas: Cierre, Fecha, Ángulo Origen, Categoría, **Origen (tags ManyChat)**, Revenue
- La columna **Origen** muestra los tags del lead como badges con colores:
  - `calificado` → azul/gris oscuro
  - `agendado` → amber
  - `cerrado` → verde
- Los tags se leen directamente de `sales_pipeline.tags` (snapshot guardado al momento del cierre)
- Sin tags → muestra "Sin etiquetas" en gris

**TODOS LOS ÁNGULOS ACTIVOS:**
- Grid de AngleCards con todos los ángulos que tienen al menos 1 cierre

**Botón "Sincronizar desde ventas":**
- Lee cierres de `sales_pipeline` donde origin_angle IS NOT NULL
- Agrupa por ángulo y calcula closes + revenue
- Hace upsert en `content_angles` con el mes actual
- Marca el ángulo con más revenue como is_winner=true

**Lógica de `useTraceability`:**
- Lee `sales_pipeline` donde closed=true del mes seleccionado
- Lee `sales_pipeline.tags` directamente (no JOIN a subscriber_tags)
- Intenta JOIN a `content_pieces` por `content_piece_id`
- Agrupa cierres por ángulo para el ranking

**Datos:** `useTraceability`

---

### 9.5 `/projections` — Proyecciones

**HEALTH SCORE DEL SISTEMA:**
- HealthScoreRing grande (100px) — verde ≥75, amber ≥50, rojo <50
- Tabla de componentes:

| Componente | Peso | Fuente de datos |
|-----------|------|----------------|
| Tasa respuesta abridoras | 20% | `manychat_pipeline.responseRate` |
| CTR creativos activos | 20% | `ads_metrics` → promedio CTR |
| Frecuencia promedio | 15% | `ads_metrics` → promedio frequency |
| Tasa asistencia llamadas | 20% | `sales_pipeline.attendanceRate` |
| Contenido publicado | 15% | `content_pieces` status=publicado |
| Cierres vs proyección | 10% | cierres reales / (llamadas agendadas × close rate histórica) |

**PROYECCIÓN DEL MES ACTUAL:**
- Llamadas agendadas (pendientes, no cerradas)
- Tasa de cierre histórica (cierres / atendidas)
- AOV promedio (de monthly_reports o de sales_pipeline si no hay reporte)
- Revenue proyectado NOVA = llamadas pendientes × close rate × AOV × revenue_share_pct
- Progress bar vs objetivo del mes (último cash collected × 1.2)

**GRÁFICO 6 MESES:**
- AreaChart Recharts con 3 escenarios desde el baseCash actual:
  - Conservador: +3%/mes
  - Medio: +8%/mes
  - Optimista: +15%/mes

**Fallbacks cuando monthly_reports está vacío:**
- baseCash = revenue de cierres reales en sales_pipeline (o 30,000 por defecto)
- AOV = revenue total cierres / cantidad de cierres
- Health score se calcula igual — de datos reales de hooks

**Datos:** `useMonthlyMetrics` + `useSalesPipeline` + `useAdsMetrics` + `useManychatPipeline` + `useContentPieces`

---

### 9.6 `/profile` — Perfil del cliente

**Qué muestra:**
- Header: avatar inicial + nombre del cliente + email
- Form editable con secciones conectadas a `nova_client_profile` en Supabase

**Secciones:**
- Negocio: businessName, expertName, niche, instagramUrl, offerDescription
- Acuerdo comercial: AOV ($), revenueSharePct (botones 20/30/50%), startDate
- Sistema: winningAngles (tags interactivos), mainPains (tags interactivos), notes
- Integraciones: manychat_api_key (texto), meta_ad_account_id, meta_access_token

**Comportamiento:**
- Lee de `nova_client_profile` WHERE client_id = auth.uid()
- Guarda con upsert en `nova_client_profile`
- TagList: input text + Enter para agregar, × para eliminar, guarda como jsonb

---

### 9.7 `/audit` — Auditoría Estratégica IA

- Card de Revenue rolling 12m + badge del tipo de auditoría (>$20k / <$20k)
- Checklist de 13 ítems con semáforo: 🔴 No está / 🟡 Parcial / 🟢 Sí está
- Botón "Generar Diagnóstico" → POST `/api/ai-diagnosis` → polling → resultado markdown
- Historial de diagnósticos anteriores con fecha y preview

---

### 9.8 `/market-intelligence` — Market Intel IA

- Form: plataforma, horizonte temporal, hasta 5 URLs de competidores
- POST `/api/market-intelligence/create-request`
- Resultados: Executive Summary, Patrones, Top Hooks, Oportunidades, Ideas Recomendadas, Ángulos, Brechas, Estructuras de Storytelling, Análisis Individual de Videos

---

### 9.9 `/program-checklist` — Checklist del Programa

- Barra de progreso global
- Meses como secciones expandibles → semanas como acordeón
- Tareas con checkbox + link al recurso
- Persiste en localStorage

---

### 9.10 `/calendar` — Calendario de llamadas

- Grid de llamadas Zoom (Lunes a Viernes)
- Card de llamada mensual individual con Ann → Calendly

---

## 10. HOOKS — ESTADO ACTUAL (todos conectados a Supabase)

### `useSalesPipeline(clientId)`
```typescript
Returns: {
  data: {
    leads: Lead[]            // todos los leads del período
    revenue: number          // suma de amount de leads cerrados
    callsScheduled: number   // leads en stage "llamada" no cerrados
    attendanceRate: number   // % atendidos sobre agendados
    responseRate: number     // % calificados sobre total
    closes: number           // total cerrados
    aov: number              // promedio de monto por cierre
  }
}
// Filtra: call_date >= hace 90 días OR call_date IS NULL (para leads ManyChat sin fecha)
```

### `useTraceability(clientId, month?, year?)`
```typescript
Returns: {
  data: {
    records: TraceabilityRecord[]   // cierres con tags, ángulo, revenue
    angles: AngleSummary[]          // ranking de ángulos
  }
  refetch: () => void
}
// TraceabilityRecord.tags: string[] — leído de sales_pipeline.tags directamente
```

### `useManychatPipeline(clientId)`
```typescript
Returns: {
  data: {
    newConversations: number    // apertura
    qualifiedLeads: number      // calificado
    unqualifiedLeads: number    // descalificados
    calendarSent: number        // calendario_enviado
    callsScheduled: number      // agendado
    closed: number              // cerrado
    pendingFollowUps: number
    responseRate: number        // qualifiedLeads / newConversations × 100
    steps: [{ label, count }]   // 7 pasos del pipeline
  }
}
```

### `useMonthlyMetrics(clientId)`
```typescript
Returns: {
  data: MonthlyMetric[]   // últimos N meses de monthly_reports
  loading: boolean
}
// MonthlyMetric: { month, year, cashCollected, closes, closesTarget, responseRate, ... }
```

### `useAdsMetrics(clientId)`
```typescript
Returns: {
  data: {
    totalSpend: number
    avgCostPerFollower: number
    totalFollowers: number
    creatives: Creative[]  // { name, costPerFollower, ctr, frequency, followersPerDay, status }
  }
}
```

### `useContentPieces(clientId, selectedMonth?)`
```typescript
Returns: {
  data: ContentPiece[]   // piezas del mes seleccionado
  loading: boolean
}
```

---

## 11. HEALTH SCORE — CÁLCULO

Archivo: `lib/health-score.ts`

```typescript
interface HealthMetrics {
  responseRate: number        // % calificados/total — de manychat_pipeline
  avgCtr: number              // CTR promedio creativos — de ads_metrics
  avgFrequency: number        // frecuencia promedio — de ads_metrics
  callAttendanceRate: number  // % asistencia llamadas — de sales_pipeline
  contentPublishedPct: number // % piezas publicadas — de content_pieces
  closesVsProjection: number  // % cierres vs proyección — derivado
}

// Pesos:
responseRate:       20%  → ideal > 40%
avgCtr:             20%  → ideal > 3%
avgFrequency:       15%  → ideal 1.2-1.5 (penaliza si > 1.8)
callAttendanceRate: 20%  → ideal > 80%
contentPublishedPct:15%  → ideal 100%
closesVsProjection: 10%  → ideal > 80%

// Score: 0-100
// Verde ≥75 | Amber ≥50 | Rojo <50
```

---

## 12. API ROUTES

### POST `/api/ai-diagnosis`
```
Body: { prompt, auditType, annualRevenue, selectedMonth, clientId, userId }
Response: { request_id }
```

### GET `/api/ai-diagnosis?request_id=X`
```
Response: { status, result }
Polling hasta "completed" | "failed" — timeout 60 segundos
```

### POST `/api/market-intelligence/create-request`
```
Body: { platform, timeframe_days, competitors, access_token, client_id }
Response: { id }
```

---

## 13. FLUJO COMPLETO DEL SISTEMA

```
CONTENIDO
  │
  ▼
Instagram / YouTube / Reels
  │
  ▼ (DM / comentario)
ManyChat Bot
  │ tag "calificado" → POST manychat-tag-event
  │   → INSERT sales_pipeline (stage: calificacion)
  │   → INSERT subscriber_tags
  │
  │ tag "agendado" → POST manychat-tag-event
  │   → UPDATE sales_pipeline (stage: llamada)
  │
  │ tag "cerrado" → POST manychat-tag-event
  │   → query subscriber_tags → snapshot de tags
  │   → UPDATE sales_pipeline (stage: cerrado, closed: true, tags: [...])
  │
  ▼
DASHBOARD
  ├── /sales           → pipeline en tiempo real
  ├── /acquisition     → conteos por tag (sync-manychat diario)
  ├── /traceability    → tags de cada cierre + ángulo que lo originó
  └── /projections     → health score + revenue proyectado
```

---

## 14. REGLAS CRÍTICAS PARA EDITAR ESTE PROYECTO

1. **Siempre inline styles** en páginas y componentes propios. Nunca clases Tailwind directas.
2. **Nunca** cambiar colores de acento a azul — solo `#22c55e` / `#4ade80`.
3. **Nunca** agregar shadows, blur, o glassmorphism.
4. **Nunca** usar fonts externas — solo Georgia serif y sans-serif del sistema.
5. **Preservar toda la lógica de negocio** al tocar una página — solo cambiar el visual.
6. **pnpm** como package manager — nunca npm ni yarn.
7. El patrón de cada página: section label verde → título Georgia → contenido.
8. Todos los hooks deben exponer `{ data, loading, error, refetch }`.
9. RLS siempre habilitado en tablas nuevas — nunca saltear seguridad.
10. Edge functions de ManyChat deployadas con `--no-verify-jwt`.
11. `onConflict` en upserts requiere que exista un UNIQUE constraint real en la DB.
12. `sales_pipeline.client_id` es UUID. `subscriber_tags.client_id` es text. Al comparar: usar `::text` en ambos.

---

## 15. PENDIENTE / PRÓXIMOS PASOS

1. **Visibilidad** (`/visibility`) — página en construcción, falta definir contenido
2. **Meta Ads sync real** — edge function `sync-meta-ads` existe pero necesita configuración del ad_account_id por cliente
3. **Datos mensuales reales** — los clientes deben cargar su primer `monthly_reports` en Overview para que Proyecciones tenga base histórica
4. **DM de apertura ManyChat** — el tag "apertura" existe en el sistema pero el flujo de primer contacto depende de las funciones Beta de ManyChat (no disponible en todos los planes aún)
5. **Multi-cliente producción** — el sistema funciona para 1 cliente en desarrollo; escala horizontalmente sin cambios de código gracias a RLS por `client_id`

---

*Fin del documento. Estado: Fases 1–4 completadas y funcionando en producción local.*
*Próxima sesión: conectar Meta Ads real, cargar primer reporte mensual, configurar dominio en producción.*
