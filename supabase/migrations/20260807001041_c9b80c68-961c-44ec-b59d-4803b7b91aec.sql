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