import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Clock, Users, ArrowLeft, Check, Loader2, Dumbbell, Timer, Footprints,
  ChevronRight, CalendarDays,
} from "lucide-react";
import {
  useMissionDetail, useJoinMission, useLeaveMission, useCompleteMissionDay,
  type ScheduleDay, type MissionPhase, type WorkoutStep,
} from "@/hooks/useMissions";
import { useAuth } from "@/contexts/AuthContext";

const focusLabels: Record<string, string> = {
  strength: "Strength", cardio: "Cardio", endurance: "Endurance",
  core: "Core", recovery: "Recovery", extreme: "Extreme",
};

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-900/50 text-green-300 border-green-700/50",
  intermediate: "bg-yellow-900/50 text-yellow-300 border-yellow-700/50",
  advanced: "bg-red-900/50 text-red-300 border-red-700/50",
};

function formatDuration(days: number, weeks: number | null): string {
  if (weeks) return `${weeks} week${weeks > 1 ? "s" : ""}`;
  return `${days} day${days > 1 ? "s" : ""}`;
}

function StepRow({ step }: { step: WorkoutStep }) {
  const details: string[] = [];
  if (step.sets) details.push(`${step.sets} sets`);
  if (step.reps) details.push(`${step.reps} reps`);
  if (step.work_seconds) details.push(`${step.work_seconds}s work`);
  if (step.rest_seconds) details.push(`${step.rest_seconds}s rest`);
  if (step.distance_meters) details.push(`${step.distance_meters}m`);
  if (step.load_lbs) details.push(`${step.load_lbs} lbs`);

  const icon = step.step_type === "rest" ? <Timer className="w-4 h-4 text-muted-foreground" /> :
    step.step_type === "interval" ? <Footprints className="w-4 h-4 text-primary" /> :
    <Dumbbell className="w-4 h-4 text-primary" />;

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-md bg-secondary/30">
      {icon}
      <div className="flex-1">
        <span className="text-sm font-medium text-foreground">{step.name}</span>
        {step.notes && <span className="text-xs text-muted-foreground ml-2">({step.notes})</span>}
      </div>
      <span className="text-xs text-muted-foreground">{details.join(" / ")}</span>
    </div>
  );
}

function DayCard({
  day,
  missionId,
  totalDays,
  isEnrolled,
}: {
  day: ScheduleDay;
  missionId: string;
  totalDays: number;
  isEnrolled: boolean;
}) {
  const completeDay = useCompleteMissionDay();
  const isComplete = day.progress_status === "completed";

  return (
    <Card className={`glass ${isComplete ? "border-green-700/50" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            Day {day.day_number}
            {isComplete && <Check className="w-4 h-4 text-green-400" />}
          </CardTitle>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> {day.workout.estimated_minutes} min
          </span>
        </div>
        <p className="text-sm font-medium text-foreground">{day.workout.title}</p>
        {day.workout.description && (
          <p className="text-xs text-muted-foreground">{day.workout.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-1.5">
        {day.steps.map((step) => (
          <StepRow key={step.id} step={step} />
        ))}
        {day.workout.equipment && (day.workout.equipment as string[]).filter(e => e !== "none").length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Equipment: {(day.workout.equipment as string[]).filter(e => e !== "none").join(", ")}
          </p>
        )}
        {isEnrolled && !isComplete && (
          <Button
            size="sm"
            className="w-full mt-3"
            onClick={() => completeDay.mutate({
              missionId,
              dayNumber: day.day_number,
              workoutId: day.workout.id,
              totalDays,
            })}
            disabled={completeDay.isPending}
          >
            {completeDay.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mark Day Complete"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function MissionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { data: mission, isLoading } = useMissionDetail(slug || "");
  const joinMission = useJoinMission();
  const leaveMission = useLeaveMission();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 text-center">
          <h1 className="text-2xl font-heading text-foreground mb-4">Mission Not Found</h1>
          <Button asChild variant="ghost">
            <Link to="/missions"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Missions</Link>
          </Button>
        </div>
      </div>
    );
  }

  const enrolled = mission.user_enrollment;
  const isActive = enrolled && enrolled.status === "active";
  const phases = mission.phases || [];
  const schedule = mission.schedule || [];

  // Group schedule by phase
  const scheduleByPhase: Record<number, ScheduleDay[]> = {};
  schedule.forEach((day) => {
    const pn = day.phase_number || 0;
    if (!scheduleByPhase[pn]) scheduleByPhase[pn] = [];
    scheduleByPhase[pn].push(day);
  });

  const completedDays = schedule.filter((d) => d.progress_status === "completed").length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Back */}
        <Link to="/missions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> All Missions
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-heading uppercase tracking-widest text-primary">
                {focusLabels[mission.focus]}
              </span>
              <Badge variant="outline" className={`text-xs ${difficultyColors[mission.difficulty]}`}>
                {mission.difficulty}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-2">
              {mission.title}
            </h1>
            <p className="text-muted-foreground max-w-xl">{mission.short_description}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatDuration(mission.duration_days, mission.duration_weeks)}</span>
              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {mission.participant_count} enrolled</span>
            </div>
          </div>
          <div className="flex gap-2">
            {isActive ? (
              <Button
                variant="destructive"
                onClick={() => leaveMission.mutate(mission.id)}
                disabled={leaveMission.isPending}
              >
                {leaveMission.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Leave Mission"}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (!user) return;
                  joinMission.mutate(mission.id);
                }}
                disabled={joinMission.isPending || !user}
              >
                {joinMission.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join Mission"}
              </Button>
            )}
          </div>
        </div>

        {/* Progress Summary */}
        {isActive && (
          <Card className="glass mb-8">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Overall Progress</span>
                    <span className="text-sm font-medium text-primary">{Math.round(enrolled!.completion_percent)}%</span>
                  </div>
                  <Progress value={enrolled!.completion_percent} className="h-3" />
                </div>
                <Separator orientation="vertical" className="hidden sm:block h-10" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Completed: </span>
                  <span className="text-foreground font-medium">{completedDays} / {schedule.length} days</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Next: </span>
                  <span className="text-foreground font-medium">Day {enrolled!.current_day_number}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            {isActive && <TabsTrigger value="progress">Progress</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="glass">
              <CardHeader><CardTitle>Program Overview</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{mission.short_description}</p>
                {phases.length > 0 && (
                  <div>
                    <h3 className="text-sm font-heading font-semibold text-foreground mb-3 uppercase tracking-wide">
                      Phases
                    </h3>
                    <div className="space-y-2">
                      {phases.map((phase) => (
                        <div key={phase.id} className="flex items-center gap-3 py-2 px-3 rounded-md bg-secondary/30">
                          <ChevronRight className="w-4 h-4 text-primary" />
                          <div>
                            <span className="text-sm font-medium text-foreground">
                              Phase {phase.phase_number}: {phase.title}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              (Days {phase.start_day}-{phase.end_day})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            {phases.length > 0 ? (
              phases.map((phase) => (
                <div key={phase.id}>
                  <h3 className="text-lg font-heading font-semibold text-foreground mb-3">
                    Phase {phase.phase_number}: {phase.title}
                    <span className="text-sm text-muted-foreground font-normal ml-2">
                      Days {phase.start_day}-{phase.end_day}
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {(scheduleByPhase[phase.phase_number] || []).map((day) => (
                      <DayCard
                        key={day.id}
                        day={day}
                        missionId={mission.id}
                        totalDays={schedule.length}
                        isEnrolled={!!isActive}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schedule.map((day) => (
                  <DayCard
                    key={day.id}
                    day={day}
                    missionId={mission.id}
                    totalDays={schedule.length}
                    isEnrolled={!!isActive}
                  />
                ))}
              </div>
            )}
            {schedule.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Schedule data is being prepared. Check back soon.
              </p>
            )}
          </TabsContent>

          {isActive && (
            <TabsContent value="progress" className="space-y-4">
              <Card className="glass">
                <CardHeader><CardTitle>Day-by-Day Progress</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {schedule.map((day) => (
                      <div key={day.id} className="flex items-center gap-3 py-2 px-3 rounded-md bg-secondary/30">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          day.progress_status === "completed"
                            ? "bg-green-800 text-green-300"
                            : "bg-secondary text-muted-foreground"
                        }`}>
                          {day.progress_status === "completed" ? <Check className="w-3 h-3" /> : day.day_number}
                        </div>
                        <span className="text-sm text-foreground flex-1">{day.workout.title}</span>
                        <span className={`text-xs capitalize ${
                          day.progress_status === "completed" ? "text-green-400" : "text-muted-foreground"
                        }`}>
                          {day.progress_status?.replace("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
