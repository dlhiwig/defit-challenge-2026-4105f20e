
-- Teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_usar BOOLEAN NOT NULL DEFAULT false,
  roster_locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Admins can manage teams" ON public.teams FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Team members (4-9 per team, enforced in app layer)
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view team members" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Admins can manage team members" ON public.team_members FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Commands table
CREATE TABLE public.commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.commands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view commands" ON public.commands FOR SELECT USING (true);
CREATE POLICY "Admins can manage commands" ON public.commands FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add command_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS command_id UUID REFERENCES public.commands(id);

-- Challenge configuration
CREATE TABLE public.challenge_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.challenge_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view challenge config" ON public.challenge_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage challenge config" ON public.challenge_config FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.challenge_config (key, value) VALUES
  ('challenge_start_date', '2026-01-12'),
  ('scoring_weeks', '8');

-- Ranking snapshots for caching computed rankings
CREATE TABLE public.ranking_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  component_a INTEGER NOT NULL DEFAULT 0,
  component_b INTEGER NOT NULL DEFAULT 0,
  component_c INTEGER NOT NULL DEFAULT 0,
  component_d INTEGER NOT NULL DEFAULT 0,
  component_e INTEGER NOT NULL DEFAULT 0,
  component_f INTEGER,
  total_score INTEGER NOT NULL DEFAULT 0,
  final_rank INTEGER NOT NULL DEFAULT 0,
  raw_values JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ranking_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view ranking snapshots" ON public.ranking_snapshots FOR SELECT USING (true);
CREATE POLICY "Service role manages snapshots" ON public.ranking_snapshots FOR ALL USING (true) WITH CHECK (true);
