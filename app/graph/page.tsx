import { Header } from "@/components/Header";
import { ChartNeighborGraph } from "@/components/ChartNeighborGraph";
import { getThreadAnalysis } from "@/lib/thread";

export const dynamic = "force-dynamic";

export default async function GraphPage() {
  const { graph, totalCommentsWithRanks } = await getThreadAnalysis();

  return (
    <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <Header />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <p className="text-sm text-zinc-600 dark:text-zinc-400 px-4 pt-4 pb-2">
          Episodes that appear together in the same Top 5 lists (from{" "}
          {totalCommentsWithRanks} comments). Top 25 by score; edges with 2+
          co-occurrences. Drag nodes · zoom/pan.
        </p>
        <div className="flex-1 min-h-0 min-w-0 flex flex-col">
          <ChartNeighborGraph data={graph} />
        </div>
      </main>
    </div>
  );
}
