// Consequence Engine - Unified engine that combines all consequence checks
// This is the main entry point for evaluating changes

import type {
  Constraint,
  Initiative,
  InitiativeConstraint,
  InitiativeDependency,
  InitiativeResourceRequirement,
  PeriodType,
  ResourcePool,
} from './types';

import {
  type DependencyViolation,
  checkDependencies,
  checkAllDependencies,
  getCascadingChanges,
  detectDependencyCycles,
} from './dependencyEngine';

import {
  type ConstraintViolation,
  checkConstraints,
  checkProposedChange as checkConstraintChange,
  checkAllConstraints,
  categorizeViolations,
} from './constraintEngine';

import {
  type ResourceConflict,
  calculateResourceAllocation,
  findResourceConflicts,
  checkProposedResourceChange,
} from './resourceEngine';

// Re-export types for convenience
export type { DependencyViolation, ConstraintViolation, ResourceConflict };

export interface ConsequenceReport {
  dependencyViolations: DependencyViolation[];
  constraintViolations: ConstraintViolation[];
  resourceConflicts: ResourceConflict[];
  cascadingChanges: Map<string, { newStartDate: Date; newEndDate: Date }>;
  hasHardViolations: boolean;
  hasSoftViolations: boolean;
  hasResourceConflicts: boolean;
  totalIssueCount: number;
  summary: string;
}

export interface ConsequenceContext {
  initiatives: Initiative[];
  dependencies: InitiativeDependency[];
  constraints: Constraint[];
  constraintLinks: InitiativeConstraint[];
  requirements: InitiativeResourceRequirement[];
  pools: ResourcePool[];
  periodType?: PeriodType;
}

/**
 * Comprehensive evaluation of a proposed change
 */
export function evaluateChange(
  initiative: Initiative,
  newStartDate: Date,
  newEndDate: Date,
  context: ConsequenceContext,
): ConsequenceReport {
  const {
    initiatives,
    dependencies,
    constraints,
    constraintLinks,
    requirements,
    pools,
    periodType = 'Month',
  } = context;

  // Create virtual initiative with proposed dates
  const virtualInitiative: Initiative = {
    ...initiative,
    startDate: newStartDate.toISOString().split('T')[0],
    endDate: newEndDate.toISOString().split('T')[0],
  };

  // Check dependencies
  const dependencyViolations = checkDependencies(
    virtualInitiative,
    initiatives,
    dependencies,
  );

  // Check constraints
  const constraintViolations = checkConstraintChange(
    initiative,
    newStartDate,
    newEndDate,
    constraints,
    constraintLinks,
  );

  // Check resource conflicts
  const { newConflicts: resourceConflicts } = checkProposedResourceChange(
    initiative,
    newStartDate,
    newEndDate,
    initiatives,
    requirements,
    pools,
    periodType,
  );

  // Get cascading changes
  const cascadingChanges = getCascadingChanges(
    initiative.id,
    newStartDate,
    newEndDate,
    initiatives,
    dependencies,
  );

  // Categorize constraint violations
  const { hard, soft } = categorizeViolations(constraintViolations);

  const hasHardViolations = hard.length > 0;
  const hasSoftViolations = soft.length > 0;
  const hasResourceConflicts = resourceConflicts.length > 0;
  const totalIssueCount =
    dependencyViolations.length +
    constraintViolations.length +
    resourceConflicts.length;

  return {
    dependencyViolations,
    constraintViolations,
    resourceConflicts,
    cascadingChanges,
    hasHardViolations,
    hasSoftViolations,
    hasResourceConflicts,
    totalIssueCount,
    summary: generateSummary(
      dependencyViolations.length,
      hard.length,
      soft.length,
      resourceConflicts.length,
      cascadingChanges.size,
    ),
  };
}

/**
 * Evaluate current state of all initiatives
 */
export function evaluateCurrentState(
  context: ConsequenceContext,
): ConsequenceReport {
  const {
    initiatives,
    dependencies,
    constraints,
    constraintLinks,
    requirements,
    pools,
    periodType = 'Month',
  } = context;

  // Check all dependencies
  const dependencyViolations = checkAllDependencies(initiatives, dependencies);

  // Check all constraints
  const constraintViolations = checkAllConstraints(
    initiatives,
    constraints,
    constraintLinks,
  );

  // Calculate resource allocations and conflicts
  const allocations = calculateResourceAllocation(
    initiatives,
    requirements,
    pools,
    periodType,
  );
  const resourceConflicts = findResourceConflicts(
    allocations,
    initiatives,
    requirements,
  );

  // No cascading changes for current state evaluation
  const cascadingChanges = new Map<
    string,
    { newStartDate: Date; newEndDate: Date }
  >();

  // Categorize constraint violations
  const { hard, soft } = categorizeViolations(constraintViolations);

  const hasHardViolations = hard.length > 0;
  const hasSoftViolations = soft.length > 0;
  const hasResourceConflicts = resourceConflicts.length > 0;
  const totalIssueCount =
    dependencyViolations.length +
    constraintViolations.length +
    resourceConflicts.length;

  return {
    dependencyViolations,
    constraintViolations,
    resourceConflicts,
    cascadingChanges,
    hasHardViolations,
    hasSoftViolations,
    hasResourceConflicts,
    totalIssueCount,
    summary: generateSummary(
      dependencyViolations.length,
      hard.length,
      soft.length,
      resourceConflicts.length,
      0,
    ),
  };
}

/**
 * Get violations for a specific initiative
 */
export function getInitiativeViolations(
  initiative: Initiative,
  context: ConsequenceContext,
): {
  dependencyViolations: DependencyViolation[];
  constraintViolations: ConstraintViolation[];
  resourceConflicts: ResourceConflict[];
} {
  const {
    initiatives,
    dependencies,
    constraints,
    constraintLinks,
    requirements,
    pools,
    periodType = 'Month',
  } = context;

  const dependencyViolations = checkDependencies(
    initiative,
    initiatives,
    dependencies,
  );

  const constraintViolations = checkConstraints(
    initiative,
    constraints,
    constraintLinks,
  );

  // For resource conflicts, find conflicts that involve this initiative
  const allocations = calculateResourceAllocation(
    initiatives,
    requirements,
    pools,
    periodType,
  );
  const allConflicts = findResourceConflicts(
    allocations,
    initiatives,
    requirements,
  );
  const resourceConflicts = allConflicts.filter((c) =>
    c.contributingInitiatives.some((ci) => ci.id === initiative.id),
  );

  return {
    dependencyViolations,
    constraintViolations,
    resourceConflicts,
  };
}

/**
 * Check for dependency cycles
 */
export function checkForCycles(
  dependencies: InitiativeDependency[],
): { hasCycles: boolean; cycles: string[][] } {
  const cycles = detectDependencyCycles(dependencies);
  return {
    hasCycles: cycles.length > 0,
    cycles,
  };
}

/**
 * Generate a human-readable summary
 */
function generateSummary(
  depCount: number,
  hardCount: number,
  softCount: number,
  resourceCount: number,
  cascadeCount: number,
): string {
  const parts: string[] = [];

  if (depCount > 0) {
    parts.push(`${depCount} dependency violation${depCount > 1 ? 's' : ''}`);
  }

  if (hardCount > 0) {
    parts.push(
      `${hardCount} hard constraint violation${hardCount > 1 ? 's' : ''}`,
    );
  }

  if (softCount > 0) {
    parts.push(
      `${softCount} soft constraint violation${softCount > 1 ? 's' : ''}`,
    );
  }

  if (resourceCount > 0) {
    parts.push(`${resourceCount} resource conflict${resourceCount > 1 ? 's' : ''}`);
  }

  if (cascadeCount > 0) {
    parts.push(
      `${cascadeCount} initiative${cascadeCount > 1 ? 's' : ''} would cascade`,
    );
  }

  if (parts.length === 0) {
    return 'No issues detected';
  }

  return parts.join(', ');
}

/**
 * Get severity level for display
 */
export function getSeverityLevel(
  report: ConsequenceReport,
): 'none' | 'warning' | 'error' {
  if (report.hasHardViolations) {
    return 'error';
  }

  if (
    report.hasSoftViolations ||
    report.dependencyViolations.length > 0 ||
    report.hasResourceConflicts
  ) {
    return 'warning';
  }

  return 'none';
}

/**
 * Group violations by initiative for display
 */
export function groupViolationsByInitiative(report: ConsequenceReport): Map<
  string,
  {
    dependencies: DependencyViolation[];
    constraints: ConstraintViolation[];
    resources: ResourceConflict[];
  }
> {
  const grouped = new Map<
    string,
    {
      dependencies: DependencyViolation[];
      constraints: ConstraintViolation[];
      resources: ResourceConflict[];
    }
  >();

  // Helper to ensure initiative exists in map
  const ensureInitiative = (id: string) => {
    if (!grouped.has(id)) {
      grouped.set(id, { dependencies: [], constraints: [], resources: [] });
    }
    return grouped.get(id)!;
  };

  // Group dependency violations
  for (const v of report.dependencyViolations) {
    ensureInitiative(v.initiativeId).dependencies.push(v);
  }

  // Group constraint violations
  for (const v of report.constraintViolations) {
    ensureInitiative(v.initiativeId).constraints.push(v);
  }

  // Group resource conflicts by contributing initiatives
  for (const c of report.resourceConflicts) {
    for (const contributor of c.contributingInitiatives) {
      ensureInitiative(contributor.id).resources.push(c);
    }
  }

  return grouped;
}
