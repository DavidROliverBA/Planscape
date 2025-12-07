// ResourceHeatmapToolbar - Toolbar for resource heatmap controls

import { useId } from 'react';
import { Button } from '@/components/ui';
import type { PeriodGranularity } from './ResourceHeatmap';

interface ResourceHeatmapToolbarProps {
  granularity: PeriodGranularity;
  onGranularityChange: (granularity: PeriodGranularity) => void;
  overThreshold: number;
  onOverThresholdChange: (threshold: number) => void;
}

export function ResourceHeatmapToolbar({
  granularity,
  onGranularityChange,
  overThreshold,
  onOverThresholdChange,
}: ResourceHeatmapToolbarProps) {
  const thresholdId = useId();
  const granularityGroupId = useId();

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
      <div className="flex items-center gap-4">
        {/* Granularity selector */}
        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">Period granularity</legend>
          <span id={granularityGroupId} className="text-xs text-gray-500">
            Period:
          </span>
          <div
            className="flex rounded-md shadow-sm"
            role="group"
            aria-labelledby={granularityGroupId}
          >
            <button
              type="button"
              onClick={() => onGranularityChange('month')}
              aria-pressed={granularity === 'month'}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-l-md border
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:z-10
                ${granularity === 'month'
                  ? 'bg-primary-50 text-primary-700 border-primary-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => onGranularityChange('quarter')}
              aria-pressed={granularity === 'quarter'}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-r-md border-t border-r border-b -ml-px
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:z-10
                ${granularity === 'quarter'
                  ? 'bg-primary-50 text-primary-700 border-primary-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              Quarter
            </button>
          </div>
        </fieldset>

        {/* Over threshold slider */}
        <div className="flex items-center gap-2">
          <label htmlFor={thresholdId} className="text-xs text-gray-500">
            Over threshold:
          </label>
          <input
            id={thresholdId}
            type="range"
            min={70}
            max={100}
            value={overThreshold}
            onChange={(e) => onOverThresholdChange(Number(e.target.value))}
            aria-valuemin={70}
            aria-valuemax={100}
            aria-valuenow={overThreshold}
            aria-valuetext={`${overThreshold}%`}
            className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <output htmlFor={thresholdId} className="text-xs font-medium text-gray-700 w-8">
            {overThreshold}%
          </output>
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
