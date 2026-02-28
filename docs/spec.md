# MST3K Top 5 Reddit Poll Analyzer — Implementation Spec (Next.js + D3)

## Goal

Build a small Next.js site that:

- Fetches a Reddit thread JSON at request time (cached)
- Parses all comments (including nested replies)
- Extracts up to 5 ranked MST3K episode titles per comment using whitelist matching
- Aggregates results (Borda score, mentions, rank distribution)
- Visualizes results with D3

Thread JSON:
https://www.reddit.com/comments/1rgqoys.json?limit=500

---

## Tech Stack

- Next.js (App Router)
- TypeScript
- Server Route Handlers for data fetch + analysis
- D3 for client-side visualization (SVG)
- Static whitelist JSON of episode titles

---

## High-Level Architecture

Server:

- Fetch Reddit JSON (cached)
- Flatten comment tree
- Run matching + scoring
- Return aggregated results

Client:

- Fetch `/api/thread`
- Render charts with D3

## Suggested Directory Structure

/app
api/thread/route.ts # Fetch + parse + analyze Reddit thread (using helpers in lib)
page.tsx # Results dashboard
/components
ChartLeaderboard.tsx # D3 horizontal bar chart
ChartHeatmap.tsx # rank heatmap
/lib
reddit.ts # Fetch + flatten logic
matcher.ts # Title matching logic
scoring.ts # Aggregation + Borda scoring
/data
episodes.json # Whitelist of MST3K episode titles
/scripts
getEpisodeList.ts # generates /data/episodes.json

## Data Source Requirements

Use Reddit public JSON endpoint (no OAuth):
https://www.reddit.com/comments/1rgqoys.json?limit=500

Fetch rules:

- Server-side only
- Include User-Agent header
- Cache using Next.js fetch cache (`revalidate`)
- Ignore `[deleted]` and `[removed]` comments

Example fetch:

```ts
await fetch("https://www.reddit.com/comments/1rgqoys.json?limit=500", {
  headers: { "User-Agent": "mst3k-poll-analyzer" },
  next: { revalidate: 3600 }, // 1 hour cache
});
```
