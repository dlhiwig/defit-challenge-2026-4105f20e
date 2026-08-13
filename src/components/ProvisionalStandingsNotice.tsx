import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { CHALLENGE_DATE_RANGE, CHALLENGE_WEEKS } from '@/lib/challenge';

/** Which body of logs a standings view is computed from. */
export type Adjudication = 'provisional' | 'official';

interface ProvisionalStandingsNoticeProps {
  /** Optional window override supplied by the backend (authoritative challenge config). */
  window?: string;
  weeks?: number;
  /** 'official' counts verified logs only; 'provisional' includes pending entries. */
  adjudication?: Adjudication;
  className?: string;
}

/**
 * Competition-integrity label. Provisional views include logs that have NOT yet been
 * adjudicated by a USARC admin; official views are computed from verified logs only.
 */
export function ProvisionalStandingsNotice({
  window,
  weeks,
  adjudication = 'provisional',
  className = '',
}: ProvisionalStandingsNoticeProps) {
  const official = adjudication === 'official';
  const tone = official
    ? 'bg-emerald-500/10 border-emerald-500/25'
    : 'bg-amber-500/10 border-amber-500/25';

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border ${tone} ${className}`}>
      <Badge
        className={
          official
            ? 'self-start bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-heading tracking-wide'
            : 'self-start bg-amber-500/20 text-amber-300 border-amber-500/40 font-heading tracking-wide'
        }
      >
        {official ? (
          <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
        ) : (
          <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
        )}
        {official ? 'OFFICIAL / VERIFIED ONLY' : 'LIVE / PROVISIONAL'}
      </Badge>
      {official ? (
        <p className="text-sm text-emerald-200/85">
          These standings count <strong className="text-emerald-300">verified</strong> logs only and are the
          basis for awards. Recently submitted workouts appear here once a USARC admin verifies them
          ({window ?? CHALLENGE_DATE_RANGE}).
        </p>
      ) : (
        <p className="text-sm text-amber-200/85">
          These standings include <strong className="text-amber-300">pending (unverified)</strong> logs and can
          change after USARC admin review. Official results are published only from verified entries at the end
          of the {weeks ?? CHALLENGE_WEEKS}-week cycle ({window ?? CHALLENGE_DATE_RANGE}).
        </p>
      )}
    </div>
  );
}

export default ProvisionalStandingsNotice;
