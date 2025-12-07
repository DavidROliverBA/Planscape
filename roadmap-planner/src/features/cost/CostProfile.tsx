// CostProfile - Main container for cost profile view

import { useMemo, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { CostChart } from './CostChart';
import { CostSummary } from './CostSummary';
import { CostProfileToolbar } from './CostProfileToolbar';
import type { Initiative } from '@/lib/types';

export type CostGranularity = 'quarter' | 'year';
export type ChartType = 'bar' | 'area';
export type StackBy = 'type' | 'capability' | 'none';

export interface CostPeriodData {
  key: string;
  label: string;
  startDate: Date;
  endDate: Date;
  totalCost: number;
  breakdown: Record<string, number>;
  initiatives: Initiative[];
}

export function CostProfile() {
  const { initiatives, capabilities, financialPeriods, activeScenarioId } = useAppStore();

  const [granularity, setGranularity] = useState<CostGranularity>('quarter');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [stackBy, setStackBy] = useState<StackBy>('type');
  const [showBudgetLine, setShowBudgetLine] = useState(true);

  // Get initiatives for current scenario
  const scenarioInitiatives = useMemo(
    () => initiatives.filter((i) => i.scenarioId === activeScenarioId),
    [initiatives, activeScenarioId]
  );

  // Calculate date range
  const dateRange = useMemo(() => {
    const now = new Date();
    let minDate = new Date(now.getFullYear(), 0, 1);
    let maxDate = new Date(now.getFullYear() + 2, 11, 31);

    scenarioInitiatives.forEach((i) => {
      if (i.startDate) {
        const start = new Date(i.startDate);
        if (start < minDate) minDate = new Date(start.getFullYear(), 0, 1);
      }
      if (i.endDate) {
        const end = new Date(i.endDate);
        if (end > maxDate) maxDate = new Date(end.getFullYear(), 11, 31);
      }
    });

    return { start: minDate, end: maxDate };
  }, [scenarioInitiatives]);

  // Generate periods based on granularity
  const periods = useMemo(() => {
    const result: CostPeriodData[] = [];
    const current = new Date(dateRange.start);

    while (current <= dateRange.end) {
      if (granularity === 'quarter') {
        const quarter = Math.floor(current.getMonth() / 3);
        const quarterStart = new Date(current.getFullYear(), quarter * 3, 1);
        const quarterEnd = new Date(current.getFullYear(), (quarter + 1) * 3, 0);

        result.push({
          key: `${current.getFullYear()}-Q${quarter + 1}`,
          label: `Q${quarter + 1} ${current.getFullYear()}`,
          startDate: quarterStart,
          endDate: quarterEnd,
          totalCost: 0,
          breakdown: {},
          initiatives: [],
        });
        current.setMonth(current.getMonth() + 3);
      } else {
        // Year
        const yearStart = new Date(current.getFullYear(), 0, 1);
        const yearEnd = new Date(current.getFullYear(), 11, 31);

        result.push({
          key: `${current.getFullYear()}`,
          label: `${current.getFullYear()}`,
          startDate: yearStart,
          endDate: yearEnd,
          totalCost: 0,
          breakdown: {},
          initiatives: [],
        });
        current.setFullYear(current.getFullYear() + 1);
      }
    }

    return result;
  }, [dateRange, granularity]);

  // Calculate cost data for each period
  const costData = useMemo((): CostPeriodData[] => {
    const data = periods.map((period) => ({
      ...period,
      totalCost: 0,
      breakdown: {} as Record<string, number>,
      initiatives: [] as Initiative[],
    }));

    scenarioInitiatives.forEach((initiative) => {
      if (!initiative.startDate || !initiative.endDate || !initiative.costEstimate) return;

      const startDate = new Date(initiative.startDate);
      const endDate = new Date(initiative.endDate);
      const durationMonths = monthsBetween(startDate, endDate);

      if (durationMonths === 0) return;

      // Distribute cost evenly across periods
      const costPerMonth = initiative.costEstimate / durationMonths;

      data.forEach((period) => {
        // Check if initiative overlaps with period
        if (period.endDate < startDate || period.startDate > endDate) return;

        // Calculate overlap
        const overlapStart = new Date(Math.max(period.startDate.getTime(), startDate.getTime()));
        const overlapEnd = new Date(Math.min(period.endDate.getTime(), endDate.getTime()));
        const overlapMonths = monthsBetween(overlapStart, overlapEnd);

        const costForPeriod = costPerMonth * overlapMonths;
        period.totalCost += costForPeriod;
        period.initiatives.push(initiative);

        // Add to breakdown
        const breakdownKey = stackBy === 'type'
          ? initiative.type
          : stackBy === 'capability'
          ? getCapabilityName(initiative, capabilities)
          : 'Total';

        period.breakdown[breakdownKey] = (period.breakdown[breakdownKey] ?? 0) + costForPeriod;
      });
    });

    return data;
  }, [periods, scenarioInitiatives, stackBy, capabilities]);

  // Get budget data from financial periods
  const budgetData = useMemo(() => {
    return financialPeriods.map((fp) => ({
      key: fp.name,
      budget: fp.budgetAvailable ?? 0,
      startDate: new Date(fp.startDate),
      endDate: new Date(fp.endDate),
    }));
  }, [financialPeriods]);

  // Calculate breakdown categories
  const breakdownCategories = useMemo(() => {
    const categories = new Set<string>();
    costData.forEach((period) => {
      Object.keys(period.breakdown).forEach((key) => categories.add(key));
    });
    return Array.from(categories).sort();
  }, [costData]);

  // Calculate total cost
  const totalCost = useMemo(
    () => costData.reduce((sum, period) => sum + period.totalCost, 0),
    [costData]
  );

  if (scenarioInitiatives.length === 0) {
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
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No cost data</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add initiatives with cost estimates to see cost profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <CostProfileToolbar
        granularity={granularity}
        onGranularityChange={setGranularity}
        chartType={chartType}
        onChartTypeChange={setChartType}
        stackBy={stackBy}
        onStackByChange={setStackBy}
        showBudgetLine={showBudgetLine}
        onShowBudgetLineChange={setShowBudgetLine}
      />

      <div className="flex-1 flex flex-col overflow-hidden p-4">
        <CostSummary
          totalCost={totalCost}
          breakdownCategories={breakdownCategories}
          costData={costData}
          stackBy={stackBy}
        />

        <div className="flex-1 mt-4">
          <CostChart
            data={costData}
            chartType={chartType}
            stackBy={stackBy}
            categories={breakdownCategories}
            budgetData={showBudgetLine ? budgetData : []}
          />
        </div>
      </div>
    </div>
  );
}

function monthsBetween(start: Date, end: Date): number {
  return Math.max(
    1,
    (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth()) +
      1
  );
}

function getCapabilityName(
  _initiative: Initiative,
  _capabilities: { id: string; name: string }[]
): string {
  // For now, return 'Unassigned' as initiatives don't have capabilityId
  // In a full implementation, this would look up the capability
  return 'Unassigned';
}
