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