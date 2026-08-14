import { Link, useParams } from 'react-router-dom';
import { Award, CalendarClock, ClipboardList, Dumbbell, Trophy, Users } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useChallengeSeason } from '@/hooks/useChallengeSeason';
import { STATE_LABEL, daysUntil, stateHeadline, weekOf, weeksLeft } from '@/lib/challengeSeason';
import { CHALLENGE_MINIMUMS } from '@/types/workout';

/** /challenge/:year — the seasonal hub. All copy follows the season state. */
const ChallengeSeason = () => {
  const { year } = useParams();
  const parsedYear = year ? Number(year) : undefined;
  const { season, seasons, loading, notFound } = useChallengeSeason(
    Number.isFinite(parsedYear) ? parsedYear : undefined,
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-background texture-canvas">
        <Navbar />
        <div className="container px-4 pt-32 space-y-4">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!season || notFound) {
    return (
      <main className="min-h-screen bg-background texture-canvas">
        <Navbar />
        <section className="pt-32 pb-16">
          <div className="container px-4 max-w-2xl mx-auto text-center glass rounded-2xl p-10">
            <h1 className="text-3xl font-bold mb-3">No DEFIT Challenge for {year}</h1>
            <p className="text-muted-foreground mb-6">
              Training never stops — keep logging and follow the seasons that are scheduled.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {seasons.map((s) => (
                <Button key={s.year} asChild variant="outline">
                  <Link to={`/challenge/${s.year}`}>{s.label}</Link>
                </Button>
              ))}
              <Button asChild>
                <Link to="/dashboard">Go to my dashboard</Link>
              </Button>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  const isActive = season.state === 'active';
  const isComplete = season.state === 'complete';
  const isRegistration = season.state === 'registration';

  return (
    <main className="min-h-screen bg-background texture-canvas">
      <Navbar />

      {/* Season header */}
      <section className="pt-32 pb-10">
        <div className="container px-4">
          <div className="max-w-4xl">
            <Badge variant="outline" className="mb-4">
              {STATE_LABEL[season.state]}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {season.label} <span className="text-gradient">Challenge</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">{stateHeadline(season)}</p>
            <p className="inline-flex items-center gap-2 text-sm text-primary mt-4">
              <CalendarClock className="w-4 h-4" />
              {season.scoringWeeks}-week scoring window · {season.dateRange}
            </p>
          </div>
        </div>
      </section>

      {/* State-aware call to action */}
      <section className="pb-10">
        <div className="container px-4">
          <div className="glass rounded-2xl p-6 md:p-8 max-w-4xl">
            {season.state === 'off_season' && (
              <>
                <h2 className="text-2xl font-bold mb-2">Keep training</h2>
                <p className="text-muted-foreground mb-6">
                  {season.label} kicks off in {daysUntil(season.start)} day
                  {daysUntil(season.start) === 1 ? '' : 's'}. Everything you log between now and then stays
                  in your permanent fitness history — it simply doesn't count toward challenge standings.
                </p>
              </>
            )}
            {isRegistration && (
              <>
                <h2 className="text-2xl font-bold mb-2">Registration is open</h2>
                <p className="text-muted-foreground mb-6">
                  Sign up for {season.label} before {season.registrationClose.toLocaleDateString()} to be
                  scored, ranked, and eligible for unit and team competition.
                </p>
              </>
            )}
            {isActive && (
              <>
                <h2 className="text-2xl font-bold mb-2">
                  Week {weekOf(season)} of {season.scoringWeeks}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {weeksLeft(season)} week{weeksLeft(season) === 1 ? '' : 's'} left. Log daily, then check
                  where you stand — standings stay provisional until admins verify each entry.
                </p>
              </>
            )}
            {isComplete && (
              <>
                <h2 className="text-2xl font-bold mb-2">Challenge complete</h2>
                <p className="text-muted-foreground mb-6">
                  {season.label} finished on {season.end.toLocaleDateString()}. Final standings are below —
                  and your training continues year-round.
                </p>
              </>
            )}

            <div className="flex flex-wrap gap-3">
              {(isRegistration || season.state === 'off_season') && (
                <Button asChild>
                  <Link to="/register">
                    <ClipboardList className="w-4 h-4 mr-2" />
                    {isRegistration ? 'Register now' : 'Join the notification list'}
                  </Link>
                </Button>
              )}
              {isActive && (
                <Button asChild>
                  <Link to={`/challenge/${season.year}/progress`}>
                    <Dumbbell className="w-4 h-4 mr-2" />
                    My challenge progress
                  </Link>
                </Button>
              )}
              <Button asChild variant={isActive || isComplete ? 'default' : 'outline'}>
                <Link to={`/challenge/${season.year}/rankings`}>
                  <Trophy className="w-4 h-4 mr-2" />
                  {isComplete ? 'Final standings' : 'Rankings'}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={`/challenge/${season.year}/rules`}>Rules ({season.rulesVersion})</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What the season scores */}
      <section className="pb-16">
        <div className="container px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl">
            {[
              { label: 'Cardio', value: `${CHALLENGE_MINIMUMS.cardioMiles} miles`, icon: Dumbbell },
              { label: 'Strength', value: `${CHALLENGE_MINIMUMS.strengthLbs.toLocaleString()} lbs`, icon: Award },
              { label: 'HIIT', value: `${CHALLENGE_MINIMUMS.hiitMinutes} minutes`, icon: CalendarClock },
              { label: 'TMAR-M', value: `${CHALLENGE_MINIMUMS.tmarmMinutes} minutes`, icon: Users },
            ].map((item) => (
              <div key={item.label} className="glass rounded-2xl p-6">
                <item.icon className="w-5 h-5 text-primary mb-3" />
                <p className="font-heading font-bold">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.value} minimum</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Season switcher */}
      {seasons.length > 1 && (
        <section className="pb-20">
          <div className="container px-4">
            <h2 className="text-xl font-bold mb-4">All seasons</h2>
            <div className="flex flex-wrap gap-3">
              {seasons.map((s) => (
                <Button key={s.year} asChild variant={s.year === season.year ? 'default' : 'outline'} size="sm">
                  <Link to={`/challenge/${s.year}`}>
                    {s.label} · {STATE_LABEL[s.state]}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
};

export default ChallengeSeason;
