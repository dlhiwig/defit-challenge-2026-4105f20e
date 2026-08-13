import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { CHALLENGE_DATE_RANGE, CHALLENGE_WEEKS } from '@/lib/challenge';

interface ProvisionalStandingsNoticeProps {
  /** Optional window override supplied by the backend (authoritative challenge config). */
  window?: string;
  weeks?: number;
  className?: string;
}

/**
 * Competition-integrity label. Standings currently include logs that have NOT yet
 * been adjudicated by a USARC admin, so every view must be labelled provisional.
 */
export function ProvisionalStandingsNotice({
  window,
  weeks,
  className = '',
}: ProvisionalStandingsNoticeProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 ${className}`}
    >
      <Badge className="self-start bg-amber-500/20 text-amber-300 border-amber-500/40 font-heading tracking-wide">
        <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
        LIVE / PROVISIONAL
      </Badge>
      <p className="text-sm text-amber-200/85">
        These standings include <strong className="text-amber-300">pending (unverified)</strong> logs and can
        change after USARC admin review. Official results are published only from verified entries at the end
        of the {weeks ?? CHALLENGE_WEEKS}-week cycle ({window ?? CHALLENGE_DATE_RANGE}).
      </p>
    </div>
  );
}

export default ProvisionalStandingsNotice;
