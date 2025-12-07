// Dependency Engine - Calculates and validates initiative dependencies
// Pure functions for testability and memoization

import type {
  Initiative,
  InitiativeDependency,
  InitiativeDependencyType,
} from './types';

export interface DependencyViolation {
  type: 'dependency';
  initiativeId: string;
  initiativeName: string;
  dependsOnId: string;
  dependsOnName: string;
  dependencyType: InitiativeDependencyType;
  message: string;
  suggestedFix?: { newStartDate: Date; newEndDate: Date };
}

/**
 * Check if a single dependency is satisfied
 */
function isDependencySatisfied(
  initiative: Initiative,
  predecessor: Initiative,
  dependency: InitiativeDependency,
): boolean {
  if (!initiative.startDate || !initiative.endDate) return true;
  if (!predecessor.startDate || !predecessor.endDate) return true;

  const initStart = new Date(initiative.startDate);
  const initEnd = new Date(initiative.endDate);
  const predStart = new Date(predecessor.startDate);
  const predEnd = new Date(predecessor.endDate);
  const lagMs = dependency.lagDays * 24 * 60 * 60 * 1000;

  switch (dependency.dependencyType) {
    case 'FinishToStart':
      // Predecessor must finish before successor starts (plus lag)
      return initStart.getTime() >= predEnd.getTime() + lagMs;

    case 'StartToStart':
      // Predecessor must start before successor starts (plus lag)
      return initStart.getTime() >= predStart.getTime() + lagMs;

    case 'FinishToFinish':
      // Predecessor must finish before successor finishes (plus lag)
      return initEnd.getTime() >= predEnd.getTime() + lagMs;

    case 'StartToFinish':
      // Predecessor must start before successor finishes (plus lag)
      return initEnd.getTime() >= predStart.getTime() + lagMs;

    default:
      return true;
  }
}

/**
 * Calculate the suggested dates to satisfy a dependency
 */
function getSuggestedDates(
  initiative: Initiative,
  predecessor: Initiative,
  dependency: InitiativeDependency,
): { newStartDate: Date; newEndDate: Date } | undefined {
  if (!initiative.startDate || !initiative.endDate) return undefined;
  if (!predecessor.startDate || !predecessor.endDate) return undefined;

  const initStart = new Date(initiative.startDate);
  const initEnd = new Date(initiative.endDate);
  const duration = initEnd.getTime() - initStart.getTime();
  const predStart = new Date(predecessor.startDate);
  const predEnd = new Date(predecessor.endDate);
  const lagMs = dependency.lagDays * 24 * 60 * 60 * 1000;

  let newStartDate: Date;

  switch (dependency.dependencyType) {
    case 'FinishToStart':
      newStartDate = new Date(predEnd.getTime() + lagMs);
      break;

    case 'StartToStart':
      newStartDate = new Date(predStart.getTime() + lagMs);
      break;

    case 'FinishToFinish':
      // Move so that end aligns with predecessor end + lag
      newStartDate = new Date(predEnd.getTime() + lagMs - duration);
      break;

    case 'StartToFinish':
      // Move so that end aligns with predecessor start + lag
      newStartDate = new Date(predStart.getTime() + lagMs - duration);
      break;

    default:
      return undefined;
  }

  return {
    newStartDate,
    newEndDate: new Date(newStartDate.getTime() + duration),
  };
}

/**
 * Check all dependencies for an initiative and return violations
 */
export function checkDependencies(
  initiative: Initiative,
  allInitiatives: Initiative[],
  dependencies: InitiativeDependency[],
): DependencyViolation[] {
  const violations: DependencyViolation[] = [];

  // Find dependencies where this initiative is the successor
  const incomingDeps = dependencies.filter(
    (d) => d.successorId === initiative.id,
  );

  for (const dep of incomingDeps) {
    const predecessor = allInitiatives.find((i) => i.id === dep.predecessorId);
    if (!predecessor) continue;

    if (!isDependencySatisfied(initiative, predecessor, dep)) {
      const suggestedFix = getSuggestedDates(initiative, predecessor, dep);

      violations.push({
        type: 'dependency',
        initiativeId: initiative.id,
        initiativeName: initiative.name,
        dependsOnId: predecessor.id,
        dependsOnName: predecessor.name,
        dependencyType: dep.dependencyType,
        message: formatViolationMessage(
          initiative.name,
          predecessor.name,
          dep.dependencyType,
        ),
        suggestedFix,
      });
    }
  }

  return violations;
}

function formatViolationMessage(
  initiativeName: string,
  predecessorName: string,
  type: InitiativeDependencyType,
): string {
  switch (type) {
    case 'FinishToStart':
      return `"${initiativeName}" starts before "${predecessorName}" finishes`;
    case 'StartToStart':
      return `"${initiativeName}" starts before "${predecessorName}" starts`;
    case 'FinishToFinish':
      return `"${initiativeName}" finishes before "${predecessorName}" finishes`;
    case 'StartToFinish':
      return `"${initiativeName}" finishes before "${predecessorName}" starts`;
    default:
      return `Dependency violation between "${initiativeName}" and "${predecessorName}"`;
  }
}

/**
 * Check all initiatives and return all dependency violations
 */
export function checkAllDependencies(
  initiatives: Initiative[],
  dependencies: InitiativeDependency[],
): DependencyViolation[] {
  const violations: DependencyViolation[] = [];

  for (const initiative of initiatives) {
    violations.push(...checkDependencies(initiative, initiatives, dependencies));
  }

  return violations;
}

/**
 * Get all initiatives that would need to move if this one moves (cascading)
 */
export function getCascadingChanges(
  initiativeId: string,
  newStartDate: Date,
  newEndDate: Date,
  allInitiatives: Initiative[],
  dependencies: InitiativeDependency[],
  visited: Set<string> = new Set(),
): Map<string, { newStartDate: Date; newEndDate: Date }> {
  const changes = new Map<string, { newStartDate: Date; newEndDate: Date }>();

  // Prevent infinite loops in cyclic dependencies
  if (visited.has(initiativeId)) {
    return changes;
  }
  visited.add(initiativeId);

  // Find dependencies where this initiative is the predecessor
  const outgoingDeps = dependencies.filter(
    (d) => d.predecessorId === initiativeId,
  );

  for (const dep of outgoingDeps) {
    const successor = allInitiatives.find((i) => i.id === dep.successorId);
    if (!successor || !successor.startDate || !successor.endDate) continue;

    const successorStart = new Date(successor.startDate);
    const successorEnd = new Date(successor.endDate);
    const duration = successorEnd.getTime() - successorStart.getTime();
    const lagMs = dep.lagDays * 24 * 60 * 60 * 1000;

    let requiredStartDate: Date | null = null;

    switch (dep.dependencyType) {
      case 'FinishToStart':
        // Successor must start after this initiative ends + lag
        if (successorStart.getTime() < newEndDate.getTime() + lagMs) {
          requiredStartDate = new Date(newEndDate.getTime() + lagMs);
        }
        break;

      case 'StartToStart':
        // Successor must start after this initiative starts + lag
        if (successorStart.getTime() < newStartDate.getTime() + lagMs) {
          requiredStartDate = new Date(newStartDate.getTime() + lagMs);
        }
        break;

      case 'FinishToFinish':
        // Successor must finish after this initiative finishes + lag
        const requiredEndFF = new Date(newEndDate.getTime() + lagMs);
        if (successorEnd.getTime() < requiredEndFF.getTime()) {
          requiredStartDate = new Date(requiredEndFF.getTime() - duration);
        }
        break;

      case 'StartToFinish':
        // Successor must finish after this initiative starts + lag
        const requiredEndSF = new Date(newStartDate.getTime() + lagMs);
        if (successorEnd.getTime() < requiredEndSF.getTime()) {
          requiredStartDate = new Date(requiredEndSF.getTime() - duration);
        }
        break;
    }

    if (requiredStartDate) {
      const newSuccessorEnd = new Date(requiredStartDate.getTime() + duration);
      changes.set(successor.id, {
        newStartDate: requiredStartDate,
        newEndDate: newSuccessorEnd,
      });

      // Recursively get cascading changes for this successor
      const cascaded = getCascadingChanges(
        successor.id,
        requiredStartDate,
        newSuccessorEnd,
        allInitiatives,
        dependencies,
        visited,
      );

      for (const [id, dates] of cascaded) {
        changes.set(id, dates);
      }
    }
  }

  return changes;
}

/**
 * Get the valid date range for an initiative given its dependencies
 */
export function getValidDateRange(
  initiativeId: string,
  allInitiatives: Initiative[],
  dependencies: InitiativeDependency[],
): { earliestStart: Date | null; latestEnd: Date | null } {
  let earliestStart: Date | null = null;
  let latestEnd: Date | null = null;

  // Find dependencies where this initiative is the successor (incoming)
  const incomingDeps = dependencies.filter(
    (d) => d.successorId === initiativeId,
  );

  for (const dep of incomingDeps) {
    const predecessor = allInitiatives.find((i) => i.id === dep.predecessorId);
    if (!predecessor || !predecessor.startDate || !predecessor.endDate)
      continue;

    const predStart = new Date(predecessor.startDate);
    const predEnd = new Date(predecessor.endDate);
    const lagMs = dep.lagDays * 24 * 60 * 60 * 1000;

    let constrainedStart: Date | null = null;

    switch (dep.dependencyType) {
      case 'FinishToStart':
        constrainedStart = new Date(predEnd.getTime() + lagMs);
        break;
      case 'StartToStart':
        constrainedStart = new Date(predStart.getTime() + lagMs);
        break;
      // FinishToFinish and StartToFinish constrain end date, not start
    }

    if (constrainedStart) {
      if (!earliestStart || constrainedStart > earliestStart) {
        earliestStart = constrainedStart;
      }
    }
  }

  return { earliestStart, latestEnd };
}

/**
 * Detect cycles in the dependency graph
 */
export function detectDependencyCycles(
  dependencies: InitiativeDependency[],
): string[][] {
  const cycles: string[][] = [];
  const adjacency = new Map<string, string[]>();

  // Build adjacency list
  for (const dep of dependencies) {
    const existing = adjacency.get(dep.predecessorId) ?? [];
    existing.push(dep.successorId);
    adjacency.set(dep.predecessorId, existing);
  }

  // DFS to detect cycles
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string, path: string[]): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjacency.get(nodeId) ?? [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, [...path, neighbor])) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart));
        } else {
          cycles.push([...path, neighbor]);
        }
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  // Check all nodes
  const allNodes = new Set<string>();
  for (const dep of dependencies) {
    allNodes.add(dep.predecessorId);
    allNodes.add(dep.successorId);
  }

  for (const nodeId of allNodes) {
    if (!visited.has(nodeId)) {
      dfs(nodeId, [nodeId]);
    }
  }

  return cycles;
}
