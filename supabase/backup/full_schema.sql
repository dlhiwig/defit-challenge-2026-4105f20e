-- DEFIT schema snapshot generated from repo migrations.
-- Target project: dzvghrttcsfqjxwbtrlv
-- Apply only to an empty database; statements are not re-entrant as a group.

-- ===== 20251203005341_5fb0a7ed-90fe-46f2-be78-59855cd355b0.sql =====
-- Create enum for cardio types
CREATE TYPE public.cardio_type AS ENUM ('run_walk_ruck', 'bike', 'swim', 'row_elliptical');

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'soldier');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  unit TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for USARC admin validation
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'soldier',
  UNIQUE (user_id, role)
);

-- Create cardio_logs table
CREATE TABLE public.cardio_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  cardio_type cardio_type NOT NULL,
  distance NUMERIC(10,2) NOT NULL,
  distance_unit TEXT NOT NULL DEFAULT 'miles',
  notes TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create strength_logs table
CREATE TABLE public.strength_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  exercise_name TEXT NOT NULL,
  sets INTEGER NOT NULL,
  reps_per_set INTEGER NOT NULL,
  weight_per_rep NUMERIC(10,2) NOT NULL,
  total_weight NUMERIC(12,2) NOT NULL,
  notes TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hiit_logs table
CREATE TABLE public.hiit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  duration INTEGER NOT NULL,
  description TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tmarm_logs table
CREATE TABLE public.tmarm_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  duration INTEGER NOT NULL,
  description TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cardio_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strength_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tmarm_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profile policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies (admins can manage, users can view own)
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Cardio logs policies
CREATE POLICY "Users can view own cardio logs" ON public.cardio_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cardio logs" ON public.cardio_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cardio logs" ON public.cardio_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cardio logs" ON public.cardio_logs FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all cardio logs" ON public.cardio_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update cardio logs" ON public.cardio_logs FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Strength logs policies
CREATE POLICY "Users can view own strength logs" ON public.strength_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own strength logs" ON public.strength_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own strength logs" ON public.strength_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own strength logs" ON public.strength_logs FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all strength logs" ON public.strength_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update strength logs" ON public.strength_logs FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- HIIT logs policies
CREATE POLICY "Users can view own hiit logs" ON public.hiit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own hiit logs" ON public.hiit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own hiit logs" ON public.hiit_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own hiit logs" ON public.hiit_logs FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all hiit logs" ON public.hiit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update hiit logs" ON public.hiit_logs FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- TMARM logs policies
CREATE POLICY "Users can view own tmarm logs" ON public.tmarm_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tmarm logs" ON public.tmarm_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tmarm logs" ON public.tmarm_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tmarm logs" ON public.tmarm_logs FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all tmarm logs" ON public.tmarm_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tmarm logs" ON public.tmarm_logs FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'soldier');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== 20251203011036_e8d39521-39d6-44a9-b272-383a477623d8.sql =====
-- Create enum for unit categories
CREATE TYPE public.unit_category AS ENUM ('veterans', 'government', 'military_family', 'civilian', 'other');

-- Add unit_category column to profiles
ALTER TABLE public.profiles 
ADD COLUMN unit_category unit_category DEFAULT 'other';

-- Create index for efficient unit aggregation queries
CREATE INDEX idx_profiles_unit ON public.profiles(unit) WHERE unit IS NOT NULL;
CREATE INDEX idx_profiles_unit_category ON public.profiles(unit_category);

-- ===== 20251203011935_6acbd7e6-906d-47cf-abff-3521474e0f8d.sql =====
-- Create verification status enum
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'flagged');

-- Add admin_comment column to all log tables
ALTER TABLE public.cardio_logs ADD COLUMN admin_comment TEXT;
ALTER TABLE public.strength_logs ADD COLUMN admin_comment TEXT;
ALTER TABLE public.hiit_logs ADD COLUMN admin_comment TEXT;
ALTER TABLE public.tmarm_logs ADD COLUMN admin_comment TEXT;

-- Create audit log table for admin actions
CREATE TABLE public.admin_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id UUID NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_audit_logs_target ON public.admin_audit_logs(target_table, target_id);
CREATE INDEX idx_audit_logs_admin ON public.admin_audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created ON public.admin_audit_logs(created_at DESC);

-- ===== 20251203124730_26fb3039-e429-420e-bf08-35c90cc50ba5.sql =====
-- Add notification preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN email_notifications BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN notify_on_verified BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN notify_on_flagged BOOLEAN NOT NULL DEFAULT true;

-- Create email log table for auditing
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID NOT NULL,
  log_id UUID NOT NULL,
  log_type TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on email logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view email logs
CREATE POLICY "Admins can view email logs"
ON public.email_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert email logs (via service role)
CREATE POLICY "Service role can insert email logs"
ON public.email_logs
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_email_logs_recipient ON public.email_logs(recipient_user_id);
CREATE INDEX idx_email_logs_created ON public.email_logs(created_at DESC);

-- ===== 20251203132949_51d424a3-8a74-4b77-ae22-9954ecc664cc.sql =====
-- Add notification_mode to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_mode text NOT NULL DEFAULT 'immediate' 
CHECK (notification_mode IN ('immediate', 'digest', 'none'));

-- Create digest queue table to track status changes for daily digest
CREATE TABLE public.digest_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  log_id uuid NOT NULL,
  log_type text NOT NULL CHECK (log_type IN ('cardio', 'strength', 'hiit', 'tmarm')),
  log_date date NOT NULL,
  log_details text NOT NULL,
  previous_status text NOT NULL,
  new_status text NOT NULL,
  admin_comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.digest_queue ENABLE ROW LEVEL SECURITY;

-- Service role can manage digest queue
CREATE POLICY "Service role can manage digest queue"
ON public.digest_queue
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for efficient querying
CREATE INDEX idx_digest_queue_user_processed ON public.digest_queue(user_id, processed);
CREATE INDEX idx_digest_queue_created ON public.digest_queue(created_at);

-- ===== 20251203134246_dd367baf-12f9-4d0a-a3c5-a9d5807a0c82.sql =====
-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'verified', 'flagged', 'comment'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  log_id UUID,
  log_type TEXT, -- 'cardio', 'strength', 'hiit', 'tmarm'
  log_date DATE,
  admin_comment TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Service role can insert notifications (from edge functions)
CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Add in_app_notifications preference to profiles
ALTER TABLE public.profiles 
ADD COLUMN in_app_notifications BOOLEAN NOT NULL DEFAULT true;

-- Create index for faster queries
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- ===== 20251203134509_445a1a1a-b83f-43c6-b8b0-0109b1e0ba39.sql =====
-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ===== 20260217032350_9beafd8c-23e7-4930-a8e6-f90cc3b51077.sql =====

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

-- ===== 20260217143752_bad4ecd5-5f4d-4c76-b20a-357c5666f1b3.sql =====

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

-- ===== 20260805020246_dba78b0a-44f1-42e9-a06a-961edc684738.sql =====
CREATE TABLE public.defit_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text,
  full_name text NOT NULL,
  email text NOT NULL,
  unit_category unit_category,
  command text,
  cycle text NOT NULL DEFAULT 'DEFIT2027',
  email_reminders boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'registered',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT defit_registrations_email_cycle_unique UNIQUE (email, cycle)
);

GRANT INSERT ON public.defit_registrations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.defit_registrations TO authenticated;
GRANT ALL ON public.defit_registrations TO service_role;
ALTER TABLE public.defit_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register" ON public.defit_registrations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view registrations" ON public.defit_registrations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update registrations" ON public.defit_registrations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete registrations" ON public.defit_registrations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_defit_registrations_updated_at BEFORE UPDATE ON public.defit_registrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'milestone',
  milestone_date date,
  cycle text NOT NULL DEFAULT 'DEFIT2027',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published announcements are public" ON public.announcements FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.milestone_reminder_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id uuid NOT NULL REFERENCES public.defit_registrations(id) ON DELETE CASCADE,
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT milestone_reminder_unique UNIQUE (registration_id, announcement_id)
);

GRANT ALL ON public.milestone_reminder_log TO service_role;
ALTER TABLE public.milestone_reminder_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reminder log" ON public.milestone_reminder_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ===== 20260805024304_5d547b7f-5b1d-4945-bc4f-97c7cb1c3f87.sql =====
UPDATE public.challenge_config SET value = '2027-01-11' WHERE key = 'challenge_start_date';
UPDATE public.challenge_config SET value = '10' WHERE key = 'scoring_weeks';

-- ===== 20260806230109_8ce55f35-2ea4-43db-898a-61b9178fcf16.sql =====
DROP POLICY IF EXISTS "Anyone can count participants" ON public.user_missions;

REVOKE SELECT ON public.user_missions FROM anon;

GRANT EXECUTE ON FUNCTION public.get_mission_participant_count(uuid) TO anon, authenticated;

-- ===== 20260807001041_c9b80c68-961c-44ec-b59d-4803b7b91aec.sql =====
-- 1. Admin policies: scope strictly to authenticated role
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert audit logs" ON public.admin_audit_logs FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all cardio logs" ON public.cardio_logs;
CREATE POLICY "Admins can view all cardio logs" ON public.cardio_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update cardio logs" ON public.cardio_logs;
CREATE POLICY "Admins can update cardio logs" ON public.cardio_logs FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all hiit logs" ON public.hiit_logs;
CREATE POLICY "Admins can view all hiit logs" ON public.hiit_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update hiit logs" ON public.hiit_logs;
CREATE POLICY "Admins can update hiit logs" ON public.hiit_logs FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all strength logs" ON public.strength_logs;
CREATE POLICY "Admins can view all strength logs" ON public.strength_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update strength logs" ON public.strength_logs;
CREATE POLICY "Admins can update strength logs" ON public.strength_logs FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all tmarm logs" ON public.tmarm_logs;
CREATE POLICY "Admins can view all tmarm logs" ON public.tmarm_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update tmarm logs" ON public.tmarm_logs;
CREATE POLICY "Admins can update tmarm logs" ON public.tmarm_logs FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view email logs" ON public.email_logs;
CREATE POLICY "Admins can view email logs" ON public.email_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage missions" ON public.missions;
CREATE POLICY "Admins can manage missions" ON public.missions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can manage phases" ON public.mission_phases;
CREATE POLICY "Admins can manage phases" ON public.mission_phases FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can manage schedule" ON public.mission_schedule;
CREATE POLICY "Admins can manage schedule" ON public.mission_schedule FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can manage workouts" ON public.workouts;
CREATE POLICY "Admins can manage workouts" ON public.workouts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can manage workout steps" ON public.workout_steps;
CREATE POLICY "Admins can manage workout steps" ON public.workout_steps FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Reference/config tables: restrict reads to signed-in users
DROP POLICY IF EXISTS "Anyone can view challenge config" ON public.challenge_config;
CREATE POLICY "Authenticated users can view challenge config" ON public.challenge_config FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage challenge config" ON public.challenge_config;
CREATE POLICY "Admins can manage challenge config" ON public.challenge_config FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
REVOKE SELECT ON public.challenge_config FROM anon;

DROP POLICY IF EXISTS "Anyone can view commands" ON public.commands;
CREATE POLICY "Authenticated users can view commands" ON public.commands FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage commands" ON public.commands;
CREATE POLICY "Admins can manage commands" ON public.commands FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
REVOKE SELECT ON public.commands FROM anon;

DROP POLICY IF EXISTS "Anyone can view teams" ON public.teams;
CREATE POLICY "Authenticated users can view teams" ON public.teams FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage teams" ON public.teams;
CREATE POLICY "Admins can manage teams" ON public.teams FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
REVOKE SELECT ON public.teams FROM anon;

-- 3. team_members: own-team scoped reads for signed-in users only
DROP POLICY IF EXISTS "Anyone can view team members" ON public.team_members;
CREATE POLICY "Members can view their own team roster" ON public.team_members FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
CREATE POLICY "Admins can manage team members" ON public.team_members FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
REVOKE SELECT ON public.team_members FROM anon;

-- 4. ranking_snapshots: signed-in reads only, writes limited to backend services
DROP POLICY IF EXISTS "Anyone can view ranking snapshots" ON public.ranking_snapshots;
CREATE POLICY "Authenticated users can view ranking snapshots" ON public.ranking_snapshots FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Service role manages snapshots" ON public.ranking_snapshots;
CREATE POLICY "Service role manages snapshots" ON public.ranking_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);
REVOKE ALL ON public.ranking_snapshots FROM anon;
GRANT SELECT ON public.ranking_snapshots TO authenticated;
GRANT ALL ON public.ranking_snapshots TO service_role;

-- 5. Server-side validation for public registration inserts
CREATE OR REPLACE FUNCTION public.validate_defit_registration()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.full_name := btrim(NEW.full_name);
  NEW.email := lower(btrim(NEW.email));

  IF char_length(NEW.full_name) < 2 OR char_length(NEW.full_name) > 120 THEN
    RAISE EXCEPTION 'Full name must be between 2 and 120 characters';
  END IF;

  IF NEW.email !~ '^[A-Za-z0-9._%%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR char_length(NEW.email) > 254 THEN
    RAISE EXCEPTION 'A valid email address is required';
  END IF;

  IF NEW.command IS NOT NULL AND char_length(NEW.command) > 160 THEN
    RAISE EXCEPTION 'Command name is too long';
  END IF;

  IF NEW.cycle IS NULL OR NEW.cycle NOT IN ('DEFIT2027') THEN
    RAISE EXCEPTION 'Invalid challenge cycle';
  END IF;

  -- Never allow client-supplied privileged fields on insert
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'registered';
    NEW.user_id := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_defit_registration_trg ON public.defit_registrations;
CREATE TRIGGER validate_defit_registration_trg
BEFORE INSERT ON public.defit_registrations
FOR EACH ROW EXECUTE FUNCTION public.validate_defit_registration();

-- 6. SECURITY DEFINER helper functions must not be callable anonymously
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_mission_participant_count(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_mission_participant_count(uuid) TO authenticated, service_role;

-- ===== 20260807001103_306e59a1-345b-46df-bc0b-49947503134b.sql =====
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.validate_defit_registration() FROM anon, authenticated, PUBLIC;

-- ===== 20260807041507_a7d627f1-ab5f-4f95-b2ca-138bc770762d.sql =====
-- digest_queue: backend only
DROP POLICY IF EXISTS "Service role can manage digest queue" ON public.digest_queue;
CREATE POLICY "Service role can manage digest queue"
  ON public.digest_queue FOR ALL TO service_role
  USING (true) WITH CHECK (true);
REVOKE ALL ON public.digest_queue FROM anon, authenticated;
GRANT ALL ON public.digest_queue TO service_role;

-- notifications: only service_role may insert; users manage their own rows
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

REVOKE ALL ON public.notifications FROM anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- email_logs: only service_role may insert; admins may read
DROP POLICY IF EXISTS "Service role can insert email logs" ON public.email_logs;
CREATE POLICY "Service role can insert email logs"
  ON public.email_logs FOR INSERT TO service_role
  WITH CHECK (true);

REVOKE ALL ON public.email_logs FROM anon, authenticated;
GRANT SELECT ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;

-- ===== 20260807044637_df1b04f4-9b12-42de-8093-c0bf897fe726.sql =====
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

-- ===== 20260813222429_34ab694c-a2e0-4f73-8ee5-160d0fe05153.sql =====
-- Guard trigger: participants may never touch adjudication fields, and verified logs are locked
CREATE OR REPLACE FUNCTION public.guard_workout_log_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_privileged boolean;
BEGIN
  is_privileged := (current_setting('role', true) = 'service_role')
                   OR (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.verified := false;
    NEW.verified_by := NULL;
    NEW.verified_at := NULL;
    NEW.admin_comment := NULL;
    RETURN NEW;
  END IF;

  -- UPDATE by a non-privileged user
  IF COALESCE(OLD.verified, false) THEN
    RAISE EXCEPTION 'This log has been verified and can no longer be modified. Contact an admin for a correction.';
  END IF;

  NEW.verified := OLD.verified;
  NEW.verified_by := OLD.verified_by;
  NEW.verified_at := OLD.verified_at;
  NEW.admin_comment := OLD.admin_comment;
  NEW.user_id := OLD.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_cardio_logs_write ON public.cardio_logs;
CREATE TRIGGER guard_cardio_logs_write BEFORE INSERT OR UPDATE ON public.cardio_logs
  FOR EACH ROW EXECUTE FUNCTION public.guard_workout_log_write();

DROP TRIGGER IF EXISTS guard_strength_logs_write ON public.strength_logs;
CREATE TRIGGER guard_strength_logs_write BEFORE INSERT OR UPDATE ON public.strength_logs
  FOR EACH ROW EXECUTE FUNCTION public.guard_workout_log_write();

DROP TRIGGER IF EXISTS guard_hiit_logs_write ON public.hiit_logs;
CREATE TRIGGER guard_hiit_logs_write BEFORE INSERT OR UPDATE ON public.hiit_logs
  FOR EACH ROW EXECUTE FUNCTION public.guard_workout_log_write();

DROP TRIGGER IF EXISTS guard_tmarm_logs_write ON public.tmarm_logs;
CREATE TRIGGER guard_tmarm_logs_write BEFORE INSERT OR UPDATE ON public.tmarm_logs
  FOR EACH ROW EXECUTE FUNCTION public.guard_workout_log_write();

-- Verified logs cannot be deleted by their owner
DROP POLICY IF EXISTS "Users can delete own cardio logs" ON public.cardio_logs;
CREATE POLICY "Users can delete own unverified cardio logs" ON public.cardio_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND verified = false);

DROP POLICY IF EXISTS "Users can delete own strength logs" ON public.strength_logs;
CREATE POLICY "Users can delete own unverified strength logs" ON public.strength_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND verified = false);

DROP POLICY IF EXISTS "Users can delete own hiit logs" ON public.hiit_logs;
CREATE POLICY "Users can delete own unverified hiit logs" ON public.hiit_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND verified = false);

DROP POLICY IF EXISTS "Users can delete own tmarm logs" ON public.tmarm_logs;
CREATE POLICY "Users can delete own unverified tmarm logs" ON public.tmarm_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND verified = false);

-- Update policies: scope to authenticated and require the row still belongs to the user
DROP POLICY IF EXISTS "Users can update own cardio logs" ON public.cardio_logs;
CREATE POLICY "Users can update own cardio logs" ON public.cardio_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own strength logs" ON public.strength_logs;
CREATE POLICY "Users can update own strength logs" ON public.strength_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own hiit logs" ON public.hiit_logs;
CREATE POLICY "Users can update own hiit logs" ON public.hiit_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tmarm logs" ON public.tmarm_logs;
CREATE POLICY "Users can update own tmarm logs" ON public.tmarm_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Single source of truth for the cycle window
INSERT INTO public.challenge_config (key, value) VALUES
  ('cycle', 'DEFIT2027'),
  ('challenge_end_date', '2027-03-21'),
  ('challenge_start_date', '2027-01-11'),
  ('scoring_weeks', '10')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- ===== 20260813222445_aea74b1d-818a-4ab8-9483-63449084f1ec.sql =====
REVOKE ALL ON FUNCTION public.guard_workout_log_write() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_workout_log_write() FROM anon;
REVOKE ALL ON FUNCTION public.guard_workout_log_write() FROM authenticated;

-- ===== 20260813223008_7bfb5c18-fed2-4e93-833f-496a7d0cbac7.sql =====
-- 1) Canonical cardio distance columns
ALTER TABLE public.cardio_logs
  ADD COLUMN IF NOT EXISTS original_distance numeric,
  ADD COLUMN IF NOT EXISTS original_unit text;

-- Backfill: rows labelled 'meters' already hold miles in `distance`
UPDATE public.cardio_logs
SET original_distance = COALESCE(original_distance, round((distance / 0.000621371)::numeric, 2)),
    original_unit = COALESCE(original_unit, 'meters'),
    distance_unit = 'miles'
WHERE distance_unit = 'meters';

UPDATE public.cardio_logs
SET original_distance = COALESCE(original_distance, distance),
    original_unit = COALESCE(original_unit, 'miles')
WHERE original_unit IS NULL;

-- 2) Shared helper: is the given date inside the active challenge cycle?
CREATE OR REPLACE FUNCTION public.challenge_window()
RETURNS TABLE (start_date date, end_date date)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE((SELECT value::date FROM public.challenge_config WHERE key = 'challenge_start_date'), DATE '2027-01-11'),
    COALESCE((SELECT value::date FROM public.challenge_config WHERE key = 'challenge_end_date'), DATE '2027-03-21');
$$;

REVOKE EXECUTE ON FUNCTION public.challenge_window() FROM anon;

CREATE OR REPLACE FUNCTION public.assert_log_date_in_cycle(_date date)
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE w record;
BEGIN
  -- Admins and backend jobs may record corrections outside the window
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN;
  END IF;

  SELECT * INTO w FROM public.challenge_window();

  IF _date < w.start_date OR _date > w.end_date THEN
    RAISE EXCEPTION 'Workout date % is outside the challenge window (% to %)', _date, w.start_date, w.end_date;
  END IF;

  IF _date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Workout date cannot be in the future';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.assert_log_date_in_cycle(date) FROM anon;

-- 3) Strength: server-computed volume + bounds
CREATE OR REPLACE FUNCTION public.validate_strength_log()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.exercise_name := btrim(NEW.exercise_name);
  IF char_length(NEW.exercise_name) < 2 OR char_length(NEW.exercise_name) > 120 THEN
    RAISE EXCEPTION 'Exercise name must be between 2 and 120 characters';
  END IF;

  IF NEW.sets IS NULL OR NEW.sets < 1 OR NEW.sets > 50 THEN
    RAISE EXCEPTION 'Sets must be between 1 and 50';
  END IF;

  IF NEW.reps_per_set IS NULL OR NEW.reps_per_set < 1 OR NEW.reps_per_set > 500 THEN
    RAISE EXCEPTION 'Reps per set must be between 1 and 500';
  END IF;

  IF NEW.weight_per_rep IS NULL OR NEW.weight_per_rep < 0 OR NEW.weight_per_rep > 2000 THEN
    RAISE EXCEPTION 'Weight per rep must be between 0 and 2000 lbs';
  END IF;

  -- Server is authoritative for competitive volume; client value is ignored
  NEW.total_weight := (NEW.sets::numeric * NEW.reps_per_set::numeric * NEW.weight_per_rep::numeric);

  PERFORM public.assert_log_date_in_cycle(NEW.date);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_strength_log_trg ON public.strength_logs;
CREATE TRIGGER validate_strength_log_trg
BEFORE INSERT OR UPDATE ON public.strength_logs
FOR EACH ROW EXECUTE FUNCTION public.validate_strength_log();

-- Backfill any drifted historical volumes
UPDATE public.strength_logs
SET total_weight = (sets::numeric * reps_per_set::numeric * weight_per_rep::numeric)
WHERE total_weight <> (sets::numeric * reps_per_set::numeric * weight_per_rep::numeric);

-- 4) Cardio: canonicalize to miles + bounds
CREATE OR REPLACE FUNCTION public.validate_cardio_log()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE unit text;
BEGIN
  unit := lower(COALESCE(NEW.original_unit, NEW.distance_unit, 'miles'));
  IF unit NOT IN ('miles', 'meters') THEN
    RAISE EXCEPTION 'Distance unit must be miles or meters';
  END IF;

  IF NEW.original_distance IS NULL THEN
    -- Legacy/unspecified callers: treat `distance` as already-canonical miles
    NEW.original_distance := NEW.distance;
    unit := 'miles';
  END IF;

  IF NEW.original_distance <= 0 THEN
    RAISE EXCEPTION 'Distance must be greater than zero';
  END IF;

  IF unit = 'meters' THEN
    IF NEW.original_distance > 200000 THEN
      RAISE EXCEPTION 'Distance is unrealistically large';
    END IF;
    NEW.distance := round((NEW.original_distance * 0.000621371)::numeric, 4);
  ELSE
    IF NEW.original_distance > 200 THEN
      RAISE EXCEPTION 'Distance is unrealistically large';
    END IF;
    NEW.distance := round(NEW.original_distance::numeric, 4);
  END IF;

  NEW.original_unit := unit;
  NEW.distance_unit := 'miles';

  PERFORM public.assert_log_date_in_cycle(NEW.date);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_cardio_log_trg ON public.cardio_logs;
CREATE TRIGGER validate_cardio_log_trg
BEFORE INSERT OR UPDATE ON public.cardio_logs
FOR EACH ROW EXECUTE FUNCTION public.validate_cardio_log();

-- 5) HIIT / TMAR-M: minute bounds + cycle window
CREATE OR REPLACE FUNCTION public.validate_minutes_log()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.duration IS NULL OR NEW.duration < 1 OR NEW.duration > 600 THEN
    RAISE EXCEPTION 'Duration must be between 1 and 600 minutes';
  END IF;

  PERFORM public.assert_log_date_in_cycle(NEW.date);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_hiit_log_trg ON public.hiit_logs;
CREATE TRIGGER validate_hiit_log_trg
BEFORE INSERT OR UPDATE ON public.hiit_logs
FOR EACH ROW EXECUTE FUNCTION public.validate_minutes_log();

DROP TRIGGER IF EXISTS validate_tmarm_log_trg ON public.tmarm_logs;
CREATE TRIGGER validate_tmarm_log_trg
BEFORE INSERT OR UPDATE ON public.tmarm_logs
FOR EACH ROW EXECUTE FUNCTION public.validate_minutes_log();

-- ===== 20260813223035_21c6f908-968e-4ce6-998c-f3affeab8226.sql =====
-- Trigger functions run as owner so the helpers no longer need to be callable by users
CREATE OR REPLACE FUNCTION public.validate_strength_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.exercise_name := btrim(NEW.exercise_name);
  IF char_length(NEW.exercise_name) < 2 OR char_length(NEW.exercise_name) > 120 THEN
    RAISE EXCEPTION 'Exercise name must be between 2 and 120 characters';
  END IF;

  IF NEW.sets IS NULL OR NEW.sets < 1 OR NEW.sets > 50 THEN
    RAISE EXCEPTION 'Sets must be between 1 and 50';
  END IF;

  IF NEW.reps_per_set IS NULL OR NEW.reps_per_set < 1 OR NEW.reps_per_set > 500 THEN
    RAISE EXCEPTION 'Reps per set must be between 1 and 500';
  END IF;

  IF NEW.weight_per_rep IS NULL OR NEW.weight_per_rep < 0 OR NEW.weight_per_rep > 2000 THEN
    RAISE EXCEPTION 'Weight per rep must be between 0 and 2000 lbs';
  END IF;

  NEW.total_weight := (NEW.sets::numeric * NEW.reps_per_set::numeric * NEW.weight_per_rep::numeric);

  PERFORM public.assert_log_date_in_cycle(NEW.date);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_cardio_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE unit text;
BEGIN
  unit := lower(COALESCE(NEW.original_unit, NEW.distance_unit, 'miles'));
  IF unit NOT IN ('miles', 'meters') THEN
    RAISE EXCEPTION 'Distance unit must be miles or meters';
  END IF;

  IF NEW.original_distance IS NULL THEN
    NEW.original_distance := NEW.distance;
    unit := 'miles';
  END IF;

  IF NEW.original_distance <= 0 THEN
    RAISE EXCEPTION 'Distance must be greater than zero';
  END IF;

  IF unit = 'meters' THEN
    IF NEW.original_distance > 200000 THEN
      RAISE EXCEPTION 'Distance is unrealistically large';
    END IF;
    NEW.distance := round((NEW.original_distance * 0.000621371)::numeric, 4);
  ELSE
    IF NEW.original_distance > 200 THEN
      RAISE EXCEPTION 'Distance is unrealistically large';
    END IF;
    NEW.distance := round(NEW.original_distance::numeric, 4);
  END IF;

  NEW.original_unit := unit;
  NEW.distance_unit := 'miles';

  PERFORM public.assert_log_date_in_cycle(NEW.date);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_minutes_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.duration IS NULL OR NEW.duration < 1 OR NEW.duration > 600 THEN
    RAISE EXCEPTION 'Duration must be between 1 and 600 minutes';
  END IF;

  PERFORM public.assert_log_date_in_cycle(NEW.date);
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.challenge_window() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assert_log_date_in_cycle(date) FROM anon, authenticated;

-- ===== 20260813223047_f11fab7d-4215-4ce1-a401-dc993bcb4fdd.sql =====
REVOKE EXECUTE ON FUNCTION public.validate_strength_log() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_cardio_log() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_minutes_log() FROM anon, authenticated;

-- ===== 20260813223102_af918180-154d-4920-b291-9b156745dc87.sql =====
REVOKE EXECUTE ON FUNCTION public.challenge_window() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.assert_log_date_in_cycle(date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_strength_log() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_cardio_log() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_minutes_log() FROM PUBLIC;

-- ===== 20260814125921_a952ddf1-e418-4c97-bd43-50cce46df114.sql =====
-- Second Monday of January for a given year
CREATE OR REPLACE FUNCTION public.defit_cycle_start(_year integer)
RETURNS date
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT make_date(_year, 1, 1)
         + ((8 - EXTRACT(ISODOW FROM make_date(_year, 1, 1))::int) % 7)
         + 7;
$$;

-- Active cycle window: this year's while it is still running, otherwise next year's.
-- Optional overrides in challenge_config still win when present.
CREATE OR REPLACE FUNCTION public.challenge_window()
RETURNS TABLE(start_date date, end_date date)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  y integer := EXTRACT(YEAR FROM CURRENT_DATE)::int;
  s date;
  e date;
  cfg_s date := (SELECT value::date FROM public.challenge_config WHERE key = 'challenge_start_date');
  cfg_e date := (SELECT value::date FROM public.challenge_config WHERE key = 'challenge_end_date');
BEGIN
  s := public.defit_cycle_start(y);
  e := s + 69;

  IF CURRENT_DATE > e THEN
    s := public.defit_cycle_start(y + 1);
    e := s + 69;
  END IF;

  -- Honour explicit overrides only while they describe the active or upcoming cycle
  IF cfg_s IS NOT NULL AND cfg_e IS NOT NULL AND cfg_e >= CURRENT_DATE THEN
    s := cfg_s;
    e := cfg_e;
  END IF;

  RETURN QUERY SELECT s, e;
END;
$$;

-- Logging is open 365 days a year; off-cycle activity simply does not score.
CREATE OR REPLACE FUNCTION public.assert_log_date_in_cycle(_date date)
RETURNS void
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN;
  END IF;

  IF _date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Workout date cannot be in the future';
  END IF;

  IF _date < DATE '2020-01-01' THEN
    RAISE EXCEPTION 'Workout date is unrealistically far in the past';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.defit_cycle_start(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.assert_log_date_in_cycle(date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.challenge_window() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.challenge_window() TO authenticated, service_role;

-- Registration accepts the current or upcoming DEFIT year
CREATE OR REPLACE FUNCTION public.validate_defit_registration()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  y integer := EXTRACT(YEAR FROM CURRENT_DATE)::int;
BEGIN
  NEW.full_name := btrim(NEW.full_name);
  NEW.email := lower(btrim(NEW.email));

  IF char_length(NEW.full_name) < 2 OR char_length(NEW.full_name) > 120 THEN
    RAISE EXCEPTION 'Full name must be between 2 and 120 characters';
  END IF;

  IF NEW.email !~ '^[A-Za-z0-9._%%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR char_length(NEW.email) > 254 THEN
    RAISE EXCEPTION 'A valid email address is required';
  END IF;

  IF NEW.command IS NOT NULL AND char_length(NEW.command) > 160 THEN
    RAISE EXCEPTION 'Command name is too long';
  END IF;

  IF NEW.cycle IS NULL
     OR NEW.cycle !~ '^DEFIT[0-9]{4}$'
     OR substring(NEW.cycle from 6)::int NOT IN (y, y + 1) THEN
    RAISE EXCEPTION 'Invalid challenge cycle';
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'registered';
    NEW.user_id := NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- ===== 20260814202146_d9852151-4e21-4a2a-a0ab-4856a0f0a416.sql =====
-- 1. Challenge state enum
DO $$ BEGIN
  CREATE TYPE public.challenge_state AS ENUM ('off_season', 'registration', 'active', 'complete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. challenge_cycles: one row per annual DEFIT Challenge
CREATE TABLE IF NOT EXISTS public.challenge_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  year integer NOT NULL UNIQUE,
  registration_open date NOT NULL,
  registration_close date NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  scoring_weeks integer NOT NULL DEFAULT 10,
  status_override public.challenge_state,
  rules_version text NOT NULL DEFAULT 'v1',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.challenge_cycles TO anon;
GRANT SELECT ON public.challenge_cycles TO authenticated;
GRANT ALL ON public.challenge_cycles TO service_role;

ALTER TABLE public.challenge_cycles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published challenge cycles are readable by everyone" ON public.challenge_cycles;
CREATE POLICY "Published challenge cycles are readable by everyone"
ON public.challenge_cycles FOR SELECT
USING (is_published OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage challenge cycles" ON public.challenge_cycles;
CREATE POLICY "Admins manage challenge cycles"
ON public.challenge_cycles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_challenge_cycles_updated_at ON public.challenge_cycles;
CREATE TRIGGER update_challenge_cycles_updated_at
BEFORE UPDATE ON public.challenge_cycles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sanity: dates must be ordered
CREATE OR REPLACE FUNCTION public.validate_challenge_cycle()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.start_date > NEW.end_date THEN
    RAISE EXCEPTION 'Challenge start date must be on or before the end date';
  END IF;
  IF NEW.registration_open > NEW.registration_close THEN
    RAISE EXCEPTION 'Registration open date must be on or before the registration close date';
  END IF;
  IF NEW.scoring_weeks < 1 OR NEW.scoring_weeks > 52 THEN
    RAISE EXCEPTION 'Scoring weeks must be between 1 and 52';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_challenge_cycle_trg ON public.challenge_cycles;
CREATE TRIGGER validate_challenge_cycle_trg
BEFORE INSERT OR UPDATE ON public.challenge_cycles
FOR EACH ROW EXECUTE FUNCTION public.validate_challenge_cycle();

-- 3. Seed DEFIT 2027 from the existing configuration
INSERT INTO public.challenge_cycles (code, name, year, registration_open, registration_close, start_date, end_date, scoring_weeks)
SELECT
  'DEFIT2027',
  'DEFIT 2027 Challenge',
  2027,
  DATE '2026-11-01',
  COALESCE((SELECT value::date FROM public.challenge_config WHERE key = 'challenge_start_date'), DATE '2027-01-11'),
  COALESCE((SELECT value::date FROM public.challenge_config WHERE key = 'challenge_start_date'), DATE '2027-01-11'),
  COALESCE((SELECT value::date FROM public.challenge_config WHERE key = 'challenge_end_date'), DATE '2027-03-21'),
  10
WHERE NOT EXISTS (SELECT 1 FROM public.challenge_cycles WHERE year = 2027);

-- 4. State + selection helpers
CREATE OR REPLACE FUNCTION public.challenge_cycle_state(_cycle public.challenge_cycles)
RETURNS public.challenge_state
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    _cycle.status_override,
    CASE
      WHEN CURRENT_DATE > _cycle.end_date THEN 'complete'::public.challenge_state
      WHEN CURRENT_DATE >= _cycle.start_date THEN 'active'::public.challenge_state
      WHEN CURRENT_DATE >= _cycle.registration_open AND CURRENT_DATE <= _cycle.registration_close
        THEN 'registration'::public.challenge_state
      ELSE 'off_season'::public.challenge_state
    END
  );
$$;

-- Current cycle: the live one, else the next upcoming, else the most recent
CREATE OR REPLACE FUNCTION public.active_challenge_cycle()
RETURNS public.challenge_cycles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.* FROM public.challenge_cycles c
  WHERE c.is_published
  ORDER BY
    CASE
      WHEN CURRENT_DATE BETWEEN c.start_date AND c.end_date THEN 0
      WHEN CURRENT_DATE < c.start_date THEN 1
      ELSE 2
    END,
    CASE WHEN CURRENT_DATE < c.start_date THEN c.start_date END ASC NULLS LAST,
    c.end_date DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_challenge_state()
RETURNS public.challenge_state
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.challenge_cycle_state((SELECT public.active_challenge_cycle())), 'off_season'::public.challenge_state);
$$;

REVOKE EXECUTE ON FUNCTION public.active_challenge_cycle() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_challenge_state() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.active_challenge_cycle() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_challenge_state() TO anon, authenticated, service_role;

-- 5. challenge_window() now reads the cycle table (keeps existing callers working)
CREATE OR REPLACE FUNCTION public.challenge_window()
RETURNS TABLE(start_date date, end_date date)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(
      (SELECT c.start_date FROM public.challenge_cycles c WHERE c.id = (SELECT (public.active_challenge_cycle()).id)),
      (SELECT value::date FROM public.challenge_config WHERE key = 'challenge_start_date'),
      DATE '2027-01-11'
    ),
    COALESCE(
      (SELECT c.end_date FROM public.challenge_cycles c WHERE c.id = (SELECT (public.active_challenge_cycle()).id)),
      (SELECT value::date FROM public.challenge_config WHERE key = 'challenge_end_date'),
      DATE '2027-03-21'
    );
$$;

-- 6. challenge_enrollments
CREATE TABLE IF NOT EXISTS public.challenge_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_cycle_id uuid NOT NULL REFERENCES public.challenge_cycles(id) ON DELETE CASCADE,
  user_id uuid,
  full_name text NOT NULL,
  email text NOT NULL,
  unit_category public.unit_category,
  command text,
  email_reminders boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'registered',
  source text NOT NULL DEFAULT 'web',
  legacy_registration_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS challenge_enrollments_cycle_email_key
  ON public.challenge_enrollments (challenge_cycle_id, lower(email));

GRANT SELECT, INSERT, UPDATE ON public.challenge_enrollments TO authenticated;
GRANT ALL ON public.challenge_enrollments TO service_role;

ALTER TABLE public.challenge_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants view their own enrollment" ON public.challenge_enrollments;
CREATE POLICY "Participants view their own enrollment"
ON public.challenge_enrollments FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Participants create their own enrollment" ON public.challenge_enrollments;
CREATE POLICY "Participants create their own enrollment"
ON public.challenge_enrollments FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Participants update their own enrollment" ON public.challenge_enrollments;
CREATE POLICY "Participants update their own enrollment"
ON public.challenge_enrollments FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage all enrollments" ON public.challenge_enrollments;
CREATE POLICY "Admins manage all enrollments"
ON public.challenge_enrollments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_challenge_enrollments_updated_at ON public.challenge_enrollments;
CREATE TRIGGER update_challenge_enrollments_updated_at
BEFORE UPDATE ON public.challenge_enrollments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Guard privileged fields on participant writes
CREATE OR REPLACE FUNCTION public.guard_challenge_enrollment_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE is_privileged boolean;
BEGIN
  NEW.full_name := btrim(NEW.full_name);
  NEW.email := lower(btrim(NEW.email));

  IF char_length(NEW.full_name) < 2 OR char_length(NEW.full_name) > 120 THEN
    RAISE EXCEPTION 'Full name must be between 2 and 120 characters';
  END IF;
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR char_length(NEW.email) > 254 THEN
    RAISE EXCEPTION 'A valid email address is required';
  END IF;

  is_privileged := (current_setting('role', true) = 'service_role')
                   OR (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'registered';
  ELSE
    NEW.status := OLD.status;
    NEW.user_id := OLD.user_id;
    NEW.challenge_cycle_id := OLD.challenge_cycle_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_challenge_enrollment_write_trg ON public.challenge_enrollments;
CREATE TRIGGER guard_challenge_enrollment_write_trg
BEFORE INSERT OR UPDATE ON public.challenge_enrollments
FOR EACH ROW EXECUTE FUNCTION public.guard_challenge_enrollment_write();

-- 7. Backfill existing registrations
INSERT INTO public.challenge_enrollments (
  challenge_cycle_id, user_id, full_name, email, unit_category, command,
  email_reminders, status, source, legacy_registration_id, created_at, updated_at
)
SELECT
  c.id,
  CASE WHEN r.user_id ~ '^[0-9a-fA-F-]{36}$' THEN r.user_id::uuid ELSE NULL END,
  r.full_name,
  lower(btrim(r.email)),
  r.unit_category,
  r.command,
  r.email_reminders,
  r.status,
  'legacy_registration',
  r.id,
  r.created_at,
  r.updated_at
FROM public.defit_registrations r
JOIN public.challenge_cycles c ON c.code = r.cycle
WHERE NOT EXISTS (
  SELECT 1 FROM public.challenge_enrollments e WHERE e.legacy_registration_id = r.id
)
ON CONFLICT DO NOTHING;

