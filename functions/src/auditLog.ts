/**
 * Audit Logging Module
 *
 * Provides comprehensive audit logging for sensitive operations.
 * All logs are stored in Firestore for persistence and queryability.
 *
 * @module functions/auditLog
 */

import {getFirestore, FieldValue, Timestamp} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

/**
 * Audit log severity levels
 */
export const AUDIT_SEVERITY = {
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical",
} as const;

export type AuditSeverity = typeof AUDIT_SEVERITY[keyof typeof AUDIT_SEVERITY];

/**
 * Audit log action categories
 */
export const AUDIT_ACTIONS = {
  // Authentication & Authorization
  AUTH_LOGIN: "auth.login",
  AUTH_LOGOUT: "auth.logout",
  AUTH_LOGIN_FAILED: "auth.login_failed",
  AUTH_PASSWORD_RESET: "auth.password_reset",
  AUTH_PERMISSION_DENIED: "auth.permission_denied",

  // Registration operations
  REGISTRATION_CREATED: "registration.created",
  REGISTRATION_UPDATED: "registration.updated",
  REGISTRATION_DELETED: "registration.deleted",
  REGISTRATION_LOOKUP: "registration.lookup",
  REGISTRATION_VERIFIED: "registration.verified",

  // Payment operations
  PAYMENT_SUBMITTED: "payment.submitted",
  PAYMENT_VERIFIED: "payment.verified",
  PAYMENT_REJECTED: "payment.rejected",
  INVOICE_GENERATED: "invoice.generated",
  INVOICE_SENT: "invoice.sent",

  // Admin operations
  ADMIN_CREATED: "admin.created",
  ADMIN_UPDATED: "admin.updated",
  ADMIN_DELETED: "admin.deleted",
  ADMIN_ROLE_CHANGED: "admin.role_changed",
  ADMIN_STATUS_CHANGED: "admin.status_changed",

  // Data access
  DATA_EXPORTED: "data.exported",
  DATA_ACCESSED: "data.accessed",
  SENSITIVE_DATA_ACCESSED: "data.sensitive_accessed",

  // Check-in operations
  CHECKIN_PERFORMED: "checkin.performed",
  CHECKIN_REVERTED: "checkin.reverted",

  // System operations
  SETTINGS_UPDATED: "settings.updated",
  RATE_LIMIT_EXCEEDED: "system.rate_limit",
  ERROR_OCCURRED: "system.error",
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  /** Unique action identifier */
  action: AuditAction | string;
  /** Severity level */
  severity: AuditSeverity;
  /** User ID who performed the action (null for system/anonymous) */
  actorId: string | null;
  /** Actor's email or identifier for display */
  actorEmail?: string;
  /** Actor's role at time of action */
  actorRole?: string;
  /** Type of entity affected (registration, admin, etc.) */
  entityType?: string;
  /** ID of the affected entity */
  entityId?: string;
  /** Human-readable description of the action */
  description: string;
  /** Additional metadata about the action */
  metadata?: Record<string, unknown>;
  /** IP address of the request */
  ipAddress?: string;
  /** User agent string */
  userAgent?: string;
  /** Timestamp of the action */
  timestamp: Timestamp | FieldValue;
  /** Request ID for correlation */
  requestId?: string;
}

/**
 * Collection name for audit logs
 */
const AUDIT_LOG_COLLECTION = "auditLogs";

/**
 * Logs an audit event to Firestore
 *
 * @param {Partial<AuditLogEntry>} entry - The audit log entry
 * @return {Promise<string>} The ID of the created log entry
 */
export async function logAuditEvent(
  entry: Partial<AuditLogEntry> & {
    action: AuditAction | string;
    description: string;
  }
): Promise<string> {
  const db = getFirestore();

  const logEntry: AuditLogEntry = {
    action: entry.action,
    severity: entry.severity || AUDIT_SEVERITY.INFO,
    actorId: entry.actorId || null,
    actorEmail: entry.actorEmail,
    actorRole: entry.actorRole,
    entityType: entry.entityType,
    entityId: entry.entityId,
    description: entry.description,
    metadata: entry.metadata,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
    timestamp: FieldValue.serverTimestamp(),
    requestId: entry.requestId,
  };

  try {
    const docRef = await db.collection(AUDIT_LOG_COLLECTION).add(logEntry);

    // Also log to Cloud Logging for real-time monitoring
    const isError = entry.severity === AUDIT_SEVERITY.ERROR ||
                    entry.severity === AUDIT_SEVERITY.CRITICAL;
    const logMethod = isError ? logger.error : logger.info;

    logMethod(`[AUDIT] ${entry.action}: ${entry.description}`, {
      auditLogId: docRef.id,
      ...logEntry,
    });

    return docRef.id;
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    logger.error("Failed to write audit log:", error, entry);
    return "";
  }
}

/**
 * Logs a successful authentication event
 *
 * @param {string} userId - The user's Firebase UID
 * @param {string} email - The user's email address
 * @param {string} role - The user's admin role
 * @param {string} ipAddress - Optional IP address
 * @return {Promise<void>}
 */
export async function logAuthSuccess(
  userId: string,
  email: string,
  role: string,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    action: AUDIT_ACTIONS.AUTH_LOGIN,
    severity: AUDIT_SEVERITY.INFO,
    actorId: userId,
    actorEmail: email,
    actorRole: role,
    description: `Admin login successful: ${email}`,
    ipAddress,
  });
}

/**
 * Logs a failed authentication attempt
 *
 * @param {string} email - The email that failed to authenticate
 * @param {string} reason - The reason for failure
 * @param {string} ipAddress - Optional IP address
 * @return {Promise<void>}
 */
export async function logAuthFailure(
  email: string,
  reason: string,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
    severity: AUDIT_SEVERITY.WARNING,
    actorId: null,
    actorEmail: email,
    description: `Login failed for ${email}: ${reason}`,
    ipAddress,
    metadata: {reason},
  });
}

/**
 * Logs a permission denied event
 *
 * @param {string | null} userId - The user's UID or null
 * @param {string | undefined} email - The user's email
 * @param {string} action - The action that was denied
 * @param {string} resource - The resource being accessed
 * @param {string} ipAddress - Optional IP address
 * @return {Promise<void>}
 */
export async function logPermissionDenied(
  userId: string | null,
  email: string | undefined,
  action: string,
  resource: string,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    action: AUDIT_ACTIONS.AUTH_PERMISSION_DENIED,
    severity: AUDIT_SEVERITY.WARNING,
    actorId: userId,
    actorEmail: email,
    description: `Permission denied: ${action} on ${resource}`,
    metadata: {attemptedAction: action, resource},
    ipAddress,
  });
}

/**
 * Logs a registration data access event
 *
 * @param {string} registrationId - The registration ID accessed
 * @param {"lookup" | "view" | "export"} accessType - Type of access
 * @param {string | null} actorId - The actor's UID or null
 * @param {string} actorEmail - Optional actor email
 * @param {string} ipAddress - Optional IP address
 * @return {Promise<void>}
 */
export async function logRegistrationAccess(
  registrationId: string,
  accessType: "lookup" | "view" | "export",
  actorId: string | null,
  actorEmail?: string,
  ipAddress?: string
): Promise<void> {
  const actionType = accessType === "lookup" ?
    AUDIT_ACTIONS.REGISTRATION_LOOKUP :
    AUDIT_ACTIONS.DATA_ACCESSED;

  await logAuditEvent({
    action: actionType,
    severity: AUDIT_SEVERITY.INFO,
    actorId,
    actorEmail,
    entityType: "registration",
    entityId: registrationId,
    description: `Registration ${accessType}: ${registrationId}`,
    ipAddress,
  });
}

/**
 * Logs a payment verification event
 *
 * @param {string} registrationId - The registration ID
 * @param {"verified" | "rejected"} status - Verification status
 * @param {string} actorId - The admin's UID
 * @param {string} actorEmail - The admin's email
 * @param {string} reason - Optional reason for rejection
 * @return {Promise<void>}
 */
export async function logPaymentVerification(
  registrationId: string,
  status: "verified" | "rejected",
  actorId: string,
  actorEmail: string,
  reason?: string
): Promise<void> {
  const actionType = status === "verified" ?
    AUDIT_ACTIONS.PAYMENT_VERIFIED :
    AUDIT_ACTIONS.PAYMENT_REJECTED;

  await logAuditEvent({
    action: actionType,
    severity: AUDIT_SEVERITY.INFO,
    actorId,
    actorEmail,
    entityType: "registration",
    entityId: registrationId,
    description: `Payment ${status} for ${registrationId}`,
    metadata: {reason},
  });
}

/**
 * Logs an admin management event
 *
 * @param {string} targetAdminId - The target admin's UID
 * @param {string} targetEmail - The target admin's email
 * @param {string} changeType - Type of change performed
 * @param {string} actorId - The performing admin's UID
 * @param {string} actorEmail - The performing admin's email
 * @param {Record<string, unknown>} details - Optional change details
 * @return {Promise<void>}
 */
export async function logAdminChange(
  targetAdminId: string,
  targetEmail: string,
  changeType: "created" | "updated" | "deleted" | "role_changed",
  actorId: string,
  actorEmail: string,
  details?: Record<string, unknown>
): Promise<void> {
  const actionMap = {
    created: AUDIT_ACTIONS.ADMIN_CREATED,
    updated: AUDIT_ACTIONS.ADMIN_UPDATED,
    deleted: AUDIT_ACTIONS.ADMIN_DELETED,
    role_changed: AUDIT_ACTIONS.ADMIN_ROLE_CHANGED,
  };

  const severity = changeType === "deleted" ?
    AUDIT_SEVERITY.WARNING :
    AUDIT_SEVERITY.INFO;

  await logAuditEvent({
    action: actionMap[changeType],
    severity,
    actorId,
    actorEmail,
    entityType: "admin",
    entityId: targetAdminId,
    description: `Admin ${changeType}: ${targetEmail}`,
    metadata: details,
  });
}

/**
 * Logs a data export event
 *
 * @param {string} exportType - Type of data exported
 * @param {number} recordCount - Number of records exported
 * @param {string} actorId - The admin's UID
 * @param {string} actorEmail - The admin's email
 * @return {Promise<void>}
 */
export async function logDataExport(
  exportType: string,
  recordCount: number,
  actorId: string,
  actorEmail: string
): Promise<void> {
  await logAuditEvent({
    action: AUDIT_ACTIONS.DATA_EXPORTED,
    severity: AUDIT_SEVERITY.INFO,
    actorId,
    actorEmail,
    description: `Data exported: ${exportType} (${recordCount} records)`,
    metadata: {exportType, recordCount},
  });
}

/**
 * Logs a rate limit exceeded event
 *
 * @param {string} action - The action that was rate limited
 * @param {string} identifier - The rate limited identifier
 * @param {string} ipAddress - Optional IP address
 * @return {Promise<void>}
 */
export async function logRateLimitExceeded(
  action: string,
  identifier: string,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    action: AUDIT_ACTIONS.RATE_LIMIT_EXCEEDED,
    severity: AUDIT_SEVERITY.WARNING,
    actorId: null,
    description: `Rate limit exceeded for ${action}`,
    metadata: {rateLimitAction: action, identifier},
    ipAddress,
  });
}

/**
 * Logs a system error event
 *
 * @param {string} operation - The operation that failed
 * @param {Error | string} error - The error that occurred
 * @param {Record<string, unknown>} context - Optional error context
 * @return {Promise<void>}
 */
export async function logSystemError(
  operation: string,
  error: Error | string,
  context?: Record<string, unknown>
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : error;
  await logAuditEvent({
    action: AUDIT_ACTIONS.ERROR_OCCURRED,
    severity: AUDIT_SEVERITY.ERROR,
    actorId: null,
    description: `System error in ${operation}: ${errorMessage}`,
    metadata: {
      operation,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      ...context,
    },
  });
}

/**
 * Queries audit logs with filters
 *
 * @param {Object} filters - Query filters
 * @param {number} limit - Maximum number of results
 * @return {Promise<AuditLogEntry[]>} Matching audit log entries
 */
export async function queryAuditLogs(
  filters: {
    action?: AuditAction | string;
    actorId?: string;
    entityType?: string;
    entityId?: string;
    severity?: AuditSeverity;
    startTime?: Date;
    endTime?: Date;
  },
  limit = 100
): Promise<(AuditLogEntry & {id: string})[]> {
  const db = getFirestore();
  let query: FirebaseFirestore.Query = db.collection(AUDIT_LOG_COLLECTION);

  if (filters.action) {
    query = query.where("action", "==", filters.action);
  }
  if (filters.actorId) {
    query = query.where("actorId", "==", filters.actorId);
  }
  if (filters.entityType) {
    query = query.where("entityType", "==", filters.entityType);
  }
  if (filters.entityId) {
    query = query.where("entityId", "==", filters.entityId);
  }
  if (filters.severity) {
    query = query.where("severity", "==", filters.severity);
  }
  if (filters.startTime) {
    const start = Timestamp.fromDate(filters.startTime);
    query = query.where("timestamp", ">=", start);
  }
  if (filters.endTime) {
    const end = Timestamp.fromDate(filters.endTime);
    query = query.where("timestamp", "<=", end);
  }

  query = query.orderBy("timestamp", "desc").limit(limit);

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data() as AuditLogEntry,
  }));
}
