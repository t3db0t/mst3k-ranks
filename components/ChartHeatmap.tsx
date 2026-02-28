"use client";

import { useEffect, useRef, useState } from "react";

export interface HeatmapEntry {
  title: string;
  bordaScore: number;
  mentions: number;
  rankDistribution: Record<number, number>;
}

interface ChartHeatmapProps {
  data: HeatmapEntry[];
  maxTitles?: number;
}

export function ChartHeatmap({ data, maxTitles = 25 }: ChartHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) setDimensions({ width, height });
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const d3 = require("d3");

    const topData = data.slice(0, maxTitles);
    const ranks = [1, 2, 3, 4, 5];
    const maxVal = d3.max(
      topData.flatMap((d: HeatmapEntry) => ranks.map((r) => d.rankDistribution[r] ?? 0))
    ) ?? 1;

    const margin = { top: 28, right: 30, bottom: 24, left: 200 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;
    const cellWidth = innerWidth / ranks.length;
    const cellHeight = Math.max(20, innerHeight / topData.length);
    const cellGap = 2;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, maxVal]);

    topData.forEach((row, i) => {
      ranks.forEach((rank, j) => {
        const val = row.rankDistribution[rank] ?? 0;
        svg
          .append("rect")
          .attr("x", j * cellWidth + cellGap / 2)
          .attr("y", i * cellHeight + cellGap / 2)
          .attr("width", cellWidth - cellGap)
          .attr("height", cellHeight - cellGap)
          .attr("fill", colorScale(val))
          .attr("rx", 2);
        if (val > 0) {
          svg
            .append("text")
            .attr("x", j * cellWidth + cellWidth / 2)
            .attr("y", i * cellHeight + cellHeight / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .style("font-size", Math.max(10, cellHeight * 0.4) + "px")
            .style("font-weight", 600)
            .text(val);
        }
      });
    });

    topData.forEach((row, i) => {
      svg
        .append("text")
        .attr("x", -10)
        .attr("y", i * cellHeight + cellHeight / 2)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .style("font-size", Math.max(11, cellHeight * 0.45) + "px")
        .text(row.title.length > 32 ? row.title.slice(0, 29) + "…" : row.title);
    });

    ranks.forEach((rank, j) => {
      svg
        .append("text")
        .attr("x", j * cellWidth + cellWidth / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", Math.max(11, cellHeight * 0.35) + "px")
        .text(`#${rank}`);
    });
  }, [data, maxTitles, dimensions]);

  return (
    <div ref={containerRef} className="w-full h-[min(60vh,700px)] min-h-[400px]">
      <svg ref={svgRef} className="w-full h-full block" />
    </div>
  );
}
