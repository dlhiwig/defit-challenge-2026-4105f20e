import { Link } from 'react-router-dom';
import { CalendarClock, Dumbbell, Trophy } from 'lucide-react';
import {
  CHALLENGE_WEEKS,
  activeCycle,
  cycleStatus,
  currentWeek,
  weeksRemaining,
  daysUntilStart,
  previousCycle,
} from '@/lib/challenge';

/**
 * DEFIT runs for 10 weeks each year, but the platform is open all 365 days.
 * Between cycles this counts down to the next one and points at the last results.
 */
export function CycleStatusBanner({ className = '' }: { className?: string }) {
  const cycle = activeCycle();
  const status = cycleStatus();
  const previous = previousCycle();
  const days = daysUntilStart();
  const left = weeksRemaining();

  return (
    <div className={`glass rounded-2xl p-5 md:p-6 ${className}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <CalendarClock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            {status === 'active' ? (
              <>
                <p className="font-heading font-bold">
                  {cycle.label} is live — week {currentWeek()} of {CHALLENGE_WEEKS}
                </p>
                <p className="text-sm text-muted-foreground">
                  {left} week{left === 1 ? '' : 's'} left in the scoring window ({cycle.dateRange}).
                </p>
              </>
            ) : (
              <>
                <p className="font-heading font-bold">
                  Off-season — {cycle.label} opens in {days} day{days === 1 ? '' : 's'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Next 10-week cycle: {cycle.dateRange}. Keep training year-round — everything you log
                  now is saved to your history, and only workouts dated inside the cycle count toward
                  standings.
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
          {status !== 'active' && previous && (
            <Link
              to="/rankings"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Trophy className="w-4 h-4" />
              {previous.label} results
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default CycleStatusBanner;
