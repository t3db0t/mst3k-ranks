"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface LeaderboardEntry {
  title: string;
  bordaScore: number;
  mentions: number;
}

export type LeaderboardMetric = "bordaScore" | "mentions";

function getMetricValue(d: LeaderboardEntry, metric: LeaderboardMetric): number {
  return metric === "bordaScore" ? d.bordaScore : d.mentions;
}

interface ChartLeaderboardProps {
  data: LeaderboardEntry[];
}

const BAR_HEIGHT = 36;
const BAR_PADDING = 0.12;
const SMALL_BAR_HEIGHT = 8;
const BORDA_FILL = "rgb(70, 130, 180)"; // steelblue – always Borda
const MENTIONS_FILL = "rgb(218, 124, 88)"; // orange – always Mentions

export function ChartLeaderboard({ data }: ChartLeaderboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(800);
  const [primaryIsBorda, setPrimaryIsBorda] = useState(true);
  const primaryMetric: LeaderboardMetric = primaryIsBorda ? "bordaScore" : "mentions";
  const secondaryMetric: LeaderboardMetric = primaryIsBorda ? "mentions" : "bordaScore";

  const sortedData = useMemo(
    () =>
      primaryIsBorda
        ? [...data].sort((a, b) => b.bordaScore - a.bordaScore)
        : [...data].sort((a, b) => b.mentions - a.mentions),
    [data, primaryIsBorda]
  );

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setWidth(w);
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const DURATION = 280;

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || sortedData.length === 0) return;

    const d3 = require("d3");

    const margin = { top: 32, right: 145, bottom: 24, left: 30 };
    const chartWidth = width - margin.left - margin.right;
    const height = sortedData.length * BAR_HEIGHT;

    const root = d3.select(svgRef.current);
    root.attr("width", width).attr("height", height + margin.top + margin.bottom);

    let chart = root.select("g.chart-area");
    if (chart.empty()) {
      chart = root
        .append("g")
        .attr("class", "chart-area")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    }

    const maxBorda = d3.max(sortedData, (d: LeaderboardEntry) => d.bordaScore) ?? 1;
    const maxMentions = d3.max(sortedData, (d: LeaderboardEntry) => d.mentions) ?? 1;
    const maxVal = Math.max(maxBorda, maxMentions, 1);
    const x = d3.scaleLinear().domain([0, maxVal]).range([0, chartWidth]);

    const y = d3
      .scaleBand()
      .domain(sortedData.map((_, i) => i))
      .range([0, height])
      .padding(BAR_PADDING);

    const bandHeight = y.bandwidth();
    const smallH = SMALL_BAR_HEIGHT;
    const primaryH = bandHeight - smallH;
    const rowY = (i: number) => y(i) ?? 0;
    const secondaryY = primaryH;
    const key = (d: LeaderboardEntry) => d.title;

    const row = chart
      .selectAll(".row")
      .data(sortedData, key)
      .join(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (enter: any) => {
          const g = enter
            .append("g")
            .attr("class", "row")
            .attr("transform", (_: LeaderboardEntry, i: number) => `translate(0, ${rowY(i)})`);
          g.each(function (this: SVGGElement, d: LeaderboardEntry) {
            const gr = d3.select(this);
            const bordaW = x(d.bordaScore);
            const mentionsW = x(d.mentions);
            gr.append("rect")
              .attr("class", "bar-mentions")
              .attr("x", 0)
              .attr("y", primaryIsBorda ? secondaryY : 0)
              .attr("width", mentionsW)
              .attr("height", primaryIsBorda ? smallH : primaryH)
              .attr("fill", MENTIONS_FILL)
              .attr("rx", 2);
            gr.append("rect")
              .attr("class", "bar-borda")
              .attr("x", 0)
              .attr("y", primaryIsBorda ? 0 : secondaryY)
              .attr("width", bordaW)
              .attr("height", primaryIsBorda ? primaryH : smallH)
              .attr("fill", BORDA_FILL)
              .attr("rx", 2);
            gr.append("text").attr("class", "rank");
            gr.append("text").attr("class", "label");
            gr.append("text").attr("class", "stats");
          });
          return g;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (update: any) => update,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (exit: any) => exit.remove()
      );

    row
      .transition()
      .duration(DURATION)
      .ease(d3.easeCubicInOut)
      .attr("transform", (_: LeaderboardEntry, i: number) => `translate(0, ${rowY(i)})`);

    row.each(function (this: SVGGElement, d: LeaderboardEntry) {
      const g = d3.select(this);
      const bordaW = x(d.bordaScore);
      const mentionsW = x(d.mentions);

      g.selectAll(".bar-mentions")
        .data([d])
        .join("rect")
        .attr("class", "bar-mentions")
        .attr("x", 0)
        .attr("fill", MENTIONS_FILL)
        .attr("rx", 2)
        .transition()
        .duration(DURATION)
        .ease(d3.easeCubicInOut)
        .attr("y", primaryIsBorda ? secondaryY : 0)
        .attr("width", mentionsW)
        .attr("height", primaryIsBorda ? smallH : primaryH);

      g.selectAll(".bar-borda")
        .data([d])
        .join("rect")
        .attr("class", "bar-borda")
        .attr("x", 0)
        .attr("fill", BORDA_FILL)
        .attr("rx", 2)
        .transition()
        .duration(DURATION)
        .ease(d3.easeCubicInOut)
        .attr("y", primaryIsBorda ? 0 : secondaryY)
        .attr("width", bordaW)
        .attr("height", primaryIsBorda ? primaryH : smallH);
    });

    row
      .selectAll(".rank")
      .data((_d: LeaderboardEntry, i: number) => [i], () => "rank")
      .join("text")
      .attr("class", "rank")
      .attr("x", -12)
      .attr("y", bandHeight / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .style("font-size", "15px")
      .style("fill", "#666")
      .text((d: number[]) => `${(d[0] ?? 0) + 1}.`);

    row
      .selectAll(".label")
      .data((d: LeaderboardEntry) => [d], () => "label")
      .join("text")
      .attr("class", "label")
      .attr("y", bandHeight / 2)
      .attr("dominant-baseline", "middle")
      .attr("text-anchor", "start")
      .style("font-size", "15px")
      .style("font-weight", 500)
      .style("font-family", "inherit")
      .text((d: LeaderboardEntry) => d.title);

    row.each(function (this: SVGGElement, d: LeaderboardEntry) {
      const g = d3.select(this);
      const barWidth = x(getMetricValue(d, primaryMetric));
      const labelEl = g.selectAll(".label");
      const node = labelEl.node() as SVGTextElement | null;
      const textWidth = node?.getComputedTextLength?.() ?? d.title.length * 9;
      const labelPadding = 12;
      const fitsInBar = textWidth + labelPadding < barWidth;
      const labelFill =
        fitsInBar ? (primaryIsBorda ? "white" : "#1f2937") : "currentColor";
      labelEl
        .attr("x", fitsInBar ? 10 : barWidth + 10)
        .style("fill", labelFill);
    });

    row
      .selectAll(".stats")
      .data((d: LeaderboardEntry) => [d], () => "stats")
      .join("text")
      .attr("class", "stats")
      .attr("x", chartWidth + 8)
      .attr("y", bandHeight / 2)
      .attr("text-anchor", "start")
      .attr("dominant-baseline", "middle")
      .style("font-size", "13px")
      .style("fill", "#64748b")
      .style("font-weight", 400)
      .text((d: LeaderboardEntry) => {
        const p = getMetricValue(d, primaryMetric);
        const s = getMetricValue(d, secondaryMetric);
        const pLabel = primaryMetric === "bordaScore" ? "pts" : "comments";
        const sLabel = secondaryMetric === "bordaScore" ? "pts" : "comments";
        return `${p} ${pLabel} · ${s} ${sLabel}`;
      });

    chart.selectAll("g.x-axis").remove();
    const xAxis = d3.axisTop(x).ticks(8);
    chart
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, -8)`)
      .call(xAxis);
  }, [sortedData, width, primaryIsBorda, primaryMetric, secondaryMetric]);

  return (
    <div ref={containerRef} className="w-full">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Primary metric</span>
        <div
          role="group"
          aria-label="Primary metric"
          className="inline-flex rounded-full bg-zinc-200 dark:bg-zinc-700 p-0.5"
        >
          <button
            type="button"
            onClick={() => setPrimaryIsBorda(true)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              primaryIsBorda
                ? "bg-white dark:bg-zinc-300 text-zinc-900 dark:text-zinc-900 shadow"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <span
              className="size-2 rounded-full shrink-0"
              style={{ backgroundColor: BORDA_FILL }}
            />
            Borda
          </button>
          <button
            type="button"
            onClick={() => setPrimaryIsBorda(false)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              !primaryIsBorda
                ? "bg-white dark:bg-zinc-300 text-zinc-900 dark:text-zinc-900 shadow"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <span
              className="size-2 rounded-full shrink-0"
              style={{ backgroundColor: MENTIONS_FILL }}
            />
            Mentions
          </button>
        </div>
      </div>
      <svg ref={svgRef} className="w-full block" />
    </div>
  );
}
