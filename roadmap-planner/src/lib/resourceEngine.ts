// Resource Engine - Calculates resource allocation and conflicts
// Pure functions for testability and memoization

import type {
  Initiative,
  InitiativeResourceRequirement,
  PeriodType,
  ResourcePool,
} from './types';

export interface ResourceAllocation {
  poolId: string;
  poolName: string;
  periodStart: Date;
  periodEnd: Date;
  demand: number;
  capacity: number;
  utilisation: number; // demand / capacity as percentage
}

export interface ResourceConflict {
  type: 'resource';
  poolId: string;
  poolName: string;
  periodStart: Date;
  periodEnd: Date;
  demand: number;
  capacity: number;
  overAllocation: number; // How much over capacity
  utilisationPercent: number;
  contributingInitiatives: { id: string; name: string; effort: number }[];
}

/**
 * Generate time periods between two dates
 */
function generatePeriods(
  startDate: Date,
  endDate: Date,
  periodType: PeriodType,
): { start: Date; end: Date }[] {
  const periods: { start: Date; end: Date }[] = [];
  let current = new Date(startDate);

  while (current < endDate) {
    const periodStart = new Date(current);
    let periodEnd: Date;

    switch (periodType) {
      case 'Month':
        periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 1);
        current = periodEnd;
        break;

      case 'Quarter':
        const quarterMonth = Math.floor(current.getMonth() / 3) * 3 + 3;
        periodEnd = new Date(current.getFullYear(), quarterMonth, 1);
        current = periodEnd;
        break;

      case 'Year':
        periodEnd = new Date(current.getFullYear() + 1, 0, 1);
        current = periodEnd;
        break;

      default:
        periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 1);
        current = periodEnd;
    }

    // Clamp period end to the overall end date
    if (periodEnd > endDate) {
      periodEnd = new Date(endDate);
    }

    periods.push({ start: periodStart, end: periodEnd });
  }

  return periods;
}

/**
 * Calculate the overlap between two date ranges in days
 */
function calculateOverlapDays(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): number {
  const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
  const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));

  if (overlapStart >= overlapEnd) {
    return 0;
  }

  return Math.ceil(
    (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24),
  );
}

/**
 * Get the duration of a date range in days
 */
function getDurationDays(start: Date, end: Date): number {
  return Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
}

/**
 * Calculate resource allocation across all periods
 */
export function calculateResourceAllocation(
  initiatives: Initiative[],
  requirements: InitiativeResourceRequirement[],
  pools: ResourcePool[],
  periodType: PeriodType = 'Month',
): ResourceAllocation[] {
  const allocations: ResourceAllocation[] = [];

  // Find overall date range from initiatives
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  for (const init of initiatives) {
    if (init.startDate) {
      const start = new Date(init.startDate);
      if (!minDate || start < minDate) minDate = start;
    }
    if (init.endDate) {
      const end = new Date(init.endDate);
      if (!maxDate || end > maxDate) maxDate = end;
    }
  }

  if (!minDate || !maxDate) {
    return allocations;
  }

  // Generate periods
  const periods = generatePeriods(minDate, maxDate, periodType);

  // For each pool, calculate allocation per period
  for (const pool of pools) {
    const poolRequirements = requirements.filter(
      (r) => r.resourcePoolId === pool.id,
    );

    for (const period of periods) {
      let periodDemand = 0;

      for (const req of poolRequirements) {
        const initiative = initiatives.find((i) => i.id === req.initiativeId);
        if (!initiative?.startDate || !initiative?.endDate) continue;

        const initStart = new Date(initiative.startDate);
        const initEnd = new Date(initiative.endDate);

        // Calculate overlap between initiative and this period
        const overlapDays = calculateOverlapDays(
          initStart,
          initEnd,
          period.start,
          period.end,
        );

        if (overlapDays > 0) {
          // Distribute effort evenly across initiative duration
          const initDuration = getDurationDays(initStart, initEnd);
          const effortPerDay = req.effortRequired / initDuration;
          periodDemand += effortPerDay * overlapDays;
        }
      }

      const capacity = pool.capacityPerPeriod ?? 0;
      const utilisation = capacity > 0 ? (periodDemand / capacity) * 100 : 0;

      allocations.push({
        poolId: pool.id,
        poolName: pool.name,
        periodStart: period.start,
        periodEnd: period.end,
        demand: periodDemand,
        capacity,
        utilisation,
      });
    }
  }

  return allocations;
}

/**
 * Find periods where demand exceeds capacity
 */
export function findResourceConflicts(
  allocations: ResourceAllocation[],
  initiatives: Initiative[],
  requirements: InitiativeResourceRequirement[],
): ResourceConflict[] {
  const conflicts: ResourceConflict[] = [];

  for (const allocation of allocations) {
    if (allocation.demand > allocation.capacity && allocation.capacity > 0) {
      // Find which initiatives contribute to this period
      const poolReqs = requirements.filter(
        (r) => r.resourcePoolId === allocation.poolId,
      );

      const contributing: { id: string; name: string; effort: number }[] = [];

      for (const req of poolReqs) {
        const initiative = initiatives.find((i) => i.id === req.initiativeId);
        if (!initiative?.startDate || !initiative?.endDate) continue;

        const initStart = new Date(initiative.startDate);
        const initEnd = new Date(initiative.endDate);

        const overlapDays = calculateOverlapDays(
          initStart,
          initEnd,
          allocation.periodStart,
          allocation.periodEnd,
        );

        if (overlapDays > 0) {
          const initDuration = getDurationDays(initStart, initEnd);
          const effortPerDay = req.effortRequired / initDuration;
          const periodEffort = effortPerDay * overlapDays;

          contributing.push({
            id: initiative.id,
            name: initiative.name,
            effort: periodEffort,
          });
        }
      }

      conflicts.push({
        type: 'resource',
        poolId: allocation.poolId,
        poolName: allocation.poolName,
        periodStart: allocation.periodStart,
        periodEnd: allocation.periodEnd,
        demand: allocation.demand,
        capacity: allocation.capacity,
        overAllocation: allocation.demand - allocation.capacity,
        utilisationPercent: allocation.utilisation,
        contributingInitiatives: contributing.sort((a, b) => b.effort - a.effort),
      });
    }
  }

  return conflicts;
}

/**
 * Check if a proposed change would create/resolve conflicts
 */
export function checkProposedResourceChange(
  initiative: Initiative,
  newStartDate: Date,
  newEndDate: Date,
  initiatives: Initiative[],
  requirements: InitiativeResourceRequirement[],
  pools: ResourcePool[],
  periodType: PeriodType = 'Month',
): { newConflicts: ResourceConflict[]; resolvedConflicts: ResourceConflict[] } {
  // Calculate current conflicts
  const currentAllocations = calculateResourceAllocation(
    initiatives,
    requirements,
    pools,
    periodType,
  );
  const currentConflicts = findResourceConflicts(
    currentAllocations,
    initiatives,
    requirements,
  );

  // Calculate conflicts with proposed change
  const modifiedInitiatives = initiatives.map((i) =>
    i.id === initiative.id
      ? {
          ...i,
          startDate: newStartDate.toISOString().split('T')[0],
          endDate: newEndDate.toISOString().split('T')[0],
        }
      : i,
  );

  const newAllocations = calculateResourceAllocation(
    modifiedInitiatives,
    requirements,
    pools,
    periodType,
  );
  const afterConflicts = findResourceConflicts(
    newAllocations,
    modifiedInitiatives,
    requirements,
  );

  // Find new conflicts (not in current)
  const newConflicts = afterConflicts.filter(
    (after) =>
      !currentConflicts.some(
        (curr) =>
          curr.poolId === after.poolId &&
          curr.periodStart.getTime() === after.periodStart.getTime(),
      ),
  );

  // Find resolved conflicts (in current but not in after)
  const resolvedConflicts = currentConflicts.filter(
    (curr) =>
      !afterConflicts.some(
        (after) =>
          after.poolId === curr.poolId &&
          after.periodStart.getTime() === curr.periodStart.getTime(),
      ),
  );

  return { newConflicts, resolvedConflicts };
}

/**
 * Get total effort by pool for an initiative
 */
export function getInitiativeEffortByPool(
  initiativeId: string,
  requirements: InitiativeResourceRequirement[],
  pools: ResourcePool[],
): { poolId: string; poolName: string; effort: number }[] {
  const initiativeReqs = requirements.filter(
    (r) => r.initiativeId === initiativeId,
  );

  return initiativeReqs.map((req) => {
    const pool = pools.find((p) => p.id === req.resourcePoolId);
    return {
      poolId: req.resourcePoolId,
      poolName: pool?.name ?? 'Unknown',
      effort: req.effortRequired,
    };
  });
}

/**
 * Calculate utilisation summary for a pool
 */
export function getPoolUtilisationSummary(
  poolId: string,
  allocations: ResourceAllocation[],
): {
  avgUtilisation: number;
  maxUtilisation: number;
  periodsOverCapacity: number;
  totalPeriods: number;
} {
  const poolAllocations = allocations.filter((a) => a.poolId === poolId);

  if (poolAllocations.length === 0) {
    return {
      avgUtilisation: 0,
      maxUtilisation: 0,
      periodsOverCapacity: 0,
      totalPeriods: 0,
    };
  }

  const totalUtilisation = poolAllocations.reduce(
    (sum, a) => sum + a.utilisation,
    0,
  );
  const maxUtilisation = Math.max(...poolAllocations.map((a) => a.utilisation));
  const periodsOverCapacity = poolAllocations.filter(
    (a) => a.utilisation > 100,
  ).length;

  return {
    avgUtilisation: totalUtilisation / poolAllocations.length,
    maxUtilisation,
    periodsOverCapacity,
    totalPeriods: poolAllocations.length,
  };
}
