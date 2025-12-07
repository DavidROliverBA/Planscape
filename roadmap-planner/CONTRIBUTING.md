# Contributing to Roadmap Planner

Thank you for your interest in contributing to Roadmap Planner!

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `pnpm install`
3. Run the development server: `pnpm tauri dev`

## Code Style

This project uses Biome for linting and formatting. Before committing:

```bash
pnpm lint:fix
pnpm format
```

## Commit Messages

Use conventional commit format:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all tests pass: `pnpm test`
4. Ensure linting passes: `pnpm lint`
5. Submit a pull request

## Reporting Issues

Please use GitHub Issues to report bugs or request features. Include:

- Clear description of the issue
- Steps to reproduce (for bugs)
- Expected vs actual behaviour
- Screenshots if applicable

## Licence

By contributing, you agree that your contributions will be licensed under the MIT Licence.
