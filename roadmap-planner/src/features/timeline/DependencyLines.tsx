// Dependency Lines - Draw lines between dependent initiatives on the timeline

import { useMemo } from 'react';
import type { Initiative, InitiativeDependency } from '@/lib/types';
import { checkDependencies } from '@/lib/dependencyEngine';
import type { TimelineInitiative } from './useTimelineData';

interface DependencyLinesProps {
  initiatives: TimelineInitiative[];
  allInitiatives: Initiative[];
  dependencies: InitiativeDependency[];
  dateScale: (date: Date) => number;
  getInitiativeY: (initiativeId: string) => number | null;
  barHeight: number;
  visible: boolean;
}

interface LineData {
  id: string;
  fromId: string;
  toId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isViolated: boolean;
  dependencyType: string;
}

export function DependencyLines({
  initiatives,
  allInitiatives,
  dependencies,
  dateScale,
  getInitiativeY,
  barHeight,
  visible,
}: DependencyLinesProps) {
  const lines = useMemo(() => {
    if (!visible) return [];

    const lineData: LineData[] = [];
    const initiativeMap = new Map(initiatives.map((i) => [i.id, i]));

    for (const dep of dependencies) {
      const predecessor = initiativeMap.get(dep.predecessorId);
      const successor = initiativeMap.get(dep.successorId);

      if (!predecessor || !successor) continue;

      const predY = getInitiativeY(predecessor.id);
      const succY = getInitiativeY(successor.id);

      if (predY === null || succY === null) continue;

      // Calculate line endpoints based on dependency type
      let fromX: number;
      let toX: number;

      switch (dep.dependencyType) {
        case 'FinishToStart':
          fromX = dateScale(predecessor.endDateObj);
          toX = dateScale(successor.startDateObj);
          break;
        case 'StartToStart':
          fromX = dateScale(predecessor.startDateObj);
          toX = dateScale(successor.startDateObj);
          break;
        case 'FinishToFinish':
          fromX = dateScale(predecessor.endDateObj);
          toX = dateScale(successor.endDateObj);
          break;
        case 'StartToFinish':
          fromX = dateScale(predecessor.startDateObj);
          toX = dateScale(successor.endDateObj);
          break;
        default:
          fromX = dateScale(predecessor.endDateObj);
          toX = dateScale(successor.startDateObj);
      }

      // Check if this dependency is violated
      const fullSuccessor = allInitiatives.find((i) => i.id === successor.id);
      let isViolated = false;
      if (fullSuccessor) {
        const violations = checkDependencies(
          fullSuccessor,
          allInitiatives,
          dependencies,
        );
        isViolated = violations.some((v) => v.dependsOnId === predecessor.id);
      }

      lineData.push({
        id: dep.id,
        fromId: predecessor.id,
        toId: successor.id,
        fromX,
        fromY: predY + barHeight / 2,
        toX,
        toY: succY + barHeight / 2,
        isViolated,
        dependencyType: dep.dependencyType,
      });
    }

    return lineData;
  }, [
    visible,
    initiatives,
    allInitiatives,
    dependencies,
    dateScale,
    getInitiativeY,
    barHeight,
  ]);

  if (!visible || lines.length === 0) return null;

  return (
    <g className="dependency-lines">
      {/* Arrow marker definitions */}
      <defs>
        <marker
          id="arrowhead-green"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#22C55E" />
        </marker>
        <marker
          id="arrowhead-red"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#EF4444" />
        </marker>
      </defs>

      {lines.map((line) => {
        // Create a curved path
        const midX = (line.fromX + line.toX) / 2;
        const controlY =
          line.fromY === line.toY
            ? line.fromY - 30 // Curve up if on same row
            : (line.fromY + line.toY) / 2;

        const pathD = `M ${line.fromX} ${line.fromY} Q ${midX} ${controlY} ${line.toX} ${line.toY}`;

        return (
          <path
            key={line.id}
            d={pathD}
            fill="none"
            stroke={line.isViolated ? '#EF4444' : '#22C55E'}
            strokeWidth={line.isViolated ? 2 : 1.5}
            strokeDasharray={line.isViolated ? '4,4' : 'none'}
            opacity={0.7}
            markerEnd={
              line.isViolated
                ? 'url(#arrowhead-red)'
                : 'url(#arrowhead-green)'
            }
            className="pointer-events-none"
          />
        );
      })}
    </g>
  );
}

// Helper component to show dependency line legend
export function DependencyLinesLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-gray-500">
      <div className="flex items-center gap-1">
        <div className="w-4 h-0.5 bg-green-500" />
        <span>Satisfied</span>
      </div>
      <div className="flex items-center gap-1">
        <div
          className="w-4 h-0.5 bg-red-500"
          style={{ backgroundImage: 'repeating-linear-gradient(90deg, #EF4444 0, #EF4444 4px, transparent 4px, transparent 8px)' }}
        />
        <span>Violated</span>
      </div>
    </div>
  );
}
