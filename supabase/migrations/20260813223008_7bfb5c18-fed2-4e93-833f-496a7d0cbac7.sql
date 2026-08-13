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