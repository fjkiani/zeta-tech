'use client';

import React, { useMemo, useEffect } from 'react';
import ReactFlow, { Background, Controls, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = direction === 'TB' ? 'top' : 'left';
        node.sourcePosition = direction === 'TB' ? 'bottom' : 'right';

        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };

        return node;
    });

    return { nodes: layoutedNodes, edges };
};

export default function MindMapViewer({ url }) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useEffect(() => {
        async function fetchData() {
            if (!url) return;
            try {
                const res = await fetch(url);
                const data = await res.json();

                // Transform custom JSON to ReactFlow format
                // Expected JSON: { nodes: [ { id, label, parent? } ] }

                const rfNodes = [];
                const rfEdges = [];

                // 1. Create Nodes
                data.nodes.forEach(n => {
                    rfNodes.push({
                        id: n.id,
                        data: { label: n.label },
                        position: { x: 0, y: 0 }, // layout will fix
                        style: {
                            background: n.parent ? '#fff' : '#f0f9ff', // root different color
                            border: n.parent ? '1px solid #777' : '2px solid #2563eb',
                            borderRadius: '8px',
                            padding: '10px',
                            width: 150,
                            textAlign: 'center',
                            fontSize: '12px'
                        }
                    });

                    // 2. Create Edge if parent exists
                    if (n.parent) {
                        rfEdges.push({
                            id: `e${n.parent}-${n.id}`,
                            source: n.parent,
                            target: n.id,
                            type: 'smoothstep',
                            animated: true,
                            style: { stroke: '#94a3b8' }
                        });
                    }
                });

                const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                    rfNodes,
                    rfEdges
                );

                setNodes(layoutedNodes);
                setEdges(layoutedEdges);

            } catch (e) {
                console.error("Failed to load MindMap:", e);
            }
        }
        fetchData();
    }, [url, setNodes, setEdges]);

    return (
        <div style={{ height: 600, width: '100%', border: '1px solid #e2e8f0', borderRadius: 12, background: '#f8fafc' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
}
