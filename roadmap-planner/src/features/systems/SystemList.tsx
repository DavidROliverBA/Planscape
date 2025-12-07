import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CriticalityBadge,
  LifecycleBadge,
  LoadingInline,
  NoSystemsEmptyState,
} from '../../components/ui';
import { systems as systemsDb } from '../../lib/db';
import type { System } from '../../lib/types';

interface SystemListProps {
  onSelect: (system: System) => void;
  onAdd: () => void;
  selectedId?: string | null;
}

export function SystemList({ onSelect, onAdd, selectedId }: SystemListProps) {
  const [systemsList, setSystemsList] = useState<System[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSystems();
  }, []);

  async function loadSystems() {
    try {
      setIsLoading(true);
      const data = await systemsDb.getAll();
      setSystemsList(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load systems');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <LoadingInline message="Loading systems..." />;
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600 text-sm">{error}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={loadSystems}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (systemsList.length === 0) {
    return <NoSystemsEmptyState onAdd={onAdd} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Systems ({systemsList.length})
        </h2>
        <Button size="sm" onClick={onAdd}>
          Add System
        </Button>
      </div>

      <div className="space-y-2">
        {systemsList.map((system) => (
          <Card
            key={system.id}
            padding="sm"
            className={`cursor-pointer hover:border-blue-300 transition-colors ${
              selectedId === system.id
                ? 'border-blue-500 ring-1 ring-blue-500'
                : ''
            }`}
            onClick={() => onSelect(system)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {system.name}
                </h3>
                {system.description && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    {system.description}
                  </p>
                )}
                {system.vendor && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Vendor: {system.vendor}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 ml-2">
                <LifecycleBadge stage={system.lifecycleStage} />
                <CriticalityBadge criticality={system.criticality} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
