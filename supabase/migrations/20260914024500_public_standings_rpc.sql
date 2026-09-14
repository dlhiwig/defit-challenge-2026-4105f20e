-- Public standings RPCs so the site works before Edge Functions are deployed.
-- Service-role edge functions remain the preferred path; these are the fallback.
-- Never expose private.legacy_participants (2,340 emails) through the Data API.

GRANT SELECT ON public.missions TO anon, authenticated;
GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT SELECT ON public.challenge_cycles TO anon, authenticated;
GRANT SELECT ON public.workouts TO anon, authenticated;
GRANT SELECT ON public.workout_steps TO anon, authenticated;
GRANT SELECT ON public.mission_phases TO anon, authenticated;
GRANT SELECT ON public.mission_schedule TO anon, authenticated;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE OR REPLACE VIEW public.leaderboard_public AS
SELECT
  p.user_id,
  coalesce(nullif(btrim(p.full_name), ''), 'Anonymous Soldier') AS display_name,
  p.unit
FROM public.profiles p;

REVOKE ALL ON public.leaderboard_public FROM PUBLIC;
GRANT SELECT ON public.leaderboard_public TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_leaderboard(adjudication text DEFAULT 'provisional')
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  verified_only boolean := lower(coalesce(adjudication, 'provisional')) = 'official';
  payload jsonb;
BEGIN
  WITH cardio AS (
    SELECT user_id, sum(distance)::numeric AS miles
    FROM public.cardio_logs
    WHERE (NOT verified_only OR verified)
    GROUP BY user_id
  ),
  strength AS (
    SELECT user_id, sum(total_weight)::numeric AS lbs
    FROM public.strength_logs
    WHERE (NOT verified_only OR verified)
    GROUP BY user_id
  ),
  hiit AS (
    SELECT user_id, sum(duration)::numeric AS minutes
    FROM public.hiit_logs
    WHERE (NOT verified_only OR verified)
    GROUP BY user_id
  ),
  tmarm AS (
    SELECT user_id, sum(duration)::numeric AS minutes
    FROM public.tmarm_logs
    WHERE (NOT verified_only OR verified)
    GROUP BY user_id
  ),
  stats AS (
    SELECT
      p.user_id,
      coalesce(nullif(btrim(p.full_name), ''), 'Anonymous Soldier') AS name,
      p.unit,
      coalesce(c.miles, 0) AS cardio_miles,
      coalesce(s.lbs, 0) AS strength_lbs,
      coalesce(h.minutes, 0) AS hiit_minutes,
      coalesce(t.minutes, 0) AS tmarm_minutes,
      least(100, (coalesce(c.miles, 0) / 120.0) * 100) AS cardio_completion,
      least(100, (coalesce(s.lbs, 0) / 50000.0) * 100) AS strength_completion,
      least(100, (coalesce(h.minutes, 0) / 480.0) * 100) AS hiit_completion,
      least(100, (coalesce(t.minutes, 0) / 480.0) * 100) AS tmarm_completion
    FROM public.profiles p
    LEFT JOIN cardio c ON c.user_id = p.user_id
    LEFT JOIN strength s ON s.user_id = p.user_id
    LEFT JOIN hiit h ON h.user_id = p.user_id
    LEFT JOIN tmarm t ON t.user_id = p.user_id
  ),
  scored AS (
    SELECT
      *,
      (cardio_completion * 0.30)
        + (strength_completion * 0.30)
        + (hiit_completion * 0.20)
        + (tmarm_completion * 0.20) AS overall_completion
    FROM stats
    WHERE cardio_miles > 0 OR strength_lbs > 0 OR hiit_minutes > 0 OR tmarm_minutes > 0
  ),
  ranked AS (
    SELECT
      dense_rank() OVER (ORDER BY overall_completion DESC) AS rank,
      user_id AS "userId",
      name,
      unit,
      cardio_miles AS "cardioMiles",
      strength_lbs AS "strengthLbs",
      hiit_minutes AS "hiitMinutes",
      tmarm_minutes AS "tmarmMinutes",
      cardio_completion AS "cardioCompletion",
      strength_completion AS "strengthCompletion",
      hiit_completion AS "hiitCompletion",
      tmarm_completion AS "tmarmCompletion",
      overall_completion AS "overallCompletion"
    FROM scored
  )
  SELECT jsonb_build_object(
    'data', coalesce((SELECT jsonb_agg(to_jsonb(ranked) ORDER BY rank) FROM ranked), '[]'::jsonb),
    'challengeMinimums', jsonb_build_object(
      'cardioMiles', 120, 'strengthLbs', 50000, 'hiitMinutes', 480, 'tmarmMinutes', 480
    ),
    'completionWeights', jsonb_build_object(
      'cardio', 0.30, 'strength', 0.30, 'hiit', 0.20, 'tmarm', 0.20
    ),
    'totalParticipants', (SELECT count(*) FROM ranked),
    'adjudication', CASE WHEN verified_only THEN 'official' ELSE 'provisional' END,
    'generatedAt', now()
  ) INTO payload;

  RETURN payload;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_rankings(
  level text DEFAULT 'individual',
  dataset text DEFAULT 'cycle',
  adjudication text DEFAULT 'provisional',
  "limit" integer DEFAULT 50,
  search text DEFAULT '',
  findme text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb;
  ranked jsonb;
  total_count integer;
  q text := lower(btrim(coalesce(search, '')));
  found jsonb;
  win record;
BEGIN
  SELECT * INTO win FROM public.challenge_window();

  WITH board AS (
    SELECT * FROM jsonb_to_recordset(public.get_leaderboard(adjudication)->'data') AS x(
      rank int,
      "userId" uuid,
      name text,
      unit text,
      "cardioMiles" numeric,
      "strengthLbs" numeric,
      "hiitMinutes" numeric,
      "tmarmMinutes" numeric,
      "cardioCompletion" numeric,
      "strengthCompletion" numeric,
      "hiitCompletion" numeric,
      "tmarmCompletion" numeric,
      "overallCompletion" numeric
    )
  ),
  entries AS (
    SELECT jsonb_build_object(
      'entityId', "userId",
      'entityName', name,
      'componentA', rank,
      'componentB', rank,
      'componentC', rank,
      'componentD', rank,
      'componentE', rank,
      'componentF', null,
      'totalScore', round((100 - "overallCompletion")::numeric, 2),
      'finalRank', rank,
      'rawValues', jsonb_build_object(
        'cardio', "cardioMiles",
        'strength', "strengthLbs",
        'hiit', "hiitMinutes",
        'tmarm', "tmarmMinutes",
        'eRaw', 0,
        'completionPct', "overallCompletion"
      ),
      'metadata', jsonb_build_object('unit', unit)
    ) AS entry,
      name,
      "userId"::text AS uid,
      rank
    FROM board
    WHERE coalesce(level, 'individual') = 'individual'
  ),
  filtered AS (
    SELECT * FROM entries
    WHERE q = '' OR lower(name) LIKE '%' || q || '%'
  )
  SELECT
    coalesce(jsonb_agg(entry ORDER BY rank), '[]'::jsonb),
    (SELECT count(*) FROM entries),
    (SELECT entry FROM entries WHERE findme <> '' AND uid = findme LIMIT 1)
  INTO ranked, total_count, found
  FROM (SELECT * FROM filtered ORDER BY rank LIMIT greatest(coalesce("limit", 50), 1)) slice;

  payload := jsonb_build_object(
    'level', coalesce(level, 'individual'),
    'dataset', coalesce(dataset, 'cycle'),
    'adjudication', coalesce(adjudication, 'provisional'),
    'data', coalesce(ranked, '[]'::jsonb),
    'total', coalesce(total_count, 0),
    'searchTotal', CASE WHEN q <> '' THEN jsonb_array_length(coalesce(ranked, '[]'::jsonb)) END,
    'foundMe', found,
    'datasetStart', win.start_date,
    'datasetEnd', win.end_date
  );
  RETURN payload;
END;
$$;

REVOKE ALL ON FUNCTION public.get_leaderboard(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_rankings(text, text, text, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_rankings(text, text, text, integer, text, text) TO anon, authenticated, service_role;
