
-- Enums for missions
CREATE TYPE public.mission_focus AS ENUM ('strength', 'cardio', 'endurance', 'core', 'recovery', 'extreme');
CREATE TYPE public.mission_difficulty AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.mission_status AS ENUM ('active', 'completed', 'abandoned');
CREATE TYPE public.day_progress_status AS ENUM ('not_started', 'in_progress', 'completed', 'skipped');
CREATE TYPE public.step_type AS ENUM ('exercise', 'interval', 'rest');

-- 1) missions
CREATE TABLE public.missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  focus mission_focus NOT NULL,
  difficulty mission_difficulty NOT NULL,
  duration_days INTEGER NOT NULL,
  duration_weeks INTEGER,
  cover_image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published missions" ON public.missions FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage missions" ON public.missions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 2) mission_phases
CREATE TABLE public.mission_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  start_day INTEGER NOT NULL,
  end_day INTEGER NOT NULL,
  progression_rules JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mission_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view mission phases" ON public.mission_phases FOR SELECT USING (true);
CREATE POLICY "Admins can manage phases" ON public.mission_phases FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 3) workouts
CREATE TABLE public.workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  estimated_minutes INTEGER NOT NULL DEFAULT 30,
  equipment JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view workouts" ON public.workouts FOR SELECT USING (true);
CREATE POLICY "Admins can manage workouts" ON public.workouts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 4) workout_steps
CREATE TABLE public.workout_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  step_type step_type NOT NULL DEFAULT 'exercise',
  name TEXT NOT NULL,
  sets INTEGER,
  reps INTEGER,
  work_seconds INTEGER,
  rest_seconds INTEGER,
  distance_meters INTEGER,
  load_lbs INTEGER,
  notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.workout_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view workout steps" ON public.workout_steps FOR SELECT USING (true);
CREATE POLICY "Admins can manage workout steps" ON public.workout_steps FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 5) mission_schedule
CREATE TABLE public.mission_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  phase_number INTEGER,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  scaling_overrides JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mission_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view mission schedule" ON public.mission_schedule FOR SELECT USING (true);
CREATE POLICY "Admins can manage schedule" ON public.mission_schedule FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 6) user_missions
CREATE TABLE public.user_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status mission_status NOT NULL DEFAULT 'active',
  current_day_number INTEGER NOT NULL DEFAULT 1,
  completion_percent REAL NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, mission_id)
);
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own enrollments" ON public.user_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own enrollments" ON public.user_missions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own enrollments" ON public.user_missions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own enrollments" ON public.user_missions FOR DELETE USING (auth.uid() = user_id);
-- Allow public count aggregation via a function
CREATE POLICY "Anyone can count participants" ON public.user_missions FOR SELECT USING (true);

-- 7) user_mission_day_progress
CREATE TABLE public.user_mission_day_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  workout_id UUID REFERENCES public.workouts(id),
  status day_progress_status NOT NULL DEFAULT 'not_started',
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_id, day_number)
);
ALTER TABLE public.user_mission_day_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own day progress" ON public.user_mission_day_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own day progress" ON public.user_mission_day_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own day progress" ON public.user_mission_day_progress FOR UPDATE USING (auth.uid() = user_id);

-- 8) user_workout_step_progress
CREATE TABLE public.user_workout_step_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  workout_step_id UUID NOT NULL REFERENCES public.workout_steps(id) ON DELETE CASCADE,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  value JSONB,
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.user_workout_step_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own step progress" ON public.user_workout_step_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own step progress" ON public.user_workout_step_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own step progress" ON public.user_workout_step_progress FOR UPDATE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON public.missions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mission_phases_updated_at BEFORE UPDATE ON public.mission_phases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON public.workouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mission_schedule_updated_at BEFORE UPDATE ON public.mission_schedule FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_mission_day_progress_updated_at BEFORE UPDATE ON public.user_mission_day_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get participant count for a mission
CREATE OR REPLACE FUNCTION public.get_mission_participant_count(p_mission_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(COUNT(*)::INTEGER, 0)
  FROM public.user_missions
  WHERE mission_id = p_mission_id AND status IN ('active', 'completed');
$$;
