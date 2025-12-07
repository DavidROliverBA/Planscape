// Constraint Manager - Link constraints to an initiative

import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  ConfirmModal,
  Input,
  Modal,
  Select,
  TextArea,
} from '../../components/ui';
import {
  constraints as constraintsDb,
  initiativeConstraints as linksDb,
} from '../../lib/db';
import type {
  Constraint,
  ConstraintType,
  Hardness,
  Initiative,
  InitiativeConstraint,
} from '../../lib/types';

interface ConstraintManagerProps {
  initiative: Initiative;
  onUpdate?: () => void;
}

const constraintTypeOptions = [
  { value: 'Deadline', label: 'Deadline' },
  { value: 'Budget', label: 'Budget' },
  { value: 'Resource', label: 'Resource' },
  { value: 'Dependency', label: 'Dependency' },
  { value: 'Compliance', label: 'Compliance' },
  { value: 'Other', label: 'Other' },
];

const hardnessOptions = [
  { value: 'Hard', label: 'Hard (Must comply)' },
  { value: 'Soft', label: 'Soft (Should comply)' },
];

export function ConstraintManager({
  initiative,
  onUpdate,
}: ConstraintManagerProps) {
  const [linkedConstraints, setLinkedConstraints] = useState<Constraint[]>([]);
  const [allConstraints, setAllConstraints] = useState<Constraint[]>([]);
  const [links, setLinks] = useState<InitiativeConstraint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [unlinkConfirm, setUnlinkConfirm] = useState<Constraint | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allC, initLinks] = await Promise.all([
        constraintsDb.getAll(),
        linksDb.getByInitiative(initiative.id),
      ]);
      setAllConstraints(allC);
      setLinks(initLinks);

      // Get linked constraints
      const linkedIds = initLinks.map((l) => l.constraintId);
      setLinkedConstraints(allC.filter((c) => linkedIds.includes(c.id)));
    } catch (error) {
      console.error('Failed to load constraints:', error);
    } finally {
      setIsLoading(false);
    }
  }, [initiative.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLink = async (constraintId: string) => {
    try {
      await linksDb.create({
        initiativeId: initiative.id,
        constraintId,
      });
      setIsLinkModalOpen(false);
      loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to link constraint:', error);
    }
  };

  const handleCreateAndLink = async (constraint: Omit<Constraint, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const created = await constraintsDb.create(constraint);
      await linksDb.create({
        initiativeId: initiative.id,
        constraintId: created.id,
      });
      setIsCreateModalOpen(false);
      loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to create constraint:', error);
    }
  };

  const handleUnlink = async () => {
    if (!unlinkConfirm) return;
    try {
      setIsUnlinking(true);
      const link = links.find((l) => l.constraintId === unlinkConfirm.id);
      if (link) {
        await linksDb.delete(link.id);
      }
      setUnlinkConfirm(null);
      loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to unlink constraint:', error);
    } finally {
      setIsUnlinking(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return <div className="text-sm text-gray-500 p-4">Loading...</div>;
  }

  const unlinkedConstraints = allConstraints.filter(
    (c) => !linkedConstraints.some((lc) => lc.id === c.id),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">
          Linked Constraints ({linkedConstraints.length})
        </h4>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsLinkModalOpen(true)}
            disabled={unlinkedConstraints.length === 0}
          >
            Link Existing
          </Button>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
            Create New
          </Button>
        </div>
      </div>

      {linkedConstraints.length === 0 ? (
        <p className="text-sm text-gray-500">No constraints linked</p>
      ) : (
        <div className="space-y-2">
          {linkedConstraints.map((constraint) => (
            <Card key={constraint.id} padding="sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {constraint.name}
                    </p>
                    <Badge
                      variant={
                        constraint.hardness === 'Hard' ? 'danger' : 'warning'
                      }
                      size="sm"
                    >
                      {constraint.hardness}
                    </Badge>
                    <Badge variant="default" size="sm">
                      {constraint.type}
                    </Badge>
                  </div>
                  {constraint.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {constraint.description}
                    </p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    {constraint.effectiveDate && (
                      <span>
                        {constraint.type === 'Deadline' ? 'Deadline' : 'Effective'}:{' '}
                        {formatDate(constraint.effectiveDate)}
                      </span>
                    )}
                    {constraint.expiryDate && (
                      <span>Expires: {formatDate(constraint.expiryDate)}</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUnlinkConfirm(constraint)}
                >
                  Unlink
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Link Existing Modal */}
      <LinkConstraintModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onLink={handleLink}
        constraints={unlinkedConstraints}
      />

      {/* Create New Modal */}
      <CreateConstraintModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateAndLink}
      />

      {/* Unlink Confirmation */}
      <ConfirmModal
        isOpen={!!unlinkConfirm}
        onClose={() => setUnlinkConfirm(null)}
        onConfirm={handleUnlink}
        title="Unlink Constraint"
        message={`Unlink "${unlinkConfirm?.name}" from this initiative?`}
        confirmText="Unlink"
        variant="danger"
        isLoading={isUnlinking}
      />
    </div>
  );
}

interface LinkConstraintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLink: (constraintId: string) => void;
  constraints: Constraint[];
}

function LinkConstraintModal({
  isOpen,
  onClose,
  onLink,
  constraints,
}: LinkConstraintModalProps) {
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedId('');
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Link Constraint"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onLink(selectedId)} disabled={!selectedId}>
            Link
          </Button>
        </>
      }
    >
      <Select
        label="Select Constraint"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        options={constraints.map((c) => ({
          value: c.id,
          label: `${c.name} (${c.type}, ${c.hardness})`,
        }))}
        placeholder="Choose a constraint..."
      />
    </Modal>
  );
}

interface CreateConstraintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (constraint: Omit<Constraint, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

function CreateConstraintModal({
  isOpen,
  onClose,
  onCreate,
}: CreateConstraintModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ConstraintType>('Deadline');
  const [hardness, setHardness] = useState<Hardness>('Hard');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setType('Deadline');
      setHardness('Hard');
      setEffectiveDate('');
      setExpiryDate('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsSubmitting(true);
    try {
      await onCreate({
        name,
        description: description || undefined,
        type,
        hardness,
        effectiveDate: effectiveDate || undefined,
        expiryDate: expiryDate || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Constraint"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!name}
          >
            Create & Link
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
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value as ConstraintType)}
            options={constraintTypeOptions}
          />

          <Select
            label="Hardness"
            value={hardness}
            onChange={(e) => setHardness(e.target.value as Hardness)}
            options={hardnessOptions}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'Deadline' ? 'Deadline Date' : 'Effective Date'}
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {type !== 'Deadline' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
