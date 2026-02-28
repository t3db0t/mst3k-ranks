// scripts/getEpisodeList.ts
import fs from "fs";

interface EpisodeEntry {
  season: number;
  episode: number;
  titleCanonical: string;
  titleAlternates: string[];
}

/** Looks like a date cell, e.g. "june 6, 1992 (1992-06-06)" */
function looksLikeDate(s: string): boolean {
  const lower = s.toLowerCase().trim();
  const months =
    "january|february|march|april|may|june|july|august|september|october|november|december";
  return new RegExp(
    `^(${months})\\s+\\d{1,2},?\\s*\\d{4}\\s*\\(\\d{4}-\\d{2}-\\d{2}\\)`
  ).test(lower);
}

/** Parse season number from section header. Returns -1 for The Movie. */
function parseSeasonFromHeader(headerTitle: string): number | null {
  const m = headerTitle.match(/Season\s+(\d+)/i);
  if (m) return parseInt(m[1], 10);
  if (headerTitle.includes("KTMA")) return 0;
  if (headerTitle.includes("Movie") || headerTitle.includes("Film")) return -1;
  return null;
}

/** Extract titleCanonical (from [[X]]) and titleAlternates (parenthetical, with short, etc.) from RTitle */
function parseRTitle(raw: string): {
  titleCanonical: string;
  titleAlternates: string[];
} {
  const s = raw.trim();

  // Canonical: the main [[X]] or [[Link|X]] - use display part (X) when pipe present
  const wikiLinkMatch = s.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
  const titleCanonical = wikiLinkMatch
    ? (wikiLinkMatch[2] || wikiLinkMatch[1]).replace(/''/g, "").trim()
    : "";

  const alternates: string[] = [];

  /** Strip wiki markup ([[Link]], [[Link|Display]]) to plain text */
  const stripWiki = (str: string) =>
    str
      .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
      .replace(/\[\[([^\]]+)\]\]/g, "$1")
      .replace(/''/g, "")
      .replace(/<[^>]+>/g, "")
      .trim();

  // Parenthetical alternate - (X) before </small>, e.g. (Daikaijū Kettō: Gamera tai Barugon)
  const parenMatch = s.match(/\(([^)]+)\)\s*<\/small>/);
  if (parenMatch && !parenMatch[1].toLowerCase().includes("with short")) {
    const alt = stripWiki(parenMatch[1]);
    if (alt) {
      alternates.push(alt);
      // Also add "Title (Parenthetical)" as an alternate for matching
      if (titleCanonical) {
        alternates.push(`${titleCanonical} (${alt})`);
      }
    }
  }

  // With short / With shorts
  const withShortMatch = s.match(
    /(?:With short|With shorts):\s*([\s\S]+?)(?=<br\s*\/?>|\n|$)/i
  );
  if (withShortMatch) {
    const shortContent = stripWiki(withShortMatch[1]);
    if (shortContent && titleCanonical) {
      alternates.push(`${titleCanonical} with short: ${shortContent}`);
    }
  }

  return {
    titleCanonical,
    titleAlternates: [...new Set(alternates)],
  };
}

function run() {
  const data = JSON.parse(
    fs.readFileSync("data/mst3k-episodes-wikitext.json", "utf-8")
  );
  const wikitext = data.parse?.wikitext?.["*"];
  if (!wikitext) {
    throw new Error(
      "Expected parse.wikitext['*'] in mst3k-episodes-wikitext.json"
    );
  }

  // Find all === headers (allow optional spaces around =)
  const headerMatches = [...wikitext.matchAll(/^={2,}\s*(.+?)\s*={2,}$/gm)];
  const sections: { pos: number; season: number }[] = [];

  for (const m of headerMatches) {
    const pos = m.index ?? 0;
    const title = m[1].trim();
    const season = parseSeasonFromHeader(title);
    if (season !== null) {
      sections.push({ pos, season });
    }
  }

  // Sort by position
  sections.sort((a, b) => a.pos - b.pos);

  // Find all {{Episode list blocks
  const blockMatches = [
    ...wikitext.matchAll(/\{\{Episode list\s*\n([\s\S]+?)(?=\n\}\}|\n\{\{Episode list)/g),
  ];

  const entries: EpisodeEntry[] = [];

  for (const blockMatch of blockMatches) {
    const blockStart = blockMatch.index ?? 0;
    const blockContent = blockMatch[1];

    // Which section does this block belong to? (last section whose header comes before this block)
    let season = 0;
    for (const sec of sections) {
      if (sec.pos < blockStart) season = sec.season;
      else break;
    }

    const epNumMatch = blockContent.match(/EpisodeNumber\s*=\s*(\d+)/);
    const epNum2Match = blockContent.match(/EpisodeNumber2\s*=\s*(\d+)/);
    const rtitleMatch = blockContent.match(
      /RTitle\s*=\s*([\s\S]+?)(?=\n\s*\|\s*[A-Za-z_]|\n\s*\}\})/
    );

    if (!rtitleMatch) continue;

    const parsed = parseRTitle(rtitleMatch[1]);

    if (!parsed.titleCanonical || looksLikeDate(parsed.titleCanonical)) continue;
    if (parsed.titleCanonical.length > 150) continue;

    const episode = epNum2Match ? parseInt(epNum2Match[1], 10) : parseInt(epNumMatch?.[1] ?? "0", 10);

    entries.push({
      season,
      episode,
      titleCanonical: parsed.titleCanonical,
      titleAlternates: parsed.titleAlternates,
    });
  }

  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync(
    "data/episodes.json",
    JSON.stringify(entries, null, 2)
  );

  console.log(`Saved ${entries.length} episode entries`);
}

run();
