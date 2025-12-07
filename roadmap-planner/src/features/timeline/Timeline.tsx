import { diffDays } from '@/lib/dateUtils';
import { useAppStore } from '@/stores/appStore';
import * as d3 from 'd3';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TimelineMilestones } from './TimelineMilestones';
import { TimelineToday } from './TimelineToday';
import { TimelineToolbar } from './TimelineToolbar';
import { TimelineTooltip } from './TimelineTooltip';
import {
  type ZoomLevel,
  getTimelineConfig,
  statusColours,
  swimlaneColours,
} from './timelineConfig';
import { type TimelineInitiative, useTimelineData } from './useTimelineData';
import { useTimelineMutations } from './useTimelineMutations';

export function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('year');
  const [_scrollLeft, setScrollLeft] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [collapsedSwimlanes, setCollapsedSwimlanes] = useState<Set<string>>(
    new Set(),
  );

  const { swimlanes, timeRange, totalInitiatives } = useTimelineData();
  const { selectInitiative } = useAppStore();
  const selectedInitiativeId = useAppStore(
    (state) => state.selectedInitiativeId,
  );
  const { moveInitiative, resizeInitiative } = useTimelineMutations();

  const config = useMemo(() => getTimelineConfig(zoomLevel), [zoomLevel]);

  // Calculate total timeline width based on date range and zoom
  const timelineWidth = useMemo(() => {
    const days = diffDays(timeRange.start, timeRange.end);
    return Math.max(days * config.pixelsPerDay, dimensions.width);
  }, [timeRange, config.pixelsPerDay, dimensions.width]);

  // Create D3 scale for date to X position
  const dateScale = useMemo(
    () =>
      d3
        .scaleTime()
        .domain([timeRange.start, timeRange.end])
        .range([config.swimlaneHeaderWidth, timelineWidth]),
    [timeRange, timelineWidth, config.swimlaneHeaderWidth],
  );

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Scroll to today on mount
  useEffect(() => {
    const today = new Date();
    if (today >= timeRange.start && today <= timeRange.end) {
      const todayX = dateScale(today);
      const centerOffset = dimensions.width / 2;
      setScrollLeft(Math.max(0, todayX - centerOffset));
    }
  }, [dateScale, timeRange, dimensions.width]);

  // Calculate swimlane heights (collapsed swimlanes are shorter)
  const collapsedHeight = 32;
  const expandedHeight = config.rowHeight;
  const totalHeight = useMemo(() => {
    return (
      config.headerHeight +
      swimlanes.reduce((sum, swimlane) => {
        const key = swimlane.capability?.id ?? 'unassigned';
        const isCollapsed = collapsedSwimlanes.has(key);
        return sum + (isCollapsed ? collapsedHeight : expandedHeight);
      }, 0)
    );
  }, [swimlanes, collapsedSwimlanes, config.headerHeight, expandedHeight]);

  // Toggle swimlane collapse
  const toggleSwimlane = useCallback((key: string) => {
    setCollapsedSwimlanes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Handle bar click
  const handleBarClick = useCallback(
    (initiativeId: string) => {
      selectInitiative(initiativeId);
    },
    [selectInitiative],
  );

  // Handle scroll to today
  const handleScrollToToday = useCallback(() => {
    const today = new Date();
    const todayX = dateScale(today);
    const centerOffset = dimensions.width / 2;
    setScrollLeft(Math.max(0, todayX - centerOffset));
  }, [dateScale, dimensions.width]);

  // Drag state - supports move and resize operations
  const [dragState, setDragState] = useState<{
    initiativeId: string;
    mode: 'move' | 'resize-start' | 'resize-end';
    startX: number;
    originalStart: Date;
    originalEnd: Date;
    currentOffset: number;
  } | null>(null);

  const handleDragStart = useCallback(
    (
      e: React.MouseEvent,
      initiativeId: string,
      startDate: Date,
      endDate: Date,
      mode: 'move' | 'resize-start' | 'resize-end' = 'move',
    ) => {
      e.preventDefault();
      e.stopPropagation();
      setDragState({
        initiativeId,
        mode,
        startX: e.clientX,
        originalStart: startDate,
        originalEnd: endDate,
        currentOffset: 0,
      });
    },
    [],
  );

  const handleDragMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState) return;
      const deltaX = e.clientX - dragState.startX;
      setDragState((prev) =>
        prev ? { ...prev, currentOffset: deltaX } : null,
      );
    },
    [dragState],
  );

  const handleDragEnd = useCallback(() => {
    if (!dragState) return;

    const daysOffset = Math.round(
      dragState.currentOffset / config.pixelsPerDay,
    );
    const minDurationDays = 7; // Minimum 1 week duration

    if (daysOffset !== 0) {
      if (dragState.mode === 'move') {
        // Move entire bar
        const newStart = new Date(dragState.originalStart);
        newStart.setDate(newStart.getDate() + daysOffset);

        const newEnd = new Date(dragState.originalEnd);
        newEnd.setDate(newEnd.getDate() + daysOffset);

        moveInitiative(dragState.initiativeId, newStart, newEnd);
      } else if (dragState.mode === 'resize-start') {
        // Resize from start (change start date)
        const newStart = new Date(dragState.originalStart);
        newStart.setDate(newStart.getDate() + daysOffset);

        // Ensure minimum duration
        const endTime = dragState.originalEnd.getTime();
        const newStartTime = newStart.getTime();
        const durationDays = (endTime - newStartTime) / (1000 * 60 * 60 * 24);

        if (durationDays >= minDurationDays) {
          resizeInitiative(dragState.initiativeId, newStart, null);
        }
      } else if (dragState.mode === 'resize-end') {
        // Resize from end (change end date)
        const newEnd = new Date(dragState.originalEnd);
        newEnd.setDate(newEnd.getDate() + daysOffset);

        // Ensure minimum duration
        const startTime = dragState.originalStart.getTime();
        const newEndTime = newEnd.getTime();
        const durationDays = (newEndTime - startTime) / (1000 * 60 * 60 * 24);

        if (durationDays >= minDurationDays) {
          resizeInitiative(dragState.initiativeId, null, newEnd);
        }
      }
    }

    setDragState(null);
  }, [dragState, config.pixelsPerDay, moveInitiative, resizeInitiative]);

  // Hover state for tooltip
  const [hoveredInitiative, setHoveredInitiative] = useState<{
    initiative: TimelineInitiative;
    x: number;
    y: number;
  } | null>(null);

  const handleMouseEnter = useCallback(
    (initiative: TimelineInitiative, barX: number, barY: number) => {
      if (!dragState) {
        setHoveredInitiative({ initiative, x: barX, y: barY });
      }
    },
    [dragState],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredInitiative(null);
  }, []);

  // Empty state
  if (totalInitiatives === 0) {
    return (
      <div className="flex flex-col h-full">
        <TimelineToolbar
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          onScrollToToday={handleScrollToToday}
        />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              role="img"
              aria-label="Calendar icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No initiatives to display
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Add initiatives with start and end dates to see them on the
              timeline.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" ref={containerRef}>
      <TimelineToolbar
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        onScrollToToday={handleScrollToToday}
      />

      <div
        className="flex-1 overflow-auto"
        onMouseMove={dragState ? handleDragMove : undefined}
        onMouseUp={dragState ? handleDragEnd : undefined}
        onMouseLeave={dragState ? handleDragEnd : undefined}
      >
        <svg
          ref={svgRef}
          width={timelineWidth}
          height={totalHeight}
          className="select-none"
          role="img"
          aria-label="Roadmap timeline showing initiatives across time"
        >
          {/* Header background */}
          <rect
            x={0}
            y={0}
            width={timelineWidth}
            height={config.headerHeight}
            fill="#F9FAFB"
            className="sticky top-0"
          />

          {/* Swimlane header background (sticky) */}
          <rect
            x={0}
            y={0}
            width={config.swimlaneHeaderWidth}
            height={totalHeight}
            fill="#FFFFFF"
          />

          {/* Time axis */}
          <TimeAxis
            dateScale={dateScale}
            config={config}
            timeRange={timeRange}
          />

          {/* Today marker */}
          <TimelineToday
            dateScale={dateScale}
            height={totalHeight}
            headerHeight={config.headerHeight}
          />

          {/* Milestone markers (constraints and support dates) */}
          <TimelineMilestones
            dateScale={dateScale}
            height={totalHeight}
            headerHeight={config.headerHeight}
            swimlaneHeaderWidth={config.swimlaneHeaderWidth}
          />

          {/* Swimlanes */}
          {(() => {
            let cumulativeY = config.headerHeight;
            return swimlanes.map((swimlane, index) => {
              const key = swimlane.capability?.id ?? 'unassigned';
              const isCollapsed = collapsedSwimlanes.has(key);
              const swimlaneHeight = isCollapsed
                ? collapsedHeight
                : expandedHeight;
              const y = cumulativeY;
              cumulativeY += swimlaneHeight;

              const bgColor =
                index % 2 === 0 ? swimlaneColours.even : swimlaneColours.odd;

              return (
                <g key={key}>
                  {/* Swimlane background */}
                  <rect
                    x={config.swimlaneHeaderWidth}
                    y={y}
                    width={timelineWidth - config.swimlaneHeaderWidth}
                    height={swimlaneHeight}
                    fill={bgColor}
                  />

                  {/* Swimlane header */}
                  <rect
                    x={0}
                    y={y}
                    width={config.swimlaneHeaderWidth}
                    height={swimlaneHeight}
                    fill="#FFFFFF"
                    stroke="#E5E7EB"
                    strokeWidth={1}
                    onClick={() => toggleSwimlane(key)}
                    className="cursor-pointer hover:fill-gray-50"
                  />

                  {/* Collapse/expand chevron */}
                  <text
                    x={8}
                    y={y + swimlaneHeight / 2}
                    dominantBaseline="middle"
                    className="text-[10px] fill-gray-400 pointer-events-none"
                    style={{
                      transform: isCollapsed
                        ? 'rotate(-90deg)'
                        : 'rotate(0deg)',
                      transformOrigin: `8px ${y + swimlaneHeight / 2}px`,
                    }}
                  >
                    ▼
                  </text>

                  {/* Swimlane name */}
                  <text
                    x={24}
                    y={y + swimlaneHeight / 2}
                    dominantBaseline="middle"
                    className="text-xs font-medium fill-gray-700 pointer-events-none"
                  >
                    {swimlane.capability?.name ?? 'Unassigned'}
                    {isCollapsed && (
                      <tspan className="text-[10px] fill-gray-400">
                        {' '}
                        ({swimlane.initiatives.length})
                      </tspan>
                    )}
                  </text>

                  {/* Initiative bars - only show when expanded */}
                  {!isCollapsed &&
                    swimlane.initiatives.map((initiative) => {
                      const barX = dateScale(initiative.startDateObj);
                      const barWidth = Math.max(
                        dateScale(initiative.endDateObj) - barX,
                        config.minBarWidth,
                      );
                      const barY = y + config.barPadding;
                      const handleWidth = 8;

                      // Apply drag offset based on mode
                      let offsetX = 0;
                      let widthAdjustment = 0;
                      if (dragState?.initiativeId === initiative.id) {
                        if (dragState.mode === 'move') {
                          offsetX = dragState.currentOffset;
                        } else if (dragState.mode === 'resize-start') {
                          offsetX = dragState.currentOffset;
                          widthAdjustment = -dragState.currentOffset;
                        } else if (dragState.mode === 'resize-end') {
                          widthAdjustment = dragState.currentOffset;
                        }
                      }

                      const isSelected = selectedInitiativeId === initiative.id;
                      const isDragging =
                        dragState?.initiativeId === initiative.id;
                      const isResizing =
                        isDragging && dragState?.mode !== 'move';
                      const adjustedWidth = Math.max(
                        barWidth + widthAdjustment,
                        config.minBarWidth,
                      );

                      return (
                        <g
                          key={initiative.id}
                          transform={`translate(${offsetX}, 0)`}
                        >
                          {/* Bar shadow for depth */}
                          <rect
                            x={barX + 1}
                            y={barY + 1}
                            width={adjustedWidth}
                            height={config.barHeight}
                            rx={4}
                            fill="rgba(0,0,0,0.1)"
                          />

                          {/* Main bar */}
                          <rect
                            x={barX}
                            y={barY}
                            width={adjustedWidth}
                            height={config.barHeight}
                            rx={4}
                            fill={statusColours[initiative.status] ?? '#94A3B8'}
                            stroke={isSelected ? '#1D4ED8' : 'transparent'}
                            strokeWidth={isSelected ? 2 : 0}
                            opacity={isDragging ? 0.7 : 1}
                            onMouseDown={(e) =>
                              handleDragStart(
                                e,
                                initiative.id,
                                initiative.startDateObj,
                                initiative.endDateObj,
                                'move',
                              )
                            }
                            onMouseEnter={() =>
                              handleMouseEnter(initiative, barX, barY)
                            }
                            onMouseLeave={handleMouseLeave}
                            onClick={() => handleBarClick(initiative.id)}
                            className="cursor-grab hover:brightness-95 transition-all"
                          />

                          {/* Left resize handle */}
                          <rect
                            x={barX}
                            y={barY}
                            width={handleWidth}
                            height={config.barHeight}
                            rx={4}
                            fill="transparent"
                            onMouseDown={(e) =>
                              handleDragStart(
                                e,
                                initiative.id,
                                initiative.startDateObj,
                                initiative.endDateObj,
                                'resize-start',
                              )
                            }
                            className="cursor-ew-resize hover:fill-white hover:fill-opacity-30"
                          />

                          {/* Right resize handle */}
                          <rect
                            x={barX + adjustedWidth - handleWidth}
                            y={barY}
                            width={handleWidth}
                            height={config.barHeight}
                            rx={4}
                            fill="transparent"
                            onMouseDown={(e) =>
                              handleDragStart(
                                e,
                                initiative.id,
                                initiative.startDateObj,
                                initiative.endDateObj,
                                'resize-end',
                              )
                            }
                            className="cursor-ew-resize hover:fill-white hover:fill-opacity-30"
                          />

                          {/* Resize indicators (visible when selected) */}
                          {isSelected && !isResizing && (
                            <>
                              <rect
                                x={barX + 2}
                                y={barY + config.barHeight / 2 - 6}
                                width={3}
                                height={12}
                                rx={1}
                                fill="white"
                                opacity={0.7}
                                className="pointer-events-none"
                              />
                              <rect
                                x={barX + adjustedWidth - 5}
                                y={barY + config.barHeight / 2 - 6}
                                width={3}
                                height={12}
                                rx={1}
                                fill="white"
                                opacity={0.7}
                                className="pointer-events-none"
                              />
                            </>
                          )}

                          {/* Bar text */}
                          <text
                            x={barX + 12}
                            y={barY + config.barHeight / 2}
                            dominantBaseline="middle"
                            className="text-xs font-medium fill-white pointer-events-none"
                            style={{
                              clipPath: `inset(0 ${Math.max(0, adjustedWidth - 24)}px 0 0)`,
                            }}
                          >
                            {initiative.name}
                          </text>
                        </g>
                      );
                    })}
                </g>
              );
            });
          })()}

          {/* Border lines */}
          <line
            x1={config.swimlaneHeaderWidth}
            y1={0}
            x2={config.swimlaneHeaderWidth}
            y2={totalHeight}
            stroke="#E5E7EB"
            strokeWidth={1}
          />
          <line
            x1={0}
            y1={config.headerHeight}
            x2={timelineWidth}
            y2={config.headerHeight}
            stroke="#E5E7EB"
            strokeWidth={1}
          />

          {/* Tooltip */}
          {hoveredInitiative && !dragState && (
            <TimelineTooltip
              initiative={hoveredInitiative.initiative}
              x={hoveredInitiative.x}
              y={hoveredInitiative.y}
            />
          )}
        </svg>
      </div>
    </div>
  );
}

// Time axis component
interface TimeAxisProps {
  dateScale: d3.ScaleTime<number, number>;
  config: ReturnType<typeof getTimelineConfig>;
  timeRange: { start: Date; end: Date };
}

function TimeAxis({ dateScale, config, timeRange }: TimeAxisProps) {
  const ticks = useMemo(() => {
    // Generate appropriate ticks based on zoom level
    let tickInterval: d3.TimeInterval;
    let format: string;

    switch (config.zoomLevel) {
      case 'quarter':
        tickInterval = d3.timeWeek;
        format = 'week';
        break;
      case 'half':
        tickInterval = d3.timeMonth;
        format = 'month';
        break;
      case 'year':
        tickInterval = d3.timeMonth;
        format = 'month';
        break;
      case '3year':
        tickInterval = d3.timeMonth.every(3) ?? d3.timeMonth;
        format = 'quarter';
        break;
      case '5year':
        tickInterval = d3.timeMonth.every(6) ?? d3.timeMonth;
        format = 'half';
        break;
      case '10year':
        tickInterval = d3.timeYear;
        format = 'year';
        break;
      default:
        tickInterval = d3.timeMonth;
        format = 'month';
    }

    const tickDates = tickInterval.range(timeRange.start, timeRange.end);

    return tickDates.map((date) => ({
      date,
      x: dateScale(date),
      label: formatTickLabel(date, format),
    }));
  }, [dateScale, config.zoomLevel, timeRange]);

  return (
    <g>
      {/* Year labels at top */}
      {getYearLabels(timeRange.start, timeRange.end).map((yearData) => (
        <text
          key={yearData.year}
          x={dateScale(yearData.start) + 8}
          y={16}
          className="text-xs font-semibold fill-gray-600"
        >
          {yearData.year}
        </text>
      ))}

      {/* Tick lines and labels */}
      {ticks.map((tick) => (
        <g key={tick.date.toISOString()}>
          <line
            x1={tick.x}
            y1={24}
            x2={tick.x}
            y2={config.headerHeight}
            stroke="#E5E7EB"
            strokeWidth={1}
          />
          <text
            x={tick.x + 4}
            y={config.headerHeight - 8}
            className="text-[10px] fill-gray-500"
          >
            {tick.label}
          </text>
        </g>
      ))}
    </g>
  );
}

function formatTickLabel(date: Date, format: string): string {
  switch (format) {
    case 'week':
      return `W${getWeekNumber(date)}`;
    case 'month':
      return date.toLocaleDateString('en-GB', { month: 'short' });
    case 'quarter':
      return `Q${Math.floor(date.getMonth() / 3) + 1}`;
    case 'half':
      return date.getMonth() < 6 ? 'H1' : 'H2';
    case 'year':
      return date.getFullYear().toString();
    default:
      return date.toLocaleDateString('en-GB', { month: 'short' });
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getYearLabels(
  start: Date,
  end: Date,
): { year: number; start: Date }[] {
  const years: { year: number; start: Date }[] = [];
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  for (let year = startYear; year <= endYear; year++) {
    const yearStart = new Date(year, 0, 1);
    years.push({
      year,
      start: yearStart < start ? start : yearStart,
    });
  }

  return years;
}
