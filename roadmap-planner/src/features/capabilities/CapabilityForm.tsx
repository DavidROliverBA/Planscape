import { useEffect, useState } from 'react';
import { Button, Input, Modal, Select, TextArea } from '../../components/ui';
import { capabilities as capabilitiesDb } from '../../lib/db';
import type { Capability, CapabilityType } from '../../lib/types';

interface CapabilityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (capability: Capability) => void;
  capability?: Capability | null;
  parentId?: string | null;
}

const typeOptions = [
  { value: 'Business', label: 'Business Capability' },
  { value: 'Technical', label: 'Technical Capability' },
];

const colorOptions = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#6366F1', label: 'Indigo' },
  { value: '#6B7280', label: 'Gray' },
];

export function CapabilityForm({
  isOpen,
  onClose,
  onSave,
  capability,
  parentId,
}: CapabilityFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CapabilityType>('Business');
  const [colour, setColour] = useState('#3B82F6');
  const [sortOrder, setSortOrder] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(capability);

  useEffect(() => {
    if (capability) {
      setName(capability.name);
      setDescription(capability.description ?? '');
      setType(capability.type);
      setColour(capability.colour ?? '#3B82F6');
      setSortOrder(capability.sortOrder);
    } else {
      resetForm();
    }
  }, [capability]);

  function resetForm() {
    setName('');
    setDescription('');
    setType('Business');
    setColour('#3B82F6');
    setSortOrder(0);
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

      const capabilityData = {
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        colour,
        sortOrder,
        parentId: capability?.parentId ?? parentId ?? undefined,
      };

      let savedCapability: Capability;
      if (isEditing && capability) {
        savedCapability = (await capabilitiesDb.update(
          capability.id,
          capabilityData,
        )) as Capability;
      } else {
        savedCapability = await capabilitiesDb.create(capabilityData);
      }

      onSave(savedCapability);
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save capability',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? 'Edit Capability'
          : parentId
            ? 'Add Child Capability'
            : 'Add Capability'
      }
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create Capability'}
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
          placeholder="Enter capability name"
          required
        />

        <TextArea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this capability represents"
          rows={2}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value as CapabilityType)}
            options={typeOptions}
            required
          />

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-1">
              Colour
            </span>
            <div
              className="flex gap-2 flex-wrap"
              role="radiogroup"
              aria-label="Select colour"
            >
              {colorOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`w-6 h-6 rounded-full border-2 ${
                    colour === opt.value
                      ? 'border-gray-900'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: opt.value }}
                  onClick={() => setColour(opt.value)}
                  title={opt.label}
                />
              ))}
            </div>
          </div>
        </div>

        <Input
          label="Sort Order"
          type="number"
          value={sortOrder.toString()}
          onChange={(e) =>
            setSortOrder(Number.parseInt(e.target.value, 10) || 0)
          }
          hint="Lower numbers appear first"
        />
      </form>
    </Modal>
  );
}
