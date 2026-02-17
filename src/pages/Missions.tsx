import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Search, Users, Clock, ArrowRight, Loader2 } from "lucide-react";
import { useMissions, useJoinMission, type MissionsFilter, type Mission, type MissionFocus, type MissionDifficulty } from "@/hooks/useMissions";
import { useAuth } from "@/contexts/AuthContext";

const focusLabels: Record<MissionFocus, string> = {
  strength: "Strength",
  cardio: "Cardio",
  endurance: "Endurance",
  core: "Core",
  recovery: "Recovery",
  extreme: "Extreme",
};

const difficultyColors: Record<MissionDifficulty, string> = {
  beginner: "bg-green-900/50 text-green-300 border-green-700/50",
  intermediate: "bg-yellow-900/50 text-yellow-300 border-yellow-700/50",
  advanced: "bg-red-900/50 text-red-300 border-red-700/50",
};

function formatDuration(days: number, weeks: number | null): string {
  if (weeks) return `${weeks} week${weeks > 1 ? "s" : ""}`;
  return `${days} day${days > 1 ? "s" : ""}`;
}

function MissionCard({ mission }: { mission: Mission }) {
  const { user } = useAuth();
  const joinMission = useJoinMission();
  const enrolled = mission.user_enrollment;
  const isActive = enrolled && enrolled.status === "active";

  return (
    <Card className="glass card-hover flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-heading uppercase tracking-widest text-primary">
            {focusLabels[mission.focus]}
          </span>
          <Badge variant="outline" className={`text-xs ${difficultyColors[mission.difficulty]}`}>
            {mission.difficulty}
          </Badge>
        </div>
        <h3 className="text-lg font-heading font-bold text-foreground leading-tight">
          {mission.title}
        </h3>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {mission.short_description}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(mission.duration_days, mission.duration_weeks)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {mission.participant_count} enrolled
          </span>
        </div>
        {isActive && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-primary font-medium">{Math.round(enrolled.completion_percent)}%</span>
            </div>
            <Progress value={enrolled.completion_percent} className="h-2" />
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 flex gap-2">
        {isActive ? (
          <Button asChild className="flex-1" size="sm">
            <Link to={`/missions/${mission.slug}`}>
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        ) : (
          <Button
            size="sm"
            className="flex-1"
            onClick={() => {
              if (!user) return;
              joinMission.mutate(mission.id);
            }}
            disabled={joinMission.isPending || !user}
          >
            {joinMission.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join Mission"}
          </Button>
        )}
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/missions/${mission.slug}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Missions() {
  const [filters, setFilters] = useState<MissionsFilter>({
    search: "",
    difficulty: "",
    focus: "",
    duration: "",
    sort: "popular",
  });

  const { data: missions, isLoading } = useMissions(filters);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-2">
            Missions
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Structured training programs designed to build readiness through progressive challenge.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search missions..."
              className="pl-9"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </div>
          <Select value={filters.difficulty || "all"} onValueChange={(v) => setFilters((f) => ({ ...f, difficulty: v === "all" ? "" : v as any }))}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Difficulty" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.focus || "all"} onValueChange={(v) => setFilters((f) => ({ ...f, focus: v === "all" ? "" : v as any }))}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Focus" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Focus</SelectItem>
              <SelectItem value="strength">Strength</SelectItem>
              <SelectItem value="cardio">Cardio</SelectItem>
              <SelectItem value="endurance">Endurance</SelectItem>
              <SelectItem value="core">Core</SelectItem>
              <SelectItem value="recovery">Recovery</SelectItem>
              <SelectItem value="extreme">Extreme</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.duration || "all"} onValueChange={(v) => setFilters((f) => ({ ...f, duration: v === "all" ? "" : v as any }))}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Duration" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Durations</SelectItem>
              <SelectItem value="<=21">21 days or less</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="8+weeks">8+ weeks</SelectItem>
              <SelectItem value="12+weeks">12+ weeks</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.sort} onValueChange={(v) => setFilters((f) => ({ ...f, sort: v as any }))}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="shortest">Shortest</SelectItem>
              <SelectItem value="longest">Longest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !missions?.length ? (
          <div className="text-center py-20 text-muted-foreground">
            No missions found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {missions.map((m) => (
              <MissionCard key={m.id} mission={m} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
