// ComparisonTimeline - Dual timeline view with synchronized scrolling

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { diffDays } from '@/lib/dateUtils';
import { useAppStore } from '@/stores/appStore';
import type { Initiative, Scenario } from '@/lib/types';
import { getTimelineConfig, statusColours } from '@/features/timeline/timelineConfig';
import type { ZoomLevel } from '@/features/timeline/timelineConfig';

// Diff status for initiative comparison
type DiffStatus = 'unchanged' | 'added' | 'removed' | 'changed';

interface ComparisonTimelineProps {
  baselineScenario: Scenario;
  comparisonScenario: Scenario;
  zoomLevel?: ZoomLevel;
}

export function ComparisonTimeline({
  baselineScenario,
  comparisonScenario,
  zoomLevel = 'year',
}: ComparisonTimelineProps) {
  const { initiatives } = useAppStore();
  const [isSyncEnabled, setIsSyncEnabled] = useState(true);
  const [scrollLeft, setScrollLeft] = useState(0);

  const topPanelRef = useRef<HTMLDivElement>(null);
  const bottomPanelRef = useRef<HTMLDivElement>(null);

  // Get initiatives for each scenario
  const baselineInitiatives = useMemo(
    () => initiatives.filter((i) => i.scenarioId === baselineScenario.id),
    [initiatives, baselineScenario.id]
  );

  const comparisonInitiatives = useMemo(
    () => initiatives.filter((i) => i.scenarioId === comparisonScenario.id),
    [initiatives, comparisonScenario.id]
  );

  // Calculate diff status for comparison initiatives
  const initiativeDiffs = useMemo(() => {
    const diffs = new Map<string, DiffStatus>();

    // Mark baseline initiatives
    baselineInitiatives.forEach((i) => {
      diffs.set(i.name, 'removed'); // Will be updated if found in comparison
    });

    // Compare with comparison scenario
    comparisonInitiatives.forEach((compInit) => {
      const baseInit = baselineInitiatives.find((b) => b.name === compInit.name);

      if (!baseInit) {
        diffs.set(compInit.name, 'added');
      } else if (
        baseInit.startDate !== compInit.startDate ||
        baseInit.endDate !== compInit.endDate
      ) {
        diffs.set(compInit.name, 'changed');
      } else {
        diffs.set(compInit.name, 'unchanged');
      }
    });

    return diffs;
  }, [baselineInitiatives, comparisonInitiatives]);

  // Calculate time range spanning both scenarios
  const timeRange = useMemo(() => {
    const allInitiatives = [...baselineInitiatives, ...comparisonInitiatives];
    if (allInitiatives.length === 0) {
      const today = new Date();
      return {
        start: new Date(today.getFullYear(), 0, 1),
        end: new Date(today.getFullYear() + 1, 11, 31),
      };
    }

    let minDate = new Date();
    let maxDate = new Date();

    allInitiatives.forEach((i) => {
      if (i.startDate) {
        const start = new Date(i.startDate);
        if (start < minDate) minDate = start;
      }
      if (i.endDate) {
        const end = new Date(i.endDate);
        if (end > maxDate) maxDate = end;
      }
    });

    // Add padding
    minDate.setMonth(minDate.getMonth() - 1);
    maxDate.setMonth(maxDate.getMonth() + 1);

    return { start: minDate, end: maxDate };
  }, [baselineInitiatives, comparisonInitiatives]);

  const config = useMemo(() => getTimelineConfig(zoomLevel), [zoomLevel]);

  const timelineWidth = useMemo(() => {
    const days = diffDays(timeRange.start, timeRange.end);
    return Math.max(days * config.pixelsPerDay, 800);
  }, [timeRange, config.pixelsPerDay]);

  const dateScale = useMemo(
    () =>
      d3
        .scaleTime()
        .domain([timeRange.start, timeRange.end])
        .range([0, timelineWidth]),
    [timeRange, timelineWidth]
  );

  // Synchronized scrolling
  const handleScroll = useCallback(
    (source: 'top' | 'bottom') => (e: React.UIEvent<HTMLDivElement>) => {
      if (!isSyncEnabled) return;

      const newScrollLeft = e.currentTarget.scrollLeft;
      setScrollLeft(newScrollLeft);

      // Sync the other panel
      const targetRef = source === 'top' ? bottomPanelRef : topPanelRef;
      if (targetRef.current) {
        targetRef.current.scrollLeft = newScrollLeft;
      }
    },
    [isSyncEnabled]
  );

  // Sync initial scroll position
  useEffect(() => {
    if (topPanelRef.current) {
      topPanelRef.current.scrollLeft = scrollLeft;
    }
    if (bottomPanelRef.current) {
      bottomPanelRef.current.scrollLeft = scrollLeft;
    }
  }, [scrollLeft]);

  const rowHeight = 40;
  const headerHeight = 50;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Header with sync toggle */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">Timeline Comparison</h3>
        <button
          type="button"
          onClick={() => setIsSyncEnabled(!isSyncEnabled)}
          className={`
            flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium
            transition-colors
            ${isSyncEnabled
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-200 text-gray-600'
            }
          `}
          title={isSyncEnabled ? 'Click to disable sync' : 'Click to enable sync'}
        >
          <span>{isSyncEnabled ? '🔗' : '🔓'}</span>
          <span>{isSyncEnabled ? 'Synced' : 'Independent'}</span>
        </button>
      </div>

      {/* Top panel - Baseline */}
      <div className="flex-1 flex flex-col border-b border-gray-300">
        <div className="px-4 py-2 bg-green-50 border-b border-green-200">
          <div className="flex items-center gap-1.5">
            <span className="text-green-600">📍</span>
            <span className="text-sm font-medium text-green-800">{baselineScenario.name}</span>
            <span className="text-xs text-green-600">({baselineInitiatives.length} initiatives)</span>
          </div>
        </div>
        <div
          ref={topPanelRef}
          className="flex-1 overflow-x-auto overflow-y-auto"
          onScroll={handleScroll('top')}
        >
          <TimelinePanel
            initiatives={baselineInitiatives}
            dateScale={dateScale}
            timelineWidth={timelineWidth}
            rowHeight={rowHeight}
            headerHeight={headerHeight}
            timeRange={timeRange}
            getDiffStatus={() => 'unchanged'}
          />
        </div>
      </div>

      {/* Sync indicator line */}
      {isSyncEnabled && (
        <div className="h-1 bg-gradient-to-r from-green-400 via-primary-400 to-amber-400" />
      )}

      {/* Bottom panel - Comparison */}
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-600">⚡</span>
            <span className="text-sm font-medium text-amber-800">{comparisonScenario.name}</span>
            <span className="text-xs text-amber-600">({comparisonInitiatives.length} initiatives)</span>
          </div>
        </div>
        <div
          ref={bottomPanelRef}
          className="flex-1 overflow-x-auto overflow-y-auto"
          onScroll={handleScroll('bottom')}
        >
          <TimelinePanel
            initiatives={comparisonInitiatives}
            dateScale={dateScale}
            timelineWidth={timelineWidth}
            rowHeight={rowHeight}
            headerHeight={headerHeight}
            timeRange={timeRange}
            getDiffStatus={(name) => initiativeDiffs.get(name) ?? 'unchanged'}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center gap-4">
        <span className="text-xs text-gray-500">Legend:</span>
        <div className="flex items-center gap-3">
          <LegendItem colour="blue" label="Changed dates" />
          <LegendItem colour="green" label="Added" />
          <LegendItem colour="red" label="Removed" />
          <LegendItem colour="gray" label="Unchanged" />
        </div>
      </div>
    </div>
  );
}

interface TimelinePanelProps {
  initiatives: Initiative[];
  dateScale: d3.ScaleTime<number, number>;
  timelineWidth: number;
  rowHeight: number;
  headerHeight: number;
  timeRange: { start: Date; end: Date };
  getDiffStatus: (name: string) => DiffStatus;
}

function TimelinePanel({
  initiatives,
  dateScale,
  timelineWidth,
  rowHeight,
  headerHeight,
  timeRange,
  getDiffStatus,
}: TimelinePanelProps) {
  const totalHeight = headerHeight + initiatives.length * rowHeight;

  // Generate month ticks
  const monthTicks = useMemo(() => {
    const ticks: { date: Date; x: number; label: string }[] = [];
    const current = new Date(timeRange.start);
    current.setDate(1);

    while (current <= timeRange.end) {
      ticks.push({
        date: new Date(current),
        x: dateScale(current),
        label: current.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      });
      current.setMonth(current.getMonth() + 1);
    }

    return ticks;
  }, [timeRange, dateScale]);

  // Today marker
  const today = new Date();
  const todayX = dateScale(today);
  const showToday = today >= timeRange.start && today <= timeRange.end;

  return (
    <svg width={timelineWidth} height={totalHeight} className="select-none">
      {/* Header background */}
      <rect x={0} y={0} width={timelineWidth} height={headerHeight} fill="#F9FAFB" />

      {/* Month grid lines and labels */}
      {monthTicks.map((tick) => (
        <g key={tick.date.toISOString()}>
          <line
            x1={tick.x}
            y1={headerHeight}
            x2={tick.x}
            y2={totalHeight}
            stroke="#E5E7EB"
            strokeWidth={1}
          />
          <text
            x={tick.x + 4}
            y={headerHeight - 8}
            className="text-[10px] fill-gray-500"
          >
            {tick.label}
          </text>
        </g>
      ))}

      {/* Today marker */}
      {showToday && (
        <g>
          <line
            x1={todayX}
            y1={headerHeight}
            x2={todayX}
            y2={totalHeight}
            stroke="#EF4444"
            strokeWidth={2}
          />
          <text
            x={todayX + 4}
            y={headerHeight + 12}
            className="text-[10px] fill-red-500 font-medium"
          >
            Today
          </text>
        </g>
      )}

      {/* Header bottom line */}
      <line
        x1={0}
        y1={headerHeight}
        x2={timelineWidth}
        y2={headerHeight}
        stroke="#D1D5DB"
        strokeWidth={1}
      />

      {/* Initiative bars */}
      {initiatives.map((initiative, index) => {
        if (!initiative.startDate || !initiative.endDate) return null;

        const startDate = new Date(initiative.startDate);
        const endDate = new Date(initiative.endDate);
        const x = dateScale(startDate);
        const width = Math.max(dateScale(endDate) - x, 20);
        const y = headerHeight + index * rowHeight + 6;
        const barHeight = rowHeight - 12;

        const diffStatus = getDiffStatus(initiative.name);
        const borderColour = getDiffBorderColour(diffStatus);
        const fillColour = statusColours[initiative.status] ?? '#94A3B8';

        return (
          <g key={initiative.id}>
            {/* Row background */}
            <rect
              x={0}
              y={headerHeight + index * rowHeight}
              width={timelineWidth}
              height={rowHeight}
              fill={index % 2 === 0 ? '#FFFFFF' : '#F9FAFB'}
            />

            {/* Initiative bar */}
            <rect
              x={x}
              y={y}
              width={width}
              height={barHeight}
              rx={4}
              fill={fillColour}
              stroke={borderColour}
              strokeWidth={borderColour ? 3 : 0}
              className="hover:brightness-95 cursor-pointer"
            />

            {/* Initiative name */}
            <text
              x={x + 8}
              y={y + barHeight / 2}
              dominantBaseline="middle"
              className="text-xs font-medium fill-white pointer-events-none"
            >
              {initiative.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function getDiffBorderColour(status: DiffStatus): string {
  switch (status) {
    case 'added':
      return '#22C55E'; // green-500
    case 'removed':
      return '#EF4444'; // red-500
    case 'changed':
      return '#3B82F6'; // blue-500
    default:
      return '';
  }
}

function LegendItem({ colour, label }: { colour: string; label: string }) {
  const colourMap: Record<string, string> = {
    blue: '#3B82F6',
    green: '#22C55E',
    red: '#EF4444',
    gray: '#9CA3AF',
  };

  return (
    <div className="flex items-center gap-1">
      <div
        className="w-3 h-3 rounded border-2"
        style={{ borderColor: colourMap[colour], backgroundColor: 'transparent' }}
      />
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}
