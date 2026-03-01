/**
 * Reddit JSON API: fetches a thread and flattens the comment tree.
 * Response: [postListing, commentListing]
 * Comments have data.body, data.author, data.replies (Listing or empty string)
 */

export interface RedditComment {
  id: string;
  author: string;
  body: string;
  replies: RedditComment[];
}

interface RedditThing {
  kind: string;
  data: {
    id?: string;
    author?: string;
    body?: string;
    body_html?: string;
    replies?: "" | { data: { children: RedditThing[] } };
    children?: RedditThing[];
  };
}

const REDDIT_API_URL = "https://www.reddit.com/comments/1rgqoys?limit=500";
export const THREAD_URL = "https://blue-tree-dd17.t3db0t.workers.dev";

export interface FetchThreadResult {
  comments: RedditComment[];
  /** Total comment count including deleted/removed (matches Reddit’s UI count) */
  totalCommentCount: number;
}

const REDDIT_USER_AGENT =
  "Mozilla/5.0 (compatible; MST3KPollAnalyzer/1.0; +https://github.com/t3db0t/mst3k-ranks)";

export async function fetchThread(): Promise<FetchThreadResult> {
  const res = await fetch(THREAD_URL, {
    headers: {
      "User-Agent": REDDIT_USER_AGENT,
      Accept: "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Reddit fetch failed: ${res.status}`);
  }

  const json = await res.json();
  const commentListing = json[1];
  if (!commentListing?.data?.children) {
    return { comments: [], totalCommentCount: 0 };
  }

  const children = commentListing.data.children as RedditThing[];
  const totalCommentCount = countAllComments(children);
  const comments = flattenComments(children);

  return { comments, totalCommentCount };
}

/** Count every t1 (comment) node in the tree, including deleted/removed */
function countAllComments(things: RedditThing[]): number {
  let n = 0;
  for (const thing of things) {
    if (thing.kind !== "t1") continue;
    n += 1;
    const data = thing.data;
    if (data?.replies && typeof data.replies === "object") {
      n += countAllComments(data.replies.data?.children ?? []);
    }
  }
  return n;
}

function flattenComments(things: RedditThing[]): RedditComment[] {
  const result: RedditComment[] = [];

  for (const thing of things) {
    const data = thing.data;
    if (thing.kind !== "t1" || !data) continue;
    if (data.author === "[deleted]" || data.author === "[removed]") continue;
    if (data.body === "[deleted]" || data.body === "[removed]") continue;

    const replies =
      data.replies && typeof data.replies === "object"
        ? flattenComments(data.replies.data?.children ?? [])
        : [];

    result.push({
      id: data.id ?? "",
      author: data.author ?? "[unknown]",
      body: data.body ?? "",
      replies,
    });
  }

  return result;
}

/** Recursively collect all comment bodies (including nested replies) */
export function getAllCommentBodies(comments: RedditComment[]): string[] {
  const bodies: string[] = [];
  function walk(cs: RedditComment[]) {
    for (const c of cs) {
      bodies.push(c.body);
      if (c.replies.length) walk(c.replies);
    }
  }
  walk(comments);
  return bodies;
}
