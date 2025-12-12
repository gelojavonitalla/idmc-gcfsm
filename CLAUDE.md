# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

<!-- Customize: Brief description of your project -->

## Essential Commands

### Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm run dev
```

### Testing

```bash
# Linting & type checking
pnpm run lint                     # ESLint across all code
pnpm run lint:fix                 # Auto-fix lint issues
pnpm run typecheck                # TypeScript type check

# Unit tests
pnpm run test                     # All tests
pnpm run test:coverage            # With coverage report

# E2E tests (if applicable)
pnpm run test:e2e
```

### Building

```bash
pnpm run build
```

## Development Patterns

### Implementation Workflow (CRITICAL)

After ANY code changes, ALWAYS run in this order:

1. `pnpm run lint` (or `lint:fix`) — Must pass with zero errors
2. `pnpm run typecheck` — Must pass with zero errors
3. `pnpm run test` — All tests must pass
4. `pnpm run build` — Build must succeed

**NEVER mark implementation complete without running all four verification steps.**

### Code Quality Rules

All functions/components must:

- Include JSDoc header with purpose, inputs, outputs
- Validate inputs and handle errors appropriately
- Use proper error codes/messages
- Remove unused variables/parameters entirely (don't prefix with `_`)

### Magic Strings

NEVER use magic strings. Always use constants for:

- Collection/table names
- Route paths
- Configuration keys
- Error codes

```typescript
// ✅ CORRECT - Use constants
import { COLLECTIONS } from '@/constants';
const usersRef = db.collection(COLLECTIONS.USERS);

// ❌ WRONG - Magic strings
const usersRef = db.collection("users");
```

### Import Path Conventions

<!-- Customize based on your project structure -->

```typescript
// Shared utilities
import { ... } from '@/lib/...';

// Components
import { ... } from '@/components/...';

// Types
import type { ... } from '@/types';
```

### Testing Patterns

- **Test file location:** Co-locate with source or in `__tests__` directories
- **Test file naming:** Match the file being tested (e.g., `utils.ts` → `utils.test.ts`)

## Critical Development Notes

### Package Manager

Always use `pnpm`. Using `npm` or `yarn` may break dependency linking in monorepos.

### Node Version

<!-- Customize: Specify your required Node version -->

Node.js v20+ required. Use nvm if needed:

```bash
nvm use 20
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure required variables.

## Common Workflows

### Creating a Pull Request

1. Branch from `develop` (or `main`): `git checkout -b feature/description`
2. Make changes, ensuring lint and typecheck pass
3. Run relevant tests
4. Push and create PR
5. Wait for CI checks to pass
6. Address review feedback

## Troubleshooting

### `pnpm install` fails

Try clearing the cache:

```bash
pnpm store prune
rm -rf node_modules
pnpm install
```

### Type errors in imports

Rebuild shared packages if using a monorepo:

```bash
pnpm -C packages/shared build
```

### Test imports failing

Check `jest.config.js` or `vitest.config.ts` module name mapper includes all necessary path aliases.
