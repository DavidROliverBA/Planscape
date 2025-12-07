import { useCallback, useState } from 'react';
import type { System } from '../../lib/types';
import { SystemDetail } from './SystemDetail';
import { SystemForm } from './SystemForm';
import { SystemList } from './SystemList';

export function SystemsPage() {
  const [selectedSystem, setSelectedSystem] = useState<System | null>(null);
  const [editingSystem, setEditingSystem] = useState<System | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelect = useCallback((system: System) => {
    setSelectedSystem(system);
  }, []);

  const handleAdd = useCallback(() => {
    setEditingSystem(null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((system: System) => {
    setEditingSystem(system);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingSystem(null);
  }, []);

  const handleSave = useCallback((system: System) => {
    setIsFormOpen(false);
    setEditingSystem(null);
    setSelectedSystem(system);
    // Trigger list refresh
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleDelete = useCallback(
    (systemId: string) => {
      if (selectedSystem?.id === systemId) {
        setSelectedSystem(null);
      }
      // Trigger list refresh
      setRefreshKey((prev) => prev + 1);
    },
    [selectedSystem],
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedSystem(null);
  }, []);

  return (
    <div className="flex h-full">
      {/* List Panel */}
      <div className="w-80 border-r border-gray-200 p-4 overflow-y-auto">
        <SystemList
          key={refreshKey}
          onSelect={handleSelect}
          onAdd={handleAdd}
          selectedId={selectedSystem?.id}
        />
      </div>

      {/* Detail Panel */}
      <div className="flex-1 p-4 overflow-y-auto">
        {selectedSystem ? (
          <SystemDetail
            system={selectedSystem}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onClose={handleCloseDetail}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Select a system to view details</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <SystemForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSave}
        system={editingSystem}
      />
    </div>
  );
}
