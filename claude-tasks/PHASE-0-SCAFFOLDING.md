# Phase 0: Project Scaffolding

## Objective

Create the foundational project structure, configuration files, database schema, and initial UI shell for the Roadmap Planner application.

## Prerequisites

- None (this is the first phase)

## Context

Roadmap Planner is a standalone desktop application built with Tauri 2.0. It uses React for the frontend, SQLite for data storage, and will eventually use D3.js for visualisations. This phase establishes all the groundwork.

---

## Task List

### 1. Project Initialisation

- [ ] Create a new directory called `roadmap-planner`
- [ ] Initialise a new Tauri 2.0 project with React + TypeScript template
- [ ] Configure pnpm as the package manager
- [ ] Verify the project builds and runs

### 2. Package Configuration

- [ ] Update `package.json` with project metadata:
  - Name: `roadmap-planner`
  - Version: `0.1.0`
  - Description: `A visual planning workbench for enterprise and solution architects`

- [ ] Install core dependencies:
  ```bash
  pnpm add react@^18.3.0 react-dom@^18.3.0 zustand@^4.5.0 d3@^7.9.0 uuid@^10.0.0 date-fns@^3.6.0
  pnpm add -D @types/d3@^7.4.0 @types/uuid@^10.0.0
  ```

- [ ] Install Tauri SQL plugin:
  ```bash
  pnpm add @tauri-apps/plugin-sql@^2.0.0
  ```

- [ ] Install and configure Biome for linting:
  ```bash
  pnpm add -D @biomejs/biome@^1.8.0
  ```

- [ ] Install Tailwind CSS:
  ```bash
  pnpm add -D tailwindcss@^3.4.0 postcss@^8.4.0 autoprefixer@^10.4.0
  ```

- [ ] Install testing dependencies:
  ```bash
  pnpm add -D vitest@^2.0.0 @playwright/test@^1.45.0
  ```

### 3. Configuration Files

- [ ] Create `biome.json`:
```json
{
  "$schema": "https://biomejs.dev/schemas/1.8.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2 },
  "javascript": { "formatter": { "quoteStyle": "single", "semicolons": "always" } }
}
```

- [ ] Create `tailwind.config.js` with custom colours:
  - Primary colour palette (blues)
  - Lifecycle stage colours (discovery=purple, development=blue, production=green, sunset=amber, retired=gray)
  - Criticality colours (critical=red, high=orange, medium=yellow, low=green)

- [ ] Update `vite.config.ts`:
  - Add path alias `@/` pointing to `./src`
  - Configure for Tauri environment variables
  - Set dev server port to 1420

- [ ] Update `tsconfig.json`:
  - Enable strict mode
  - Add path mapping for `@/*`
  - Target ES2022

### 4. Tauri Configuration

- [ ] Update `src-tauri/tauri.conf.json`:
  - Product name: `Roadmap Planner`
  - Identifier: `com.roadmap-planner.app`
  - Window: 1400x900, min 1024x768
  - Enable SQL plugin with SQLite preload

- [ ] Update `src-tauri/Cargo.toml`:
  - Add `tauri-plugin-sql` with sqlite feature
  - Add `serde` and `serde_json`

### 5. Database Schema

- [ ] Create migration file at `src-tauri/src/db/migrations/001_initial_schema.sql`

The schema must include these tables:

**capabilities**
- id (TEXT PRIMARY KEY)
- name (TEXT NOT NULL)
- description (TEXT)
- type (TEXT: 'Business' or 'Technical')
- parent_id (FK to capabilities)
- colour (TEXT)
- sort_order (INTEGER)
- created_at, updated_at (TEXT)

**systems**
- id (TEXT PRIMARY KEY)
- name (TEXT NOT NULL)
- description (TEXT)
- owner (TEXT)
- vendor (TEXT)
- technology_stack (TEXT - JSON array)
- lifecycle_stage (TEXT: 'Discovery', 'Development', 'Production', 'Sunset', 'Retired')
- criticality (TEXT: 'Critical', 'High', 'Medium', 'Low')
- support_end_date (TEXT)
- extended_support_end_date (TEXT)
- capability_id (FK to capabilities)
- created_at, updated_at (TEXT)

**resource_pools**
- id (TEXT PRIMARY KEY)
- name (TEXT NOT NULL)
- description (TEXT)
- capacity_per_period (REAL)
- capacity_unit (TEXT: 'FTE', 'PersonDays', 'PersonMonths')
- period_type (TEXT: 'Month', 'Quarter', 'Year')
- colour (TEXT)
- created_at, updated_at (TEXT)

**resources**
- id (TEXT PRIMARY KEY)
- name (TEXT NOT NULL)
- role (TEXT)
- skills (TEXT - JSON array)
- availability (REAL)
- resource_pool_id (FK)
- start_date, end_date (TEXT)
- created_at, updated_at (TEXT)

**constraints**
- id (TEXT PRIMARY KEY)
- name (TEXT NOT NULL)
- description (TEXT)
- type (TEXT: 'Deadline', 'Budget', 'Resource', 'Dependency', 'Compliance', 'Other')
- hardness (TEXT: 'Hard', 'Soft')
- effective_date, expiry_date (TEXT)
- created_at, updated_at (TEXT)

**scenarios**
- id (TEXT PRIMARY KEY)
- name (TEXT NOT NULL)
- description (TEXT)
- type (TEXT: 'Timing', 'Budget', 'Resource', 'Scope', 'Risk')
- is_baseline (INTEGER)
- parent_scenario_id (FK to scenarios)
- created_at, updated_at (TEXT)

**initiatives**
- id (TEXT PRIMARY KEY)
- name (TEXT NOT NULL)
- description (TEXT)
- type (TEXT: 'Upgrade', 'Replacement', 'New', 'Decommission', 'Migration')
- status (TEXT: 'Proposed', 'Planned', 'InProgress', 'Complete', 'Cancelled')
- start_date, end_date (TEXT)
- effort_estimate (REAL)
- effort_uncertainty (TEXT: 'Low', 'Medium', 'High')
- cost_estimate (REAL)
- cost_uncertainty (TEXT)
- priority (TEXT: 'Must', 'Should', 'Could', 'Wont')
- scenario_id (FK)
- created_at, updated_at (TEXT)

**financial_periods**
- id (TEXT PRIMARY KEY)
- name (TEXT NOT NULL)
- type (TEXT: 'Year', 'Half', 'Quarter', 'Month')
- start_date, end_date (TEXT NOT NULL)
- budget_available (REAL)
- created_at, updated_at (TEXT)

**Relationship tables:**
- system_dependencies (source_system_id, target_system_id, dependency_type, criticality)
- system_initiatives (system_id, initiative_id, relationship_type)
- initiative_dependencies (predecessor_id, successor_id, dependency_type, lag_days)
- initiative_resource_requirements (initiative_id, resource_pool_id, effort_required, period_start, period_end)
- initiative_constraints (initiative_id, constraint_id)
- settings (key, value)

**Important:**
- Add CHECK constraints for enum values
- Create indexes on foreign keys and commonly queried columns
- Insert default baseline scenario: `INSERT INTO scenarios (id, name, description, is_baseline) VALUES ('baseline', 'Baseline', 'The current known state and committed plans', 1)`

### 6. TypeScript Types

- [ ] Create `src/lib/types.ts` with:
  - All enum types as TypeScript union types
  - Interfaces for all entities matching the database schema
  - Use camelCase for TypeScript properties (e.g., `lifecycleStage` not `lifecycle_stage`)
  - Export all types

### 7. Zustand Store

- [ ] Create `src/stores/appStore.ts`:
  - State for all entity arrays (systems, capabilities, initiatives, etc.)
  - UI state: activeScenarioId, selectedSystemId, selectedInitiativeId
  - Actions: initialise, setActiveScenario, selectSystem, selectInitiative
  - Initialise function should be async (will load from DB in Phase 1)

### 8. Initial UI Shell

- [ ] Create `src/styles/globals.css`:
  - Import Tailwind directives
  - Set default font to Inter/system-ui
  - Add utility classes: btn-primary, btn-secondary, input, label

- [ ] Create `src/components/layout/Sidebar.tsx`:
  - Navigation items: Systems, Capabilities, Initiatives, Resources, Scenarios, Settings
  - Active state highlighting
  - Application title at top

- [ ] Create `src/components/layout/MainCanvas.tsx`:
  - Header with view title and scenario selector
  - Zoom level dropdown (Quarter, Half Year, Year, 3 Years, 5 Years)
  - New Scenario button
  - Placeholder for timeline visualisation

- [ ] Update `src/App.tsx`:
  - Import and use Sidebar and MainCanvas
  - Call initialise on mount
  - Show loading state while initialising

- [ ] Update `src/main.tsx`:
  - Render App in StrictMode
  - Import global styles

### 9. Scripts

- [ ] Add scripts to `package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "test": "vitest",
    "test:e2e": "playwright test",
    "lint": "biome check .",
    "lint:fix": "biome check --apply .",
    "format": "biome format --write ."
  }
}
```

### 10. Documentation

- [ ] Create `README.md` with:
  - Project description
  - Feature overview
  - Technology stack
  - Prerequisites (Node.js 20+, pnpm, Rust)
  - Getting started instructions
  - Project structure overview

- [ ] Create `CONTRIBUTING.md` with basic contribution guidelines

- [ ] Create `LICENCE` file with MIT licence text

### 11. CI/CD

- [ ] Create `.github/workflows/ci.yml`:
  - Trigger on push and PR to main
  - Install pnpm and dependencies
  - Run lint
  - Run tests
  - Build application

---

## Acceptance Criteria

- [ ] `pnpm tauri dev` launches the application without errors
- [ ] Application window displays at correct size with title "Roadmap Planner"
- [ ] Sidebar navigation is visible and clickable
- [ ] Main canvas shows placeholder content
- [ ] SQLite database is created on first launch
- [ ] Database contains all tables from the schema
- [ ] Default baseline scenario exists in the database
- [ ] `pnpm lint` passes with no errors
- [ ] `pnpm test` runs (even if no tests yet)
- [ ] Application builds for release without errors

---

## File Checklist

After completing this phase, these files should exist:

```
roadmap-planner/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   └── db/
│   │       └── migrations/
│   │           └── 001_initial_schema.sql
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── icons/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       └── MainCanvas.tsx
│   ├── stores/
│   │   └── appStore.ts
│   ├── lib/
│   │   └── types.ts
│   └── styles/
│       └── globals.css
├── .github/
│   └── workflows/
│       └── ci.yml
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── biome.json
├── README.md
├── CONTRIBUTING.md
├── LICENCE
└── .gitignore
```

---

## Notes for Claude Code

- Use Tauri 2.0 APIs, not Tauri 1.x
- The SQL plugin has changed in Tauri 2.0 - use `@tauri-apps/plugin-sql`
- SQLite database should be stored in the app data directory
- All timestamps should use ISO 8601 format
- Generate UUIDs using the `uuid` package, not crypto.randomUUID
