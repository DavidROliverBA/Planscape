// DependencyGraph - Main container for dependency graph view

import { useMemo, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { GraphCanvas } from './GraphCanvas';
import { DependencyGraphToolbar } from './DependencyGraphToolbar';

export type GraphLayout = 'force' | 'hierarchical' | 'circular';
export type NodeFilter = 'initiatives' | 'systems' | 'both';

export interface GraphNode {
  id: string;
  name: string;
  type: 'initiative' | 'system';
  status?: string;
  initiativeType?: string;
  effort?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  satisfied: boolean;
  lag?: number;
}

export function DependencyGraph() {
  const { initiatives, systems, activeScenarioId } = useAppStore();

  // For now, use a simplified dependency structure since we don't have
  // initiative dependencies in the store yet
  const [layout, setLayout] = useState<GraphLayout>('force');
  const [nodeFilter, setNodeFilter] = useState<NodeFilter>('initiatives');
  const [highlightCriticalPath, setHighlightCriticalPath] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Get initiatives for current scenario
  const scenarioInitiatives = useMemo(
    () => initiatives.filter((i) => i.scenarioId === activeScenarioId),
    [initiatives, activeScenarioId]
  );

  // Build graph nodes
  const nodes = useMemo((): GraphNode[] => {
    const result: GraphNode[] = [];

    if (nodeFilter === 'initiatives' || nodeFilter === 'both') {
      scenarioInitiatives.forEach((initiative) => {
        result.push({
          id: initiative.id,
          name: initiative.name,
          type: 'initiative',
          status: initiative.status,
          initiativeType: initiative.type,
          effort: initiative.effortEstimate,
        });
      });
    }

    if (nodeFilter === 'systems' || nodeFilter === 'both') {
      systems.forEach((system) => {
        result.push({
          id: system.id,
          name: system.name,
          type: 'system',
        });
      });
    }

    return result;
  }, [scenarioInitiatives, systems, nodeFilter]);

  // Build graph edges (simplified - creates demo edges based on dates)
  const edges = useMemo((): GraphEdge[] => {
    const result: GraphEdge[] = [];

    // For demo purposes, create edges between initiatives that have overlapping dates
    // In a real implementation, this would come from InitiativeDependency records
    const sortedInitiatives = [...scenarioInitiatives]
      .filter((i) => i.startDate && i.endDate)
      .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());

    for (let i = 0; i < sortedInitiatives.length - 1; i++) {
      const current = sortedInitiatives[i];
      const next = sortedInitiatives[i + 1];

      // Create a dependency if the next initiative starts after or near current's start
      if (current.endDate && next.startDate) {
        const currentEnd = new Date(current.endDate);
        const nextStart = new Date(next.startDate);
        const daysDiff = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60 * 60 * 24);

        // Create edge if they're sequential (within 90 days)
        if (daysDiff >= -30 && daysDiff <= 90) {
          result.push({
            id: `${current.id}-${next.id}`,
            source: current.id,
            target: next.id,
            type: 'FinishToStart',
            satisfied: daysDiff >= 0,
            lag: Math.round(daysDiff),
          });
        }
      }
    }

    return result;
  }, [scenarioInitiatives]);

  // Calculate critical path (simplified - longest chain)
  const criticalPath = useMemo(() => {
    if (!highlightCriticalPath) return new Set<string>();

    // Simple implementation - find longest chain of edges
    const nodeEdges = new Map<string, GraphEdge[]>();
    edges.forEach((edge) => {
      if (!nodeEdges.has(edge.source)) {
        nodeEdges.set(edge.source, []);
      }
      nodeEdges.get(edge.source)!.push(edge);
    });

    // DFS to find longest path
    const visited = new Set<string>();

    function findLongestPath(nodeId: string): string[] {
      if (visited.has(nodeId)) return [];
      visited.add(nodeId);

      const outEdges = nodeEdges.get(nodeId) ?? [];
      let longestPath: string[] = [nodeId];

      for (const edge of outEdges) {
        const subPath = findLongestPath(edge.target);
        if (subPath.length + 1 > longestPath.length) {
          longestPath = [nodeId, ...subPath];
        }
      }

      visited.delete(nodeId);
      return longestPath;
    }

    // Find longest path starting from each node
    let longestOverall: string[] = [];
    nodes.forEach((node) => {
      const path = findLongestPath(node.id);
      if (path.length > longestOverall.length) {
        longestOverall = path;
      }
    });

    return new Set(longestOverall);
  }, [edges, nodes, highlightCriticalPath]);

  const handleNodeSelect = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  };

  if (nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No dependencies</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add initiatives to see the dependency graph.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <DependencyGraphToolbar
        layout={layout}
        onLayoutChange={setLayout}
        nodeFilter={nodeFilter}
        onNodeFilterChange={setNodeFilter}
        highlightCriticalPath={highlightCriticalPath}
        onHighlightCriticalPathChange={setHighlightCriticalPath}
        criticalPathLength={criticalPath.size}
      />

      <div className="flex-1 overflow-hidden">
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          layout={layout}
          selectedNodeId={selectedNodeId}
          criticalPath={criticalPath}
          onNodeSelect={handleNodeSelect}
        />
      </div>
    </div>
  );
}
