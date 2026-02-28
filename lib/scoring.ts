/**
 * Borda count scoring and aggregation.
 * Rank 1 gets 5 points, rank 2 gets 4, ..., rank 5 gets 1.
 */

export interface RankedMatch {
  rank: number;
  canonical: string;
}

export interface AggregatedResult {
  title: string;
  bordaScore: number;
  mentions: number;
  rankDistribution: Record<number, number>; // rank -> count
}

const MAX_RANK = 5;
const BORDA_WEIGHTS = Object.fromEntries(
  Array.from({ length: MAX_RANK }, (_, i) => [i + 1, MAX_RANK - i])
);

export function computeBordaScore(rank: number): number {
  return BORDA_WEIGHTS[rank] ?? 0;
}

export function aggregateResults(
  allMatches: { rank: number; canonical: string }[][]
): AggregatedResult[] {
  const byTitle = new Map<
    string,
    { bordaScore: number; mentions: number; rankDistribution: Record<number, number> }
  >();

  for (const commentMatches of allMatches) {
    for (const { rank, canonical } of commentMatches) {
      let entry = byTitle.get(canonical);
      if (!entry) {
        entry = {
          bordaScore: 0,
          mentions: 0,
          rankDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
        byTitle.set(canonical, entry);
      }

      entry.bordaScore += computeBordaScore(rank);
      entry.mentions += 1;
      entry.rankDistribution[rank] = (entry.rankDistribution[rank] ?? 0) + 1;
    }
  }

  return Array.from(byTitle.entries())
    .map(([title, data]) => ({
      title,
      bordaScore: data.bordaScore,
      mentions: data.mentions,
      rankDistribution: data.rankDistribution,
    }))
    .sort((a, b) => b.bordaScore - a.bordaScore);
}
