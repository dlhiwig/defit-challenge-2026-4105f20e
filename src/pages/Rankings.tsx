import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Trophy, Medal, Award, Loader2, Info, Users, Shield, BookOpen, Search, X, UserCheck,
} from 'lucide-react';
import type { RankEntry, RankingLevel, RankingsResponse } from '@/lib/scoring';
import { RANKING_LEVELS, COMPONENT_LABELS } from '@/lib/scoring';

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
  return <span className="font-bold text-muted-foreground">{rank}</span>;
}

export default function Rankings() {
  const { user } = useAuth();
  const [level, setLevel] = useState<RankingLevel>('individual');
  const [data, setData] = useState<RankEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTotal, setSearchTotal] = useState<number | undefined>();
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Find My Ranking state
  const [foundMe, setFoundMe] = useState<RankEntry | null>(null);
  const [findingMe, setFindingMe] = useState(false);
  const highlightedRef = useRef<HTMLTableRowElement | null>(null);
  const highlightedMobileRef = useRef<HTMLDivElement | null>(null);

  const fetchRankings = useCallback(async (search?: string, findMe?: string) => {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { level, limit: 100 };
      if (search) body.search = search;
      if (findMe) body.findMe = findMe;

      const { data: res, error: err } = await supabase.functions.invoke('get-rankings', { body });
      if (err) throw err;
      const response = res as RankingsResponse & { searchTotal?: number; foundMe?: RankEntry | null };
      setData(response.data || []);
      setTotal(response.total || 0);
      setSearchTotal(response.searchTotal);
      if (response.foundMe) setFoundMe(response.foundMe);
    } catch (err: any) {
      console.error('Rankings error:', err);
      setError(err.message || 'Failed to load rankings');
    } finally {
      setLoading(false);
      setIsSearching(false);
      setFindingMe(false);
    }
  }, [level]);

  useEffect(() => {
    setSearchQuery('');
    setFoundMe(null);
    setSearchTotal(undefined);
    fetchRankings();
  }, [level, fetchRankings]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSearchTotal(undefined);
      fetchRankings();
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      fetchRankings(value.trim());
    }, 400);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchTotal(undefined);
    setFoundMe(null);
    fetchRankings();
  };

  const handleFindMe = async () => {
    if (!user) return;
    setFindingMe(true);
    setFoundMe(null);
    setSearchQuery('');
    setSearchTotal(undefined);
    await fetchRankings(undefined, user.id);
    // Scroll to highlighted row after render
    setTimeout(() => {
      highlightedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightedMobileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
  };

  const hasF = level !== 'individual';
  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <main className="min-h-screen bg-background texture-canvas">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-12">
        <div className="container px-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">OML-Style Rankings</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
            DEFIT <span className="text-gradient">Rankings</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-6">
            Rank-based scoring across Individual, Team, Unit, and Command levels. Lower total score wins.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/scoring"><BookOpen className="w-4 h-4 mr-2" />How Scoring Works</Link>
          </Button>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="pb-6">
        <div className="container px-4 max-w-4xl mx-auto">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-200/80">
              <strong className="text-amber-400">Disclaimer:</strong> Rankings are preliminary until verified by USARC administrators. All scores use OML-style rank summation — lower total is better.
            </p>
          </div>
        </div>
      </section>

      {/* Tabs + Table */}
      <section className="pb-16">
        <div className="container px-4 max-w-5xl mx-auto">
          <Tabs value={level} onValueChange={(v) => setLevel(v as RankingLevel)}>
            <TabsList className="grid grid-cols-4 w-full max-w-lg mx-auto mb-8">
              {RANKING_LEVELS.map(l => (
                <TabsTrigger key={l.value} value={l.value} className="text-xs sm:text-sm">
                  {l.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Search + Find Me Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name…"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-10 bg-secondary/50 border-border"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {user && level === 'individual' && (
                <Button
                  variant="outline"
                  onClick={handleFindMe}
                  disabled={findingMe}
                  className="shrink-0"
                >
                  {findingMe ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4 mr-2" />
                  )}
                  Find My Ranking
                </Button>
              )}
            </div>

            {/* Found Me Banner */}
            {foundMe && (
              <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-3 flex-wrap">
                  <UserCheck className="w-5 h-5 text-primary" />
                  <span className="font-heading font-bold text-foreground">Your Ranking:</span>
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-lg px-3">
                    #{foundMe.finalRank}
                  </Badge>
                  <span className="text-muted-foreground">of {total}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-heading font-bold text-primary">{foundMe.totalScore} pts</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3 text-xs">
                  {['A', 'B', 'C', 'D', 'E', ...(hasF ? ['F'] : [])].map(c => (
                    <div key={c} className="text-center bg-secondary/50 rounded p-1.5">
                      <p className="text-muted-foreground">{COMPONENT_LABELS[c]}</p>
                      <p className="font-mono font-bold">
                        {c === 'A' ? foundMe.componentA : c === 'B' ? foundMe.componentB :
                         c === 'C' ? foundMe.componentC : c === 'D' ? foundMe.componentD :
                         c === 'E' ? foundMe.componentE : foundMe.componentF ?? '—'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {RANKING_LEVELS.map(l => (
              <TabsContent key={l.value} value={l.value}>
                <div className="glass rounded-2xl overflow-hidden">
                  {loading ? (
                    <div className="p-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {isSearching ? 'Searching…' : `Loading ${l.label} rankings…`}
                      </p>
                    </div>
                  ) : error ? (
                    <div className="p-12 text-center">
                      <p className="text-destructive mb-4">{error}</p>
                      <Button onClick={() => fetchRankings()}>Try Again</Button>
                    </div>
                  ) : data.length === 0 ? (
                    <div className="p-12 text-center">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-heading font-bold mb-2">
                        {isSearchActive ? 'No Participants Found' : 'No Rankings Yet'}
                      </h3>
                      <p className="text-muted-foreground">
                        {isSearchActive
                          ? `No matches for "${searchQuery}". Try a different name.`
                          : l.value === 'individual'
                            ? 'No participants have logged activity during the scoring period.'
                            : `No ${l.label.toLowerCase()}s meet the minimum requirements for ranking.`}
                      </p>
                      {isSearchActive && (
                        <Button variant="outline" size="sm" className="mt-4" onClick={clearSearch}>
                          Clear Search
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="p-4 border-b border-border flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {isSearchActive
                            ? `Search Results (${searchTotal ?? data.length} matches)`
                            : `${total} ranked`}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => fetchRankings(searchQuery || undefined)} disabled={loading}>
                          Refresh
                        </Button>
                      </div>

                      {/* Desktop table */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                              <TableHead className="w-16">Rank</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead className="text-center">Cardio</TableHead>
                              <TableHead className="text-center">Resistance</TableHead>
                              <TableHead className="text-center">HIIT</TableHead>
                              <TableHead className="text-center">TMAR-M</TableHead>
                              <TableHead className="text-center">Consistency</TableHead>
                              {hasF && <TableHead className="text-center">Completion</TableHead>}
                              <TableHead className="text-center font-bold">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.map((entry) => {
                              const isMe = foundMe && entry.entityId === foundMe.entityId;
                              return (
                                <TableRow
                                  key={entry.entityId}
                                  ref={isMe ? highlightedRef : undefined}
                                  className={`border-border transition-colors ${
                                    isMe
                                      ? 'bg-primary/15 ring-1 ring-primary/30'
                                      : entry.finalRank <= 3 ? 'bg-primary/5' : ''
                                  }`}
                                >
                                  <TableCell>
                                    <div className="flex justify-center"><RankIcon rank={entry.finalRank} /></div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div>
                                        <p className="font-heading font-bold">{entry.entityName}</p>
                                        {entry.metadata?.unit && (
                                          <p className="text-xs text-muted-foreground">{entry.metadata.unit as string}</p>
                                        )}
                                        {entry.metadata?.memberCount && (
                                          <p className="text-xs text-muted-foreground">
                                            {entry.metadata.memberCount as number} members
                                            {entry.metadata?.poolSize ? ` (Top ${entry.metadata.poolSize as number} pool)` : ''}
                                          </p>
                                        )}
                                      </div>
                                      {isMe && <Badge variant="outline" className="text-xs border-primary/30 text-primary">You</Badge>}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center font-mono">{entry.componentA}</TableCell>
                                  <TableCell className="text-center font-mono">{entry.componentB}</TableCell>
                                  <TableCell className="text-center font-mono">{entry.componentC}</TableCell>
                                  <TableCell className="text-center font-mono">{entry.componentD}</TableCell>
                                  <TableCell className="text-center font-mono">{entry.componentE}</TableCell>
                                  {hasF && <TableCell className="text-center font-mono">{entry.componentF ?? '—'}</TableCell>}
                                  <TableCell className="text-center font-heading font-bold text-primary">{entry.totalScore}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile cards */}
                      <div className="md:hidden divide-y divide-border">
                        {data.map((entry) => {
                          const isMe = foundMe && entry.entityId === foundMe.entityId;
                          return (
                            <div
                              key={entry.entityId}
                              ref={isMe ? highlightedMobileRef : undefined}
                              className={`p-4 transition-colors ${
                                isMe
                                  ? 'bg-primary/15 ring-1 ring-primary/30'
                                  : entry.finalRank <= 3 ? 'bg-primary/5' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <RankIcon rank={entry.finalRank} />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-heading font-bold">{entry.entityName}</p>
                                    {isMe && <Badge variant="outline" className="text-xs border-primary/30 text-primary">You</Badge>}
                                  </div>
                                  {entry.metadata?.unit && <p className="text-xs text-muted-foreground">{entry.metadata.unit as string}</p>}
                                </div>
                                <Badge className="bg-primary/20 text-primary border-primary/30 text-lg px-3">
                                  {entry.totalScore}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                {['A', 'B', 'C', 'D', 'E', ...(hasF ? ['F'] : [])].map(c => (
                                  <div key={c} className="text-center bg-secondary/50 rounded p-1.5">
                                    <p className="text-muted-foreground">{COMPONENT_LABELS[c]}</p>
                                    <p className="font-mono font-bold">
                                      {c === 'A' ? entry.componentA : c === 'B' ? entry.componentB :
                                       c === 'C' ? entry.componentC : c === 'D' ? entry.componentD :
                                       c === 'E' ? entry.componentE : entry.componentF ?? '—'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      <Footer />
    </main>
  );
}
