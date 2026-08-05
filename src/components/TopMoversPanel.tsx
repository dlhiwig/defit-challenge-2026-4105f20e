import { TrendingUp, TrendingDown, Sparkles, ArrowUp, ArrowDown, UserPlus, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCacheAge } from '@/lib/swrCache';
import type { Mover, MoversResult } from '@/lib/topMovers';

interface TopMoversPanelProps {
  movers: MoversResult | null;
  /** Called when a participant row is selected, to open their profile drawer. */
  onSelect?: (userId: string, name: string, unit: string | null) => void;
}

function MoverRow({
  mover, mode, onSelect,
}: { mover: Mover; mode: 'rank' | 'score' | 'new'; onSelect?: TopMoversPanelProps['onSelect'] }) {
  const rankDelta = mover.rankDelta ?? 0;
  const scoreDelta = mover.scoreDelta ?? 0;

  const content = (
    <>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-sm font-medium truncate">{mover.name}</span>
        <span className="block text-xs text-muted-foreground truncate">
          {mover.unit ?? 'No unit on file'} · now #{mover.rank}
        </span>
      </span>
      <span className="text-right shrink-0">
        {mode === 'new' ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
            <UserPlus className="w-3.5 h-3.5" />New
          </span>
        ) : mode === 'rank' ? (
          <span
            className={`inline-flex items-center gap-1 text-sm font-bold font-mono ${
              rankDelta > 0 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {rankDelta > 0 ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            {Math.abs(rankDelta)} {Math.abs(rankDelta) === 1 ? 'place' : 'places'}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm font-bold font-mono text-emerald-400">
            <ArrowUp className="w-3.5 h-3.5" />
            {scoreDelta.toFixed(1)}%
          </span>
        )}
        <span className="block text-xs text-muted-foreground font-mono">
          {mode === 'new'
            ? `${mover.overallCompletion.toFixed(1)}% overall`
            : mode === 'rank'
              ? `#${mover.previousRank} → #${mover.rank}`
              : `${(mover.previousCompletion ?? 0).toFixed(1)}% → ${mover.overallCompletion.toFixed(1)}%`}
        </span>
      </span>
    </>
  );

  if (!onSelect) {
    return <li className="flex items-center gap-3 p-2.5">{content}</li>;
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(mover.userId, mover.name, mover.unit)}
        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/60 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        aria-label={`Open profile for ${mover.name}`}
      >
        {content}
      </button>
    </li>
  );
}

function MoverGroup({
  title, icon: Icon, tone, movers, mode, emptyText, onSelect,
}: {
  title: string;
  icon: typeof TrendingUp;
  tone: string;
  movers: Mover[];
  mode: 'rank' | 'score' | 'new';
  emptyText: string;
  onSelect?: TopMoversPanelProps['onSelect'];
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-3">
      <p className={`inline-flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-wide mb-2 ${tone}`}>
        <Icon className="w-4 h-4" />
        {title}
      </p>
      {movers.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {movers.map(m => (
            <MoverRow key={`${mode}-${m.userId}`} mover={m} mode={mode} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function TopMoversPanel({ movers, onSelect }: TopMoversPanelProps) {
  if (!movers) return null;

  return (
    <section className="pb-6" aria-labelledby="top-movers-heading">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto glass rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 id="top-movers-heading" className="inline-flex items-center gap-2 font-heading font-bold">
              <Sparkles className="w-4 h-4 text-primary" />
              Top Movers
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-border text-xs">
                {movers.total} change{movers.total === 1 ? '' : 's'}
              </Badge>
              <span className="text-xs text-muted-foreground" aria-live="polite">
                since standings taken {formatCacheAge(movers.previousTakenAt)}
              </span>
            </div>
          </div>

          {movers.total === 0 ? (
            <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
              <Activity className="w-4 h-4" />
              No rank or score changes in the latest refresh.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MoverGroup
                title="Biggest climbs"
                icon={TrendingUp}
                tone="text-emerald-400"
                movers={movers.climbers}
                mode="rank"
                emptyText="Nobody moved up this refresh."
                onSelect={onSelect}
              />
              <MoverGroup
                title="Biggest slips"
                icon={TrendingDown}
                tone="text-amber-400"
                movers={movers.slippers}
                mode="rank"
                emptyText="Nobody lost ground this refresh."
                onSelect={onSelect}
              />
              <MoverGroup
                title="Biggest score gains"
                icon={ArrowUp}
                tone="text-primary"
                movers={movers.gainers}
                mode="score"
                emptyText="No completion gains this refresh."
                onSelect={onSelect}
              />
              <MoverGroup
                title="New on the board"
                icon={UserPlus}
                tone="text-primary"
                movers={movers.newcomers}
                mode="new"
                emptyText="No new participants this refresh."
                onSelect={onSelect}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
