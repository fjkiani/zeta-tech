"use client"
import React from 'react';
import { ForceGraph2D } from 'react-force-graph';

const CourseGraph = ({ graphData }) => {
    if (!graphData || !graphData.nodes || !graphData.connections) {
        return <div>No graph data available</div>;
    }

    const graphDataFormatted = {
        nodes: graphData.nodes.map(node => ({
            id: node.id,
            label: node.title,
            duration: node.duration,
            type: node.type,
            color: getNodeColor(node.type)
        })),
        links: graphData.connections.map(conn => ({
            source: conn.source,
            target: conn.target,
            type: conn.type
        }))
    };

    const getNodeColor = (type) => {
        switch(type) {
            case 'core': return '#8b5cf6';    // Purple
            case 'tool': return '#3b82f6';    // Blue
            case 'concept': return '#10b981'; // Green
            default: return '#6b7280';        // Gray
        }
    };

    return (
        <div className="h-[600px] w-full border rounded-lg shadow-lg bg-white">
            <ForceGraph2D
                graphData={graphDataFormatted}
                nodeLabel={node => `${node.label} (${node.duration})`}
                nodeColor={node => node.color}
                nodeRelSize={8}
                linkDirectionalArrowLength={6}
                linkDirectionalArrowRelPos={1}
                onNodeClick={node => {
                    console.log('Clicked node:', node);
                    // Add node click handling here
                }}
            />
        </div>
    );
};

export default CourseGraph; 