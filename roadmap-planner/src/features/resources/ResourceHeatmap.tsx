// ResourceHeatmap - Main container for resource utilisation heatmap view

import { useMemo, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { HeatmapGrid } from './HeatmapGrid';
import { HeatmapLegend } from './HeatmapLegend';
import { ResourceHeatmapToolbar } from './ResourceHeatmapToolbar';
import { ResourceDetailPanel } from './ResourceDetailPanel';
import type { Initiative, ResourcePool } from '@/lib/types';

export type PeriodGranularity = 'month' | 'quarter';

export interface HeatmapData {
  pools: ResourcePool[];
  periods: HeatmapPeriod[];
  cells: Map<string, HeatmapCellData>; // key: `${poolId}-${periodKey}`
}

export interface HeatmapPeriod {
  key: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

export interface HeatmapCellData {
  poolId: string;
  periodKey: string;
  demand: number;
  capacity: number;
  utilisation: number;
  initiatives: Initiative[];
}

export function ResourceHeatmap() {
  const { resourcePools, initiatives, activeScenarioId } = useAppStore();

  const [granularity, setGranularity] = useState<PeriodGranularity>('month');
  const [overThreshold, setOverThreshold] = useState(90);
  const [selectedCell, setSelectedCell] = useState<HeatmapCellData | null>(null);
  const [hoveredPool, setHoveredPool] = useState<string | null>(null);
  const [hoveredPeriod, setHoveredPeriod] = useState<string | null>(null);

  // Get initiatives for current scenario
  const scenarioInitiatives = useMemo(
    () => initiatives.filter((i) => i.scenarioId === activeScenarioId),
    [initiatives, activeScenarioId]
  );

  // Calculate date range from initiatives
  const dateRange = useMemo(() => {
    const now = new Date();
    let minDate = new Date(now.getFullYear(), 0, 1);
    let maxDate = new Date(now.getFullYear() + 2, 11, 31);

    scenarioInitiatives.forEach((i) => {
      if (i.startDate) {
        const start = new Date(i.startDate);
        if (start < minDate) minDate = new Date(start.getFullYear(), start.getMonth(), 1);
      }
      if (i.endDate) {
        const end = new Date(i.endDate);
        if (end > maxDate) maxDate = new Date(end.getFullYear(), end.getMonth() + 1, 0);
      }
    });

    return { start: minDate, end: maxDate };
  }, [scenarioInitiatives]);

  // Generate periods based on granularity
  const periods = useMemo(() => {
    const result: HeatmapPeriod[] = [];
    const current = new Date(dateRange.start);

    while (current <= dateRange.end) {
      if (granularity === 'month') {
        const endOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        result.push({
          key: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`,
          label: current.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
          startDate: new Date(current),
          endDate: endOfMonth,
        });
        current.setMonth(current.getMonth() + 1);
      } else {
        // Quarter
        const quarter = Math.floor(current.getMonth() / 3);
        const quarterStart = new Date(current.getFullYear(), quarter * 3, 1);
        const quarterEnd = new Date(current.getFullYear(), (quarter + 1) * 3, 0);
        result.push({
          key: `${current.getFullYear()}-Q${quarter + 1}`,
          label: `Q${quarter + 1} ${current.getFullYear().toString().slice(-2)}`,
          startDate: quarterStart,
          endDate: quarterEnd,
        });
        current.setMonth(current.getMonth() + 3);
      }
    }

    return result;
  }, [dateRange, granularity]);

  // Calculate heatmap data
  const heatmapData = useMemo((): HeatmapData => {
    const cells = new Map<string, HeatmapCellData>();

    // Initialize cells for each pool and period
    resourcePools.forEach((pool) => {
      periods.forEach((period) => {
        const key = `${pool.id}-${period.key}`;
        const capacityPerPeriod = pool.capacityPerPeriod ?? 0;
        const periodCapacity =
          granularity === 'month' ? capacityPerPeriod : capacityPerPeriod * 3;

        cells.set(key, {
          poolId: pool.id,
          periodKey: period.key,
          demand: 0,
          capacity: periodCapacity,
          utilisation: 0,
          initiatives: [],
        });
      });
    });

    // Calculate demand from initiative resource requirements
    // For now, distribute effort evenly across initiative duration
    scenarioInitiatives.forEach((initiative) => {
      if (!initiative.startDate || !initiative.endDate) return;

      const startDate = new Date(initiative.startDate);
      const endDate = new Date(initiative.endDate);
      const durationMonths = monthsBetween(startDate, endDate);

      if (durationMonths === 0) return;

      // Distribute effort across pools (simplified - assumes even distribution)
      const effortPerMonth = (initiative.effortEstimate ?? 0) / durationMonths;

      resourcePools.forEach((pool) => {
        periods.forEach((period) => {
          // Check if initiative overlaps with period
          if (period.endDate < startDate || period.startDate > endDate) return;

          const key = `${pool.id}-${period.key}`;
          const cell = cells.get(key);
          if (!cell) return;

          // Add proportional effort (simplified allocation)
          const periodMonths = granularity === 'month' ? 1 : 3;
          const effortForPeriod = effortPerMonth * periodMonths * 0.3; // Assume 30% goes to each pool
          cell.demand += effortForPeriod;
          cell.initiatives.push(initiative);
        });
      });
    });

    // Calculate utilisation percentages
    cells.forEach((cell) => {
      if (cell.capacity > 0) {
        cell.utilisation = (cell.demand / cell.capacity) * 100;
      }
    });

    return {
      pools: resourcePools,
      periods,
      cells,
    };
  }, [resourcePools, periods, scenarioInitiatives, granularity]);

  const handleCellClick = (cell: HeatmapCellData) => {
    setSelectedCell(cell);
  };

  const handleCloseDetail = () => {
    setSelectedCell(null);
  };

  if (resourcePools.length === 0) {
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No resource pools</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create resource pools to see utilisation heatmap.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ResourceHeatmapToolbar
        granularity={granularity}
        onGranularityChange={setGranularity}
        overThreshold={overThreshold}
        onOverThresholdChange={setOverThreshold}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto p-4">
          <HeatmapGrid
            data={heatmapData}
            overThreshold={overThreshold}
            onCellClick={handleCellClick}
            hoveredPool={hoveredPool}
            hoveredPeriod={hoveredPeriod}
            onPoolHover={setHoveredPool}
            onPeriodHover={setHoveredPeriod}
          />
          <HeatmapLegend overThreshold={overThreshold} />
        </div>

        {selectedCell && (
          <ResourceDetailPanel cell={selectedCell} onClose={handleCloseDetail} />
        )}
      </div>
    </div>
  );
}

function monthsBetween(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    1
  );
}
