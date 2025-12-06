# Phase 4: Scenarios

## Objective

Implement full scenario management: creating, switching, comparing, branching, and promoting scenarios. This enables "what if" exploration that is central to the tool's value.

## Prerequisites

- Phase 3 complete
- Consequence engine working
- Dependencies, constraints, and resources functional
- Timeline reflects changes correctly

## Context

Scenarios are like branches in version control. The baseline is the "main branch" representing current reality and committed plans. Users create scenarios to explore alternatives without affecting the baseline. They can compare scenarios and eventually promote a scenario to become the new baseline.

---

## Task List

### 1. Scenario Data Layer Enhancements

- [ ] Update scenario Tauri commands:
  - `create_scenario_from_baseline(name, description, type)` - copies all baseline initiatives
  - `create_scenario_from_scenario(source_id, name, description)` - branch from existing
  - `promote_scenario_to_baseline(scenario_id)` - replace baseline with scenario
  - `get_scenario_diff(scenario_id)` - compare to baseline

- [ ] Implement scenario data isolation:
  - When creating a scenario, copy all baseline initiatives
  - Each initiative copy gets the new scenario_id
  - Original baseline initiatives remain untouched

### 2. Scenario Creation Flow

- [ ] Update `src/features/scenarios/ScenarioForm.tsx`:
  - Add "Create from" option: Baseline or existing scenario
  - Add scenario type selector
  - Show what will be copied

- [ ] Create `src/features/scenarios/CreateScenarioWizard.tsx`:
  - Step 1: Name and description
  - Step 2: Type selection with explanation of each type
  - Step 3: Source selection (baseline or branch from scenario)
  - Step 4: Confirmation showing what will be created

### 3. Scenario Switching

- [ ] Update app store:
  - `activeScenarioId` state
  - `switchScenario(id)` action
  - Ensure all data queries filter by active scenario

- [ ] Update MainCanvas header:
  - Prominent scenario selector dropdown
  - Visual distinction when not on baseline (different colour, badge)
  - "Return to Baseline" quick action

- [ ] Update data loading:
  - When scenario changes, reload initiatives for that scenario
  - Maintain system/capability/resource data (shared across scenarios)
  - Show loading state during switch

### 4. Scenario Comparison View

- [ ] Create `src/features/scenarios/ScenarioComparison.tsx`:
  - Side-by-side comparison of two scenarios
  - Dropdown to select scenarios to compare
  - Always shows baseline on left by default

- [ ] Create `src/features/scenarios/ComparisonTimeline.tsx`:
  - Dual timeline view (split screen or overlay)
  - Initiatives that differ are highlighted
  - Matching initiatives shown in grey
  - Scrolling is synchronised

- [ ] Create `src/features/scenarios/ComparisonSummary.tsx`:
  - Summary of differences:
    - Initiatives added
    - Initiatives removed
    - Initiatives with changed dates
    - Initiatives with changed attributes
  - Total cost difference
  - Total effort difference
  - Resource utilisation comparison

### 5. Scenario Diff Calculation

- [ ] Create `src/lib/scenarioDiff.ts`:

```typescript
interface InitiativeDiff {
  initiativeId: string;
  baselineId?: string; // null if new in scenario
  scenarioId?: string; // null if removed in scenario
  changes: {
    field: string;
    baselineValue: any;
    scenarioValue: any;
  }[];
}

interface ScenarioDiff {
  added: Initiative[];
  removed: Initiative[];
  modified: InitiativeDiff[];
  totalCostDiff: number;
  totalEffortDiff: number;
  dateRangeChange: { start: Date; end: Date } | null;
}

function calculateScenarioDiff(
  baseline: Initiative[],
  scenario: Initiative[]
): ScenarioDiff;
```

### 6. Scenario Actions

- [ ] Create `src/features/scenarios/ScenarioActions.tsx`:
  - Dropdown or menu with scenario actions
  - Actions: Rename, Edit Description, Delete, Promote, Export

- [ ] Implement "Promote to Baseline":
  - Confirmation dialog warning this is irreversible
  - Shows what will change in baseline
  - Creates backup of current baseline (as archived scenario?)
  - Replaces baseline initiatives with scenario initiatives
  - Scenario is deleted after promotion
  - All other scenarios re-base from new baseline

- [ ] Implement "Delete Scenario":
  - Confirmation dialog
  - Cannot delete baseline
  - Cannot delete if other scenarios branch from it (or cascade delete)
  - Removes all initiatives in scenario

### 7. Scenario Branching

- [ ] Allow scenarios to branch from other scenarios (not just baseline)
- [ ] Track parent_scenario_id
- [ ] Show scenario tree/hierarchy in scenarios list
- [ ] Visual indication of branch relationships

### 8. Scenario Indicators Throughout UI

- [ ] Update all forms to show current scenario context
- [ ] When editing initiative, show which scenario it belongs to
- [ ] Prevent editing baseline initiatives when not on baseline
- [ ] Warning when making changes to non-baseline scenario

### 9. Quick Scenario Operations

- [ ] "Duplicate Initiative to Scenario":
  - Right-click initiative in timeline
  - Option to copy to different scenario
  - Useful for comparing specific changes

- [ ] "What If This Date":
  - Alt+drag to preview change without committing
  - Shows consequences panel
  - Option to create scenario with this change

### 10. Scenario Persistence

- [ ] Ensure scenarios save/load correctly
- [ ] Handle scenario_id foreign keys properly
- [ ] Clean up orphaned initiatives when scenario deleted

### 11. Scenario Naming and Organisation

- [ ] Encourage descriptive naming: "FY25 Early Start", "Budget Cut 20%"
- [ ] Add tags or categories to scenarios
- [ ] Sort scenarios by date, name, or type
- [ ] Filter scenarios list

### 12. Auto-save and Conflict Prevention

- [ ] All changes auto-save
- [ ] Single-user tool, but prevent issues with multiple windows
- [ ] Show "last saved" timestamp

---

## Acceptance Criteria

- [ ] Can create new scenario from baseline
- [ ] Can create new scenario branched from existing scenario
- [ ] Switching scenarios loads correct initiatives
- [ ] Timeline updates when scenario changes
- [ ] Clear visual indicator of active scenario
- [ ] Can compare two scenarios side by side
- [ ] Comparison shows differences clearly
- [ ] Can promote scenario to baseline
- [ ] Promoting scenario replaces baseline data correctly
- [ ] Can delete scenarios (not baseline)
- [ ] Scenario hierarchy/branching is visible
- [ ] Changes in scenario don't affect baseline until promoted
- [ ] All scenario operations persist correctly

---

## File Checklist

New files in this phase:

```
src/
├── lib/
│   └── scenarioDiff.ts
├── features/
│   └── scenarios/
│       ├── CreateScenarioWizard.tsx
│       ├── ScenarioActions.tsx
│       ├── ScenarioComparison.tsx
│       ├── ComparisonTimeline.tsx
│       └── ComparisonSummary.tsx
```

---

## Technical Notes

### Scenario Data Isolation

When a scenario is created from baseline:

```sql
-- Copy all baseline initiatives to new scenario
INSERT INTO initiatives (id, name, description, type, status, start_date, end_date, 
                         effort_estimate, cost_estimate, priority, scenario_id, ...)
SELECT uuid(), name, description, type, status, start_date, end_date,
       effort_estimate, cost_estimate, priority, 'new-scenario-id', ...
FROM initiatives
WHERE scenario_id = 'baseline';
```

### Initiative Matching for Diff

Since initiatives are copied, we need a way to match them across scenarios:
- Option 1: Store `source_initiative_id` when copying
- Option 2: Match by name within capability (risky if names change)
- Option 3: Create stable `initiative_ref` that's preserved across copies

Recommendation: Add `source_initiative_id` to track lineage.

### Promoting Scenarios

```sql
-- Start transaction
BEGIN;

-- Mark current baseline initiatives as 'archived' or delete
UPDATE initiatives SET scenario_id = 'archived-baseline-<timestamp>' WHERE scenario_id = 'baseline';

-- Move scenario initiatives to baseline
UPDATE initiatives SET scenario_id = 'baseline' WHERE scenario_id = '<promoting-scenario-id>';

-- Delete the now-empty scenario
DELETE FROM scenarios WHERE id = '<promoting-scenario-id>';

COMMIT;
```

---

## Notes for Claude Code

- Scenario isolation is critical - ensure no cross-contamination
- Test promotion thoroughly - it's destructive
- Consider what happens to dependencies/constraints when copying initiatives
- Resource requirements should also be copied with initiatives
- The comparison view is complex - consider using tabs rather than split screen
- Performance: copying many initiatives could be slow - consider progress indicator
