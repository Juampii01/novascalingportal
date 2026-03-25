-- ============================================================
-- NOVA Scaling Dashboard — Migration 001
-- Tablas nuevas: ads_metrics, manychat_pipeline, sales_pipeline,
--                content_angles, nova_client_profile, monthly_analysis
-- ============================================================

-- ─── ads_metrics ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ads_metrics (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id          uuid        NOT NULL,
  creative_id        text        NOT NULL,
  creative_name      text        NOT NULL,
  date_from          date        NOT NULL,
  date_to            date        NOT NULL,
  spend              numeric(12,2) NOT NULL DEFAULT 0,
  followers_gained   integer     NOT NULL DEFAULT 0,
  cost_per_follower  numeric(10,4),
  ctr                numeric(6,2),          -- porcentaje (ej. 3.8)
  frequency          numeric(6,2),          -- veces que se mostró por persona
  followers_per_day  numeric(10,2),
  status             text        CHECK (status IN ('winner','warning','critical','inactive')) DEFAULT 'inactive',
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ads_metrics_client_date
  ON ads_metrics (client_id, date_from DESC);

ALTER TABLE ads_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client can view own ads_metrics"
  ON ads_metrics FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin can view all ads_metrics"
  ON ads_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can insert ads_metrics"
  ON ads_metrics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can update ads_metrics"
  ON ads_metrics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─── manychat_pipeline ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS manychat_pipeline (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            uuid        NOT NULL,
  period_start         date        NOT NULL,
  period_end           date        NOT NULL,
  new_conversations    integer     DEFAULT 0,
  response_rate        numeric(5,2) DEFAULT 0,  -- porcentaje
  qualified_leads      integer     DEFAULT 0,
  unqualified_leads    integer     DEFAULT 0,
  calendar_sent        integer     DEFAULT 0,
  booked               integer     DEFAULT 0,
  closed               integer     DEFAULT 0,
  pending_follow_ups   integer     DEFAULT 0,
  steps                jsonb       DEFAULT '[]'::jsonb,
  -- formato: [{ "label": "Apertura", "count": 284 }, ...]
  weekly_conversations jsonb       DEFAULT '[]'::jsonb,
  -- formato: [{ "day": "Lun", "value": 38 }, ...]
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS manychat_pipeline_client_period
  ON manychat_pipeline (client_id, period_start DESC);

ALTER TABLE manychat_pipeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client can view own manychat_pipeline"
  ON manychat_pipeline FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin can view all manychat_pipeline"
  ON manychat_pipeline FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can insert manychat_pipeline"
  ON manychat_pipeline FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can update manychat_pipeline"
  ON manychat_pipeline FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─── sales_pipeline ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_pipeline (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid        NOT NULL,
  lead_name        text        NOT NULL,
  origin_angle     text,
  origin_category  text        CHECK (origin_category IN ('Problema','Solución','Producto','Mentalidad')),
  stage            text        NOT NULL DEFAULT 'Agendado',
  call_date        date,
  attended         boolean     DEFAULT false,
  closed           boolean     DEFAULT false,
  amount           numeric(12,2) DEFAULT 0,
  notes            text,
  month            integer,    -- 1-12
  year             integer,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sales_pipeline_client_year_month
  ON sales_pipeline (client_id, year DESC, month DESC);

CREATE INDEX IF NOT EXISTS sales_pipeline_client_date
  ON sales_pipeline (client_id, call_date DESC);

ALTER TABLE sales_pipeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client can view own sales_pipeline"
  ON sales_pipeline FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin can view all sales_pipeline"
  ON sales_pipeline FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can insert sales_pipeline"
  ON sales_pipeline FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can update sales_pipeline"
  ON sales_pipeline FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─── content_angles ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_angles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid        NOT NULL,
  angle       text        NOT NULL,
  category    text        CHECK (category IN ('Problema','Solución','Producto','Mentalidad')),
  is_winner   boolean     DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_angles_client
  ON content_angles (client_id);

ALTER TABLE content_angles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client can view own content_angles"
  ON content_angles FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin can view all content_angles"
  ON content_angles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can insert content_angles"
  ON content_angles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can update content_angles"
  ON content_angles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─── nova_client_profile ────────────────────────────────────
CREATE TABLE IF NOT EXISTS nova_client_profile (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                uuid        NOT NULL UNIQUE,
  business_name            text,
  expert_name              text,
  niche                    text,
  sub_niche                text,
  offer_name               text,
  offer_description        text,
  offer_price              numeric(12,2),
  aov                      numeric(12,2),          -- average order value
  target_audience          text,
  main_platform            text,
  instagram_url            text,
  current_monthly_revenue  numeric(12,2),
  revenue_share_pct        numeric(5,2) DEFAULT 30,
  monthly_ad_budget        numeric(12,2),
  start_date               date,
  winning_angles           jsonb DEFAULT '[]'::jsonb,  -- text[]
  main_pains               jsonb DEFAULT '[]'::jsonb,  -- text[]
  goals                    text,
  notes                    text,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

ALTER TABLE nova_client_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client can view own profile"
  ON nova_client_profile FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Client can upsert own profile"
  ON nova_client_profile FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Client can update own profile"
  ON nova_client_profile FOR UPDATE
  USING (
    client_id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin can view all profiles"
  ON nova_client_profile FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can upsert all profiles"
  ON nova_client_profile FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can update all profiles"
  ON nova_client_profile FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─── monthly_analysis ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS monthly_analysis (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid        NOT NULL,
  month            integer     NOT NULL CHECK (month BETWEEN 1 AND 12),
  year             integer     NOT NULL,
  analysis_text    text,
  key_insights     jsonb       DEFAULT '[]'::jsonb,
  -- formato: [{ "insight": "...", "type": "positive"|"negative"|"neutral" }]
  recommendations  jsonb       DEFAULT '[]'::jsonb,
  -- formato: [{ "action": "...", "priority": "alta"|"media"|"baja" }]
  status           text        CHECK (status IN ('pending','completed','failed')) DEFAULT 'pending',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  UNIQUE (client_id, month, year)
);

CREATE INDEX IF NOT EXISTS monthly_analysis_client_year_month
  ON monthly_analysis (client_id, year DESC, month DESC);

ALTER TABLE monthly_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client can view own monthly_analysis"
  ON monthly_analysis FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin can view all monthly_analysis"
  ON monthly_analysis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role bypasses RLS" -- applied via service_role key in API routes
  ON monthly_analysis FOR ALL
  USING (true);
