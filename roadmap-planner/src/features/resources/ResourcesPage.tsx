import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardSection,
  ConfirmModal,
  Input,
  LoadingInline,
  Modal,
  NoResourcePoolsEmptyState,
  Select,
  TextArea,
} from '../../components/ui';
import {
  resourcePools as poolsDb,
  resources as resourcesDb,
} from '../../lib/db';
import type {
  CapacityUnit,
  PeriodType,
  Resource,
  ResourcePool,
} from '../../lib/types';

const capacityUnitOptions = [
  { value: 'FTE', label: 'FTE' },
  { value: 'PersonDays', label: 'Person Days' },
  { value: 'PersonMonths', label: 'Person Months' },
];

const periodTypeOptions = [
  { value: 'Month', label: 'Month' },
  { value: 'Quarter', label: 'Quarter' },
  { value: 'Year', label: 'Year' },
];

export function ResourcesPage() {
  const [pools, setPools] = useState<ResourcePool[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedPool, setSelectedPool] = useState<ResourcePool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPoolFormOpen, setIsPoolFormOpen] = useState(false);
  const [editingPool, setEditingPool] = useState<ResourcePool | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [poolsData, resourcesData] = await Promise.all([
        poolsDb.getAll(),
        resourcesDb.getAll(),
      ]);
      setPools(poolsData);
      setResources(resourcesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddPool = () => {
    setEditingPool(null);
    setIsPoolFormOpen(true);
  };

  const handleEditPool = (pool: ResourcePool) => {
    setEditingPool(pool);
    setIsPoolFormOpen(true);
  };

  const handleSavePool = () => {
    setIsPoolFormOpen(false);
    setEditingPool(null);
    loadData();
  };

  const handleDeletePool = async () => {
    if (!selectedPool) return;
    try {
      setIsDeleting(true);
      await poolsDb.delete(selectedPool.id);
      setSelectedPool(null);
      loadData();
    } catch (error) {
      console.error('Failed to delete pool:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getPoolResources = (poolId: string) =>
    resources.filter((r) => r.resourcePoolId === poolId);

  if (isLoading) {
    return <LoadingInline message="Loading resources..." />;
  }

  return (
    <div className="flex h-full">
      {/* Pools Panel */}
      <div className="w-80 border-r border-gray-200 p-4 overflow-y-auto">
        {pools.length === 0 ? (
          <NoResourcePoolsEmptyState onAdd={handleAddPool} />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Resource Pools ({pools.length})
              </h2>
              <Button size="sm" onClick={handleAddPool}>
                Add Pool
              </Button>
            </div>
            <div className="space-y-2">
              {pools.map((pool) => (
                <Card
                  key={pool.id}
                  padding="sm"
                  className={`cursor-pointer hover:border-blue-300 transition-colors ${
                    selectedPool?.id === pool.id
                      ? 'border-blue-500 ring-1 ring-blue-500'
                      : ''
                  }`}
                  onClick={() => setSelectedPool(pool)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: pool.colour ?? '#6B7280' }}
                    />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {pool.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {getPoolResources(pool.id).length} resources
                      </p>
                    </div>
                    <Badge variant="default" size="sm">
                      {pool.capacityUnit}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      <div className="flex-1 p-4 overflow-y-auto">
        {selectedPool ? (
          <Card padding="none">
            <CardHeader
              title={selectedPool.name}
              action={
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEditPool(selectedPool)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete
                  </Button>
                </div>
              }
            />
            <div className="px-4 pb-4">
              {selectedPool.description && (
                <p className="text-sm text-gray-600 mb-4">
                  {selectedPool.description}
                </p>
              )}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase">
                    Capacity Unit
                  </h4>
                  <p className="text-sm text-gray-900">
                    {selectedPool.capacityUnit}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase">
                    Period
                  </h4>
                  <p className="text-sm text-gray-900">
                    {selectedPool.periodType}
                  </p>
                </div>
                {selectedPool.capacityPerPeriod && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase">
                      Capacity
                    </h4>
                    <p className="text-sm text-gray-900">
                      {selectedPool.capacityPerPeriod} per{' '}
                      {selectedPool.periodType}
                    </p>
                  </div>
                )}
              </div>

              <CardSection
                title={`Resources (${getPoolResources(selectedPool.id).length})`}
              >
                {getPoolResources(selectedPool.id).length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No resources in this pool
                  </p>
                ) : (
                  <div className="space-y-2">
                    {getPoolResources(selectedPool.id).map((resource) => (
                      <div
                        key={resource.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div>
                          <p className="text-sm font-medium">{resource.name}</p>
                          {resource.role && (
                            <p className="text-xs text-gray-500">
                              {resource.role}
                            </p>
                          )}
                        </div>
                        <Badge variant="info" size="sm">
                          {(resource.availability * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardSection>
            </div>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Select a resource pool to view details</p>
          </div>
        )}
      </div>

      {/* Pool Form Modal */}
      <ResourcePoolForm
        isOpen={isPoolFormOpen}
        onClose={() => setIsPoolFormOpen(false)}
        onSave={handleSavePool}
        pool={editingPool}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeletePool}
        title="Delete Resource Pool"
        message={`Are you sure you want to delete "${selectedPool?.name}"?`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

interface ResourcePoolFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  pool?: ResourcePool | null;
}

function ResourcePoolForm({
  isOpen,
  onClose,
  onSave,
  pool,
}: ResourcePoolFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [capacityUnit, setCapacityUnit] = useState<CapacityUnit>('FTE');
  const [periodType, setPeriodType] = useState<PeriodType>('Month');
  const [capacityPerPeriod, setCapacityPerPeriod] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (pool) {
      setName(pool.name);
      setDescription(pool.description ?? '');
      setCapacityUnit(pool.capacityUnit);
      setPeriodType(pool.periodType);
      setCapacityPerPeriod(pool.capacityPerPeriod?.toString() ?? '');
    } else {
      setName('');
      setDescription('');
      setCapacityUnit('FTE');
      setPeriodType('Month');
      setCapacityPerPeriod('');
    }
  }, [pool]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsLoading(true);
      const data = {
        name,
        description: description || undefined,
        capacityUnit,
        periodType,
        capacityPerPeriod: capacityPerPeriod
          ? Number.parseFloat(capacityPerPeriod)
          : undefined,
      };
      if (pool) {
        await poolsDb.update(pool.id, data);
      } else {
        await poolsDb.create(data);
      }
      onSave();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={pool ? 'Edit Resource Pool' : 'Add Resource Pool'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            {pool ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextArea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Capacity Unit"
            value={capacityUnit}
            onChange={(e) => setCapacityUnit(e.target.value as CapacityUnit)}
            options={capacityUnitOptions}
          />
          <Select
            label="Period Type"
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as PeriodType)}
            options={periodTypeOptions}
          />
        </div>
        <Input
          label="Capacity per Period"
          type="number"
          value={capacityPerPeriod}
          onChange={(e) => setCapacityPerPeriod(e.target.value)}
        />
      </form>
    </Modal>
  );
}
