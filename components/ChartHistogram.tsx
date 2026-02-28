"use client";

import { useEffect, useRef, useState } from "react";

export interface HistogramEntry {
  title: string;
  bordaScore: number;
  mentions: number;
}

interface BinType {
  length: number;
  x0?: number;
  x1?: number;
}

interface ChartHistogramProps {
  data: HistogramEntry[];
}

export function ChartHistogram({ data }: ChartHistogramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 450 });

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

    const margin = { top: 40, right: 30, bottom: 60, left: 60 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

    const chartG = svg
      .append("g")
      .attr("class", "chart")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const bins = d3
      .bin()
      .thresholds(20)
      .value((d: HistogramEntry) => d.bordaScore)(data) as BinType[];

    const y = d3.scaleLinear().domain([0, d3.max(bins, (b: BinType) => b.length) ?? 1]).range([height, 0]);
    const x = d3
      .scaleLinear()
      .domain([d3.min(bins, (b: BinType) => b.x0) ?? 0, d3.max(bins, (b: BinType) => b.x1) ?? 1])
      .range([0, width]);

    chartG
      .selectAll("rect")
      .data(bins)
      .join("rect")
      .attr("x", (d: BinType) => x(d.x0!) + 1)
      .attr("y", (d: BinType) => y(d.length))
      .attr("width", (d: BinType) => Math.max(0, x(d.x1!) - x(d.x0!) - 1))
      .attr("height", (d: BinType) => height - y(d.length))
      .attr("fill", "steelblue")
      .attr("rx", 2);

    const xAxis = d3.axisBottom(x).ticks(10);
    chartG.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`).call(xAxis);

    const yAxis = d3.axisLeft(y).ticks(8);
    chartG.append("g").attr("class", "y-axis").call(yAxis);

    chartG
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + 45)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Borda Score");

    chartG
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -45)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Count");

    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 4])
      .on("zoom", (event: { transform: { x: number; y: number; k: number } }) => {
        const { x, y, k } = event.transform;
        chartG.attr(
          "transform",
          `translate(${margin.left + x},${margin.top + y}) scale(${k})`
        );
      });
    svg.call(zoom);
  }, [data, dimensions]);

  return (
    <div ref={containerRef} className="w-full h-[min(50vh,500px)] min-h-[350px]">
      <svg ref={svgRef} className="w-full h-full block" />
    </div>
  );
}
