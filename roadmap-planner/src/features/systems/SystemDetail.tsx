import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardSection,
  ConfirmModal,
  CriticalityBadge,
  LifecycleBadge,
} from '../../components/ui';
import { systems as systemsDb } from '../../lib/db';
import type { System } from '../../lib/types';

interface SystemDetailProps {
  system: System;
  onEdit: (system: System) => void;
  onDelete: (systemId: string) => void;
  onClose: () => void;
}

export function SystemDetail({
  system,
  onEdit,
  onDelete,
  onClose,
}: SystemDetailProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleDelete() {
    try {
      setIsDeleting(true);
      await systemsDb.delete(system.id);
      onDelete(system.id);
    } catch (error) {
      console.error('Failed to delete system:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <>
      <Card padding="none">
        <CardHeader
          title={system.name}
          subtitle={system.vendor ? `Vendor: ${system.vendor}` : undefined}
          action={
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onEdit(system)}
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
          {/* Status Badges */}
          <div className="flex gap-2 mb-4">
            <LifecycleBadge stage={system.lifecycleStage} />
            <CriticalityBadge criticality={system.criticality} />
          </div>

          {/* Description */}
          {system.description && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-1">
                Description
              </h4>
              <p className="text-sm text-gray-600">{system.description}</p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {system.owner && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Owner
                </h4>
                <p className="text-sm text-gray-900 mt-1">{system.owner}</p>
              </div>
            )}
            {system.vendor && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Vendor
                </h4>
                <p className="text-sm text-gray-900 mt-1">{system.vendor}</p>
              </div>
            )}
          </div>

          {/* Technology Stack */}
          {system.technologyStack && system.technologyStack.length > 0 && (
            <CardSection title="Technology Stack">
              <div className="flex flex-wrap gap-1">
                {system.technologyStack.map((tech) => (
                  <Badge key={tech} variant="info" size="sm">
                    {tech}
                  </Badge>
                ))}
              </div>
            </CardSection>
          )}

          {/* Support Dates */}
          {(system.supportEndDate || system.extendedSupportEndDate) && (
            <CardSection title="Support Dates">
              <div className="grid grid-cols-2 gap-4">
                {system.supportEndDate && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Support End
                    </h4>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(system.supportEndDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {system.extendedSupportEndDate && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Extended Support End
                    </h4>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(
                        system.extendedSupportEndDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardSection>
          )}

          {/* Metadata */}
          <CardSection title="Metadata">
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                <span className="font-medium">Created:</span>{' '}
                {new Date(system.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Updated:</span>{' '}
                {new Date(system.updatedAt).toLocaleString()}
              </div>
            </div>
          </CardSection>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete System"
        message={`Are you sure you want to delete "${system.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
