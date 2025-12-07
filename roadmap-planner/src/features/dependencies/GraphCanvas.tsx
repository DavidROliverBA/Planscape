// GraphCanvas - D3.js force-directed/hierarchical graph visualization

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as dagre from 'dagre';
import type { GraphNode, GraphEdge, GraphLayout } from './DependencyGraph';

// Status colours
const statusColours: Record<string, string> = {
  Proposed: '#94A3B8',
  Planned: '#60A5FA',
  InProgress: '#3B82F6',
  Complete: '#22C55E',
  Cancelled: '#EF4444',
};

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  layout: GraphLayout;
  selectedNodeId: string | null;
  criticalPath: Set<string>;
  onNodeSelect: (nodeId: string | null) => void;
}

export function GraphCanvas({
  nodes,
  edges,
  layout,
  selectedNodeId,
  criticalPath,
  onNodeSelect,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [showNodeList, setShowNodeList] = useState(false);
  const nodeListId = useId();
  const descId = useId();

  // Graph description for screen readers
  const graphDescription = useMemo(() => {
    if (nodes.length === 0) return 'Empty dependency graph';
    const initiativeCount = nodes.filter(n => n.type === 'initiative').length;
    const systemCount = nodes.filter(n => n.type === 'system').length;
    const criticalCount = criticalPath.size;
    return `Dependency graph with ${nodes.length} nodes (${initiativeCount} initiatives, ${systemCount} systems) and ${edges.length} connections. ${criticalCount > 0 ? `${criticalCount} nodes on critical path.` : ''} Layout: ${layout}.`;
  }, [nodes, edges, layout, criticalPath]);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Render graph
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const nodeRadius = 25;

    // Add accessible title and description
    svg.append('title').text('Dependency Graph');
    svg.append('desc').text(graphDescription);

    // Create container group with zoom
    const g = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Arrow marker for edges
    svg.append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', nodeRadius + 10)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#9CA3AF');

    // Prepare node data with positions
    let positionedNodes: GraphNode[];

    if (layout === 'hierarchical') {
      positionedNodes = applyHierarchicalLayout(nodes, edges, width, height);
    } else if (layout === 'circular') {
      positionedNodes = applyCircularLayout(nodes, width, height);
    } else {
      // Force layout - initial positions
      positionedNodes = nodes.map((n) => ({
        ...n,
        x: width / 2 + Math.random() * 100 - 50,
        y: height / 2 + Math.random() * 100 - 50,
      }));
    }

    // Create edge data with node references
    const edgeData = edges.map((e) => ({
      ...e,
      source: positionedNodes.find((n) => n.id === e.source)!,
      target: positionedNodes.find((n) => n.id === e.target)!,
    })).filter((e) => e.source && e.target);

    // Draw edges
    const link = g.append('g')
      .attr('class', 'links')
      .attr('aria-hidden', 'true')
      .selectAll('line')
      .data(edgeData)
      .enter()
      .append('line')
      .attr('stroke', (d) => {
        if (criticalPath.has(d.source.id) && criticalPath.has(d.target.id)) {
          return '#EF4444'; // Critical path
        }
        return d.satisfied ? '#22C55E' : '#EF4444';
      })
      .attr('stroke-width', (d) => {
        if (criticalPath.has(d.source.id) && criticalPath.has(d.target.id)) {
          return 3;
        }
        return 2;
      })
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', 'url(#arrowhead)');

    // Draw nodes with accessibility
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(positionedNodes)
      .enter()
      .append('g')
      .attr('role', 'button')
      .attr('tabindex', 0)
      .attr('aria-label', (d) => {
        const status = d.status ? `, status: ${d.status}` : '';
        const effort = d.effort ? `, effort: ${d.effort} FTE` : '';
        const onCritical = criticalPath.has(d.id) ? ', on critical path' : '';
        const selected = d.id === selectedNodeId ? ', selected' : '';
        return `${d.name}, ${d.type}${status}${effort}${onCritical}${selected}`;
      })
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeSelect(d.id === selectedNodeId ? null : d.id);
      })
      .on('keydown', (event, d) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          onNodeSelect(d.id === selectedNodeId ? null : d.id);
        }
      })
      .on('focus', function () {
        d3.select(this).select('circle')
          .attr('stroke', '#1D4ED8')
          .attr('stroke-width', 4);
      })
      .on('blur', function (this: SVGGElement, _event: FocusEvent, d: GraphNode) {
        d3.select(this).select('circle')
          .attr('stroke', () => {
            if (d.id === selectedNodeId) return '#1D4ED8';
            if (criticalPath.has(d.id)) return '#EF4444';
            return '#fff';
          })
          .attr('stroke-width', () => {
            if (d.id === selectedNodeId) return 3;
            if (criticalPath.has(d.id)) return 2;
            return 2;
          });
      });

    // Node circles
    node.append('circle')
      .attr('r', (d) => {
        // Size based on effort
        const baseRadius = nodeRadius;
        if (d.effort) {
          return Math.min(baseRadius + d.effort * 0.5, baseRadius * 1.5);
        }
        return baseRadius;
      })
      .attr('fill', (d) => {
        if (d.type === 'system') return '#6366F1'; // indigo
        return statusColours[d.status ?? 'Proposed'] ?? '#94A3B8';
      })
      .attr('stroke', (d) => {
        if (d.id === selectedNodeId) return '#1D4ED8';
        if (criticalPath.has(d.id)) return '#EF4444';
        return '#fff';
      })
      .attr('stroke-width', (d) => {
        if (d.id === selectedNodeId) return 3;
        if (criticalPath.has(d.id)) return 2;
        return 2;
      });

    // Node labels
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', nodeRadius + 15)
      .attr('font-size', '11px')
      .attr('fill', '#374151')
      .attr('aria-hidden', 'true')
      .text((d) => truncate(d.name, 15));

    // Type icon inside node
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('font-size', '14px')
      .attr('fill', '#fff')
      .attr('aria-hidden', 'true')
      .text((d) => d.type === 'system' ? '💻' : getInitiativeIcon(d.initiativeType));

    if (layout === 'force') {
      // Force simulation
      const simulation = d3.forceSimulation(positionedNodes as d3.SimulationNodeDatum[])
        .force('link', d3.forceLink(edgeData)
          .id((d: any) => d.id)
          .distance(120))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(nodeRadius + 20));

      simulation.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      });

      // Drag behavior
      const drag = d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        });

      node.call(drag as any);

      return () => {
        simulation.stop();
      };
    } else {
      // Static layouts
      link
        .attr('x1', (d) => d.source.x ?? 0)
        .attr('y1', (d) => d.source.y ?? 0)
        .attr('x2', (d) => d.target.x ?? 0)
        .attr('y2', (d) => d.target.y ?? 0);

      node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    }
  }, [nodes, edges, layout, dimensions, selectedNodeId, criticalPath, onNodeSelect, graphDescription]);

  // Click on background to deselect
  const handleBackgroundClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  // Handle keyboard navigation for background
  const handleBackgroundKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onNodeSelect(null);
    }
  }, [onNodeSelect]);

  return (
    <div className="flex flex-col h-full">
      {/* Accessible node list toggle */}
      <div className="flex justify-end px-4 py-2 bg-white border-b border-gray-200">
        <button
          type="button"
          onClick={() => setShowNodeList(!showNodeList)}
          aria-expanded={showNodeList}
          aria-controls={nodeListId}
          className="text-xs text-primary-600 hover:text-primary-800 underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
        >
          {showNodeList ? 'Hide node list' : 'Show node list'}
        </button>
      </div>

      {/* Accessible node list */}
      {showNodeList && (
        <div id={nodeListId} className="px-4 py-2 bg-white border-b border-gray-200 max-h-48 overflow-y-auto">
          <table className="min-w-full text-xs">
            <caption className="sr-only">Graph nodes</caption>
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-2 py-1 text-left font-medium text-gray-700">Name</th>
                <th scope="col" className="px-2 py-1 text-left font-medium text-gray-700">Type</th>
                <th scope="col" className="px-2 py-1 text-left font-medium text-gray-700">Status</th>
                <th scope="col" className="px-2 py-1 text-left font-medium text-gray-700">Critical</th>
                <th scope="col" className="px-2 py-1 text-left font-medium text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {nodes.map((node) => (
                <tr key={node.id} className={selectedNodeId === node.id ? 'bg-primary-50' : ''}>
                  <td className="px-2 py-1 text-gray-900">{node.name}</td>
                  <td className="px-2 py-1 text-gray-600">{node.type}</td>
                  <td className="px-2 py-1 text-gray-600">{node.status ?? '-'}</td>
                  <td className="px-2 py-1 text-gray-600">{criticalPath.has(node.id) ? 'Yes' : 'No'}</td>
                  <td className="px-2 py-1">
                    <button
                      type="button"
                      onClick={() => onNodeSelect(node.id === selectedNodeId ? null : node.id)}
                      className="text-primary-600 hover:text-primary-800 underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                    >
                      {selectedNodeId === node.id ? 'Deselect' : 'Select'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Graph container */}
      <div
        ref={containerRef}
        className="flex-1 bg-gray-50"
        onClick={handleBackgroundClick}
        onKeyDown={handleBackgroundKeyDown}
        role="application"
        aria-label={graphDescription}
        aria-describedby={descId}
      >
        <p id={descId} className="sr-only">
          {graphDescription} Use Tab to navigate between nodes, Enter or Space to select.
        </p>
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-full"
          role="graphics-document"
          aria-roledescription="dependency graph"
        />
      </div>
    </div>
  );
}

function applyHierarchicalLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number
): GraphNode[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 100 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((n) => {
    g.setNode(n.id, { width: 60, height: 60 });
  });

  edges.forEach((e) => {
    g.setEdge(e.source, e.target);
  });

  dagre.layout(g);

  return nodes.map((n) => {
    const nodeWithPos = g.node(n.id);
    return {
      ...n,
      x: nodeWithPos?.x ?? width / 2,
      y: nodeWithPos?.y ?? height / 2,
    };
  });
}

function applyCircularLayout(
  nodes: GraphNode[],
  width: number,
  height: number
): GraphNode[] {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.35;

  return nodes.map((n, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
    return {
      ...n,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

function getInitiativeIcon(type?: string): string {
  switch (type) {
    case 'New': return '✨';
    case 'Upgrade': return '⬆️';
    case 'Migration': return '➡️';
    case 'Decommission': return '🗑️';
    case 'Replacement': return '🔄';
    default: return '📋';
  }
}
