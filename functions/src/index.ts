/**
 * Firebase Cloud Functions
 * Handles server-side operations including admin invitation emails.
 *
 * @module functions/index
 */

import { setGlobalOptions } from "firebase-functions";
import { defineString, defineSecret } from "firebase-functions/params";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as sgMail from "@sendgrid/mail";

// Initialize Firebase Admin SDK
initializeApp();

// Set global options for all functions
setGlobalOptions({
  maxInstances: 10,
  region: "asia-southeast1",
});

// Define environment parameters
// Secret stored in Google Secret Manager (optional - falls back to Firebase email)
const sendgridApiKey = defineSecret("SENDGRID_API_KEY");

// Regular config params (not sensitive)
const senderEmail = defineString("SENDER_EMAIL", { default: "" });
const senderName = defineString("SENDER_NAME", { default: "IDMC Admin" });
const appUrl = defineString("APP_URL", { default: "" });

// Flag to enable/disable SendGrid (set to "true" to use SendGrid)
const useSendGrid = defineString("USE_SENDGRID", { default: "false" });

/**
 * Collection name constant for admins
 */
const COLLECTIONS = {
  ADMINS: "admins",
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
 * @param displayName - The invited user's display name
 * @param role - The assigned role
 * @param inviteLink - The password setup link
 * @param expiresIn - Hours until link expires
 * @returns HTML string for the email
 */
function generateInvitationEmailHtml(
  displayName: string,
  role: string,
  inviteLink: string,
  expiresIn: number = 72
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
 * @param displayName - The invited user's display name
 * @param role - The assigned role
 * @param inviteLink - The password setup link
 * @param expiresIn - Hours until link expires
 * @returns Plain text string for the email
 */
function generateInvitationEmailText(
  displayName: string,
  role: string,
  inviteLink: string,
  expiresIn: number = 72
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
 * @param to - Recipient email address
 * @param displayName - Recipient's display name
 * @param role - Assigned admin role
 * @param inviteLink - Password setup link
 * @returns Promise that resolves when email is sent
 */
async function sendInvitationEmailViaSendGrid(
  to: string,
  displayName: string,
  role: string,
  inviteLink: string
): Promise<void> {
  // Initialize SendGrid with API key
  sgMail.setApiKey(sendgridApiKey.value());

  const msg = {
    to,
    from: {
      email: senderEmail.value(),
      name: senderName.value(),
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
 * @returns boolean indicating if SendGrid should be used
 */
function isSendGridEnabled(): boolean {
  return useSendGrid.value().toLowerCase() === "true";
}

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
    secrets: [sendgridApiKey],
  },
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

    const { email, displayName, role } = adminData;

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
          `Admin can share manually or set USE_SENDGRID=true for automatic emails.`
        );
      }

      // Update the admin document with invitation details
      // If the document ID doesn't match the Auth UID, migrate the document
      const updateData = {
        invitationSentAt: FieldValue.serverTimestamp(),
        inviteExpiresAt: inviteExpiresAt,
        inviteLink: emailSentViaSendGrid ? null : inviteLink, // Store link only if email wasn't sent
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
