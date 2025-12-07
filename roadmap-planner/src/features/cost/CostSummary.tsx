// CostSummary - Summary statistics for cost profile

import type { CostPeriodData, StackBy } from './CostProfile';

interface CostSummaryProps {
  totalCost: number;
  breakdownCategories: string[];
  costData: CostPeriodData[];
  stackBy: StackBy;
}

export function CostSummary({
  totalCost,
  breakdownCategories,
  costData,
  stackBy,
}: CostSummaryProps) {
  // Calculate breakdown totals
  const breakdownTotals = breakdownCategories.reduce<Record<string, number>>(
    (acc, category) => {
      acc[category] = costData.reduce(
        (sum, period) => sum + (period.breakdown[category] ?? 0),
        0
      );
      return acc;
    },
    {}
  );

  // Find peak period
  const peakPeriod = costData.reduce<CostPeriodData | null>((peak, period) => {
    if (!peak || period.totalCost > peak.totalCost) return period;
    return peak;
  }, null);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-8">
        {/* Total cost */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Cost</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCost)}</p>
        </div>

        {/* Peak period */}
        {peakPeriod && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Peak Period</p>
            <p className="text-lg font-semibold text-gray-900">{peakPeriod.label}</p>
            <p className="text-sm text-gray-600">{formatCurrency(peakPeriod.totalCost)}</p>
          </div>
        )}

        {/* Breakdown (if stacking) */}
        {stackBy !== 'none' && breakdownCategories.length > 0 && (
          <div className="flex-1">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
              Breakdown by {stackBy === 'type' ? 'Type' : 'Capability'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {breakdownCategories.slice(0, 6).map((category) => (
                <div key={category} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 truncate">{category}</span>
                  <span className="font-medium text-gray-900 ml-2">
                    {formatCurrency(breakdownTotals[category] ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Initiative count */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Initiatives</p>
          <p className="text-lg font-semibold text-gray-900">
            {new Set(costData.flatMap((p) => p.initiatives.map((i) => i.id))).size}
          </p>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `£${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `£${(value / 1_000).toFixed(0)}K`;
  }
  return `£${value.toFixed(0)}`;
}
