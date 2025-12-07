import { useCallback, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardSection,
  ConfirmModal,
  PriorityBadge,
  StatusBadge,
} from '../../components/ui';
import { initiatives as initiativesDb } from '../../lib/db';
import type { Initiative } from '../../lib/types';
import { useAppStore } from '../../stores/appStore';
import { ConstraintManager } from './ConstraintManager';
import { DependencyManager } from './DependencyManager';
import { InitiativeForm } from './InitiativeForm';
import { InitiativeList } from './InitiativeList';
import { ResourceRequirementManager } from './ResourceRequirementManager';

type DetailTab = 'details' | 'dependencies' | 'constraints' | 'resources';

export function InitiativesPage() {
  const activeScenarioId = useAppStore((state) => state.activeScenarioId);
  const [selectedInitiative, setSelectedInitiative] =
    useState<Initiative | null>(null);
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<DetailTab>('details');

  const handleSelect = useCallback((initiative: Initiative) => {
    setSelectedInitiative(initiative);
    setActiveTab('details');
  }, []);

  const handleAdd = useCallback(() => {
    setEditingInitiative(null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((initiative: Initiative) => {
    setEditingInitiative(initiative);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingInitiative(null);
  }, []);

  const handleSave = useCallback((initiative: Initiative) => {
    setIsFormOpen(false);
    setEditingInitiative(null);
    setSelectedInitiative(initiative);
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!selectedInitiative) return;

    try {
      setIsDeleting(true);
      await initiativesDb.delete(selectedInitiative.id);
      setSelectedInitiative(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to delete initiative:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [selectedInitiative]);

  const handleCloseDetail = useCallback(() => {
    setSelectedInitiative(null);
  }, []);

  return (
    <div className="flex h-full">
      {/* List Panel */}
      <div className="w-96 border-r border-gray-200 p-4 overflow-y-auto">
        <InitiativeList
          key={refreshKey}
          scenarioId={activeScenarioId}
          onSelect={handleSelect}
          onAdd={handleAdd}
          selectedId={selectedInitiative?.id}
        />
      </div>

      {/* Detail Panel */}
      <div className="flex-1 p-4 overflow-y-auto">
        {selectedInitiative ? (
          <Card padding="none">
            <CardHeader
              title={selectedInitiative.name}
              action={
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(selectedInitiative)}
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

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px px-4">
                {(
                  [
                    { id: 'details', label: 'Details' },
                    { id: 'dependencies', label: 'Dependencies' },
                    { id: 'constraints', label: 'Constraints' },
                    { id: 'resources', label: 'Resources' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-4 text-sm font-medium border-b-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-4">
              {activeTab === 'details' && (
                <>
                  <div className="flex gap-2 mb-4">
                    <StatusBadge status={selectedInitiative.status} />
                    <PriorityBadge priority={selectedInitiative.priority} />
                    <Badge variant="default">{selectedInitiative.type}</Badge>
                  </div>

                  {selectedInitiative.description && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        Description
                      </h4>
                      <p className="text-sm text-gray-600">
                        {selectedInitiative.description}
                      </p>
                    </div>
                  )}

                  {(selectedInitiative.startDate ||
                    selectedInitiative.endDate) && (
                    <CardSection title="Timeline">
                      <div className="grid grid-cols-2 gap-4">
                        {selectedInitiative.startDate && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 uppercase">
                              Start
                            </h4>
                            <p className="text-sm text-gray-900">
                              {new Date(
                                selectedInitiative.startDate,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {selectedInitiative.endDate && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 uppercase">
                              End
                            </h4>
                            <p className="text-sm text-gray-900">
                              {new Date(
                                selectedInitiative.endDate,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardSection>
                  )}

                  {(selectedInitiative.effortEstimate ||
                    selectedInitiative.costEstimate) && (
                    <CardSection title="Estimates">
                      <div className="grid grid-cols-2 gap-4">
                        {selectedInitiative.effortEstimate && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 uppercase">
                              Effort
                            </h4>
                            <p className="text-sm text-gray-900">
                              {selectedInitiative.effortEstimate} person-days
                              {selectedInitiative.effortUncertainty && (
                                <span className="text-gray-500 text-xs ml-1">
                                  ({selectedInitiative.effortUncertainty}{' '}
                                  uncertainty)
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                        {selectedInitiative.costEstimate && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 uppercase">
                              Cost
                            </h4>
                            <p className="text-sm text-gray-900">
                              ${selectedInitiative.costEstimate.toLocaleString()}
                              {selectedInitiative.costUncertainty && (
                                <span className="text-gray-500 text-xs ml-1">
                                  ({selectedInitiative.costUncertainty}{' '}
                                  uncertainty)
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardSection>
                  )}
                </>
              )}

              {activeTab === 'dependencies' && (
                <DependencyManager initiative={selectedInitiative} />
              )}

              {activeTab === 'constraints' && (
                <ConstraintManager initiative={selectedInitiative} />
              )}

              {activeTab === 'resources' && (
                <ResourceRequirementManager initiative={selectedInitiative} />
              )}
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <Button variant="ghost" size="sm" onClick={handleCloseDetail}>
                Close
              </Button>
            </div>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Select an initiative to view details</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <InitiativeForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSave}
        initiative={editingInitiative}
        scenarioId={activeScenarioId}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Initiative"
        message={`Are you sure you want to delete "${selectedInitiative?.name}"?`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
