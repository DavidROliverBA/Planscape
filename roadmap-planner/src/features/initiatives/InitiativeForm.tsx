import { useEffect, useState } from 'react';
import { Button, Input, Modal, Select, TextArea } from '../../components/ui';
import { initiatives as initiativesDb } from '../../lib/db';
import type {
  Initiative,
  InitiativeStatus,
  InitiativeType,
  Priority,
  Uncertainty,
} from '../../lib/types';

interface InitiativeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (initiative: Initiative) => void;
  initiative?: Initiative | null;
  scenarioId: string;
}

const typeOptions = [
  { value: 'New', label: 'New Development' },
  { value: 'Upgrade', label: 'Upgrade' },
  { value: 'Replacement', label: 'Replacement' },
  { value: 'Migration', label: 'Migration' },
  { value: 'Decommission', label: 'Decommission' },
];

const statusOptions = [
  { value: 'Proposed', label: 'Proposed' },
  { value: 'Planned', label: 'Planned' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'Complete', label: 'Complete' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const priorityOptions = [
  { value: 'Must', label: 'Must Have' },
  { value: 'Should', label: 'Should Have' },
  { value: 'Could', label: 'Could Have' },
  { value: 'Wont', label: "Won't Have" },
];

const uncertaintyOptions = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
];

export function InitiativeForm({
  isOpen,
  onClose,
  onSave,
  initiative,
  scenarioId,
}: InitiativeFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<InitiativeType>('New');
  const [status, setStatus] = useState<InitiativeStatus>('Proposed');
  const [priority, setPriority] = useState<Priority>('Should');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [effortEstimate, setEffortEstimate] = useState('');
  const [effortUncertainty, setEffortUncertainty] =
    useState<Uncertainty>('Medium');
  const [costEstimate, setCostEstimate] = useState('');
  const [costUncertainty, setCostUncertainty] = useState<Uncertainty>('Medium');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(initiative);

  useEffect(() => {
    if (initiative) {
      setName(initiative.name);
      setDescription(initiative.description ?? '');
      setType(initiative.type);
      setStatus(initiative.status);
      setPriority(initiative.priority);
      setStartDate(initiative.startDate ?? '');
      setEndDate(initiative.endDate ?? '');
      setEffortEstimate(initiative.effortEstimate?.toString() ?? '');
      setEffortUncertainty(initiative.effortUncertainty ?? 'Medium');
      setCostEstimate(initiative.costEstimate?.toString() ?? '');
      setCostUncertainty(initiative.costUncertainty ?? 'Medium');
    } else {
      resetForm();
    }
  }, [initiative]);

  function resetForm() {
    setName('');
    setDescription('');
    setType('New');
    setStatus('Proposed');
    setPriority('Should');
    setStartDate('');
    setEndDate('');
    setEffortEstimate('');
    setEffortUncertainty('Medium');
    setCostEstimate('');
    setCostUncertainty('Medium');
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const initiativeData = {
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        status,
        priority,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        effortEstimate: effortEstimate
          ? Number.parseFloat(effortEstimate)
          : undefined,
        effortUncertainty: effortEstimate ? effortUncertainty : undefined,
        costEstimate: costEstimate
          ? Number.parseFloat(costEstimate)
          : undefined,
        costUncertainty: costEstimate ? costUncertainty : undefined,
        scenarioId,
      };

      let savedInitiative: Initiative;
      if (isEditing && initiative) {
        savedInitiative = (await initiativesDb.update(
          initiative.id,
          initiativeData,
        )) as Initiative;
      } else {
        savedInitiative = await initiativesDb.create(initiativeData);
      }

      onSave(savedInitiative);
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save initiative',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Initiative' : 'Add Initiative'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create Initiative'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter initiative name"
          required
        />

        <TextArea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the initiative"
          rows={2}
        />

        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value as InitiativeType)}
            options={typeOptions}
            required
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as InitiativeStatus)}
            options={statusOptions}
            required
          />
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            options={priorityOptions}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Input
              label="Effort Estimate (person-days)"
              type="number"
              value={effortEstimate}
              onChange={(e) => setEffortEstimate(e.target.value)}
              placeholder="0"
            />
            {effortEstimate && (
              <Select
                label="Uncertainty"
                value={effortUncertainty}
                onChange={(e) =>
                  setEffortUncertainty(e.target.value as Uncertainty)
                }
                options={uncertaintyOptions}
              />
            )}
          </div>
          <div className="space-y-2">
            <Input
              label="Cost Estimate"
              type="number"
              value={costEstimate}
              onChange={(e) => setCostEstimate(e.target.value)}
              placeholder="0"
            />
            {costEstimate && (
              <Select
                label="Uncertainty"
                value={costUncertainty}
                onChange={(e) =>
                  setCostUncertainty(e.target.value as Uncertainty)
                }
                options={uncertaintyOptions}
              />
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
