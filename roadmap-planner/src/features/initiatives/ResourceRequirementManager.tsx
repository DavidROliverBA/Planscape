// Resource Requirement Manager - Manage resource requirements for an initiative

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
  initiativeResourceRequirements as requirementsDb,
  resourcePools as poolsDb,
} from '../../lib/db';
import type {
  Initiative,
  InitiativeResourceRequirement,
  ResourcePool,
} from '../../lib/types';

interface ResourceRequirementManagerProps {
  initiative: Initiative;
  onUpdate?: () => void;
}

export function ResourceRequirementManager({
  initiative,
  onUpdate,
}: ResourceRequirementManagerProps) {
  const [requirements, setRequirements] = useState<
    InitiativeResourceRequirement[]
  >([]);
  const [pools, setPools] = useState<ResourcePool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] =
    useState<InitiativeResourceRequirement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [reqs, allPools] = await Promise.all([
        requirementsDb.getByInitiative(initiative.id),
        poolsDb.getAll(),
      ]);
      setRequirements(reqs);
      setPools(allPools);
    } catch (error) {
      console.error('Failed to load requirements:', error);
    } finally {
      setIsLoading(false);
    }
  }, [initiative.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = async (
    poolId: string,
    effortRequired: number,
    periodStart?: string,
    periodEnd?: string,
  ) => {
    try {
      await requirementsDb.create({
        initiativeId: initiative.id,
        resourcePoolId: poolId,
        effortRequired,
        periodStart,
        periodEnd,
      });
      setIsAddModalOpen(false);
      loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to add requirement:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setIsDeleting(true);
      await requirementsDb.delete(deleteConfirm.id);
      setDeleteConfirm(null);
      loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to delete requirement:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getPoolName = (poolId: string) =>
    pools.find((p) => p.id === poolId)?.name ?? 'Unknown';

  const getPoolUnit = (poolId: string) =>
    pools.find((p) => p.id === poolId)?.capacityUnit ?? '';

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Calculate totals by pool
  const totalsByPool = requirements.reduce(
    (acc, req) => {
      const poolId = req.resourcePoolId;
      acc[poolId] = (acc[poolId] || 0) + req.effortRequired;
      return acc;
    },
    {} as Record<string, number>,
  );

  if (isLoading) {
    return <div className="text-sm text-gray-500 p-4">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">
          Resource Requirements ({requirements.length})
        </h4>
        <Button
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          disabled={pools.length === 0}
        >
          Add Requirement
        </Button>
      </div>

      {pools.length === 0 && (
        <p className="text-sm text-gray-500">
          No resource pools defined. Create resource pools first.
        </p>
      )}

      {requirements.length === 0 && pools.length > 0 ? (
        <p className="text-sm text-gray-500">No resource requirements</p>
      ) : (
        <div className="space-y-2">
          {requirements.map((req) => {
            const pool = pools.find((p) => p.id === req.resourcePoolId);
            return (
              <Card key={req.id} padding="sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: pool?.colour ?? '#6B7280' }}
                      />
                      <p className="text-sm font-medium text-gray-900">
                        {getPoolName(req.resourcePoolId)}
                      </p>
                      <Badge variant="info" size="sm">
                        {req.effortRequired} {getPoolUnit(req.resourcePoolId)}
                      </Badge>
                    </div>
                    {(req.periodStart || req.periodEnd) && (
                      <p className="text-xs text-gray-500 mt-1 ml-5">
                        {req.periodStart && req.periodEnd
                          ? `${formatDate(req.periodStart)} - ${formatDate(req.periodEnd)}`
                          : req.periodStart
                            ? `From ${formatDate(req.periodStart)}`
                            : `Until ${formatDate(req.periodEnd)}`}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirm(req)}
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Totals Summary */}
      {Object.keys(totalsByPool).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
            Total by Pool
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(totalsByPool).map(([poolId, total]) => {
              const pool = pools.find((p) => p.id === poolId);
              return (
                <Badge key={poolId} variant="default" size="sm">
                  {pool?.name}: {total} {pool?.capacityUnit}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Requirement Modal */}
      <AddRequirementModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAdd}
        pools={pools}
        initiative={initiative}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Remove Requirement"
        message={`Remove ${deleteConfirm?.effortRequired} ${getPoolUnit(deleteConfirm?.resourcePoolId ?? '')} from ${getPoolName(deleteConfirm?.resourcePoolId ?? '')}?`}
        confirmText="Remove"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

interface AddRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (
    poolId: string,
    effortRequired: number,
    periodStart?: string,
    periodEnd?: string,
  ) => void;
  pools: ResourcePool[];
  initiative: Initiative;
}

function AddRequirementModal({
  isOpen,
  onClose,
  onAdd,
  pools,
  initiative,
}: AddRequirementModalProps) {
  const [poolId, setPoolId] = useState('');
  const [effortRequired, setEffortRequired] = useState('');
  const [useCustomPeriod, setUseCustomPeriod] = useState(false);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPoolId('');
      setEffortRequired('');
      setUseCustomPeriod(false);
      setPeriodStart(initiative.startDate ?? '');
      setPeriodEnd(initiative.endDate ?? '');
    }
  }, [isOpen, initiative.startDate, initiative.endDate]);

  const selectedPool = pools.find((p) => p.id === poolId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poolId || !effortRequired) return;

    setIsSubmitting(true);
    try {
      await onAdd(
        poolId,
        Number.parseFloat(effortRequired),
        useCustomPeriod ? periodStart || undefined : undefined,
        useCustomPeriod ? periodEnd || undefined : undefined,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Resource Requirement"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!poolId || !effortRequired}
          >
            Add
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Resource Pool"
          value={poolId}
          onChange={(e) => setPoolId(e.target.value)}
          options={pools.map((p) => ({
            value: p.id,
            label: `${p.name} (${p.capacityUnit}/${p.periodType})`,
          }))}
          placeholder="Select pool..."
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Effort Required{' '}
            {selectedPool && (
              <span className="text-gray-500">({selectedPool.capacityUnit})</span>
            )}
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={effortRequired}
            onChange={(e) => setEffortRequired(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 10"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useCustomPeriod}
              onChange={(e) => setUseCustomPeriod(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-gray-700">Specify custom period</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            By default, effort is distributed across the initiative's duration
          </p>
        </div>

        {useCustomPeriod && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
