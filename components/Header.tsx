"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const linkClass =
  "text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50 rounded-md px-3 py-2 transition-colors";
const activeClass =
  "bg-blue-200 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <nav className="px-8 py-4 flex gap-6 items-center justify-between">
        <div className="flex gap-6 items-center">
          <div className="flex flex-col justify-center">
            <div className="text-lg font-bold">MST3K Top 5 Poll Analyzer</div>
            <Link
              href="https://www.reddit.com/r/MST3K/comments/1rgqoys/comment/o7wpg27/"
              className="text-sm text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50 underline leading-4"
            >
              The Reddit Poll
            </Link>
          </div>
          <div className="flex gap-0 items-center">
            <Link
              href="/"
              className={`${linkClass} ${pathname === "/" ? activeClass : ""}`}
            >
              Leaderboard
            </Link>
            <Link
              href="/heatmap"
              className={`${linkClass} ${pathname === "/heatmap" ? activeClass : ""}`}
            >
              Heatmap
            </Link>
            <Link
              href="/graph"
              className={`${linkClass} ${pathname === "/graph" ? activeClass : ""}`}
            >
              Neighbor graph
            </Link>
          </div>
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
