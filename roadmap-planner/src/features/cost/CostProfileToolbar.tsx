// CostProfileToolbar - Toolbar for cost profile controls

import { useId } from 'react';
import { Button } from '@/components/ui';
import type { ChartType, CostGranularity, StackBy } from './CostProfile';

interface CostProfileToolbarProps {
  granularity: CostGranularity;
  onGranularityChange: (granularity: CostGranularity) => void;
  chartType: ChartType;
  onChartTypeChange: (chartType: ChartType) => void;
  stackBy: StackBy;
  onStackByChange: (stackBy: StackBy) => void;
  showBudgetLine: boolean;
  onShowBudgetLineChange: (show: boolean) => void;
}

export function CostProfileToolbar({
  granularity,
  onGranularityChange,
  chartType,
  onChartTypeChange,
  stackBy,
  onStackByChange,
  showBudgetLine,
  onShowBudgetLineChange,
}: CostProfileToolbarProps) {
  const periodGroupId = useId();
  const chartGroupId = useId();
  const stackById = useId();
  const budgetCheckboxId = useId();

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
      <div className="flex items-center gap-4">
        {/* Granularity selector */}
        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">Time period granularity</legend>
          <span id={periodGroupId} className="text-xs text-gray-500">
            Period:
          </span>
          <div
            className="flex rounded-md shadow-sm"
            role="group"
            aria-labelledby={periodGroupId}
          >
            <button
              type="button"
              onClick={() => onGranularityChange('quarter')}
              aria-pressed={granularity === 'quarter'}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-l-md border
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:z-10
                ${granularity === 'quarter'
                  ? 'bg-primary-50 text-primary-700 border-primary-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              Quarter
            </button>
            <button
              type="button"
              onClick={() => onGranularityChange('year')}
              aria-pressed={granularity === 'year'}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-r-md border-t border-r border-b -ml-px
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:z-10
                ${granularity === 'year'
                  ? 'bg-primary-50 text-primary-700 border-primary-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              Year
            </button>
          </div>
        </fieldset>

        {/* Chart type selector */}
        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">Chart type</legend>
          <span id={chartGroupId} className="text-xs text-gray-500">
            Chart:
          </span>
          <div
            className="flex rounded-md shadow-sm"
            role="group"
            aria-labelledby={chartGroupId}
          >
            <button
              type="button"
              onClick={() => onChartTypeChange('bar')}
              aria-pressed={chartType === 'bar'}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-l-md border
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:z-10
                ${chartType === 'bar'
                  ? 'bg-primary-50 text-primary-700 border-primary-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              Bar
            </button>
            <button
              type="button"
              onClick={() => onChartTypeChange('area')}
              aria-pressed={chartType === 'area'}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-r-md border-t border-r border-b -ml-px
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:z-10
                ${chartType === 'area'
                  ? 'bg-primary-50 text-primary-700 border-primary-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              Area
            </button>
          </div>
        </fieldset>

        {/* Stack by selector */}
        <div className="flex items-center gap-2">
          <label htmlFor={stackById} className="text-xs text-gray-500">
            Stack by:
          </label>
          <select
            id={stackById}
            value={stackBy}
            onChange={(e) => onStackByChange(e.target.value as StackBy)}
            className="text-xs py-1.5 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="none">None</option>
            <option value="type">Type</option>
            <option value="capability">Capability</option>
          </select>
        </div>

        {/* Budget line toggle */}
        <div className="flex items-center gap-2">
          <input
            id={budgetCheckboxId}
            type="checkbox"
            checked={showBudgetLine}
            onChange={(e) => onShowBudgetLineChange(e.target.checked)}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label htmlFor={budgetCheckboxId} className="text-xs text-gray-600 cursor-pointer">
            Show budget
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled title="Coming in Phase 6">
          Export
        </Button>
      </div>
    </div>
  );
}
