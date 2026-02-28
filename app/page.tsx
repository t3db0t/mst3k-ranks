import { Header } from "@/components/Header";
import { ChartLeaderboard } from "@/components/ChartLeaderboard";
import { getThreadAnalysis } from "@/lib/thread";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { results, totalComments, totalCommentsWithRanks } = await getThreadAnalysis();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">MST3K Top 5 Poll — Leaderboard</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Borda (weighted) scores from the Reddit poll — rank #1 = 5 pts, #5 = 1 pt.{" "}
          {totalCommentsWithRanks} of {totalComments} comments included ranked picks.
        </p>
        <ChartLeaderboard data={results} />
      </main>
    </div>
  );
}
