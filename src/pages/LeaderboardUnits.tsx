import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Trophy,
  Medal,
  Award,
  Loader2,
  Users,
  Building2,
  ArrowUpDown,
  Info,
  ChevronDown,
  ChevronRight,
  Calendar,
  Shield
} from 'lucide-react';

type SortMetric = 'overall' | 'cardio' | 'strength' | 'members';
type CategoryFilter = 'all' | 'veterans' | 'government' | 'military_family' | 'civilian' | 'other';

interface UnitMember {
  userId: string;
  name: string;
  overallCompletion: number;
}

interface UnitEntry {
  rank: number;
  unitName: string;
  unitCategory: string;
  unitCategoryLabel: string;
  memberCount: number;
  totalCardioMiles: number;
  totalStrengthLbs: number;
  totalHiitMinutes: number;
  totalTmarmMinutes: number;
  avgCardioMiles: number;
  avgStrengthLbs: number;
  avgHiitMinutes: number;
  avgTmarmMinutes: number;
  cardioCompletion: number;
  strengthCompletion: number;
  hiitCompletion: number;
  tmarmCompletion: number;
  overallCompletion: number;
  members: UnitMember[];
  displayRank?: number;
}

interface LeaderboardResponse {
  data: UnitEntry[];
  totalUnits: number;
  challengeRound: string;
  snapshotDate: string;
  categoryLabels: Record<string, string>;
}

const CATEGORY_LABELS: Record<string, string> = {
  veterans: 'Veterans',
  government: 'Government Employees',
  military_family: 'Military Family',
  civilian: 'Civilian',
  other: 'Other',
};

export default function LeaderboardUnits() {
  const [leaderboard, setLeaderboard] = useState<UnitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMetric, setSortMetric] = useState<SortMetric>('overall');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [challengeRound, setChallengeRound] = useState('');
  const [snapshotDate, setSnapshotDate] = useState('');
  const [totalUnits, setTotalUnits] = useState(0);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('get-unit-leaderboard');
      
      if (error) throw error;
      
      const response = data as LeaderboardResponse;
      setLeaderboard(response.data || []);
      setTotalUnits(response.totalUnits || 0);
      setChallengeRound(response.challengeRound || '');
      setSnapshotDate(response.snapshotDate || '');
    } catch (err: any) {
      console.error('Error fetching unit leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...leaderboard];

    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter(unit => unit.unitCategory === categoryFilter);
    }

    // Sort by selected metric
    switch (sortMetric) {
      case 'cardio':
        result.sort((a, b) => b.totalCardioMiles - a.totalCardioMiles);
        break;
      case 'strength':
        result.sort((a, b) => b.totalStrengthLbs - a.totalStrengthLbs);
        break;
      case 'members':
        result.sort((a, b) => b.memberCount - a.memberCount);
        break;
      default:
        result.sort((a, b) => b.overallCompletion - a.overallCompletion);
    }

    // Re-assign display ranks
    let currentRank = 1;
    let previousValue = -1;

    return result.map((entry, index) => {
      const currentValue = sortMetric === 'overall' ? entry.overallCompletion :
                          sortMetric === 'cardio' ? entry.totalCardioMiles :
                          sortMetric === 'strength' ? entry.totalStrengthLbs :
                          entry.memberCount;
      
      if (currentValue !== previousValue) {
        currentRank = index + 1;
      }
      previousValue = currentValue;

      return { ...entry, displayRank: currentRank };
    });
  }, [leaderboard, sortMetric, categoryFilter]);

  const toggleExpanded = (unitName: string) => {
    setExpandedUnits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(unitName)) {
        newSet.delete(unitName);
      } else {
        newSet.add(unitName);
      }
      return newSet;
    });
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/20 border-yellow-500/30';
      case 2:
        return 'bg-gray-300/20 border-gray-300/30';
      case 3:
        return 'bg-amber-600/20 border-amber-600/30';
      default:
        return '';
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'veterans':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'government':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'military_family':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'civilian':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <main className="min-h-screen bg-background texture-canvas">
      <Navbar />
      
      {/* Hero Header */}
      <section className="pt-24 pb-12">
        <div className="container px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Team Competition</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              Unit <span className="text-gradient">Leaderboard</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Track top Army Reserve units in the team challenge competition.
            </p>
            
            {/* Challenge Round / Snapshot */}
            {(challengeRound || snapshotDate) && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                {challengeRound && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>{challengeRound}</span>
                  </div>
                )}
                {snapshotDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Updated: {formatDate(snapshotDate)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Navigation to New Rankings */}
      <section className="pb-6">
        <div className="container px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 max-w-xl">
              <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">New OML-Style Rankings Available</p>
                <p className="text-xs text-muted-foreground">View the official rank-based scoring system with Individual, Team, Unit, and Command levels.</p>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <Button variant="hero" asChild>
                <Link to="/rankings">View OML Rankings</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/leaderboard">Individual Leaderboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="pb-8">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="glass rounded-xl p-4 text-center">
              <Building2 className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-heading font-bold">{totalUnits}</p>
              <p className="text-xs text-muted-foreground">Competing Units</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Users className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-heading font-bold">
                {filteredAndSorted.reduce((sum, u) => sum + u.memberCount, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Members</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-heading font-bold">
                {filteredAndSorted[0]?.overallCompletion.toFixed(0) || 0}%
              </p>
              <p className="text-xs text-muted-foreground">Top Unit</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Award className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-heading font-bold">5</p>
              <p className="text-xs text-muted-foreground">Categories</p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="pb-6">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200/80">
                <strong className="text-amber-400">Disclaimer:</strong> Results pending verification by USARC command staff. Rankings are calculated using average member completion to ensure fairness across unit sizes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="pb-4">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <div className="glass rounded-xl p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Sort:</span>
                </div>
                
                <Select value={sortMetric} onValueChange={(v) => setSortMetric(v as SortMetric)}>
                  <SelectTrigger className="w-[160px] bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="overall">Overall %</SelectItem>
                    <SelectItem value="cardio">Cardio Miles</SelectItem>
                    <SelectItem value="strength">Strength (lbs)</SelectItem>
                    <SelectItem value="members">Member Count</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}>
                  <SelectTrigger className="w-[180px] bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="veterans">Veterans</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="military_family">Military Family</SelectItem>
                    <SelectItem value="civilian">Civilian</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm" onClick={fetchLeaderboard} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
                </Button>

                <div className="ml-auto text-sm text-muted-foreground">
                  {filteredAndSorted.length} units
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="pb-16">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <div className="glass rounded-2xl overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading unit leaderboard...</p>
                </div>
              ) : error ? (
                <div className="p-12 text-center">
                  <p className="text-destructive mb-4">{error}</p>
                  <Button onClick={fetchLeaderboard}>Try Again</Button>
                </div>
              ) : filteredAndSorted.length === 0 ? (
                <div className="p-12 text-center">
                  <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-heading font-bold mb-2">No Units Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {leaderboard.length === 0 
                      ? "No units have participating members yet."
                      : "No units match your current filters."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredAndSorted.map((unit) => (
                    <Collapsible
                      key={unit.unitName}
                      open={expandedUnits.has(unit.unitName)}
                      onOpenChange={() => toggleExpanded(unit.unitName)}
                    >
                      <div className={`${unit.displayRank && unit.displayRank <= 3 ? getRankBadgeClass(unit.displayRank) : ''}`}>
                        <CollapsibleTrigger asChild>
                          <div className="p-4 cursor-pointer hover:bg-muted/20 transition-colors">
                            <div className="flex items-start gap-4">
                              {/* Rank */}
                              <div className="flex-shrink-0">
                                {getRankIcon(unit.displayRank || unit.rank)}
                              </div>

                              {/* Unit Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-heading font-bold">{unit.unitName}</h3>
                                      {expandedUnits.has(unit.unitName) ? (
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge className={getCategoryBadgeClass(unit.unitCategory)}>
                                        {unit.unitCategoryLabel}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {unit.memberCount} member{unit.memberCount !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  </div>
                                  <Badge className="bg-primary/20 text-primary border-primary/30 text-lg px-3">
                                    {unit.overallCompletion.toFixed(0)}%
                                  </Badge>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-sm">
                                  <div>
                                    <p className="text-muted-foreground text-xs">Cardio</p>
                                    <p className="font-mono">{unit.totalCardioMiles.toFixed(1)} mi</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">Strength</p>
                                    <p className="font-mono">{unit.totalStrengthLbs.toLocaleString()} lbs</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">HIIT</p>
                                    <p className="font-mono">{unit.totalHiitMinutes} min</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">TMAR-M</p>
                                    <p className="font-mono">{unit.totalTmarmMinutes} min</p>
                                  </div>
                                </div>

                                <Progress value={unit.overallCompletion} className="mt-3 h-2" />
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="px-4 pb-4 pt-0">
                            <div className="ml-10 p-4 rounded-xl bg-secondary/30 border border-border">
                              <h4 className="text-sm font-heading font-bold mb-3 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Top Contributing Members
                              </h4>
                              <div className="space-y-2">
                                {unit.members.slice(0, 5).map((member, idx) => (
                                  <div key={member.userId} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground w-4">{idx + 1}.</span>
                                      <span>{member.name}</span>
                                    </div>
                                    <span className="font-mono text-primary">
                                      {member.overallCompletion.toFixed(0)}%
                                    </span>
                                  </div>
                                ))}
                                {unit.members.length > 5 && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    +{unit.members.length - 5} more members
                                  </p>
                                )}
                              </div>

                              <div className="mt-4 pt-4 border-t border-border">
                                <h4 className="text-sm font-heading font-bold mb-2">Average Per Member</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                  <div>
                                    <p className="text-muted-foreground">Cardio</p>
                                    <p className="font-mono">{unit.avgCardioMiles.toFixed(1)} mi</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Strength</p>
                                    <p className="font-mono">{unit.avgStrengthLbs.toLocaleString()} lbs</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">HIIT</p>
                                    <p className="font-mono">{unit.avgHiitMinutes.toFixed(0)} min</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">TMAR-M</p>
                                    <p className="font-mono">{unit.avgTmarmMinutes.toFixed(0)} min</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Scoring Explanation */}
      <section className="pb-16">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <div className="glass rounded-2xl p-6">
              <h3 className="font-heading font-bold mb-4">Unit Scoring Rules</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-2">
                    <strong className="text-foreground">Aggregation Method:</strong>
                  </p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Unit score = <strong className="text-primary">average</strong> member completion</li>
                    <li>• Only active members (with logged workouts) counted</li>
                    <li>• Ensures fairness across unit sizes</li>
                    <li>• Minimum 1 member required to qualify</li>
                  </ul>
                </div>
                <div>
                  <p className="text-muted-foreground mb-2">
                    <strong className="text-foreground">Categories:</strong>
                  </p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• <span className="text-blue-400">Veterans</span> - Veteran organizations</li>
                    <li>• <span className="text-purple-400">Government</span> - Gov employees</li>
                    <li>• <span className="text-green-400">Military Family</span> - Family members</li>
                    <li>• <span className="text-orange-400">Civilian</span> - Civilian supporters</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
