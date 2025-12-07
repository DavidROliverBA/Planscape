import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmModal,
  Input,
  LoadingInline,
  Modal,
  Select,
  TextArea,
} from '../../components/ui';
import { scenarios as scenariosDb } from '../../lib/db';
import type { Scenario, ScenarioType } from '../../lib/types';
import { useAppStore } from '../../stores/appStore';

const scenarioTypeOptions = [
  { value: 'Timing', label: 'Timing Variation' },
  { value: 'Budget', label: 'Budget Variation' },
  { value: 'Resource', label: 'Resource Variation' },
  { value: 'Scope', label: 'Scope Variation' },
  { value: 'Risk', label: 'Risk Analysis' },
];

export function ScenariosPage() {
  const { activeScenarioId, setActiveScenario } = useAppStore();
  const [scenariosList, setScenariosList] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState<Scenario | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const loadScenarios = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await scenariosDb.getAll();
      setScenariosList(data);
    } catch (error) {
      console.error('Failed to load scenarios:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  const handleAdd = () => {
    setEditingScenario(null);
    setIsFormOpen(true);
  };

  const handleEdit = (scenario: Scenario) => {
    setEditingScenario(scenario);
    setIsFormOpen(true);
  };

  const handleSave = () => {
    setIsFormOpen(false);
    setEditingScenario(null);
    loadScenarios();
  };

  const handleDeleteClick = (scenario: Scenario) => {
    setScenarioToDelete(scenario);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!scenarioToDelete) return;
    try {
      setIsDeleting(true);
      await scenariosDb.delete(scenarioToDelete.id);
      if (activeScenarioId === scenarioToDelete.id) {
        setActiveScenario('baseline');
      }
      loadScenarios();
    } catch (error) {
      console.error('Failed to delete scenario:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setScenarioToDelete(null);
    }
  };

  if (isLoading) {
    return <LoadingInline message="Loading scenarios..." />;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scenarios</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create what-if scenarios to explore different planning options
          </p>
        </div>
        <Button onClick={handleAdd}>Create Scenario</Button>
      </div>

      <div className="grid gap-4">
        {scenariosList.map((scenario) => (
          <Card key={scenario.id} padding="none">
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  {scenario.name}
                  {scenario.isBaseline && (
                    <Badge variant="primary" size="sm">
                      Baseline
                    </Badge>
                  )}
                  {activeScenarioId === scenario.id && (
                    <Badge variant="success" size="sm">
                      Active
                    </Badge>
                  )}
                </div>
              }
              subtitle={scenario.type ? `Type: ${scenario.type}` : undefined}
              action={
                <div className="flex gap-2">
                  {activeScenarioId !== scenario.id && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveScenario(scenario.id)}
                    >
                      Activate
                    </Button>
                  )}
                  {!scenario.isBaseline && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(scenario)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteClick(scenario)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              }
            />
            {scenario.description && (
              <div className="px-4 pb-4">
                <p className="text-sm text-gray-600">{scenario.description}</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Form Modal */}
      <ScenarioForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
        scenario={editingScenario}
        scenarios={scenariosList}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Scenario"
        message={`Are you sure you want to delete "${scenarioToDelete?.name}"? All initiatives in this scenario will be deleted.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

interface ScenarioFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  scenario?: Scenario | null;
  scenarios: Scenario[];
}

function ScenarioForm({
  isOpen,
  onClose,
  onSave,
  scenario,
  scenarios,
}: ScenarioFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ScenarioType | ''>('');
  const [parentScenarioId, setParentScenarioId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (scenario) {
      setName(scenario.name);
      setDescription(scenario.description ?? '');
      setType(scenario.type ?? '');
      setParentScenarioId(scenario.parentScenarioId ?? '');
    } else {
      setName('');
      setDescription('');
      setType('');
      setParentScenarioId('baseline');
    }
  }, [scenario]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsLoading(true);
      const data = {
        name,
        description: description || undefined,
        type: type || undefined,
        isBaseline: false,
        parentScenarioId: parentScenarioId || undefined,
      };
      if (scenario) {
        await scenariosDb.update(scenario.id, data);
      } else {
        await scenariosDb.create(data);
      }
      onSave();
    } finally {
      setIsLoading(false);
    }
  }

  const parentOptions = scenarios
    .filter((s) => s.id !== scenario?.id)
    .map((s) => ({ value: s.id, label: s.name }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={scenario ? 'Edit Scenario' : 'Create Scenario'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            {scenario ? 'Save' : 'Create'}
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
        <Select
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value as ScenarioType)}
          options={scenarioTypeOptions}
          placeholder="Select scenario type"
        />
        <Select
          label="Based On"
          value={parentScenarioId}
          onChange={(e) => setParentScenarioId(e.target.value)}
          options={parentOptions}
          placeholder="Select parent scenario"
        />
      </form>
    </Modal>
  );
}
