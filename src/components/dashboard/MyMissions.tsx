import { Link } from 'react-router-dom';
import { useMyMissions, MyMissionEnrollment } from '@/hooks/useMyMissions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowRight, Target } from 'lucide-react';

const focusColors: Record<string, string> = {
  strength: 'bg-red-500/10 text-red-400 border-red-500/30',
  cardio: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  endurance: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  core: 'bg-green-500/10 text-green-400 border-green-500/30',
  recovery: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  extreme: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
};

function MissionCard({ enrollment }: { enrollment: MyMissionEnrollment }) {
  const { mission, completion_percent, current_day_number, next_day_number } = enrollment;
  const percent = Math.round(completion_percent);

  return (
    <Card className="glass border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-heading font-bold text-base leading-tight">{mission.title}</h3>
          <Badge variant="outline" className="shrink-0 capitalize text-xs">
            {mission.difficulty}
          </Badge>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${focusColors[mission.focus] || 'bg-muted text-muted-foreground'}`}>
            {mission.focus}
          </span>
          <span className="text-xs text-muted-foreground">
            Day {current_day_number} of {mission.duration_days}
          </span>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{percent}% complete</span>
          </div>
          <Progress
            value={percent}
            className="h-2"
            aria-label={`${percent}% of ${mission.title} completed`}
          />
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Next up: Day {next_day_number}
        </p>

        <div className="flex items-center gap-2">
          <Button size="sm" asChild className="flex-1">
            <Link to={`/missions/${mission.slug}/day/${next_day_number}`}>
              Continue
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to={`/missions/${mission.slug}`}>
              View Mission
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="glass border-border/50">
      <CardContent className="p-8 flex flex-col items-center text-center">
        <Target className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-4">You're not enrolled in any missions yet.</p>
        <Button asChild>
          <Link to="/missions">Browse Missions</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function MyMissions() {
  const { data: enrollments, isLoading } = useMyMissions();

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-heading font-bold">My Missions</h2>
        {enrollments && enrollments.length > 0 && (
          <Link to="/missions" className="text-sm text-primary hover:underline">
            Browse all
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !enrollments || enrollments.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {enrollments.map(e => (
            <MissionCard key={e.mission.slug} enrollment={e} />
          ))}
        </div>
      )}
    </section>
  );
}
