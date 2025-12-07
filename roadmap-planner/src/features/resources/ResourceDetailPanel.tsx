// ResourceDetailPanel - Shows details when a heatmap cell is clicked

import { useAppStore } from '@/stores/appStore';
import { StatusBadge } from '@/components/ui';
import type { HeatmapCellData } from './ResourceHeatmap';

interface ResourceDetailPanelProps {
  cell: HeatmapCellData;
  onClose: () => void;
}

export function ResourceDetailPanel({ cell, onClose }: ResourceDetailPanelProps) {
  const { resourcePools, selectInitiative, setActiveNavigation } = useAppStore();

  const pool = resourcePools.find((p) => p.id === cell.poolId);

  const handleInitiativeClick = (initiativeId: string) => {
    selectInitiative(initiativeId);
    setActiveNavigation('initiatives');
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div>
          <h3 className="text-sm font-medium text-gray-900">{pool?.name}</h3>
          <p className="text-xs text-gray-500">{cell.periodKey}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Summary */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-semibold text-gray-900">{cell.demand.toFixed(1)}</p>
            <p className="text-xs text-gray-500">Demand</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{cell.capacity.toFixed(1)}</p>
            <p className="text-xs text-gray-500">Capacity</p>
          </div>
          <div>
            <p
              className={`text-lg font-semibold ${
                cell.utilisation > 100
                  ? 'text-red-600'
                  : cell.utilisation > 90
                  ? 'text-amber-600'
                  : 'text-green-600'
              }`}
            >
              {Math.round(cell.utilisation)}%
            </p>
            <p className="text-xs text-gray-500">Utilisation</p>
          </div>
        </div>
      </div>

      {/* Initiatives list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Contributing Initiatives ({cell.initiatives.length})
          </h4>
        </div>

        {cell.initiatives.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            No initiatives in this period
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {cell.initiatives.map((initiative) => (
              <li key={initiative.id}>
                <button
                  type="button"
                  onClick={() => handleInitiativeClick(initiative.id)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 truncate flex-1">
                      {initiative.name}
                    </span>
                    <StatusBadge status={initiative.status} />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <span>{initiative.type}</span>
                    {initiative.effortEstimate && (
                      <>
                        <span>•</span>
                        <span>{initiative.effortEstimate} FTE</span>
                      </>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => setActiveNavigation('timeline')}
          className="w-full px-3 py-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors"
        >
          View in Timeline →
        </button>
      </div>
    </div>
  );
}
