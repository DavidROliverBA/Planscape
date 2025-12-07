// TimelineMilestones - Renders constraint deadlines and system support dates as markers

import { useCallback, useMemo, useState } from 'react';
import type * as d3 from 'd3';
import { useAppStore } from '@/stores/appStore';
import type { Constraint, System } from '@/lib/types';

// Milestone marker colours
const milestoneColours = {
  hardConstraint: '#EF4444', // red-500
  softConstraint: '#F59E0B', // amber-500
  supportEnd: '#8B5CF6', // purple-500
  extendedSupportEnd: '#6B7280', // gray-500
};

export interface Milestone {
  id: string;
  date: Date;
  type: 'hardConstraint' | 'softConstraint' | 'supportEnd' | 'extendedSupportEnd';
  name: string;
  description?: string;
  entityType: 'constraint' | 'system';
  entityId: string;
}

interface TimelineMilestonesProps {
  dateScale: d3.ScaleTime<number, number>;
  height: number;
  headerHeight: number;
  swimlaneHeaderWidth: number;
}

export function TimelineMilestones({
  dateScale,
  height,
  headerHeight,
  swimlaneHeaderWidth,
}: TimelineMilestonesProps) {
  const { constraints, systems, selectSystem } = useAppStore();
  const [hoveredMilestone, setHoveredMilestone] = useState<Milestone | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Build milestones from constraints and systems
  const milestones = useMemo(() => {
    const result: Milestone[] = [];

    // Add constraint deadlines (using expiryDate as the deadline)
    constraints.forEach((constraint: Constraint) => {
      if (constraint.expiryDate) {
        result.push({
          id: `constraint-${constraint.id}`,
          date: new Date(constraint.expiryDate),
          type: constraint.hardness === 'Hard' ? 'hardConstraint' : 'softConstraint',
          name: constraint.name,
          description: constraint.description,
          entityType: 'constraint',
          entityId: constraint.id,
        });
      }
    });

    // Add system support end dates
    systems.forEach((system: System) => {
      if (system.supportEndDate) {
        result.push({
          id: `support-${system.id}`,
          date: new Date(system.supportEndDate),
          type: 'supportEnd',
          name: `${system.name} Support End`,
          description: `Vendor support ends for ${system.name}`,
          entityType: 'system',
          entityId: system.id,
        });
      }
      if (system.extendedSupportEndDate) {
        result.push({
          id: `extended-${system.id}`,
          date: new Date(system.extendedSupportEndDate),
          type: 'extendedSupportEnd',
          name: `${system.name} Extended Support End`,
          description: `Extended support ends for ${system.name}`,
          entityType: 'system',
          entityId: system.id,
        });
      }
    });

    // Sort by date
    return result.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [constraints, systems]);

  const handleMouseEnter = useCallback((milestone: Milestone, x: number, y: number) => {
    setHoveredMilestone(milestone);
    setTooltipPosition({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredMilestone(null);
  }, []);

  const handleClick = useCallback((milestone: Milestone) => {
    if (milestone.entityType === 'system') {
      selectSystem(milestone.entityId);
    }
    // TODO: Add constraint selection when implemented
  }, [selectSystem]);

  if (milestones.length === 0) {
    return null;
  }

  return (
    <g className="timeline-milestones">
      {milestones.map((milestone) => {
        const x = dateScale(milestone.date);
        const colour = milestoneColours[milestone.type];

        // Skip if outside visible area
        if (x < swimlaneHeaderWidth) return null;

        return (
          <g key={milestone.id}>
            {/* Vertical line from header to bottom */}
            <line
              x1={x}
              y1={headerHeight}
              x2={x}
              y2={height}
              stroke={colour}
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.5}
            />

            {/* Marker in header area */}
            {milestone.type === 'hardConstraint' || milestone.type === 'softConstraint' ? (
              // Diamond marker for constraints
              <g
                transform={`translate(${x}, ${headerHeight - 12})`}
                onMouseEnter={(e) => handleMouseEnter(milestone, e.clientX, e.clientY)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleClick(milestone)}
                className="cursor-pointer"
              >
                <polygon
                  points="0,-8 8,0 0,8 -8,0"
                  fill={colour}
                  stroke="white"
                  strokeWidth={1}
                  className="hover:opacity-80 transition-opacity"
                />
              </g>
            ) : (
              // Triangle marker for system support dates
              <g
                transform={`translate(${x}, ${headerHeight - 12})`}
                onMouseEnter={(e) => handleMouseEnter(milestone, e.clientX, e.clientY)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleClick(milestone)}
                className="cursor-pointer"
              >
                <polygon
                  points="0,-8 8,8 -8,8"
                  fill={colour}
                  stroke="white"
                  strokeWidth={1}
                  className="hover:opacity-80 transition-opacity"
                />
              </g>
            )}
          </g>
        );
      })}

      {/* Tooltip */}
      {hoveredMilestone && (
        <MilestoneTooltip
          milestone={hoveredMilestone}
          x={tooltipPosition.x}
          y={tooltipPosition.y}
        />
      )}
    </g>
  );
}

interface MilestoneTooltipProps {
  milestone: Milestone;
  x: number;
  y: number;
}

function MilestoneTooltip({ milestone, x, y }: MilestoneTooltipProps) {
  const colour = milestoneColours[milestone.type];
  const typeLabel = {
    hardConstraint: 'Hard Deadline',
    softConstraint: 'Soft Deadline',
    supportEnd: 'Support End',
    extendedSupportEnd: 'Extended Support End',
  }[milestone.type];

  const formattedDate = milestone.date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Position tooltip to the right of cursor, or left if too close to edge
  const tooltipWidth = 220;
  const tooltipHeight = 80;
  const offsetX = 15;
  const offsetY = -40;

  return (
    <foreignObject
      x={x + offsetX}
      y={y + offsetY}
      width={tooltipWidth}
      height={tooltipHeight}
      style={{ overflow: 'visible', pointerEvents: 'none' }}
    >
      <div
        className="bg-white rounded-lg shadow-lg border border-gray-200 p-3"
        style={{ width: tooltipWidth }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: colour }}
          />
          <span className="text-xs font-medium text-gray-500">{typeLabel}</span>
        </div>
        <p className="text-sm font-medium text-gray-900 truncate">{milestone.name}</p>
        <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
        {milestone.description && (
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{milestone.description}</p>
        )}
      </div>
    </foreignObject>
  );
}

// Export milestone colours for use in legend
export { milestoneColours };
