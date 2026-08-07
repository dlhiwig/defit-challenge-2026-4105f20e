ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_weekly_summary boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_ai_feedback boolean NOT NULL DEFAULT true;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS private.app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON private.app_config FROM anon, authenticated;
GRANT ALL ON private.app_config TO service_role;
ALTER TABLE private.app_config ENABLE ROW LEVEL SECURITY;