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