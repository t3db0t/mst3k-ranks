import { Header } from "@/components/Header";
import { ChartHeatmap } from "@/components/ChartHeatmap";
import { getThreadAnalysis } from "@/lib/thread";

export const dynamic = "force-dynamic";

export default async function HeatmapPage() {
  const { results } = await getThreadAnalysis();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">MST3K Top 5 Poll — Heatmap</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Rank distribution for top episodes. Rows = episode, columns = rank (#1–#5).
        </p>
        <ChartHeatmap data={results} maxTitles={25} />
      </main>
    </div>
  );
}
