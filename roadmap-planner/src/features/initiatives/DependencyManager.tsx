// Dependency Manager - Manage dependencies for an initiative

import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  ConfirmModal,
  Modal,
  Select,
} from '../../components/ui';
import {
  initiativeDependencies as depsDb,
  initiatives as initiativesDb,
} from '../../lib/db';
import type {
  Initiative,
  InitiativeDependency,
  InitiativeDependencyType,
} from '../../lib/types';

interface DependencyManagerProps {
  initiative: Initiative;
  onUpdate?: () => void;
}

const dependencyTypeOptions = [
  { value: 'FinishToStart', label: 'Finish to Start (FS)' },
  { value: 'StartToStart', label: 'Start to Start (SS)' },
  { value: 'FinishToFinish', label: 'Finish to Finish (FF)' },
  { value: 'StartToFinish', label: 'Start to Finish (SF)' },
];

const dependencyTypeLabels: Record<InitiativeDependencyType, string> = {
  FinishToStart: 'finishes before this starts',
  StartToStart: 'starts before this starts',
  FinishToFinish: 'finishes before this finishes',
  StartToFinish: 'starts before this finishes',
};

export function DependencyManager({
  initiative,
  onUpdate,
}: DependencyManagerProps) {
  const [dependencies, setDependencies] = useState<InitiativeDependency[]>([]);
  const [allInitiatives, setAllInitiatives] = useState<Initiative[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<InitiativeDependency | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [deps, inits] = await Promise.all([
        depsDb.getByInitiative(initiative.id),
        initiativesDb.getByScenario(initiative.scenarioId),
      ]);
      setDependencies(deps);
      setAllInitiatives(inits);
    } catch (error) {
      console.error('Failed to load dependencies:', error);
    } finally {
      setIsLoading(false);
    }
  }, [initiative.id, initiative.scenarioId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddDependency = async (
    predecessorId: string,
    type: InitiativeDependencyType,
    lagDays: number,
  ) => {
    try {
      await depsDb.create({
        predecessorId,
        successorId: initiative.id,
        dependencyType: type,
        lagDays,
      });
      setIsAddModalOpen(false);
      loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to add dependency:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setIsDeleting(true);
      await depsDb.delete(deleteConfirm.id);
      setDeleteConfirm(null);
      loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to delete dependency:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Separate incoming (this initiative depends on) and outgoing (other initiatives depend on this)
  const incomingDeps = dependencies.filter(
    (d) => d.successorId === initiative.id,
  );
  const outgoingDeps = dependencies.filter(
    (d) => d.predecessorId === initiative.id,
  );

  const getInitiativeName = (id: string) =>
    allInitiatives.find((i) => i.id === id)?.name ?? 'Unknown';

  if (isLoading) {
    return <div className="text-sm text-gray-500 p-4">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Incoming dependencies - this initiative depends on */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">
            This initiative depends on ({incomingDeps.length})
          </h4>
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            Add Dependency
          </Button>
        </div>

        {incomingDeps.length === 0 ? (
          <p className="text-sm text-gray-500">No dependencies</p>
        ) : (
          <div className="space-y-2">
            {incomingDeps.map((dep) => (
              <Card key={dep.id} padding="sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {getInitiativeName(dep.predecessorId)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {dependencyTypeLabels[dep.dependencyType]}
                      {dep.lagDays > 0 && ` (+${dep.lagDays} days lag)`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" size="sm">
                      {dep.dependencyType}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(dep)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Outgoing dependencies - other initiatives depend on this */}
      {outgoingDeps.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Initiatives that depend on this ({outgoingDeps.length})
          </h4>
          <div className="space-y-2">
            {outgoingDeps.map((dep) => (
              <Card key={dep.id} padding="sm" className="bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {getInitiativeName(dep.successorId)}
                    </p>
                    <p className="text-xs text-gray-500">
                      waits for this to{' '}
                      {dep.dependencyType.includes('Finish')
                        ? 'finish'
                        : 'start'}
                      {dep.lagDays > 0 && ` (+${dep.lagDays} days lag)`}
                    </p>
                  </div>
                  <Badge variant="info" size="sm">
                    {dep.dependencyType}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add Dependency Modal */}
      <AddDependencyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddDependency}
        initiatives={allInitiatives.filter((i) => i.id !== initiative.id)}
        existingPredecessorIds={incomingDeps.map((d) => d.predecessorId)}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Remove Dependency"
        message={`Remove dependency on "${getInitiativeName(deleteConfirm?.predecessorId ?? '')}"?`}
        confirmText="Remove"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

interface AddDependencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (
    predecessorId: string,
    type: InitiativeDependencyType,
    lagDays: number,
  ) => void;
  initiatives: Initiative[];
  existingPredecessorIds: string[];
}

function AddDependencyModal({
  isOpen,
  onClose,
  onAdd,
  initiatives,
  existingPredecessorIds,
}: AddDependencyModalProps) {
  const [predecessorId, setPredecessorId] = useState('');
  const [dependencyType, setDependencyType] =
    useState<InitiativeDependencyType>('FinishToStart');
  const [lagDays, setLagDays] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPredecessorId('');
      setDependencyType('FinishToStart');
      setLagDays(0);
    }
  }, [isOpen]);

  const availableInitiatives = initiatives.filter(
    (i) => !existingPredecessorIds.includes(i.id),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!predecessorId) return;

    setIsSubmitting(true);
    try {
      await onAdd(predecessorId, dependencyType, lagDays);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Dependency"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!predecessorId}
          >
            Add
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Depends On"
          value={predecessorId}
          onChange={(e) => setPredecessorId(e.target.value)}
          options={availableInitiatives.map((i) => ({
            value: i.id,
            label: i.name,
          }))}
          placeholder="Select initiative..."
        />

        <Select
          label="Dependency Type"
          value={dependencyType}
          onChange={(e) =>
            setDependencyType(e.target.value as InitiativeDependencyType)
          }
          options={dependencyTypeOptions}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lag Days
          </label>
          <input
            type="number"
            min="0"
            value={lagDays}
            onChange={(e) => setLagDays(Number.parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Additional days to wait after the dependency is satisfied
          </p>
        </div>
      </form>
    </Modal>
  );
}
