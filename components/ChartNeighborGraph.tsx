"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NeighborGraph } from "@/lib/neighborGraph";

interface ChartNeighborGraphProps {
  data: NeighborGraph;
}

type SimNode = { id: string; mentions: number; x?: number; y?: number };
type SimLink = {
  source: string | SimNode;
  target: string | SimNode;
  weight: number;
};

export function ChartNeighborGraph({ data }: ChartNeighborGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const simulationRef = useRef<ReturnType<
    typeof import("d3").forceSimulation
  > | null>(null);

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

  const { nodes: rawNodes, links: rawLinks } = data;
  const nodeById = useCallback(
    (id: string) => rawNodes.find((n) => n.id === id),
    [rawNodes],
  );
  const connectedTo = useCallback(
    (id: string) => {
      const set = new Set<string>();
      for (const l of rawLinks) {
        if (l.source === id || l.target === id) {
          set.add(
            l.source === id ? (l.target as string) : (l.source as string),
          );
        }
      }
      return set;
    },
    [rawLinks],
  );

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || rawNodes.length === 0)
      return;

    const d3 = require("d3");

    const { width, height } = dimensions;
    const nodes: SimNode[] = rawNodes.map((n) => ({ ...n }));
    const links: SimLink[] = rawLinks.map((l) => ({ ...l }));

    const LINK_DISTANCE = 80;
    const n = nodes.length;
    const estimatedRadius = Math.max(40, LINK_DISTANCE * Math.sqrt(n) * 0.5);
    const cx = width / 2;
    const cy = height / 2;
    nodes.forEach((d: SimNode, i: number) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      d.x = cx + estimatedRadius * Math.cos(angle);
      d.y = cy + estimatedRadius * Math.sin(angle);
    });

    const minMentions = d3.min(nodes, (d: SimNode) => d.mentions) ?? 1;
    const maxMentions = d3.max(nodes, (d: SimNode) => d.mentions) ?? 1;
    const maxWeight = d3.max(links, (d: SimLink) => d.weight) ?? 1;

    const nodeRadius = d3
      .scaleSqrt()
      .domain([minMentions, maxMentions])
      .range([4, 18]);
    const linkWidth = d3.scaleLinear().domain([1, maxWeight]).range([1, 6]);

    const padding = 20;
    const k0 = Math.min(width, height) / (2 * (estimatedRadius + padding));
    const tx0 = width / 2 - k0 * cx;
    const ty0 = height / 2 - k0 * cy;
    const initialTransform = d3.zoomIdentity.translate(tx0, ty0).scale(k0);

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g").attr("transform", initialTransform.toString());

    const zoom = d3
      .zoom()
      .scaleExtent([0.2, 4])
      .on("zoom", (event: { transform: { toString: () => string } }) =>
        g.attr("transform", event.transform.toString()),
      );
    svg.call(zoom).call(zoom.transform, initialTransform);

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: SimNode) => d.id)
          .distance(80),
      )
      .force("charge", d3.forceManyBody().strength(-120))
      .force("center", d3.forceCenter(cx, cy))
      .force(
        "collision",
        d3.forceCollide().radius((d: SimNode) => nodeRadius(d.mentions) + 2),
      );

    simulationRef.current = simulation;

    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.35)
      .attr("stroke-width", (d: SimLink) => linkWidth(d.weight));

    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag()
          .on(
            "start",
            (
              event: { active: number },
              d: SimNode & { fx?: number | null; fy?: number | null },
            ) => {
              if (!event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
            },
          )
          .on(
            "drag",
            (
              event: { x: number; y: number },
              d: SimNode & { fx?: number | null; fy?: number | null },
            ) => {
              d.fx = event.x;
              d.fy = event.y;
            },
          )
          .on(
            "end",
            (
              event: { active: number },
              d: SimNode & { fx?: number | null; fy?: number | null },
            ) => {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            },
          ),
      );

    node
      .append("circle")
      .attr("r", (d: SimNode) => nodeRadius(d.mentions))
      .attr("fill", "rgb(59, 130, 246)");
    // .attr("stroke", "rgb(30, 64, 175)")
    // .attr("stroke-width", 1.5);

    const LABEL_PADDING = 3;
    const labelText = (d: SimNode) =>
      d.id.length > 40 ? d.id.slice(0, 21) + "…" : d.id;

    node
      .append("rect")
      .attr("class", "label-bg")
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("fill", "white")
      .attr("fill-opacity", 0.8)
      .style("pointer-events", "none");

    node
      .append("text")
      .attr("y", (d: SimNode) => nodeRadius(d.mentions) + 14)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("font-size", "6px")
      .style("pointer-events", "none")
      .style("fill", "currentColor")
      .text(labelText);

    node.each(function (this: SVGGElement) {
      const sel = d3.select(this);
      const textEl = sel.select("text").node() as SVGTextElement | null;
      const rectSel = sel.select(".label-bg");
      if (textEl?.getBBox) {
        const bbox = textEl.getBBox();
        rectSel
          .attr("x", bbox.x - LABEL_PADDING)
          .attr("y", bbox.y - LABEL_PADDING)
          .attr("width", bbox.width + 2 * LABEL_PADDING)
          .attr("height", bbox.height + 2 * LABEL_PADDING);
      }
    });

    simulation.on("tick", () => {
      link
        .attr("x1", (d: SimLink) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d: SimLink) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d: SimLink) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d: SimLink) => (d.target as SimNode).y ?? 0);
      node.attr(
        "transform",
        (d: SimNode) => `translate(${d.x ?? 0},${d.y ?? 0})`,
      );
    });

    return () => {
      simulation.stop();
      simulationRef.current = null;
    };
  }, [data, dimensions, rawNodes, rawLinks]);

  // Hover and tooltip: re-apply after render so we can use hoverId
  useEffect(() => {
    if (!svgRef.current || rawNodes.length === 0) return;

    const d3 = require("d3");
    const svg = d3.select(svgRef.current);

    svg.selectAll(".links line").attr("stroke-opacity", (d: SimLink) => {
      if (!hoverId) return 0.35;
      const sid = typeof d.source === "object" ? d.source.id : d.source;
      const tid = typeof d.target === "object" ? d.target.id : d.target;
      return sid === hoverId || tid === hoverId ? 0.9 : 0.08;
    });

    svg
      .selectAll(".nodes g")
      .attr("opacity", (d: SimNode) =>
        !hoverId || d.id === hoverId || connectedTo(hoverId).has(d.id)
          ? 1
          : 0.25,
      );
  }, [hoverId, rawNodes, rawLinks, connectedTo]);

  useEffect(() => {
    if (!svgRef.current || rawNodes.length === 0) return;

    const d3 = require("d3");
    const node = d3.select(svgRef.current).selectAll(".nodes g");

    node
      .on("mouseenter", function (event: MouseEvent, d: SimNode) {
        setHoverId(d.id);
        setTooltipPos({ x: event.clientX, y: event.clientY });
      })
      .on("mousemove", function (event: MouseEvent) {
        setTooltipPos({ x: event.clientX, y: event.clientY });
      })
      .on("mouseleave", function () {
        setHoverId(null);
      });

    return () => {
      node.on("mouseenter", null).on("mouseleave", null);
    };
  }, [rawNodes, dimensions]);

  const tooltipNode = hoverId ? nodeById(hoverId) : null;

  if (rawNodes.length === 0) {
    return (
      <div className="w-full h-full min-h-0 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-sm">
        No episodes to show in the graph (need at least 2 with co-occurrences).
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full min-h-0">
      <svg
        ref={svgRef}
        className="w-full h-full block text-zinc-700 dark:text-zinc-300"
      />
      {tooltipNode && (
        <div
          className="fixed pointer-events-none z-10 px-3 py-2 text-sm rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 shadow-lg"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: "translate(10px, 10px)",
          }}
        >
          <div
            className="font-medium max-w-[240px] truncate"
            title={tooltipNode.id}
          >
            {tooltipNode.id}
          </div>
          <div className="text-xs opacity-90">
            {tooltipNode.mentions} mentions
          </div>
        </div>
      )}
    </div>
  );
}
