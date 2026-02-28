# MST3K Poll Analyzer — Neighbor (Co-Occurrence) Graph Spec

## Goal

Add a “neighbor graph” visualization showing which MST3K episodes are frequently listed together in users’ Top 5 comments.

This graph reveals taste clusters by modeling co-occurrence within the same ranked list.

## Definition

A neighbor graph is an undirected weighted graph where:

- Node = Episode title
- Edge = Two episodes appearing in the same Top 5 list
- Edge weight = Number of times the pair co-occurred across all comments

Example:
If a comment lists:

1. Space Mutiny
2. Final Sacrifice
3. Mitchell

Then increment edges:

- Space Mutiny ↔ Final Sacrifice (+1)
- Space Mutiny ↔ Mitchell (+1)
- Final Sacrifice ↔ Mitchell (+1)

## Input Data (Upstream Dependency)

Use the existing parsed output:

- `ParsedComment = string[]` (up to 5 ordered episode titles)

Ignore:

- Comments with fewer than 2 matched titles

## Graph Construction Algorithm

### Step 1: Initialize structures

- NodeMap: `Map<string, { id: string; mentions: number }>`
- EdgeMap: `Map<string, { source: string; target: string; weight: number }>`

Key rule:

- Edge keys must be order-independent (A|B same as B|A).

### Step 2: Build nodes and edges

For each parsed comment:

1. Deduplicate titles within the list
2. Increment node mention counts for each episode
3. Generate all unique unordered pairs
4. Increment edge weight for each pair

Reference implementation:

```ts
function buildNeighborGraph(comments: string[][]) {
  const nodes = new Map<string, { id: string; mentions: number }>();
  const edges = new Map<
    string,
    { source: string; target: string; weight: number }
  >();

  for (const list of comments) {
    const unique = Array.from(new Set(list));
    if (unique.length < 2) continue;

    // Count node mentions
    for (const title of unique) {
      if (!nodes.has(title)) nodes.set(title, { id: title, mentions: 0 });
      nodes.get(title)!.mentions++;
    }

    // Generate co-occurrence pairs
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        const a = unique[i];
        const b = unique[j];
        const key = [a, b].sort().join("|");

        if (!edges.has(key))
          edges.set(key, { source: a, target: b, weight: 0 });
        edges.get(key)!.weight++;
      }
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    links: Array.from(edges.values()),
  };
}
```

## Output Shape (API)

Extend `/api/thread` response to include:

```ts
{
  leaderboard: [...],
  graph: {
    nodes: { id: string; mentions: number }[],
    links: { source: string; target: string; weight: number }[]
  }
}
```

## Filtering (Important for Readability)

Before sending to client:

- Remove nodes with `mentions < 2` (optional)
- Remove edges with `weight < 2` (recommended)
- Optionally limit to top N episodes by score (e.g., 25)

Goal: avoid an unreadable hairball.

## Visualization Requirements (D3 Force Graph)

### Constraints

- Client component only (`"use client"`)
- Use `d3-force`
- SVG is fine for this dataset size

### Forces configuration

```ts
const simulation = d3
  .forceSimulation(nodes)
  .force(
    "link",
    d3
      .forceLink(links)
      .id((d: any) => d.id)
      .distance(80),
  )
  .force("charge", d3.forceManyBody().strength(-120))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force(
    "collision",
    d3.forceCollide().radius((d: any) => nodeRadius(d.mentions)),
  );
```

## Visual Encoding

Nodes:

- Radius = scaled by `mentions`
- Label = episode title

Edges:

- Stroke width = scaled by `weight`
- Moderate opacity (~0.3–0.6)

Scales (example):

```ts
const nodeRadius = d3
  .scaleSqrt()
  .domain([minMentions, maxMentions])
  .range([4, 18]);

const linkWidth = d3.scaleLinear().domain([1, maxWeight]).range([1, 6]);
```

## Interaction

- Hover node: highlight connected edges
- Tooltip: episode title + mentions
- Zoom/pan (d3.zoom)

## Design

- Use existing design schemes & font sizes where applicable
- Chart area should fill entire browser window (notwithstanding header)—no margins
