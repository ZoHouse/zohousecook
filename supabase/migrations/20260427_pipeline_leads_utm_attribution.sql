-- Zo House — durable first-touch attribution on pipeline_leads

ALTER TABLE public.pipeline_leads
  ADD COLUMN IF NOT EXISTS landing_path text,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS fbc text,
  ADD COLUMN IF NOT EXISTS first_touch_captured_at timestamptz;

COMMENT ON COLUMN public.pipeline_leads.landing_path IS
  'First zo.house landing path that led to the apply, e.g. /vs-network-school';

COMMENT ON COLUMN public.pipeline_leads.utm_source IS
  'First-touch UTM source captured by zo.house';
COMMENT ON COLUMN public.pipeline_leads.utm_medium IS
  'First-touch UTM medium captured by zo.house';
COMMENT ON COLUMN public.pipeline_leads.utm_campaign IS
  'First-touch UTM campaign captured by zo.house';
COMMENT ON COLUMN public.pipeline_leads.utm_content IS
  'First-touch UTM content captured by zo.house';
COMMENT ON COLUMN public.pipeline_leads.utm_term IS
  'First-touch UTM term captured by zo.house';
COMMENT ON COLUMN public.pipeline_leads.fbc IS
  'Meta _fbc-style click identifier captured from fbclid on first touch';
COMMENT ON COLUMN public.pipeline_leads.first_touch_captured_at IS
  'Timestamp when first-touch attribution was captured in the browser';

CREATE INDEX IF NOT EXISTS pipeline_leads_zo_house_utm_idx
  ON public.pipeline_leads (utm_source, utm_medium, utm_campaign, created_at DESC)
  WHERE source = 'zo.house' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS pipeline_leads_zo_house_landing_path_idx
  ON public.pipeline_leads (landing_path, created_at DESC)
  WHERE source = 'zo.house' AND deleted_at IS NULL;
