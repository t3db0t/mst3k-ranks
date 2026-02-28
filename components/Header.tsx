import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <nav className="mx-auto max-w-4xl px-4 py-4 flex gap-6">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Leaderboard
        </Link>
        <Link
          href="/histogram"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Histogram
        </Link>
        <Link
          href="/heatmap"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Heatmap
        </Link>
      </nav>
    </header>
  );
}
