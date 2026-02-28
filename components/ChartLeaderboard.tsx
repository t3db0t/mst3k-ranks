"use client";

import { useEffect, useRef, useState } from "react";

export interface LeaderboardEntry {
  title: string;
  bordaScore: number;
  mentions: number;
}

interface ChartLeaderboardProps {
  data: LeaderboardEntry[];
}

const BAR_HEIGHT = 36;
const BAR_PADDING = 0.12;

export function ChartLeaderboard({ data }: ChartLeaderboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(800);

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

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const d3 = require("d3");

    const margin = { top: 32, right: 145, bottom: 24, left: 30 };
    const chartWidth = width - margin.left - margin.right;
    const height = data.length * BAR_HEIGHT;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const maxScore = d3.max(data, (d: LeaderboardEntry) => d.bordaScore) ?? 1;
    const x = d3.scaleLinear().domain([0, maxScore]).range([0, chartWidth]);
    const y = d3
      .scaleBand()
      .domain(data.map((_, i) => i))
      .range([0, height])
      .padding(BAR_PADDING);

    svg
      .selectAll(".bar")
      .data(data)
      .join("rect")
      .attr("class", "bar")
      .attr("x", 0)
      .attr("y", (_: LeaderboardEntry, i: number) => y(i) ?? 0)
      .attr("height", y.bandwidth())
      .attr("width", (d: LeaderboardEntry) => x(d.bordaScore))
      .attr("fill", "steelblue")
      .attr("rx", 3);

    svg
      .selectAll(".rank")
      .data(data)
      .join("text")
      .attr("class", "rank")
      .attr("x", -12)
      .attr(
        "y",
        (_: LeaderboardEntry, i: number) => (y(i) ?? 0) + y.bandwidth() / 2,
      )
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .style("font-size", "15px")
      .style("fill", "#666")
      .text((_: LeaderboardEntry, i: number) => `${i + 1}.`);

    const labelGroup = svg
      .selectAll(".label-wrap")
      .data(data)
      .join("g")
      .attr("class", "label-wrap");

    labelGroup.each(function (
      this: SVGGElement,
      d: LeaderboardEntry,
      i: number,
    ) {
      const barWidth = x(d.bordaScore);
      const yy = (y(i) ?? 0) + y.bandwidth() / 2;
      const textEl = d3
        .select(this)
        .append("text")
        .attr("class", "label")
        .attr("y", yy)
        .attr("dominant-baseline", "middle")
        .style("font-size", "15px")
        .style("font-weight", 500)
        .style("font-family", "inherit")
        .text(d.title);

      const node = textEl.node() as SVGTextElement | null;
      const textWidth = node?.getComputedTextLength?.() ?? d.title.length * 9;
      const labelPadding = 12;
      const fitsInBar = textWidth + labelPadding < barWidth;

      textEl
        .attr("x", fitsInBar ? 10 : barWidth + 10)
        .attr("text-anchor", "start")
        .style("fill", fitsInBar ? "white" : "currentColor");
    });

    const statsGroup = svg
      .selectAll(".stats")
      .data(data)
      .join("text")
      .attr("class", "stats")
      .attr("x", chartWidth + 8)
      .attr(
        "y",
        (_: LeaderboardEntry, i: number) => (y(i) ?? 0) + y.bandwidth() / 2,
      )
      .attr("text-anchor", "start")
      .attr("dominant-baseline", "middle")
      .style("font-size", "13px")
      .style("fill", "#64748b")
      .style("font-weight", 400)
      .text(
        (d: LeaderboardEntry) => `${d.bordaScore} pts · ${d.mentions} comments`,
      );

    const xAxis = d3.axisTop(x).ticks(8);
    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, -8)`)
      .call(xAxis);
  }, [data, width]);

  return (
    <div ref={containerRef} className="w-full">
      <svg ref={svgRef} className="w-full block" />
    </div>
  );
}
