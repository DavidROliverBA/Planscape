// DragConsequencePopover - Real-time feedback during drag operations

import { Button, Badge } from '@/components/ui';
import type { ConsequenceReport } from '@/lib/consequenceEngine';

interface DragConsequencePopoverProps {
  visible: boolean;
  position: { x: number; y: number };
  consequences: ConsequenceReport | null;
  onContinue: () => void;
  onSnapToValid: () => void;
  onCancel: () => void;
}

export function DragConsequencePopover({
  visible,
  position,
  consequences,
  onContinue,
  onSnapToValid,
  onCancel,
}: DragConsequencePopoverProps) {
  if (!visible || !consequences || consequences.totalIssueCount === 0) {
    return null;
  }

  const hasHardIssues = consequences.hasHardViolations;
  const hasCascading = consequences.cascadingChanges.size > 0;

  // Calculate position to avoid going off-screen
  const popoverStyle = {
    left: position.x + 16,
    top: position.y - 100,
  };

  return (
    <div
      className={`
        fixed z-50 w-80 bg-white rounded-lg shadow-xl border-2
        ${hasHardIssues ? 'border-red-300' : 'border-amber-300'}
        pointer-events-auto
      `}
      style={popoverStyle}
    >
      {/* Header */}
      <div
        className={`
          px-3 py-2 rounded-t-lg flex items-center gap-2
          ${hasHardIssues ? 'bg-red-50' : 'bg-amber-50'}
        `}
      >
        {hasHardIssues ? (
          <svg
            className="w-5 h-5 text-red-600 flex-shrink-0"
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
            className="w-5 h-5 text-amber-600 flex-shrink-0"
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
        <span
          className={`text-sm font-medium ${hasHardIssues ? 'text-red-800' : 'text-amber-800'}`}
        >
          This change would:
        </span>
      </div>

      {/* Content */}
      <div className="px-3 py-2 space-y-2 max-h-48 overflow-y-auto">
        {/* Dependency violations */}
        {consequences.dependencyViolations.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-red-500 text-lg">🔴</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {consequences.dependencyViolations.length} dependency violation
                {consequences.dependencyViolations.length !== 1 ? 's' : ''}
              </p>
              <ul className="text-xs text-gray-600 mt-0.5 space-y-0.5">
                {consequences.dependencyViolations.slice(0, 2).map((v, i) => (
                  <li key={i} className="truncate">• {v.message}</li>
                ))}
                {consequences.dependencyViolations.length > 2 && (
                  <li className="text-gray-400">
                    +{consequences.dependencyViolations.length - 2} more
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Constraint violations */}
        {consequences.constraintViolations.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-amber-500 text-lg">🟠</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {consequences.constraintViolations.length} constraint violation
                {consequences.constraintViolations.length !== 1 ? 's' : ''}
              </p>
              <ul className="text-xs text-gray-600 mt-0.5 space-y-0.5">
                {consequences.constraintViolations.slice(0, 2).map((v, i) => (
                  <li key={i} className="truncate flex items-center gap-1">
                    •{' '}
                    <Badge
                      variant={v.hardness === 'Hard' ? 'danger' : 'warning'}
                      size="sm"
                    >
                      {v.hardness}
                    </Badge>{' '}
                    {v.constraintName}
                  </li>
                ))}
                {consequences.constraintViolations.length > 2 && (
                  <li className="text-gray-400">
                    +{consequences.constraintViolations.length - 2} more
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Resource conflicts */}
        {consequences.resourceConflicts.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-lg">📊</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Resource impact</p>
              <ul className="text-xs text-gray-600 mt-0.5 space-y-0.5">
                {consequences.resourceConflicts.slice(0, 2).map((c, i) => (
                  <li key={i} className="truncate">
                    • {c.poolName}: {Math.round(c.utilisationPercent)}% in{' '}
                    {formatPeriod(c.periodStart)}
                  </li>
                ))}
                {consequences.resourceConflicts.length > 2 && (
                  <li className="text-gray-400">
                    +{consequences.resourceConflicts.length - 2} more
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Cascading changes */}
        {hasCascading && (
          <div className="flex items-start gap-2">
            <span className="text-blue-500 text-lg">🔗</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {consequences.cascadingChanges.size} initiative
                {consequences.cascadingChanges.size !== 1 ? 's' : ''} would also move
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-3 py-2 border-t border-gray-200 flex items-center justify-end gap-2 bg-gray-50 rounded-b-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          title="Press Escape"
        >
          Cancel
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onSnapToValid}
          title="Press V"
        >
          Snap to Valid
        </Button>
        <Button
          size="sm"
          onClick={onContinue}
          title="Press Enter"
          variant={hasHardIssues ? 'danger' : 'primary'}
        >
          Continue
        </Button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="px-3 py-1 bg-gray-100 border-t border-gray-200 rounded-b-lg">
        <p className="text-xs text-gray-400 text-center">
          Enter = Continue • V = Snap • Esc = Cancel
        </p>
      </div>
    </div>
  );
}

function formatPeriod(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
  });
}

// Hook for managing drag consequence popover state
export function useDragConsequencePopover() {
  // This would be integrated with the actual drag hook
  // For now, just export the component
  return {
    showPopover: false,
    popoverPosition: { x: 0, y: 0 },
    consequences: null as ConsequenceReport | null,
    handleContinue: () => {},
    handleSnapToValid: () => {},
    handleCancel: () => {},
  };
}
