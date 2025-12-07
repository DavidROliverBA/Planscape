import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  LoadingInline,
  NoInitiativesEmptyState,
  PriorityBadge,
  StatusBadge,
} from '../../components/ui';
import { initiatives as initiativesDb } from '../../lib/db';
import type { Initiative } from '../../lib/types';
import { InitiativeQuickAdd } from './InitiativeQuickAdd';

interface InitiativeListProps {
  scenarioId: string;
  onSelect: (initiative: Initiative) => void;
  onAdd: () => void;
  selectedId?: string | null;
}

export function InitiativeList({
  scenarioId,
  onSelect,
  onAdd,
  selectedId,
}: InitiativeListProps) {
  const [initiativesList, setInitiativesList] = useState<Initiative[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const loadInitiatives = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await initiativesDb.getByScenario(scenarioId);
      setInitiativesList(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load initiatives',
      );
    } finally {
      setIsLoading(false);
    }
  }, [scenarioId]);

  useEffect(() => {
    loadInitiatives();
  }, [loadInitiatives]);

  const handleQuickAddSuccess = useCallback(
    (initiative: Initiative) => {
      setInitiativesList((prev) => [initiative, ...prev]);
      onSelect(initiative);
      setShowQuickAdd(false);
    },
    [onSelect]
  );

  if (isLoading) {
    return <LoadingInline message="Loading initiatives..." />;
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600 text-sm">{error}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={loadInitiatives}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (initiativesList.length === 0) {
    return <NoInitiativesEmptyState onAdd={onAdd} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Initiatives ({initiativesList.length})
        </h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowQuickAdd(!showQuickAdd)}
          >
            Quick Add
          </Button>
          <Button size="sm" onClick={onAdd}>
            Add Initiative
          </Button>
        </div>
      </div>

      {/* Quick Add Form */}
      {showQuickAdd && (
        <InitiativeQuickAdd
          scenarioId={scenarioId}
          onSuccess={handleQuickAddSuccess}
          onCancel={() => setShowQuickAdd(false)}
        />
      )}

      <div className="space-y-2">
        {initiativesList.map((initiative) => (
          <Card
            key={initiative.id}
            padding="sm"
            className={`cursor-pointer hover:border-blue-300 transition-colors ${
              selectedId === initiative.id
                ? 'border-blue-500 ring-1 ring-blue-500'
                : ''
            }`}
            onClick={() => onSelect(initiative)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {initiative.name}
                </h3>
                {initiative.description && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    {initiative.description}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  Type: {initiative.type}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 ml-2">
                <StatusBadge status={initiative.status} />
                <PriorityBadge priority={initiative.priority} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
