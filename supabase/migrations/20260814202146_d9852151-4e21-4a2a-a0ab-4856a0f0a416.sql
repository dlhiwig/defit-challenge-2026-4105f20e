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