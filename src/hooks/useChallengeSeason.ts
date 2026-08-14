import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  ChallengeCycleRow,
  ChallengeSeason,
  fallbackSeason,
  pickCurrentSeason,
  seasonFromRow,
} from '@/lib/challengeSeason';

interface SeasonsResult {
  seasons: ChallengeSeason[];
  current: ChallengeSeason | null;
  loading: boolean;
  /** True when the cycle table was unreachable and fallback dates are in use. */
  degraded: boolean;
}

/** Every published annual challenge season, newest first. */
export function useChallengeSeasons(): SeasonsResult {
  const [seasons, setSeasons] = useState<ChallengeSeason[]>([]);
  const [loading, setLoading] = useState(true);
  const [degraded, setDegraded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('challenge_cycles')
        .select('*')
        .order('year', { ascending: false });

      if (cancelled) return;

      if (error || !data || data.length === 0) {
        setSeasons([fallbackSeason()]);
        setDegraded(true);
      } else {
        setSeasons((data as ChallengeCycleRow[]).map((row) => seasonFromRow(row)));
        setDegraded(false);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { seasons, current: pickCurrentSeason(seasons), loading, degraded };
}

/** A single season by year, or the current one when no year is given. */
export function useChallengeSeason(year?: number) {
  const { seasons, current, loading, degraded } = useChallengeSeasons();
  const season = year ? seasons.find((s) => s.year === year) ?? null : current;
  return {
    season,
    seasons,
    loading,
    degraded,
    /** The requested year exists in neither the database nor the fallback. */
    notFound: !loading && year !== undefined && season === null,
  };
}
