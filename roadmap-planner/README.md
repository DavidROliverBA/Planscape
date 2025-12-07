# Roadmap Planner

A visual planning workbench for enterprise and solution architects.

## Overview

Roadmap Planner helps architects see their technology landscape across time, manipulate scenarios, and understand the consequences of planning decisions. It's designed as a thinking tool optimised for exploration rather than presentation.

## Features

- **Timeline Visualisation**: See initiatives across time, grouped by capability
- **Scenario Management**: Create and compare what-if scenarios
- **Dependency Tracking**: Understand system and initiative dependencies
- **Resource Planning**: Visualise resource allocation across time
- **Consequence Engine**: See the impact of changes without blocking actions
- **Multiple Views**: Timeline, resource heatmap, cost profile, dependency graph

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

## Prerequisites

- Node.js 20 or later
- pnpm 8 or later
- Rust 1.70 or later (for Tauri)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/roadmap-planner.git
   cd roadmap-planner
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run in development mode:
   ```bash
   pnpm tauri dev
   ```

4. Build for production:
   ```bash
   pnpm tauri build
   ```

## Project Structure

```
roadmap-planner/
├── src/                        # React frontend
│   ├── components/             # Reusable UI components
│   │   └── layout/            # Layout components
│   ├── features/              # Feature-specific components
│   ├── stores/                # Zustand state stores
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities and types
│   └── styles/                # Global styles
├── src-tauri/                 # Tauri backend (Rust)
│   ├── src/
│   │   ├── db/               # Database layer
│   │   │   └── migrations/   # SQL migrations
│   │   └── commands/         # Tauri command handlers
│   ├── Cargo.toml
│   └── tauri.conf.json
├── tests/                     # E2E tests
└── .github/workflows/         # CI/CD
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Vite dev server |
| `pnpm build` | Build frontend for production |
| `pnpm tauri dev` | Run Tauri in development mode |
| `pnpm tauri build` | Build Tauri application |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run end-to-end tests |
| `pnpm lint` | Check code with Biome |
| `pnpm lint:fix` | Fix linting issues |
| `pnpm format` | Format code with Biome |

## Design Principles

1. **Thinking tool, not presentation tool** - Optimised for exploration speed
2. **Multiple views, one data model** - Enter once, visualise many ways
3. **Bidirectional manipulation** - View changes update data
4. **Show consequences, don't block** - Respect architect judgement
5. **Flexible coupling** - Let users choose connection behaviour
6. **Exportable visuals** - Any view can be exported
7. **Scales across horizons** - Quarters to decades

## Licence

MIT - see [LICENCE](./LICENCE)
