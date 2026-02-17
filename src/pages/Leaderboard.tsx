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
  Trophy,
  Medal,
  Award,
  Loader2,
  Users,
  TrendingUp,
  ArrowUpDown,
  Info,
  Dumbbell,
  Clock
} from 'lucide-react';

type SortMetric = 'overall' | 'cardio' | 'strength' | 'hiit' | 'tmarm';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  unit: string | null;
  cardioMiles: number;
  strengthLbs: number;
  hiitMinutes: number;
  tmarmMinutes: number;
  cardioCompletion: number;
  strengthCompletion: number;
  hiitCompletion: number;
  tmarmCompletion: number;
  overallCompletion: number;
}

interface LeaderboardResponse {
  data: LeaderboardEntry[];
  challengeMinimums: {
    cardioMiles: number;
    strengthLbs: number;
    hiitMinutes: number;
    tmarmMinutes: number;
  };
  totalParticipants: number;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMetric, setSortMetric] = useState<SortMetric>('overall');
  const [totalParticipants, setTotalParticipants] = useState(0);

  useEffect(() => {
    fetchLeaderboard();

    // JSON-LD schema markup
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "DEFIT Leaderboard – Challenge Rankings",
      "description": "Track top performers in the 10-week Double Eagle Fitness Challenge. View individual and unit rankings by cardio, strength, HIIT, and TMAR-M completion.",
      "url": window.location.href,
      "isPartOf": {
        "@type": "WebSite",
        "name": "DEFIT – Double Eagle Fitness Challenge",
        "url": window.location.origin,
      },
      "about": {
        "@type": "SportsEvent",
        "name": "Double Eagle Fitness Challenge 2026",
        "description": "A 10-week fitness challenge for Army Reserve soldiers and supporters.",
        "startDate": "2026-01-12",
        "endDate": "2026-03-22",
      },
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('get-leaderboard');
      
      if (error) throw error;
      
      const response = data as LeaderboardResponse;
      setLeaderboard(response.data || []);
      setTotalParticipants(response.totalParticipants || 0);
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  // Sort leaderboard based on selected metric
  const sortedLeaderboard = useMemo(() => {
    const sorted = [...leaderboard];
    
    switch (sortMetric) {
      case 'cardio':
        sorted.sort((a, b) => b.cardioMiles - a.cardioMiles);
        break;
      case 'strength':
        sorted.sort((a, b) => b.strengthLbs - a.strengthLbs);
        break;
      case 'hiit':
        sorted.sort((a, b) => b.hiitMinutes - a.hiitMinutes);
        break;
      case 'tmarm':
        sorted.sort((a, b) => b.tmarmMinutes - a.tmarmMinutes);
        break;
      default:
        sorted.sort((a, b) => b.overallCompletion - a.overallCompletion);
    }
    
    // Re-assign ranks after sorting
    let currentRank = 1;
    let previousValue = -1;
    
    return sorted.map((entry, index) => {
      const currentValue = sortMetric === 'overall' ? entry.overallCompletion :
                          sortMetric === 'cardio' ? entry.cardioMiles :
                          sortMetric === 'strength' ? entry.strengthLbs :
                          sortMetric === 'hiit' ? entry.hiitMinutes :
                          entry.tmarmMinutes;
      
      if (currentValue !== previousValue) {
        currentRank = index + 1;
      }
      previousValue = currentValue;
      
      return { ...entry, displayRank: currentRank };
    });
  }, [leaderboard, sortMetric]);

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
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400';
      case 2:
        return 'bg-gray-300/20 border-gray-300/30 text-gray-300';
      case 3:
        return 'bg-amber-600/20 border-amber-600/30 text-amber-500';
      default:
        return '';
    }
  };

  const getMetricLabel = (metric: SortMetric) => {
    switch (metric) {
      case 'overall': return 'Overall %';
      case 'cardio': return 'Cardio Miles';
      case 'strength': return 'Strength (lbs)';
      case 'hiit': return 'HIIT (min)';
      case 'tmarm': return 'TMAR-M (min)';
    }
  };

  return (
    <main className="min-h-screen bg-background texture-canvas">
      <Navbar />
      
      {/* Hero Header */}
      <section className="pt-24 pb-12">
        <div className="container px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Challenge Rankings</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              DEFIT <span className="text-gradient">Leaderboard</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Track top performers in the 10-week Double Eagle Fitness Challenge.
            </p>
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
                <Link to="/leaderboard/units">Unit Leaderboard</Link>
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
              <Users className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-heading font-bold">{totalParticipants}</p>
              <p className="text-xs text-muted-foreground">Participants</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-heading font-bold">120</p>
              <p className="text-xs text-muted-foreground">Miles Target</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Dumbbell className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-heading font-bold">50K</p>
              <p className="text-xs text-muted-foreground">Lbs Target</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-heading font-bold">10</p>
              <p className="text-xs text-muted-foreground">Week Challenge</p>
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
                <strong className="text-amber-400">Disclaimer:</strong> Leaderboard values are preliminary until verified by USARC administrators. Rankings may change after validation.
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
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                </div>
                
                <Select value={sortMetric} onValueChange={(v) => setSortMetric(v as SortMetric)}>
                  <SelectTrigger className="w-[180px] bg-secondary">
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="overall">Overall Completion</SelectItem>
                    <SelectItem value="cardio">Cardio Miles</SelectItem>
                    <SelectItem value="strength">Strength (lbs)</SelectItem>
                    <SelectItem value="hiit">HIIT Minutes</SelectItem>
                    <SelectItem value="tmarm">TMAR-M Minutes</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm" onClick={fetchLeaderboard} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Table */}
      <section className="pb-16">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <div className="glass rounded-2xl overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading leaderboard...</p>
                </div>
              ) : error ? (
                <div className="p-12 text-center">
                  <p className="text-destructive mb-4">{error}</p>
                  <Button onClick={fetchLeaderboard}>Try Again</Button>
                </div>
              ) : sortedLeaderboard.length === 0 ? (
                <div className="p-12 text-center">
                  <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-heading font-bold mb-2">No Participants Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to log workouts and climb the leaderboard!
                  </p>
                  <Button asChild variant="hero">
                    <Link to="/auth">Join the Challenge</Link>
                  </Button>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="w-16">Rank</TableHead>
                          <TableHead>Participant</TableHead>
                          <TableHead className="text-right">Cardio</TableHead>
                          <TableHead className="text-right">Strength</TableHead>
                          <TableHead className="text-right">Overall</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedLeaderboard.map((entry) => (
                          <TableRow 
                            key={entry.userId}
                            className={`border-border ${entry.displayRank <= 3 ? getRankBadgeClass(entry.displayRank) : ''}`}
                          >
                            <TableCell>
                              <div className="flex items-center justify-center">
                                {getRankIcon(entry.displayRank)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-heading font-bold">{entry.name}</p>
                                {entry.unit && (
                                  <p className="text-xs text-muted-foreground">{entry.unit}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div>
                                <p className="font-mono">{entry.cardioMiles.toFixed(1)} mi</p>
                                <p className="text-xs text-muted-foreground">{entry.cardioCompletion.toFixed(0)}%</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div>
                                <p className="font-mono">{entry.strengthLbs.toLocaleString()} lbs</p>
                                <p className="text-xs text-muted-foreground">{entry.strengthCompletion.toFixed(0)}%</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-3 justify-end">
                                <Progress 
                                  value={entry.overallCompletion} 
                                  className="w-16 h-2"
                                />
                                <span className="font-heading font-bold text-primary w-12">
                                  {entry.overallCompletion.toFixed(0)}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden divide-y divide-border">
                    {sortedLeaderboard.map((entry) => (
                      <div 
                        key={entry.userId}
                        className={`p-4 ${entry.displayRank <= 3 ? getRankBadgeClass(entry.displayRank) : ''}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            {getRankIcon(entry.displayRank)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div>
                                <p className="font-heading font-bold">{entry.name}</p>
                                {entry.unit && (
                                  <p className="text-xs text-muted-foreground">{entry.unit}</p>
                                )}
                              </div>
                              <Badge className="bg-primary/20 text-primary border-primary/30">
                                {entry.overallCompletion.toFixed(0)}%
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs">Cardio</p>
                                <p className="font-mono">{entry.cardioMiles.toFixed(1)} mi</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Strength</p>
                                <p className="font-mono">{entry.strengthLbs.toLocaleString()} lbs</p>
                              </div>
                            </div>
                            <Progress 
                              value={entry.overallCompletion} 
                              className="mt-3 h-2"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
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
              <h3 className="font-heading font-bold mb-4">How Scoring Works</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-2">
                    <strong className="text-foreground">Overall Completion</strong> is calculated as a weighted average:
                  </p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Cardio: <strong className="text-primary">30%</strong> (120 miles target)</li>
                    <li>• Strength: <strong className="text-primary">30%</strong> (50,000 lbs target)</li>
                    <li>• HIIT: <strong className="text-primary">20%</strong> (300 minutes target)</li>
                    <li>• TMAR-M: <strong className="text-primary">20%</strong> (200 minutes target)</li>
                  </ul>
                </div>
                <div>
                  <p className="text-muted-foreground mb-2">
                    <strong className="text-foreground">Ranking Rules:</strong>
                  </p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Each category maxes at 100%</li>
                    <li>• Tied scores receive the same rank</li>
                    <li>• Sort by any metric using the dropdown</li>
                    <li>• Final rankings verified by USARC</li>
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
