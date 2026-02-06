"use client";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import * as d3 from "d3";

export default function KnowledgeGraph({ chapters }) {
  const [isMounted, setIsMounted] = useState(false);
  const fgRef = useRef();

  const ForceGraph2D = dynamic(
    () => import("react-force-graph").then((mod) => mod.ForceGraph2D),
    { ssr: false }
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const assignCategory = (name, categories) => {
    // Dynamically assign a category based on the chapter name
    const words = name.toLowerCase().split(" ");
    for (const word of words) {
      if (categories.has(word)) {
        return categories.get(word);
      }
    }
    // If no category matches, create a new one
    const newCategory = name.split(" ")[0]; // Use the first word as the category
    const dynamicColor = `hsl(${Math.random() * 360}, 70%, 60%)`; // Random color
    categories.set(newCategory.toLowerCase(), { id: newCategory, color: dynamicColor });
    return categories.get(newCategory.toLowerCase());
  };

  const prepareGraphData = (chapters) => {
    if (!chapters) return { nodes: [], links: [], categories: [] };

    const categories = new Map(); // Dynamic category mapping

    const nodes = chapters.map((chapter, index) => {
      const categoryData = assignCategory(chapter.name, categories);
      return {
        id: index,
        name: chapter.name,
        category: categoryData.id,
        size: 8,
        x: Math.random() * 800 - 400,
        y: Math.random() * 800 - 400,
      };
    });

    const links = [];
    nodes.forEach((source, i) => {
      nodes.forEach((target, j) => {
        if (i !== j) {
          links.push({
            source: source.id,
            target: target.id,
            value: source.category === target.category ? 2 : 1,
            distance: source.category === target.category ? 100 : 200,
          });
        }
      });
    });

    return {
      nodes,
      links,
      categories: Array.from(categories.values()), // Convert Map to array for the legend
    };
  };

  if (!isMounted) return null;

  const graphData = prepareGraphData(chapters);

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      {/* Dynamic Legend */}
      <div className="flex gap-6 mb-8 flex-wrap">
        {graphData.categories.map((category) => (
          <div key={category.id} className="flex items-center">
            <div
              className="w-4 h-4 rounded-full mr-2"
              style={{ backgroundColor: category.color }}
            />
            <span className="text-sm font-medium">{category.id} Topics</span>
          </div>
        ))}
      </div>
      <div className="h-[600px]">
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          nodeRelSize={6}
          linkWidth={1.5}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.005}
          linkColor={(link) => {
            const sourceNode = graphData.nodes.find((n) => n.id === link.source.id);
            return sourceNode
              ? graphData.categories.find((c) => c.id === sourceNode.category)?.color
              : "rgba(200,200,200,0.2)";
          }}
          nodeColor={(node) => {
            const category = graphData.categories.find((c) => c.id === node.category);
            return category?.color;
          }}
          d3Force={{
            charge: -300,
            link: d3.forceLink()
              .id((d) => d.id)
              .distance((d) => d.distance)
              .strength(0.5),
            center: d3.forceCenter(0, 0),
            collide: d3.forceCollide(30),
          }}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12 / globalScale;

            // Node circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = graphData.categories.find((c) => c.id === node.category)?.color;
            ctx.fill();

            // Label with background
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth + 8, fontSize + 4].map((n) => n + fontSize * 0.2);

            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.fillRect(
              node.x + 6,
              node.y - bckgDimensions[1] / 2,
              bckgDimensions[0],
              bckgDimensions[1]
            );

            ctx.font = `${fontSize}px Inter`;
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#334155";
            ctx.fillText(label, node.x + 8, node.y);
          }}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          cooldownTicks={50}
          d3VelocityDecay={0.1}
        />
      </div>
    </div>
  );
}
