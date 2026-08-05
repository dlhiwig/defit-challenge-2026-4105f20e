import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Trophy, Medal, Award, Loader2, Info, Users, Shield, BookOpen, Search, X, UserCheck,
  RefreshCw, WifiOff, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight,
  CalendarDays, FlaskConical, Download, Link2, Columns3, Minus,
} from 'lucide-react';
import type { RankEntry, RankingLevel } from '@/lib/scoring';
import { RANKING_LEVELS, COMPONENT_LABELS } from '@/lib/scoring';
import { readCache, writeCache, formatCacheAge, DEFAULT_TTL_MS } from '@/lib/swrCache';
import { buildCsv, csvTimestamp, downloadCsv } from '@/lib/exportCsv';
import { copyCurrentViewLink } from '@/lib/shareView';
import {
  CHALLENGE_LABEL, CHALLENGE_DATE_RANGE, CHALLENGE_START, CHALLENGE_END,
  CHALLENGE_WEEKS, cycleStatus,
} from '@/lib/challenge';


type Dataset = 'cycle' | 'sample';

interface RankingsPayload {
  data: RankEntry[];
  total: number;
  datasetStart?: string | null;
  datasetEnd?: string | null;
}


type SortKey = 'rank' | 'score' | 'name' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
type SortDirection = 'asc' | 'desc';

const SORT_LABELS: Record<SortKey, string> = {
  rank: 'Overall Rank',
  score: 'Total Score',
  name: 'Name',
  A: 'Cardio Rank',
  B: 'Resistance Rank',
  C: 'HIIT Rank',
  D: 'TMAR-M Rank',
  E: 'Consistency Rank',
  F: 'Completion Rank',
};

const PAGE_SIZES = [10, 25, 50, 100];

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
  return <span className="font-bold text-muted-foreground">{rank}</span>;
}

function sortValue(entry: RankEntry, key: SortKey): number | string {
  switch (key) {
    case 'score': return entry.totalScore;
    case 'name': return entry.entityName.toLowerCase();
    case 'A': return entry.componentA;
    case 'B': return entry.componentB;
    case 'C': return entry.componentC;
    case 'D': return entry.componentD;
    case 'E': return entry.componentE;
    case 'F': return entry.componentF ?? Number.MAX_SAFE_INTEGER;
    default: return entry.finalRank;
  }
}

export default function Rankings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initial view state comes from the URL so shared links reproduce the exact table.
  const initial = useRef({
    level: (RANKING_LEVELS.some(l => l.value === searchParams.get('level'))
      ? searchParams.get('level')
      : 'individual') as RankingLevel,
    dataset: (searchParams.get('dataset') === 'sample' ? 'sample' : 'cycle') as Dataset,
    sortKey: (searchParams.get('sort') && searchParams.get('sort')! in SORT_LABELS
      ? searchParams.get('sort')
      : 'rank') as SortKey,
    sortDirection: (searchParams.get('dir') === 'desc' ? 'desc' : 'asc') as SortDirection,
    page: Math.max(1, Number(searchParams.get('page')) || 1),
    pageSize: PAGE_SIZES.includes(Number(searchParams.get('size'))) ? Number(searchParams.get('size')) : 25,
    q: searchParams.get('q') ?? '',
    compare: searchParams.get('compare') === '1',
  }).current;

  const [level, setLevel] = useState<RankingLevel>(initial.level);
  const [dataset, setDataset] = useState<Dataset>(initial.dataset);
  const [data, setData] = useState<RankEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [windowRange, setWindowRange] = useState<{ start?: string | null; end?: string | null }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [servingStale, setServingStale] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState(initial.q);
  const [searchTotal, setSearchTotal] = useState<number | undefined>();
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sort + pagination
  const [sortKey, setSortKey] = useState<SortKey>(initial.sortKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initial.sortDirection);
  const [page, setPage] = useState(initial.page);
  const [pageSize, setPageSize] = useState(initial.pageSize);

  // Compare mode: 2027 cycle vs sample dataset, side by side
  const [compare, setCompare] = useState(initial.compare);
  const [compareData, setCompareData] = useState<RankEntry[] | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Find My Ranking state
  const [foundMe, setFoundMe] = useState<RankEntry | null>(null);
  const [findingMe, setFindingMe] = useState(false);
  const highlightedRef = useRef<HTMLTableRowElement | null>(null);
  const highlightedMobileRef = useRef<HTMLDivElement | null>(null);

  const cacheKey = `rankings:v1:${dataset}:${level}`;
  const otherDataset: Dataset = dataset === 'cycle' ? 'sample' : 'cycle';
  const datasetLabel = (d: Dataset) => (d === 'cycle' ? '2027 Cycle' : 'Sample Data');


  const applyPayload = useCallback((payload: RankingsPayload) => {
    setData(payload.data);
    setTotal(payload.total);
    setWindowRange({ start: payload.datasetStart, end: payload.datasetEnd });
  }, []);

  const fetchRankings = useCallback(
    async (opts: { search?: string; findMe?: string; refresh?: boolean; background?: boolean } = {}) => {
      if (opts.refresh || opts.background) setRefreshing(true);
      else setLoading(true);
      if (!opts.background) setError(null);
      const isPlain = !opts.search && !opts.findMe;
      try {
        const { data: res, error: fnError } = await supabase.functions.invoke('get-rankings', {
          body: {
            level,
            dataset,
            limit: 500,
            search: opts.search ?? '',
            findMe: opts.findMe ?? '',
          },
        });
        if (fnError) throw fnError;
        if (res?.error) throw new Error(res.error);

        const payload: RankingsPayload = {
          data: (res?.data ?? []) as RankEntry[],
          total: res?.total ?? 0,
          datasetStart: res?.datasetStart ?? null,
          datasetEnd: res?.datasetEnd ?? null,
        };
        applyPayload(payload);
        setSearchTotal(opts.search ? res?.searchTotal ?? res?.data?.length : undefined);
        if (opts.findMe) setFoundMe((res?.foundMe as RankEntry) ?? null);
        if (isPlain) {
          writeCache<RankingsPayload>(cacheKey, payload);
          setCachedAt(Date.now());
          setServingStale(false);
        }
        setError(null);
      } catch (err) {
        console.error('Rankings error:', err);
        // Resilience: prefer the last known rankings over an error wall.
        const cached = readCache<RankingsPayload>(cacheKey, DEFAULT_TTL_MS, Number.POSITIVE_INFINITY);
        if (cached) {
          applyPayload(cached.data);
          setCachedAt(cached.cachedAt);
          setServingStale(true);
        } else {
          setError(
            'The DEFIT ranking service did not respond. Scores are still recorded — this only affects the rankings view.'
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setIsSearching(false);
        setFindingMe(false);
      }
    },
    [level, dataset, cacheKey, applyPayload]
  );

  const firstLoad = useRef(true);
  const firstPageReset = useRef(true);

  // Stale-while-revalidate on level/dataset change
  useEffect(() => {
    if (firstLoad.current) {
      // Honour URL-provided view state on first load instead of resetting it.
      firstLoad.current = false;
      const q = initial.q.trim();
      if (q) {
        setIsSearching(true);
        fetchRankings({ search: q });
        return;
      }
    } else {
      setSearchQuery('');
      setFoundMe(null);
      setSearchTotal(undefined);
      setPage(1);
      setSortKey('rank');
      setSortDirection('asc');
      setServingStale(false);
      setCachedAt(null);
    }

    const cached = readCache<RankingsPayload>(cacheKey);
    if (cached && !cached.isExpired) {
      applyPayload(cached.data);
      setCachedAt(cached.cachedAt);
      setLoading(false);
      setError(null);
      if (cached.isStale) fetchRankings({ background: true });
      return;
    }
    fetchRankings();
  }, [level, dataset, cacheKey, fetchRankings, applyPayload, initial.q]);

  // Compare mode pulls the counterpart dataset for the same level.
  useEffect(() => {
    if (!compare) {
      setCompareData(null);
      setCompareError(null);
      return;
    }
    let cancelled = false;
    setCompareLoading(true);
    setCompareError(null);
    (async () => {
      try {
        const { data: res, error: fnError } = await supabase.functions.invoke('get-rankings', {
          body: { level, dataset: otherDataset, limit: 500, search: '', findMe: '' },
        });
        if (fnError) throw fnError;
        if (res?.error) throw new Error(res.error);
        if (!cancelled) setCompareData((res?.data ?? []) as RankEntry[]);
      } catch (err) {
        console.error('Compare dataset error:', err);
        if (!cancelled) {
          setCompareData(null);
          setCompareError(`Could not load the ${datasetLabel(otherDataset)} standings to compare against.`);
        }
      } finally {
        if (!cancelled) setCompareLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compare, level, otherDataset]);

  useEffect(() => {
    if (firstPageReset.current) {
      firstPageReset.current = false;
      return;
    }
    setPage(1);
  }, [sortKey, sortDirection, pageSize, searchQuery]);

  // Keep the URL in sync so the current view is shareable.
  useEffect(() => {
    const params = new URLSearchParams();
    if (level !== 'individual') params.set('level', level);
    if (dataset !== 'cycle') params.set('dataset', dataset);
    if (sortKey !== 'rank') params.set('sort', sortKey);
    if (sortDirection !== 'asc') params.set('dir', sortDirection);
    if (page > 1) params.set('page', String(page));
    if (pageSize !== 25) params.set('size', String(pageSize));
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (compare) params.set('compare', '1');
    setSearchParams(params, { replace: true });
  }, [level, dataset, sortKey, sortDirection, page, pageSize, searchQuery, compare, setSearchParams]);


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
      fetchRankings({ search: value.trim() });
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
    await fetchRankings({ findMe: user.id, search: searchQuery.trim() || undefined });
  };

  useEffect(() => {
    if (!foundMe) return;
    const node = highlightedRef.current ?? highlightedMobileRef.current;
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [foundMe, data]);

  const hasF = level !== 'individual';
  const isSearchActive = searchQuery.trim().length > 0;

  const sorted = useMemo(() => {
    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (typeof av === 'string' || typeof bv === 'string') {
        return String(av).localeCompare(String(bv)) * dir;
      }
      return (av - bv) * dir;
    });
  }, [data, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEntries = sorted.slice(pageStart, pageStart + pageSize);

  const sortKeys: SortKey[] = ['rank', 'score', 'name', 'A', 'B', 'C', 'D', 'E', ...(hasF ? (['F'] as SortKey[]) : [])];

  const status = cycleStatus();
  const fmt = (d: Date | string) =>
    new Date(typeof d === 'string' ? `${d}T00:00:00` : d).toLocaleDateString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  const sampleRangeLabel =
    windowRange.start && windowRange.end ? `${fmt(windowRange.start)} – ${fmt(windowRange.end)}` : 'all logged activity';

  // entityId → counterpart entry from the other dataset (compare mode)
  const compareMap = useMemo(() => {
    const map = new Map<string, RankEntry>();
    (compareData ?? []).forEach(e => map.set(e.entityId, e));
    return map;
  }, [compareData]);

  const comparedCount = useMemo(
    () => (compareData ? sorted.filter(e => compareMap.has(e.entityId)).length : 0),
    [compareData, compareMap, sorted]
  );

  const handleShareLink = async () => {
    const url = await copyCurrentViewLink();
    toast(
      url
        ? { title: 'Link copied', description: 'This exact rankings view — filters, sort, and page — is on your clipboard.' }
        : { title: 'Could not copy link', description: 'Copy the address bar URL manually to share this view.', variant: 'destructive' }
    );
  };

  const handleExportCsv = () => {
    const componentKeys = ['A', 'B', 'C', 'D', 'E', ...(hasF ? ['F'] : [])];
    const headers = [
      'Rank', 'Name', 'Unit', ...componentKeys.map(c => COMPONENT_LABELS[c]), 'Total Score',
    ];
    if (compare) {
      headers.push(
        `${datasetLabel(otherDataset)} Rank`,
        `${datasetLabel(otherDataset)} Score`,
        'Rank Change',
        'Score Change'
      );
    }

    const componentsOf = (e: RankEntry) => [
      e.componentA, e.componentB, e.componentC, e.componentD, e.componentE,
      ...(hasF ? [e.componentF ?? ''] : []),
    ];

    const rows = sorted.map(e => {
      const row: (string | number)[] = [
        e.finalRank,
        e.entityName,
        (e.metadata?.unit as string) ?? '',
        ...componentsOf(e),
        e.totalScore,
      ];
      if (compare) {
        const other = compareMap.get(e.entityId);
        row.push(
          other ? other.finalRank : '',
          other ? other.totalScore : '',
          other ? e.finalRank - other.finalRank : '',
          other ? e.totalScore - other.totalScore : ''
        );
      }
      return row;
    });

    const meta = [
      [`DEFIT ${level} rankings — ${datasetLabel(dataset)}`],
      [dataset === 'cycle' ? `Scoring window: ${CHALLENGE_DATE_RANGE}` : `Sample window: ${sampleRangeLabel}`],
      [`Sorted by: ${SORT_LABELS[sortKey]} (${sortDirection === 'asc' ? 'best first' : 'worst first'})`],
      [isSearchActive ? `Filter: "${searchQuery.trim()}"` : 'Filter: none'],
      [`Rows exported: ${rows.length}`],
      [`Exported: ${new Date().toLocaleString()}`],
      [],
    ];

    const csv = `${buildCsv(meta[0] as string[], meta.slice(1))}\r\n${buildCsv(headers, rows)}`;
    downloadCsv(`defit-rankings-${level}-${dataset}-${csvTimestamp()}.csv`, csv);
    toast({ title: 'Export ready', description: `${rows.length} row${rows.length === 1 ? '' : 's'} downloaded as CSV.` });
  };


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

      {/* Dataset toggle */}
      <section className="pb-6">
        <div className="container px-4 max-w-4xl mx-auto">
          <div className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex items-start gap-3">
              {dataset === 'cycle'
                ? <CalendarDays className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                : <FlaskConical className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />}
              <div>
                <p className="text-sm font-heading font-bold">
                  {dataset === 'cycle' ? `${CHALLENGE_LABEL} scoring cycle` : 'Sample dataset (preview)'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dataset === 'cycle'
                    ? `Scoring window ${CHALLENGE_DATE_RANGE} · ${CHALLENGE_WEEKS} weeks`
                    : `Every log on record, ignoring cycle dates · ${sampleRangeLabel}`}
                </p>
              </div>
            </div>
            <div className="flex rounded-lg border border-border overflow-hidden self-start" role="group" aria-label="Dataset">
              <button
                type="button"
                onClick={() => setDataset('cycle')}
                aria-pressed={dataset === 'cycle'}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  dataset === 'cycle' ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                2027 Cycle
              </button>
              <button
                type="button"
                onClick={() => setDataset('sample')}
                aria-pressed={dataset === 'sample'}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  dataset === 'sample' ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                Sample Data
              </button>
            </div>
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
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, unit, or command…"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-10 bg-secondary/50 border-border"
                  aria-label="Search rankings"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {level === 'individual' && (
                user ? (
                  <Button variant="outline" onClick={handleFindMe} disabled={findingMe} className="shrink-0">
                    {findingMe ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserCheck className="w-4 h-4 mr-2" />}
                    Find My Ranking
                  </Button>
                ) : (
                  <Button variant="outline" asChild className="shrink-0">
                    <Link to="/auth"><UserCheck className="w-4 h-4 mr-2" />Sign in to find your ranking</Link>
                  </Button>
                )
              )}
            </div>

            {/* Sort + page size controls */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Sort by:</span>
              </div>
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <SelectTrigger className="w-[180px] bg-secondary" aria-label="Sort field">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {sortKeys.map(k => (
                    <SelectItem key={k} value={k}>{SORT_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'))}
                aria-label={`Toggle sort direction, currently ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
              >
                {sortDirection === 'asc' ? <ArrowUp className="w-4 h-4 mr-2" /> : <ArrowDown className="w-4 h-4 mr-2" />}
                {sortDirection === 'asc' ? 'Best first' : 'Worst first'}
              </Button>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="w-[140px] bg-secondary" aria-label="Rows per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {PAGE_SIZES.map(s => (
                    <SelectItem key={s} value={String(s)}>{s} per page</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchRankings({ search: searchQuery.trim() || undefined, refresh: true })}
                disabled={loading || refreshing}
              >
                {refreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Refresh
              </Button>
              <Button
                variant={compare ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCompare(c => !c)}
                aria-pressed={compare}
              >
                <Columns3 className="w-4 h-4 mr-2" />
                Compare datasets
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                disabled={loading || sorted.length === 0}
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
                    ? `Showing last known rankings (${formatCacheAge(cachedAt)}) — service unreachable`
                    : `Updated ${formatCacheAge(cachedAt)}`}
                </span>
              )}
            </div>

            {/* Compare mode banner */}
            {compare && (
              <div className="mb-6 p-4 rounded-xl bg-secondary/40 border border-border" aria-live="polite">
                <div className="flex items-start gap-3">
                  <Columns3 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-heading font-bold">
                      Compare: {datasetLabel(dataset)} vs {datasetLabel(otherDataset)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {compareLoading
                        ? `Loading ${datasetLabel(otherDataset)} standings…`
                        : compareError
                          ? compareError
                          : `Each row shows the same participant in both datasets. Change columns are ${datasetLabel(dataset)} minus ${datasetLabel(otherDataset)} — green means better (lower) here. ${comparedCount} of ${sorted.length} matched.`}
                    </p>
                  </div>
                </div>
              </div>
            )}




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
                    <div className="p-6 space-y-4" aria-busy="true" aria-live="polite">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        {isSearching ? 'Searching…' : `Loading ${l.label} rankings…`}
                      </div>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-1/5" />
                          </div>
                          <Skeleton className="h-4 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : error ? (
                    <div className="p-12 text-center" role="alert">
                      <WifiOff className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-heading font-bold mb-2">Rankings Temporarily Unavailable</h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-6">{error}</p>
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <Button
                          onClick={() => fetchRankings({ search: searchQuery.trim() || undefined, refresh: true })}
                          disabled={refreshing}
                        >
                          {refreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                          Retry
                        </Button>
                        <Button variant="outline" asChild>
                          <Link to="/report-issue">Report a Problem</Link>
                        </Button>
                      </div>
                    </div>
                  ) : sorted.length === 0 ? (
                    <div className="p-12 text-center max-w-xl mx-auto">
                      {isSearchActive ? (
                        <>
                          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-heading font-bold mb-2">No Participants Found</h3>
                          <p className="text-muted-foreground">
                            No matches for "{searchQuery}". Try a different name.
                          </p>
                          <Button variant="outline" size="sm" className="mt-4" onClick={clearSearch}>
                            Clear Search
                          </Button>
                        </>
                      ) : (
                        <>
                          <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-heading font-bold mb-2">
                            {status === 'upcoming' ? `${CHALLENGE_LABEL} Has Not Started Yet` : 'No Rankings Yet'}
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            {dataset === 'cycle' ? (
                              <>
                                Only activity logged between <strong className="text-foreground">{fmt(CHALLENGE_START)}</strong> and{' '}
                                <strong className="text-foreground">{fmt(CHALLENGE_END)}</strong> counts toward{' '}
                                {CHALLENGE_LABEL} rankings ({CHALLENGE_WEEKS} scoring weeks).{' '}
                                {status === 'upcoming'
                                  ? `Rankings publish after the first week of the cycle, once verified workouts start landing on ${fmt(CHALLENGE_START)}.`
                                  : l.value === 'individual'
                                    ? 'No participant has logged verified activity inside that window yet.'
                                    : `No ${l.label.toLowerCase()}s meet the minimum roster and activity requirements yet.`}
                              </>
                            ) : (
                              <>
                                The sample dataset has no {l.value === 'individual' ? 'logged activity' : `${l.label.toLowerCase()}s`} to
                                rank. Switch back to the {CHALLENGE_LABEL} cycle for live standings.
                              </>
                            )}
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-3">
                            {dataset === 'cycle' ? (
                              <Button variant="outline" size="sm" onClick={() => setDataset('sample')}>
                                <FlaskConical className="w-4 h-4 mr-2" />Preview sample dataset
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => setDataset('cycle')}>
                                <CalendarDays className="w-4 h-4 mr-2" />Back to 2027 cycle
                              </Button>
                            )}
                            <Button size="sm" asChild>
                              <Link to="/dashboard">Log a workout</Link>
                            </Button>
                          </div>
                        </>
                      )}
                    </div>

                  ) : (
                    <>
                      <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">
                          {isSearchActive
                            ? `Search results (${searchTotal ?? sorted.length} matches)`
                            : `${total} ranked`}
                          {' · '}Showing {pageStart + 1}–{pageStart + pageEntries.length} · sorted by {SORT_LABELS[sortKey]}
                        </span>
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
                            {pageEntries.map((entry) => {
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
                        {pageEntries.map((entry) => {
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

                      {/* Pagination */}
                      <div className="p-4 border-t border-border flex items-center justify-between gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
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
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage >= totalPages}
                        >
                          Next
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
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
