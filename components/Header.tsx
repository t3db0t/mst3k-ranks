"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitHubLogo } from "./GitHubLogo";
import { IBSLogo } from "./IBSLogo";
import Image from "next/image";

const REDDIT_THREAD_JSON =
  "https://www.reddit.com/comments/1rgqoys.json?limit=500";

const linkClass =
  "text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50 rounded-md px-3 py-2 transition-colors";
const activeClass =
  "bg-blue-200 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50";

export function Header() {
  const pathname = usePathname();
  const [testStatus, setTestStatus] = useState<string | null>(null);

  async function testRedditEndpoint() {
    setTestStatus("…");
    try {
      const res = await fetch(REDDIT_THREAD_JSON);
      if (res.ok) {
        const json = await res.json();
        const commentCount =
          (Array.isArray(json) ? json[1]?.data?.children?.length : null) ?? "?";
        setTestStatus(`OK ${res.status} (${commentCount} top-level comments)`);
      } else {
        setTestStatus(`Failed: ${res.status}`);
      }
    } catch (e) {
      setTestStatus(e instanceof Error ? e.message : "Error");
    }
    setTimeout(() => setTestStatus(null), 5000);
  }

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <nav className="px-8 py-4 flex gap-6 items-center justify-between">
        <div className="flex gap-3 items-center">
          <Image
            src="/images/MST3K-logo.png"
            width={45}
            height={(310 / 320) * 45}
            alt="MST3K Logo"
          />
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
          <div className="flex items-center gap-2">
            {testStatus !== null && (
              <span
                className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[200px] truncate"
                title={testStatus}
              >
                {testStatus}
              </span>
            )}
          </div>
          <Link
            href="https://github.com/t3db0t/mst3k-ranks"
            className="text-black dark:text-white"
          >
            <GitHubLogo className="size-8" />
          </Link>
          <Link
            href="https://www.inventbuild.studio"
            className="text-black dark:text-white"
          >
            <IBSLogo className="h-4 w-auto" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
