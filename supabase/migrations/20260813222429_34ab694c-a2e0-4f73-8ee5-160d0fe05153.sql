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