/**
 * Title matching against episodes.json whitelist.
 * Matches case-insensitively; maps matches to canonical title for aggregation.
 */

export interface EpisodeEntry {
  season: number;
  episode: number;
  titleCanonical: string;
  titleAlternates: string[];
  shorts: string[];
}

/** Build a map: normalized (lowercase) title string -> canonical title */
export function buildTitleMap(episodes: EpisodeEntry[]): Map<string, string> {
  const map = new Map<string, string>();

  for (const ep of episodes) {
    const canonical = ep.titleCanonical;
    map.set(canonical.toLowerCase(), canonical);
    for (const alt of ep.titleAlternates) {
      const key = alt.toLowerCase();
      if (!map.has(key)) map.set(key, canonical);
    }
    // Also map canonical without "the "/"a " for common forms
    const lower = canonical.toLowerCase();
    if (lower.startsWith("the ")) {
      map.set(lower.slice(4).trim(), canonical);
    }
    if (lower.startsWith("a ")) {
      map.set(lower.slice(2).trim(), canonical);
    }
  }

  return map;
}

/**
 * Extract up to 5 ranked episode titles from a comment.
 * Looks for patterns: "1. Title", "1) Title", "1 - Title", or lines starting with numbers.
 */
export function extractRankedTitles(
  body: string,
  titleMap: Map<string, string>
): { rank: number; canonical: string }[] {
  const results: { rank: number; canonical: string }[] = [];
  const seen = new Set<string>();

  // Split into lines for better context
  const lines = body.split(/\n/);
  const rankRegex = /^\s*(\d{1,2})[.)\-\s]+(.+?)(?:\n|$)/;

  for (const line of lines) {
    const m = line.match(rankRegex);
    if (!m) continue;

    const rank = parseInt(m[1], 10);
    if (rank < 1 || rank > 5) continue; // Only ranks 1-5
    if (results.some((r) => r.rank === rank)) continue; // No duplicate ranks

    const rawTitle = m[2].trim();
    const normalized = rawTitle.toLowerCase();

    // Try exact match first
    let canonical = titleMap.get(normalized);
    if (!canonical) {
      // Try stripping trailing punctuation/words
      const cleaned = normalized.replace(/[.,;:!?]+$/, "").trim();
      canonical = titleMap.get(cleaned);
    }
    if (!canonical) {
      // Try matching longest key that's contained in the normalized title
      let best: string | null = null;
      let bestLen = 0;
      for (const [key, canon] of titleMap) {
        if (normalized.includes(key) && key.length > bestLen) {
          best = canon;
          bestLen = key.length;
        }
      }
      canonical = best ?? undefined;
    }

    if (canonical && !seen.has(canonical)) {
      seen.add(canonical);
      results.push({ rank, canonical });
    }
  }

  // Also try inline pattern "1. Title 2. Title" on the whole body
  if (results.length === 0) {
    const inlineMatches = [...body.matchAll(/(\d)[.)\-\s]+([^0-9\n]+?)(?=\d[.)\-\s]+|$)/g)];
    for (const m of inlineMatches) {
      const rank = parseInt(m[1], 10);
      if (rank < 1 || rank > 5) continue;
      if (results.some((r) => r.rank === rank)) continue;

      const rawTitle = m[2].trim();
      const normalized = rawTitle.toLowerCase();
      const canonical = titleMap.get(normalized);
      if (canonical && !seen.has(canonical)) {
        seen.add(canonical);
        results.push({ rank, canonical });
      }
    }
  }

  return results.sort((a, b) => a.rank - b.rank);
}
