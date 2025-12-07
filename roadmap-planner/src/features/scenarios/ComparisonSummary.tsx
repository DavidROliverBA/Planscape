// ComparisonSummary - Side-by-side metrics comparison between two scenarios

import { useMemo, useState } from 'react';
import { Button, ConfirmModal } from '@/components/ui';
import { useAppStore } from '@/stores/appStore';
import type { Initiative, Scenario } from '@/lib/types';

interface ScenarioMetrics {
  totalCost: number;
  peakResourceUtilisation: number;
  constraintViolations: number;
  endDate: Date | null;
  initiativeCount: number;
}

interface ComparisonSummaryProps {
  baselineScenario: Scenario;
  comparisonScenario: Scenario;
  onClose: () => void;
  onPromoteToBaseline?: () => void;
}

export function ComparisonSummary({
  baselineScenario,
  comparisonScenario,
  onClose,
  onPromoteToBaseline,
}: ComparisonSummaryProps) {
  const { initiatives } = useAppStore();
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false);

  // Calculate metrics for each scenario
  const baselineMetrics = useMemo(
    () => calculateMetrics(initiatives.filter((i) => i.scenarioId === baselineScenario.id)),
    [initiatives, baselineScenario.id]
  );

  const comparisonMetrics = useMemo(
    () => calculateMetrics(initiatives.filter((i) => i.scenarioId === comparisonScenario.id)),
    [initiatives, comparisonScenario.id]
  );

  const handlePromote = () => {
    setShowPromoteConfirm(false);
    onPromoteToBaseline?.();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Scenario Comparison</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title="Close comparison"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Metric
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <span className="text-green-600">📍</span>
                  {baselineScenario.name}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-600">⚡</span>
                  {comparisonScenario.name}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {/* Total Cost */}
            <MetricRow
              label="Total Cost"
              baselineValue={formatCurrency(baselineMetrics.totalCost)}
              comparisonValue={formatCurrency(comparisonMetrics.totalCost)}
              difference={comparisonMetrics.totalCost - baselineMetrics.totalCost}
              formatDifference={(d) => formatCurrency(Math.abs(d))}
              lowerIsBetter
            />

            {/* Peak Resource Utilisation */}
            <MetricRow
              label="Peak Resources"
              baselineValue={`${baselineMetrics.peakResourceUtilisation}%`}
              comparisonValue={`${comparisonMetrics.peakResourceUtilisation}%`}
              difference={comparisonMetrics.peakResourceUtilisation - baselineMetrics.peakResourceUtilisation}
              formatDifference={(d) => `${Math.abs(d)}%`}
              lowerIsBetter
            />

            {/* Constraint Violations */}
            <MetricRow
              label="Constraints"
              baselineValue={baselineMetrics.constraintViolations.toString()}
              comparisonValue={
                comparisonMetrics.constraintViolations === 0
                  ? '0 ✓'
                  : comparisonMetrics.constraintViolations.toString()
              }
              difference={comparisonMetrics.constraintViolations - baselineMetrics.constraintViolations}
              formatDifference={(d) => Math.abs(d).toString()}
              lowerIsBetter
              showCheckOnZero
            />

            {/* End Date */}
            <MetricRow
              label="End Date"
              baselineValue={baselineMetrics.endDate ? formatDate(baselineMetrics.endDate) : 'N/A'}
              comparisonValue={comparisonMetrics.endDate ? formatDate(comparisonMetrics.endDate) : 'N/A'}
              difference={
                baselineMetrics.endDate && comparisonMetrics.endDate
                  ? monthsDifference(baselineMetrics.endDate, comparisonMetrics.endDate)
                  : 0
              }
              formatDifference={(d) => `${Math.abs(d)} months`}
              lowerIsBetter
            />

            {/* Initiative Count */}
            <MetricRow
              label="Initiatives"
              baselineValue={baselineMetrics.initiativeCount.toString()}
              comparisonValue={comparisonMetrics.initiativeCount.toString()}
              difference={comparisonMetrics.initiativeCount - baselineMetrics.initiativeCount}
              formatDifference={(d) => Math.abs(d).toString()}
            />
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close Comparison
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" disabled title="Coming soon">
            Export Comparison
          </Button>
          {onPromoteToBaseline && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowPromoteConfirm(true)}
            >
              Promote to Baseline
            </Button>
          )}
        </div>
      </div>

      {/* Promote Confirmation */}
      <ConfirmModal
        isOpen={showPromoteConfirm}
        onClose={() => setShowPromoteConfirm(false)}
        onConfirm={handlePromote}
        title="Promote to Baseline"
        message={`Are you sure you want to promote "${comparisonScenario.name}" to become the new baseline? This will replace the current baseline scenario.`}
        confirmText="Promote"
        variant="primary"
      />
    </div>
  );
}

interface MetricRowProps {
  label: string;
  baselineValue: string;
  comparisonValue: string;
  difference: number;
  formatDifference: (d: number) => string;
  lowerIsBetter?: boolean;
  showCheckOnZero?: boolean;
}

function MetricRow({
  label,
  baselineValue,
  comparisonValue,
  difference,
  formatDifference,
  lowerIsBetter = false,
  showCheckOnZero = false,
}: MetricRowProps) {
  const isImproved = lowerIsBetter ? difference < 0 : difference > 0;
  const isWorse = lowerIsBetter ? difference > 0 : difference < 0;
  const isNeutral = difference === 0;

  let diffColour = 'text-gray-500';
  let diffIcon = '';

  if (isImproved) {
    diffColour = 'text-green-600';
    diffIcon = '↓';
  } else if (isWorse) {
    diffColour = 'text-red-600';
    diffIcon = '↑';
  }

  // Swap arrows if higher is better
  if (!lowerIsBetter) {
    if (isImproved) diffIcon = '↑';
    if (isWorse) diffIcon = '↓';
  }

  return (
    <tr>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">{label}</td>
      <td className="px-4 py-3 text-sm text-gray-700">{baselineValue}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">{comparisonValue}</span>
          {!isNeutral && (
            <span className={`text-xs ${diffColour}`}>
              {diffIcon} {formatDifference(difference)}
            </span>
          )}
          {isNeutral && showCheckOnZero && (
            <span className="text-xs text-green-600">✓ All resolved</span>
          )}
        </div>
      </td>
    </tr>
  );
}

// Helper functions
function calculateMetrics(initiatives: Initiative[]): ScenarioMetrics {
  const totalCost = initiatives.reduce((sum, i) => sum + (i.costEstimate ?? 0), 0);

  // Find the latest end date
  let endDate: Date | null = null;
  initiatives.forEach((i) => {
    if (i.endDate) {
      const date = new Date(i.endDate);
      if (!endDate || date > endDate) {
        endDate = date;
      }
    }
  });

  // Peak resource utilisation - placeholder calculation
  // In a real implementation, this would aggregate resource requirements
  const peakResourceUtilisation = initiatives.length > 0 ? Math.min(100 + initiatives.length * 5, 200) : 0;

  // Constraint violations - placeholder
  // In a real implementation, this would check actual constraint violations
  const constraintViolations = Math.max(0, initiatives.length - 5);

  return {
    totalCost,
    peakResourceUtilisation,
    constraintViolations,
    endDate,
    initiativeCount: initiatives.length,
  };
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

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

function monthsDifference(date1: Date, date2: Date): number {
  const months1 = date1.getFullYear() * 12 + date1.getMonth();
  const months2 = date2.getFullYear() * 12 + date2.getMonth();
  return months2 - months1;
}
