import { Link } from 'react-router-dom';
import { CalendarClock, ClipboardList, Dumbbell, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useChallengeSeason } from '@/hooks/useChallengeSeason';
import { daysUntil, weekOf, weeksLeft } from '@/lib/challengeSeason';

/**
 * DEFIT trains year-round; the annual Challenge is one 10-week season inside it.
 * Season dates and state come from the database, so nothing here is hardcoded.
 */
export function CycleStatusBanner({ className = '' }: { className?: string }) {
  const { season, seasons, loading } = useChallengeSeason();

  if (loading) {
    return <Skeleton className={`h-28 w-full rounded-2xl ${className}`} />;
  }
  if (!season) return null;

  const completedSeasons = seasons.filter((s) => s.state === 'complete');
  const lastComplete = completedSeasons.length > 0 ? completedSeasons[0] : null;
  const days = daysUntil(season.start);

  return (
    <div className={`glass rounded-2xl p-5 md:p-6 ${className}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <CalendarClock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            {season.state === 'active' && (
              <>
                <p className="font-heading font-bold">
                  {season.label} Challenge is live — week {weekOf(season)} of {season.scoringWeeks}
                </p>
                <p className="text-sm text-muted-foreground">
                  {weeksLeft(season)} week{weeksLeft(season) === 1 ? '' : 's'} left in the scoring window (
                  {season.dateRange}).
                </p>
              </>
            )}
            {season.state === 'registration' && (
              <>
                <p className="font-heading font-bold">
                  Registration is open for the {season.label} Challenge
                </p>
                <p className="text-sm text-muted-foreground">
                  Scoring runs {season.dateRange}. Keep training now — today's sessions build your history
                  and your habits.
                </p>
              </>
            )}
            {season.state === 'off_season' && (
              <>
                <p className="font-heading font-bold">
                  Training season — {season.label} Challenge starts in {days} day{days === 1 ? '' : 's'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Next {season.scoringWeeks}-week season: {season.dateRange}. Everything you log stays in
                  your permanent history; only workouts inside the season count toward standings.
                </p>
              </>
            )}
            {season.state === 'complete' && (
              <>
                <p className="font-heading font-bold">{season.label} Challenge is complete</p>
                <p className="text-sm text-muted-foreground">
                  Final standings are published. Training continues year-round — keep the streak going.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 md:flex-shrink-0">
          <Link
            to="/dashboard/progress"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Dumbbell className="w-4 h-4" />
            Log training
          </Link>
          {season.state === 'registration' && (
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              Register
            </Link>
          )}
          <Link
            to={`/challenge/${season.year}`}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <Trophy className="w-4 h-4" />
            {season.state === 'active' ? 'Challenge hub' : `${season.label} Challenge`}
          </Link>
          {season.state !== 'active' && lastComplete && lastComplete.year !== season.year && (
            <Link
              to={`/challenge/${lastComplete.year}/rankings`}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <Trophy className="w-4 h-4" />
              {lastComplete.label} results
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default CycleStatusBanner;
