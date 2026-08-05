import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Trophy,
  Medal,
  Award,
  Loader2,
  Users,
  TrendingUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  Dumbbell,
  Clock,
  RefreshCw,
  WifiOff,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Link2,
  CheckCircle2,
  Timer,
  Stethoscope,
} from 'lucide-react';
import { CHALLENGE_MINIMUMS } from '@/types/workout';
import { readCache, writeCache, formatCacheAge, DEFAULT_TTL_MS } from '@/lib/swrCache';
import { buildCsv, csvTimestamp, downloadCsv } from '@/lib/exportCsv';
import { copyCurrentViewLink } from '@/lib/shareView';
import { computeMovers, toSnapshot, type MoverSnapshot, type MoversResult } from '@/lib/topMovers';
import TopMoversPanel from '@/components/TopMoversPanel';
import SavedViewsMenu from '@/components/SavedViewsMenu';
import ParticipantProfileDrawer from '@/components/ParticipantProfileDrawer';
import { useToast } from '@/hooks/use-toast';


type SortMetric = 'overall' | 'cardio' | 'strength' | 'hiit' | 'tmarm' | 'name';
type SortDirection = 'desc' | 'asc';

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

interface Minimums {
  cardioMiles: number;
  strengthLbs: number;
  hiitMinutes: number;
  tmarmMinutes: number;
}

const PAGE_SIZES = [10, 25, 50, 100];

const METRIC_LABELS: Record<SortMetric, string> = {
  overall: 'Overall Completion',
  cardio: 'Cardio Miles',
  strength: 'Strength (lbs)',
  hiit: 'HIIT Minutes',
  tmarm: 'TMAR-M Minutes',
  name: 'Participant Name',
};

const CACHE_KEY = 'leaderboard:v1';
/** Last standings snapshot, used to compute Top Movers on the next refresh. */
const SNAPSHOT_KEY = 'leaderboard:snapshot:v1';

/** Friendly labels for saved-view descriptions. */
const VIEW_LABELS: Record<string, (value: string) => string> = {
  sort: v => `sorted by ${METRIC_LABELS[v as SortMetric] ?? v}`,
  dir: v => (v === 'asc' ? 'low to high' : 'high to low'),
  q: v => `search “${v}”`,
  page: v => `page ${v}`,
  size: v => `${v} per page`,
  auto: v => `auto-refresh ${v} min`,
};

interface Diagnostics {
  at: number;
  ok: boolean;
  status: number | null;
  message: string;
  attempts: number;
}


const AUTO_REFRESH_OPTIONS = [
  { value: '0', label: 'Auto-refresh off', ms: 0 },
  { value: '2', label: 'Every 2 minutes', ms: 2 * 60_000 },
  { value: '5', label: 'Every 5 minutes', ms: 5 * 60_000 },
  { value: '10', label: 'Every 10 minutes', ms: 10 * 60_000 },
];

interface CachedPayload {
  entries: LeaderboardEntry[];
  minimums: Minimums;
}

function normalize(data: unknown): CachedPayload {
  const raw = data as { data?: LeaderboardEntry[]; challengeMinimums?: Minimums } | undefined;
  const entries: LeaderboardEntry[] = (raw?.data ?? []).map((e: LeaderboardEntry) => ({
    rank: e.rank,
    userId: String(e.userId),
    name: e.name || 'Anonymous Soldier',
    unit: e.unit ?? null,
    cardioMiles: Number(e.cardioMiles) || 0,
    strengthLbs: Number(e.strengthLbs) || 0,
    hiitMinutes: Number(e.hiitMinutes) || 0,
    tmarmMinutes: Number(e.tmarmMinutes) || 0,
    cardioCompletion: Number(e.cardioCompletion) || 0,
    strengthCompletion: Number(e.strengthCompletion) || 0,
    hiitCompletion: Number(e.hiitCompletion) || 0,
    tmarmCompletion: Number(e.tmarmCompletion) || 0,
    overallCompletion: Number(e.overallCompletion) || 0,
  }));
  return { entries, minimums: raw?.challengeMinimums ?? CHALLENGE_MINIMUMS };
}

export default function Leaderboard() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initial view state is read from the URL so a shared link reproduces the view.
  const initial = useRef({
    sortMetric: (searchParams.get('sort') && searchParams.get('sort')! in METRIC_LABELS
      ? searchParams.get('sort')
      : 'overall') as SortMetric,
    sortDirection: (searchParams.get('dir') === 'asc' ? 'asc' : 'desc') as SortDirection,
    query: searchParams.get('q') ?? '',
    page: Math.max(1, Number(searchParams.get('page')) || 1),
    pageSize: PAGE_SIZES.includes(Number(searchParams.get('size'))) ? Number(searchParams.get('size')) : 25,
    auto: AUTO_REFRESH_OPTIONS.some(o => o.value === searchParams.get('auto'))
      ? (searchParams.get('auto') as string)
      : '0',
  }).current;

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [minimums, setMinimums] = useState<Minimums>(CHALLENGE_MINIMUMS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [servingStale, setServingStale] = useState(false);
  const [sortMetric, setSortMetric] = useState<SortMetric>(initial.sortMetric);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initial.sortDirection);
  const [query, setQuery] = useState(initial.query);
  const [page, setPage] = useState(initial.page);
  const [pageSize, setPageSize] = useState(initial.pageSize);

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(initial.auto);
  const [lastAutoAt, setLastAutoAt] = useState<number | null>(null);
  const [changedAt, setChangedAt] = useState<number | null>(null);
  const [nextRefreshIn, setNextRefreshIn] = useState<number | null>(null);
  const firstPageReset = useRef(true);

  // Top Movers + service diagnostics
  const [movers, setMovers] = useState<MoversResult | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const attempts = useRef(0);

  // Participant profile drawer
  const [profileFor, setProfileFor] = useState<{ userId: string; name: string; unit: string | null } | null>(null);

  const fetchLeaderboard = useCallback(async (opts: { isRefresh?: boolean; background?: boolean; auto?: boolean } = {}) => {
    if (opts.background || opts.isRefresh || opts.auto) setRefreshing(true);
    else setLoading(true);
    if (!opts.background) setError(null);
    attempts.current += 1;
    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-leaderboard');
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const payload = normalize(data);
      setLeaderboard((prev) => {
        if (opts.isRefresh || opts.background || opts.auto) {
          const changed = JSON.stringify(prev) !== JSON.stringify(payload.entries);
          setChangedAt(changed ? Date.now() : null);
        }
        return payload.entries;
      });
      setMinimums(payload.minimums);
      writeCache<CachedPayload>(CACHE_KEY, payload);
      setCachedAt(Date.now());
      setServingStale(false);
      if (opts.auto) setLastAutoAt(Date.now());
      setError(null);
      attempts.current = 0;
      setDiagnostics({
        at: Date.now(),
        ok: true,
        status: 200,
        message: `get-leaderboard returned ${payload.entries.length} participants`,
        attempts: 0,
      });

      // Top Movers: diff against the last snapshot, then store the new one.
      const snapshotEntries = payload.entries.map((e) => ({
        userId: e.userId,
        name: e.name,
        unit: e.unit,
        rank: e.rank,
        overallCompletion: e.overallCompletion,
      }));
      const previous = readCache<MoverSnapshot>(SNAPSHOT_KEY, DEFAULT_TTL_MS, Number.POSITIVE_INFINITY);
      const result = computeMovers(snapshotEntries, previous?.data ?? null);
      const snapshotChanged =
        !previous || JSON.stringify(previous.data.entries) !== JSON.stringify(snapshotEntries);
      if (result && snapshotChanged) setMovers(result);
      if (snapshotChanged) writeCache<MoverSnapshot>(SNAPSHOT_KEY, toSnapshot(snapshotEntries));
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as { status?: number }).status) || null
          : (err as { context?: { status?: number } })?.context?.status ?? null;
      setDiagnostics({
        at: Date.now(),
        ok: false,
        status,
        message: err instanceof Error ? err.message : 'Unknown network error',
        attempts: attempts.current,
      });
      // Resilience: fall back to the last known standings rather than an error wall.
      const cached = readCache<CachedPayload>(CACHE_KEY, DEFAULT_TTL_MS, Number.POSITIVE_INFINITY);
      if (cached) {
        setLeaderboard(cached.data.entries);
        setMinimums(cached.data.minimums);
        setCachedAt(cached.cachedAt);
        setServingStale(true);
      } else {
        setError(
          'We could not reach the DEFIT scoring service just now. Your logged workouts are safe — this only affects the standings view.'
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);


  // Stale-while-revalidate: paint cached standings instantly, refresh in background.
  useEffect(() => {
    const cached = readCache<CachedPayload>(CACHE_KEY);
    if (cached && !cached.isExpired) {
      setLeaderboard(cached.data.entries);
      setMinimums(cached.data.minimums);
      setCachedAt(cached.cachedAt);
      setLoading(false);
      if (cached.isStale) fetchLeaderboard({ background: true });
      return;
    }
    fetchLeaderboard();
  }, [fetchLeaderboard]);


  useEffect(() => {
    // JSON-LD schema markup
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'DEFIT Leaderboard – Challenge Rankings',
      description:
        'Track top performers in the 10-week Double Eagle Fitness Challenge. View individual and unit rankings by cardio, strength, HIIT, and TMAR-M completion.',
      url: window.location.href,
      isPartOf: {
        '@type': 'WebSite',
        name: 'DEFIT – Double Eagle Fitness Challenge',
        url: window.location.origin,
      },
      about: {
        '@type': 'SportsEvent',
        name: 'Double Eagle Fitness Challenge 2027',
        description: 'A 10-week fitness challenge for Army Reserve soldiers and supporters.',
        startDate: '2027-01-11',
        endDate: '2027-03-21',
      },
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const metricValue = (entry: LeaderboardEntry, metric: SortMetric) => {
    switch (metric) {
      case 'cardio':
        return entry.cardioMiles;
      case 'strength':
        return entry.strengthLbs;
      case 'hiit':
        return entry.hiitMinutes;
      case 'tmarm':
        return entry.tmarmMinutes;
      default:
        return entry.overallCompletion;
    }
  };

  // Filter + sort + rank
  const processed = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? leaderboard.filter(
          (e) =>
            e.name.toLowerCase().includes(q) || (e.unit ?? '').toLowerCase().includes(q)
        )
      : [...leaderboard];

    const dir = sortDirection === 'asc' ? 1 : -1;
    filtered.sort((a, b) =>
      sortMetric === 'name'
        ? a.name.localeCompare(b.name) * dir
        : (metricValue(a, sortMetric) - metricValue(b, sortMetric)) * dir
    );

    // Re-assign display ranks (ties share a rank)
    let currentRank = 1;
    let previousValue: number | string | null = null;

    return filtered.map((entry, index) => {
      const currentValue = sortMetric === 'name' ? entry.name : metricValue(entry, sortMetric);
      if (currentValue !== previousValue) currentRank = index + 1;
      previousValue = currentValue;
      return { ...entry, displayRank: currentRank };
    });
  }, [leaderboard, sortMetric, sortDirection, query]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEntries = processed.slice(pageStart, pageStart + pageSize);

  // Reset to first page whenever the view changes (but keep a shared link's page)
  useEffect(() => {
    if (firstPageReset.current) {
      firstPageReset.current = false;
      return;
    }
    setPage(1);
  }, [query, sortMetric, sortDirection, pageSize]);

  // Keep the URL in sync so the current view is shareable.
  useEffect(() => {
    const params = new URLSearchParams();
    if (sortMetric !== 'overall') params.set('sort', sortMetric);
    if (sortDirection !== 'desc') params.set('dir', sortDirection);
    if (query.trim()) params.set('q', query.trim());
    if (page > 1) params.set('page', String(page));
    if (pageSize !== 25) params.set('size', String(pageSize));
    if (autoRefresh !== '0') params.set('auto', autoRefresh);
    setSearchParams(params, { replace: true });
  }, [sortMetric, sortDirection, query, page, pageSize, autoRefresh, setSearchParams]);

  // Optional auto-refresh on a fixed interval, with a visible countdown.
  const intervalMs = AUTO_REFRESH_OPTIONS.find(o => o.value === autoRefresh)?.ms ?? 0;
  useEffect(() => {
    if (!intervalMs) {
      setNextRefreshIn(null);
      return;
    }
    let remaining = Math.round(intervalMs / 1000);
    setNextRefreshIn(remaining);
    const tick = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) remaining = Math.round(intervalMs / 1000);
      setNextRefreshIn(remaining);
    }, 1000);
    const timer = setInterval(() => {
      if (document.visibilityState !== 'hidden') fetchLeaderboard({ auto: true });
    }, intervalMs);
    return () => {
      clearInterval(tick);
      clearInterval(timer);
    };
  }, [intervalMs, fetchLeaderboard]);

  const handleShareLink = async () => {
    const url = await copyCurrentViewLink();
    toast(
      url
        ? { title: 'Link copied', description: 'This exact leaderboard view — search, sort, page size, and page — is on your clipboard.' }
        : { title: 'Could not copy link', description: 'Copy the address bar URL manually to share this view.', variant: 'destructive' }
    );
  };

  const handleExportCsv = () => {
    const headers = [
      'Rank', 'Participant', 'Unit',
      'Cardio Miles', `Cardio % of ${minimums.cardioMiles} mi`,
      'Strength Lbs', `Strength % of ${minimums.strengthLbs} lbs`,
      'HIIT Minutes', `HIIT % of ${minimums.hiitMinutes} min`,
      'TMAR-M Minutes', `TMAR-M % of ${minimums.tmarmMinutes} min`,
      'Overall Completion %',
    ];
    const rows = processed.map((e) => [
      e.displayRank,
      e.name,
      e.unit ?? '',
      e.cardioMiles.toFixed(1),
      e.cardioCompletion.toFixed(1),
      Math.round(e.strengthLbs),
      e.strengthCompletion.toFixed(1),
      Math.round(e.hiitMinutes),
      e.hiitCompletion.toFixed(1),
      Math.round(e.tmarmMinutes),
      e.tmarmCompletion.toFixed(1),
      e.overallCompletion.toFixed(1),
    ]);
    const meta = [
      ['DEFIT 2027 Leaderboard'],
      [`Sorted by: ${METRIC_LABELS[sortMetric]} (${sortDirection === 'desc' ? 'high to low' : 'low to high'})`],
      [query.trim() ? `Filter: "${query.trim()}"` : 'Filter: none'],
      [`Rows exported: ${rows.length}`],
      [`Exported: ${new Date().toLocaleString()}`],
      [],
    ];
    const csv = `${buildCsv(meta[0] as string[], meta.slice(1))}\r\n${buildCsv(headers, rows)}`;
    downloadCsv(`defit-leaderboard-${csvTimestamp()}.csv`, csv);
    toast({ title: 'Export ready', description: `${rows.length} row${rows.length === 1 ? '' : 's'} downloaded as CSV.` });
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
        return (
          <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">
            {rank}
          </span>
        );
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
                <p className="text-xs text-muted-foreground">
                  View the official rank-based scoring system with Individual, Team, Unit, and
                  Command levels.
                </p>
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
              <p className="text-2xl font-heading font-bold">
                {loading ? '—' : leaderboard.length}
              </p>
              <p className="text-xs text-muted-foreground">Participants</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-heading font-bold">{minimums.cardioMiles}</p>
              <p className="text-xs text-muted-foreground">Miles Target</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Dumbbell className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-heading font-bold">
                {(minimums.strengthLbs / 1000).toFixed(0)}K
              </p>
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

      {/* Top Movers since the previous cached standings */}
      <TopMoversPanel
        movers={movers}
        onSelect={(userId, name, unit) => setProfileFor({ userId, name, unit })}
      />



      {/* Disclaimer */}
      <section className="pb-6">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200/80">
                <strong className="text-amber-400">Disclaimer:</strong> Leaderboard values are
                preliminary until verified by USARC administrators. Rankings may change after
                validation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search, sort + page size controls */}
      <section className="pb-4">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <div className="glass rounded-xl p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by participant or unit…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 pr-10 bg-secondary/50 border-border"
                  aria-label="Search leaderboard by participant or unit"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                </div>

                <Select
                  value={sortMetric}
                  onValueChange={(v) => setSortMetric(v as SortMetric)}
                >
                  <SelectTrigger className="w-[190px] bg-secondary" aria-label="Sort metric">
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {(Object.keys(METRIC_LABELS) as SortMetric[]).map((m) => (
                      <SelectItem key={m} value={m}>
                        {METRIC_LABELS[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortDirection((d) => (d === 'desc' ? 'asc' : 'desc'))}
                  aria-label={`Toggle sort direction, currently ${sortDirection === 'desc' ? 'descending' : 'ascending'}`}
                >
                  {sortDirection === 'desc' ? (
                    <ArrowDown className="w-4 h-4 mr-2" />
                  ) : (
                    <ArrowUp className="w-4 h-4 mr-2" />
                  )}
                  {sortDirection === 'desc' ? 'High to low' : 'Low to high'}
                </Button>

                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="w-[140px] bg-secondary" aria-label="Rows per page">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {PAGE_SIZES.map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s} per page
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchLeaderboard({ isRefresh: true })}
                  disabled={loading || refreshing}
                >
                  {refreshing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refresh
                </Button>

                <Select value={autoRefresh} onValueChange={setAutoRefresh}>
                  <SelectTrigger className="w-[180px] bg-secondary" aria-label="Auto-refresh interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {AUTO_REFRESH_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCsv}
                  disabled={loading || processed.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>

                <Button variant="outline" size="sm" onClick={handleShareLink}>
                  <Link2 className="w-4 h-4 mr-2" />
                  Copy share link
                </Button>

                {cachedAt && (
                  <span
                    className={`text-xs ${servingStale ? 'text-amber-400' : 'text-muted-foreground'}`}
                    aria-live="polite"
                  >
                    {servingStale
                      ? `Showing last known standings (${formatCacheAge(cachedAt)}) — service unreachable`
                      : `Updated ${formatCacheAge(cachedAt)}`}
                  </span>
                )}
              </div>

              {/* Auto-refresh status */}
              {intervalMs > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs" aria-live="polite">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Timer className="w-3.5 h-3.5" />
                    Auto-refreshing {AUTO_REFRESH_OPTIONS.find((o) => o.value === autoRefresh)?.label.replace('Every', 'every').toLowerCase()}
                    {nextRefreshIn !== null && ` · next check in ${Math.floor(nextRefreshIn / 60)}:${String(nextRefreshIn % 60).padStart(2, '0')}`}
                  </span>
                  {refreshing ? (
                    <span className="inline-flex items-center gap-1.5 text-primary">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Checking for new scores…
                    </span>
                  ) : changedAt ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      New standings loaded {formatCacheAge(changedAt)}
                    </span>
                  ) : lastAutoAt ? (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Checked {formatCacheAge(lastAutoAt)} — no changes, showing cached standings
                    </span>
                  ) : null}
                </div>
              )}

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
                <div className="p-6 space-y-4" aria-busy="true" aria-live="polite">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    Loading leaderboard…
                  </div>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/5" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="p-12 text-center" role="alert">
                  <WifiOff className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-heading font-bold mb-2">
                    Standings Temporarily Unavailable
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">{error}</p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button onClick={() => fetchLeaderboard({ isRefresh: true })} disabled={refreshing}>
                      {refreshing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Retry
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/report-issue">Report a Problem</Link>
                    </Button>
                  </div>
                </div>
              ) : processed.length === 0 ? (
                <div className="p-12 text-center">
                  <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-heading font-bold mb-2">
                    {query ? 'No Matches Found' : 'No Participants Yet'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {query
                      ? `Nothing matched “${query}”. Try another participant or unit.`
                      : 'Be the first to log workouts and climb the leaderboard!'}
                  </p>
                  {query ? (
                    <Button variant="outline" onClick={() => setQuery('')}>
                      Clear Search
                    </Button>
                  ) : (
                    <Button asChild variant="hero">
                      <Link to="/register">Join the Challenge</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">
                      Showing {pageStart + 1}–{pageStart + pageEntries.length} of{' '}
                      {processed.length}
                      {query ? ' matches' : ' participants'} · sorted by{' '}
                      {METRIC_LABELS[sortMetric]}
                    </span>
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="w-16">Rank</TableHead>
                          <TableHead>Participant</TableHead>
                          <TableHead className="text-right">Cardio</TableHead>
                          <TableHead className="text-right">Strength</TableHead>
                          <TableHead className="text-right">HIIT</TableHead>
                          <TableHead className="text-right">TMAR-M</TableHead>
                          <TableHead className="text-right">Overall</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pageEntries.map((entry) => (
                          <TableRow
                            key={entry.userId}
                            className={`border-border ${
                              entry.displayRank <= 3 ? getRankBadgeClass(entry.displayRank) : ''
                            }`}
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
                              <p className="font-mono">{entry.cardioMiles.toFixed(1)} mi</p>
                              <p className="text-xs text-muted-foreground">
                                {entry.cardioCompletion.toFixed(0)}%
                              </p>
                            </TableCell>
                            <TableCell className="text-right">
                              <p className="font-mono">
                                {entry.strengthLbs.toLocaleString()} lbs
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {entry.strengthCompletion.toFixed(0)}%
                              </p>
                            </TableCell>
                            <TableCell className="text-right">
                              <p className="font-mono">{entry.hiitMinutes} min</p>
                              <p className="text-xs text-muted-foreground">
                                {entry.hiitCompletion.toFixed(0)}%
                              </p>
                            </TableCell>
                            <TableCell className="text-right">
                              <p className="font-mono">{entry.tmarmMinutes} min</p>
                              <p className="text-xs text-muted-foreground">
                                {entry.tmarmCompletion.toFixed(0)}%
                              </p>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-3 justify-end">
                                <Progress value={entry.overallCompletion} className="w-16 h-2" />
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
                    {pageEntries.map((entry) => (
                      <div
                        key={entry.userId}
                        className={`p-4 ${
                          entry.displayRank <= 3 ? getRankBadgeClass(entry.displayRank) : ''
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">{getRankIcon(entry.displayRank)}</div>
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
                                <p className="font-mono">
                                  {entry.strengthLbs.toLocaleString()} lbs
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">HIIT</p>
                                <p className="font-mono">{entry.hiitMinutes} min</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">TMAR-M</p>
                                <p className="font-mono">{entry.tmarmMinutes} min</p>
                              </div>
                            </div>
                            <Progress value={entry.overallCompletion} className="mt-3 h-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="p-4 border-t border-border flex items-center justify-between gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
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
                    <strong className="text-foreground">Overall Completion</strong> is calculated
                    as a weighted average:
                  </p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>
                      • Cardio: <strong className="text-primary">30%</strong> (
                      {minimums.cardioMiles} miles target)
                    </li>
                    <li>
                      • Strength: <strong className="text-primary">30%</strong> (
                      {minimums.strengthLbs.toLocaleString()} lbs target)
                    </li>
                    <li>
                      • HIIT: <strong className="text-primary">20%</strong> (
                      {minimums.hiitMinutes} minutes target)
                    </li>
                    <li>
                      • TMAR-M: <strong className="text-primary">20%</strong> (
                      {minimums.tmarmMinutes} minutes target)
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-muted-foreground mb-2">
                    <strong className="text-foreground">Ranking Rules:</strong>
                  </p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Each category maxes at 100%</li>
                    <li>• Tied scores receive the same rank</li>
                    <li>• Sort by any metric and direction using the controls above</li>
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
