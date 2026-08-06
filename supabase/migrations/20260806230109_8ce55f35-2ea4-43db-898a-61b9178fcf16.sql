DROP POLICY IF EXISTS "Anyone can count participants" ON public.user_missions;

REVOKE SELECT ON public.user_missions FROM anon;

GRANT EXECUTE ON FUNCTION public.get_mission_participant_count(uuid) TO anon, authenticated;