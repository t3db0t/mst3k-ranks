"use client";

import { useEffect, useRef, useState } from "react";

export interface HeatmapEntry {
  title: string;
  bordaScore: number;
  mentions: number;
  rankDistribution: Record<number, number>;
}

/** Match leaderboard row height so heatmap rows align visually */
const CELL_HEIGHT = 36;

interface ChartHeatmapProps {
  data: HeatmapEntry[];
  maxTitles?: number;
}

export function ChartHeatmap({ data, maxTitles = 25 }: ChartHeatmapProps) {
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

    const topData = data.slice(0, maxTitles);
    const ranks = [1, 2, 3, 4, 5];
    const maxVal =
      d3.max(
        topData.flatMap((d: HeatmapEntry) =>
          ranks.map((r) => d.rankDistribution[r] ?? 0),
        ),
      ) ?? 1;

    const margin = { top: 28, right: 24, bottom: 24, left: 200 };
    const innerWidth = width - margin.left - margin.right;
    const cellWidth = innerWidth / ranks.length;
    const cellHeight = CELL_HEIGHT;
    const chartHeight = topData.length * cellHeight;
    const cellGap = 2;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", chartHeight + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const colorScale = d3
      .scaleSequential(d3.interpolateBlues)
      .domain([0, maxVal]);

    // sRGB luminance coefficients (R, G, B); result 0–1. Tweak to change how "dark" is judged.
    const LUMINANCE_COEFFS = [0.2126, 0.7152, 0.0722] as const;
    const LUMINANCE_WHITE_THRESHOLD = 0.6;

    function luminanceOf(color: string): number {
      const c = d3.color(color);
      if (!c || !("r" in c)) return 1;
      const rgb = c as { r: number; g: number; b: number };
      const [kr, kg, kb] = LUMINANCE_COEFFS;
      return kr * (rgb.r / 255) + kg * (rgb.g / 255) + kb * (rgb.b / 255);
    }

    topData.forEach((row, i) => {
      ranks.forEach((rank, j) => {
        const val = row.rankDistribution[rank] ?? 0;
        const fill = colorScale(val);
        svg
          .append("rect")
          .attr("x", j * cellWidth + cellGap / 2)
          .attr("y", i * cellHeight + cellGap / 2)
          .attr("width", cellWidth - cellGap)
          .attr("height", cellHeight - cellGap)
          .attr("fill", fill)
          .attr("rx", 2);
        if (val > 0) {
          const textFill =
            luminanceOf(fill) < LUMINANCE_WHITE_THRESHOLD ? "white" : "#374151";
          svg
            .append("text")
            .attr("x", j * cellWidth + cellWidth / 2)
            .attr("y", i * cellHeight + cellHeight / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .style(
              "font-size",
              Math.max(10, Math.round(cellHeight * 0.45)) + "px",
            )
            .style("font-weight", 600)
            .style("fill", textFill)
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
        .style("font-size", Math.max(11, Math.round(cellHeight * 0.45)) + "px")
        .text(row.title.length > 32 ? row.title.slice(0, 29) + "…" : row.title);
    });

    ranks.forEach((rank, j) => {
      svg
        .append("text")
        .attr("x", j * cellWidth + cellWidth / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", Math.max(11, Math.round(cellHeight * 0.4)) + "px")
        .text(`#${rank}`);
    });
  }, [data, maxTitles, width]);

  return (
    <div ref={containerRef} className="w-full">
      <svg ref={svgRef} className="w-full block" />
    </div>
  );
}
