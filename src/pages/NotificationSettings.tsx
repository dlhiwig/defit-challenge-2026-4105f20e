import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Loader2, Mail, Save, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CHALLENGE_LABEL } from '@/lib/challenge';

interface Prefs {
  in_app_notifications: boolean;
  email_notifications: boolean;
  notify_weekly_summary: boolean;
  notify_ai_feedback: boolean;
  notify_on_verified: boolean;
  notify_on_flagged: boolean;
}

const DEFAULTS: Prefs = {
  in_app_notifications: true,
  email_notifications: true,
  notify_weekly_summary: true,
  notify_ai_feedback: true,
  notify_on_verified: true,
  notify_on_flagged: true,
};

interface RowProps {
  id: keyof Prefs;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({ id, title, description, checked, onChange }: RowProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-secondary/40 p-4">
      <div>
        <Label htmlFor={id} className="font-heading uppercase tracking-wide text-sm">
          {title}
        </Label>
        <p className="text-xs text-muted-foreground mt-1 max-w-md">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export default function NotificationSettings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    document.title = `Notification Settings | ${CHALLENGE_LABEL}`;
  }, []);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'in_app_notifications, email_notifications, notify_weekly_summary, notify_ai_feedback, notify_on_verified, notify_on_flagged',
        )
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Failed to load notification settings', error);
        toast.error('Could not load your notification settings');
      } else if (data) {
        const row = data as Partial<Prefs>;
        setPrefs({
          in_app_notifications: row.in_app_notifications ?? true,
          email_notifications: row.email_notifications ?? true,
          notify_weekly_summary: row.notify_weekly_summary ?? true,
          notify_ai_feedback: row.notify_ai_feedback ?? true,
          notify_on_verified: row.notify_on_verified ?? true,
          notify_on_flagged: row.notify_on_flagged ?? true,
        });
      }
      setLoading(false);
    }
    if (user) load();
  }, [user]);

  const set = (key: keyof Prefs) => (value: boolean) =>
    setPrefs((prev) => ({ ...prev, [key]: value }));

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update(prefs).eq('user_id', user.id);
    setSaving(false);
    if (error) {
      console.error('Failed to save notification settings', error);
      toast.error('Could not save your notification settings');
      return;
    }
    toast.success('Notification settings saved');
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-background texture-canvas flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-background texture-canvas">
      <Navbar />

      <section className="pt-24 pb-8">
        <div className="container px-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl md:text-4xl font-heading font-bold">
            Notification <span className="text-gradient">Settings</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Choose how you hear about AI weekly summaries, AI workout feedback, and verification
            updates during {CHALLENGE_LABEL}.
          </p>
        </div>
      </section>

      <section className="pb-16">
        <div className="container px-4">
          <div className="max-w-2xl space-y-6">
            <div className="glass rounded-2xl p-6 md:p-8 space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-heading font-bold">Channels</h2>
              </div>
              <ToggleRow
                id="in_app_notifications"
                title="In-app notifications"
                description="Show updates in the notification bell and your dashboard."
                checked={prefs.in_app_notifications}
                onChange={set('in_app_notifications')}
              />
              <ToggleRow
                id="email_notifications"
                title="Email notifications"
                description="Send the same updates to the email on your account."
                checked={prefs.email_notifications}
                onChange={set('email_notifications')}
              />
            </div>

            <div className="glass rounded-2xl p-6 md:p-8 space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-heading font-bold">AI updates</h2>
              </div>
              <ToggleRow
                id="notify_weekly_summary"
                title="AI weekly summary"
                description="A Monday recap of your logged sessions, wins, and focus for the week ahead."
                checked={prefs.notify_weekly_summary}
                onChange={set('notify_weekly_summary')}
              />
              <ToggleRow
                id="notify_ai_feedback"
                title="AI workout feedback"
                description="Coaching feedback and next steps generated from your recent HIIT, TMAR-M, cardio, and strength logs."
                checked={prefs.notify_ai_feedback}
                onChange={set('notify_ai_feedback')}
              />
            </div>

            <div className="glass rounded-2xl p-6 md:p-8 space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-heading font-bold">Verification updates</h2>
              </div>
              <ToggleRow
                id="notify_on_verified"
                title="Log verified"
                description="Tell me when a USARC admin verifies one of my logs."
                checked={prefs.notify_on_verified}
                onChange={set('notify_on_verified')}
              />
              <ToggleRow
                id="notify_on_flagged"
                title="Log flagged"
                description="Tell me when a log is flagged and needs my attention."
                checked={prefs.notify_on_flagged}
                onChange={set('notify_on_flagged')}
              />
            </div>

            <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save settings
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
