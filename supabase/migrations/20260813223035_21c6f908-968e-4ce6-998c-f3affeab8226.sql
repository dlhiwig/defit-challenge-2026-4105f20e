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