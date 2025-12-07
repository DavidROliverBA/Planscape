import { useCallback, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardSection,
  ConfirmModal,
} from '../../components/ui';
import { capabilities as capabilitiesDb } from '../../lib/db';
import type { Capability } from '../../lib/types';
import { CapabilityForm } from './CapabilityForm';
import { CapabilityTree } from './CapabilityTree';

export function CapabilitiesPage() {
  const [selectedCapability, setSelectedCapability] =
    useState<Capability | null>(null);
  const [editingCapability, setEditingCapability] = useState<Capability | null>(
    null,
  );
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelect = useCallback((capability: Capability) => {
    setSelectedCapability(capability);
  }, []);

  const handleAdd = useCallback((parentId?: string) => {
    setEditingCapability(null);
    setParentIdForNew(parentId ?? null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((capability: Capability) => {
    setEditingCapability(capability);
    setParentIdForNew(null);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingCapability(null);
    setParentIdForNew(null);
  }, []);

  const handleSave = useCallback((capability: Capability) => {
    setIsFormOpen(false);
    setEditingCapability(null);
    setParentIdForNew(null);
    setSelectedCapability(capability);
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!selectedCapability) return;

    try {
      setIsDeleting(true);
      await capabilitiesDb.delete(selectedCapability.id);
      setSelectedCapability(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to delete capability:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [selectedCapability]);

  const handleCloseDetail = useCallback(() => {
    setSelectedCapability(null);
  }, []);

  return (
    <div className="flex h-full">
      {/* Tree Panel */}
      <div className="w-96 border-r border-gray-200 p-4 overflow-y-auto">
        <CapabilityTree
          key={refreshKey}
          onSelect={handleSelect}
          onAdd={handleAdd}
          selectedId={selectedCapability?.id}
        />
      </div>

      {/* Detail Panel */}
      <div className="flex-1 p-4 overflow-y-auto">
        {selectedCapability ? (
          <Card padding="none">
            <CardHeader
              title={selectedCapability.name}
              action={
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(selectedCapability)}
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
              <div className="flex gap-2 mb-4">
                <Badge
                  variant={
                    selectedCapability.type === 'Business' ? 'primary' : 'info'
                  }
                >
                  {selectedCapability.type}
                </Badge>
                <div
                  className="w-6 h-6 rounded-full border border-gray-200"
                  style={{
                    backgroundColor: selectedCapability.colour ?? '#6B7280',
                  }}
                />
              </div>

              {selectedCapability.description && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    Description
                  </h4>
                  <p className="text-sm text-gray-600">
                    {selectedCapability.description}
                  </p>
                </div>
              )}

              <CardSection title="Metadata">
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                  <div>
                    <span className="font-medium">Sort Order:</span>{' '}
                    {selectedCapability.sortOrder}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>{' '}
                    {new Date(selectedCapability.createdAt).toLocaleString()}
                  </div>
                </div>
              </CardSection>
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <Button variant="ghost" size="sm" onClick={handleCloseDetail}>
                Close
              </Button>
            </div>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Select a capability to view details</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <CapabilityForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSave}
        capability={editingCapability}
        parentId={parentIdForNew}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Capability"
        message={`Are you sure you want to delete "${selectedCapability?.name}"? This will also delete all child capabilities.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
