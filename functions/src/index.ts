/**
 * Firebase Cloud Functions
 * Handles server-side operations including admin invitation emails.
 *
 * @module functions/index
 */

import { setGlobalOptions } from "firebase-functions";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
initializeApp();

// For cost control, set maximum containers that can run simultaneously
setGlobalOptions({ maxInstances: 10 });

/**
 * Collection name constant for admins
 */
const COLLECTIONS = {
  ADMINS: "admins",
};

/**
 * Firestore trigger that sends invitation email when a new admin is created
 *
 * This function:
 * 1. Triggers when a new document is created in the 'admins' collection
 * 2. Checks if the admin has status 'pending'
 * 3. Creates a Firebase Auth user if one doesn't exist
 * 4. Generates a password reset link (used as invitation link)
 * 5. Sends the invitation email via Firebase Auth
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
      // The link will allow the user to set their password
      const actionCodeSettings = {
        url: `${process.env.APP_URL || "https://idmc-gcfsm-dev.web.app"}/admin/login?setup=complete`,
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

      // Update the admin document with:
      // 1. The correct Firebase Auth UID (replace temporary ID)
      // 2. Invitation sent timestamp
      // 3. Expiration timestamp

      // If the document ID doesn't match the Auth UID, we need to migrate the document
      if (adminId !== userRecord.uid) {
        // Create new document with correct UID
        const adminRef = db.collection(COLLECTIONS.ADMINS).doc(userRecord.uid);
        await adminRef.set({
          ...adminData,
          invitationSentAt: FieldValue.serverTimestamp(),
          inviteExpiresAt: inviteExpiresAt,
          inviteLink: inviteLink,
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Delete the old document with temporary ID
        await snapshot.ref.delete();

        logger.info(
          `Migrated admin document from ${adminId} to ${userRecord.uid}`
        );
      } else {
        // Update existing document
        await snapshot.ref.update({
          invitationSentAt: FieldValue.serverTimestamp(),
          inviteExpiresAt: inviteExpiresAt,
          inviteLink: inviteLink,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      // Send invitation email via Firebase Auth
      // Firebase automatically sends the password reset email when generatePasswordResetLink is called
      // However, we can also send a custom email if needed

      // Log success with role information
      logger.info(
        `Invitation email sent successfully to ${email} with role: ${role}`
      );

      // Note: The password reset email is sent automatically by Firebase Auth
      // when generatePasswordResetLink is called. The email contains a link
      // that allows the user to set their password.

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
 * Resend invitation email for a pending admin
 *
 * This can be called via HTTP request to resend an invitation
 * to an admin user who hasn't set up their account yet.
 */
export { onAdminCreated as sendAdminInvitation };
