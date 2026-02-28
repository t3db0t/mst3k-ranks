import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <nav className="px-8 py-4 flex gap-6 items-center justify-between">
        <div className="flex gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Leaderboard
          </Link>
          <Link
            href="/heatmap"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Heatmap
          </Link>
          <Link
            href="/graph"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Neighbor graph
          </Link>
        </div>
        <div className="flex gap-6 items-center">
          <Link href="https://github.com/t3db0t/mst3k-ranks">
            <Image
              src="/images/GitHub_Invertocat_Black.svg"
              alt="Github repo"
              width={32}
              height={32}
            />
          </Link>
          <Link href="https://www.inventbuild.studio">
            <Image
              src="/images/IBS-logo-medium.svg"
              alt="Github repo"
              width={120}
              height={(41 / 341) * 120}
            />
          </Link>
        </div>
      </nav>
    </header>
  );
}
