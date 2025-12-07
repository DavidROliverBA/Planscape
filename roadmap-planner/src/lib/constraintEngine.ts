// Constraint Engine - Validates initiatives against constraints
// Pure functions for testability and memoization

import type {
  Constraint,
  Hardness,
  Initiative,
  InitiativeConstraint,
} from './types';

export interface ConstraintViolation {
  type: 'constraint';
  constraintId: string;
  constraintName: string;
  constraintType: string;
  initiativeId: string;
  initiativeName: string;
  hardness: Hardness;
  message: string;
}

/**
 * Check if an initiative violates a specific constraint
 */
function checkSingleConstraint(
  initiative: Initiative,
  constraint: Constraint,
): ConstraintViolation | null {
  // Skip if no dates to check
  if (!initiative.startDate || !initiative.endDate) {
    return null;
  }

  const initStart = new Date(initiative.startDate);
  const initEnd = new Date(initiative.endDate);

  // Check deadline constraints
  if (constraint.type === 'Deadline' && constraint.effectiveDate) {
    const deadline = new Date(constraint.effectiveDate);

    if (initEnd > deadline) {
      return {
        type: 'constraint',
        constraintId: constraint.id,
        constraintName: constraint.name,
        constraintType: constraint.type,
        initiativeId: initiative.id,
        initiativeName: initiative.name,
        hardness: constraint.hardness,
        message: `"${initiative.name}" ends after deadline "${constraint.name}" (${formatDate(deadline)})`,
      };
    }
  }

  // Check if initiative falls outside constraint effective period
  if (constraint.effectiveDate || constraint.expiryDate) {
    const effectiveStart = constraint.effectiveDate
      ? new Date(constraint.effectiveDate)
      : null;
    const effectiveEnd = constraint.expiryDate
      ? new Date(constraint.expiryDate)
      : null;

    // For non-deadline constraints, check if initiative is within the constraint period
    if (constraint.type !== 'Deadline') {
      if (effectiveEnd && initStart > effectiveEnd) {
        return {
          type: 'constraint',
          constraintId: constraint.id,
          constraintName: constraint.name,
          constraintType: constraint.type,
          initiativeId: initiative.id,
          initiativeName: initiative.name,
          hardness: constraint.hardness,
          message: `"${initiative.name}" starts after "${constraint.name}" expires (${formatDate(effectiveEnd)})`,
        };
      }

      if (effectiveStart && initEnd < effectiveStart) {
        return {
          type: 'constraint',
          constraintId: constraint.id,
          constraintName: constraint.name,
          constraintType: constraint.type,
          initiativeId: initiative.id,
          initiativeName: initiative.name,
          hardness: constraint.hardness,
          message: `"${initiative.name}" ends before "${constraint.name}" is effective (${formatDate(effectiveStart)})`,
        };
      }
    }
  }

  return null;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Check all constraints linked to an initiative
 */
export function checkConstraints(
  initiative: Initiative,
  constraints: Constraint[],
  links: InitiativeConstraint[],
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];

  // Find constraints linked to this initiative
  const linkedConstraintIds = links
    .filter((l) => l.initiativeId === initiative.id)
    .map((l) => l.constraintId);

  const linkedConstraints = constraints.filter((c) =>
    linkedConstraintIds.includes(c.id),
  );

  for (const constraint of linkedConstraints) {
    const violation = checkSingleConstraint(initiative, constraint);
    if (violation) {
      violations.push(violation);
    }
  }

  return violations;
}

/**
 * Check if a proposed date change would violate constraints
 */
export function checkProposedChange(
  initiative: Initiative,
  newStartDate: Date,
  newEndDate: Date,
  constraints: Constraint[],
  links: InitiativeConstraint[],
): ConstraintViolation[] {
  // Create a virtual initiative with the new dates
  const virtualInitiative: Initiative = {
    ...initiative,
    startDate: newStartDate.toISOString().split('T')[0],
    endDate: newEndDate.toISOString().split('T')[0],
  };

  return checkConstraints(virtualInitiative, constraints, links);
}

/**
 * Check all initiatives against all constraints
 */
export function checkAllConstraints(
  initiatives: Initiative[],
  constraints: Constraint[],
  links: InitiativeConstraint[],
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];

  for (const initiative of initiatives) {
    violations.push(...checkConstraints(initiative, constraints, links));
  }

  return violations;
}

/**
 * Get constraints that would be violated by a date range
 */
export function getViolatedConstraints(
  startDate: Date,
  endDate: Date,
  constraints: Constraint[],
): Constraint[] {
  return constraints.filter((constraint) => {
    if (constraint.type === 'Deadline' && constraint.effectiveDate) {
      const deadline = new Date(constraint.effectiveDate);
      return endDate > deadline;
    }

    if (constraint.expiryDate) {
      const expiry = new Date(constraint.expiryDate);
      return startDate > expiry;
    }

    return false;
  });
}

/**
 * Get the latest valid end date for an initiative given its constraints
 */
export function getLatestValidEndDate(
  initiative: Initiative,
  constraints: Constraint[],
  links: InitiativeConstraint[],
): Date | null {
  // Find linked deadline constraints
  const linkedConstraintIds = links
    .filter((l) => l.initiativeId === initiative.id)
    .map((l) => l.constraintId);

  const deadlineConstraints = constraints.filter(
    (c) =>
      linkedConstraintIds.includes(c.id) &&
      c.type === 'Deadline' &&
      c.effectiveDate,
  );

  if (deadlineConstraints.length === 0) {
    return null;
  }

  // Find the earliest deadline
  let earliestDeadline: Date | null = null;

  for (const constraint of deadlineConstraints) {
    if (constraint.effectiveDate) {
      const deadline = new Date(constraint.effectiveDate);
      if (!earliestDeadline || deadline < earliestDeadline) {
        earliestDeadline = deadline;
      }
    }
  }

  return earliestDeadline;
}

/**
 * Categorize violations by hardness
 */
export function categorizeViolations(violations: ConstraintViolation[]): {
  hard: ConstraintViolation[];
  soft: ConstraintViolation[];
} {
  return {
    hard: violations.filter((v) => v.hardness === 'Hard'),
    soft: violations.filter((v) => v.hardness === 'Soft'),
  };
}
