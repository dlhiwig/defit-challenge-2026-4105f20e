import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Loader2, RefreshCw, WifiOff, Activity, Dumbbell, Timer, HeartPulse,
  CheckCircle2, Clock, CalendarDays, FlaskConical, ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CHALLENGE_LABEL } from '@/lib/challenge';

export type ProfileDataset = 'cycle' | 'sample';

type Pillar = 'cardio' | 'strength' | 'hiit' | 'tmarm';

interface HistoryEntry {
  id: string;
  pillar: Pillar;
  date: string;
  summary: string;
  detail: string | null;
  value: number;
  unit: string;
  verified: boolean;
  inWindow: boolean;
  weekNumber: number | null;
}

interface ProfilePayload {
  participant: { userId: string; name: string; unit: string | null; unitCategory: string | null };
  dataset: ProfileDataset;
  window: { start: string; end: string; weeks: number };
  minimums: Record<Pillar, number>;
  weights: Record<Pillar, number>;
  weeklyCaps: { hiit: number; tmarm: number };
  totals: Record<Pillar, number>;
  rawTotals: Record<Pillar, number>;
  completion: Record<Pillar, number>;
  overallCompletion: number;
  activeWeeks: number;
  weekly: Record<Pillar, number[]>;
  history: HistoryEntry[];
  logCounts: { total: number; inWindow: number; verified: number; pending: number };
}

const PILLAR_META: Record<Pillar, { label: string; unit: string; icon: typeof Activity }> = {
  cardio: { label: 'Cardio', unit: 'mi', icon: Activity },
  strength: { label: 'Resistance', unit: 'lbs', icon: Dumbbell },
  hiit: { label: 'HIIT', unit: 'min', icon: HeartPulse },
  tmarm: { label: 'TMAR-M', unit: 'min', icon: Timer },
};

const PILLAR_ORDER: Pillar[] = ['cardio', 'strength', 'hiit', 'tmarm'];

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtValue = (pillar: Pillar, value: number) =>
  pillar === 'cardio' ? value.toFixed(1) : Math.round(value).toLocaleString();

export interface ParticipantProfileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** auth user id of the participant */
  userId: string | null;
  /** Fallback header text while the profile loads */
  fallbackName?: string;
  fallbackUnit?: string | null;
  dataset: ProfileDataset;
}

export default function ParticipantProfileDrawer({
  open, onOpenChange, userId, fallbackName, fallbackUnit, dataset,
}: ParticipantProfileDrawerProps) {
  const [data, setData] = useState<ProfilePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pillarFilter, setPillarFilter] = useState<Pillar | 'all'>('all');

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: fnError } = await supabase.functions.invoke('get-participant-profile', {
        body: { userId, dataset },
      });
      if (fnError) throw fnError;
      if (res?.error) throw new Error(res.error);
      setData(res as ProfilePayload);
    } catch (err) {
      console.error('Participant profile error:', err);
      setData(null);
      setError('We could not load this participant’s history right now. Their logged workouts are unaffected.');
    } finally {
      setLoading(false);
    }
  }, [userId, dataset]);

  useEffect(() => {
    if (!open || !userId) return;
    setPillarFilter('all');
    load();
  }, [open, userId, load]);

  const history = useMemo(() => {
    if (!data) return [];
    return pillarFilter === 'all' ? data.history : data.history.filter(h => h.pillar === pillarFilter);
  }, [data, pillarFilter]);

  const name = data?.participant.name ?? fallbackName ?? 'Participant';
  const unit = data?.participant.unit ?? fallbackUnit ?? null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-card border-border">
        <SheetHeader className="text-left">
          <SheetTitle className="font-heading text-2xl">{name}</SheetTitle>
          <SheetDescription asChild>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {unit && <span className="text-muted-foreground">{unit}</span>}
              <Badge variant="outline" className="gap-1 border-border">
                {dataset === 'cycle'
                  ? <><CalendarDays className="w-3 h-3" />{CHALLENGE_LABEL} cycle</>
                  : <><FlaskConical className="w-3 h-3" />Sample data</>}
              </Badge>
              {data && (
                <span className="text-muted-foreground">
                  Scoring window {fmtDate(data.window.start)} – {fmtDate(data.window.end)} · {data.window.weeks} weeks
                </span>
              )}
            </div>
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="mt-6 space-y-4" aria-busy="true">
            <Skeleton className="h-20 w-full rounded-xl" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="mt-10 text-center" role="alert">
            <WifiOff className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">{error}</p>
            <Button onClick={load}>
              <RefreshCw className="w-4 h-4 mr-2" />Retry now
            </Button>
          </div>
        ) : data ? (
          <div className="mt-6 space-y-6">
            {/* Overall */}
            <div className="rounded-xl border border-border bg-secondary/30 p-4">
              <div className="flex items-end justify-between gap-3 mb-2">
                <div>
                  <p className="text-xs text-muted-foreground">Overall completion</p>
                  <p className="text-3xl font-heading font-bold text-primary">
                    {data.overallCompletion.toFixed(1)}%
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{data.activeWeeks} of {data.window.weeks} weeks active</p>
                  <p>{data.logCounts.inWindow} of {data.logCounts.total} logs in window</p>
                </div>
              </div>
              <Progress value={data.overallCompletion} className="h-2" />
              <div className="flex flex-wrap gap-3 mt-3 text-xs">
                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />{data.logCounts.verified} verified
                </span>
                <span className="inline-flex items-center gap-1.5 text-amber-400">
                  <Clock className="w-3.5 h-3.5" />{data.logCounts.pending} pending verification
                </span>
              </div>
            </div>

            {/* Scoring breakdown */}
            <div>
              <h3 className="font-heading font-bold text-sm mb-3">Scoring breakdown</h3>
              <div className="space-y-3">
                {PILLAR_ORDER.map(p => {
                  const meta = PILLAR_META[p];
                  const Icon = meta.icon;
                  const capped = (p === 'hiit' || p === 'tmarm') && data.rawTotals[p] > data.totals[p];
                  return (
                    <div key={p} className="rounded-xl border border-border p-3">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="inline-flex items-center gap-2 text-sm font-medium">
                          <Icon className="w-4 h-4 text-primary" />
                          {meta.label}
                          <span className="text-xs text-muted-foreground">
                            {Math.round(data.weights[p] * 100)}% weight
                          </span>
                        </span>
                        <span className="font-mono text-sm">
                          {fmtValue(p, data.totals[p])} / {data.minimums[p].toLocaleString()} {meta.unit}
                        </span>
                      </div>
                      <Progress value={data.completion[p]} className="h-2" />
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{data.completion[p].toFixed(1)}% of the minimum</span>
                        {capped && (
                          <span className="text-amber-400">
                            {fmtValue(p, data.rawTotals[p])} logged · weekly cap{' '}
                            {p === 'hiit' ? data.weeklyCaps.hiit : data.weeklyCaps.tmarm} min applied
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Workout history */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="font-heading font-bold text-sm">
                  Workout history <span className="text-muted-foreground font-normal">({history.length})</span>
                </h3>
                <div className="flex flex-wrap gap-1">
                  {(['all', ...PILLAR_ORDER] as (Pillar | 'all')[]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPillarFilter(p)}
                      aria-pressed={pillarFilter === p}
                      className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                        pillarFilter === p
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {p === 'all' ? 'All' : PILLAR_META[p].label}
                    </button>
                  ))}
                </div>
              </div>

              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No {pillarFilter === 'all' ? '' : `${PILLAR_META[pillarFilter as Pillar].label} `}logs on record for this
                  participant.
                </p>
              ) : (
                <ul className="divide-y divide-border rounded-xl border border-border">
                  {history.map(h => {
                    const Icon = PILLAR_META[h.pillar].icon;
                    return (
                      <li key={`${h.pillar}-${h.id}`} className="p-3 flex items-start gap-3">
                        <Icon className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-sm font-medium truncate">{h.summary}</p>
                            <span className="font-mono text-sm whitespace-nowrap">
                              {fmtValue(h.pillar, h.value)} {h.unit}
                            </span>
                          </div>
                          {h.detail && (
                            <p className="text-xs text-muted-foreground truncate">{h.detail}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                            <span className="text-muted-foreground">{fmtDate(h.date)}</span>
                            {h.weekNumber ? (
                              <span className="text-muted-foreground">Week {h.weekNumber}</span>
                            ) : (
                              <span className="text-amber-400">Outside scoring window</span>
                            )}
                            {h.verified ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" />Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-400">
                                <Clock className="w-3 h-3" />Pending
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pb-4">
              <p className="text-xs text-muted-foreground">
                Totals are preliminary until verified by USARC administrators.
              </p>
              <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Refresh
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
