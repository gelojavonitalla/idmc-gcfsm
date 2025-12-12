# Coding Standards

> **Purpose:** Establish consistent coding practices across the codebase

## Table of Contents

1. [General Principles](#general-principles)
2. [TypeScript Standards](#typescript-standards)
3. [Error Handling Patterns](#error-handling-patterns)
4. [Backend Standards](#backend-standards)
5. [Frontend (React) Standards](#frontend-react-standards)
6. [Security Best Practices](#security-best-practices)
7. [Audit & Logging Standards](#audit--logging-standards)
8. [Testing Standards](#testing-standards)
9. [Documentation Requirements](#documentation-requirements)

---

## General Principles

### Code Organization

- **Feature-Based Structure**: Organize code by feature, not by technical layer.
  This makes changes and reviews easier and keeps related tests/docs nearby.

- **Separation of Concerns**:
  - UI components SHOULD NOT call databases or APIs directly.
  - Business logic must live in service layers.
  - Shared utilities live under `packages/*` or `@shared/` packages.

- **DRY (Don't Repeat Yourself)**: Extract reusable logic into shared libraries.

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables & functions | camelCase | `getUserById` |
| Types & interfaces | PascalCase | `UserProfile` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| React components | PascalCase | `LoginForm.tsx` |
| Utilities/services | camelCase | `authService.ts` |
| Directories | kebab-case | `user-profile/` |

---

## TypeScript Standards

- Use `strict` TypeScript compiler options.
- Prefer `unknown` over `any` when input type is uncertain; narrow before use.
- Use `readonly` and `as const` for constants and fixed lists.
- Prefer `type` for unions and `interface` for object shapes.

Example - prefer explicit typing and avoid `any`:

```typescript
try {
  // risky operation
} catch (e: unknown) {
  const em = e instanceof Error ? e.message : String(e);
  logger.error("Operation failed", { error: em });
}
```

---

## Error Handling Patterns

### Goals

- Fail fast and validate inputs.
- Surface user-friendly messages for user-facing flows.
- Preserve actionable diagnostic context in structured logs.
- Use typed errors for known failure modes.

### Principles

- Do not swallow errors silently. Always log unexpected errors with context.
- For backend APIs, use structured error codes/responses.
- For async frontend actions, map backend codes to friendly messages.

### Standard Error Codes

| Code | HTTP | Use Case |
|------|------|----------|
| `invalid-argument` | 400 | Validation failures (bad/missing inputs) |
| `unauthenticated` | 401 | Caller not authenticated |
| `permission-denied` | 403 | Authorization missing |
| `not-found` | 404 | Requested resource missing |
| `already-exists` | 409 | Duplicate resource attempted |
| `failed-precondition` | 412 | Business preconditions not met |
| `aborted` | 409 | Concurrent-modification / transaction conflicts |
| `resource-exhausted` | 429 | Rate limits / quotas |
| `internal` | 500 | Unknown/unexpected server errors |

### Common Patterns

#### 1) Wrap unknown errors before returning to callers

```typescript
try {
  // do work
} catch (e: unknown) {
  if (e instanceof AppError) throw e; // pass through known errors
  const em = e instanceof Error ? e.message : String(e);
  logger.error("myFn: unexpected error", { error: em });
  throw new AppError("internal", "Internal server error");
}
```

#### 2) Frontend: convert codes to friendly text

```typescript
function userFriendlyMessage(code?: string, fallback?: string) {
  switch (code) {
    case "permission-denied": return "You don't have permission to perform this action.";
    case "unauthenticated": return "Please sign in to continue.";
    case "invalid-argument": return "Invalid input. Please check the form and try again.";
    default: return fallback ?? "An unexpected error occurred. Please try again.";
  }
}
```

#### 3) Idempotency and retry guidance

- For webhooks, design idempotent handlers (use dedupe key). Return 200 for duplicate requests.
- For transient failures, implement exponential backoff with jitter.

---

## Backend Standards

### Key Expectations

- Every API endpoint MUST have a descriptive header with purpose, input/output, and security notes.
- Validate `req.auth` / session before processing.
- Audit administrative actions with structured metadata.

### Example API Handler

```typescript
/**
 * updateUserRoles
 * -----------------------------------------------------------------------------
 * Purpose: Update role(s) for a user.
 * Inputs: { userId: string, roles: string[] }
 * Outputs: { ok: true, roles: string[] }
 */
export async function updateUserRoles(req: AuthenticatedRequest) {
  if (!req.user?.id) throw new AppError("unauthenticated", "Sign in required");

  const { userId, roles } = req.body as { userId?: string; roles?: string[] };
  if (!userId || !Array.isArray(roles)) {
    throw new AppError("invalid-argument", "userId and roles are required");
  }

  try {
    await db.user.update({ where: { id: userId }, data: { roles } });

    await auditLog({
      action: "user.roles_updated",
      actorId: req.user.id,
      meta: { userId, roles }
    });

    return { ok: true, roles };
  } catch (e: unknown) {
    if (e instanceof AppError) throw e;
    const em = e instanceof Error ? e.message : String(e);
    logger.error("updateUserRoles: unexpected", { error: em, userId });
    throw new AppError("internal", "Failed to update roles");
  }
}
```

---

## Frontend (React) Standards

- Use `ErrorBoundary` for top-level UI crash isolation.
- For async UI flows, present clear loading/empty/error states.
- Never fail silently - always show feedback to the user.
- Map backend error codes to user-facing strings.

---

## Security Best Practices

- Validate inputs at the boundary and escape/sanitize user-provided strings.
- Always verify authentication and authorization on the backend.
- Never log raw PII or secrets; mask or omit sensitive fields.
- Follow OWASP Top 10 guidelines (prevent XSS, SQL injection, CSRF, etc.)
- Use parameterized queries / ORM methods - never concatenate user input into queries.

---

## Audit & Logging Standards

- Logs MUST be structured JSON with stable keys for filtering.
- Use log levels consistently: `error` / `warn` / `info` / `debug`.
- Include context: `userId` (masked if needed), `action`, `requestId`.

Example:

```typescript
logger.info("user.created", { userId, actorId: req.user?.id });
```

---

## Testing Standards

- **Unit tests**: Pure business logic and utilities.
- **Integration tests**: API endpoints with test database.
- **E2E tests**: Critical user flows (login, checkout, etc.)

---

## Documentation Requirements

All exported functions MUST include JSDoc with:

- A short description
- `@param` for each parameter
- `@returns` describing the return value
- `@throws` for expected error conditions

Example:

```typescript
/**
 * Fetch user by ID
 *
 * @param userId - The unique identifier of the user
 * @returns User object if found
 * @throws {AppError} "not-found" when user doesn't exist
 */
export async function getUserById(userId: string): Promise<User> {
  // implementation
}
```

---

## Code Review Checklist

- [ ] No `any` types; prefer `unknown` then narrow
- [ ] Proper error handling with typed errors
- [ ] All public exports have JSDoc
- [ ] Admin actions audited
- [ ] Sensitive fields masked in logs
- [ ] Input validation at boundaries

---

## Conformance

- Run `pnpm lint` locally and address warnings.
- Run `pnpm typecheck` before committing.
- All tests must pass before merge.
