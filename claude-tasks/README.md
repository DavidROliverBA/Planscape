# Roadmap Planner - Claude Code Build Tasks

This directory contains task specifications for building the Roadmap Planner application using Claude Code.

## Overview

Roadmap Planner is a visual planning workbench for enterprise and solution architects. It allows architects to see their technology landscape across time, manipulate scenarios, and understand the consequences of planning decisions.

## Technology Stack

| Component | Technology |
|-----------|------------|
| Application Shell | Tauri 2.0 |
| Frontend | React 18 + TypeScript |
| State Management | Zustand |
| Visualisation | D3.js v7 |
| Database | SQLite |
| Styling | Tailwind CSS |
| Build Tool | Vite |
| Testing | Vitest + Playwright |
| Package Manager | pnpm |
| Linting | Biome |

## Build Phases

Execute these phases in order. Each phase builds on the previous one.

| Phase | Task File | Description |
|-------|-----------|-------------|
| 0 | [PHASE-0-SCAFFOLDING.md](./PHASE-0-SCAFFOLDING.md) | Project setup, configuration, database schema |
| 1 | [PHASE-1-DATA-MODEL.md](./PHASE-1-DATA-MODEL.md) | CRUD operations, forms, data access layer |
| 2 | [PHASE-2-TIMELINE-VIEW.md](./PHASE-2-TIMELINE-VIEW.md) | First visualisation with D3.js |
| 3 | [PHASE-3-CONSEQUENCE-ENGINE.md](./PHASE-3-CONSEQUENCE-ENGINE.md) | Dependencies, constraints, resource calculations |
| 4 | [PHASE-4-SCENARIOS.md](./PHASE-4-SCENARIOS.md) | Scenario branching, switching, comparing |
| 5 | [PHASE-5-ADDITIONAL-VIEWS.md](./PHASE-5-ADDITIONAL-VIEWS.md) | Resource heatmap, cost profile, dependency graph |
| 6 | [PHASE-6-IMPORT-EXPORT.md](./PHASE-6-IMPORT-EXPORT.md) | File import, visual export |
| 7 | [PHASE-7-AI-FEATURES.md](./PHASE-7-AI-FEATURES.md) | Claude API integration, natural language queries |

## How to Use These Files

1. Start with Phase 0 and work through sequentially
2. Each phase file contains:
   - Objective and context
   - Prerequisites (what must be complete before starting)
   - Detailed task list with checkboxes
   - Acceptance criteria
   - File paths and code snippets where helpful
3. Complete all tasks in a phase before moving to the next
4. Run tests after each phase to verify functionality

## Design Principles

Keep these principles in mind throughout development:

1. **Thinking tool, not presentation tool** - Optimise for exploration speed
2. **Multiple views, one data model** - Enter once, visualise many ways
3. **Bidirectional manipulation** - View changes update data
4. **Show consequences, don't block** - Respect architect judgement
5. **Flexible coupling** - Let users choose connection behaviour
6. **Exportable visuals** - Any view can be exported
7. **Scales across horizons** - Quarters to decades

## Repository Structure

After Phase 0, the repository will have this structure:

```
roadmap-planner/
├── src-tauri/                  # Tauri backend (Rust)
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   ├── db/
│   │   └── commands/
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                        # React frontend
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   ├── features/
│   ├── stores/
│   ├── hooks/
│   ├── lib/
│   └── styles/
├── tests/
├── .github/workflows/
├── package.json
└── README.md
```
