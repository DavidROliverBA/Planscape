import { useEffect, useState } from 'react';
import { Button, Input, Modal, Select, TextArea } from '../../components/ui';
import { systems as systemsDb } from '../../lib/db';
import type { Criticality, LifecycleStage, System } from '../../lib/types';

interface SystemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (system: System) => void;
  system?: System | null;
}

const lifecycleOptions = [
  { value: 'Discovery', label: 'Discovery' },
  { value: 'Development', label: 'Development' },
  { value: 'Production', label: 'Production' },
  { value: 'Sunset', label: 'Sunset' },
  { value: 'Retired', label: 'Retired' },
];

const criticalityOptions = [
  { value: 'Critical', label: 'Critical' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
];

export function SystemForm({
  isOpen,
  onClose,
  onSave,
  system,
}: SystemFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('');
  const [vendor, setVendor] = useState('');
  const [technologyStack, setTechnologyStack] = useState('');
  const [lifecycleStage, setLifecycleStage] =
    useState<LifecycleStage>('Development');
  const [criticality, setCriticality] = useState<Criticality>('Medium');
  const [supportEndDate, setSupportEndDate] = useState('');
  const [extendedSupportEndDate, setExtendedSupportEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(system);

  useEffect(() => {
    if (system) {
      setName(system.name);
      setDescription(system.description ?? '');
      setOwner(system.owner ?? '');
      setVendor(system.vendor ?? '');
      setTechnologyStack(system.technologyStack?.join(', ') ?? '');
      setLifecycleStage(system.lifecycleStage);
      setCriticality(system.criticality);
      setSupportEndDate(system.supportEndDate ?? '');
      setExtendedSupportEndDate(system.extendedSupportEndDate ?? '');
    } else {
      resetForm();
    }
  }, [system]);

  function resetForm() {
    setName('');
    setDescription('');
    setOwner('');
    setVendor('');
    setTechnologyStack('');
    setLifecycleStage('Development');
    setCriticality('Medium');
    setSupportEndDate('');
    setExtendedSupportEndDate('');
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

      const techStackArray = technologyStack
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const systemData = {
        name: name.trim(),
        description: description.trim() || undefined,
        owner: owner.trim() || undefined,
        vendor: vendor.trim() || undefined,
        technologyStack: techStackArray.length > 0 ? techStackArray : undefined,
        lifecycleStage,
        criticality,
        supportEndDate: supportEndDate || undefined,
        extendedSupportEndDate: extendedSupportEndDate || undefined,
      };

      let savedSystem: System;
      if (isEditing && system) {
        savedSystem = (await systemsDb.update(system.id, systemData)) as System;
      } else {
        savedSystem = await systemsDb.create(systemData);
      }

      onSave(savedSystem);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save system');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit System' : 'Add System'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create System'}
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
          placeholder="Enter system name"
          required
        />

        <TextArea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the system's purpose and functionality"
          rows={2}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Owner"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="System owner or team"
          />
          <Input
            label="Vendor"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Vendor name (if applicable)"
          />
        </div>

        <Input
          label="Technology Stack"
          value={technologyStack}
          onChange={(e) => setTechnologyStack(e.target.value)}
          placeholder="React, Node.js, PostgreSQL (comma-separated)"
          hint="Enter technologies separated by commas"
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Lifecycle Stage"
            value={lifecycleStage}
            onChange={(e) =>
              setLifecycleStage(e.target.value as LifecycleStage)
            }
            options={lifecycleOptions}
            required
          />
          <Select
            label="Criticality"
            value={criticality}
            onChange={(e) => setCriticality(e.target.value as Criticality)}
            options={criticalityOptions}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Support End Date"
            type="date"
            value={supportEndDate}
            onChange={(e) => setSupportEndDate(e.target.value)}
          />
          <Input
            label="Extended Support End Date"
            type="date"
            value={extendedSupportEndDate}
            onChange={(e) => setExtendedSupportEndDate(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
