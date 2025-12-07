// DependencyGraphToolbar - Toolbar for dependency graph controls

import { useId } from 'react';
import { Button } from '@/components/ui';
import type { GraphLayout, NodeFilter } from './DependencyGraph';

interface DependencyGraphToolbarProps {
  layout: GraphLayout;
  onLayoutChange: (layout: GraphLayout) => void;
  nodeFilter: NodeFilter;
  onNodeFilterChange: (filter: NodeFilter) => void;
  highlightCriticalPath: boolean;
  onHighlightCriticalPathChange: (highlight: boolean) => void;
  criticalPathLength: number;
}

export function DependencyGraphToolbar({
  layout,
  onLayoutChange,
  nodeFilter,
  onNodeFilterChange,
  highlightCriticalPath,
  onHighlightCriticalPathChange,
  criticalPathLength,
}: DependencyGraphToolbarProps) {
  const layoutGroupId = useId();
  const filterSelectId = useId();
  const criticalPathCheckboxId = useId();

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
      <div className="flex items-center gap-4">
        {/* Layout selector */}
        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">Graph layout</legend>
          <span id={layoutGroupId} className="text-xs text-gray-500">
            Layout:
          </span>
          <div
            className="flex rounded-md shadow-sm"
            role="group"
            aria-labelledby={layoutGroupId}
          >
            <button
              type="button"
              onClick={() => onLayoutChange('force')}
              aria-pressed={layout === 'force'}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-l-md border
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:z-10
                ${layout === 'force'
                  ? 'bg-primary-50 text-primary-700 border-primary-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              Force
            </button>
            <button
              type="button"
              onClick={() => onLayoutChange('hierarchical')}
              aria-pressed={layout === 'hierarchical'}
              className={`
                px-3 py-1.5 text-xs font-medium border-t border-r border-b -ml-px
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:z-10
                ${layout === 'hierarchical'
                  ? 'bg-primary-50 text-primary-700 border-primary-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              Hierarchy
            </button>
            <button
              type="button"
              onClick={() => onLayoutChange('circular')}
              aria-pressed={layout === 'circular'}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-r-md border-t border-r border-b -ml-px
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:z-10
                ${layout === 'circular'
                  ? 'bg-primary-50 text-primary-700 border-primary-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              Circular
            </button>
          </div>
        </fieldset>

        {/* Node filter */}
        <div className="flex items-center gap-2">
          <label htmlFor={filterSelectId} className="text-xs text-gray-500">
            Show:
          </label>
          <select
            id={filterSelectId}
            value={nodeFilter}
            onChange={(e) => onNodeFilterChange(e.target.value as NodeFilter)}
            className="text-xs py-1.5 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="initiatives">Initiatives only</option>
            <option value="systems">Systems only</option>
            <option value="both">Both</option>
          </select>
        </div>

        {/* Critical path toggle */}
        <div className="flex items-center gap-2">
          <input
            id={criticalPathCheckboxId}
            type="checkbox"
            checked={highlightCriticalPath}
            onChange={(e) => onHighlightCriticalPathChange(e.target.checked)}
            aria-describedby={highlightCriticalPath && criticalPathLength > 0 ? `${criticalPathCheckboxId}-desc` : undefined}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label htmlFor={criticalPathCheckboxId} className="text-xs text-gray-600 cursor-pointer">
            Critical path
            {highlightCriticalPath && criticalPathLength > 0 && (
              <span id={`${criticalPathCheckboxId}-desc`} className="ml-1 text-red-600">
                ({criticalPathLength} nodes)
              </span>
            )}
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
