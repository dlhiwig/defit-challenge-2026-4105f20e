import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Flame,
  Heart,
  Loader2,
  Target,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HIITForm } from '@/components/dashboard/HIITForm';
import { TMARMForm } from '@/components/dashboard/TMARMForm';
import { AnnouncementsSection } from '@/components/AnnouncementsSection';
import { AICoachFeedback } from '@/components/ai/AICoachFeedback';
import { WorkoutProvider, useWorkout } from '@/contexts/WorkoutContext';
import { useAuth } from '@/contexts/AuthContext';
import { CHALLENGE_MINIMUMS, HIITLog, TMARMLog } from '@/types/workout';
import {
  CHALLENGE_DATE_RANGE,
  CHALLENGE_LABEL,
  CHALLENGE_WEEKS,
  currentWeek,
  cycleStatus,
  requiredPacePerWeek,
  weeksRemaining,
} from '@/lib/challenge';

type MinuteLog = HIITLog | TMARMLog;

interface PillarProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  logs: MinuteLog[];
  minimum: number;
}

function PillarCard({ title, subtitle, icon: Icon, logs, minimum }: PillarProps) {
  const total = logs.reduce((sum, log) => sum + log.duration, 0);
  const verified = logs.filter((l) => l.verified).reduce((sum, log) => sum + log.duration, 0);
  const pending = total - verified;
  const percentage = Math.min((total / minimum) * 100, 100);
  const remaining = Math.max(minimum - total, 0);
  const pace = requiredPacePerWeek(total, minimum);
  const isComplete = total >= minimum;

  return (
    <div className={`glass rounded-2xl p-6 ${isComplete ? 'border-primary/50' : ''}`}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-heading font-bold uppercase tracking-wide">{title}</h2>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {isComplete ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/20 text-xs text-primary font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Minimum met
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-xs text-muted-foreground font-medium">
            <Target className="w-3.5 h-3.5" />
            {remaining} min to go
          </span>
        )}
      </div>

      <div className="flex items-end justify-between mb-2">
        <p className="text-3xl font-heading font-bold">
          {total}
          <span className="text-base text-muted-foreground font-normal"> / {minimum} min</span>
        </p>
        <p className="text-sm text-muted-foreground">{Math.round(percentage)}%</p>
      </div>
      <Progress value={percentage} className="h-2" />

      <dl className="grid grid-cols-3 gap-3 mt-5 text-center">
        <div className="rounded-lg bg-secondary/40 p-3">
          <dt className="text-xs text-muted-foreground uppercase tracking-wide">Verified</dt>
          <dd className="font-heading font-bold text-primary">{verified} min</dd>
        </div>
        <div className="rounded-lg bg-secondary/40 p-3">
          <dt className="text-xs text-muted-foreground uppercase tracking-wide">Pending</dt>
          <dd className="font-heading font-bold">{pending} min</dd>
        </div>
        <div className="rounded-lg bg-secondary/40 p-3">
          <dt className="text-xs text-muted-foreground uppercase tracking-wide">Pace needed</dt>
          <dd className="font-heading font-bold">{pace === 0 ? '—' : `${pace}/wk`}</dd>
        </div>
      </dl>

      {logs.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            Recent entries
          </h3>
          <ul className="space-y-1.5">
            {logs.slice(0, 4).map((log) => (
              <li key={log.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {log.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-medium">{log.duration} min</span>
                  <span
                    className={`text-xs ${log.verified ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {log.verified ? 'Verified' : 'Pending'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ProgressTrackerContent() {
  const { hiitLogs, tmarmLogs, loading } = useWorkout();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    document.title = `Progress Tracker | ${CHALLENGE_LABEL}`;
  }, []);

  const status = cycleStatus();
  const week = currentWeek();
  const left = weeksRemaining();

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
            Progress <span className="text-gradient">Tracker</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            HIIT and TMAR-M status toward the {CHALLENGE_MINIMUMS.hiitMinutes}-minute {CHALLENGE_LABEL}{' '}
            minimums ({CHALLENGE_DATE_RANGE}). Logging stays open all year — off-season sessions are
            kept in your history without affecting standings.
          </p>
          <p className="inline-flex items-center gap-2 text-sm text-primary mt-3">
            <CalendarClock className="w-4 h-4" />
            {status === 'upcoming' && `${CHALLENGE_LABEL} opens in ${daysUntilStart()} days — off-season training still counts for you`}
            {status === 'active' && `Week ${week} of ${CHALLENGE_WEEKS} — ${left} week${left === 1 ? '' : 's'} remaining`}
            {status === 'complete' && 'Cycle complete — final verification in progress'}
          </p>

        </div>
      </section>

      <section className="pb-10">
        <div className="container px-4 grid gap-6 lg:grid-cols-2">
          <PillarCard
            title="HIIT"
            subtitle="High-intensity interval training"
            icon={Flame}
            logs={hiitLogs}
            minimum={CHALLENGE_MINIMUMS.hiitMinutes}
          />
          <PillarCard
            title="TMAR-M"
            subtitle="Tactical mobility, active recovery & mindfulness"
            icon={Heart}
            logs={tmarmLogs}
            minimum={CHALLENGE_MINIMUMS.tmarmMinutes}
          />
        </div>
      </section>

      <section className="pb-10">
        <div className="container px-4">
          <div className="glass rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Clock3 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-heading font-bold">Log minutes</h2>
            </div>
            <Tabs defaultValue="hiit">
              <TabsList className="grid grid-cols-2 mb-6 bg-secondary/50 p-1 rounded-xl">
                <TabsTrigger
                  value="hiit"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
                >
                  <Flame className="w-4 h-4 mr-2" />
                  HIIT
                </TabsTrigger>
                <TabsTrigger
                  value="tmarm"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  TMAR-M
                </TabsTrigger>
              </TabsList>
              <TabsContent value="hiit">
                <HIITForm />
              </TabsContent>
              <TabsContent value="tmarm">
                <TMARMForm />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      <section className="pb-10">
        <div className="container px-4">
          <AICoachFeedback />
        </div>
      </section>

      <section className="pb-16">
        <div className="container px-4">
          <AnnouncementsSection limit={4} compact />
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default function ProgressTracker() {
  return (
    <WorkoutProvider>
      <ProgressTrackerContent />
    </WorkoutProvider>
  );
}
