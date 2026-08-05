/**
 * Top Movers: compares the freshly fetched standings against the previously
 * cached snapshot so the leaderboard can highlight who climbed, who slipped,
 * and who just joined since the last refresh.
 */
export interface MoverSnapshotEntry {
  userId: string;
  name: string;
  unit: string | null;
  rank: number;
  overallCompletion: number;
}

export interface MoverSnapshot {
  takenAt: number;
  entries: MoverSnapshotEntry[];
}

export interface Mover extends MoverSnapshotEntry {
  previousRank: number | null;
  previousCompletion: number | null;
  /** Positive means the participant climbed (numerically lower rank). */
  rankDelta: number | null;
  /** Positive means overall completion increased. */
  scoreDelta: number | null;
  isNew: boolean;
}

export interface MoversResult {
  climbers: Mover[];
  slippers: Mover[];
  gainers: Mover[];
  newcomers: Mover[];
  comparedAt: number;
  previousTakenAt: number;
  total: number;
}

export function toSnapshot(entries: MoverSnapshotEntry[], takenAt = Date.now()): MoverSnapshot {
  return {
    takenAt,
    entries: entries.map(e => ({
      userId: e.userId,
      name: e.name,
      unit: e.unit ?? null,
      rank: e.rank,
      overallCompletion: e.overallCompletion,
    })),
  };
}

const round = (n: number) => Math.round(n * 10) / 10;

export function computeMovers(
  current: MoverSnapshotEntry[],
  previous: MoverSnapshot | null,
  limit = 5
): MoversResult | null {
  if (!previous || previous.entries.length === 0) return null;

  const prevMap = new Map(previous.entries.map(e => [e.userId, e]));

  const movers: Mover[] = current.map(entry => {
    const prev = prevMap.get(entry.userId);
    return {
      ...entry,
      previousRank: prev ? prev.rank : null,
      previousCompletion: prev ? prev.overallCompletion : null,
      rankDelta: prev ? prev.rank - entry.rank : null,
      scoreDelta: prev ? round(entry.overallCompletion - prev.overallCompletion) : null,
      isNew: !prev,
    };
  });

  const changed = movers.filter(m => !m.isNew && ((m.rankDelta ?? 0) !== 0 || (m.scoreDelta ?? 0) !== 0));

  const climbers = changed
    .filter(m => (m.rankDelta ?? 0) > 0)
    .sort((a, b) => (b.rankDelta ?? 0) - (a.rankDelta ?? 0) || (b.scoreDelta ?? 0) - (a.scoreDelta ?? 0))
    .slice(0, limit);

  const slippers = changed
    .filter(m => (m.rankDelta ?? 0) < 0)
    .sort((a, b) => (a.rankDelta ?? 0) - (b.rankDelta ?? 0) || (a.scoreDelta ?? 0) - (b.scoreDelta ?? 0))
    .slice(0, limit);

  const gainers = changed
    .filter(m => (m.scoreDelta ?? 0) > 0)
    .sort((a, b) => (b.scoreDelta ?? 0) - (a.scoreDelta ?? 0))
    .slice(0, limit);

  const newcomers = movers.filter(m => m.isNew).sort((a, b) => a.rank - b.rank).slice(0, limit);

  const total = changed.length + newcomers.length;

  return {
    climbers,
    slippers,
    gainers,
    newcomers,
    comparedAt: Date.now(),
    previousTakenAt: previous.takenAt,
    total,
  };
}
