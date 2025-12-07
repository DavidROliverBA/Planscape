import { addMonths, parseDate } from '@/lib/dateUtils';
import type { Capability, Initiative } from '@/lib/types';
import { useAppStore } from '@/stores/appStore';
import { useMemo } from 'react';

export interface TimelineInitiative extends Initiative {
  startDateObj: Date;
  endDateObj: Date;
  capabilityId?: string;
  capabilityName?: string;
}

export interface CapabilitySwimlane {
  capability: Capability | null; // null for "Unassigned"
  initiatives: TimelineInitiative[];
  isCollapsed: boolean;
}

export interface TimelineData {
  swimlanes: CapabilitySwimlane[];
  timeRange: {
    start: Date;
    end: Date;
  };
  totalInitiatives: number;
}

/**
 * Hook to prepare data for timeline rendering
 * Groups initiatives by capability and calculates visible time range
 */
export function useTimelineData(): TimelineData {
  const { capabilities, initiatives, activeScenarioId } = useAppStore();

  return useMemo(() => {
    // Filter initiatives for the active scenario that have dates
    const scenarioInitiatives = initiatives.filter(
      (i) =>
        i.scenarioId === activeScenarioId &&
        i.startDate &&
        i.endDate &&
        i.status !== 'Cancelled',
    );

    // Convert initiatives to timeline format with parsed dates
    const timelineInitiatives: TimelineInitiative[] = scenarioInitiatives.map(
      (initiative) => ({
        ...initiative,
        startDateObj: parseDate(initiative.startDate!),
        endDateObj: parseDate(initiative.endDate!),
      }),
    );

    // Calculate the time range based on initiative dates
    let minDate = new Date();
    let maxDate = addMonths(new Date(), 12); // Default to 1 year from now

    if (timelineInitiatives.length > 0) {
      minDate = new Date(
        Math.min(...timelineInitiatives.map((i) => i.startDateObj.getTime())),
      );
      maxDate = new Date(
        Math.max(...timelineInitiatives.map((i) => i.endDateObj.getTime())),
      );

      // Add padding: 1 month before and after
      minDate = addMonths(minDate, -1);
      maxDate = addMonths(maxDate, 1);
    }

    // Build a map of capability IDs to their initiatives
    const capabilityMap = new Map<string | null, TimelineInitiative[]>();

    // Initialize with all capabilities
    for (const cap of capabilities) {
      capabilityMap.set(cap.id, []);
    }
    capabilityMap.set(null, []); // Unassigned

    // Group initiatives by capability
    // Note: We'll need to look up the capability through system relationships
    // For now, initiatives without a clear capability go to "Unassigned"
    for (const initiative of timelineInitiatives) {
      // TODO: In a future update, we could trace initiative -> system -> capability
      // For now, we'll put all initiatives in "Unassigned" unless we add a capabilityId to Initiative
      const unassigned = capabilityMap.get(null) ?? [];
      unassigned.push(initiative);
      capabilityMap.set(null, unassigned);
    }

    // Build swimlanes sorted by capability sort order
    const sortedCapabilities = [...capabilities].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );

    const swimlanes: CapabilitySwimlane[] = [];

    // Add capabilities that have initiatives
    for (const capability of sortedCapabilities) {
      const capInitiatives = capabilityMap.get(capability.id) ?? [];
      if (capInitiatives.length > 0) {
        swimlanes.push({
          capability,
          initiatives: capInitiatives.sort(
            (a, b) => a.startDateObj.getTime() - b.startDateObj.getTime(),
          ),
          isCollapsed: false,
        });
      }
    }

    // Add "Unassigned" swimlane if there are unassigned initiatives
    const unassignedInitiatives = capabilityMap.get(null) ?? [];
    if (unassignedInitiatives.length > 0) {
      swimlanes.push({
        capability: null,
        initiatives: unassignedInitiatives.sort(
          (a, b) => a.startDateObj.getTime() - b.startDateObj.getTime(),
        ),
        isCollapsed: false,
      });
    }

    return {
      swimlanes,
      timeRange: {
        start: minDate,
        end: maxDate,
      },
      totalInitiatives: timelineInitiatives.length,
    };
  }, [capabilities, initiatives, activeScenarioId]);
}

/**
 * Hook to get all initiatives for the active scenario (including cancelled)
 */
export function useAllScenarioInitiatives(): Initiative[] {
  const { initiatives, activeScenarioId } = useAppStore();

  return useMemo(
    () => initiatives.filter((i) => i.scenarioId === activeScenarioId),
    [initiatives, activeScenarioId],
  );
}
