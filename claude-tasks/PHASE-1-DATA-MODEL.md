# Phase 1: Data Model Implementation

## Objective

Implement CRUD operations for all entities, create data entry forms, and establish the database access layer through Tauri commands.

## Prerequisites

- Phase 0 complete
- Application launches successfully
- Database schema is in place
- TypeScript types are defined

## Context

This phase makes the application functional for data entry. Users will be able to create, read, update, and delete all core entities. The focus is on solid data management rather than visualisation.

---

## Task List

### 1. Database Access Layer (Rust)

- [ ] Create `src-tauri/src/db/mod.rs`:
  - Database connection management
  - Migration runner
  - Helper functions for common operations

- [ ] Create `src-tauri/src/commands/mod.rs` with Tauri commands for each entity:

**Capabilities Commands:**
- [ ] `get_capabilities()` - returns all capabilities
- [ ] `get_capability(id: String)` - returns single capability
- [ ] `create_capability(capability: Capability)` - creates new capability
- [ ] `update_capability(capability: Capability)` - updates existing
- [ ] `delete_capability(id: String)` - deletes capability

**Systems Commands:**
- [ ] `get_systems()` - returns all systems
- [ ] `get_system(id: String)` - returns single system
- [ ] `get_systems_by_capability(capability_id: String)` - filtered list
- [ ] `create_system(system: System)` - creates new system
- [ ] `update_system(system: System)` - updates existing
- [ ] `delete_system(id: String)` - deletes system

**Initiatives Commands:**
- [ ] `get_initiatives(scenario_id: Option<String>)` - returns initiatives for scenario
- [ ] `get_initiative(id: String)` - returns single initiative
- [ ] `create_initiative(initiative: Initiative)` - creates new initiative
- [ ] `update_initiative(initiative: Initiative)` - updates existing
- [ ] `delete_initiative(id: String)` - deletes initiative

**Resource Pools Commands:**
- [ ] `get_resource_pools()` - returns all resource pools
- [ ] `get_resource_pool(id: String)` - returns single pool
- [ ] `create_resource_pool(pool: ResourcePool)` - creates new pool
- [ ] `update_resource_pool(pool: ResourcePool)` - updates existing
- [ ] `delete_resource_pool(id: String)` - deletes pool

**Resources Commands:**
- [ ] `get_resources(pool_id: Option<String>)` - returns resources, optionally filtered
- [ ] `get_resource(id: String)` - returns single resource
- [ ] `create_resource(resource: Resource)` - creates new resource
- [ ] `update_resource(resource: Resource)` - updates existing
- [ ] `delete_resource(id: String)` - deletes resource

**Scenarios Commands:**
- [ ] `get_scenarios()` - returns all scenarios
- [ ] `get_scenario(id: String)` - returns single scenario
- [ ] `create_scenario(scenario: Scenario)` - creates new scenario
- [ ] `update_scenario(scenario: Scenario)` - updates existing
- [ ] `delete_scenario(id: String)` - deletes scenario (cannot delete baseline)

**Constraints Commands:**
- [ ] `get_constraints()` - returns all constraints
- [ ] `get_constraint(id: String)` - returns single constraint
- [ ] `create_constraint(constraint: Constraint)` - creates new constraint
- [ ] `update_constraint(constraint: Constraint)` - updates existing
- [ ] `delete_constraint(id: String)` - deletes constraint

**Financial Periods Commands:**
- [ ] `get_financial_periods()` - returns all periods
- [ ] `create_financial_period(period: FinancialPeriod)` - creates new period
- [ ] `update_financial_period(period: FinancialPeriod)` - updates existing
- [ ] `delete_financial_period(id: String)` - deletes period

- [ ] Register all commands in `src-tauri/src/main.rs`

### 2. Frontend Database Hooks

- [ ] Create `src/lib/db.ts`:
  - Wrapper functions that call Tauri commands
  - Type-safe interfaces matching Rust commands
  - Error handling and transformation

Example structure:
```typescript
import { invoke } from '@tauri-apps/api/core';
import type { System, Capability } from './types';

export const db = {
  systems: {
    getAll: () => invoke<System[]>('get_systems'),
    get: (id: string) => invoke<System>('get_system', { id }),
    create: (system: Omit<System, 'id' | 'createdAt' | 'updatedAt'>) => 
      invoke<System>('create_system', { system }),
    update: (system: System) => invoke<System>('update_system', { system }),
    delete: (id: string) => invoke<void>('delete_system', { id }),
  },
  // ... similar for other entities
};
```

### 3. Update Zustand Store

- [ ] Update `src/stores/appStore.ts`:
  - Add loading states for each entity type
  - Add error state
  - Implement `initialise` to load all data from database
  - Add CRUD actions that call db functions and update local state
  - Ensure state updates are optimistic where appropriate

### 4. UI Components - Shared

- [ ] Create `src/components/ui/Button.tsx`:
  - Primary, secondary, danger variants
  - Size variants (sm, md, lg)
  - Loading state with spinner
  - Disabled state

- [ ] Create `src/components/ui/Input.tsx`:
  - Text input with label
  - Error state and message
  - Optional description text

- [ ] Create `src/components/ui/Select.tsx`:
  - Dropdown select with label
  - Support for enum options
  - Error state

- [ ] Create `src/components/ui/TextArea.tsx`:
  - Multi-line text input
  - Character count (optional)

- [ ] Create `src/components/ui/DatePicker.tsx`:
  - Date input with calendar
  - Optional time selection
  - Clear button

- [ ] Create `src/components/ui/Modal.tsx`:
  - Overlay modal component
  - Close on escape and backdrop click
  - Header, body, footer sections
  - Size variants

- [ ] Create `src/components/ui/ConfirmDialog.tsx`:
  - Confirmation modal for destructive actions
  - Configurable title, message, confirm text

- [ ] Create `src/components/ui/Badge.tsx`:
  - Small label for status, type, etc.
  - Colour variants matching lifecycle/criticality

- [ ] Create `src/components/ui/EmptyState.tsx`:
  - Placeholder for empty lists
  - Icon, title, description, action button

### 5. Feature: Systems

- [ ] Create `src/features/systems/SystemsList.tsx`:
  - Table view of all systems
  - Columns: Name, Capability, Lifecycle, Criticality, Support End Date
  - Sort by any column
  - Filter by capability, lifecycle stage
  - Click row to select
  - Add button opens form

- [ ] Create `src/features/systems/SystemForm.tsx`:
  - Form for create/edit
  - Fields: name, description, owner, vendor, technology_stack (tag input), lifecycle_stage, criticality, support_end_date, extended_support_end_date, capability_id
  - Validation: name required
  - Save and Cancel buttons

- [ ] Create `src/features/systems/SystemDetail.tsx`:
  - Detail view of selected system
  - All attributes displayed
  - Edit and Delete buttons
  - Show related initiatives (placeholder for now)

### 6. Feature: Capabilities

- [ ] Create `src/features/capabilities/CapabilitiesList.tsx`:
  - Tree view showing hierarchy
  - Expand/collapse nodes
  - Colour indicator
  - Count of systems in each capability
  - Add button (child or root level)

- [ ] Create `src/features/capabilities/CapabilityForm.tsx`:
  - Form for create/edit
  - Fields: name, description, type (Business/Technical), parent_id (dropdown), colour (colour picker)
  - Validation: name required

### 7. Feature: Initiatives

- [ ] Create `src/features/initiatives/InitiativesList.tsx`:
  - Table view filtered by active scenario
  - Columns: Name, Type, Status, Start Date, End Date, Priority, Cost
  - Sort and filter
  - Add button

- [ ] Create `src/features/initiatives/InitiativeForm.tsx`:
  - Form for create/edit
  - Fields: name, description, type, status, start_date, end_date, effort_estimate, effort_uncertainty, cost_estimate, cost_uncertainty, priority
  - Date validation (end after start)
  - Effort and cost can be ranges based on uncertainty

- [ ] Create `src/features/initiatives/InitiativeDetail.tsx`:
  - Detail view
  - Show linked systems (with ability to add/remove)
  - Show dependencies (placeholder)
  - Show resource requirements (placeholder)

### 8. Feature: Resources

- [ ] Create `src/features/resources/ResourcePoolsList.tsx`:
  - List of resource pools
  - Show name, capacity, member count
  - Expand to see members

- [ ] Create `src/features/resources/ResourcePoolForm.tsx`:
  - Form for create/edit pool
  - Fields: name, description, capacity_per_period, capacity_unit, period_type, colour

- [ ] Create `src/features/resources/ResourceForm.tsx`:
  - Form for create/edit individual resource
  - Fields: name, role, skills (tag input), availability (percentage), resource_pool_id, start_date, end_date

### 9. Feature: Scenarios

- [ ] Create `src/features/scenarios/ScenariosList.tsx`:
  - List of all scenarios
  - Highlight baseline
  - Show type, description
  - Click to switch active scenario

- [ ] Create `src/features/scenarios/ScenarioForm.tsx`:
  - Form for create/edit
  - Fields: name, description, type
  - Cannot edit baseline name

- [ ] Update MainCanvas header:
  - Dropdown to select active scenario
  - "New Scenario" button opens form
  - Visual indicator when not on baseline

### 10. Feature: Settings

- [ ] Create `src/features/settings/SettingsPage.tsx`:
  - Financial periods management
  - Add/edit/delete periods
  - Display in timeline order

- [ ] Create `src/features/settings/FinancialPeriodForm.tsx`:
  - Form for financial periods
  - Fields: name, type, start_date, end_date, budget_available

### 11. Navigation Integration

- [ ] Update Sidebar to actually navigate between features
- [ ] Create a simple routing mechanism (state-based, not URL-based)
- [ ] Update MainCanvas to render the appropriate feature based on navigation

### 12. Data Validation

- [ ] Create `src/lib/validation.ts`:
  - Validation functions for each entity
  - Return array of error messages
  - Check required fields, date logic, numeric ranges

### 13. Error Handling

- [ ] Create `src/components/ui/Toast.tsx`:
  - Toast notification component
  - Success, error, warning, info variants
  - Auto-dismiss after timeout
  - Manual dismiss

- [ ] Create toast store or integrate with app store
- [ ] Show toasts on successful create/update/delete
- [ ] Show toasts on errors

---

## Acceptance Criteria

- [ ] Can create, view, edit, and delete capabilities
- [ ] Can create, view, edit, and delete systems
- [ ] Systems can be assigned to capabilities
- [ ] Can create, view, edit, and delete initiatives
- [ ] Can create, view, edit, and delete resource pools
- [ ] Can create, view, edit, and delete resources within pools
- [ ] Can create, view, and delete scenarios (not baseline)
- [ ] Can switch active scenario
- [ ] Can create and manage financial periods
- [ ] Form validation prevents invalid data
- [ ] Toast notifications confirm actions
- [ ] Data persists after application restart
- [ ] Navigation between features works correctly

---

## File Checklist

New files in this phase:

```
src/
├── lib/
│   ├── db.ts
│   └── validation.ts
├── components/
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── TextArea.tsx
│       ├── DatePicker.tsx
│       ├── Modal.tsx
│       ├── ConfirmDialog.tsx
│       ├── Badge.tsx
│       ├── EmptyState.tsx
│       └── Toast.tsx
├── features/
│   ├── systems/
│   │   ├── SystemsList.tsx
│   │   ├── SystemForm.tsx
│   │   └── SystemDetail.tsx
│   ├── capabilities/
│   │   ├── CapabilitiesList.tsx
│   │   └── CapabilityForm.tsx
│   ├── initiatives/
│   │   ├── InitiativesList.tsx
│   │   ├── InitiativeForm.tsx
│   │   └── InitiativeDetail.tsx
│   ├── resources/
│   │   ├── ResourcePoolsList.tsx
│   │   ├── ResourcePoolForm.tsx
│   │   └── ResourceForm.tsx
│   ├── scenarios/
│   │   ├── ScenariosList.tsx
│   │   └── ScenarioForm.tsx
│   └── settings/
│       ├── SettingsPage.tsx
│       └── FinancialPeriodForm.tsx
src-tauri/src/
├── db/
│   └── mod.rs
└── commands/
    └── mod.rs
```

---

## Notes for Claude Code

- Use `invoke` from `@tauri-apps/api/core` (Tauri 2.0)
- JSON fields (technology_stack, skills) should be stored as JSON strings in SQLite
- Parse JSON fields when reading, stringify when writing
- Generate UUIDs on the frontend before sending to backend
- Use ISO 8601 date strings (YYYY-MM-DD) for date fields
- The baseline scenario should not be deletable - add check in Rust command
- Consider using React Hook Form for form management if complexity grows
