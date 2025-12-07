// Cascade Dialog - Asks user how to handle cascading changes

import { Badge, Button, Modal } from '@/components/ui';
import type { Initiative } from '@/lib/types';

interface CascadeChange {
  initiativeId: string;
  initiativeName: string;
  currentStart: Date;
  currentEnd: Date;
  newStart: Date;
  newEnd: Date;
}

interface CascadeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyAll: () => void;
  onApplyJustThis: () => void;
  movedInitiative: Initiative | null;
  cascadingChanges: CascadeChange[];
}

export function CascadeDialog({
  isOpen,
  onClose,
  onApplyAll,
  onApplyJustThis,
  movedInitiative,
  cascadingChanges,
}: CascadeDialogProps) {
  if (!movedInitiative) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cascading Changes"
      size="md"
      footer={
        <div className="flex justify-between w-full">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onApplyJustThis}>
              Move Only "{movedInitiative.name}"
            </Button>
            <Button onClick={onApplyAll}>
              Move All ({cascadingChanges.length + 1})
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Moving "{movedInitiative.name}" will affect{' '}
          <span className="font-medium">{cascadingChanges.length}</span> other
          initiative{cascadingChanges.length !== 1 ? 's' : ''} due to
          dependencies.
        </p>

        {cascadingChanges.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Initiative
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Current Dates
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    New Dates
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Shift
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cascadingChanges.map((change) => {
                  const shiftDays = Math.round(
                    (change.newStart.getTime() - change.currentStart.getTime()) /
                      (1000 * 60 * 60 * 24),
                  );
                  return (
                    <tr key={change.initiativeId}>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        {change.initiativeName}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {formatDateRange(change.currentStart, change.currentEnd)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {formatDateRange(change.newStart, change.newEnd)}
                      </td>
                      <td className="px-4 py-2">
                        <Badge
                          variant={shiftDays > 0 ? 'warning' : 'info'}
                          size="sm"
                        >
                          {shiftDays > 0 ? '+' : ''}
                          {shiftDays}d
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex gap-2">
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
            <div className="text-sm text-amber-800">
              <p className="font-medium">What happens if you move only this one?</p>
              <p className="mt-1">
                The dependent initiatives won't move. This may create dependency
                violations that you'll need to resolve later.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function formatDateRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  };
  return `${start.toLocaleDateString('en-GB', opts)} - ${end.toLocaleDateString('en-GB', opts)}`;
}

// Helper to convert cascading changes map to array for display
export function cascadeMapToArray(
  cascadingChanges: Map<string, { newStartDate: Date; newEndDate: Date }>,
  initiatives: Initiative[],
): CascadeChange[] {
  const changes: CascadeChange[] = [];

  for (const [id, dates] of cascadingChanges) {
    const initiative = initiatives.find((i) => i.id === id);
    if (!initiative || !initiative.startDate || !initiative.endDate) continue;

    changes.push({
      initiativeId: id,
      initiativeName: initiative.name,
      currentStart: new Date(initiative.startDate),
      currentEnd: new Date(initiative.endDate),
      newStart: dates.newStartDate,
      newEnd: dates.newEndDate,
    });
  }

  return changes;
}
