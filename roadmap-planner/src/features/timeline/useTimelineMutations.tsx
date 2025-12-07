import { useToast } from '@/components/ui';
import { formatDate } from '@/lib/dateUtils';
import { initiatives as initiativesDb } from '@/lib/db';
import { mutationLogger as log } from '@/lib/logger';
import { useAppStore } from '@/stores/appStore';
import { useCallback } from 'react';

export function useTimelineMutations() {
  const { initiatives, setInitiatives } = useAppStore();
  const { addToast } = useToast();

  /**
   * Move an initiative to new dates
   */
  const moveInitiative = useCallback(
    async (initiativeId: string, newStartDate: Date, newEndDate: Date) => {
      log.info('moveInitiative called', {
        initiativeId,
        newStartDate: newStartDate.toISOString(),
        newEndDate: newEndDate.toISOString(),
      });

      // Find the initiative
      const initiative = initiatives.find((i) => i.id === initiativeId);
      if (!initiative) {
        log.error('Initiative not found', { initiativeId, availableIds: initiatives.map(i => i.id) });
        addToast({ title: 'Initiative not found', type: 'error' });
        return;
      }

      log.debug('Found initiative', {
        id: initiative.id,
        name: initiative.name,
        currentStartDate: initiative.startDate,
        currentEndDate: initiative.endDate,
      });

      // Store original dates for rollback
      const originalStartDate = initiative.startDate;
      const originalEndDate = initiative.endDate;

      const newStartDateFormatted = formatDate(newStartDate, 'iso');
      const newEndDateFormatted = formatDate(newEndDate, 'iso');

      log.debug('Formatted dates', {
        newStartDateFormatted,
        newEndDateFormatted,
      });

      // Optimistically update the store
      const updatedInitiatives = initiatives.map((i) =>
        i.id === initiativeId
          ? {
              ...i,
              startDate: newStartDateFormatted,
              endDate: newEndDateFormatted,
              updatedAt: new Date().toISOString(),
            }
          : i,
      );
      setInitiatives(updatedInitiatives);
      log.debug('Optimistic update applied to store');

      try {
        // Update in database
        log.info('Calling initiativesDb.update', {
          initiativeId,
          updateData: {
            startDate: newStartDateFormatted,
            endDate: newEndDateFormatted,
          },
        });

        const result = await initiativesDb.update(initiativeId, {
          startDate: newStartDateFormatted,
          endDate: newEndDateFormatted,
        });

        log.info('Database update successful', { result });

        addToast({
          title: `Moved "${initiative.name}"`,
          message: `New start: ${formatDate(newStartDate, 'medium')}`,
          type: 'success',
        });
      } catch (error) {
        log.error('Database update failed', {
          initiativeId,
          error: error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack }
            : String(error),
        });

        // Rollback on error
        const rolledBackInitiatives = initiatives.map((i) =>
          i.id === initiativeId
            ? {
                ...i,
                startDate: originalStartDate,
                endDate: originalEndDate,
              }
            : i,
        );
        setInitiatives(rolledBackInitiatives);
        log.debug('Rollback applied');

        addToast({
          title: 'Failed to move initiative',
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'error',
        });
      }
    },
    [initiatives, setInitiatives, addToast],
  );

  /**
   * Resize an initiative (change start or end date)
   */
  const resizeInitiative = useCallback(
    async (
      initiativeId: string,
      newStartDate: Date | null,
      newEndDate: Date | null,
    ) => {
      log.info('resizeInitiative called', {
        initiativeId,
        newStartDate: newStartDate?.toISOString() ?? null,
        newEndDate: newEndDate?.toISOString() ?? null,
      });

      const initiative = initiatives.find((i) => i.id === initiativeId);
      if (!initiative) {
        log.error('Initiative not found', { initiativeId });
        addToast({ title: 'Initiative not found', type: 'error' });
        return;
      }

      log.debug('Found initiative for resize', {
        id: initiative.id,
        name: initiative.name,
        currentStartDate: initiative.startDate,
        currentEndDate: initiative.endDate,
      });

      const originalStartDate = initiative.startDate;
      const originalEndDate = initiative.endDate;

      const updateData: { startDate?: string; endDate?: string } = {};
      if (newStartDate) {
        updateData.startDate = formatDate(newStartDate, 'iso');
      }
      if (newEndDate) {
        updateData.endDate = formatDate(newEndDate, 'iso');
      }

      log.debug('Update data prepared', { updateData });

      // Optimistically update
      const updatedInitiatives = initiatives.map((i) =>
        i.id === initiativeId
          ? {
              ...i,
              ...updateData,
              updatedAt: new Date().toISOString(),
            }
          : i,
      );
      setInitiatives(updatedInitiatives);
      log.debug('Optimistic update applied');

      try {
        log.info('Calling initiativesDb.update for resize', {
          initiativeId,
          updateData,
        });

        const result = await initiativesDb.update(initiativeId, updateData);
        log.info('Resize database update successful', { result });

        addToast({
          title: `Updated "${initiative.name}"`,
          type: 'success',
        });
      } catch (error) {
        log.error('Resize database update failed', {
          initiativeId,
          error: error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack }
            : String(error),
        });

        // Rollback
        const rolledBackInitiatives = initiatives.map((i) =>
          i.id === initiativeId
            ? {
                ...i,
                startDate: originalStartDate,
                endDate: originalEndDate,
              }
            : i,
        );
        setInitiatives(rolledBackInitiatives);
        log.debug('Resize rollback applied');

        addToast({
          title: 'Failed to resize initiative',
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'error',
        });
      }
    },
    [initiatives, setInitiatives, addToast],
  );

  return {
    moveInitiative,
    resizeInitiative,
  };
}
