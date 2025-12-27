/**
 * Firebase Cloud Functions
 * Handles server-side operations including admin invitation emails.
 *
 * @module functions/index
 */

import {setGlobalOptions} from "firebase-functions";
import {defineString, defineSecret} from "firebase-functions/params";
import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onCall, onRequest, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {ImageAnnotatorClient} from "@google-cloud/vision";
import {initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import sgMail from "@sendgrid/mail";
import * as QRCode from "qrcode";
import {verifyFinanceAdmin} from "./auth";
import {
  checkRateLimit,
  cleanupExpiredRateLimits,
  RATE_LIMIT_CONFIGS,
} from "./rateLimit";
import {
  logAuditEvent,
  logRegistrationAccess,
  logRateLimitExceeded,
  AUDIT_ACTIONS,
  AUDIT_SEVERITY,
} from "./auditLog";

// Initialize Firebase Admin SDK
initializeApp();

/**
 * Structured logging utility for Cloud Functions
 * Provides consistent logging with context, timing, and traceability
 */
const cfLogger = {
  /**
   * Creates a logger context for a specific function execution
   *
   * @param {string} functionName - Name of the cloud function
   * @param {string} executionId - Optional execution ID for tracing
   * @return {Object} Logger context with logging methods
   */
  createContext: (functionName: string, executionId?: string) => {
    const startTime = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 9);
    const execId = executionId || `exec_${Date.now()}_${randomPart}`;

    const formatMessage = (message: string) => ({
      function: functionName,
      executionId: execId,
      message,
    });

    return {
      /**
       * Log function entry
       *
       * @param {Record<string, unknown>} context - Additional context data
       */
      start: (context?: Record<string, unknown>) => {
        logger.info({
          ...formatMessage("Function execution started"),
          ...context,
        });
      },

      /**
       * Log informational message
       *
       * @param {string} message - Log message
       * @param {Record<string, unknown>} data - Additional data
       */
      info: (message: string, data?: Record<string, unknown>) => {
        logger.info({
          ...formatMessage(message),
          ...data,
        });
      },

      /**
       * Log warning message
       *
       * @param {string} message - Warning message
       * @param {Record<string, unknown>} data - Additional data
       */
      warn: (message: string, data?: Record<string, unknown>) => {
        logger.warn({
          ...formatMessage(message),
          ...data,
        });
      },

      /**
       * Log error message
       *
       * @param {string} message - Error message
       * @param {Error | unknown} error - Error object
       * @param {Record<string, unknown>} data - Additional data
       */
      error: (
        message: string,
        error?: Error | unknown,
        data?: Record<string, unknown>
      ) => {
        const logEntry: Record<string, unknown> = {
          ...formatMessage(message),
          ...data,
        };

        // Only add error property if an error was provided
        if (error !== undefined) {
          if (error instanceof Error) {
            logEntry.error = {
              name: error.name,
              message: error.message,
              stack: error.stack,
            };
          } else {
            // For non-Error objects, safely convert to string to avoid
            // serialization issues with circular refs or non-serializable props
            try {
              logEntry.error = typeof error === "object" ?
                JSON.parse(JSON.stringify(error)) :
                String(error);
            } catch {
              logEntry.error = String(error);
            }
          }
        }

        logger.error(logEntry);
      },

      /**
       * Log function completion with duration
       *
       * @param {boolean} success - Whether execution was successful
       * @param {Record<string, unknown>} result - Result data
       */
      end: (success: boolean, result?: Record<string, unknown>) => {
        const duration = Date.now() - startTime;
        logger.info({
          ...formatMessage(`Function execution ${success ? "completed" : "failed"}`),
          durationMs: duration,
          success,
          ...result,
        });
      },

      /**
       * Get current execution duration
       *
       * @return {number} Duration in milliseconds
       */
      getDuration: () => Date.now() - startTime,
    };
  },
};

// Set global options for all functions
setGlobalOptions({
  maxInstances: 10,
  region: "asia-southeast1",
});

// Regular config params (not sensitive)
const senderEmail = defineString("SENDER_EMAIL", {default: ""});
const senderName = defineString("SENDER_NAME", {default: "IDMC Admin"});
const appUrl = defineString("APP_URL", {default: ""});

// Flag to enable/disable SendGrid (set to "true" to use SendGrid)
const useSendGrid = defineString("USE_SENDGRID", {default: "false"});

// Reply-to email for contact inquiry responses (info@ address for replies)
const replyToEmail = defineString("REPLY_TO_EMAIL", {default: ""});

// Storage bucket name (defaults to database ID for backwards compatibility)
const storageBucketName = defineString("STORAGE_BUCKET", {default: "idmc-2026"});

// SendGrid API key (stored in Secret Manager, accessed via defineSecret)
const sendgridApiKey = defineSecret("SENDGRID_API_KEY");

// Conference configuration constants
const CONFERENCE_YEAR = 2026;
const CONFERENCE_NAME = `IDMC GCFSM ${CONFERENCE_YEAR}`;
const INVOICE_CONTACT_EMAIL = "info@idmc-gcfsm.org";

/**
 * Generates a QR code as a base64 data URL
 *
 * @param {string} data - The data to encode in the QR code
 * @return {Promise<string>} Base64 data URL of the QR code image
 */
async function generateQRCodeDataUrl(data: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(data, {
      width: 200,
      margin: 2,
      color: {
        dark: "#1f2937",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });
    return dataUrl;
  } catch (error) {
    logger.error("Failed to generate QR code:", error);
    throw error;
  }
}

/**
 * Retrieves SendGrid API key from Secret Manager via defineSecret
 * Returns null if secret doesn't exist or is empty
 *
 * @return {string | null} The SendGrid API key or null if not available
 */
function getSendGridApiKey(): string | null {
  try {
    const apiKey = sendgridApiKey.value();
    return apiKey || null;
  } catch (error) {
    logger.warn("Could not access SENDGRID_API_KEY:", error);
    return null;
  }
}

/**
 * Database ID for Firestore
 */
const DATABASE_ID = "idmc-2026";

/**
 * Collection name constants
 */
const COLLECTIONS = {
  ADMINS: "admins",
  REGISTRATIONS: "registrations",
  SETTINGS: "settings",
  CONFERENCES: "conferences",
  CONTACT_INQUIRIES: "contactInquiries",
  SESSIONS: "sessions",
  STATS: "stats",
  WHAT_TO_BRING: "whatToBring",
  VERIFICATION_CODES: "verificationCodes",
};

/**
 * Stats document ID (singleton for conference stats)
 */
const STATS_DOC_ID = "conference-stats";

/**
 * SMS settings interface
 */
interface SmsSettings {
  enabled: boolean;
  gatewayDomain: string;
  gatewayEmail: string;
}

/**
 * Default SMS settings
 */
const DEFAULT_SMS_SETTINGS: SmsSettings = {
  enabled: false,
  gatewayDomain: "1.onewaysms.asia",
  gatewayEmail: "",
};

/**
 * Email settings interface for controlling email notifications
 */
interface EmailSettings {
  /** Whether email notifications from triggers are enabled */
  triggerEmailsEnabled: boolean;
  /** Whether to skip sending to test/seeded data */
  skipTestData: boolean;
}

/**
 * Default email settings - conservative defaults to prevent accidental sends
 */
const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  triggerEmailsEnabled: true,
  skipTestData: true,
};

/**
 * Test email domains that should never receive emails
 * These are commonly used for testing and don't have real mailboxes
 */
const TEST_EMAIL_DOMAINS = [
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "test.org",
  "localhost",
  "localhost.localdomain",
  "invalid",
  "mailinator.com",
  "guerrillamail.com",
  "tempmail.com",
  "throwaway.email",
];

/**
 * Retrieves email settings from Firestore conference settings
 * Falls back to defaults if Firestore settings not found
 *
 * @return {Promise<EmailSettings>} Email configuration settings
 */
async function getEmailSettings(): Promise<EmailSettings> {
  try {
    const db = getFirestore(DATABASE_ID);
    const settingsDoc = await db
      .collection(COLLECTIONS.CONFERENCES)
      .doc("conference-settings")
      .get();

    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      if (data?.email) {
        return {
          triggerEmailsEnabled: data.email.triggerEmailsEnabled ??
            DEFAULT_EMAIL_SETTINGS.triggerEmailsEnabled,
          skipTestData: data.email.skipTestData ??
            DEFAULT_EMAIL_SETTINGS.skipTestData,
        };
      }
    }

    logger.info("No email settings in Firestore, using defaults");
    return DEFAULT_EMAIL_SETTINGS;
  } catch (error) {
    logger.warn("Could not fetch email settings from Firestore:", error);
    return DEFAULT_EMAIL_SETTINGS;
  }
}

/**
 * Checks if an email address belongs to a test domain
 *
 * @param {string} email - Email address to check
 * @return {boolean} True if email is from a test domain
 */
function isTestEmailDomain(email: string): boolean {
  if (!email) return false;
  const domain = email.toLowerCase().split("@")[1];
  if (!domain) return false;
  return TEST_EMAIL_DOMAINS.some(
    (testDomain) => domain === testDomain || domain.endsWith(`.${testDomain}`)
  );
}

/**
 * Checks if a registration is test/seeded data that should not receive emails
 *
 * @param {Object} registration - Registration data
 * @return {boolean} True if registration is test/seeded data
 */
function isTestOrSeededRegistration(
  registration: {createdBy?: string}
): boolean {
  return registration?.createdBy === "seed-script";
}

/**
 * Determines if email should be skipped for a registration
 * Checks both the email domain and registration metadata
 *
 * @param {string} email - Recipient email address
 * @param {Object} registration - Registration data
 * @param {EmailSettings} emailSettings - Current email settings
 * @return {boolean} True if email should be skipped
 */
function shouldSkipEmail(
  email: string,
  registration: {createdBy?: string},
  emailSettings: EmailSettings
): boolean {
  // Always skip test email domains
  if (isTestEmailDomain(email)) {
    logger.info(`Skipping email to test domain: ${email}`);
    return true;
  }

  // Skip seeded registrations if skipTestData is enabled
  if (emailSettings.skipTestData && isTestOrSeededRegistration(registration)) {
    logger.info(
      `Skipping email for seeded registration (createdBy: ${registration.createdBy})`
    );
    return true;
  }

  return false;
}

/**
 * Retrieves SMS settings from Firestore conference settings
 * Falls back to defaults if Firestore settings not found
 *
 * @return {Promise<SmsSettings>} SMS configuration settings
 */
async function getSmsSettings(): Promise<SmsSettings> {
  try {
    const db = getFirestore(DATABASE_ID);
    const settingsDoc = await db
      .collection(COLLECTIONS.CONFERENCES)
      .doc("conference-settings")
      .get();

    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      if (data?.sms) {
        return {
          enabled: data.sms.enabled ?? DEFAULT_SMS_SETTINGS.enabled,
          gatewayDomain: data.sms.gatewayDomain ||
            DEFAULT_SMS_SETTINGS.gatewayDomain,
          gatewayEmail: data.sms.gatewayEmail ||
            DEFAULT_SMS_SETTINGS.gatewayEmail,
        };
      }
    }

    // Return defaults if no Firestore settings found
    logger.info("No SMS settings in Firestore, using defaults (SMS disabled)");
    return DEFAULT_SMS_SETTINGS;
  } catch (error) {
    logger.warn("Could not fetch SMS settings from Firestore:", error);
    return DEFAULT_SMS_SETTINGS;
  }
}

/**
 * Registration status constants
 */
const REGISTRATION_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  PENDING_VERIFICATION: "pending_verification",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  WAITLISTED: "waitlisted",
  WAITLIST_OFFERED: "waitlist_offered",
  WAITLIST_EXPIRED: "waitlist_expired",
};

/**
 * Invoice status constants
 */
const INVOICE_STATUS = {
  PENDING: "pending",
  UPLOADED: "uploaded",
  SENT: "sent",
  FAILED: "failed",
};

/**
 * Role labels for display in emails
 */
const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  finance: "Finance",
  media: "Media",
  volunteer: "Volunteer",
};

/**
 * What to Bring item interface
 */
interface WhatToBringItem {
  id: string;
  text: string;
  order: number;
  status: string;
}

/**
 * Default "What to Bring" items used as fallback
 */
const DEFAULT_WHAT_TO_BRING_ITEMS: WhatToBringItem[] = [
  {id: "default-1", text: "Your personal QR code (screenshot or printed)", order: 1, status: "published"},
  {id: "default-2", text: "Bible", order: 2, status: "published"},
  {id: "default-3", text: "Pen for note-taking", order: 3, status: "published"},
  {id: "default-4", text: "Tumbler (to stay hydrated)", order: 4, status: "published"},
];

/**
 * Fetches published "What to Bring" items from Firestore
 *
 * @return {Promise<WhatToBringItem[]>} Array of published what to bring items
 */
async function getPublishedWhatToBringItems(): Promise<WhatToBringItem[]> {
  try {
    const db = getFirestore(DATABASE_ID);
    const snapshot = await db
      .collection(COLLECTIONS.WHAT_TO_BRING)
      .where("status", "==", "published")
      .orderBy("order", "asc")
      .get();

    if (snapshot.empty) {
      logger.info("No published What to Bring items found, using defaults");
      return DEFAULT_WHAT_TO_BRING_ITEMS;
    }

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      text: doc.data().text || "",
      order: doc.data().order || 0,
      status: doc.data().status || "published",
    }));
  } catch (error) {
    logger.warn("Could not fetch What to Bring items, using defaults:", error);
    return DEFAULT_WHAT_TO_BRING_ITEMS;
  }
}

/**
 * Generates HTML list items for "What to Bring" section
 *
 * @param {WhatToBringItem[]} items - Array of what to bring items
 * @return {string} HTML string for list items
 */
function generateWhatToBringListHtml(items: WhatToBringItem[]): string {
  return items.map((item) => `<li>${item.text}</li>`).join("\n                ");
}

/**
 * Generates the HTML email template for admin invitations
 *
 * @param {string} displayName - The invited user's display name
 * @param {string} role - The assigned role
 * @param {string} inviteLink - The password setup link
 * @param {number} expiresIn - Hours until link expires
 * @return {string} HTML string for the email
 */
function generateInvitationEmailHtml(
  displayName: string,
  role: string,
  inviteLink: string,
  expiresIn = 72
): string {
  const roleLabel = ROLE_LABELS[role] || role;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to IDMC Admin</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                IDMC Admin
              </h1>
              <p style="margin: 8px 0 0; color: #bfdbfe; font-size: 14px;">
                GCF South Metro
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 24px; font-weight: 600;">
                You're Invited!
              </h2>
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi ${displayName},
              </p>
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                You've been invited to join the <strong>IDMC Admin Dashboard</strong> as a <strong>${roleLabel}</strong>.
                Click the button below to set up your password and activate your account.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 16px 0 32px;">
                    <a href="${inviteLink}"
                       style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
                      Set Up Your Account
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
                      <strong>Note:</strong> This invitation link will expire in <strong>${expiresIn} hours</strong>.
                      If it expires, please contact your administrator to request a new invitation.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Link fallback -->
              <p style="margin: 32px 0 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; color: #6b7280; font-size: 12px; word-break: break-all;">
                ${inviteLink}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center; line-height: 1.5;">
                This email was sent by IDMC Admin System.<br>
                GCF South Metro, Daang Hari Road, Las Piñas City, Philippines
              </p>
              <p style="margin: 12px 0 0; color: #9ca3af; font-size: 11px; text-align: center;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Generates plain text version of the invitation email
 *
 * @param {string} displayName - The invited user's display name
 * @param {string} role - The assigned role
 * @param {string} inviteLink - The password setup link
 * @param {number} expiresIn - Hours until link expires
 * @return {string} Plain text string for the email
 */
function generateInvitationEmailText(
  displayName: string,
  role: string,
  inviteLink: string,
  expiresIn = 72
): string {
  const roleLabel = ROLE_LABELS[role] || role;

  return `
You're Invited to IDMC Admin!

Hi ${displayName},

You've been invited to join the IDMC Admin Dashboard as a ${roleLabel}.

Click the link below to set up your password and activate your account:

${inviteLink}

Note: This invitation link will expire in ${expiresIn} hours. If it expires, please contact your administrator to request a new invitation.

---
IDMC Admin System
GCF South Metro, Daang Hari Road, Las Piñas City, Philippines

If you didn't expect this invitation, you can safely ignore this email.
`;
}

/**
 * Sends invitation email using SendGrid
 *
 * @param {string} to - Recipient email address
 * @param {string} displayName - Recipient's display name
 * @param {string} role - Assigned admin role
 * @param {string} inviteLink - Password setup link
 * @return {Promise<void>} Promise that resolves when email is sent
 */
async function sendInvitationEmailViaSendGrid(
  to: string,
  displayName: string,
  role: string,
  inviteLink: string
): Promise<void> {
  // Get SendGrid API key from Secret Manager
  const apiKey = getSendGridApiKey();
  if (!apiKey) {
    throw new Error("SendGrid API key is not configured in Secret Manager");
  }

  // Initialize SendGrid with API key
  sgMail.setApiKey(apiKey);

  const fromEmail = senderEmail.value();
  if (!fromEmail) {
    throw new Error("SENDER_EMAIL is not configured");
  }

  const msg = {
    to,
    from: {
      email: fromEmail,
      name: senderName.value() || "IDMC Admin",
    },
    subject: "You're Invited to IDMC Admin Dashboard",
    text: generateInvitationEmailText(displayName, role, inviteLink),
    html: generateInvitationEmailHtml(displayName, role, inviteLink),
  };

  await sgMail.send(msg);
  logger.info(`Invitation email sent via SendGrid to ${to}`);
}

/**
 * Checks if SendGrid is enabled and configured
 *
 * @return {boolean} boolean indicating if SendGrid should be used
 */
function isSendGridEnabled(): boolean {
  return useSendGrid.value().toLowerCase() === "true";
}

/**
 * Formats a Philippine phone number to international format
 * Handles various input formats: 09XX, 9XX, +639XX, 639XX
 *
 * @param {string} phone - The phone number to format
 * @return {string} Phone number in format 639XXXXXXXXX (no + prefix)
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // Handle different formats
  if (digits.startsWith("63") && digits.length === 12) {
    // Already in 639XXXXXXXXX format
    return digits;
  } else if (digits.startsWith("09") && digits.length === 11) {
    // Philippine format 09XXXXXXXXX
    return "63" + digits.slice(1);
  } else if (digits.startsWith("9") && digits.length === 10) {
    // Without leading zero: 9XXXXXXXXX
    return "63" + digits;
  }

  // Return as-is if format is unrecognized
  logger.warn(`Unrecognized phone format: ${phone}, returning as-is`);
  return digits;
}

/**
 * Validates a Philippine mobile phone number
 *
 * @param {string} phone - The phone number to validate
 * @return {boolean} True if valid Philippine mobile number
 */
function isValidPhilippinePhone(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // Valid Philippine mobile numbers start with 639 and are 12 digits
  return /^639\d{9}$/.test(formatted);
}

/**
 * Sends SMS via OneWaySMS email-to-SMS gateway using SendGrid
 *
 * OneWaySMS works by sending an email to a specific gateway address.
 * The email is then converted to an SMS and sent to the recipient.
 * Settings are read from Firestore conference settings.
 *
 * @param {string} phoneNumber - Recipient phone number (any Philippine format)
 * @param {string} message - SMS message content (max 160 chars for single SMS)
 * @return {Promise<boolean>} True if SMS was sent successfully
 */
async function sendSmsViaOneWaySms(
  phoneNumber: string,
  message: string
): Promise<boolean> {
  // Get SMS settings from Firestore
  const smsSettings = await getSmsSettings();

  if (!smsSettings.enabled) {
    logger.info("OneWaySMS not enabled, skipping SMS");
    return false;
  }

  // Validate phone number
  if (!isValidPhilippinePhone(phoneNumber)) {
    logger.warn(`Invalid phone number for SMS: ${phoneNumber}`);
    return false;
  }

  const formattedPhone = formatPhoneNumber(phoneNumber);

  // Get SendGrid API key (reuse existing infrastructure)
  const apiKey = getSendGridApiKey();
  if (!apiKey) {
    logger.warn("SendGrid API key not configured, cannot send SMS");
    return false;
  }

  sgMail.setApiKey(apiKey);

  const fromEmail = senderEmail.value();
  if (!fromEmail) {
    logger.warn("SENDER_EMAIL not configured, cannot send SMS");
    return false;
  }

  // Get gateway email address from Firestore settings
  // Format: either direct gateway email or phone@gateway.domain
  let toEmail: string;
  if (smsSettings.gatewayEmail) {
    // Direct gateway email provided (OneWaySMS may use this format)
    toEmail = smsSettings.gatewayEmail;
  } else if (smsSettings.gatewayDomain) {
    // Standard email-to-SMS format: phone@gateway.domain
    toEmail = `${formattedPhone}@${smsSettings.gatewayDomain}`;
  } else {
    logger.error("No SMS gateway configured");
    return false;
  }

  try {
    // OneWaySMS: The SUBJECT line contains the SMS message content
    const msg = {
      to: toEmail,
      from: {
        email: fromEmail,
        name: senderName.value() || "IDMC",
      },
      subject: message, // SMS content goes in subject for OneWaySMS
      text: " ", // Body can be empty but SendGrid requires non-empty
    };

    await sgMail.send(msg);
    logger.info(`SMS sent successfully to ${formattedPhone}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send SMS to ${formattedPhone}:`, error);
    return false;
  }
}

/**
 * SMS message templates
 */
const SMS_TEMPLATES = {
  /**
   * Registration confirmation SMS
   *
   * @param {string} firstName - Attendee's first name
   * @param {string} registrationId - Full registration ID
   * @param {string} shortCode - Short registration code
   * @param {number} amount - Total amount to pay
   * @param {string} deadline - Payment deadline ISO string
   * @return {string} SMS message text
   */
  registrationConfirmation: (
    firstName: string,
    registrationId: string,
    shortCode: string,
    amount: number,
    deadline: string
  ): string => {
    const formattedDeadline = new Date(deadline).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
    });
    const statusUrl = `${appUrl.value()}/registration/status?id=${registrationId}`;
    return `Hi ${firstName}! Your IDMC 2026 registration is received. ` +
      `ID: ${shortCode}. Pay PHP${amount.toLocaleString()} by ` +
      `${formattedDeadline}. Check status: ${statusUrl}`;
  },

  /**
   * Payment confirmed SMS
   *
   * @param {string} firstName - Attendee's first name
   * @param {string} shortCode - Short registration code
   * @return {string} SMS message text
   */
  paymentConfirmed: (
    firstName: string,
    shortCode: string
  ): string => {
    return `Hi ${firstName}! Your IDMC 2026 payment is CONFIRMED! ` +
      `Your code: ${shortCode}. Show your QR code at check-in. See you there!`;
  },

  /**
   * Payment reminder SMS
   *
   * @param {string} firstName - Attendee's first name
   * @param {string} shortCode - Short registration code
   * @param {string} deadline - Payment deadline ISO string
   * @return {string} SMS message text
   */
  paymentReminder: (
    firstName: string,
    shortCode: string,
    deadline: string
  ): string => {
    const formattedDeadline = new Date(deadline).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
    });
    return `Hi ${firstName}! Reminder: Your IDMC 2026 payment ` +
      `(${shortCode}) is due on ${formattedDeadline}. ` +
      "Please pay to confirm your slot.";
  },
};

/**
 * Firestore trigger that sends invitation email when a new admin is created
 *
 * This function:
 * 1. Triggers when a new document is created in the 'admins' collection
 * 2. Checks if the admin has status 'pending'
 * 3. Creates a Firebase Auth user if one doesn't exist
 * 4. Generates a password reset link (used as invitation link)
 * 5. Sends custom invitation email via SendGrid
 * 6. Updates the admin document with the invitation details
 *
 * @param event - The Firestore event containing the new document data
 */
export const onAdminCreated = onDocumentCreated(
  {
    document: `${COLLECTIONS.ADMINS}/{adminId}`,
    database: DATABASE_ID,
    secrets: [sendgridApiKey],
  },
  async (event) => {
    const adminId = event.params.adminId;
    const log = cfLogger.createContext("onAdminCreated", adminId);

    const snapshot = event.data;
    if (!snapshot) {
      log.error("No data associated with the event");
      log.end(false, {reason: "no_data"});
      return;
    }

    const adminData = snapshot.data();
    log.start({adminId, email: adminData.email, role: adminData.role});

    // Only process pending invitations
    if (adminData.status !== "pending") {
      log.info("Admin is not pending, skipping invitation email", {status: adminData.status});
      log.end(true, {skipped: true, reason: "not_pending"});
      return;
    }

    // Skip if invitation was already processed
    // Prevents duplicate emails during document migration from temp ID to UID
    if (adminData.invitationSentAt) {
      log.info("Admin already processed, skipping duplicate email");
      log.end(true, {skipped: true, reason: "already_processed"});
      return;
    }

    const {email, displayName, role} = adminData;

    if (!email) {
      log.error("Admin has no email address");
      log.end(false, {reason: "no_email"});
      return;
    }

    log.info("Processing invitation for admin", {email, displayName, role});

    const auth = getAuth();
    const db = getFirestore(DATABASE_ID);

    try {
      let userRecord;

      // Check if Firebase Auth user already exists
      try {
        userRecord = await auth.getUserByEmail(email);
        log.info("User already exists in Firebase Auth", {uid: userRecord.uid});
      } catch (error: unknown) {
        // User doesn't exist, create one
        if ((error as { code?: string }).code === "auth/user-not-found") {
          log.info("Creating new Firebase Auth user", {email});
          userRecord = await auth.createUser({
            email,
            displayName: displayName || email.split("@")[0],
            disabled: false,
          });
          log.info("Firebase Auth user created", {uid: userRecord.uid});
        } else {
          throw error;
        }
      }

      // Generate password reset link (serves as invitation/setup link)
      // handleCodeInApp: true redirects to our app with the action code,
      // allowing us to handle password setup and auto-login
      const baseUrl = appUrl.value() || "https://idmc-gcfsm-dev.web.app";
      const actionCodeSettings = {
        url: `${baseUrl}/admin/password-setup`,
        handleCodeInApp: true,
      };

      const inviteLink = await auth.generatePasswordResetLink(
        email,
        actionCodeSettings
      );

      log.info("Generated invitation link", {email});

      // Calculate expiration (72 hours from now)
      const inviteExpiresAt = new Date();
      inviteExpiresAt.setHours(inviteExpiresAt.getHours() + 72);

      // Determine if email was sent via SendGrid or using Firebase fallback
      let emailSentViaSendGrid = false;

      // Send invitation email via SendGrid if enabled
      if (isSendGridEnabled()) {
        try {
          await sendInvitationEmailViaSendGrid(
            email,
            displayName || email.split("@")[0],
            role,
            inviteLink
          );
          emailSentViaSendGrid = true;
          log.info("Invitation email sent via SendGrid", {email});
        } catch (sendGridError) {
          log.error("SendGrid email failed, storing link for manual sharing", sendGridError);
        }
      }

      // If SendGrid not enabled or failed, log for Firebase fallback
      if (!emailSentViaSendGrid) {
        log.info("SendGrid not enabled, invite link stored in Firestore", {
          email,
          sendGridEnabled: isSendGridEnabled(),
        });
      }

      // Update the admin document with invitation details
      // If the document ID doesn't match the Auth UID, migrate the document
      // Store invite link only if email wasn't sent
      const updateData = {
        invitationSentAt: FieldValue.serverTimestamp(),
        inviteExpiresAt: inviteExpiresAt,
        inviteLink: emailSentViaSendGrid ? null : inviteLink,
        emailSent: emailSentViaSendGrid,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (adminId !== userRecord.uid) {
        // Create new document with correct UID
        const adminRef = db.collection(COLLECTIONS.ADMINS).doc(userRecord.uid);
        await adminRef.set({
          ...adminData,
          ...updateData,
        });

        // Delete the old document with temporary ID
        await snapshot.ref.delete();

        log.info("Migrated admin document", {
          oldId: adminId,
          newId: userRecord.uid,
        });
      } else {
        // Update existing document
        await snapshot.ref.update(updateData);
      }

      log.end(true, {
        email,
        role,
        emailSent: emailSentViaSendGrid,
        migrated: adminId !== userRecord.uid,
      });
    } catch (error) {
      log.error("Error processing invitation", error, {email});

      // Update the admin document to reflect the error
      try {
        await snapshot.ref.update({
          invitationError: (error as Error).message || "Unknown error",
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch (updateError) {
        log.error("Failed to update admin document with error", updateError);
      }

      log.end(false, {email, error: (error as Error).message});
      throw error;
    }
  }
);

/**
 * Generates the HTML email template for registration confirmation
 *
 * @param {Object} registration - Registration data
 * @return {string} HTML string for the email
 */
function generateRegistrationConfirmationHtml(
  registration: {
    registrationId: string;
    shortCode: string;
    primaryAttendee: {
      firstName: string;
      lastName: string;
      email: string;
    };
    totalAmount: number;
    paymentDeadline: string;
    church: {
      name: string;
    };
    status: string;
  }
): string {
  const {
    registrationId,
    shortCode,
    primaryAttendee,
    totalAmount,
    paymentDeadline,
    church,
    status,
  } = registration;
  const isPendingPayment = status === REGISTRATION_STATUS.PENDING_PAYMENT;
  const formattedDeadline = new Date(paymentDeadline).toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Received - IDMC 2026</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                IDMC 2026
              </h1>
              <p style="margin: 8px 0 0; color: #bfdbfe; font-size: 14px;">
                Registration Received
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 24px; font-weight: 600;">
                Thank You for Registering!
              </h2>
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi ${primaryAttendee.firstName},
              </p>
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We have received your registration for <strong>IDMC 2026</strong> from ${church.name}.
                ${isPendingPayment ? "Please complete your payment to confirm your registration." : "Your payment proof has been submitted and is being reviewed."}
              </p>

              <!-- Registration Details -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px; background-color: #f9fafb; border-radius: 8px;">
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase;">
                      Registration ID
                    </p>
                    <p style="margin: 0; color: #1f2937; font-size: 24px; font-weight: 700; font-family: monospace;">
                      ${registrationId}
                    </p>
                    <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">
                      Quick Code: <strong style="color: #1e40af; font-family: monospace;">${shortCode}</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Payment Info -->
              ${isPendingPayment ? `
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: 600;">
                      Action Required: Complete Payment
                    </p>
                    <p style="margin: 0 0 8px; color: #78350f; font-size: 14px; line-height: 1.5;">
                      Total Amount: <strong>PHP ${totalAmount.toLocaleString()}</strong>
                    </p>
                    <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.5;">
                      Payment Deadline: <strong>${formattedDeadline}</strong>
                    </p>
                  </td>
                </tr>
              </table>
              ` : `
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #dbeafe; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 8px; color: #1e40af; font-size: 14px; font-weight: 600;">
                      Payment Under Review
                    </p>
                    <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.5;">
                      We have received your payment proof and it is being verified. You will receive a confirmation email once your registration is confirmed.
                    </p>
                  </td>
                </tr>
              </table>
              `}

              <!-- Status Check Link -->
              <p style="margin: 24px 0 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                Check your registration status anytime at:
              </p>
              <p style="margin: 8px 0 0;">
                <a href="${appUrl.value()}/registration/status?id=${registrationId}" style="color: #1e40af; text-decoration: underline;">
                  ${appUrl.value()}/registration/status
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center; line-height: 1.5;">
                IDMC 2026 - International Discipleship and Missions Congress<br>
                GCF South Metro, Daang Hari Road, Las Piñas City, Philippines
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Attendee info with QR code for email
 */
interface AttendeeWithQR {
  firstName: string;
  lastName: string;
  email?: string;
  qrCodeDataUrl: string;
  qrCodeBase64: string;
  contentId: string;
  attendeeIndex: number;
}

/**
 * Formats a 24-hour time string (HH:MM) to 12-hour format with AM/PM
 *
 * @param {string} time24 - Time in HH:MM format (e.g., "07:00", "14:30")
 * @return {string} Formatted time string (e.g., "7:00 AM", "2:30 PM")
 */
function formatEventTime(time24: string): string {
  if (!time24) return "";
  const [hoursStr, minutes] = time24.split(":");
  const hours = parseInt(hoursStr, 10);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes} ${period}`;
}

/**
 * Generates the HTML email template for ticket/confirmation (primary attendee)
 * Includes all QR codes for the entire group
 *
 * @param {Object} registration - Registration data
 * @param {Object} settings - Event settings data
 * @param {AttendeeWithQR[]} attendeesWithQR - Array of attendees with QR codes
 * @param {WhatToBringItem[]} whatToBringItems - Array of what to bring items
 * @return {string} HTML string for the email
 */
function generateTicketEmailHtml(
  registration: {
    registrationId: string;
    shortCode: string;
    qrCodeData: string;
    primaryAttendee: {
      firstName: string;
      lastName: string;
      email: string;
    };
    totalAmount: number;
    church: {
      name: string;
    };
    additionalAttendees?: Array<{
      firstName: string;
      lastName: string;
      email?: string;
    }>;
  },
  settings: {
    title: string;
    startDate: string;
    startTime?: string;
    venue: {
      name: string;
      address: string;
    };
  },
  attendeesWithQR: AttendeeWithQR[],
  whatToBringItems: WhatToBringItem[] = DEFAULT_WHAT_TO_BRING_ITEMS
): string {
  const {
    registrationId,
    shortCode,
    primaryAttendee,
    church,
  } = registration;
  const eventDate = new Date(settings.startDate).toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const attendeeCount = attendeesWithQR.length;

  // Generate QR code sections for all attendees
  const qrCodeSections = attendeesWithQR.map((attendee, index) => {
    const isAdditional = index > 0;
    const label = isAdditional ? `Guest ${index}` : "Primary";
    return `
      <div style="display: inline-block; margin: 10px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center; vertical-align: top; width: 200px;">
        <img src="cid:${attendee.contentId}" alt="QR Code for ${attendee.firstName}" width="150" height="150" style="display: block; margin: 0 auto 8px; border: 2px solid #f3f4f6; border-radius: 4px;" />
        <p style="margin: 0 0 4px; color: #1f2937; font-size: 14px; font-weight: 600;">
          ${attendee.firstName} ${attendee.lastName}
        </p>
        <p style="margin: 0; color: #6b7280; font-size: 12px;">
          ${label}
        </p>
      </div>`;
  }).join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Tickets - IDMC 2026</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 700px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #15803d 0%, #22c55e 100%); border-radius: 12px 12px 0 0;">
              <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: white; border-radius: 50%; line-height: 64px; font-size: 32px;">
                ✓
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                Registration Confirmed!
              </h1>
              <p style="margin: 8px 0 0; color: #bbf7d0; font-size: 14px;">
                Your payment has been verified
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi ${primaryAttendee.firstName},
              </p>
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Great news! Your payment has been confirmed and your registration for <strong>${settings.title}</strong> is now complete.
                ${attendeeCount > 1 ? "<br><br><strong>Important:</strong> Each attendee has their own unique QR code below. Please share the appropriate QR code with each member of your group." : ""}
              </p>

              <!-- Registration Info -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px; background-color: #f9fafb; border-radius: 8px; text-align: center;">
                    <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; text-transform: uppercase;">
                      Registration ID
                    </p>
                    <p style="margin: 0 0 8px; color: #1f2937; font-size: 24px; font-weight: 700; font-family: monospace;">
                      ${registrationId}
                    </p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      Quick Code: <strong style="color: #1e40af; font-family: monospace;">${shortCode}</strong> | ${attendeeCount} Attendee${attendeeCount > 1 ? "s" : ""} from ${church.name}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- QR Codes Section -->
              <div style="margin: 24px 0; text-align: center;">
                <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 600;">
                  ${attendeeCount > 1 ? "Individual Check-in QR Codes" : "Your Check-in QR Code"}
                </h3>
                <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px;">
                  ${attendeeCount > 1 ? "Each person must scan their own QR code at check-in" : "Scan this QR code at check-in"}
                </p>
                ${qrCodeSections}
              </div>

              <!-- Event Details -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f0fdf4; border-radius: 8px; margin-top: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 8px; color: #14532d; font-size: 14px; font-weight: 600;">
                      Event Details
                    </p>
                    <p style="margin: 0 0 4px; color: #166534; font-size: 14px;">
                      <strong>Date:</strong> ${eventDate}
                    </p>
                    <p style="margin: 0 0 4px; color: #166534; font-size: 14px;">
                      <strong>Time:</strong> ${formatEventTime(settings.startTime || "")}
                    </p>
                    <p style="margin: 0 0 4px; color: #166534; font-size: 14px;">
                      <strong>Venue:</strong> ${settings.venue.name}
                    </p>
                    <p style="margin: 0; color: #166534; font-size: 14px;">
                      <strong>Address:</strong> ${settings.venue.address}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Instructions -->
              <p style="margin: 24px 0 8px; color: #1f2937; font-size: 14px; font-weight: 600;">
                What to bring on event day:
              </p>
              <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                ${generateWhatToBringListHtml(whatToBringItems)}
              </ul>

              <!-- View Ticket Link -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl.value()}/registration/status?id=${registrationId}"
                       style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px;">
                      View All Tickets Online
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center; line-height: 1.5;">
                ${settings.title}<br>
                GCF South Metro, Daang Hari Road, Las Piñas City, Philippines
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Generates the HTML email template for individual attendee ticket
 *
 * @param {Object} registration - Registration data
 * @param {Object} settings - Event settings data
 * @param {AttendeeWithQR} attendee - Attendee info with QR code
 * @param {WhatToBringItem[]} whatToBringItems - Array of what to bring items
 * @return {string} HTML string for the email
 */
function generateIndividualTicketEmailHtml(
  registration: {
    registrationId: string;
    shortCode: string;
    church: {
      name: string;
    };
    primaryAttendee: {
      firstName: string;
      lastName: string;
    };
  },
  settings: {
    title: string;
    startDate: string;
    startTime?: string;
    venue: {
      name: string;
      address: string;
    };
  },
  attendee: AttendeeWithQR,
  whatToBringItems: WhatToBringItem[] = DEFAULT_WHAT_TO_BRING_ITEMS
): string {
  const {
    registrationId,
    shortCode,
    church,
    primaryAttendee,
  } = registration;
  const eventDate = new Date(settings.startDate).toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Ticket - IDMC 2026</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #15803d 0%, #22c55e 100%); border-radius: 12px 12px 0 0;">
              <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: white; border-radius: 50%; line-height: 64px; font-size: 32px;">
                ✓
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                Your Ticket is Ready!
              </h1>
              <p style="margin: 8px 0 0; color: #bbf7d0; font-size: 14px;">
                Registration confirmed
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi ${attendee.firstName},
              </p>
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                You've been registered for <strong>${settings.title}</strong> by ${primaryAttendee.firstName} ${primaryAttendee.lastName} from ${church.name}.
              </p>

              <!-- Ticket Box with QR Code -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 2px dashed #e5e7eb; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <div style="margin: 20px 0;">
                      <img src="cid:${attendee.contentId}" alt="Your Check-in QR Code" width="180" height="180" style="display: block; margin: 0 auto; border: 4px solid #f3f4f6; border-radius: 8px;" />
                      <p style="margin: 8px 0 0; color: #6b7280; font-size: 12px;">
                        Your personal check-in QR code
                      </p>
                    </div>
                    <p style="margin: 16px 0 0; color: #1f2937; font-size: 18px; font-weight: 600;">
                      ${attendee.firstName} ${attendee.lastName}
                    </p>
                    <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">
                      Registration: <strong style="font-family: monospace;">${registrationId}</strong>
                    </p>
                    <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">
                      Quick Code: <strong style="color: #1e40af; font-family: monospace;">${shortCode}</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Event Details -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f0fdf4; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 8px; color: #14532d; font-size: 14px; font-weight: 600;">
                      Event Details
                    </p>
                    <p style="margin: 0 0 4px; color: #166534; font-size: 14px;">
                      <strong>Date:</strong> ${eventDate}
                    </p>
                    <p style="margin: 0 0 4px; color: #166534; font-size: 14px;">
                      <strong>Time:</strong> ${formatEventTime(settings.startTime || "")}
                    </p>
                    <p style="margin: 0 0 4px; color: #166534; font-size: 14px;">
                      <strong>Venue:</strong> ${settings.venue.name}
                    </p>
                    <p style="margin: 0; color: #166534; font-size: 14px;">
                      <strong>Address:</strong> ${settings.venue.address}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Instructions -->
              <p style="margin: 24px 0 8px; color: #1f2937; font-size: 14px; font-weight: 600;">
                What to bring on event day:
              </p>
              <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                ${generateWhatToBringListHtml(whatToBringItems)}
              </ul>

              <!-- View Ticket Link -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl.value()}/registration/status?id=${registrationId}"
                       style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px;">
                      View Ticket Online
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center; line-height: 1.5;">
                ${settings.title}<br>
                GCF South Metro, Daang Hari Road, Las Piñas City, Philippines
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Sends registration confirmation email
 *
 * @param {string} to - Recipient email address
 * @param {Object} registration - Registration data
 * @return {Promise<void>} Promise that resolves when email is sent
 */
async function sendRegistrationConfirmationEmail(
  to: string,
  registration: Parameters<typeof generateRegistrationConfirmationHtml>[0]
): Promise<void> {
  const apiKey = getSendGridApiKey();
  if (!apiKey) {
    logger.warn("SendGrid API key not configured, skipping email");
    return;
  }

  sgMail.setApiKey(apiKey);

  const fromEmail = senderEmail.value();
  if (!fromEmail) {
    logger.warn("SENDER_EMAIL not configured, skipping email");
    return;
  }

  const msg = {
    to,
    from: {
      email: fromEmail,
      name: senderName.value() || "IDMC Registration",
    },
    subject: `Registration Received - ${registration.registrationId}`,
    html: generateRegistrationConfirmationHtml(registration),
  };

  await sgMail.send(msg);
  logger.info(`Registration confirmation email sent to ${to}`);
}

/**
 * Generates QR codes for all attendees in a registration
 *
 * @param {string} registrationId - Registration ID
 * @param {Object} primaryAttendee - Primary attendee info
 * @param {Array} additionalAttendees - Additional attendees
 * @return {Promise<AttendeeWithQR[]>} Array of attendees with their QR codes
 */
async function generateAllAttendeeQRCodes(
  registrationId: string,
  primaryAttendee: {firstName: string; lastName: string; email: string},
  additionalAttendees?: Array<{
    firstName: string;
    lastName: string;
    email?: string;
  }>
): Promise<AttendeeWithQR[]> {
  const attendeesWithQR: AttendeeWithQR[] = [];

  // Helper to extract base64 from data URL
  const extractBase64 = (dataUrl: string): string => {
    const base64Prefix = "data:image/png;base64,";
    return dataUrl.startsWith(base64Prefix) ?
      dataUrl.substring(base64Prefix.length) :
      dataUrl;
  };

  // Generate QR code for primary attendee
  const primaryQrData = `${registrationId}-0`;
  const primaryQrCodeDataUrl = await generateQRCodeDataUrl(primaryQrData);
  const primaryContentId = `qr-${registrationId}-0`;
  attendeesWithQR.push({
    firstName: primaryAttendee.firstName,
    lastName: primaryAttendee.lastName,
    email: primaryAttendee.email,
    qrCodeDataUrl: primaryQrCodeDataUrl,
    qrCodeBase64: extractBase64(primaryQrCodeDataUrl),
    contentId: primaryContentId,
    attendeeIndex: 0,
  });

  // Generate QR codes for additional attendees
  if (additionalAttendees && additionalAttendees.length > 0) {
    for (let i = 0; i < additionalAttendees.length; i++) {
      const attendee = additionalAttendees[i];
      const qrData = `${registrationId}-${i + 1}`;
      const qrCodeDataUrl = await generateQRCodeDataUrl(qrData);
      const contentId = `qr-${registrationId}-${i + 1}`;
      attendeesWithQR.push({
        firstName: attendee.firstName,
        lastName: attendee.lastName,
        email: attendee.email ?? undefined,
        qrCodeDataUrl,
        qrCodeBase64: extractBase64(qrCodeDataUrl),
        contentId,
        attendeeIndex: i + 1,
      });
    }
  }

  return attendeesWithQR;
}

/**
 * Sends ticket/confirmation email to primary attendee with all QR codes
 *
 * @param {string} to - Recipient email address
 * @param {Object} registration - Registration data
 * @param {Object} settings - Event settings data
 * @param {AttendeeWithQR[]} attendeesWithQR - All attendees with their QR codes
 * @param {WhatToBringItem[]} whatToBringItems - Array of what to bring items
 * @return {Promise<void>} Promise that resolves when email is sent
 */
async function sendTicketEmail(
  to: string,
  registration: Parameters<typeof generateTicketEmailHtml>[0],
  settings: Parameters<typeof generateTicketEmailHtml>[1],
  attendeesWithQR: AttendeeWithQR[],
  whatToBringItems: WhatToBringItem[] = DEFAULT_WHAT_TO_BRING_ITEMS
): Promise<void> {
  const apiKey = getSendGridApiKey();
  if (!apiKey) {
    logger.warn("SendGrid API key not configured, skipping email");
    return;
  }

  sgMail.setApiKey(apiKey);

  const fromEmail = senderEmail.value();
  if (!fromEmail) {
    logger.warn("SENDER_EMAIL not configured, skipping email");
    return;
  }

  // Create attachments for QR codes using Content-ID (CID) for inline display
  const attachments = attendeesWithQR.map((attendee) => ({
    content: attendee.qrCodeBase64,
    filename: `qr-${attendee.contentId}.png`,
    type: "image/png",
    disposition: "inline" as const,
    content_id: attendee.contentId,
  }));

  const msg = {
    to,
    from: {
      email: fromEmail,
      name: senderName.value() || "IDMC Registration",
    },
    subject: `Your IDMC 2026 Ticket${attendeesWithQR.length > 1 ? "s" : ""} - ${registration.registrationId}`,
    html: generateTicketEmailHtml(
      registration,
      settings,
      attendeesWithQR,
      whatToBringItems
    ),
    attachments,
  };

  await sgMail.send(msg);
  logger.info(`Ticket email sent to ${to} with ${attendeesWithQR.length} QR code(s)`);
}

/**
 * Sends individual ticket email to an additional attendee
 *
 * @param {string} to - Recipient email address
 * @param {Object} registration - Registration data
 * @param {Object} settings - Event settings data
 * @param {AttendeeWithQR} attendee - Attendee info with their QR code
 * @param {WhatToBringItem[]} whatToBringItems - Array of what to bring items
 * @return {Promise<void>} Promise that resolves when email is sent
 */
async function sendIndividualTicketEmail(
  to: string,
  registration: {
    registrationId: string;
    shortCode: string;
    church: {name: string};
    primaryAttendee: {firstName: string; lastName: string};
  },
  settings: Parameters<typeof generateIndividualTicketEmailHtml>[1],
  attendee: AttendeeWithQR,
  whatToBringItems: WhatToBringItem[] = DEFAULT_WHAT_TO_BRING_ITEMS
): Promise<void> {
  const apiKey = getSendGridApiKey();
  if (!apiKey) {
    logger.warn("SendGrid API key not configured, skipping email");
    return;
  }

  sgMail.setApiKey(apiKey);

  const fromEmail = senderEmail.value();
  if (!fromEmail) {
    logger.warn("SENDER_EMAIL not configured, skipping email");
    return;
  }

  // Create attachment for QR code using Content-ID (CID) for inline display
  const attachments = [{
    content: attendee.qrCodeBase64,
    filename: `qr-${attendee.contentId}.png`,
    type: "image/png",
    disposition: "inline" as const,
    content_id: attendee.contentId,
  }];

  const msg = {
    to,
    from: {
      email: fromEmail,
      name: senderName.value() || "IDMC Registration",
    },
    subject: `Your IDMC 2026 Ticket - ${registration.registrationId}`,
    html: generateIndividualTicketEmailHtml(
      registration,
      settings,
      attendee,
      whatToBringItems
    ),
    attachments,
  };

  await sgMail.send(msg);
  logger.info(`Individual ticket email sent to ${to} for ${attendee.firstName} ${attendee.lastName}`);
}

/**
 * Firestore trigger that sends confirmation email and SMS when a new
 * registration is created
 */
export const onRegistrationCreated = onDocumentCreated(
  {
    document: `${COLLECTIONS.REGISTRATIONS}/{registrationId}`,
    database: DATABASE_ID,
    secrets: [sendgridApiKey],
  },
  async (event) => {
    const registrationId = event.params.registrationId;
    const log = cfLogger.createContext("onRegistrationCreated", registrationId);

    const snapshot = event.data;
    if (!snapshot) {
      log.error("No data associated with the event");
      log.end(false, {reason: "no_data"});
      return;
    }

    const registrationData = snapshot.data();
    const email = registrationData.primaryAttendee?.email;
    const phone = registrationData.primaryAttendee?.phone;
    const additionalCount = registrationData.additionalAttendees?.length || 0;

    log.start({
      registrationId,
      shortCode: registrationData.shortCode,
      status: registrationData.status,
      email,
      hasPhone: !!phone,
      attendeeCount: 1 + additionalCount,
      totalAmount: registrationData.totalAmount,
    });

    const updateData: Record<string, unknown> = {};
    let emailSent = false;
    let smsSent = false;

    // Get email settings to check if we should skip test data
    const emailSettings = await getEmailSettings();

    // Send confirmation email if SendGrid is enabled
    if (isSendGridEnabled() && email) {
      // Check if we should skip this email (test data or trigger emails disabled)
      if (!emailSettings.triggerEmailsEnabled) {
        log.info("Trigger emails disabled in settings, skipping confirmation email");
      } else if (shouldSkipEmail(email, registrationData, emailSettings)) {
        log.info("Skipping confirmation email for test/seeded data", {email});
      } else {
        try {
          await sendRegistrationConfirmationEmail(email, {
            registrationId: registrationData.registrationId,
            shortCode: registrationData.shortCode,
            primaryAttendee: registrationData.primaryAttendee,
            totalAmount: registrationData.totalAmount,
            paymentDeadline: registrationData.paymentDeadline,
            church: registrationData.church,
            status: registrationData.status,
          });
          updateData.confirmationEmailSent = true;
          updateData.confirmationEmailSentAt = FieldValue.serverTimestamp();
          emailSent = true;
          log.info("Confirmation email sent", {email});
        } catch (error) {
          log.error("Error sending confirmation email", error, {email});
        }
      }
    } else if (!isSendGridEnabled()) {
      log.info("SendGrid not enabled, skipping confirmation email");
    }

    // Send confirmation SMS if phone is available
    if (phone) {
      try {
        const smsMessage = SMS_TEMPLATES.registrationConfirmation(
          registrationData.primaryAttendee.firstName,
          registrationData.registrationId,
          registrationData.shortCode,
          registrationData.totalAmount,
          registrationData.paymentDeadline
        );
        smsSent = await sendSmsViaOneWaySms(phone, smsMessage);
        if (smsSent) {
          updateData.confirmationSmsSent = true;
          updateData.confirmationSmsSentAt = FieldValue.serverTimestamp();
          log.info("Confirmation SMS sent", {phone: phone.slice(-4)});
        }
      } catch (error) {
        log.error("Error sending confirmation SMS", error);
      }
    }

    // Update document with notification status
    if (Object.keys(updateData).length > 0) {
      await snapshot.ref.update(updateData);
    }

    // Update conference stats for new registration
    const confirmedStatuses = [
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.PENDING_VERIFICATION,
    ];

    let statsUpdated = false;
    let workshopsUpdated = 0;

    if (confirmedStatuses.includes(registrationData.status)) {
      try {
        const db = getFirestore(DATABASE_ID);
        const additionalAttendees = registrationData.additionalAttendees;
        const attendeeCount = 1 + (additionalAttendees?.length || 0);

        // Prepare stats update
        const statsUpdate: Record<string, unknown> = {
          registeredAttendeeCount: FieldValue.increment(attendeeCount),
          lastUpdatedAt: FieldValue.serverTimestamp(),
        };

        // Track registration status counts
        if (registrationData.status === REGISTRATION_STATUS.CONFIRMED) {
          statsUpdate.confirmedRegistrationCount = FieldValue.increment(1);
        } else if (
          registrationData.status === REGISTRATION_STATUS.PENDING_VERIFICATION
        ) {
          statsUpdate.pendingVerificationCount = FieldValue.increment(1);
        }

        // Track finance stats if payment exists
        if (registrationData.payment?.amountPaid) {
          const amount = registrationData.payment.amountPaid;
          if (registrationData.status === REGISTRATION_STATUS.CONFIRMED) {
            statsUpdate.totalConfirmedPayments = FieldValue.increment(amount);
          } else if (
            registrationData.status === REGISTRATION_STATUS.PENDING_VERIFICATION
          ) {
            statsUpdate.totalPendingPayments = FieldValue.increment(amount);
          }

          // Track per-bank-account stats
          if (registrationData.payment.bankAccountId) {
            const bankId = registrationData.payment.bankAccountId;
            if (registrationData.status === REGISTRATION_STATUS.CONFIRMED) {
              statsUpdate[`bankAccountStats.${bankId}.confirmed`] =
                FieldValue.increment(amount);
            } else {
              statsUpdate[`bankAccountStats.${bankId}.pending`] =
                FieldValue.increment(amount);
            }
            statsUpdate[`bankAccountStats.${bankId}.count`] =
              FieldValue.increment(1);
          }
        }

        // Track church stats
        const churchName = registrationData.church?.name || "Unknown Church";
        const churchCity = registrationData.church?.city || "";
        // Use a sanitized key (replace dots and slashes which are
        // invalid in Firestore paths)
        const churchKey = `${churchName}|${churchCity}`
          .replace(/\./g, "_")
          .replace(/\//g, "_");
        statsUpdate[`churchStats.${churchKey}.name`] = churchName;
        statsUpdate[`churchStats.${churchKey}.city`] = churchCity;
        statsUpdate[`churchStats.${churchKey}.delegateCount`] =
          FieldValue.increment(attendeeCount);
        statsUpdate[`churchStats.${churchKey}.registrationCount`] =
          FieldValue.increment(1);

        // Track food stats for primary attendee
        const primaryFood = registrationData.primaryAttendee?.foodChoice;
        if (primaryFood) {
          statsUpdate[`foodStats.${primaryFood}`] = FieldValue.increment(1);
          statsUpdate.totalWithFoodChoice = FieldValue.increment(1);
        } else {
          statsUpdate.totalWithoutFoodChoice = FieldValue.increment(1);
        }

        // Track food stats for additional attendees
        if (registrationData.additionalAttendees) {
          registrationData.additionalAttendees.forEach(
            (attendee: {foodChoice?: string}) => {
              if (attendee.foodChoice) {
                statsUpdate[`foodStats.${attendee.foodChoice}`] =
                  FieldValue.increment(1);
                statsUpdate.totalWithFoodChoice = FieldValue.increment(1);
              } else {
                statsUpdate.totalWithoutFoodChoice = FieldValue.increment(1);
              }
            }
          );
        }

        // Update stats document
        const statsRef = db.collection(COLLECTIONS.STATS).doc(STATS_DOC_ID);
        await statsRef.set(statsUpdate, {merge: true});
        statsUpdated = true;

        log.info("Updated stats for new registration", {attendeeCount});

        // Update workshop counts
        const allWorkshopSelections: string[] = [];

        if (registrationData.primaryAttendee?.workshopSelections) {
          registrationData.primaryAttendee.workshopSelections.forEach(
            (selection: {sessionId?: string}) => {
              if (selection.sessionId) {
                allWorkshopSelections.push(selection.sessionId);
              }
            }
          );
        }

        if (registrationData.additionalAttendees) {
          registrationData.additionalAttendees.forEach(
            (attendee: {workshopSelections?: Array<{sessionId?: string}>}) => {
              if (attendee.workshopSelections) {
                attendee.workshopSelections.forEach(
                  (selection: {sessionId?: string}) => {
                    if (selection.sessionId) {
                      allWorkshopSelections.push(selection.sessionId);
                    }
                  }
                );
              }
            }
          );
        }

        if (allWorkshopSelections.length > 0) {
          const sessionsCollection = db.collection(COLLECTIONS.SESSIONS);
          for (const sessionId of allWorkshopSelections) {
            await sessionsCollection.doc(sessionId).update({
              registeredCount: FieldValue.increment(1),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
          workshopsUpdated = allWorkshopSelections.length;
          log.info("Updated workshop counts", {workshopCount: workshopsUpdated});
        }
      } catch (statsError) {
        log.error("Error updating stats for new registration", statsError);
        // Don't throw - stats update failure shouldn't fail the registration
      }
    }

    log.end(true, {
      emailSent,
      smsSent,
      statsUpdated,
      workshopsUpdated,
    });
  }
);

/**
 * Firestore trigger that sends ticket email and SMS when payment is confirmed
 */
export const onPaymentConfirmed = onDocumentUpdated(
  {
    document: `${COLLECTIONS.REGISTRATIONS}/{registrationId}`,
    database: DATABASE_ID,
    secrets: [sendgridApiKey],
  },
  async (event) => {
    const registrationId = event.params.registrationId;
    const log = cfLogger.createContext("onPaymentConfirmed", registrationId);

    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!before || !after) {
      log.warn("No before/after data in event");
      return;
    }

    // Check if status changed to confirmed
    if (before.status === REGISTRATION_STATUS.CONFIRMED ||
        after.status !== REGISTRATION_STATUS.CONFIRMED) {
      // Not a status change to confirmed, skip silently
      return;
    }

    const additionalCount = after.additionalAttendees?.length || 0;
    log.start({
      registrationId,
      shortCode: after.shortCode,
      previousStatus: before.status,
      newStatus: after.status,
      attendeeCount: 1 + additionalCount,
      totalAmount: after.totalAmount,
    });

    const primaryEmail = after.primaryAttendee?.email;
    const primaryPhone = after.primaryAttendee?.phone;
    const updateData: Record<string, unknown> = {};

    // Get conference settings for event details (needed for email)
    // These fallback values should match frontend DEFAULT_SETTINGS and only
    // be used if Firestore data is missing - the actual values should come
    // from Firestore
    const db = getFirestore(DATABASE_ID);
    const defaultSettings = {
      title: "IDMC 2026",
      startDate: "2026-03-28",
      startTime: "07:00",
      venue: {
        name: "GCF South Metro",
        address: "Daang Hari Road, Versailles, Almanza Dos, Las Piñas City 1750 Philippines",
      },
    };
    let settings: typeof defaultSettings = defaultSettings;
    try {
      const settingsDoc = await db.collection(COLLECTIONS.CONFERENCES).doc("conference-settings").get();
      const data = settingsDoc.data();
      if (data) {
        // Log warnings when using fallback values - indicates Firestore
        // data may be incomplete
        if (!data.startDate) {
          logger.warn("Conference startDate not found in Firestore, using fallback");
        }
        if (!data.venue?.name) {
          logger.warn("Conference venue name not found in Firestore, using fallback");
        }
        if (!data.venue?.address) {
          logger.warn("Conference venue address not found in Firestore, using fallback");
        }
        settings = {
          title: data.title || defaultSettings.title,
          startDate: data.startDate || defaultSettings.startDate,
          startTime: data.startTime || defaultSettings.startTime,
          venue: {
            name: data.venue?.name || defaultSettings.venue.name,
            address: data.venue?.address || defaultSettings.venue.address,
          },
        };
      } else {
        logger.warn("Conference settings document not found in Firestore, using fallbacks");
      }
    } catch (error) {
      log.warn("Could not fetch settings, using defaults", {error});
    }

    // Fetch "What to Bring" items
    let whatToBringItems: WhatToBringItem[] = DEFAULT_WHAT_TO_BRING_ITEMS;
    try {
      whatToBringItems = await getPublishedWhatToBringItems();
      log.info("Fetched What to Bring items", {count: whatToBringItems.length});
    } catch (error) {
      log.warn("Could not fetch What to Bring items, using defaults", {error});
    }

    let ticketEmailSent = false;
    let additionalEmailsSent = 0;
    let smsSent = false;

    // Get email settings to check if we should skip test data
    const emailSettings = await getEmailSettings();

    // Send ticket email if SendGrid is enabled
    if (isSendGridEnabled() && primaryEmail) {
      // Check if we should skip this email (test data or trigger emails disabled)
      if (!emailSettings.triggerEmailsEnabled) {
        log.info("Trigger emails disabled in settings, skipping ticket email");
      } else if (shouldSkipEmail(primaryEmail, after, emailSettings)) {
        log.info("Skipping ticket email for test/seeded data", {
          email: primaryEmail,
        });
      } else {
        try {
          // Generate QR codes for all attendees
          const attendeesWithQR = await generateAllAttendeeQRCodes(
            after.registrationId,
            after.primaryAttendee,
            after.additionalAttendees
          );

          log.info("Generated QR codes for all attendees", {
            qrCodeCount: attendeesWithQR.length,
          });

          // Send email to primary attendee with ALL QR codes
          await sendTicketEmail(primaryEmail, {
            registrationId: after.registrationId,
            shortCode: after.shortCode,
            qrCodeData: after.qrCodeData,
            primaryAttendee: after.primaryAttendee,
            totalAmount: after.totalAmount,
            church: after.church,
            additionalAttendees: after.additionalAttendees,
          }, settings, attendeesWithQR, whatToBringItems);

          updateData.ticketEmailSent = true;
          updateData.ticketEmailSentAt = FieldValue.serverTimestamp();
          ticketEmailSent = true;
          log.info("Ticket email sent to primary attendee", {email: primaryEmail});

          // Send individual emails to additional attendees with emails
          const additionalAttendees = after.additionalAttendees || [];

          for (let i = 0; i < additionalAttendees.length; i++) {
            const attendee = additionalAttendees[i];
            const attendeeEmail = attendee.email?.trim();

            if (attendeeEmail) {
              // Skip test email domains for additional attendees too
              if (isTestEmailDomain(attendeeEmail)) {
                log.info("Skipping additional attendee email (test domain)", {
                  attendeeEmail,
                  attendeeIndex: i + 1,
                });
                continue;
              }

              try {
                const attendeeWithQR = attendeesWithQR.find(
                  (a) => a.attendeeIndex === i + 1
                );
                if (attendeeWithQR) {
                  await sendIndividualTicketEmail(
                    attendeeEmail,
                    {
                      registrationId: after.registrationId,
                      shortCode: after.shortCode,
                      church: after.church,
                      primaryAttendee: after.primaryAttendee,
                    },
                    settings,
                    attendeeWithQR,
                    whatToBringItems
                  );
                  additionalEmailsSent++;
                }
              } catch (emailError) {
                log.error("Failed to send individual email", emailError, {
                  attendeeEmail,
                  attendeeIndex: i + 1,
                });
              }
            }
          }

          updateData.additionalEmailsSent = additionalEmailsSent;
          if (additionalEmailsSent > 0) {
            log.info("Sent individual ticket emails to additional attendees", {
              count: additionalEmailsSent,
            });
          }
        } catch (error) {
          log.error("Error sending ticket email", error);
        }
      }
    } else if (!isSendGridEnabled()) {
      log.info("SendGrid not enabled, skipping ticket email");
    }

    // Send confirmation SMS if phone is available
    if (primaryPhone) {
      try {
        const smsMessage = SMS_TEMPLATES.paymentConfirmed(
          after.primaryAttendee.firstName,
          after.shortCode
        );
        smsSent = await sendSmsViaOneWaySms(primaryPhone, smsMessage);
        if (smsSent) {
          updateData.ticketSmsSent = true;
          updateData.ticketSmsSentAt = FieldValue.serverTimestamp();
          log.info("Payment confirmation SMS sent", {phone: primaryPhone.slice(-4)});
        }
      } catch (error) {
        log.error("Error sending payment confirmation SMS", error);
      }
    }

    // Update document with notification status
    if (Object.keys(updateData).length > 0) {
      await event.data?.after?.ref.update(updateData);
    }

    // Update conference stats for newly confirmed registration
    let statsUpdated = false;
    let workshopsUpdated = 0;

    try {
      const additionalAttendees = after.additionalAttendees;
      const attendeeCount = 1 + (additionalAttendees?.length || 0);

      // Prepare stats update
      const statsUpdate: Record<string, unknown> = {
        confirmedRegistrationCount: FieldValue.increment(1),
        lastUpdatedAt: FieldValue.serverTimestamp(),
      };

      // Adjust counts based on previous status
      if (before.status === REGISTRATION_STATUS.PENDING_VERIFICATION) {
        // Registration was already counted in pending verification
        statsUpdate.pendingVerificationCount = FieldValue.increment(-1);
      } else {
        // Registration not yet counted - add to attendee count
        statsUpdate.registeredAttendeeCount = FieldValue.increment(attendeeCount);
      }

      // Track finance stats if payment exists
      if (after.payment?.amountPaid) {
        const amount = after.payment.amountPaid;
        statsUpdate.totalConfirmedPayments = FieldValue.increment(amount);

        // If was pending verification, move from pending to confirmed
        if (before.status === REGISTRATION_STATUS.PENDING_VERIFICATION) {
          statsUpdate.totalPendingPayments = FieldValue.increment(-amount);
        }

        // Track per-bank-account stats
        if (after.payment.bankAccountId) {
          const bankId = after.payment.bankAccountId;
          statsUpdate[`bankAccountStats.${bankId}.confirmed`] =
            FieldValue.increment(amount);
          if (before.status === REGISTRATION_STATUS.PENDING_VERIFICATION) {
            statsUpdate[`bankAccountStats.${bankId}.pending`] =
              FieldValue.increment(-amount);
          }
          // Only increment count if not already counted in pending verification
          if (before.status !== REGISTRATION_STATUS.PENDING_VERIFICATION) {
            statsUpdate[`bankAccountStats.${bankId}.count`] =
              FieldValue.increment(1);
          }
        }
      }

      // Track church stats (only if not already counted in pending verification)
      if (before.status !== REGISTRATION_STATUS.PENDING_VERIFICATION) {
        const churchName = after.church?.name || "Unknown Church";
        const churchCity = after.church?.city || "";
        const churchKey = `${churchName}|${churchCity}`
          .replace(/\./g, "_")
          .replace(/\//g, "_");
        statsUpdate[`churchStats.${churchKey}.name`] = churchName;
        statsUpdate[`churchStats.${churchKey}.city`] = churchCity;
        statsUpdate[`churchStats.${churchKey}.delegateCount`] =
          FieldValue.increment(attendeeCount);
        statsUpdate[`churchStats.${churchKey}.registrationCount`] =
          FieldValue.increment(1);
      }

      // Track food stats for primary attendee
      // (only if not already counted in pending verification)
      if (before.status !== REGISTRATION_STATUS.PENDING_VERIFICATION) {
        const primaryFood = after.primaryAttendee?.foodChoice;
        if (primaryFood) {
          statsUpdate[`foodStats.${primaryFood}`] = FieldValue.increment(1);
          statsUpdate.totalWithFoodChoice = FieldValue.increment(1);
        } else {
          statsUpdate.totalWithoutFoodChoice = FieldValue.increment(1);
        }

        // Track food stats for additional attendees
        if (additionalAttendees) {
          additionalAttendees.forEach(
            (attendee: {foodChoice?: string}) => {
              if (attendee.foodChoice) {
                statsUpdate[`foodStats.${attendee.foodChoice}`] =
                  FieldValue.increment(1);
                statsUpdate.totalWithFoodChoice = FieldValue.increment(1);
              } else {
                statsUpdate.totalWithoutFoodChoice = FieldValue.increment(1);
              }
            }
          );
        }
      }

      // Update stats document
      const statsRef = db.collection(COLLECTIONS.STATS).doc(STATS_DOC_ID);
      await statsRef.set(statsUpdate, {merge: true});
      statsUpdated = true;

      log.info("Updated stats for confirmed registration", {attendeeCount});

      // Update workshop counts (only if not already counted)
      if (before.status !== REGISTRATION_STATUS.PENDING_VERIFICATION) {
        const allWorkshopSelections: string[] = [];

        if (after.primaryAttendee?.workshopSelections) {
          after.primaryAttendee.workshopSelections.forEach(
            (selection: {sessionId?: string}) => {
              if (selection.sessionId) {
                allWorkshopSelections.push(selection.sessionId);
              }
            }
          );
        }

        if (additionalAttendees) {
          additionalAttendees.forEach(
            (attendee: {workshopSelections?: Array<{sessionId?: string}>}) => {
              if (attendee.workshopSelections) {
                attendee.workshopSelections.forEach(
                  (selection: {sessionId?: string}) => {
                    if (selection.sessionId) {
                      allWorkshopSelections.push(selection.sessionId);
                    }
                  }
                );
              }
            }
          );
        }

        if (allWorkshopSelections.length > 0) {
          const sessionsCollection = db.collection(COLLECTIONS.SESSIONS);
          for (const sessionId of allWorkshopSelections) {
            await sessionsCollection.doc(sessionId).update({
              registeredCount: FieldValue.increment(1),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
          workshopsUpdated = allWorkshopSelections.length;
          log.info("Updated workshop counts", {workshopCount: workshopsUpdated});
        }
      }
    } catch (statsError) {
      log.error("Error updating stats for confirmed registration", statsError);
      // Don't throw - stats update failure shouldn't fail the confirmation
    }

    log.end(true, {
      ticketEmailSent,
      additionalEmailsSent,
      smsSent,
      statsUpdated,
      workshopsUpdated,
    });
  }
);

/**
 * Firestore trigger that sends waitlist offer email when status
 * changes to WAITLIST_OFFERED. This email notifies the user that
 * a slot is available and provides payment instructions.
 */
export const onWaitlistOfferSent = onDocumentUpdated(
  {
    document: `${COLLECTIONS.REGISTRATIONS}/{registrationId}`,
    database: DATABASE_ID,
    secrets: [sendgridApiKey],
  },
  async (event) => {
    const registrationId = event.params.registrationId;
    const log = cfLogger.createContext("onWaitlistOfferSent", registrationId);

    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!before || !after) {
      log.warn("No before/after data in event");
      return;
    }

    // Check if status changed to WAITLIST_OFFERED
    if (before.status === REGISTRATION_STATUS.WAITLIST_OFFERED ||
        after.status !== REGISTRATION_STATUS.WAITLIST_OFFERED) {
      // Not a status change to waitlist_offered, skip silently
      return;
    }

    log.start({
      registrationId,
      shortCode: after.shortCode,
      previousStatus: before.status,
      newStatus: after.status,
      paymentDeadline: after.waitlistOfferExpiresAt,
    });

    const primaryEmail = after.primaryAttendee?.email;
    const updateData: Record<string, unknown> = {};

    // Get conference settings for email
    const db = getFirestore(DATABASE_ID);
    let settings = {
      title: "IDMC 2026",
      startDate: "2026-03-28",
      venue: {
        name: "GCF South Metro",
        address: "Daang Hari Road, Versailles, Almanza Dos, Las Piñas City 1750 Philippines",
      },
      contact: {
        email: "idmc@gcfsm.org",
      },
    };

    try {
      const settingsDoc = await db.collection(COLLECTIONS.CONFERENCES).doc("conference-settings").get();
      const data = settingsDoc.data();
      if (data) {
        settings = {
          title: data.title || settings.title,
          startDate: data.startDate || settings.startDate,
          venue: {
            name: data.venue?.name || settings.venue.name,
            address: data.venue?.address || settings.venue.address,
          },
          contact: {
            email: data.contact?.email || settings.contact.email,
          },
        };
      }
    } catch (error) {
      log.warn("Could not fetch settings, using defaults", {error});
    }

    // Get email settings to check if we should skip test data
    const emailSettings = await getEmailSettings();

    // Send waitlist offer email
    if (isSendGridEnabled() && primaryEmail) {
      // Check if we should skip this email (test data or trigger emails disabled)
      if (!emailSettings.triggerEmailsEnabled) {
        log.info("Trigger emails disabled in settings, skipping waitlist offer email");
      } else if (shouldSkipEmail(primaryEmail, after, emailSettings)) {
        log.info("Skipping waitlist offer email for test/seeded data", {
          email: primaryEmail,
        });
      } else {
        try {
          const appUrl = process.env.APP_URL || "https://idmc-gcfsm.web.app";
          const statusPageUrl = `${appUrl}/registration-status?id=${after.registrationId}`;

          // Calculate hours until deadline
          const deadline = new Date(after.waitlistOfferExpiresAt);
          const now = new Date();
          const msPerHour = 1000 * 60 * 60;
          const timeDiff = deadline.getTime() - now.getTime();
          const hoursUntilDeadline = Math.max(
            0, Math.round(timeDiff / msPerHour));

          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const sgMail = require("@sendgrid/mail");
          sgMail.setApiKey(sendgridApiKey.value());

          const emailContent = {
          to: primaryEmail,
          from: {
            email: process.env.SENDER_EMAIL || "noreply@gcfsm.org",
            name: process.env.SENDER_NAME || "IDMC Conference",
          },
          subject: `A Slot is Available! Complete Your ${settings.title} Registration`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
                .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
                .deadline-box { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; }
                .cta-button { display: inline-block; background: #3b82f6; color: white !important; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">A Slot is Available!</h1>
                  <p style="margin: 10px 0 0;">Your waitlist registration can now be confirmed</p>
                </div>
                <div class="content">
                  <p>Great news, ${after.primaryAttendee?.firstName || "there"}!</p>
                  <p>A slot has become available for <strong>${settings.title}</strong>. You can now complete your registration by submitting your payment.</p>

                  <div class="deadline-box">
                    <p style="margin: 0; font-weight: bold; color: #92400e;">Payment Deadline: ${hoursUntilDeadline} hours</p>
                    <p style="margin: 5px 0 0; color: #92400e;">
                      If payment is not received by <strong>${deadline.toLocaleString("en-PH", {dateStyle: "full", timeStyle: "short"})}</strong>,
                      your slot will be offered to the next person on the waitlist.
                    </p>
                  </div>

                  <p><strong>Registration Details:</strong></p>
                  <ul>
                    <li>Registration ID: ${after.registrationId}</li>
                    <li>Quick Code: ${after.shortCode}</li>
                    <li>Amount Due: ₱${(after.totalAmount || 0).toLocaleString()}</li>
                  </ul>

                  <center>
                    <a href="${statusPageUrl}" class="cta-button">Complete Payment Now</a>
                  </center>

                  <p>Click the button above to go to your registration status page where you can upload your payment proof.</p>

                  <p style="margin-top: 30px;">See you at the conference!</p>
                  <p>The ${settings.title} Team</p>
                </div>
                <div class="footer">
                  <p>${settings.venue.name}<br>${settings.venue.address}</p>
                  <p>Questions? Contact us at ${settings.contact.email}</p>
                </div>
              </div>
            </body>
            </html>
          `,
        };

          await sgMail.send(emailContent);
          updateData.waitlistOfferEmailSent = true;
          updateData.waitlistOfferEmailSentAt = FieldValue.serverTimestamp();
          log.info("Waitlist offer email sent", {
            email: primaryEmail,
            hoursUntilDeadline,
          });
        } catch (error) {
          log.error("Error sending waitlist offer email", error);
        }
      }
    }

    // Update document with notification status
    if (Object.keys(updateData).length > 0) {
      await event.data?.after?.ref.update(updateData);
    }

    log.end(true, {
      waitlistOfferEmailSent: updateData.waitlistOfferEmailSent || false,
    });
  }
);

/**
 * Firestore trigger that auto-promotes the next waitlisted person when a
 * confirmed registration is cancelled. This ensures the waitlist queue
 * moves forward automatically.
 */
export const onRegistrationCancelled = onDocumentUpdated(
  {
    document: `${COLLECTIONS.REGISTRATIONS}/{registrationId}`,
    database: DATABASE_ID,
    secrets: [sendgridApiKey],
  },
  async (event) => {
    const registrationId = event.params.registrationId;
    const log = cfLogger.createContext("onRegistrationCancelled", registrationId);

    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!before || !after) {
      log.warn("No before/after data in event");
      return;
    }

    // Only process when a CONFIRMED registration is cancelled
    if (before.status !== REGISTRATION_STATUS.CONFIRMED ||
        after.status !== REGISTRATION_STATUS.CANCELLED) {
      return;
    }

    log.start({
      registrationId,
      previousStatus: before.status,
      newStatus: after.status,
    });

    const db = getFirestore(DATABASE_ID);

    try {
      // Check if waitlist is enabled
      const settingsDoc = await db.collection(COLLECTIONS.CONFERENCES).doc("conference-settings").get();
      const settings = settingsDoc.data();

      if (!settings?.waitlist?.enabled) {
        log.info("Waitlist is not enabled, skipping auto-promotion");
        log.end(true, {promoted: false, reason: "waitlist_disabled"});
        return;
      }

      // Find the next waitlisted registration (FIFO order)
      const waitlistQuery = await db.collection(COLLECTIONS.REGISTRATIONS)
        .where("status", "==", REGISTRATION_STATUS.WAITLISTED)
        .orderBy("waitlistedAt", "asc")
        .limit(1)
        .get();

      if (waitlistQuery.empty) {
        log.info("No waitlisted registrations to promote");
        log.end(true, {promoted: false, reason: "no_waitlist"});
        return;
      }

      const nextWaitlisted = waitlistQuery.docs[0];
      const nextWaitlistedId = nextWaitlisted.id;

      // Calculate payment deadline
      const confStartDate = settings.startDate || new Date().toISOString();
      const conferenceDate = new Date(confStartDate);
      const now = new Date();
      const msPerHour = 1000 * 60 * 60;
      const hoursUntilConference =
        (conferenceDate.getTime() - now.getTime()) / msPerHour;

      let deadlineHours = 48;
      if (hoursUntilConference <= 12) deadlineHours = 6;
      else if (hoursUntilConference <= 24) deadlineHours = 12;
      else if (hoursUntilConference <= 48) deadlineHours = 24;

      const deadlineMs = now.getTime() + deadlineHours * 60 * 60 * 1000;
      const paymentDeadline = new Date(deadlineMs);
      // Ensure deadline doesn't exceed conference start
      const finalDeadline =
        paymentDeadline < conferenceDate ? paymentDeadline : conferenceDate;

      // Update the waitlisted registration to WAITLIST_OFFERED
      await nextWaitlisted.ref.update({
        "status": REGISTRATION_STATUS.WAITLIST_OFFERED,
        "payment.status": REGISTRATION_STATUS.WAITLIST_OFFERED,
        "paymentDeadline": finalDeadline.toISOString(),
        "waitlistOfferSentAt": FieldValue.serverTimestamp(),
        "waitlistOfferExpiresAt": finalDeadline.toISOString(),
        "updatedAt": FieldValue.serverTimestamp(),
      });

      log.info("Auto-promoted next waitlisted registration", {
        promotedRegistrationId: nextWaitlistedId,
        deadlineHours,
        paymentDeadline: finalDeadline.toISOString(),
      });

      log.end(true, {promoted: true, promotedRegistrationId: nextWaitlistedId});
    } catch (error) {
      log.error("Error auto-promoting waitlisted registration", error);
      log.end(false, {error: String(error)});
    }
  }
);

/**
 * Scheduled function that runs daily to cancel expired registrations
 * Runs every day at 1:00 AM Asia/Manila time
 */
export const cancelExpiredRegistrations = onSchedule(
  {
    schedule: "0 1 * * *",
    timeZone: "Asia/Manila",
    region: "asia-southeast1",
  },
  async () => {
    const log = cfLogger.createContext("cancelExpiredRegistrations");
    log.start({schedule: "0 1 * * *", timezone: "Asia/Manila"});

    const db = getFirestore(DATABASE_ID);
    const now = new Date();

    try {
      // Query for pending_payment registrations with expired deadlines
      const expiredQuery = await db.collection(COLLECTIONS.REGISTRATIONS)
        .where("status", "==", REGISTRATION_STATUS.PENDING_PAYMENT)
        .where("paymentDeadline", "<", now.toISOString())
        .get();

      if (expiredQuery.empty) {
        log.info("No expired registrations found");
        log.end(true, {cancelledCount: 0});
        return;
      }

      log.info("Found expired registrations to cancel", {count: expiredQuery.size});

      const batch = db.batch();
      let cancelCount = 0;
      const cancelledIds: string[] = [];

      // Cancel all registrations with PENDING_PAYMENT status past deadline
      // Status is the source of truth:
      // - PENDING_PAYMENT = payment not submitted or rejected by admin
      // - PENDING_VERIFICATION = payment uploaded, awaiting verification
      // If admin rejects payment and sets status back to PENDING_PAYMENT,
      // the registration should be cancelled if deadline passes
      expiredQuery.forEach((doc) => {
        batch.update(doc.ref, {
          "status": REGISTRATION_STATUS.CANCELLED,
          "payment.status": REGISTRATION_STATUS.CANCELLED,
          "cancellation": {
            reason: "Payment deadline exceeded",
            cancelledBy: "system",
            cancelledAt: FieldValue.serverTimestamp(),
          },
          "updatedAt": FieldValue.serverTimestamp(),
        });
        cancelCount++;
        cancelledIds.push(doc.id);
      });

      await batch.commit();
      log.info("Successfully cancelled expired registrations", {
        count: cancelCount,
        registrationIds: cancelledIds,
      });
      log.end(true, {cancelledCount: cancelCount});
    } catch (error) {
      log.error("Error cancelling expired registrations", error);
      log.end(false, {error: (error as Error).message});
      throw error;
    }
  }
);

/**
 * Scheduled function that expires waitlist offers that have passed
 * their deadline and promotes the next person in the waitlist.
 * Runs every hour to ensure timely expiration.
 */
export const expireWaitlistOffers = onSchedule(
  {
    schedule: "0 * * * *", // Every hour
    timeZone: "Asia/Manila",
    region: "asia-southeast1",
  },
  async () => {
    const log = cfLogger.createContext("expireWaitlistOffers");
    log.start({schedule: "0 * * * *", timezone: "Asia/Manila"});

    const db = getFirestore(DATABASE_ID);
    const now = new Date();

    try {
      // Query for waitlist_offered registrations with expired deadlines
      const expiredQuery = await db.collection(COLLECTIONS.REGISTRATIONS)
        .where("status", "==", REGISTRATION_STATUS.WAITLIST_OFFERED)
        .where("waitlistOfferExpiresAt", "<", now.toISOString())
        .get();

      if (expiredQuery.empty) {
        log.info("No expired waitlist offers found");
        log.end(true, {expiredCount: 0, promotedCount: 0});
        return;
      }

      log.info("Found expired waitlist offers to process", {count: expiredQuery.size});

      let expiredCount = 0;
      let promotedCount = 0;
      const expiredIds: string[] = [];

      // Get conference settings for deadline calculation
      const settingsDoc = await db.collection(COLLECTIONS.CONFERENCES).doc("conference-settings").get();
      const settings = settingsDoc.data();

      // Process each expired offer
      for (const expiredDoc of expiredQuery.docs) {
        const expiredId = expiredDoc.id;

        // Mark as expired
        await expiredDoc.ref.update({
          "status": REGISTRATION_STATUS.WAITLIST_EXPIRED,
          "payment.status": REGISTRATION_STATUS.WAITLIST_EXPIRED,
          "updatedAt": FieldValue.serverTimestamp(),
        });

        expiredCount++;
        expiredIds.push(expiredId);
        log.info("Marked waitlist offer as expired", {registrationId: expiredId});

        // Auto-promote next waitlisted person if waitlist is enabled
        if (settings?.waitlist?.enabled) {
          const waitlistQuery = await db.collection(COLLECTIONS.REGISTRATIONS)
            .where("status", "==", REGISTRATION_STATUS.WAITLISTED)
            .orderBy("waitlistedAt", "asc")
            .limit(1)
            .get();

          if (!waitlistQuery.empty) {
            const nextWaitlisted = waitlistQuery.docs[0];
            const nextWaitlistedId = nextWaitlisted.id;

            // Calculate payment deadline
            const confStartDate =
              settings.startDate || new Date().toISOString();
            const conferenceDate = new Date(confStartDate);
            const msPerHour = 1000 * 60 * 60;
            const hoursUntilConference =
              (conferenceDate.getTime() - now.getTime()) / msPerHour;

            let deadlineHours = 48;
            if (hoursUntilConference <= 12) deadlineHours = 6;
            else if (hoursUntilConference <= 24) deadlineHours = 12;
            else if (hoursUntilConference <= 48) deadlineHours = 24;

            const deadlineMs = now.getTime() + deadlineHours * 60 * 60 * 1000;
            const paymentDeadline = new Date(deadlineMs);
            const finalDeadline = paymentDeadline < conferenceDate ?
              paymentDeadline : conferenceDate;

            // Update to WAITLIST_OFFERED
            await nextWaitlisted.ref.update({
              "status": REGISTRATION_STATUS.WAITLIST_OFFERED,
              "payment.status": REGISTRATION_STATUS.WAITLIST_OFFERED,
              "paymentDeadline": finalDeadline.toISOString(),
              "waitlistOfferSentAt": FieldValue.serverTimestamp(),
              "waitlistOfferExpiresAt": finalDeadline.toISOString(),
              "updatedAt": FieldValue.serverTimestamp(),
            });

            promotedCount++;
            log.info("Auto-promoted next waitlisted registration", {
              expiredRegistrationId: expiredId,
              promotedRegistrationId: nextWaitlistedId,
            });
          }
        }
      }

      log.info("Successfully processed expired waitlist offers", {
        expiredCount,
        promotedCount,
        expiredIds,
      });
      log.end(true, {expiredCount, promotedCount});
    } catch (error) {
      log.error("Error processing expired waitlist offers", error);
      log.end(false, {error: (error as Error).message});
      throw error;
    }
  }
);

// Lazy-initialized Vision client
let visionClient: ImageAnnotatorClient | null = null;

/**
 * Gets or creates the Vision API client
 * @return {ImageAnnotatorClient} The Vision client instance
 */
function getVisionClient(): ImageAnnotatorClient {
  if (!visionClient) {
    visionClient = new ImageAnnotatorClient();
  }
  return visionClient;
}

/**
 * Cloud Vision OCR function for receipt text extraction
 * Called as fallback when Tesseract.js confidence is low
 *
 * @param {Object} data - Request data
 * @param {string} data.image - Base64 encoded image data (no data URL prefix)
 * @return {Promise<{text: string, confidence: number}>} Extracted text
 *
 * @example
 * // From frontend:
 * const { data } = await httpsCallable(functions, 'ocrReceipt')({
 *   image: base64ImageData
 * });
 * console.log(data.text, data.confidence);
 */
export const ocrReceipt = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 10,
    memory: "512MiB",
    timeoutSeconds: 60,
  },
  async (request) => {
    const log = cfLogger.createContext("ocrReceipt");

    // Only require authentication - any logged-in user can use OCR
    // This is needed for regular users during registration to scan receipts
    if (!request.auth?.uid) {
      log.warn("Unauthenticated request to ocrReceipt");
      throw new HttpsError(
        "unauthenticated",
        "You must be logged in to use OCR"
      );
    }

    const {image} = request.data as {image?: string};

    if (!image) {
      log.error("Missing required parameter: image");
      log.end(false, {reason: "missing_image"});
      throw new HttpsError(
        "invalid-argument",
        "Missing required parameter: image (base64 encoded)"
      );
    }

    log.start({
      imageSize: image.length,
      hasAuth: !!request.auth,
    });

    try {
      const client = getVisionClient();

      // Decode base64 image
      const imageBuffer = Buffer.from(image, "base64");
      log.info("Calling Vision API for text detection", {
        bufferSize: imageBuffer.length,
      });

      // Call Vision API for text detection
      const [result] = await client.textDetection({
        image: {content: imageBuffer},
      });

      const detections = result.textAnnotations;

      if (!detections || detections.length === 0) {
        log.info("No text detected in image");
        log.end(true, {textDetected: false});
        return {
          text: "",
          confidence: 0,
          rawAnnotations: [],
        };
      }

      // First annotation contains the full text
      const fullText = detections[0].description || "";

      // Calculate average confidence from word-level detections
      // Vision API doesn't return confidence directly for TEXT_DETECTION,
      // but we can estimate based on detection quality
      const wordCount = detections.length - 1; // Exclude first (full text)
      const hasGoodDetection = wordCount > 5 && fullText.length > 20;
      const estimatedConfidence = hasGoodDetection ? 85 : 50;

      log.info("OCR completed", {
        charCount: fullText.length,
        wordCount,
        estimatedConfidence,
      });

      log.end(true, {
        charCount: fullText.length,
        wordCount,
        confidence: estimatedConfidence,
      });

      return {
        text: fullText.replace(/\s+/g, " ").trim(),
        confidence: estimatedConfidence,
        wordCount,
      };
    } catch (error) {
      log.error("Vision API error", error);
      log.end(false, {error: (error as Error).message});
      throw new HttpsError(
        "internal",
        "Failed to process image with Vision API"
      );
    }
  }
);

/**
 * Generates the plain text version of invoice email
 *
 * @param {object} data - Invoice data for email generation
 * @param {string} data.invoiceName - Name to use in the invoice
 * @param {string} data.registrationId - Registration ID
 * @param {string} data.invoiceNumber - Invoice number
 * @param {number} data.amountPaid - Amount paid
 * @param {object} data.primaryAttendee - Primary attendee information
 * @param {string} data.primaryAttendee.firstName - Attendee first name
 * @param {string} data.primaryAttendee.lastName - Attendee last name
 * @return {string} Plain text email content
 */
function generateInvoiceEmailText(
  data: {
    invoiceName: string;
    registrationId: string;
    invoiceNumber: string;
    amountPaid: number;
    primaryAttendee: {firstName: string; lastName: string};
  }
): string {
  return `
Dear ${data.invoiceName},

Thank you for your registration to ${CONFERENCE_NAME}.

Please find attached your invoice for:
- Registration ID: ${data.registrationId}
- Invoice Number: ${data.invoiceNumber}
- Amount Paid: ₱${data.amountPaid.toLocaleString()}
- Attendee: ${data.primaryAttendee.firstName} ${data.primaryAttendee.lastName}

If you have any questions regarding your invoice, please contact us at ${INVOICE_CONTACT_EMAIL}.

Best regards,
IDMC GCFSM Finance Team
  `.trim();
}

/**
 * Generates the HTML version of invoice email
 *
 * @param {object} data - Invoice data for email generation
 * @param {string} data.invoiceName - Name to use in the invoice
 * @param {string} data.registrationId - Registration ID
 * @param {string} data.invoiceNumber - Invoice number
 * @param {number} data.amountPaid - Amount paid
 * @param {object} data.primaryAttendee - Primary attendee information
 * @param {string} data.primaryAttendee.firstName - Attendee first name
 * @param {string} data.primaryAttendee.lastName - Attendee last name
 * @return {string} HTML email content
 */
function generateInvoiceEmailHtml(
  data: {
    invoiceName: string;
    registrationId: string;
    invoiceNumber: string;
    amountPaid: number;
    primaryAttendee: {firstName: string; lastName: string};
  }
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .info-box {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #6b7280;
    }
    .info-value {
      color: #111827;
      text-align: right;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    .attachment-notice {
      background: #dbeafe;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📄 Invoice Attached</h1>
  </div>

  <div class="content">
    <p>Dear ${data.invoiceName},</p>

    <p>Thank you for your registration to <strong>${CONFERENCE_NAME}</strong>.</p>

    <div class="attachment-notice">
      <strong>📎 Invoice Attached</strong><br>
      Your invoice (${data.invoiceNumber}) is attached to this email.
    </div>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Registration ID:</span>
        <span class="info-value">${data.registrationId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Invoice Number:</span>
        <span class="info-value">${data.invoiceNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Amount Paid:</span>
        <span class="info-value">₱${data.amountPaid.toLocaleString()}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Attendee:</span>
        <span class="info-value">${data.primaryAttendee.firstName} ${data.primaryAttendee.lastName}</span>
      </div>
    </div>

    <p>If you have any questions regarding your invoice, please contact us at <a href="mailto:${INVOICE_CONTACT_EMAIL}">${INVOICE_CONTACT_EMAIL}</a>.</p>

    <div class="footer">
      <p><strong>IDMC GCFSM Finance Team</strong></p>
      <p>Intentional Disciple-Making Churches Conference</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Callable Cloud Function to send invoice email with attachment
 *
 * This function:
 * 1. Validates the registration and invoice request
 * 2. Downloads the invoice file from Storage
 * 3. Sends email with invoice attachment via SendGrid
 * 4. Updates invoice status to 'sent'
 *
 * @param request - Contains registrationId
 * @param context - Auth context
 */
export const sendInvoiceEmail = onCall(
  {cors: true, secrets: [sendgridApiKey]},
  async (request) => {
    const {registrationId} = request.data;
    const log = cfLogger.createContext("sendInvoiceEmail", registrationId);

    // Verify user is a finance admin or superadmin
    const {admin} = await verifyFinanceAdmin(request.auth?.uid);

    log.start({
      registrationId,
      requestedBy: admin.email,
    });

    // Check if SendGrid is enabled
    if (!isSendGridEnabled()) {
      log.error("SendGrid not enabled");
      log.end(false, {reason: "sendgrid_not_enabled"});
      throw new HttpsError(
        "failed-precondition",
        "Email service is not configured. Please contact support."
      );
    }

    const db = getFirestore(DATABASE_ID);
    const registrationRef = db.collection(COLLECTIONS.REGISTRATIONS)
      .doc(registrationId);

    try {
      // Get registration document
      const registrationDoc = await registrationRef.get();
      if (!registrationDoc.exists) {
        log.error("Registration not found");
        log.end(false, {reason: "not_found"});
        throw new HttpsError("not-found", "Registration not found");
      }

      const registration = registrationDoc.data();
      if (!registration) {
        log.error("Registration data is empty");
        log.end(false, {reason: "empty_data"});
        throw new HttpsError("not-found", "Registration data is empty");
      }

      log.info("Registration found", {
        invoiceNumber: registration.invoice?.invoiceNumber,
        status: registration.status,
      });

      // Validate invoice request
      if (!registration.invoice?.requested) {
        log.error("No invoice requested for registration");
        log.end(false, {reason: "no_invoice_requested"});
        throw new HttpsError(
          "failed-precondition",
          "No invoice was requested for this registration"
        );
      }

      if (!registration.invoice?.invoiceUrl) {
        log.error("Invoice file not uploaded");
        log.end(false, {reason: "no_invoice_file"});
        throw new HttpsError(
          "failed-precondition",
          "Invoice file has not been uploaded yet"
        );
      }

      // Validate registration is confirmed
      if (registration.status !== REGISTRATION_STATUS.CONFIRMED) {
        log.error("Registration not confirmed", {status: registration.status});
        log.end(false, {reason: "not_confirmed"});
        throw new HttpsError(
          "failed-precondition",
          "Registration must be confirmed before sending invoice"
        );
      }

      const primaryEmail = registration.primaryAttendee?.email;
      if (!primaryEmail) {
        log.error("No email address found");
        log.end(false, {reason: "no_email"});
        throw new HttpsError("failed-precondition", "No email address found");
      }

      // Get SendGrid API key
      const apiKey = getSendGridApiKey();
      if (!apiKey) {
        log.error("SendGrid API key not configured");
        log.end(false, {reason: "no_api_key"});
        throw new HttpsError(
          "failed-precondition",
          "SendGrid API key is not configured"
        );
      }

      sgMail.setApiKey(apiKey);

      const fromEmail = senderEmail.value();
      if (!fromEmail) {
        log.error("SENDER_EMAIL not configured");
        log.end(false, {reason: "no_sender_email"});
        throw new HttpsError("failed-precondition", "SENDER_EMAIL is not configured");
      }

      // Download invoice file from Storage
      // Use the configured storage bucket, not the default project bucket
      const {getStorage} = await import("firebase-admin/storage");
      const bucket = getStorage().bucket(storageBucketName.value());

      // Extract file path from URL
      const invoiceUrl = registration.invoice.invoiceUrl;
      const urlParts = invoiceUrl.split("/o/")[1];
      const filePath = decodeURIComponent(urlParts.split("?")[0]);

      log.info("Downloading invoice file from storage", {filePath});
      const file = bucket.file(filePath);
      const [fileBuffer] = await file.download();
      const base64Content = fileBuffer.toString("base64");

      // Get file extension for content type
      const extension = filePath.split(".").pop()?.toLowerCase();
      let contentType = "application/pdf";
      if (extension === "jpg" || extension === "jpeg") {
        contentType = "image/jpeg";
      } else if (extension === "png") {
        contentType = "image/png";
      }

      // Prepare email with attachment
      const msg = {
        to: primaryEmail,
        from: {
          email: fromEmail,
          name: senderName.value() || "IDMC Finance Team",
        },
        subject: `Invoice ${registration.invoice.invoiceNumber} - ${CONFERENCE_NAME}`,
        text: generateInvoiceEmailText({
          invoiceName: registration.invoice.name,
          registrationId: registration.registrationId,
          invoiceNumber: registration.invoice.invoiceNumber,
          amountPaid: registration.payment?.amountPaid || 0,
          primaryAttendee: registration.primaryAttendee,
        }),
        html: generateInvoiceEmailHtml({
          invoiceName: registration.invoice.name,
          registrationId: registration.registrationId,
          invoiceNumber: registration.invoice.invoiceNumber,
          amountPaid: registration.payment?.amountPaid || 0,
          primaryAttendee: registration.primaryAttendee,
        }),
        attachments: [
          {
            content: base64Content,
            filename: `${registration.invoice.invoiceNumber}.${extension}`,
            type: contentType,
            disposition: "attachment",
          },
        ],
      };

      // Send email
      await sgMail.send(msg);
      log.info("Invoice email sent successfully", {
        email: primaryEmail,
        invoiceNumber: registration.invoice.invoiceNumber,
      });

      // Update registration with sent status
      await registrationRef.update({
        "invoice.status": INVOICE_STATUS.SENT,
        "invoice.sentAt": FieldValue.serverTimestamp(),
        "invoice.sentBy": admin.email,
        "invoice.emailDeliveryStatus": "sent",
        "updatedAt": FieldValue.serverTimestamp(),
      });

      // Log the invoice sent event
      await logAuditEvent({
        action: AUDIT_ACTIONS.INVOICE_SENT,
        severity: AUDIT_SEVERITY.INFO,
        actorId: request.auth?.uid || null,
        actorEmail: admin.email,
        actorRole: admin.role,
        entityType: "registration",
        entityId: registrationId,
        description: `Invoice sent to ${primaryEmail} for ${registrationId}`,
        metadata: {recipientEmail: primaryEmail},
      });

      log.end(true, {
        email: primaryEmail,
        invoiceNumber: registration.invoice.invoiceNumber,
      });

      return {
        success: true,
        message: `Invoice sent successfully to ${primaryEmail}`,
      };
    } catch (error) {
      // Extract detailed error information from SendGrid response
      let errorMessage = error instanceof Error ? error.message : "Unknown error";
      let errorDetails = "";

      // SendGrid errors have response.body.errors with detailed messages
      const sgError = error as {
        code?: number;
        response?: {
          body?: {
            errors?: Array<{field?: string; message?: string; help?: string}>;
          };
        };
      };

      if (sgError.response?.body?.errors) {
        const errors = sgError.response.body.errors;
        errorDetails = errors.map((e) =>
          `${e.field || "error"}: ${e.message || "unknown"}${e.help ? ` (${e.help})` : ""}`
        ).join("; ");
        errorMessage = `SendGrid error (${sgError.code}): ${errorDetails}`;
      }

      log.error("Error sending invoice email", error, {
        errorCode: sgError.code,
        errorDetails,
      });

      // Update status to failed
      try {
        await registrationRef.update({
          "invoice.status": INVOICE_STATUS.FAILED,
          "invoice.emailDeliveryStatus": "failed",
          "invoice.errorMessage": errorMessage,
          "updatedAt": FieldValue.serverTimestamp(),
        });
      } catch (updateError) {
        log.error("Failed to update invoice status", updateError);
      }

      log.end(false, {error: errorMessage});

      // Re-throw as HttpsError if not already one
      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        `Failed to send invoice email: ${errorMessage}`
      );
    }
  }
);

/**
 * Contact inquiry status constants
 */
const CONTACT_INQUIRY_STATUS = {
  NEW: "new",
  READ: "read",
  REPLIED: "replied",
};

/**
 * Generates the HTML email template for contact inquiry replies
 *
 * @param {string} recipientName - Name of the inquiry sender
 * @param {string} subject - Email subject
 * @param {string} message - Reply message content
 * @param {string} originalSubject - Original inquiry subject
 * @param {string} originalMessage - Original inquiry message
 * @return {string} HTML string for the email
 */
function generateInquiryReplyHtml(
  recipientName: string,
  subject: string,
  message: string,
  originalSubject: string,
  originalMessage: string
): string {
  // Convert newlines to <br> for HTML display
  const formattedMessage = message.replace(/\n/g, "<br>");
  const formattedOriginalMessage = originalMessage.replace(/\n/g, "<br>");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                GCFSM IDMC
              </h1>
              <p style="margin: 8px 0 0; color: #bfdbfe; font-size: 14px;">
                GCF South Metro
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Dear ${recipientName},
              </p>
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thank you for reaching out to us. Here is our response to your inquiry:
              </p>

              <!-- Reply Message -->
              <div style="margin: 24px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0; color: #1f2937; font-size: 16px; line-height: 1.7;">
                  ${formattedMessage}
                </p>
              </div>

              <!-- Original Inquiry -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 12px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Your Original Inquiry
                </p>
                <p style="margin: 0 0 8px; color: #9ca3af; font-size: 14px;">
                  <strong>Subject:</strong> ${originalSubject}
                </p>
                <div style="margin: 0; padding: 16px; background-color: #f3f4f6; border-radius: 6px;">
                  <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    ${formattedOriginalMessage}
                  </p>
                </div>
              </div>

              <p style="margin: 32px 0 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                If you have any further questions, please don't hesitate to reply to this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center; line-height: 1.5;">
                GCFSM IDMC<br>
                Daang Hari Road, Versailles, Almanza Dos<br>
                Las Piñas, 1750 PHL
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Generates plain text version of inquiry reply email
 *
 * @param {string} recipientName - Name of the inquiry sender
 * @param {string} message - Reply message content
 * @param {string} originalSubject - Original inquiry subject
 * @param {string} originalMessage - Original inquiry message
 * @return {string} Plain text string for the email
 */
function generateInquiryReplyText(
  recipientName: string,
  message: string,
  originalSubject: string,
  originalMessage: string
): string {
  return `
Dear ${recipientName},

Thank you for reaching out to us. Here is our response to your inquiry:

${message}

---
Your Original Inquiry:
Subject: ${originalSubject}

${originalMessage}
---

If you have any further questions, please don't hesitate to reply to this email.

Best regards,
GCFSM IDMC
Daang Hari Road, Versailles, Almanza Dos
Las Piñas, 1750 PHL
  `.trim();
}

/**
 * Callable Cloud Function to send reply to a contact inquiry via SendGrid
 *
 * This function:
 * 1. Validates the inquiry exists
 * 2. Sends reply email via SendGrid with reply-to header
 * 3. Updates inquiry status to 'replied'
 * 4. Stores reply history on the inquiry document
 *
 * @param request - Contains inquiryId, subject, message
 */
export const sendInquiryReply = onCall(
  {cors: true, secrets: [sendgridApiKey]},
  async (request) => {
    const {inquiryId, subject, message} = request.data as {
      inquiryId?: string;
      subject?: string;
      message?: string;
    };

    const log = cfLogger.createContext("sendInquiryReply", inquiryId);

    // Validate admin authentication
    if (!request.auth) {
      log.error("User not authenticated");
      log.end(false, {reason: "unauthenticated"});
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    // Validate required parameters
    if (!inquiryId) {
      log.error("Missing inquiryId");
      log.end(false, {reason: "missing_inquiry_id"});
      throw new HttpsError("invalid-argument", "Missing required parameter: inquiryId");
    }
    if (!subject || !subject.trim()) {
      log.error("Missing subject");
      log.end(false, {reason: "missing_subject"});
      throw new HttpsError("invalid-argument", "Missing required parameter: subject");
    }
    if (!message || !message.trim()) {
      log.error("Missing message");
      log.end(false, {reason: "missing_message"});
      throw new HttpsError("invalid-argument", "Missing required parameter: message");
    }

    log.start({
      inquiryId,
      requestedBy: request.auth.token.email,
      subjectLength: subject.length,
      messageLength: message.length,
    });

    // Check if SendGrid is enabled
    if (!isSendGridEnabled()) {
      log.error("SendGrid not enabled");
      log.end(false, {reason: "sendgrid_not_enabled"});
      throw new HttpsError(
        "failed-precondition",
        "Email service is not configured. Please contact support."
      );
    }

    const db = getFirestore(DATABASE_ID);
    const inquiriesCol = db.collection(COLLECTIONS.CONTACT_INQUIRIES);
    const inquiryRef = inquiriesCol.doc(inquiryId);

    try {
      // Get inquiry document
      const inquiryDoc = await inquiryRef.get();
      if (!inquiryDoc.exists) {
        log.error("Inquiry not found");
        log.end(false, {reason: "not_found"});
        throw new HttpsError("not-found", "Inquiry not found");
      }

      const inquiry = inquiryDoc.data();
      if (!inquiry) {
        log.error("Inquiry data is empty");
        log.end(false, {reason: "empty_data"});
        throw new HttpsError("not-found", "Inquiry data is empty");
      }

      const recipientEmail = inquiry.email;
      const recipientName = inquiry.name;

      log.info("Inquiry found", {
        recipientEmail,
        originalSubject: inquiry.subject,
      });

      if (!recipientEmail) {
        log.error("Inquiry has no email address");
        log.end(false, {reason: "no_email"});
        throw new HttpsError("failed-precondition", "Inquiry has no email address");
      }

      // Get SendGrid API key
      const apiKey = getSendGridApiKey();
      if (!apiKey) {
        log.error("SendGrid API key not configured");
        log.end(false, {reason: "no_api_key"});
        throw new HttpsError(
          "failed-precondition",
          "SendGrid API key is not configured"
        );
      }

      sgMail.setApiKey(apiKey);

      const fromEmail = senderEmail.value();
      if (!fromEmail) {
        log.error("SENDER_EMAIL not configured");
        log.end(false, {reason: "no_sender_email"});
        throw new HttpsError("failed-precondition", "SENDER_EMAIL is not configured");
      }

      // Get reply-to email (info@ address), fallback to sender email
      const replyTo = replyToEmail.value() || fromEmail;

      // Prepare email
      const msg = {
        to: recipientEmail,
        from: {
          email: fromEmail,
          name: senderName.value() || "GCFSM IDMC",
        },
        replyTo: {
          email: replyTo,
          name: "GCFSM IDMC",
        },
        subject: subject.trim(),
        text: generateInquiryReplyText(
          recipientName,
          message.trim(),
          inquiry.subject,
          inquiry.message
        ),
        html: generateInquiryReplyHtml(
          recipientName,
          subject.trim(),
          message.trim(),
          inquiry.subject,
          inquiry.message
        ),
      };

      // Send email
      await sgMail.send(msg);
      log.info("Inquiry reply sent successfully", {email: recipientEmail});

      // Get current replies array or initialize empty
      const existingReplies = inquiry.replies || [];

      // Add new reply to history
      const newReply = {
        subject: subject.trim(),
        message: message.trim(),
        sentAt: new Date().toISOString(),
        sentBy: request.auth.token.email || "unknown",
      };

      // Update inquiry document
      await inquiryRef.update({
        status: CONTACT_INQUIRY_STATUS.REPLIED,
        replies: [...existingReplies, newReply],
        lastRepliedAt: FieldValue.serverTimestamp(),
        lastRepliedBy: request.auth.token.email || "unknown",
        updatedAt: FieldValue.serverTimestamp(),
      });

      log.end(true, {
        email: recipientEmail,
        replyCount: existingReplies.length + 1,
      });

      return {
        success: true,
        message: `Reply sent successfully to ${recipientEmail}`,
      };
    } catch (error) {
      // Extract detailed error information from SendGrid response
      let errorMessage = error instanceof Error ? error.message : "Unknown error";
      let errorDetails = "";

      const sgError = error as {
        code?: number;
        response?: {
          body?: {
            errors?: Array<{field?: string; message?: string; help?: string}>;
          };
        };
      };

      if (sgError.response?.body?.errors) {
        const errors = sgError.response.body.errors;
        errorDetails = errors.map((e) =>
          `${e.field || "error"}: ${e.message || "unknown"}${e.help ? ` (${e.help})` : ""}`
        ).join("; ");
        errorMessage = `SendGrid error (${sgError.code}): ${errorDetails}`;
      }

      log.error("Error sending inquiry reply", error, {
        errorCode: sgError.code,
        errorDetails,
      });

      log.end(false, {error: errorMessage});

      // Re-throw as HttpsError if not already one
      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        `Failed to send reply: ${errorMessage}`
      );
    }
  }
);

// ============================================
// Secure Registration Lookup Functions
// ============================================

/**
 * Scheduled function to clean up expired rate limit records
 * Runs daily at 3:00 AM to remove stale records and keep database clean
 */
export const cleanupRateLimits = onSchedule(
  {
    schedule: "0 3 * * *", // Daily at 3:00 AM
    region: "asia-southeast1",
    timeZone: "Asia/Manila",
  },
  async () => {
    logger.info("Starting rate limit cleanup");
    const deleted = await cleanupExpiredRateLimits();
    logger.info(`Rate limit cleanup complete. Deleted ${deleted} records.`);
  }
);

/**
 * Masks an email address for privacy
 * Example: "john.doe@example.com" -> "jo***@example.com"
 *
 * @param {string} email - Email address to mask
 * @return {string} Masked email
 */
function maskEmail(email: string): string {
  if (!email || typeof email !== "string") {
    return "";
  }

  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) {
    return "***@***";
  }

  const visibleChars = Math.min(2, localPart.length);
  const masked = localPart.substring(0, visibleChars) + "***";
  return `${masked}@${domain}`;
}

/**
 * Masks a name for privacy
 * Example: "John Doe" -> "J***"
 *
 * @param {string} name - Name to mask
 * @return {string} Masked name
 */
function maskName(name: string): string {
  if (!name || typeof name !== "string") {
    return "";
  }

  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    return "";
  }

  return trimmedName.charAt(0) + "***";
}

/**
 * Secure registration lookup callable function
 *
 * This function provides a secure way to look up registrations:
 * - Rate limited to prevent brute force attacks
 * - Returns masked data only (no sensitive information exposed)
 * - Does not require authentication (for public status check)
 *
 * @param {Object} data - Request data containing identifier
 * @param {string} data.identifier - Registration ID, short code, email, phone
 * @return {Object} Masked registration data
 */
export const lookupRegistrationSecure = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 10,
    // Enable App Check enforcement once configured in Firebase Console
    // This helps prevent API abuse from non-app sources
    // enforceAppCheck: true,
  },
  async (request) => {
    const {identifier} = request.data as {identifier?: string};

    if (!identifier || identifier.trim().length < 4) {
      throw new HttpsError(
        "invalid-argument",
        "Please provide a valid registration ID, email, or phone number"
      );
    }

    // Get client IP for rate limiting (use UID if authenticated)
    const clientId = request.auth?.uid ||
                     request.rawRequest?.ip ||
                     "unknown";

    // Check rate limit using persistent Firestore-based limiter
    try {
      await checkRateLimit(
        "registration_lookup",
        clientId,
        RATE_LIMIT_CONFIGS.REGISTRATION_LOOKUP
      );
    } catch (error) {
      // Log rate limit exceeded event
      await logRateLimitExceeded("registration_lookup", clientId, clientId);
      throw error;
    }

    const db = getFirestore();
    const trimmed = identifier.trim();
    const upperTrimmed = trimmed.toUpperCase();

    let registration: FirebaseFirestore.DocumentData | null = null;
    let registrationId: string | null = null;

    // Try different lookup strategies
    const registrationsRef = db.collection(COLLECTIONS.REGISTRATIONS);

    // 1. Try full registration ID (e.g., "REG-2026-A7K3MN")
    if (trimmed.toUpperCase().startsWith("REG-")) {
      const docRef = registrationsRef.doc(trimmed.toUpperCase());
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        registration = docSnap.data() ?? null;
        registrationId = docSnap.id;
      }
    }

    // 2. Try 6-character short code
    if (!registration && /^[A-Za-z0-9]{6}$/.test(trimmed)) {
      const query = await registrationsRef
        .where("shortCode", "==", upperTrimmed)
        .limit(1)
        .get();
      if (!query.empty) {
        registration = query.docs[0].data();
        registrationId = query.docs[0].id;
      }
    }

    // 3. Try 4-character short code suffix
    if (!registration && /^[A-Za-z0-9]{4}$/.test(trimmed)) {
      const query = await registrationsRef
        .where("shortCodeSuffix", "==", upperTrimmed)
        .limit(1)
        .get();
      if (!query.empty) {
        registration = query.docs[0].data();
        registrationId = query.docs[0].id;
      }
    }

    // 4. Try email lookup
    if (!registration && trimmed.includes("@")) {
      const normalizedEmail = trimmed.toLowerCase();
      const query = await registrationsRef
        .where("primaryAttendee.email", "==", normalizedEmail)
        .limit(1)
        .get();
      if (!query.empty) {
        registration = query.docs[0].data();
        registrationId = query.docs[0].id;
      }
    }

    // 5. Try phone lookup
    if (!registration) {
      const cleanPhone = trimmed.replace(/[\s-]/g, "");
      if (/^(\+63|0)?9\d{9}$/.test(cleanPhone)) {
        // Try different phone format variations
        const phoneVariants = [
          cleanPhone,
          cleanPhone.replace(/^0/, "+63"),
          cleanPhone.replace(/^\+63/, "0"),
        ];

        for (const variant of phoneVariants) {
          const query = await registrationsRef
            .where("primaryAttendee.phone", "==", variant)
            .limit(1)
            .get();
          if (!query.empty) {
            registration = query.docs[0].data();
            registrationId = query.docs[0].id;
            break;
          }
        }
      }
    }

    if (!registration || !registrationId) {
      throw new HttpsError(
        "not-found",
        "Registration not found. Please check your information and try again."
      );
    }

    // Log this lookup for audit purposes
    await logRegistrationAccess(
      registrationId,
      "lookup",
      request.auth?.uid || null,
      undefined,
      clientId
    );

    // Calculate attendee count
    const additionalAttendees = registration.additionalAttendees || [];
    const attendeeCount = 1 + additionalAttendees.length;

    // Return MASKED data only - no sensitive information
    return {
      registrationId: registration.registrationId,
      shortCode: registration.shortCode,
      status: registration.status,
      primaryAttendee: {
        firstName: registration.primaryAttendee?.firstName || "",
        // Mask last name for privacy
        lastName: maskName(registration.primaryAttendee?.lastName || ""),
        // Mask email for privacy
        email: maskEmail(registration.primaryAttendee?.email || ""),
      },
      attendeeCount,
      // Include check-in status if confirmed
      checkInStatus: registration.status === REGISTRATION_STATUS.CONFIRMED ? {
        checkedIn: registration.checkIn?.checkedIn || false,
        checkedInCount: registration.checkIn?.checkedInCount || 0,
      } : null,
      // Include payment status (but not amounts or details)
      paymentStatus: registration.payment?.status || registration.status,
      // Masked - don't expose full church name
      church: registration.church?.name ?
        maskName(registration.church.name) : null,
    };
  }
);

/**
 * Get full registration details after verification
 *
 * This function requires a verification token that was sent to the
 * registrant's email or phone. It returns full registration data
 * including QR codes for check-in.
 *
 * @param {Object} data - Request data
 * @param {string} data.registrationId - Registration ID
 * @param {string} data.verificationCode - Code sent to email/phone
 * @returns {Object} Full registration data with QR codes
 */
export const getRegistrationWithVerification = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 10,
    // Enable App Check enforcement once configured in Firebase Console
    // enforceAppCheck: true,
  },
  async (request) => {
    const {registrationId, verificationCode} = request.data as {
      registrationId?: string;
      verificationCode?: string;
    };

    if (!registrationId || !verificationCode) {
      throw new HttpsError(
        "invalid-argument",
        "Registration ID and verification code are required"
      );
    }

    // Get client IP for rate limiting
    const clientId = request.auth?.uid ||
                     request.rawRequest?.ip ||
                     "unknown";

    // Stricter rate limit for verification attempts using persistent limiter
    try {
      await checkRateLimit(
        "registration_verification",
        clientId,
        RATE_LIMIT_CONFIGS.VERIFICATION
      );
    } catch (error) {
      await logRateLimitExceeded("verification", clientId, clientId);
      throw error;
    }

    const db = getFirestore();
    const registrationRef = db
      .collection(COLLECTIONS.REGISTRATIONS)
      .doc(registrationId.toUpperCase());
    const registrationDoc = await registrationRef.get();

    if (!registrationDoc.exists) {
      throw new HttpsError("not-found", "Registration not found");
    }

    const registration = registrationDoc.data();
    if (!registration) {
      throw new HttpsError("not-found", "Registration data is empty");
    }

    // Verify the code matches
    // The verification code is the last 4 characters of the short code
    // combined with the last 4 digits of the phone number
    const expectedCode = (registration.shortCodeSuffix || "").toUpperCase() +
      (registration.primaryAttendee?.phone || "").slice(-4);

    if (verificationCode.toUpperCase() !== expectedCode.toUpperCase()) {
      logger.warn(`Invalid verification attempt for ${registrationId}`);
      throw new HttpsError(
        "permission-denied",
        "Invalid verification code. Please check and try again."
      );
    }

    // Log successful verification
    await logAuditEvent({
      action: AUDIT_ACTIONS.REGISTRATION_VERIFIED,
      severity: AUDIT_SEVERITY.INFO,
      actorId: request.auth?.uid || null,
      entityType: "registration",
      entityId: registrationId.toUpperCase(),
      description: `Registration verified: ${registrationId}`,
      ipAddress: clientId,
    });

    // Generate QR codes for all attendees
    const attendeesWithQR = await generateAllAttendeeQRCodes(
      registration.registrationId,
      registration.primaryAttendee,
      registration.additionalAttendees
    );

    // Return full registration data
    return {
      registrationId: registration.registrationId,
      shortCode: registration.shortCode,
      status: registration.status,
      primaryAttendee: registration.primaryAttendee,
      additionalAttendees: registration.additionalAttendees || [],
      church: registration.church,
      totalAmount: registration.totalAmount,
      payment: {
        status: registration.payment?.status,
        method: registration.payment?.method,
        amountPaid: registration.payment?.amountPaid,
      },
      checkIn: registration.checkIn,
      qrCodes: attendeesWithQR.map((a) => ({
        attendeeIndex: a.attendeeIndex,
        firstName: a.firstName,
        lastName: a.lastName,
        qrCodeDataUrl: a.qrCodeDataUrl,
      })),
    };
  }
);

// ============================================
// CSP Reporting Endpoint
// ============================================

/**
 * CSP violation report structure from browsers
 */
interface CspViolationReport {
  "csp-report"?: {
    "document-uri"?: string;
    "referrer"?: string;
    "violated-directive"?: string;
    "effective-directive"?: string;
    "original-policy"?: string;
    "blocked-uri"?: string;
    "source-file"?: string;
    "line-number"?: number;
    "column-number"?: number;
    "status-code"?: number;
  };
}

/**
 * CSP Violation Reporting Endpoint
 *
 * Receives Content Security Policy violation reports from browsers
 * and logs them for security monitoring. This helps identify:
 * - Attempted XSS attacks
 * - Misconfigured CSP policies
 * - Third-party script issues
 *
 * The endpoint accepts POST requests with JSON body containing
 * the CSP violation report in the standard format.
 */
export const cspReport = onRequest(
  {
    region: "asia-southeast1",
    maxInstances: 5,
    cors: false, // CSP reports don't need CORS
  },
  async (req, res) => {
    // Only accept POST requests
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const report = req.body as CspViolationReport;
      const violation = report["csp-report"];

      if (!violation) {
        res.status(400).send("Invalid CSP report format");
        return;
      }

      // Log the violation for monitoring
      logger.warn("CSP Violation Detected", {
        documentUri: violation["document-uri"],
        violatedDirective: violation["violated-directive"],
        effectiveDirective: violation["effective-directive"],
        blockedUri: violation["blocked-uri"],
        sourceFile: violation["source-file"],
        lineNumber: violation["line-number"],
        columnNumber: violation["column-number"],
        referrer: violation["referrer"],
      });

      // Store violation in audit log for analysis
      await logAuditEvent({
        action: "security.csp_violation",
        severity: AUDIT_SEVERITY.WARNING,
        actorId: null,
        description: `CSP violation: ${violation["violated-directive"]} blocked ${violation["blocked-uri"]}`,
        metadata: {
          documentUri: violation["document-uri"],
          violatedDirective: violation["violated-directive"],
          effectiveDirective: violation["effective-directive"],
          blockedUri: violation["blocked-uri"],
          sourceFile: violation["source-file"],
          lineNumber: violation["line-number"],
          columnNumber: violation["column-number"],
        },
        ipAddress: req.ip || undefined,
        userAgent: req.headers["user-agent"] || undefined,
      });

      // Return 204 No Content (standard response for CSP reports)
      res.status(204).send();
    } catch (error) {
      logger.error("Error processing CSP report:", error);
      // Still return 204 to not disrupt client
      res.status(204).send();
    }
  }
);

/**
 * Helper function to count checked-in attendees in a registration
 *
 * @param {object} data - Registration document data
 * @return {number} Number of checked-in attendees
 */
function getCheckedInAttendeeCount(
  data: {
    checkedIn?: boolean;
    attendeeCheckIns?: Record<string, boolean>;
    additionalAttendees?: Array<unknown>;
  }
): number {
  // If using per-attendee tracking
  if (data.attendeeCheckIns && typeof data.attendeeCheckIns === "object") {
    return Object.values(data.attendeeCheckIns).filter(Boolean).length;
  }
  // Legacy: if checkedIn is true, count all attendees as checked in
  if (data.checkedIn) {
    return 1 + (data.additionalAttendees?.length || 0);
  }
  return 0;
}

/**
 * Scheduled function that runs daily to sync all conference stats
 * Recounts all confirmed attendees and updates:
 * - Stats document with registration, check-in, and workshop counts
 * - Workshop registeredCount for each session
 * - Church stats (top churches by delegate count and registration count)
 * - Food preference stats (distribution of food choices)
 * Runs every day at 2:00 AM Asia/Manila time
 */
export const syncConferenceStats = onSchedule(
  {
    schedule: "0 2 * * *",
    timeZone: "Asia/Manila",
    region: "asia-southeast1",
  },
  async () => {
    const log = cfLogger.createContext("syncConferenceStats");
    log.start({schedule: "0 2 * * *", timezone: "Asia/Manila"});

    const db = getFirestore(DATABASE_ID);

    try {
      // Query all confirmed and pending_verification registrations
      const confirmedQuery = await db.collection(COLLECTIONS.REGISTRATIONS)
        .where("status", "in", [
          REGISTRATION_STATUS.CONFIRMED,
          REGISTRATION_STATUS.PENDING_VERIFICATION,
        ])
        .get();

      log.info("Queried registrations", {count: confirmedQuery.size});

      // Registration stats
      let totalAttendees = 0;
      let confirmedRegistrationCount = 0;
      let pendingVerificationCount = 0;
      const workshopCounts: Record<string, number> = {};

      // Check-in stats
      let checkedInRegistrationCount = 0;
      let checkedInAttendeeCount = 0;
      let partiallyCheckedInCount = 0;

      // Finance stats
      let totalConfirmedPayments = 0;
      let totalPendingPayments = 0;
      const bankAccountStats: Record<string, {
        confirmed: number;
        pending: number;
        count: number;
      }> = {};

      // Church stats
      const churchStats: Record<string, {
        name: string;
        city: string;
        delegateCount: number;
        registrationCount: number;
      }> = {};

      // Food stats
      const foodStats: Record<string, number> = {};
      let totalWithFoodChoice = 0;
      let totalWithoutFoodChoice = 0;

      confirmedQuery.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const isConfirmed = data.status === REGISTRATION_STATUS.CONFIRMED;
        const isPendingVerification =
          data.status === REGISTRATION_STATUS.PENDING_VERIFICATION;

        if (isConfirmed) {
          confirmedRegistrationCount++;
        } else if (isPendingVerification) {
          pendingVerificationCount++;
        }

        // Count primary attendee
        totalAttendees += 1;

        // Count additional attendees
        const additionalCount = data.additionalAttendees?.length || 0;
        totalAttendees += additionalCount;
        const attendeeCount = 1 + additionalCount;

        // Count check-ins
        const checkedInCount = getCheckedInAttendeeCount(data);
        checkedInAttendeeCount += checkedInCount;

        if (checkedInCount === attendeeCount) {
          checkedInRegistrationCount++;
        } else if (checkedInCount > 0) {
          partiallyCheckedInCount++;
        }

        // Finance stats
        const paymentAmount = data.payment?.amountPaid || 0;
        const bankAccountId = data.payment?.bankAccountId;

        if (isConfirmed) {
          totalConfirmedPayments += paymentAmount;
        } else if (isPendingVerification) {
          totalPendingPayments += paymentAmount;
        }

        // Per-bank-account stats
        if (bankAccountId) {
          if (!bankAccountStats[bankAccountId]) {
            bankAccountStats[bankAccountId] = {
              confirmed: 0,
              pending: 0,
              count: 0,
            };
          }
          bankAccountStats[bankAccountId].count++;
          if (isConfirmed) {
            bankAccountStats[bankAccountId].confirmed += paymentAmount;
          } else if (isPendingVerification) {
            bankAccountStats[bankAccountId].pending += paymentAmount;
          }
        }

        // Count workshop selections for primary attendee
        // Support both old field name (workshopSelection) and new (workshopSelections)
        const primaryWorkshops = data.primaryAttendee?.workshopSelections ||
          (data.primaryAttendee?.workshopSelection ?
            [data.primaryAttendee.workshopSelection] : []);
        if (Array.isArray(primaryWorkshops)) {
          primaryWorkshops.forEach(
            (selection: {sessionId?: string} | string) => {
              const sessionId = typeof selection === "string" ?
                selection : selection?.sessionId;
              if (sessionId) {
                workshopCounts[sessionId] =
                  (workshopCounts[sessionId] || 0) + 1;
              }
            }
          );
        }

        // Count workshop selections for additional attendees
        if (data.additionalAttendees) {
          data.additionalAttendees.forEach(
            (attendee: {
              workshopSelections?: Array<{sessionId?: string}>;
              workshopSelection?: string | {sessionId?: string};
            }) => {
              // Support both old field name and new
              const attendeeWorkshops = attendee.workshopSelections ||
                (attendee.workshopSelection ?
                  [attendee.workshopSelection] : []);
              if (Array.isArray(attendeeWorkshops)) {
                attendeeWorkshops.forEach(
                  (selection: {sessionId?: string} | string) => {
                    const sessionId = typeof selection === "string" ?
                      selection : selection?.sessionId;
                    if (sessionId) {
                      workshopCounts[sessionId] =
                        (workshopCounts[sessionId] || 0) + 1;
                    }
                  }
                );
              }
            }
          );
        }

        // Aggregate church stats
        const churchName = data.church?.name || "Unknown Church";
        const churchCity = data.church?.city || "";
        // Use sanitized key (replace dots and slashes which are
        // invalid in Firestore paths)
        const churchKey = `${churchName}|${churchCity}`
          .replace(/\./g, "_")
          .replace(/\//g, "_");

        if (!churchStats[churchKey]) {
          churchStats[churchKey] = {
            name: churchName,
            city: churchCity,
            delegateCount: 0,
            registrationCount: 0,
          };
        }
        churchStats[churchKey].delegateCount += attendeeCount;
        churchStats[churchKey].registrationCount += 1;

        // Aggregate food stats for primary attendee
        const primaryFood = data.primaryAttendee?.foodChoice;
        if (primaryFood) {
          foodStats[primaryFood] = (foodStats[primaryFood] || 0) + 1;
          totalWithFoodChoice += 1;
        } else {
          totalWithoutFoodChoice += 1;
        }

        // Aggregate food stats for additional attendees
        if (data.additionalAttendees) {
          data.additionalAttendees.forEach(
            (attendee: {foodChoice?: string}) => {
              if (attendee.foodChoice) {
                foodStats[attendee.foodChoice] =
                  (foodStats[attendee.foodChoice] || 0) + 1;
                totalWithFoodChoice += 1;
              } else {
                totalWithoutFoodChoice += 1;
              }
            }
          );
        }
      });

      log.info("Calculated registration stats", {
        confirmedRegistrationCount,
        pendingVerificationCount,
        totalAttendees,
        checkedInRegistrationCount,
        checkedInAttendeeCount,
        totalConfirmedPayments,
        bankAccountCount: Object.keys(bankAccountStats).length,
        totalChurches: Object.keys(churchStats).length,
        totalWithFoodChoice,
        totalWithoutFoodChoice,
      });

      // Update stats document with all counts
      const statsRef = db
        .collection(COLLECTIONS.STATS)
        .doc(STATS_DOC_ID);

      await statsRef.set({
        // Registration stats
        registeredAttendeeCount: totalAttendees,
        confirmedRegistrationCount,
        pendingVerificationCount,
        workshopCounts,
        // Check-in stats
        checkedInRegistrationCount,
        checkedInAttendeeCount,
        partiallyCheckedInCount,
        // Finance stats
        totalConfirmedPayments,
        totalPendingPayments,
        bankAccountStats,
        // Church stats
        churchStats,
        totalChurches: Object.keys(churchStats).length,
        // Food stats
        foodStats,
        totalWithFoodChoice,
        totalWithoutFoodChoice,
        // Timestamps
        lastSyncedAt: FieldValue.serverTimestamp(),
        lastUpdatedAt: FieldValue.serverTimestamp(),
      }, {merge: true});

      log.info("Updated conference stats document");

      // Update workshop registered counts in sessions collection
      const sessionsCollection = db.collection(COLLECTIONS.SESSIONS);
      const batch = db.batch();
      let updateCount = 0;

      for (const [sessionId, count] of Object.entries(workshopCounts)) {
        const sessionRef = sessionsCollection.doc(sessionId);
        batch.update(sessionRef, {
          registeredCount: count,
          updatedAt: FieldValue.serverTimestamp(),
        });
        updateCount++;
      }

      // Also reset workshops not in counts (handle cancelled registrations)
      const allWorkshops = await sessionsCollection
        .where("sessionType", "==", "workshop")
        .get();

      allWorkshops.forEach((workshopDoc) => {
        const workshopId = workshopDoc.id;
        if (!(workshopId in workshopCounts)) {
          // Workshop has no registrations, reset to 0
          batch.update(workshopDoc.ref, {
            registeredCount: 0,
            updatedAt: FieldValue.serverTimestamp(),
          });
          updateCount++;
        }
      });

      if (updateCount > 0) {
        await batch.commit();
        log.info("Updated workshop counts", {workshopCount: updateCount});
      }

      log.end(true, {
        confirmedRegistrationCount,
        pendingVerificationCount,
        totalAttendees,
        checkedInAttendeeCount,
        workshopUpdates: updateCount,
        totalChurches: Object.keys(churchStats).length,
        totalWithFoodChoice,
        totalWithoutFoodChoice,
      });
    } catch (error) {
      log.error("Error syncing conference stats", error);
      log.end(false, {error: (error as Error).message});
      throw error;
    }
  }
);

/**
 * Firestore trigger that updates stats when registration status changes
 * Handles:
 * - New confirmed registrations (increment count)
 * - Cancelled registrations (decrement count)
 * - Status changes between confirmed/cancelled states
 */
export const onRegistrationStatsUpdate = onDocumentUpdated(
  {
    document: `${COLLECTIONS.REGISTRATIONS}/{registrationId}`,
    region: "asia-southeast1",
    database: DATABASE_ID,
  },
  async (event) => {
    const registrationId = event.params.registrationId;
    const log = cfLogger.createContext("onRegistrationStatsUpdate", registrationId);

    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) {
      return;
    }

    const confirmedStatuses = [
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.PENDING_VERIFICATION,
    ];

    const wasConfirmed = confirmedStatuses.includes(before.status);
    const isConfirmed = confirmedStatuses.includes(after.status);

    // Only process if status changed between confirmed/non-confirmed
    if (wasConfirmed === isConfirmed) {
      return;
    }

    log.start({
      registrationId,
      previousStatus: before.status,
      newStatus: after.status,
      wasConfirmed,
      isConfirmed,
    });

    const db = getFirestore(DATABASE_ID);

    // Calculate attendee count for this registration
    const attendeeCount = 1 + (after.additionalAttendees?.length || 0);

    // Determine if we're incrementing or decrementing
    const delta = isConfirmed ? attendeeCount : -attendeeCount;

    try {
      // Update stats document with attendee count
      const statsRef = db
        .collection(COLLECTIONS.STATS)
        .doc(STATS_DOC_ID);

      await statsRef.set({
        registeredAttendeeCount: FieldValue.increment(delta),
        lastUpdatedAt: FieldValue.serverTimestamp(),
      }, {merge: true});

      log.info("Updated stats attendee count", {delta, attendeeCount});

      // Update workshop counts
      const allWorkshopSelections: string[] = [];

      // Collect primary attendee workshop selections
      if (after.primaryAttendee?.workshopSelections) {
        after.primaryAttendee.workshopSelections.forEach(
          (selection: {sessionId?: string}) => {
            if (selection.sessionId) {
              allWorkshopSelections.push(selection.sessionId);
            }
          }
        );
      }

      // Collect additional attendees workshop selections
      if (after.additionalAttendees) {
        after.additionalAttendees.forEach(
          (attendee: {workshopSelections?: Array<{sessionId?: string}>}) => {
            if (attendee.workshopSelections) {
              attendee.workshopSelections.forEach(
                (selection: {sessionId?: string}) => {
                  if (selection.sessionId) {
                    allWorkshopSelections.push(selection.sessionId);
                  }
                }
              );
            }
          }
        );
      }

      // Update each workshop's registered count
      let workshopsUpdated = 0;
      const skippedSessions: string[] = [];
      if (allWorkshopSelections.length > 0) {
        const workshopDelta = isConfirmed ? 1 : -1;
        const sessionsCollection = db.collection(COLLECTIONS.SESSIONS);

        for (const sessionId of allWorkshopSelections) {
          const sessionDoc = await sessionsCollection.doc(sessionId).get();
          if (sessionDoc.exists) {
            await sessionsCollection.doc(sessionId).update({
              registeredCount: FieldValue.increment(workshopDelta),
              updatedAt: FieldValue.serverTimestamp(),
            });
            workshopsUpdated++;
          } else {
            skippedSessions.push(sessionId);
          }
        }

        if (skippedSessions.length > 0) {
          log.warn("Skipped non-existent sessions during workshop count update", {
            skippedSessions,
            count: skippedSessions.length,
          });
        }

        log.info("Updated workshop counts", {
          workshopCount: workshopsUpdated,
          workshopDelta,
        });
      }

      log.end(true, {
        attendeeDelta: delta,
        workshopsUpdated,
      });
    } catch (error) {
      log.error("Error updating stats", error);
      log.end(false, {error: (error as Error).message});
      throw error;
    }
  }
);

/**
 * Callable function to manually trigger stats sync
 * Useful after deployment or for manual verification
 * Only accessible by authenticated admin users
 */
export const triggerStatsSync = onCall(
  {
    region: "asia-southeast1",
  },
  async (request) => {
    const log = cfLogger.createContext("triggerStatsSync");

    // Verify the caller is authenticated
    if (!request.auth) {
      log.error("User not authenticated");
      log.end(false, {reason: "unauthenticated"});
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const db = getFirestore(DATABASE_ID);

    // Verify the caller is an admin
    const adminDoc = await db.collection(COLLECTIONS.ADMINS)
      .doc(request.auth.uid)
      .get();

    if (!adminDoc.exists) {
      log.error("User is not an admin", {uid: request.auth.uid});
      log.end(false, {reason: "not_admin"});
      throw new HttpsError("permission-denied", "Only admins can trigger stats sync");
    }

    log.start({
      triggeredBy: request.auth.token.email || request.auth.uid,
    });

    try {
      // Query all confirmed and pending_verification registrations
      const confirmedQuery = await db.collection(COLLECTIONS.REGISTRATIONS)
        .where("status", "in", [
          REGISTRATION_STATUS.CONFIRMED,
          REGISTRATION_STATUS.PENDING_VERIFICATION,
        ])
        .get();

      // Registration stats
      let totalAttendees = 0;
      let confirmedRegistrationCount = 0;
      let pendingVerificationCount = 0;
      const workshopCounts: Record<string, number> = {};

      // Check-in stats
      let checkedInRegistrationCount = 0;
      let checkedInAttendeeCount = 0;
      let partiallyCheckedInCount = 0;

      // Finance stats
      let totalConfirmedPayments = 0;
      let totalPendingPayments = 0;
      const bankAccountStats: Record<string, {
        confirmed: number;
        pending: number;
        count: number;
      }> = {};

      // Church stats
      const churchStats: Record<string, {
        name: string;
        city: string;
        delegateCount: number;
        registrationCount: number;
      }> = {};

      // Food stats
      const foodStats: Record<string, number> = {};
      let totalWithFoodChoice = 0;
      let totalWithoutFoodChoice = 0;

      confirmedQuery.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const isConfirmed = data.status === REGISTRATION_STATUS.CONFIRMED;
        const isPendingVerification =
          data.status === REGISTRATION_STATUS.PENDING_VERIFICATION;

        if (isConfirmed) {
          confirmedRegistrationCount++;
        } else if (isPendingVerification) {
          pendingVerificationCount++;
        }

        // Count attendees
        totalAttendees += 1;
        const additionalCount = data.additionalAttendees?.length || 0;
        totalAttendees += additionalCount;
        const attendeeCount = 1 + additionalCount;

        // Count check-ins
        const checkedInCount = getCheckedInAttendeeCount(data);
        checkedInAttendeeCount += checkedInCount;

        if (checkedInCount === attendeeCount) {
          checkedInRegistrationCount++;
        } else if (checkedInCount > 0) {
          partiallyCheckedInCount++;
        }

        // Finance stats
        const paymentAmount = data.payment?.amountPaid || 0;
        const bankAccountId = data.payment?.bankAccountId;

        if (isConfirmed) {
          totalConfirmedPayments += paymentAmount;
        } else if (isPendingVerification) {
          totalPendingPayments += paymentAmount;
        }

        if (bankAccountId) {
          if (!bankAccountStats[bankAccountId]) {
            bankAccountStats[bankAccountId] = {
              confirmed: 0,
              pending: 0,
              count: 0,
            };
          }
          bankAccountStats[bankAccountId].count++;
          if (isConfirmed) {
            bankAccountStats[bankAccountId].confirmed += paymentAmount;
          } else if (isPendingVerification) {
            bankAccountStats[bankAccountId].pending += paymentAmount;
          }
        }

        // Count workshop selections
        // Support both old field name (workshopSelection) and new (workshopSelections)
        const primaryWorkshops = data.primaryAttendee?.workshopSelections ||
          (data.primaryAttendee?.workshopSelection ?
            [data.primaryAttendee.workshopSelection] : []);
        if (Array.isArray(primaryWorkshops)) {
          primaryWorkshops.forEach(
            (selection: {sessionId?: string} | string) => {
              const sessionId = typeof selection === "string" ?
                selection : selection?.sessionId;
              if (sessionId) {
                workshopCounts[sessionId] =
                  (workshopCounts[sessionId] || 0) + 1;
              }
            }
          );
        }

        if (data.additionalAttendees) {
          data.additionalAttendees.forEach(
            (attendee: {
              workshopSelections?: Array<{sessionId?: string}>;
              workshopSelection?: string | {sessionId?: string};
            }) => {
              // Support both old field name and new
              const attendeeWorkshops = attendee.workshopSelections ||
                (attendee.workshopSelection ?
                  [attendee.workshopSelection] : []);
              if (Array.isArray(attendeeWorkshops)) {
                attendeeWorkshops.forEach(
                  (selection: {sessionId?: string} | string) => {
                    const sessionId = typeof selection === "string" ?
                      selection : selection?.sessionId;
                    if (sessionId) {
                      workshopCounts[sessionId] =
                        (workshopCounts[sessionId] || 0) + 1;
                    }
                  }
                );
              }
            }
          );
        }

        // Aggregate church stats
        const churchName = data.church?.name || "Unknown Church";
        const churchCity = data.church?.city || "";
        // Use sanitized key (replace dots and slashes which are
        // invalid in Firestore paths)
        const churchKey = `${churchName}|${churchCity}`
          .replace(/\./g, "_")
          .replace(/\//g, "_");

        if (!churchStats[churchKey]) {
          churchStats[churchKey] = {
            name: churchName,
            city: churchCity,
            delegateCount: 0,
            registrationCount: 0,
          };
        }
        churchStats[churchKey].delegateCount += attendeeCount;
        churchStats[churchKey].registrationCount += 1;

        // Aggregate food stats for primary attendee
        const primaryFood = data.primaryAttendee?.foodChoice;
        if (primaryFood) {
          foodStats[primaryFood] = (foodStats[primaryFood] || 0) + 1;
          totalWithFoodChoice += 1;
        } else {
          totalWithoutFoodChoice += 1;
        }

        // Aggregate food stats for additional attendees
        if (data.additionalAttendees) {
          data.additionalAttendees.forEach(
            (attendee: {foodChoice?: string}) => {
              if (attendee.foodChoice) {
                foodStats[attendee.foodChoice] =
                  (foodStats[attendee.foodChoice] || 0) + 1;
                totalWithFoodChoice += 1;
              } else {
                totalWithoutFoodChoice += 1;
              }
            }
          );
        }
      });

      // Update stats document
      const statsRef = db.collection(COLLECTIONS.STATS).doc(STATS_DOC_ID);
      await statsRef.set({
        // Registration stats
        registeredAttendeeCount: totalAttendees,
        confirmedRegistrationCount,
        pendingVerificationCount,
        workshopCounts,
        // Check-in stats
        checkedInRegistrationCount,
        checkedInAttendeeCount,
        partiallyCheckedInCount,
        // Finance stats
        totalConfirmedPayments,
        totalPendingPayments,
        bankAccountStats,
        // Church stats
        churchStats,
        totalChurches: Object.keys(churchStats).length,
        // Food stats
        foodStats,
        totalWithFoodChoice,
        totalWithoutFoodChoice,
        // Timestamps
        lastSyncedAt: FieldValue.serverTimestamp(),
        lastUpdatedAt: FieldValue.serverTimestamp(),
      }, {merge: true});

      // Update workshop counts
      const sessionsCollection = db.collection(COLLECTIONS.SESSIONS);
      const batch = db.batch();

      // First fetch all existing workshop sessions to avoid updating
      // non-existent documents
      const allWorkshops = await sessionsCollection
        .where("sessionType", "==", "workshop")
        .get();

      const existingSessionIds = new Set<string>();
      allWorkshops.forEach((workshopDoc) => {
        existingSessionIds.add(workshopDoc.id);
      });

      // Track orphaned session IDs for logging
      const orphanedSessionIds: string[] = [];

      for (const [sessionId, count] of Object.entries(workshopCounts)) {
        if (existingSessionIds.has(sessionId)) {
          const sessionRef = sessionsCollection.doc(sessionId);
          batch.update(sessionRef, {
            registeredCount: count,
            updatedAt: FieldValue.serverTimestamp(),
          });
        } else {
          orphanedSessionIds.push(sessionId);
        }
      }

      // Log warning for orphaned session IDs
      if (orphanedSessionIds.length > 0) {
        log.warn("Found registrations with non-existent session IDs", {
          orphanedSessionIds,
          count: orphanedSessionIds.length,
        });
      }

      // Reset count for workshops that have no registrations
      allWorkshops.forEach((workshopDoc) => {
        if (!(workshopDoc.id in workshopCounts)) {
          batch.update(workshopDoc.ref, {
            registeredCount: 0,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      });

      await batch.commit();

      log.info("Manual stats sync completed", {
        totalAttendees,
        confirmedRegistrationCount,
        pendingVerificationCount,
        checkedInAttendeeCount,
        workshopCount: Object.keys(workshopCounts).length,
        totalChurches: Object.keys(churchStats).length,
        totalWithFoodChoice,
        totalWithoutFoodChoice,
      });

      log.end(true, {
        totalAttendees,
        confirmedRegistrationCount,
        checkedInAttendeeCount,
        totalChurches: Object.keys(churchStats).length,
        totalWithFoodChoice,
      });

      return {
        success: true,
        stats: {
          registeredAttendeeCount: totalAttendees,
          confirmedRegistrationCount,
          checkedInRegistrationCount,
          checkedInAttendeeCount,
          partiallyCheckedInCount,
          totalChurches: Object.keys(churchStats).length,
          totalWithFoodChoice,
          totalWithoutFoodChoice,
        },
      };
    } catch (error) {
      log.error("Error in manual stats sync", error);
      log.end(false, {error: (error as Error).message});
      throw new HttpsError("internal", "Failed to sync stats");
    }
  }
);

/**
 * Firestore trigger that updates check-in stats when registration is checked in
 * Updates the stats document with incremented check-in counts
 */
export const onCheckInStatsUpdate = onDocumentUpdated(
  {
    document: `${COLLECTIONS.REGISTRATIONS}/{registrationId}`,
    region: "asia-southeast1",
    database: DATABASE_ID,
  },
  async (event) => {
    const registrationId = event.params.registrationId;
    const log = cfLogger.createContext("onCheckInStatsUpdate", registrationId);

    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) {
      return;
    }

    // Only process confirmed registrations
    const confirmedStatuses = [
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.PENDING_VERIFICATION,
    ];

    if (!confirmedStatuses.includes(after.status)) {
      return;
    }

    // Calculate check-in changes
    const beforeCheckedIn = getCheckedInAttendeeCount(before);
    const afterCheckedIn = getCheckedInAttendeeCount(after);

    // Skip if no check-in change
    if (beforeCheckedIn === afterCheckedIn) {
      return;
    }

    const attendeeCount = 1 + (after.additionalAttendees?.length || 0);
    const checkInDelta = afterCheckedIn - beforeCheckedIn;

    log.start({
      registrationId,
      beforeCheckedIn,
      afterCheckedIn,
      attendeeCount,
      checkInDelta,
    });

    const db = getFirestore(DATABASE_ID);
    const statsRef = db.collection(COLLECTIONS.STATS).doc(STATS_DOC_ID);

    // Determine registration-level check-in status changes
    const wasFullyCheckedIn = beforeCheckedIn === attendeeCount;
    const isFullyCheckedIn = afterCheckedIn === attendeeCount;
    const wasPartiallyCheckedIn =
      beforeCheckedIn > 0 && beforeCheckedIn < attendeeCount;
    const isPartiallyCheckedIn =
      afterCheckedIn > 0 && afterCheckedIn < attendeeCount;

    const updates: Record<string, unknown> = {
      checkedInAttendeeCount: FieldValue.increment(checkInDelta),
      lastUpdatedAt: FieldValue.serverTimestamp(),
    };

    // Update registration-level counts
    if (!wasFullyCheckedIn && isFullyCheckedIn) {
      updates.checkedInRegistrationCount = FieldValue.increment(1);
      if (wasPartiallyCheckedIn) {
        updates.partiallyCheckedInCount = FieldValue.increment(-1);
      }
    } else if (wasFullyCheckedIn && !isFullyCheckedIn) {
      updates.checkedInRegistrationCount = FieldValue.increment(-1);
      if (isPartiallyCheckedIn) {
        updates.partiallyCheckedInCount = FieldValue.increment(1);
      }
    } else if (!wasPartiallyCheckedIn && isPartiallyCheckedIn) {
      updates.partiallyCheckedInCount = FieldValue.increment(1);
    } else if (
      wasPartiallyCheckedIn && !isPartiallyCheckedIn && !isFullyCheckedIn
    ) {
      updates.partiallyCheckedInCount = FieldValue.increment(-1);
    }

    try {
      await statsRef.set(updates, {merge: true});
      log.info("Updated check-in stats", {
        checkInDelta,
        isFullyCheckedIn,
        isPartiallyCheckedIn,
      });
      log.end(true, {
        checkInDelta,
        afterCheckedIn,
      });
    } catch (error) {
      log.error("Error updating check-in stats", error);
      log.end(false, {error: (error as Error).message});
      throw error;
    }
  }
);

// ============================================
// Verification Code System
// ============================================

/**
 * Verification code configuration
 */
const VERIFICATION_CODE_CONFIG = {
  /** Length of the verification code */
  CODE_LENGTH: 6,
  /** Time until code expires in minutes */
  EXPIRY_MINUTES: 15,
  /** Maximum verification attempts before lockout */
  MAX_ATTEMPTS: 5,
};

/**
 * Verification code types for cancel/transfer actions
 */
const VERIFICATION_ACTION = {
  CANCEL: "cancel",
  TRANSFER: "transfer",
} as const;

type VerificationAction = typeof VERIFICATION_ACTION[keyof typeof VERIFICATION_ACTION];

/**
 * Generates a random numeric verification code
 *
 * @param {number} length - Length of the code
 * @return {string} The generated code
 */
function generateVerificationCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

/**
 * Generates HTML email content for verification code
 *
 * @param {string} code - The verification code
 * @param {string} action - The action (cancel or transfer)
 * @param {string} attendeeName - Name of the attendee
 * @param {string} conferenceTitle - Conference title
 * @param {number} expiryMinutes - Minutes until code expires
 * @return {string} HTML email content
 */
function generateVerificationCodeEmailHtml(
  code: string,
  action: VerificationAction,
  attendeeName: string,
  conferenceTitle: string,
  expiryMinutes: number
): string {
  const actionText = action === VERIFICATION_ACTION.CANCEL ?
    "cancel your registration" :
    "transfer your registration";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Verification Code</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
          Verification Code
        </h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">
          ${conferenceTitle}
        </p>
      </div>

      <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <p style="font-size: 16px; margin: 0 0 20px;">
          Hi ${attendeeName},
        </p>

        <p style="font-size: 14px; margin: 0 0 30px; color: #4b5563;">
          You have requested to <strong>${actionText}</strong>.
          Please use the verification code below to proceed:
        </p>

        <div style="background: #f0f9ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 30px; text-align: center; margin: 0 0 30px;">
          <p style="font-size: 40px; font-family: 'Courier New', monospace; font-weight: bold; color: #1e40af; margin: 0; letter-spacing: 8px;">
            ${code}
          </p>
          <p style="font-size: 12px; color: #6b7280; margin: 15px 0 0;">
            This code expires in ${expiryMinutes} minutes
          </p>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 0 0 30px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; font-size: 13px; color: #92400e;">
            <strong>Important:</strong> If you did not request this verification code,
            please ignore this email. Your registration will remain unchanged.
          </p>
        </div>

        <p style="font-size: 14px; margin: 0; color: #6b7280;">
          If you need assistance, please contact us through our website.
        </p>
      </div>

      <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">
          © ${new Date().getFullYear()} ${CONFERENCE_NAME}. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generates plain text email content for verification code
 *
 * @param {string} code - The verification code
 * @param {string} action - The action (cancel or transfer)
 * @param {string} attendeeName - Name of the attendee
 * @param {number} expiryMinutes - Minutes until code expires
 * @return {string} Plain text email content
 */
function generateVerificationCodeEmailText(
  code: string,
  action: VerificationAction,
  attendeeName: string,
  expiryMinutes: number
): string {
  const actionText = action === VERIFICATION_ACTION.CANCEL ?
    "cancel your registration" :
    "transfer your registration";

  return `
Hi ${attendeeName},

You have requested to ${actionText}. Please use the verification code below to proceed:

Verification Code: ${code}

This code expires in ${expiryMinutes} minutes.

IMPORTANT: If you did not request this verification code, please ignore this email. Your registration will remain unchanged.

If you need assistance, please contact us through our website.

- ${CONFERENCE_NAME} Team
  `.trim();
}

/**
 * Sends a verification code to the user's email (and optionally SMS)
 *
 * This function:
 * 1. Validates the registration exists and is cancellable/transferable
 * 2. Generates a 6-digit verification code
 * 3. Stores the code in Firestore with expiry
 * 4. Sends the code via email (and SMS if configured)
 *
 * @param {Object} data - Request data
 * @param {string} data.registrationId - Registration ID
 * @param {string} data.action - Action type: "cancel" or "transfer"
 * @param {boolean} data.sendSms - Whether to also send SMS (optional)
 * @returns {Object} Success status and expiry time
 */
export const sendVerificationCode = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 10,
    secrets: [sendgridApiKey],
  },
  async (request) => {
    const {registrationId, action, sendSms} = request.data as {
      registrationId?: string;
      action?: string;
      sendSms?: boolean;
    };

    const log = cfLogger.createContext("sendVerificationCode", registrationId);
    log.start({registrationId, action});

    // Validate inputs
    if (!registrationId) {
      log.error("Missing registration ID");
      log.end(false, {reason: "missing_registration_id"});
      throw new HttpsError("invalid-argument", "Registration ID is required");
    }

    if (!action || !Object.values(VERIFICATION_ACTION).includes(
      action as VerificationAction
    )) {
      log.error("Invalid action", undefined, {action});
      log.end(false, {reason: "invalid_action"});
      throw new HttpsError(
        "invalid-argument",
        "Action must be 'cancel' or 'transfer'"
      );
    }

    // Get client IP for rate limiting
    const clientId = request.auth?.uid ||
                     request.rawRequest?.ip ||
                     registrationId;

    // Check rate limit for OTP requests
    try {
      await checkRateLimit(
        "otp_request",
        `${clientId}:${registrationId}`,
        RATE_LIMIT_CONFIGS.OTP_REQUEST
      );
    } catch (error) {
      await logRateLimitExceeded("otp_request", clientId, registrationId);
      throw error;
    }

    const db = getFirestore(DATABASE_ID);

    // Get registration
    const registrationRef = db
      .collection(COLLECTIONS.REGISTRATIONS)
      .doc(registrationId.toUpperCase());
    const registrationDoc = await registrationRef.get();

    if (!registrationDoc.exists) {
      log.error("Registration not found");
      log.end(false, {reason: "registration_not_found"});
      throw new HttpsError("not-found", "Registration not found");
    }

    const registration = registrationDoc.data();
    if (!registration) {
      throw new HttpsError("not-found", "Registration data is empty");
    }

    // Validate status allows cancellation/transfer
    const validStatuses = [
      REGISTRATION_STATUS.PENDING_PAYMENT,
      REGISTRATION_STATUS.PENDING_VERIFICATION,
      REGISTRATION_STATUS.CONFIRMED,
    ];

    if (!validStatuses.includes(registration.status)) {
      log.error("Invalid registration status", undefined, {
        status: registration.status,
      });
      log.end(false, {reason: "invalid_status"});
      throw new HttpsError(
        "failed-precondition",
        "This registration cannot be modified"
      );
    }

    // Generate verification code
    const code = generateVerificationCode(VERIFICATION_CODE_CONFIG.CODE_LENGTH);
    const expiresAt = new Date(
      Date.now() + VERIFICATION_CODE_CONFIG.EXPIRY_MINUTES * 60 * 1000
    );

    // Store verification code in Firestore
    const codeDocId = `${registrationId.toUpperCase()}_${action}`;
    await db.collection(COLLECTIONS.VERIFICATION_CODES).doc(codeDocId).set({
      registrationId: registrationId.toUpperCase(),
      action,
      code,
      attempts: 0,
      maxAttempts: VERIFICATION_CODE_CONFIG.MAX_ATTEMPTS,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: expiresAt.toISOString(),
      used: false,
    });

    log.info("Verification code stored", {codeDocId, expiresAt});

    // Get email settings and check if sending is enabled
    const emailSettings = await getEmailSettings();
    if (!emailSettings.triggerEmailsEnabled) {
      log.warn("Email sending is disabled in settings");
    }

    // Get conference settings for title
    let conferenceTitle = CONFERENCE_NAME;
    try {
      const settingsDoc = await db
        .collection(COLLECTIONS.CONFERENCES)
        .doc("conference-settings")
        .get();
      if (settingsDoc.exists) {
        conferenceTitle = settingsDoc.data()?.title || CONFERENCE_NAME;
      }
    } catch (err) {
      log.warn("Could not fetch conference title", {error: err});
    }

    // Send verification email
    const primaryEmail = registration.primaryAttendee?.email;
    const attendeeName = registration.primaryAttendee?.firstName || "Attendee";

    if (!primaryEmail) {
      log.error("No email address found for registration");
      log.end(false, {reason: "no_email"});
      throw new HttpsError(
        "failed-precondition",
        "No email address found for this registration"
      );
    }

    // Check if we should skip this email (test domain)
    if (shouldSkipEmail(primaryEmail, registration, emailSettings)) {
      log.info("Skipping email send for test/seeded data");
      log.end(true, {emailSent: false, reason: "test_data"});
      return {
        success: true,
        expiresAt: expiresAt.toISOString(),
        expiryMinutes: VERIFICATION_CODE_CONFIG.EXPIRY_MINUTES,
        emailSent: false,
      };
    }

    // Check if SendGrid is enabled
    if (!isSendGridEnabled()) {
      log.warn("SendGrid not enabled, cannot send verification email");
      log.end(true, {emailSent: false, reason: "sendgrid_disabled"});
      return {
        success: true,
        expiresAt: expiresAt.toISOString(),
        expiryMinutes: VERIFICATION_CODE_CONFIG.EXPIRY_MINUTES,
        emailSent: false,
      };
    }

    const apiKey = getSendGridApiKey();
    if (!apiKey) {
      log.warn("SendGrid API key not available");
      log.end(true, {emailSent: false, reason: "no_api_key"});
      return {
        success: true,
        expiresAt: expiresAt.toISOString(),
        expiryMinutes: VERIFICATION_CODE_CONFIG.EXPIRY_MINUTES,
        emailSent: false,
      };
    }

    try {
      sgMail.setApiKey(apiKey);

      const fromEmail = senderEmail.value();
      if (!fromEmail) {
        log.error("SENDER_EMAIL not configured");
        throw new Error("SENDER_EMAIL not configured");
      }

      const actionLabel = action === VERIFICATION_ACTION.CANCEL ?
        "Cancellation" :
        "Transfer";

      const msg = {
        to: primaryEmail,
        from: {
          email: fromEmail,
          name: senderName.value() || "IDMC Conference",
        },
        subject: `Your ${actionLabel} Verification Code - ${conferenceTitle}`,
        text: generateVerificationCodeEmailText(
          code,
          action as VerificationAction,
          attendeeName,
          VERIFICATION_CODE_CONFIG.EXPIRY_MINUTES
        ),
        html: generateVerificationCodeEmailHtml(
          code,
          action as VerificationAction,
          attendeeName,
          conferenceTitle,
          VERIFICATION_CODE_CONFIG.EXPIRY_MINUTES
        ),
      };

      await sgMail.send(msg);
      log.info("Verification code email sent", {to: primaryEmail});

      // Optionally send SMS
      let smsSent = false;
      if (sendSms && registration.primaryAttendee?.cellphone) {
        const smsSettings = await getSmsSettings();
        if (smsSettings.enabled) {
          const smsMessage = `Your ${conferenceTitle} verification code is: ${code}. This code expires in ${VERIFICATION_CODE_CONFIG.EXPIRY_MINUTES} minutes.`;

          smsSent = await sendSmsViaOneWaySms(
            registration.primaryAttendee.cellphone,
            smsMessage
          );

          if (smsSent) {
            log.info("Verification code SMS sent");
          }
        }
      }

      // Log the verification request
      await logAuditEvent({
        action: "registration.verification_sent",
        severity: AUDIT_SEVERITY.INFO,
        actorId: request.auth?.uid || null,
        entityType: "registration",
        entityId: registrationId.toUpperCase(),
        description: `Verification code sent for ${action} request`,
        ipAddress: clientId,
      });

      log.end(true, {emailSent: true, smsSent});
      return {
        success: true,
        expiresAt: expiresAt.toISOString(),
        expiryMinutes: VERIFICATION_CODE_CONFIG.EXPIRY_MINUTES,
        emailSent: true,
        smsSent,
      };
    } catch (error) {
      log.error("Failed to send verification email", error);
      log.end(false, {reason: "email_send_failed"});
      throw new HttpsError(
        "internal",
        "Failed to send verification code. Please try again."
      );
    }
  }
);

/**
 * Verifies a verification code for cancel/transfer actions
 *
 * This function:
 * 1. Validates the code exists and hasn't expired
 * 2. Checks attempt count to prevent brute force
 * 3. Marks the code as used on success
 *
 * @param {Object} data - Request data
 * @param {string} data.registrationId - Registration ID
 * @param {string} data.action - Action type: "cancel" or "transfer"
 * @param {string} data.code - The verification code to check
 * @returns {Object} Success status
 */
export const verifyCode = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 10,
  },
  async (request) => {
    const {registrationId, action, code} = request.data as {
      registrationId?: string;
      action?: string;
      code?: string;
    };

    const log = cfLogger.createContext("verifyCode", registrationId);
    log.start({registrationId, action});

    // Validate inputs
    if (!registrationId || !action || !code) {
      log.error("Missing required parameters");
      log.end(false, {reason: "missing_parameters"});
      throw new HttpsError(
        "invalid-argument",
        "Registration ID, action, and code are required"
      );
    }

    // Get client IP for rate limiting
    const clientId = request.auth?.uid ||
                     request.rawRequest?.ip ||
                     registrationId;

    // Check rate limit for verification attempts
    try {
      await checkRateLimit(
        "otp_verify",
        `${clientId}:${registrationId}`,
        RATE_LIMIT_CONFIGS.OTP_VERIFY
      );
    } catch (error) {
      await logRateLimitExceeded("otp_verify", clientId, registrationId);
      throw error;
    }

    const db = getFirestore(DATABASE_ID);
    const codeDocId = `${registrationId.toUpperCase()}_${action}`;
    const codeRef = db.collection(COLLECTIONS.VERIFICATION_CODES).doc(codeDocId);

    const codeDoc = await codeRef.get();

    if (!codeDoc.exists) {
      log.error("Verification code not found");
      log.end(false, {reason: "code_not_found"});
      throw new HttpsError(
        "not-found",
        "No verification code found. Please request a new code."
      );
    }

    const codeData = codeDoc.data();
    if (!codeData) {
      throw new HttpsError("not-found", "Verification data is empty");
    }

    // Check if code is already used
    if (codeData.used) {
      log.error("Code already used");
      log.end(false, {reason: "code_already_used"});
      throw new HttpsError(
        "failed-precondition",
        "This code has already been used. Please request a new code."
      );
    }

    // Check if code has expired
    const expiresAt = new Date(codeData.expiresAt);
    if (expiresAt < new Date()) {
      log.error("Code expired", undefined, {expiresAt: codeData.expiresAt});
      log.end(false, {reason: "code_expired"});

      // Delete expired code
      await codeRef.delete();

      throw new HttpsError(
        "failed-precondition",
        "This code has expired. Please request a new code."
      );
    }

    // Check attempt count
    if (codeData.attempts >= codeData.maxAttempts) {
      log.error("Max attempts exceeded", undefined, {
        attempts: codeData.attempts,
      });
      log.end(false, {reason: "max_attempts_exceeded"});

      // Delete the code to force new request
      await codeRef.delete();

      throw new HttpsError(
        "resource-exhausted",
        "Too many incorrect attempts. Please request a new code."
      );
    }

    // Verify the code
    if (codeData.code !== code) {
      // Increment attempt counter
      await codeRef.update({
        attempts: FieldValue.increment(1),
        lastAttemptAt: FieldValue.serverTimestamp(),
      });

      const remainingAttempts = codeData.maxAttempts - codeData.attempts - 1;
      log.warn("Invalid code attempt", {remainingAttempts});
      log.end(false, {reason: "invalid_code"});

      throw new HttpsError(
        "permission-denied",
        `Invalid code. ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining.`
      );
    }

    // Code is valid - mark as used
    await codeRef.update({
      used: true,
      usedAt: FieldValue.serverTimestamp(),
    });

    // Log successful verification
    await logAuditEvent({
      action: "registration.verification_confirmed",
      severity: AUDIT_SEVERITY.INFO,
      actorId: request.auth?.uid || null,
      entityType: "registration",
      entityId: registrationId.toUpperCase(),
      description: `Verification code confirmed for ${action}`,
      ipAddress: clientId,
    });

    log.end(true, {verified: true});
    return {
      success: true,
      verified: true,
    };
  }
);

/**
 * Generates HTML email content for transfer notification to new attendee
 *
 * @param {string} newAttendeeName - Name of the new attendee
 * @param {string} originalAttendeeName - Name of the original attendee
 * @param {string} registrationId - Registration ID
 * @param {string} conferenceTitle - Conference title
 * @param {Object} conferenceDetails - Conference details (date, venue)
 * @return {string} HTML email content
 */
function generateTransferNotificationHtml(
  newAttendeeName: string,
  originalAttendeeName: string,
  registrationId: string,
  conferenceTitle: string,
  conferenceDetails: {date?: string; venue?: string}
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Registration Transfer Notification</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
          🎉 Registration Transferred to You!
        </h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">
          ${conferenceTitle}
        </p>
      </div>

      <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <p style="font-size: 16px; margin: 0 0 20px;">
          Hi ${newAttendeeName},
        </p>

        <p style="font-size: 14px; margin: 0 0 20px; color: #4b5563;">
          Great news! <strong>${originalAttendeeName}</strong> has transferred their
          conference registration to you. You are now registered to attend the
          <strong>${conferenceTitle}</strong>!
        </p>

        <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 12px; padding: 20px; margin: 0 0 30px;">
          <h3 style="color: #166534; margin: 0 0 15px; font-size: 16px;">Your Registration Details:</h3>
          <p style="margin: 0 0 8px; font-size: 14px;">
            <strong>Registration ID:</strong> ${registrationId}
          </p>
          ${conferenceDetails.date ? `
          <p style="margin: 0 0 8px; font-size: 14px;">
            <strong>Date:</strong> ${conferenceDetails.date}
          </p>
          ` : ""}
          ${conferenceDetails.venue ? `
          <p style="margin: 0; font-size: 14px;">
            <strong>Venue:</strong> ${conferenceDetails.venue}
          </p>
          ` : ""}
        </div>

        <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 0 0 30px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; font-size: 13px; color: #1e40af;">
            <strong>What's next?</strong> You can check your registration status
            and download your ticket on our website using your email address or
            registration ID.
          </p>
        </div>

        <p style="font-size: 14px; margin: 0; color: #6b7280;">
          We look forward to seeing you at the conference! If you have any questions,
          please contact us through our website.
        </p>
      </div>

      <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">
          © ${new Date().getFullYear()} ${CONFERENCE_NAME}. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generates plain text email content for transfer notification
 *
 * @param {string} newAttendeeName - Name of the new attendee
 * @param {string} originalAttendeeName - Name of the original attendee
 * @param {string} registrationId - Registration ID
 * @param {string} conferenceTitle - Conference title
 * @param {Object} conferenceDetails - Conference details (date, venue)
 * @return {string} Plain text email content
 */
function generateTransferNotificationText(
  newAttendeeName: string,
  originalAttendeeName: string,
  registrationId: string,
  conferenceTitle: string,
  conferenceDetails: {date?: string; venue?: string}
): string {
  let details = `Registration ID: ${registrationId}`;
  if (conferenceDetails.date) {
    details += `\nDate: ${conferenceDetails.date}`;
  }
  if (conferenceDetails.venue) {
    details += `\nVenue: ${conferenceDetails.venue}`;
  }

  return `
Hi ${newAttendeeName},

Great news! ${originalAttendeeName} has transferred their conference registration to you. You are now registered to attend the ${conferenceTitle}!

Your Registration Details:
${details}

What's next?
You can check your registration status and download your ticket on our website using your email address or registration ID.

We look forward to seeing you at the conference! If you have any questions, please contact us through our website.

- ${CONFERENCE_NAME} Team
  `.trim();
}

/**
 * Sends a notification email to the new attendee after a transfer
 *
 * This function should be called after a successful transfer operation.
 * It notifies the new attendee about the transferred registration.
 *
 * @param {Object} data - Request data
 * @param {string} data.registrationId - Registration ID
 * @param {string} data.newAttendeeEmail - New attendee's email
 * @param {string} data.newAttendeeName - New attendee's name
 * @param {string} data.originalAttendeeName - Original attendee's name
 * @returns {Object} Success status
 */
export const sendTransferNotification = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 10,
    secrets: [sendgridApiKey],
  },
  async (request) => {
    const {
      registrationId,
      newAttendeeEmail,
      newAttendeeName,
      originalAttendeeName,
    } = request.data as {
      registrationId?: string;
      newAttendeeEmail?: string;
      newAttendeeName?: string;
      originalAttendeeName?: string;
    };

    const log = cfLogger.createContext(
      "sendTransferNotification",
      registrationId
    );
    log.start({registrationId, newAttendeeEmail});

    // Validate inputs
    if (!registrationId || !newAttendeeEmail || !newAttendeeName) {
      log.error("Missing required parameters");
      log.end(false, {reason: "missing_parameters"});
      throw new HttpsError(
        "invalid-argument",
        "Registration ID, new attendee email, and name are required"
      );
    }

    // Get email settings
    const emailSettings = await getEmailSettings();
    if (!emailSettings.triggerEmailsEnabled) {
      log.warn("Email sending is disabled");
      log.end(true, {emailSent: false, reason: "emails_disabled"});
      return {success: true, emailSent: false};
    }

    // Check if we should skip this email (test domain)
    if (isTestEmailDomain(newAttendeeEmail)) {
      log.info("Skipping email to test domain");
      log.end(true, {emailSent: false, reason: "test_domain"});
      return {success: true, emailSent: false};
    }

    // Check if SendGrid is enabled
    if (!isSendGridEnabled()) {
      log.warn("SendGrid not enabled");
      log.end(true, {emailSent: false, reason: "sendgrid_disabled"});
      return {success: true, emailSent: false};
    }

    const apiKey = getSendGridApiKey();
    if (!apiKey) {
      log.warn("SendGrid API key not available");
      log.end(true, {emailSent: false, reason: "no_api_key"});
      return {success: true, emailSent: false};
    }

    const db = getFirestore(DATABASE_ID);

    // Get conference settings
    let conferenceTitle = CONFERENCE_NAME;
    let conferenceDate = "";
    let conferenceVenue = "";

    try {
      const settingsDoc = await db
        .collection(COLLECTIONS.CONFERENCES)
        .doc("conference-settings")
        .get();
      if (settingsDoc.exists) {
        const data = settingsDoc.data();
        conferenceTitle = data?.title || CONFERENCE_NAME;
        if (data?.startDate) {
          const date = new Date(data.startDate);
          conferenceDate = date.toLocaleDateString("en-PH", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        }
        conferenceVenue = data?.venue?.name || "";
      }
    } catch (err) {
      log.warn("Could not fetch conference settings", {error: err});
    }

    try {
      sgMail.setApiKey(apiKey);

      const fromEmail = senderEmail.value();
      if (!fromEmail) {
        log.error("SENDER_EMAIL not configured");
        throw new Error("SENDER_EMAIL not configured");
      }

      const msg = {
        to: newAttendeeEmail,
        from: {
          email: fromEmail,
          name: senderName.value() || "IDMC Conference",
        },
        subject: `Registration Transferred to You - ${conferenceTitle}`,
        text: generateTransferNotificationText(
          newAttendeeName,
          originalAttendeeName || "Another attendee",
          registrationId.toUpperCase(),
          conferenceTitle,
          {date: conferenceDate, venue: conferenceVenue}
        ),
        html: generateTransferNotificationHtml(
          newAttendeeName,
          originalAttendeeName || "Another attendee",
          registrationId.toUpperCase(),
          conferenceTitle,
          {date: conferenceDate, venue: conferenceVenue}
        ),
      };

      await sgMail.send(msg);
      log.info("Transfer notification email sent", {to: newAttendeeEmail});

      // Log the notification
      await logAuditEvent({
        action: "registration.transfer_notification_sent",
        severity: AUDIT_SEVERITY.INFO,
        actorId: request.auth?.uid || null,
        entityType: "registration",
        entityId: registrationId.toUpperCase(),
        description: `Transfer notification sent to ${newAttendeeEmail}`,
        metadata: {
          newAttendeeEmail,
          newAttendeeName,
          originalAttendeeName,
        },
      });

      log.end(true, {emailSent: true});
      return {success: true, emailSent: true};
    } catch (error) {
      log.error("Failed to send transfer notification", error);
      log.end(false, {reason: "email_send_failed"});
      // Don't throw - transfer notification is not critical
      return {success: false, emailSent: false, error: "Failed to send email"};
    }
  }
);

/**
 * Generates HTML email content for transfer confirmation to original attendee
 *
 * @param {string} originalAttendeeName - Name of the original attendee
 * @param {string} newAttendeeName - Name of the new attendee
 * @param {string} registrationId - Registration ID
 * @param {string} conferenceTitle - Conference title
 * @return {string} HTML email content
 */
function generateTransferConfirmationHtml(
  originalAttendeeName: string,
  newAttendeeName: string,
  registrationId: string,
  conferenceTitle: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Registration Transfer Confirmation</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
          Registration Transfer Confirmed
        </h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">
          ${conferenceTitle}
        </p>
      </div>

      <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <p style="font-size: 16px; margin: 0 0 20px;">
          Hi ${originalAttendeeName},
        </p>

        <p style="font-size: 14px; margin: 0 0 20px; color: #4b5563;">
          This email confirms that your registration for <strong>${conferenceTitle}</strong>
          has been successfully transferred.
        </p>

        <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; margin: 0 0 30px;">
          <h3 style="color: #1e40af; margin: 0 0 15px; font-size: 16px;">Transfer Details:</h3>
          <p style="margin: 0 0 8px; font-size: 14px;">
            <strong>Registration ID:</strong> ${registrationId}
          </p>
          <p style="margin: 0; font-size: 14px;">
            <strong>Transferred to:</strong> ${newAttendeeName}
          </p>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 0 0 30px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; font-size: 13px; color: #92400e;">
            <strong>Please note:</strong> This registration is no longer associated with
            your account. If you did not authorize this transfer, please contact us immediately.
          </p>
        </div>

        <p style="font-size: 14px; margin: 0; color: #6b7280;">
          If you have any questions or concerns, please reach out to us through our website.
        </p>
      </div>

      <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">
          © ${new Date().getFullYear()} ${CONFERENCE_NAME}. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generates plain text email content for transfer confirmation
 *
 * @param {string} originalAttendeeName - Name of the original attendee
 * @param {string} newAttendeeName - Name of the new attendee
 * @param {string} registrationId - Registration ID
 * @param {string} conferenceTitle - Conference title
 * @return {string} Plain text email content
 */
function generateTransferConfirmationText(
  originalAttendeeName: string,
  newAttendeeName: string,
  registrationId: string,
  conferenceTitle: string
): string {
  return `
Hi ${originalAttendeeName},

This email confirms that your registration for ${conferenceTitle} has been successfully transferred.

Transfer Details:
Registration ID: ${registrationId}
Transferred to: ${newAttendeeName}

Please note: This registration is no longer associated with your account. If you did not authorize this transfer, please contact us immediately.

If you have any questions or concerns, please reach out to us through our website.

- ${CONFERENCE_NAME} Team
  `.trim();
}

/**
 * Sends a confirmation email to the original attendee after a transfer
 *
 * This function should be called after a successful transfer operation.
 * It notifies the original attendee that their registration has been transferred.
 *
 * @param {Object} data - Request data
 * @param {string} data.registrationId - Registration ID
 * @param {string} data.originalAttendeeEmail - Original attendee's email
 * @param {string} data.originalAttendeeName - Original attendee's name
 * @param {string} data.newAttendeeName - New attendee's name
 * @returns {Object} Success status
 */
export const sendTransferConfirmation = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 10,
    secrets: [sendgridApiKey],
  },
  async (request) => {
    const {
      registrationId,
      originalAttendeeEmail,
      originalAttendeeName,
      newAttendeeName,
    } = request.data as {
      registrationId?: string;
      originalAttendeeEmail?: string;
      originalAttendeeName?: string;
      newAttendeeName?: string;
    };

    const log = cfLogger.createContext(
      "sendTransferConfirmation",
      registrationId
    );
    log.start({registrationId, originalAttendeeEmail});

    // Validate inputs
    if (!registrationId || !originalAttendeeEmail || !originalAttendeeName) {
      log.error("Missing required parameters");
      log.end(false, {reason: "missing_parameters"});
      throw new HttpsError(
        "invalid-argument",
        "Registration ID, original attendee email, and name are required"
      );
    }

    // Get email settings
    const emailSettings = await getEmailSettings();
    if (!emailSettings.triggerEmailsEnabled) {
      log.warn("Email sending is disabled");
      log.end(true, {emailSent: false, reason: "emails_disabled"});
      return {success: true, emailSent: false};
    }

    // Check if we should skip this email (test domain)
    if (isTestEmailDomain(originalAttendeeEmail)) {
      log.info("Skipping email to test domain");
      log.end(true, {emailSent: false, reason: "test_domain"});
      return {success: true, emailSent: false};
    }

    // Check if SendGrid is enabled
    if (!isSendGridEnabled()) {
      log.warn("SendGrid not enabled");
      log.end(true, {emailSent: false, reason: "sendgrid_disabled"});
      return {success: true, emailSent: false};
    }

    const apiKey = getSendGridApiKey();
    if (!apiKey) {
      log.warn("SendGrid API key not available");
      log.end(true, {emailSent: false, reason: "no_api_key"});
      return {success: true, emailSent: false};
    }

    const db = getFirestore(DATABASE_ID);

    // Get conference settings
    let conferenceTitle = CONFERENCE_NAME;

    try {
      const settingsDoc = await db
        .collection(COLLECTIONS.CONFERENCES)
        .doc("conference-settings")
        .get();
      if (settingsDoc.exists) {
        const data = settingsDoc.data();
        conferenceTitle = data?.title || CONFERENCE_NAME;
      }
    } catch (err) {
      log.warn("Could not fetch conference settings", {error: err});
    }

    try {
      sgMail.setApiKey(apiKey);

      const fromEmail = senderEmail.value();
      if (!fromEmail) {
        log.error("SENDER_EMAIL not configured");
        throw new Error("SENDER_EMAIL not configured");
      }

      const msg = {
        to: originalAttendeeEmail,
        from: {
          email: fromEmail,
          name: senderName.value() || "IDMC Conference",
        },
        subject: `Registration Transfer Confirmed - ${conferenceTitle}`,
        text: generateTransferConfirmationText(
          originalAttendeeName,
          newAttendeeName || "Another attendee",
          registrationId.toUpperCase(),
          conferenceTitle
        ),
        html: generateTransferConfirmationHtml(
          originalAttendeeName,
          newAttendeeName || "Another attendee",
          registrationId.toUpperCase(),
          conferenceTitle
        ),
      };

      await sgMail.send(msg);
      log.info("Transfer confirmation email sent", {to: originalAttendeeEmail});

      // Log the confirmation
      await logAuditEvent({
        action: "registration.transfer_confirmation_sent",
        severity: AUDIT_SEVERITY.INFO,
        actorId: request.auth?.uid || null,
        entityType: "registration",
        entityId: registrationId.toUpperCase(),
        description: `Transfer confirmation sent to ${originalAttendeeEmail}`,
        metadata: {
          originalAttendeeEmail,
          originalAttendeeName,
          newAttendeeName,
        },
      });

      log.end(true, {emailSent: true});
      return {success: true, emailSent: true};
    } catch (error) {
      log.error("Failed to send transfer confirmation", error);
      log.end(false, {reason: "email_send_failed"});
      // Don't throw - transfer confirmation is not critical
      return {success: false, emailSent: false, error: "Failed to send email"};
    }
  }
);
