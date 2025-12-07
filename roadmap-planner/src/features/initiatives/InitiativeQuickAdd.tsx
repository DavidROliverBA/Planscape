// InitiativeQuickAdd - Quick add form for rapid initiative creation

import { useCallback, useState } from 'react';
import { QuickAddForm, type QuickAddField } from '@/components/ui';
import { initiatives as initiativesDb } from '@/lib/db';
import type { Initiative, InitiativeType, Priority } from '@/lib/types';

interface InitiativeQuickAddProps {
  scenarioId: string;
  onSuccess: (initiative: Initiative) => void;
  onCancel: () => void;
}

const typeOptions: { value: InitiativeType; label: string }[] = [
  { value: 'New', label: 'New' },
  { value: 'Upgrade', label: 'Upgrade' },
  { value: 'Migration', label: 'Migration' },
  { value: 'Decommission', label: 'Decommission' },
  { value: 'Replacement', label: 'Replacement' },
];

const priorityOptions: { value: Priority; label: string }[] = [
  { value: 'Must', label: 'Must Have' },
  { value: 'Should', label: 'Should Have' },
  { value: 'Could', label: 'Could Have' },
  { value: 'Wont', label: "Won't Have" },
];

// Generate quarter options for the next 3 years
function getQuarterOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);

  for (let yearOffset = 0; yearOffset < 3; yearOffset++) {
    const year = currentYear + yearOffset;
    for (let quarter = yearOffset === 0 ? currentQuarter : 1; quarter <= 4; quarter++) {
      const quarterStart = new Date(year, (quarter - 1) * 3, 1);
      const value = quarterStart.toISOString().split('T')[0];
      options.push({
        value,
        label: `Q${quarter} ${year}`,
      });
    }
  }

  return options;
}

export function InitiativeQuickAdd({
  scenarioId,
  onSuccess,
  onCancel,
}: InitiativeQuickAddProps) {
  const [isLoading, setIsLoading] = useState(false);

  const quarterOptions = getQuarterOptions();

  const fields: QuickAddField[] = [
    {
      name: 'name',
      type: 'text',
      label: 'Name',
      placeholder: 'Initiative name',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      label: 'Type',
      options: typeOptions,
      required: true,
      defaultValue: 'New',
    },
    {
      name: 'priority',
      type: 'select',
      label: 'Priority',
      options: priorityOptions,
      required: true,
      defaultValue: 'Should',
    },
    {
      name: 'startQuarter',
      type: 'select',
      label: 'Start Quarter',
      options: quarterOptions,
    },
    {
      name: 'endQuarter',
      type: 'select',
      label: 'End Quarter',
      options: quarterOptions,
    },
    {
      name: 'costEstimate',
      type: 'number',
      label: 'Rough Cost ($)',
      placeholder: '0',
      min: 0,
      step: 1000,
    },
  ];

  const handleSubmit = useCallback(
    async (values: Record<string, string | number>) => {
      setIsLoading(true);

      try {
        // Calculate end date from quarter (end of quarter)
        let endDate: string | undefined;
        if (values.endQuarter && typeof values.endQuarter === 'string') {
          const date = new Date(values.endQuarter);
          // Move to end of quarter (last day of the 3rd month)
          date.setMonth(date.getMonth() + 3);
          date.setDate(0); // Last day of previous month
          endDate = date.toISOString().split('T')[0];
        }

        const initiative = await initiativesDb.create({
          name: values.name as string,
          scenarioId,
          type: (values.type as InitiativeType) || 'New',
          status: 'Proposed',
          priority: (values.priority as Priority) || 'Should',
          startDate: (values.startQuarter as string) || undefined,
          endDate,
          costEstimate: values.costEstimate
            ? Number(values.costEstimate)
            : undefined,
        });

        onSuccess(initiative);
      } catch (error) {
        console.error('Failed to create initiative:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [scenarioId, onSuccess]
  );

  return (
    <QuickAddForm
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      submitLabel="Create Initiative"
      allowAddAnother={true}
      isLoading={isLoading}
    />
  );
}
