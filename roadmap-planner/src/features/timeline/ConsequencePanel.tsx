// Consequence Panel - Shows violations and issues when moving initiatives

import { Badge, Button } from '@/components/ui';
import type { ConsequenceReport } from '@/lib/consequenceEngine';

interface ConsequencePanelProps {
  report: ConsequenceReport | null;
  onDismiss: () => void;
  onApplyCascade?: () => void;
  onApplyJustThis?: () => void;
  showCascadeOptions?: boolean;
}

export function ConsequencePanel({
  report,
  onDismiss,
  onApplyCascade,
  onApplyJustThis,
  showCascadeOptions = false,
}: ConsequencePanelProps) {
  if (!report || report.totalIssueCount === 0) {
    return null;
  }

  const hasHardIssues = report.hasHardViolations;
  const hasCascading = report.cascadingChanges.size > 0;

  return (
    <div
      className={`absolute bottom-4 right-4 w-96 bg-white rounded-lg shadow-lg border ${
        hasHardIssues ? 'border-red-300' : 'border-amber-300'
      } z-50`}
    >
      {/* Header */}
      <div
        className={`px-4 py-3 rounded-t-lg ${
          hasHardIssues ? 'bg-red-50' : 'bg-amber-50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasHardIssues ? (
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            <h3
              className={`font-medium ${
                hasHardIssues ? 'text-red-800' : 'text-amber-800'
              }`}
            >
              {report.totalIssueCount} Issue
              {report.totalIssueCount !== 1 ? 's' : ''} Detected
            </h3>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">{report.summary}</p>
      </div>

      {/* Content */}
      <div className="px-4 py-3 max-h-64 overflow-y-auto">
        {/* Dependency Violations */}
        {report.dependencyViolations.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
              Dependency Issues
            </h4>
            <div className="space-y-2">
              {report.dependencyViolations.map((v, i) => (
                <div key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <Badge variant="info" size="sm">
                    {v.dependencyType}
                  </Badge>
                  <span>{v.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Constraint Violations */}
        {report.constraintViolations.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
              Constraint Violations
            </h4>
            <div className="space-y-2">
              {report.constraintViolations.map((v, i) => (
                <div key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <Badge
                    variant={v.hardness === 'Hard' ? 'danger' : 'warning'}
                    size="sm"
                  >
                    {v.hardness}
                  </Badge>
                  <span>{v.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resource Conflicts */}
        {report.resourceConflicts.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
              Resource Conflicts
            </h4>
            <div className="space-y-2">
              {report.resourceConflicts.map((c, i) => (
                <div key={i} className="text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <Badge variant="warning" size="sm">
                      {Math.round(c.utilisationPercent)}%
                    </Badge>
                    <span className="font-medium">{c.poolName}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {c.demand.toFixed(1)} / {c.capacity.toFixed(1)} capacity (
                    {formatPeriod(c.periodStart, c.periodEnd)})
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cascading Changes */}
        {hasCascading && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
              Cascading Changes ({report.cascadingChanges.size})
            </h4>
            <p className="text-sm text-gray-600">
              {report.cascadingChanges.size} initiative
              {report.cascadingChanges.size !== 1 ? 's' : ''} would also need to
              move.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {showCascadeOptions && hasCascading && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onApplyJustThis}>
            Move Only This
          </Button>
          <Button size="sm" onClick={onApplyCascade}>
            Move All ({report.cascadingChanges.size + 1})
          </Button>
        </div>
      )}
    </div>
  );
}

function formatPeriod(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
  const startStr = start.toLocaleDateString('en-GB', opts);
  const endStr = end.toLocaleDateString('en-GB', opts);
  if (startStr === endStr) return startStr;
  return `${startStr} - ${endStr}`;
}

// Compact inline badge for timeline bars
export function ViolationIndicator({
  hasHardViolation,
  hasSoftViolation,
  hasResourceConflict,
}: {
  hasHardViolation: boolean;
  hasSoftViolation: boolean;
  hasResourceConflict: boolean;
}) {
  if (!hasHardViolation && !hasSoftViolation && !hasResourceConflict) {
    return null;
  }

  return (
    <div className="absolute -top-1 -right-1 flex gap-0.5">
      {hasHardViolation && (
        <span
          className="w-3 h-3 rounded-full bg-red-500 border border-white"
          title="Hard constraint violation"
        />
      )}
      {hasSoftViolation && !hasHardViolation && (
        <span
          className="w-3 h-3 rounded-full bg-amber-500 border border-white"
          title="Soft constraint violation"
        />
      )}
      {hasResourceConflict && !hasHardViolation && (
        <span
          className="w-3 h-3 rounded-full bg-orange-500 border border-white"
          title="Resource conflict"
        />
      )}
    </div>
  );
}
