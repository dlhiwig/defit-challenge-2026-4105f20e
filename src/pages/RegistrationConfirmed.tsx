import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, CheckCircle2, ClipboardList, LayoutDashboard } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { CHALLENGE_DATE_RANGE, CHALLENGE_LABEL, CHALLENGE_WEEKS } from '@/lib/challenge';

interface StoredRegistration {
  fullName?: string;
  email?: string;
  emailReminders?: boolean;
}

export default function RegistrationConfirmed() {
  const stored = useMemo<StoredRegistration>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('defit_registration') || '{}');
    } catch {
      return {};
    }
  }, []);

  useEffect(() => {
    document.title = `Registration Confirmed | ${CHALLENGE_LABEL}`;
  }, []);

  const firstName = stored.fullName?.split(' ')[0];

  return (
    <main className="min-h-screen bg-background texture-canvas">
      <Navbar />

      <section className="pt-28 pb-16">
        <div className="container px-4 max-w-2xl mx-auto">
          <div className="glass rounded-2xl p-8 md:p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>

            <h1 className="text-3xl md:text-4xl font-heading font-bold">
              You're in{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="text-muted-foreground mt-3">
              Your {CHALLENGE_LABEL} registration is confirmed for the {CHALLENGE_WEEKS}-week cycle,{' '}
              {CHALLENGE_DATE_RANGE}.
              {stored.email ? ` Confirmation details are tied to ${stored.email}.` : ''}
            </p>

            <div className="mt-8 text-left space-y-4">
              <div className="flex gap-3 p-4 rounded-xl bg-secondary/40">
                <ClipboardList className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-heading font-bold uppercase tracking-wide text-sm">Next: log your work</h2>
                  <p className="text-sm text-muted-foreground">
                    Track cardio miles, strength volume, HIIT minutes and TMAR-M minutes. Logs stay
                    Pending until a USARC admin verifies them.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-4 rounded-xl bg-secondary/40">
                <BellRing className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-heading font-bold uppercase tracking-wide text-sm">Milestone reminders</h2>
                  <p className="text-sm text-muted-foreground">
                    {stored.emailReminders === false
                      ? 'Email reminders are off. You can turn them on any time in Profile settings.'
                      : 'You\u2019ll get emails ahead of kickoff, mid-cycle checkpoints and the final logging deadline.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="hero" asChild>
                <Link to="/dashboard/progress">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Open progress tracker
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/rules">Read the rules</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
