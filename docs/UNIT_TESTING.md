# Unit Testing Guide

**Purpose**: Comprehensive guidelines for writing unit tests. Follow these standards to ensure consistent, maintainable, and effective test coverage.

---

## Table of Contents

1. [Overview](#overview)
2. [Testing Framework & Tools](#testing-framework--tools)
3. [Project Structure](#project-structure)
4. [Testing Patterns](#testing-patterns)
5. [Do's and Don'ts](#dos-and-donts)
6. [Common Test Scenarios](#common-test-scenarios)
7. [Mocking Strategies](#mocking-strategies)
8. [Best Practices](#best-practices)

---

## Overview

### Why Unit Test?

Unit tests ensure:
- Functions behave correctly under various inputs
- Security rules are enforced (auth, RBAC)
- Edge cases and error conditions are handled
- Regression prevention during refactoring
- Documentation of expected behavior

### What to Test

✅ **Test These**:
- Authentication requirements
- Input validation
- Authorization (RBAC)
- Business logic and calculations
- Error handling and error messages
- Database operations (mocked)
- Audit logging calls
- Edge cases and boundary conditions

❌ **Don't Test These** (covered by integration/E2E tests):
- Actual database infrastructure
- Real database writes
- Email sending (test that queue is called)
- External API calls (mock them)
- Network latency

---

## Testing Framework & Tools

### Required Dependencies

```json
{
  "devDependencies": {
    "@jest/globals": "^29.x",
    "jest": "^29.x",
    "ts-jest": "^29.x",
    "@types/jest": "^29.x"
  }
}
```

### Jest Configuration

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.test.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
```

### Test File Naming Convention

```
src/
├── services/
│   ├── userService.ts           # Source file
│   └── __tests__/
│       └── userService.test.ts  # Test file
├── api/
│   ├── handlers/
│   │   ├── createUser.ts
│   │   └── __tests__/
│   │       └── createUser.test.ts
```

**Pattern**: `<fileName>.test.ts` in `__tests__/` directory

---

## Project Structure

### Test Organization

```
src/
├── __testutils__/              # Shared test utilities
│   ├── mockAuth.ts            # Auth context helpers
│   ├── mockDb.ts              # Database mock helpers
│   └── fixtures.ts            # Common test data
├── services/
│   └── __tests__/
├── api/
│   └── __tests__/
└── utils/
    └── __tests__/
```

---

## Testing Patterns

### Pattern 1: API Handler Test Structure

```typescript
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { createUser } from '../createUser';
import { mockAuthContext, mockUnauthContext } from '../../__testutils__/mockAuth';

describe('createUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test Group 1: Authentication
  describe('Authentication', () => {
    it('should throw unauthenticated error when no auth', async () => {
      await expect(
        createUser({ auth: mockUnauthContext(), data: {} })
      ).rejects.toThrow('unauthenticated');
    });
  });

  // Test Group 2: Input Validation
  describe('Input Validation', () => {
    it('should require email parameter', async () => {
      await expect(
        createUser({
          auth: mockAuthContext('test-uid'),
          data: { name: 'Test' }
        })
      ).rejects.toThrow('invalid-argument');
    });
  });

  // Test Group 3: Authorization
  describe('Authorization', () => {
    it('should allow admin to create user', async () => {
      // Test implementation
    });

    it('should deny unauthorized roles', async () => {
      // Test implementation
    });
  });

  // Test Group 4: Business Logic
  describe('Business Logic', () => {
    it('should create user with correct data', async () => {
      // Test implementation
    });

    it('should handle duplicate users', async () => {
      // Test implementation
    });
  });

  // Test Group 5: Error Handling
  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Test implementation
    });
  });
});
```

### Pattern 2: Service Function Test Structure

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { calculateTotal } from '../orderService';

describe('calculateTotal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Calculations', () => {
    it('should calculate total for single item', () => {
      const items = [{ price: 10, quantity: 2 }];
      expect(calculateTotal(items)).toBe(20);
    });

    it('should calculate total for multiple items', () => {
      const items = [
        { price: 10, quantity: 2 },
        { price: 5, quantity: 3 }
      ];
      expect(calculateTotal(items)).toBe(35);
    });
  });

  describe('Edge Cases', () => {
    it('should return 0 for empty array', () => {
      expect(calculateTotal([])).toBe(0);
    });

    it('should handle zero quantity', () => {
      const items = [{ price: 10, quantity: 0 }];
      expect(calculateTotal(items)).toBe(0);
    });
  });
});
```

### Pattern 3: Scheduled Job Test Structure

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { processQueue } from '../emailProcessor';
import { mockDb } from '../../__testutils__/mockDb';

describe('emailProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Queue Processing', () => {
    it('should process queued emails', async () => {
      const mockEmails = [
        { id: 'email-1', status: 'queued', to: 'test1@example.com' },
        { id: 'email-2', status: 'queued', to: 'test2@example.com' }
      ];

      mockDb.findMany.mockResolvedValue(mockEmails);

      await processQueue();

      expect(mockSendEmail).toHaveBeenCalledTimes(2);
    });

    it('should retry failed emails up to max attempts', async () => {
      // Test implementation
    });

    it('should mark emails as permanent_fail after max retries', async () => {
      // Test implementation
    });
  });
});
```

### Pattern 4: Webhook Test Structure

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { stripeWebhook } from '../stripeWebhook';
import { mockRequest, mockResponse } from '../../__testutils__/mockExpress';

describe('stripeWebhook', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe('Webhook Verification', () => {
    it('should verify signature', async () => {
      req.body = { /* valid payload */ };
      req.headers = { 'stripe-signature': 'valid-signature' };

      await stripeWebhook(req as Request, res as Response);

      expect(res.status).not.toHaveBeenCalledWith(401);
    });

    it('should reject invalid signature', async () => {
      req.headers = { 'stripe-signature': 'invalid-signature' };

      await stripeWebhook(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Event Processing', () => {
    it('should handle payment success event', async () => {
      // Test implementation
    });
  });
});
```

---

## Do's and Don'ts

### ✅ DO

**DO use descriptive test names**

```typescript
// Good
it('should throw unauthenticated error when user is not signed in', async () => {})

// Bad
it('test auth', async () => {})
```

**DO organize tests by concern**

```typescript
describe('createUser', () => {
  describe('Authentication', () => { /* auth tests */ });
  describe('Input Validation', () => { /* validation tests */ });
  describe('Authorization', () => { /* authz tests */ });
  describe('Business Logic', () => { /* logic tests */ });
});
```

**DO test both success and failure paths**

```typescript
it('should create user successfully with valid data', async () => {});
it('should throw error when email is invalid', async () => {});
```

**DO mock external dependencies**

```typescript
jest.mock('../services/emailService');
jest.mock('../lib/database');
```

**DO use shared test utilities**

```typescript
import { mockAuthContext } from '../__testutils__/mockAuth';
import { createMockUser } from '../__testutils__/fixtures';
```

**DO test edge cases and boundary conditions**

```typescript
it('should handle empty string email', async () => {});
it('should handle null input', async () => {});
it('should handle undefined array', async () => {});
```

**DO assert on specific error messages**

```typescript
await expect(handler({ data: {} }))
  .rejects
  .toThrow('email is required');
```

**DO clean up after tests**

```typescript
afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  // cleanup resources
});
```

### ❌ DON'T

**DON'T test infrastructure**

```typescript
// Bad - tests database, not your code
it('should write to database', async () => {
  await db.insert({});
  const result = await db.findAll();
  expect(result.length).toBe(1);
});
```

**DON'T make real API calls**

```typescript
// Bad - makes real API call
await sendEmail({ to: 'test@example.com' });

// Good - mock it
jest.mock('./emailService');
expect(mockSendEmail).toHaveBeenCalled();
```

**DON'T test multiple concerns in one test**

```typescript
// Bad - tests auth AND validation AND logic
it('should work', async () => {
  // auth check
  // validation check
  // business logic check
});

// Good - separate tests
it('should require authentication', async () => {});
it('should validate input', async () => {});
it('should execute business logic', async () => {});
```

**DON'T skip error cases**

```typescript
// Bad - only tests success
it('should create user', async () => {
  const result = await createUser(validData);
  expect(result.ok).toBe(true);
});

// Good - test errors too
describe('Error Handling', () => {
  it('should handle database errors', async () => {});
  it('should handle validation errors', async () => {});
});
```

**DON'T use magic numbers or strings**

```typescript
// Bad
expect(result.status).toBe('pending');

// Good
import { STATUS } from '../constants';
expect(result.status).toBe(STATUS.PENDING);
```

**DON'T write flaky tests**

```typescript
// Bad - timing dependent
setTimeout(() => expect(result).toBe(true), 100);

// Good - deterministic
await waitFor(() => expect(result).toBe(true));
```

**DON'T ignore TypeScript errors in tests**

```typescript
// Bad
// @ts-ignore
const result = await func(invalidData);

// Good - fix the type
const result = await func(invalidData as ValidType);
```

**DON'T leave unused variables in tests**

```typescript
// Bad - lint error
const mockFn = jest.fn();
// mockFn is never used

// Good - only declare what you use
```

**DON'T commit skipped tests**

```typescript
// Bad - don't commit this
it.skip('should test something', async () => {});

// Good - implement or remove
it('should test something', async () => {
  // Implementation
});
```

---

## Common Test Scenarios

### Scenario 1: Testing Authentication Requirements

```typescript
describe('Authentication', () => {
  it('should throw unauthenticated error when auth is missing', async () => {
    await expect(
      handler({ data: validData })
    ).rejects.toThrow('unauthenticated');
  });

  it('should throw unauthenticated error when userId is missing', async () => {
    await expect(
      handler({ auth: { token: {} }, data: validData })
    ).rejects.toThrow('unauthenticated');
  });

  it('should accept valid authenticated user', async () => {
    const result = await handler({
      auth: mockAuthContext('test-uid'),
      data: validData
    });

    expect(result.ok).toBe(true);
  });
});
```

### Scenario 2: Testing Input Validation

```typescript
describe('Input Validation', () => {
  const validAuth = mockAuthContext('test-uid');

  it.each([
    ['missing email', { name: 'Test' }, 'email'],
    ['missing name', { email: 'test@example.com' }, 'name'],
    ['invalid email format', { email: 'not-an-email', name: 'Test' }, 'email'],
    ['empty email', { email: '', name: 'Test' }, 'email'],
  ])('should reject %s', async (desc, data, expectedField) => {
    await expect(
      handler({ auth: validAuth, data })
    ).rejects.toThrow(expect.stringContaining(expectedField));
  });

  it('should accept valid input', async () => {
    const result = await handler({
      auth: validAuth,
      data: { email: 'test@example.com', name: 'Test' }
    });

    expect(result.ok).toBe(true);
  });
});
```

### Scenario 3: Testing Authorization (RBAC)

```typescript
describe('Authorization', () => {
  const testCases = [
    { role: 'admin', expected: true, description: 'allow admin' },
    { role: 'manager', expected: true, description: 'allow manager' },
    { role: 'user', expected: false, description: 'deny user' },
    { role: 'guest', expected: false, description: 'deny guest' },
  ];

  it.each(testCases)('should $description', async ({ role, expected }) => {
    const auth = mockAuthContext('test-uid', [role]);

    if (expected) {
      const result = await handler({ auth, data: validData });
      expect(result.ok).toBe(true);
    } else {
      await expect(
        handler({ auth, data: validData })
      ).rejects.toThrow('permission-denied');
    }
  });
});
```

### Scenario 4: Testing Database Operations

```typescript
describe('Database Operations', () => {
  it('should create record with correct data structure', async () => {
    const mockCreate = jest.fn().mockResolvedValue({ id: 'new-id' });
    mockDb.create = mockCreate;

    await handler({ auth: validAuth, data: validData });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        status: 'pending',
        createdAt: expect.any(Date),
        createdBy: 'test-uid'
      })
    );
  });

  it('should handle database errors gracefully', async () => {
    mockDb.create.mockRejectedValue(new Error('Database error'));

    await expect(
      handler({ auth: validAuth, data: validData })
    ).rejects.toThrow('internal');
  });
});
```

### Scenario 5: Testing Audit Logging

```typescript
describe('Audit Logging', () => {
  it('should log successful action', async () => {
    await handler({ auth: validAuth, data: validData });

    expect(mockAuditLog).toHaveBeenCalledWith({
      action: 'user.create',
      actorId: 'test-uid',
      resourceId: expect.any(String),
      details: expect.objectContaining({
        email: 'test@example.com'
      })
    });
  });
});
```

---

## Mocking Strategies

### Mock Authentication

```typescript
// __testutils__/mockAuth.ts

export function mockAuthContext(
  userId: string,
  roles: string[] = []
) {
  return {
    userId,
    roles,
    email: `${userId}@test.com`,
  };
}

export function mockUnauthContext() {
  return undefined;
}

// Convenience helpers
export function mockAdminAuth(userId = 'admin-uid') {
  return mockAuthContext(userId, ['admin']);
}

export function mockUserAuth(userId = 'user-uid') {
  return mockAuthContext(userId, ['user']);
}
```

### Mock Database

```typescript
// __testutils__/mockDb.ts
import { jest } from '@jest/globals';

export function mockDocumentResult(data: unknown | null, id: string) {
  return {
    id,
    data,
    exists: !!data,
  };
}

export function mockQueryResult(docs: Array<{ id: string; data: unknown }>) {
  return {
    docs: docs.map(d => mockDocumentResult(d.data, d.id)),
    empty: docs.length === 0,
    count: docs.length,
  };
}

export const mockDb = {
  findOne: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};
```

### Mock External Services

```typescript
// __testutils__/mockEmail.ts
import { jest } from '@jest/globals';

export const mockSendEmail = jest.fn().mockResolvedValue({ ok: true });

jest.mock('../services/emailService', () => ({
  sendEmail: mockSendEmail,
  queueEmail: mockSendEmail,
}));
```

---

## Best Practices

### 1. Arrange-Act-Assert (AAA) Pattern

```typescript
it('should create user successfully', async () => {
  // Arrange: Set up test data and mocks
  const auth = mockAuthContext('test-uid');
  const data = { email: 'test@example.com', name: 'Test' };

  // Act: Execute the function
  const result = await createUser({ auth, data });

  // Assert: Verify the outcome
  expect(result.ok).toBe(true);
  expect(result.userId).toBeDefined();
});
```

### 2. Test Isolation

```typescript
describe('createUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
```

### 3. Use Test Factories

```typescript
// __testutils__/fixtures.ts
export const createMockUserData = (overrides = {}) => ({
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  ...overrides,
});

// Usage in tests
it('should create user', async () => {
  const data = createMockUserData({ email: 'custom@example.com' });
  // ...
});
```

### 4. Test Coverage Goals

Aim for:
- **70%+** line coverage for all code
- **100%** coverage for critical paths:
  - Authentication checks
  - Authorization logic
  - Financial calculations
  - Security-sensitive operations

Check coverage:

```bash
pnpm run test:coverage
```

---

## Quick Reference Commands

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Generate coverage report
pnpm run test:coverage

# Run specific test file
pnpm run test -- userService.test.ts

# Run tests matching pattern
pnpm run test -- -t "Authentication"

# Debug tests
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

> **Remember**: Tests are documentation. Write tests that clearly communicate what the function does and how it should behave.
