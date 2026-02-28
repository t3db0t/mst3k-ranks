import { Header } from "@/components/Header";
import { ChartNeighborGraph } from "@/components/ChartNeighborGraph";
import { getThreadAnalysis } from "@/lib/thread";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function GraphPage() {
  const { graph, totalCommentsWithRanks } = await getThreadAnalysis();

  return (
    <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <Header />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <div className="px-8 pt-8 pb-4 absolute top-0 left-0 bg-white/70 dark:bg-zinc-950/80">
          <h1 className="text-2xl font-bold mb-2">Neighbor graph</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 ">
            Episodes that appear together in the same Top 5 lists (from{" "}
            {totalCommentsWithRanks} comments). Top 25 by score; edges with 2+
            co-occurrences. Drag nodes & zoom/pan.
          </p>
        </div>
        <div className="flex-1 min-h-0 min-w-0 flex flex-col">
          <ChartNeighborGraph data={graph} />
        </div>
      </main>
    </div>
  );
}
