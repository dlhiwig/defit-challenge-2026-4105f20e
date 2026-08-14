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