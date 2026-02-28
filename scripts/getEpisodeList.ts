// scripts/getEpisodeList.ts
import fs from "fs";

interface EpisodeEntry {
  season: number;
  episode: number;
  titleCanonical: string;
  titleAlternates: string[];
  shorts: string[];
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

/** Strip wiki markup ([[Link]], [[Link|Display]], {{sic|...}}, etc.) to plain text */
function stripWiki(str: string): string {
  return str
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\{\{sic\|[^}]*\}\}/gi, "") // e.g. {{sic|hide=y|reason=...}}
    .replace(/\{\{[^}|]+\|[^}]*\}\}/g, "") // other {{name|params}} templates
    .replace(/\{\{[^}]+\}\}/g, "") // {{name}} no params
    .replace(/''/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parse "With short(s):" content into array of short titles */
function parseShorts(rawContent: string): string[] {
  let content = stripWiki(rawContent);
  if (!content) return [];

  // Strip surrounding quotes from Part/Chapter titles, e.g. Part 2: "Molten Terror" -> Part 2: Molten Terror
  content = content.replace(/:\s*["']([^"']+)["']/g, ": $1");

  const segments = content.split(";").map((seg) => seg.trim()).filter(Boolean);
  if (segments.length === 0) return [];

  // Find series prefix (before first "Part" or "Chapter") for serial shorts
  const firstMatch = segments[0].match(/^(.+?),?\s*(Part \d+|Chapter \d+)/i);
  const seriesPrefix = firstMatch ? firstMatch[1].trim() + ", " : "";

  const shorts: string[] = [];
  for (const seg of segments) {
    if (seriesPrefix && /^(Part \d+|Chapter \d+)/i.test(seg)) {
      shorts.push(seriesPrefix + seg);
    } else {
      shorts.push(seg);
    }
  }
  return shorts;
}

/** Extract titleCanonical (from [[X]]), titleAlternates, and shorts from RTitle */
function parseRTitle(raw: string): {
  titleCanonical: string;
  titleAlternates: string[];
  shorts: string[];
} {
  const s = raw.trim();

  // Canonical: the main [[X]] or [[Link|Display]] - use display when pipe present.
  // Get full content first (templates like {{sic|...}} contain | so we can't use a simple split)
  const wikiLinkMatch = s.match(/\[\[([\s\S]+?)\]\]/);
  let rawTitle = "";
  if (wikiLinkMatch) {
    const content = wikiLinkMatch[1];
    // For [[Link|Display]], the pipe is NOT inside {{}}. Replace templates to find the separator.
    const withoutTemplates = content.replace(/\{\{[^}]*\}\}/g, "\x00");
    const pipeIdx = withoutTemplates.lastIndexOf("|");
    rawTitle = (pipeIdx >= 0 ? content.slice(pipeIdx + 1) : content).replace(/''/g, "").trim();
  }
  let titleCanonical = stripWiki(rawTitle);

  const alternates: string[] = [];

  // Fix "the the" duplicate (noted by {{sic}} in source): use corrected form as canonical, keep typo as alternate
  if (/the the /i.test(titleCanonical)) {
    alternates.push(titleCanonical);
    titleCanonical = titleCanonical.replace(/the the /gi, "the ");
  }

  let shorts: string[] = [];

  // Parenthetical alternate - (X) before </small>, e.g. (Daikaijū Kettō: Gamera tai Barugon)
  const parenMatch = s.match(/\(([^)]+)\)\s*<\/small>/);
  if (parenMatch && !parenMatch[1].toLowerCase().includes("with short")) {
    const alt = stripWiki(parenMatch[1]);
    if (alt) {
      alternates.push(alt);
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
    const shortContent = withShortMatch[1];
    shorts = parseShorts(shortContent);
    const shortContentClean = stripWiki(shortContent);
    if (shortContentClean && titleCanonical) {
      alternates.push(`${titleCanonical} with short: ${shortContentClean}`);
    }
  }

  return {
    titleCanonical,
    titleAlternates: [...new Set(alternates)],
    shorts,
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
      shorts: parsed.shorts,
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
