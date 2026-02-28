/**
 * Neighbor (co-occurrence) graph: which episodes appear together in Top 5 lists.
 * See docs/mst3k-neighbor-graph-spec.md.
 */

export interface GraphNode {
  id: string;
  mentions: number;
}

export interface GraphLink {
  source: string;
  target: string;
  weight: number;
}

export interface NeighborGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * Build nodes (episode id + mention count) and links (pair co-occurrence count).
 * Comments with fewer than 2 unique titles are ignored.
 */
export function buildNeighborGraph(comments: string[][]): NeighborGraph {
  const nodes = new Map<string, { id: string; mentions: number }>();
  const edges = new Map<
    string,
    { source: string; target: string; weight: number }
  >();

  for (const list of comments) {
    const unique = Array.from(new Set(list));
    if (unique.length < 2) continue;

    for (const title of unique) {
      if (!nodes.has(title)) nodes.set(title, { id: title, mentions: 0 });
      nodes.get(title)!.mentions++;
    }

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

export interface FilterOptions {
  /** Min edge weight (default 2). */
  minEdgeWeight?: number;
  /** Optional: only nodes with at least this many mentions. */
  minNodeMentions?: number;
  /** Optional: restrict to these episode ids (e.g. top N by Borda). Order ignored. */
  allowedNodeIds?: Set<string>;
}

/**
 * Filter graph for readability: remove weak edges and optionally restrict to top episodes.
 */
export function filterNeighborGraph(
  graph: NeighborGraph,
  options: FilterOptions = {}
): NeighborGraph {
  const minEdgeWeight = options.minEdgeWeight ?? 2;
  const minNodeMentions = options.minNodeMentions;
  const allowed = options.allowedNodeIds;

  let nodes = graph.nodes;
  if (minNodeMentions != null) {
    nodes = nodes.filter((n) => n.mentions >= minNodeMentions);
  }
  if (allowed != null) {
    nodes = nodes.filter((n) => allowed.has(n.id));
  }
  const idSet = new Set(nodes.map((n) => n.id));

  const links = graph.links.filter(
    (l) =>
      l.weight >= minEdgeWeight &&
      idSet.has(l.source) &&
      idSet.has(l.target)
  );

  const keptIds = new Set(nodes.map((n) => n.id));
  return {
    nodes: nodes.filter((n) => keptIds.has(n.id)),
    links,
  };
}
