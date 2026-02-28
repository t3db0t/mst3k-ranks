/**
 * Fetches Reddit thread, runs matching + scoring, returns aggregated results.
 * Used by API route and can be called directly from server components.
 */

import { fetchThread, getAllCommentBodies } from "./reddit";
import { buildTitleMap, extractRankedTitles } from "./matcher";
import { aggregateResults } from "./scoring";
import episodes from "@/data/episodes.json";
import type { EpisodeEntry } from "./matcher";

export interface ThreadAnalysis {
  results: {
    title: string;
    bordaScore: number;
    mentions: number;
    rankDistribution: Record<number, number>;
  }[];
  totalComments: number;
  totalCommentsWithRanks: number;
}

export async function getThreadAnalysis(): Promise<ThreadAnalysis> {
  const comments = await fetchThread();
  const bodies = getAllCommentBodies(comments);

  const titleMap = buildTitleMap(episodes as EpisodeEntry[]);
  const allMatches = bodies.map((body) => extractRankedTitles(body, titleMap));
  const aggregated = aggregateResults(allMatches);

  return {
    results: aggregated,
    totalComments: comments.length,
    totalCommentsWithRanks: allMatches.filter((m) => m.length > 0).length,
  };
}
