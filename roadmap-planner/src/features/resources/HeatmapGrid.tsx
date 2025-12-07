// HeatmapGrid - Grid display for resource utilisation heatmap

import { useAppStore } from '@/stores/appStore';
import { HeatmapCell } from './HeatmapCell';
import type { HeatmapData, HeatmapCellData } from './ResourceHeatmap';

interface HeatmapGridProps {
  data: HeatmapData;
  overThreshold: number;
  onCellClick: (cell: HeatmapCellData) => void;
  hoveredPool: string | null;
  hoveredPeriod: string | null;
  onPoolHover: (poolId: string | null) => void;
  onPeriodHover: (periodKey: string | null) => void;
}

export function HeatmapGrid({
  data,
  overThreshold,
  onCellClick,
  hoveredPool,
  hoveredPeriod,
  onPoolHover,
  onPeriodHover,
}: HeatmapGridProps) {
  const { resourcePools } = useAppStore();

  const getPoolColour = (poolId: string): string => {
    const pool = resourcePools.find((p) => p.id === poolId);
    return pool?.colour ?? '#6B7280';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            {/* Pool name header */}
            <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 min-w-[160px]">
              Resource Pool
            </th>
            {/* Period headers */}
            {data.periods.map((period) => (
              <th
                key={period.key}
                className={`
                  px-2 py-2 text-center text-xs font-medium text-gray-500
                  border-b border-gray-200 min-w-[60px]
                  ${hoveredPeriod === period.key ? 'bg-blue-50' : ''}
                `}
                onMouseEnter={() => onPeriodHover(period.key)}
                onMouseLeave={() => onPeriodHover(null)}
              >
                {period.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.pools.map((pool, rowIndex) => (
            <tr
              key={pool.id}
              className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              onMouseEnter={() => onPoolHover(pool.id)}
              onMouseLeave={() => onPoolHover(null)}
            >
              {/* Pool name cell */}
              <td
                className={`
                  sticky left-0 z-10 px-3 py-2 text-sm font-medium text-gray-900
                  border-b border-gray-100
                  ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  ${hoveredPool === pool.id ? 'bg-blue-50' : ''}
                `}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getPoolColour(pool.id) }}
                  />
                  <span className="truncate">{pool.name}</span>
                </div>
              </td>
              {/* Data cells */}
              {data.periods.map((period) => {
                const cellKey = `${pool.id}-${period.key}`;
                const cell = data.cells.get(cellKey);

                if (!cell) return <td key={period.key} />;

                return (
                  <td
                    key={period.key}
                    className={`
                      p-1 border-b border-gray-100
                      ${hoveredPool === pool.id || hoveredPeriod === period.key ? 'ring-2 ring-blue-400 ring-inset' : ''}
                    `}
                  >
                    <HeatmapCell
                      cell={cell}
                      overThreshold={overThreshold}
                      onClick={() => onCellClick(cell)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
