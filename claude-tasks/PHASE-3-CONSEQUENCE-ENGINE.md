# Phase 3: Consequence Engine

## Objective

Implement the dependency tracking, constraint checking, and resource calculation systems that show architects the consequences of their planning decisions.

## Prerequisites

- Phase 2 complete
- Timeline view working with drag-and-drop
- Initiatives can be moved and resized
- Basic data model fully functional

## Context

This is the "brain" of the application. When an architect moves an initiative, they need to see:
- What other initiatives depend on it
- What constraints are violated
- What resources are over-allocated

The tool should show these consequences but not prevent the action—respecting architect judgement while ensuring visibility.

---

## Task List

### 1. Dependency Data Model

- [ ] Create Tauri commands for initiative dependencies:
  - `get_initiative_dependencies(initiative_id: String)`
  - `create_initiative_dependency(dependency: InitiativeDependency)`
  - `update_initiative_dependency(dependency: InitiativeDependency)`
  - `delete_initiative_dependency(id: String)`

- [ ] Create Tauri commands for system dependencies:
  - `get_system_dependencies(system_id: String)`
  - `create_system_dependency(dependency: SystemDependency)`
  - `delete_system_dependency(id: String)`

- [ ] Add to frontend db wrapper (`src/lib/db.ts`)

### 2. Dependency Management UI

- [ ] Create `src/features/initiatives/DependencyManager.tsx`:
  - List existing dependencies for selected initiative
  - "Add Dependency" button
  - Select predecessor initiative from dropdown
  - Select dependency type (Finish-to-Start, Start-to-Start, Finish-to-Finish)
  - Set lag days (optional)
  - Remove dependency button

- [ ] Add dependency tab to InitiativeDetail.tsx

### 3. Dependency Calculations

- [ ] Create `src/lib/dependencyEngine.ts`:

```typescript
interface DependencyViolation {
  type: 'dependency';
  initiativeId: string;
  dependsOnId: string;
  dependencyType: DependencyType;
  message: string;
  suggestedFix?: { newStartDate: Date; newEndDate: Date };
}

// Calculate if dependencies are satisfied
function checkDependencies(
  initiative: Initiative,
  allInitiatives: Initiative[],
  dependencies: InitiativeDependency[]
): DependencyViolation[];

// Get all initiatives that must move if this one moves
function getCascadingChanges(
  initiativeId: string,
  newStartDate: Date,
  newEndDate: Date,
  allInitiatives: Initiative[],
  dependencies: InitiativeDependency[]
): Map<string, { newStartDate: Date; newEndDate: Date }>;

// Get valid date range for an initiative given its dependencies
function getValidDateRange(
  initiativeId: string,
  allInitiatives: Initiative[],
  dependencies: InitiativeDependency[]
): { earliestStart: Date | null; latestEnd: Date | null };
```

### 4. Constraint Data Model

- [ ] Create Tauri commands for initiative-constraint links:
  - `get_initiative_constraints(initiative_id: String)`
  - `link_initiative_constraint(initiative_id: String, constraint_id: String)`
  - `unlink_initiative_constraint(initiative_id: String, constraint_id: String)`

- [ ] Add to frontend db wrapper

### 5. Constraint Management UI

- [ ] Create `src/features/initiatives/ConstraintManager.tsx`:
  - List constraints linked to initiative
  - "Add Constraint" button
  - Select from existing constraints or create new
  - Show constraint details (deadline, hardness)
  - Remove constraint link

- [ ] Add constraint tab to InitiativeDetail.tsx

### 6. Constraint Checking

- [ ] Create `src/lib/constraintEngine.ts`:

```typescript
interface ConstraintViolation {
  type: 'constraint';
  constraintId: string;
  constraintName: string;
  initiativeId: string;
  hardness: 'Hard' | 'Soft';
  message: string;
}

// Check if initiative violates any linked constraints
function checkConstraints(
  initiative: Initiative,
  constraints: Constraint[]
): ConstraintViolation[];

// Check if a proposed date change would violate constraints
function checkProposedChange(
  initiative: Initiative,
  newStartDate: Date,
  newEndDate: Date,
  constraints: Constraint[]
): ConstraintViolation[];
```

### 7. Resource Requirements Data Model

- [ ] Create Tauri commands:
  - `get_initiative_resource_requirements(initiative_id: String)`
  - `create_resource_requirement(requirement: InitiativeResourceRequirement)`
  - `update_resource_requirement(requirement: InitiativeResourceRequirement)`
  - `delete_resource_requirement(id: String)`

- [ ] Add to frontend db wrapper

### 8. Resource Requirements UI

- [ ] Create `src/features/initiatives/ResourceRequirementManager.tsx`:
  - List resource requirements for initiative
  - Add requirement: select pool, effort, date range
  - Edit existing requirements
  - Remove requirements
  - Show total effort by pool

- [ ] Add resources tab to InitiativeDetail.tsx

### 9. Resource Calculations

- [ ] Create `src/lib/resourceEngine.ts`:

```typescript
interface ResourceAllocation {
  poolId: string;
  periodStart: Date;
  periodEnd: Date;
  demand: number;
  capacity: number;
  utilisation: number; // demand / capacity
}

interface ResourceConflict {
  type: 'resource';
  poolId: string;
  poolName: string;
  periodStart: Date;
  periodEnd: Date;
  demand: number;
  capacity: number;
  overAllocation: number;
  contributingInitiatives: string[];
}

// Calculate resource allocation across all periods
function calculateResourceAllocation(
  initiatives: Initiative[],
  requirements: InitiativeResourceRequirement[],
  pools: ResourcePool[],
  periodType: 'Month' | 'Quarter'
): ResourceAllocation[];

// Find periods where demand exceeds capacity
function findResourceConflicts(
  allocations: ResourceAllocation[],
  pools: ResourcePool[]
): ResourceConflict[];

// Check if a proposed change would create/resolve conflicts
function checkProposedResourceChange(
  initiative: Initiative,
  newStartDate: Date,
  newEndDate: Date,
  requirements: InitiativeResourceRequirement[],
  existingAllocations: ResourceAllocation[],
  pools: ResourcePool[]
): { newConflicts: ResourceConflict[]; resolvedConflicts: ResourceConflict[] };
```

### 10. Unified Consequence Engine

- [ ] Create `src/lib/consequenceEngine.ts`:

```typescript
interface ConsequenceReport {
  dependencyViolations: DependencyViolation[];
  constraintViolations: ConstraintViolation[];
  resourceConflicts: ResourceConflict[];
  cascadingChanges: Map<string, { newStartDate: Date; newEndDate: Date }>;
  hasHardViolations: boolean;
  hasSoftViolations: boolean;
}

// Comprehensive check for any change
function evaluateChange(
  initiative: Initiative,
  newStartDate: Date,
  newEndDate: Date,
  context: {
    initiatives: Initiative[];
    dependencies: InitiativeDependency[];
    constraints: Constraint[];
    requirements: InitiativeResourceRequirement[];
    pools: ResourcePool[];
  }
): ConsequenceReport;
```

### 11. Coupling Modes

- [ ] Create `src/stores/settingsStore.ts` or add to appStore:
  - `couplingMode: 'locked' | 'unlocked' | 'guided'`
  - Action to change mode

- [ ] Create `src/components/ui/CouplingModeSelector.tsx`:
  - Toggle between three modes
  - Tooltip explaining each mode

- [ ] Add to TimelineToolbar

### 12. Apply Coupling Logic

- [ ] Update `useTimelineMutations.ts`:
  - **Locked mode**: Automatically apply cascading changes
  - **Unlocked mode**: Just move the one initiative, show violations
  - **Guided mode**: Show dialog asking whether to cascade

- [ ] Create `src/features/timeline/CascadeDialog.tsx`:
  - Shows proposed cascading changes
  - Lists affected initiatives
  - "Apply All" / "Apply Just This One" / "Cancel"

### 13. Visual Feedback on Timeline

- [ ] Update TimelineBar to show violation status:
  - Red border/glow for hard violations
  - Amber border for soft violations
  - Normal appearance when valid

- [ ] Create `src/features/timeline/DependencyLines.tsx`:
  - Draw lines/arrows between dependent initiatives
  - Colour indicates if dependency is satisfied (green) or violated (red)
  - Toggle visibility from toolbar

- [ ] Update drag preview:
  - During drag, show dependency lines updating
  - Flash related initiatives
  - Show violation preview before drop

### 14. Consequence Panel

- [ ] Create `src/features/timeline/ConsequencePanel.tsx`:
  - Panel that appears during/after drag
  - Shows violations that would result
  - Grouped by type (dependencies, constraints, resources)
  - Clear visual severity (hard vs soft)
  - Links to affected items

- [ ] Can be docked or floating
- [ ] Dismissable, or auto-dismisses after action

### 15. Real-time Updates

- [ ] Ensure consequence calculations run efficiently
- [ ] Debounce during continuous drag
- [ ] Cache calculations where possible
- [ ] Background recalculation when data changes

---

## Acceptance Criteria

- [ ] Can add/edit/remove dependencies between initiatives
- [ ] Can link constraints to initiatives
- [ ] Can add resource requirements to initiatives
- [ ] Moving an initiative shows dependency violations
- [ ] Moving an initiative shows constraint violations
- [ ] Resource over-allocation is calculated and shown
- [ ] Coupling mode selector is visible and functional
- [ ] Locked mode cascades changes automatically
- [ ] Unlocked mode shows violations without preventing action
- [ ] Guided mode asks before cascading
- [ ] Dependency lines can be shown on timeline
- [ ] Violated initiatives are visually distinct
- [ ] Consequence panel shows clear summary of issues
- [ ] Performance remains acceptable with complex dependencies

---

## File Checklist

New files in this phase:

```
src/
├── lib/
│   ├── dependencyEngine.ts
│   ├── constraintEngine.ts
│   ├── resourceEngine.ts
│   └── consequenceEngine.ts
├── stores/
│   └── settingsStore.ts (or update appStore.ts)
├── components/
│   └── ui/
│       └── CouplingModeSelector.tsx
├── features/
│   ├── initiatives/
│   │   ├── DependencyManager.tsx
│   │   ├── ConstraintManager.tsx
│   │   └── ResourceRequirementManager.tsx
│   └── timeline/
│       ├── DependencyLines.tsx
│       ├── ConsequencePanel.tsx
│       └── CascadeDialog.tsx
```

---

## Notes for Claude Code

- Keep engine calculations pure functions for testability
- Consider Web Workers if calculations become slow
- Use memoisation heavily - these functions will be called frequently
- The dependency graph could be cyclic - detect and handle gracefully
- For resource calculations, consider time periods as discrete buckets
- Hard violations should be visually unmissable, soft violations noticeable but not alarming
- Test with complex scenarios: 5+ level dependency chains, multiple resource conflicts
