/**
 * Firebase Cloud Functions
 * Handles server-side operations including admin invitation emails.
 *
 * @module functions/index
 */

import {setGlobalOptions} from "firebase-functions";
import {defineString} from "firebase-functions/params";
import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {ImageAnnotatorClient} from "@google-cloud/vision";
import {initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {SecretManagerServiceClient} from "@google-cloud/secret-manager";
import * as sgMail from "@sendgrid/mail";
import * as QRCode from "qrcode";

// Initialize Firebase Admin SDK
initializeApp();

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

// OneWaySMS email-to-SMS gateway configuration
// SMS is sent by emailing: phone@{ONEWAYSMS_GATEWAY_DOMAIN}
// The SUBJECT line contains the SMS message content
const smsGatewayDomain = defineString("ONEWAYSMS_GATEWAY_DOMAIN", {
  default: "1.onewaysms.asia",
});
const smsGatewayEmail = defineString("ONEWAYSMS_GATEWAY_EMAIL", {default: ""});
const useOneWaySms = defineString("USE_ONEWAYSMS", {default: "false"});

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
 * Retrieves SendGrid API key from Secret Manager
 * Returns null if secret doesn't exist or can't be accessed
 */
async function getSendGridApiKey(): Promise<string | null> {
  try {
    const client = new SecretManagerServiceClient();
    const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
    const secretName = `projects/${projectId}/secrets/SENDGRID_API_KEY/versions/latest`;

    const [version] = await client.accessSecretVersion({name: secretName});
    const payload = version.payload?.data?.toString();

    return payload || null;
  } catch (error) {
    logger.warn("Could not access SENDGRID_API_KEY from Secret Manager:", error);
    return null;
  }
}

/**
 * Collection name constants
 */
const COLLECTIONS = {
  ADMINS: "admins",
  REGISTRATIONS: "registrations",
  SETTINGS: "settings",
};

/**
 * Registration status constants
 */
const REGISTRATION_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  PENDING_VERIFICATION: "pending_verification",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
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
  const apiKey = await getSendGridApiKey();
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
 * Checks if OneWaySMS is enabled and configured
 *
 * @return {boolean} boolean indicating if OneWaySMS should be used
 */
function isOneWaySmsEnabled(): boolean {
  return useOneWaySms.value().toLowerCase() === "true";
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
 *
 * @param {string} phoneNumber - Recipient phone number (any Philippine format)
 * @param {string} message - SMS message content (max 160 chars for single SMS)
 * @return {Promise<boolean>} True if SMS was sent successfully
 */
async function sendSmsViaOneWaySms(
  phoneNumber: string,
  message: string
): Promise<boolean> {
  if (!isOneWaySmsEnabled()) {
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
  const apiKey = await getSendGridApiKey();
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

  // Get gateway email address
  // Format: either direct gateway email or phone@gateway.domain
  const gatewayEmail = smsGatewayEmail.value();
  const gatewayDomain = smsGatewayDomain.value();

  let toEmail: string;
  if (gatewayEmail) {
    // Direct gateway email provided (OneWaySMS may use this format)
    toEmail = gatewayEmail;
  } else if (gatewayDomain) {
    // Standard email-to-SMS format: phone@gateway.domain
    toEmail = `${formattedPhone}@${gatewayDomain}`;
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
  `${COLLECTIONS.ADMINS}/{adminId}`,
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.error("No data associated with the event");
      return;
    }

    const adminData = snapshot.data();
    const adminId = event.params.adminId;

    // Only process pending invitations
    if (adminData.status !== "pending") {
      logger.info(`Admin ${adminId} is not pending, skipping invitation email`);
      return;
    }

    const {email, displayName, role} = adminData;

    if (!email) {
      logger.error(`Admin ${adminId} has no email address`);
      return;
    }

    logger.info(`Processing invitation for admin: ${email}`);

    const auth = getAuth();
    const db = getFirestore();

    try {
      let userRecord;

      // Check if Firebase Auth user already exists
      try {
        userRecord = await auth.getUserByEmail(email);
        logger.info(`User already exists for email: ${email}`);
      } catch (error: unknown) {
        // User doesn't exist, create one
        if ((error as { code?: string }).code === "auth/user-not-found") {
          logger.info(`Creating new Firebase Auth user for: ${email}`);
          userRecord = await auth.createUser({
            email,
            displayName: displayName || email.split("@")[0],
            disabled: false,
          });
        } else {
          throw error;
        }
      }

      // Generate password reset link (serves as invitation/setup link)
      const baseUrl = appUrl.value() || "https://idmc-gcfsm-dev.web.app";
      const actionCodeSettings = {
        url: `${baseUrl}/admin/login?setup=complete`,
        handleCodeInApp: false,
      };

      const inviteLink = await auth.generatePasswordResetLink(
        email,
        actionCodeSettings
      );

      logger.info(`Generated invitation link for: ${email}`);

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
        } catch (sendGridError) {
          logger.error("SendGrid email failed, storing link for manual sharing:", sendGridError);
        }
      }

      // If SendGrid not enabled or failed, log for Firebase fallback
      if (!emailSentViaSendGrid) {
        logger.info(
          `SendGrid not enabled. Invite link stored in Firestore for ${email}. ` +
          "Admin can share manually or set USE_SENDGRID=true for automatic emails."
        );
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

        logger.info(
          `Migrated admin document from ${adminId} to ${userRecord.uid}`
        );
      } else {
        // Update existing document
        await snapshot.ref.update(updateData);
      }

      logger.info(
        `Invitation processed for ${email} with role: ${role}. Email sent: ${emailSentViaSendGrid}`
      );
    } catch (error) {
      logger.error(`Error processing invitation for ${email}:`, error);

      // Update the admin document to reflect the error
      try {
        await snapshot.ref.update({
          invitationError: (error as Error).message || "Unknown error",
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch (updateError) {
        logger.error("Failed to update admin document with error:", updateError);
      }

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
  }
): string {
  const {
    registrationId,
    shortCode,
    primaryAttendee,
    totalAmount,
    paymentDeadline,
    church,
  } = registration;
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
                Please complete your payment to confirm your registration.
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
  attendeeIndex: number;
}

/**
 * Generates the HTML email template for ticket/confirmation (primary attendee)
 * Includes all QR codes for the entire group
 *
 * @param {Object} registration - Registration data
 * @param {Object} settings - Event settings data
 * @param {AttendeeWithQR[]} attendeesWithQR - Array of attendees with QR codes
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
    venue: {
      name: string;
      address: string;
    };
  },
  attendeesWithQR: AttendeeWithQR[]
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
        <img src="${attendee.qrCodeDataUrl}" alt="QR Code for ${attendee.firstName}" width="150" height="150" style="display: block; margin: 0 auto 8px; border: 2px solid #f3f4f6; border-radius: 4px;" />
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
                <li>Your personal QR code (screenshot or printed)</li>
                <li>Valid ID for verification</li>
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
    venue: {
      name: string;
      address: string;
    };
  },
  attendee: AttendeeWithQR
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
                      <img src="${attendee.qrCodeDataUrl}" alt="Your Check-in QR Code" width="180" height="180" style="display: block; margin: 0 auto; border: 4px solid #f3f4f6; border-radius: 8px;" />
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
                <li>This QR code (screenshot or printed)</li>
                <li>Valid ID for verification</li>
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
  const apiKey = await getSendGridApiKey();
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

  // Generate QR code for primary attendee
  const primaryQrData = `${registrationId}-0`;
  const primaryQrCodeDataUrl = await generateQRCodeDataUrl(primaryQrData);
  attendeesWithQR.push({
    firstName: primaryAttendee.firstName,
    lastName: primaryAttendee.lastName,
    email: primaryAttendee.email,
    qrCodeDataUrl: primaryQrCodeDataUrl,
    attendeeIndex: 0,
  });

  // Generate QR codes for additional attendees
  if (additionalAttendees && additionalAttendees.length > 0) {
    for (let i = 0; i < additionalAttendees.length; i++) {
      const attendee = additionalAttendees[i];
      const qrData = `${registrationId}-${i + 1}`;
      const qrCodeDataUrl = await generateQRCodeDataUrl(qrData);
      attendeesWithQR.push({
        firstName: attendee.firstName,
        lastName: attendee.lastName,
        email: attendee.email ?? undefined,
        qrCodeDataUrl,
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
 * @return {Promise<void>} Promise that resolves when email is sent
 */
async function sendTicketEmail(
  to: string,
  registration: Parameters<typeof generateTicketEmailHtml>[0],
  settings: Parameters<typeof generateTicketEmailHtml>[1],
  attendeesWithQR: AttendeeWithQR[]
): Promise<void> {
  const apiKey = await getSendGridApiKey();
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
    subject: `Your IDMC 2026 Ticket${attendeesWithQR.length > 1 ? "s" : ""} - ${registration.registrationId}`,
    html: generateTicketEmailHtml(registration, settings, attendeesWithQR),
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
  attendee: AttendeeWithQR
): Promise<void> {
  const apiKey = await getSendGridApiKey();
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
    subject: `Your IDMC 2026 Ticket - ${registration.registrationId}`,
    html: generateIndividualTicketEmailHtml(registration, settings, attendee),
  };

  await sgMail.send(msg);
  logger.info(`Individual ticket email sent to ${to} for ${attendee.firstName} ${attendee.lastName}`);
}

/**
 * Firestore trigger that sends confirmation email and SMS when a new
 * registration is created
 */
export const onRegistrationCreated = onDocumentCreated(
  `${COLLECTIONS.REGISTRATIONS}/{registrationId}`,
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.error("No data associated with the event");
      return;
    }

    const registrationData = snapshot.data();
    const registrationId = event.params.registrationId;

    logger.info(`Processing new registration: ${registrationId}`);

    const email = registrationData.primaryAttendee?.email;
    const phone = registrationData.primaryAttendee?.phone;
    const updateData: Record<string, unknown> = {};

    // Send confirmation email if SendGrid is enabled
    if (isSendGridEnabled() && email) {
      try {
        await sendRegistrationConfirmationEmail(email, {
          registrationId: registrationData.registrationId,
          shortCode: registrationData.shortCode,
          primaryAttendee: registrationData.primaryAttendee,
          totalAmount: registrationData.totalAmount,
          paymentDeadline: registrationData.paymentDeadline,
          church: registrationData.church,
        });
        updateData.confirmationEmailSent = true;
        updateData.confirmationEmailSentAt = FieldValue.serverTimestamp();
      } catch (error) {
        logger.error(`Error sending confirmation email for ${registrationId}:`, error);
      }
    } else if (!isSendGridEnabled()) {
      logger.info("SendGrid not enabled, skipping confirmation email");
    }

    // Send confirmation SMS if OneWaySMS is enabled and phone is available
    if (isOneWaySmsEnabled() && phone) {
      try {
        const smsMessage = SMS_TEMPLATES.registrationConfirmation(
          registrationData.primaryAttendee.firstName,
          registrationData.registrationId,
          registrationData.shortCode,
          registrationData.totalAmount,
          registrationData.paymentDeadline
        );
        const smsSent = await sendSmsViaOneWaySms(phone, smsMessage);
        if (smsSent) {
          updateData.confirmationSmsSent = true;
          updateData.confirmationSmsSentAt = FieldValue.serverTimestamp();
        }
      } catch (error) {
        logger.error(`Error sending confirmation SMS for ${registrationId}:`, error);
      }
    } else if (!isOneWaySmsEnabled()) {
      logger.info("OneWaySMS not enabled, skipping confirmation SMS");
    }

    // Update document with notification status
    if (Object.keys(updateData).length > 0) {
      await snapshot.ref.update(updateData);
    }
  }
);

/**
 * Firestore trigger that sends ticket email and SMS when payment is confirmed
 */
export const onPaymentConfirmed = onDocumentUpdated(
  `${COLLECTIONS.REGISTRATIONS}/{registrationId}`,
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!before || !after) {
      return;
    }

    // Check if status changed to confirmed
    if (before.status === REGISTRATION_STATUS.CONFIRMED ||
        after.status !== REGISTRATION_STATUS.CONFIRMED) {
      return;
    }

    const registrationId = event.params.registrationId;
    logger.info(`Payment confirmed for registration: ${registrationId}`);

    const primaryEmail = after.primaryAttendee?.email;
    const primaryPhone = after.primaryAttendee?.phone;
    const updateData: Record<string, unknown> = {};

    // Get conference settings for event details (needed for email)
    const db = getFirestore();
    const defaultSettings = {
      title: "IDMC 2026",
      startDate: new Date().toISOString(),
      venue: {name: "TBD", address: "TBD"},
    };
    let settings: typeof defaultSettings = defaultSettings;
    try {
      const settingsDoc = await db.collection(COLLECTIONS.SETTINGS).doc("conference").get();
      const data = settingsDoc.data();
      if (data) {
        settings = {
          title: data.title || defaultSettings.title,
          startDate: data.startDate || defaultSettings.startDate,
          venue: data.venue || defaultSettings.venue,
        };
      }
    } catch (error) {
      logger.warn("Could not fetch settings, using defaults:", error);
    }

    // Send ticket email if SendGrid is enabled
    if (isSendGridEnabled() && primaryEmail) {
      try {
        // Generate QR codes for all attendees
        const attendeesWithQR = await generateAllAttendeeQRCodes(
          after.registrationId,
          after.primaryAttendee,
          after.additionalAttendees
        );

        logger.info(`Generated ${attendeesWithQR.length} QR codes for registration: ${registrationId}`);

        // Send email to primary attendee with ALL QR codes
        await sendTicketEmail(primaryEmail, {
          registrationId: after.registrationId,
          shortCode: after.shortCode,
          qrCodeData: after.qrCodeData,
          primaryAttendee: after.primaryAttendee,
          totalAmount: after.totalAmount,
          church: after.church,
          additionalAttendees: after.additionalAttendees,
        }, settings, attendeesWithQR);

        updateData.ticketEmailSent = true;
        updateData.ticketEmailSentAt = FieldValue.serverTimestamp();

        // Send individual emails to additional attendees with emails
        const additionalAttendees = after.additionalAttendees || [];
        let additionalEmailsSent = 0;

        for (let i = 0; i < additionalAttendees.length; i++) {
          const attendee = additionalAttendees[i];
          const attendeeEmail = attendee.email?.trim();

          if (attendeeEmail) {
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
                  attendeeWithQR
                );
                additionalEmailsSent++;
              }
            } catch (emailError) {
              logger.warn(`Failed to send individual email to ${attendeeEmail}:`, emailError);
            }
          }
        }

        updateData.additionalEmailsSent = additionalEmailsSent;
        logger.info(`Sent ${additionalEmailsSent} additional individual ticket emails for ${registrationId}`);
      } catch (error) {
        logger.error(`Error sending ticket email for ${registrationId}:`, error);
      }
    } else if (!isSendGridEnabled()) {
      logger.info("SendGrid not enabled, skipping ticket email");
    }

    // Send confirmation SMS if OneWaySMS is enabled and phone is available
    if (isOneWaySmsEnabled() && primaryPhone) {
      try {
        const smsMessage = SMS_TEMPLATES.paymentConfirmed(
          after.primaryAttendee.firstName,
          after.shortCode
        );
        const smsSent = await sendSmsViaOneWaySms(primaryPhone, smsMessage);
        if (smsSent) {
          updateData.ticketSmsSent = true;
          updateData.ticketSmsSentAt = FieldValue.serverTimestamp();
        }
      } catch (error) {
        logger.error(`Error sending payment confirmation SMS for ${registrationId}:`, error);
      }
    } else if (!isOneWaySmsEnabled()) {
      logger.info("OneWaySMS not enabled, skipping ticket SMS");
    }

    // Update document with notification status
    if (Object.keys(updateData).length > 0) {
      await event.data?.after?.ref.update(updateData);
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
    logger.info("Running scheduled task: cancelExpiredRegistrations");

    const db = getFirestore();
    const now = new Date();

    try {
      // Query for pending_payment registrations with expired deadlines
      const expiredQuery = await db.collection(COLLECTIONS.REGISTRATIONS)
        .where("status", "==", REGISTRATION_STATUS.PENDING_PAYMENT)
        .where("paymentDeadline", "<", now.toISOString())
        .get();

      if (expiredQuery.empty) {
        logger.info("No expired registrations found");
        return;
      }

      logger.info(`Found ${expiredQuery.size} expired registrations to cancel`);

      const batch = db.batch();
      let cancelCount = 0;

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
      });

      await batch.commit();
      logger.info(`Successfully cancelled ${cancelCount} expired registrations`);
    } catch (error) {
      logger.error("Error cancelling expired registrations:", error);
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
    const {image} = request.data as {image?: string};

    if (!image) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required parameter: image (base64 encoded)"
      );
    }

    logger.info("Processing receipt OCR request");

    try {
      const client = getVisionClient();

      // Decode base64 image
      const imageBuffer = Buffer.from(image, "base64");

      // Call Vision API for text detection
      const [result] = await client.textDetection({
        image: {content: imageBuffer},
      });

      const detections = result.textAnnotations;

      if (!detections || detections.length === 0) {
        logger.info("No text detected in image");
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

      logger.info(
        `OCR completed: ${fullText.length} chars, ${wordCount} words detected`
      );

      return {
        text: fullText.replace(/\s+/g, " ").trim(),
        confidence: estimatedConfidence,
        wordCount,
      };
    } catch (error) {
      logger.error("Vision API error:", error);
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

Thank you for your registration to IDMC GCFSM 2025.

Please find attached your invoice for:
- Registration ID: ${data.registrationId}
- Invoice Number: ${data.invoiceNumber}
- Amount Paid: ₱${data.amountPaid.toLocaleString()}
- Attendee: ${data.primaryAttendee.firstName} ${data.primaryAttendee.lastName}

If you have any questions regarding your invoice, please contact us at ${senderEmail.value()}.

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

    <p>Thank you for your registration to <strong>IDMC GCFSM 2025</strong>.</p>

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

    <p>If you have any questions regarding your invoice, please contact us at <a href="mailto:${senderEmail.value()}">${senderEmail.value()}</a>.</p>

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
  {cors: true},
  async (request) => {
    const {registrationId} = request.data;

    // Validate admin authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    logger.info(`Processing invoice email request for registration: ${registrationId}`);

    // Check if SendGrid is enabled
    if (!isSendGridEnabled()) {
      throw new HttpsError(
        "failed-precondition",
        "Email service is not configured. Please contact support."
      );
    }

    const db = getFirestore();
    const registrationRef = db.collection(COLLECTIONS.REGISTRATIONS)
      .doc(registrationId);

    try {
      // Get registration document
      const registrationDoc = await registrationRef.get();
      if (!registrationDoc.exists) {
        throw new HttpsError("not-found", "Registration not found");
      }

      const registration = registrationDoc.data();
      if (!registration) {
        throw new HttpsError("not-found", "Registration data is empty");
      }

      // Validate invoice request
      if (!registration.invoice?.requested) {
        throw new HttpsError(
          "failed-precondition",
          "No invoice was requested for this registration"
        );
      }

      if (!registration.invoice?.invoiceUrl) {
        throw new HttpsError(
          "failed-precondition",
          "Invoice file has not been uploaded yet"
        );
      }

      // Validate registration is confirmed
      if (registration.status !== REGISTRATION_STATUS.CONFIRMED) {
        throw new HttpsError(
          "failed-precondition",
          "Registration must be confirmed before sending invoice"
        );
      }

      const primaryEmail = registration.primaryAttendee?.email;
      if (!primaryEmail) {
        throw new HttpsError("failed-precondition", "No email address found");
      }

      // Get SendGrid API key
      const apiKey = await getSendGridApiKey();
      if (!apiKey) {
        throw new HttpsError(
          "failed-precondition",
          "SendGrid API key is not configured"
        );
      }

      sgMail.setApiKey(apiKey);

      const fromEmail = senderEmail.value();
      if (!fromEmail) {
        throw new HttpsError("failed-precondition", "SENDER_EMAIL is not configured");
      }

      // Download invoice file from Storage
      const {getStorage} = await import("firebase-admin/storage");
      const bucket = getStorage().bucket();

      // Extract file path from URL
      const invoiceUrl = registration.invoice.invoiceUrl;
      const urlParts = invoiceUrl.split("/o/")[1];
      const filePath = decodeURIComponent(urlParts.split("?")[0]);

      logger.info(`Downloading invoice file from: ${filePath}`);
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
        subject: `Invoice ${registration.invoice.invoiceNumber} - IDMC GCFSM 2025`,
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
      logger.info(`Invoice email sent successfully to ${primaryEmail}`);

      // Update registration with sent status
      await registrationRef.update({
        "invoice.status": INVOICE_STATUS.SENT,
        "invoice.sentAt": FieldValue.serverTimestamp(),
        "invoice.sentBy": request.auth.token.email || "unknown",
        "invoice.emailDeliveryStatus": "sent",
        "updatedAt": FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: `Invoice sent successfully to ${primaryEmail}`,
      };
    } catch (error) {
      logger.error(`Error sending invoice email for ${registrationId}:`, error);

      // Update status to failed
      try {
        await registrationRef.update({
          "invoice.status": INVOICE_STATUS.FAILED,
          "invoice.emailDeliveryStatus": "failed",
          "invoice.errorMessage": error instanceof Error ? error.message : "Unknown error",
          "updatedAt": FieldValue.serverTimestamp(),
        });
      } catch (updateError) {
        logger.error("Failed to update invoice status:", updateError);
      }

      // Re-throw as HttpsError if not already one
      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        `Failed to send invoice email: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
);
