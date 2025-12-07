// HeatmapCell - Individual cell in the resource heatmap

import { useId, useRef, useState } from 'react';
import type { HeatmapCellData } from './ResourceHeatmap';

interface HeatmapCellProps {
  cell: HeatmapCellData;
  overThreshold: number;
  onClick: () => void;
}

export function HeatmapCell({ cell, overThreshold, onClick }: HeatmapCellProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const colour = getUtilisationColour(cell.utilisation, overThreshold);
  const status = getUtilisationStatus(cell.utilisation, overThreshold);
  const statusIcon = getStatusIcon(cell.utilisation, overThreshold);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && showTooltip) {
      setShowTooltip(false);
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        onKeyDown={handleKeyDown}
        aria-describedby={showTooltip ? tooltipId : undefined}
        aria-label={`${Math.round(cell.utilisation)}% utilisation, ${status}`}
        className={`
          w-full h-10 rounded-sm text-xs font-medium
          transition-all hover:ring-2 hover:ring-offset-1 hover:ring-gray-400
          focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500
        `}
        style={{ backgroundColor: colour }}
      >
        <span className="flex items-center justify-center gap-0.5">
          {/* Status icon for colour-blind users */}
          {statusIcon && (
            <span aria-hidden="true" className="text-[10px]">
              {statusIcon}
            </span>
          )}
          {cell.utilisation > 0 && (
            <span
              className={`
                ${cell.utilisation > 70 ? 'text-white' : 'text-gray-700'}
              `}
            >
              {Math.round(cell.utilisation)}%
            </span>
          )}
        </span>
      </button>

      {/* Accessible Tooltip */}
      {showTooltip && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none"
          style={{ minWidth: '180px' }}
        >
          <div className="bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Demand:</span>
                <span className="font-medium">{cell.demand.toFixed(1)} FTE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Capacity:</span>
                <span className="font-medium">{cell.capacity.toFixed(1)} FTE</span>
              </div>
              <div className="flex justify-between border-t border-gray-700 pt-1 mt-1">
                <span className="text-gray-400">Utilisation:</span>
                <span
                  className={`font-medium ${
                    cell.utilisation > overThreshold
                      ? 'text-red-400'
                      : cell.utilisation > 70
                      ? 'text-amber-400'
                      : 'text-green-400'
                  }`}
                >
                  {Math.round(cell.utilisation)}% ({status})
                </span>
              </div>
              {cell.initiatives.length > 0 && (
                <div className="border-t border-gray-700 pt-1 mt-1">
                  <span className="text-gray-400">
                    {cell.initiatives.length} initiative{cell.initiatives.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
}

function getUtilisationColour(utilisation: number, overThreshold: number): string {
  if (utilisation === 0) return '#F3F4F6'; // gray-100
  if (utilisation <= 70) return '#86EFAC'; // green-300
  if (utilisation <= overThreshold) return '#FCD34D'; // amber-300
  if (utilisation <= 100) return '#F87171'; // red-400
  return '#991B1B'; // red-800 (over 100%)
}

function getUtilisationStatus(utilisation: number, overThreshold: number): string {
  if (utilisation === 0) return 'No allocation';
  if (utilisation <= 70) return 'Normal';
  if (utilisation <= overThreshold) return 'High';
  if (utilisation <= 100) return 'Over threshold';
  return 'Over capacity';
}

function getStatusIcon(utilisation: number, overThreshold: number): string | null {
  if (utilisation === 0) return null;
  if (utilisation <= 70) return '✓'; // Checkmark for normal
  if (utilisation <= overThreshold) return '!'; // Warning for high
  if (utilisation <= 100) return '⚠'; // Alert for over threshold
  return '✕'; // X for over capacity
}
