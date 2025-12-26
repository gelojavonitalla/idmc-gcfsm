/**
 * Rate Limiting Module
 *
 * Provides rate limiting functionality using Firestore for persistence.
 * This ensures rate limits are enforced across function instances and
 * survive cold starts.
 *
 * @module functions/rateLimit
 */

import {getFirestore, FieldValue, Timestamp} from "firebase-admin/firestore";
import {HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

/**
 * Rate limit configuration options
 */
export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Custom error message when limit is exceeded */
  message?: string;
}

/**
 * Rate limit record stored in Firestore
 */
interface RateLimitRecord {
  count: number;
  windowStart: Timestamp;
  lastRequest: Timestamp;
}

/**
 * Default rate limit configurations for different actions
 */
export const RATE_LIMIT_CONFIGS = {
  /** Registration lookup - moderate limit */
  REGISTRATION_LOOKUP: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: "Too many lookup requests. Please try again in a minute.",
  },
  /** Verification attempts - stricter limit */
  VERIFICATION: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: "Too many verification attempts. Please try again later.",
  },
  /** Login attempts - stricter limit */
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
  /** API calls - generous limit for authenticated users */
  API_CALL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: "Rate limit exceeded. Please slow down your requests.",
  },
  /** Payment proof uploads - prevent spam */
  PAYMENT_UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: "Too many payment uploads. Please try again later.",
  },
  /** OTP verification code requests - prevent abuse */
  OTP_REQUEST: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    message: "Too many verification code requests. Please try again later.",
  },
  /** OTP verification attempts - stricter limit */
  OTP_VERIFY: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: "Too many verification attempts. Please try again in 15 minutes.",
  },
} as const;

/**
 * Collection name for rate limit records
 */
const RATE_LIMIT_COLLECTION = "rateLimits";

/**
 * Checks and enforces rate limit for a given identifier and action
 *
 * This function:
 * 1. Creates a unique key from the action and identifier
 * 2. Checks/creates a rate limit record in Firestore
 * 3. Throws an error if limit is exceeded
 * 4. Updates the count if within limit
 *
 * @param {string} action - The action being rate limited (e.g., "lookup")
 * @param {string} identifier - Unique identifier (IP, user ID, etc.)
 * @param {RateLimitConfig} config - Rate limit configuration
 * @throws {HttpsError} If rate limit is exceeded
 *
 * @example
 * // Check rate limit for registration lookup
 * await checkRateLimit(
 *   "registration_lookup",
 *   clientIp,
 *   RATE_LIMIT_CONFIGS.REGISTRATION_LOOKUP
 * );
 */
export async function checkRateLimit(
  action: string,
  identifier: string,
  config: RateLimitConfig
): Promise<void> {
  const db = getFirestore();
  const now = Timestamp.now();
  const nowMs = now.toMillis();

  // Create a safe document ID from action and identifier
  const safeIdentifier = identifier.replace(/[./#[\]]/g, "_");
  const docId = `${action}:${safeIdentifier}`;
  const docRef = db.collection(RATE_LIMIT_COLLECTION).doc(docId);

  try {
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);
      const data = doc.data() as RateLimitRecord | undefined;

      if (!data) {
        // First request - create new record
        transaction.set(docRef, {
          count: 1,
          windowStart: now,
          lastRequest: now,
        });
        return;
      }

      const windowStartMs = data.windowStart.toMillis();
      const windowElapsed = nowMs - windowStartMs;

      if (windowElapsed >= config.windowMs) {
        // Window has expired - reset
        transaction.set(docRef, {
          count: 1,
          windowStart: now,
          lastRequest: now,
        });
        return;
      }

      // Within window - check limit
      if (data.count >= config.maxRequests) {
        const remainingMs = config.windowMs - windowElapsed;
        const remainingSec = Math.ceil(remainingMs / 1000);
        logger.warn(
          `Rate limit exceeded for ${action} by ${identifier}. ` +
          `Count: ${data.count}, Limit: ${config.maxRequests}`
        );
        throw new HttpsError(
          "resource-exhausted",
          config.message ||
          `Rate limit exceeded. Try again in ${remainingSec} seconds.`
        );
      }

      // Increment counter
      transaction.update(docRef, {
        count: FieldValue.increment(1),
        lastRequest: now,
      });
    });
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    // Log but don't fail on rate limit errors - fail open for availability
    logger.error("Rate limit check failed:", error);
  }
}

/**
 * Resets rate limit for a specific action and identifier
 *
 * Useful for resetting limits after successful authentication
 * or when an admin resets a user's limits.
 *
 * @param {string} action - The action to reset
 * @param {string} identifier - The identifier to reset
 */
export async function resetRateLimit(
  action: string,
  identifier: string
): Promise<void> {
  const db = getFirestore();
  const safeIdentifier = identifier.replace(/[./#[\]]/g, "_");
  const docId = `${action}:${safeIdentifier}`;

  try {
    await db.collection(RATE_LIMIT_COLLECTION).doc(docId).delete();
    logger.info(`Rate limit reset for ${action}:${identifier}`);
  } catch (error) {
    logger.error("Failed to reset rate limit:", error);
  }
}

/**
 * Cleans up expired rate limit records
 *
 * This should be called periodically (e.g., via a scheduled function)
 * to remove stale rate limit records and keep the collection size manageable.
 *
 * @param {number} maxAgeMs - Maximum age of records to keep (default: 24 hours)
 * @return {Promise<number>} Number of records deleted
 */
export async function cleanupExpiredRateLimits(
  maxAgeMs: number = 24 * 60 * 60 * 1000
): Promise<number> {
  const db = getFirestore();
  const cutoffTime = Timestamp.fromMillis(Date.now() - maxAgeMs);

  const snapshot = await db
    .collection(RATE_LIMIT_COLLECTION)
    .where("lastRequest", "<", cutoffTime)
    .limit(500) // Process in batches
    .get();

  if (snapshot.empty) {
    return 0;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  logger.info(`Cleaned up ${snapshot.size} expired rate limit records`);

  return snapshot.size;
}

/**
 * Gets current rate limit status for monitoring
 *
 * @param {string} action - The action to check
 * @param {string} identifier - The identifier to check
 * @param {RateLimitConfig} config - Rate limit configuration
 * @return {Promise<Object>} Rate limit status
 */
export async function getRateLimitStatus(
  action: string,
  identifier: string,
  config: RateLimitConfig
): Promise<{
  remaining: number;
  total: number;
  resetInMs: number;
  isLimited: boolean;
}> {
  const db = getFirestore();
  const safeIdentifier = identifier.replace(/[./#[\]]/g, "_");
  const docId = `${action}:${safeIdentifier}`;

  const doc = await db.collection(RATE_LIMIT_COLLECTION).doc(docId).get();
  const data = doc.data() as RateLimitRecord | undefined;

  if (!data) {
    return {
      remaining: config.maxRequests,
      total: config.maxRequests,
      resetInMs: 0,
      isLimited: false,
    };
  }

  const nowMs = Date.now();
  const windowStartMs = data.windowStart.toMillis();
  const windowElapsed = nowMs - windowStartMs;

  if (windowElapsed >= config.windowMs) {
    return {
      remaining: config.maxRequests,
      total: config.maxRequests,
      resetInMs: 0,
      isLimited: false,
    };
  }

  const remaining = Math.max(0, config.maxRequests - data.count);
  const resetInMs = config.windowMs - windowElapsed;

  return {
    remaining,
    total: config.maxRequests,
    resetInMs,
    isLimited: remaining === 0,
  };
}
