/**
 * Feedback Service
 * Provides functions to submit event feedback to Firestore.
 *
 * @module services/feedback
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS } from '../constants';

/**
 * Submits event feedback to Firestore.
 *
 * @param {Object} feedbackData - The feedback data
 * @param {boolean} feedbackData.isAnonymous - Whether submission is anonymous
 * @param {string|null} feedbackData.submitterName - Name of submitter (null if anonymous)
 * @param {string} feedbackData.age - Age of submitter (optional)
 * @param {string} feedbackData.growthGroup - Growth group of submitter (optional)
 * @param {boolean} feedbackData.receivedJesus - Spiritual impact checkbox
 * @param {boolean} feedbackData.commitmentToGrow - Spiritual impact checkbox
 * @param {boolean} feedbackData.commitmentToRelationship - Spiritual impact checkbox
 * @param {boolean} feedbackData.commitmentToGroup - Spiritual impact checkbox
 * @param {boolean} feedbackData.commitmentToMinistry - Spiritual impact checkbox
 * @param {boolean} feedbackData.seekCounselling - Whether user seeks counselling
 * @param {string|null} feedbackData.counsellingName - Contact name for counselling
 * @param {string|null} feedbackData.counsellingPhone - Contact phone for counselling
 * @param {string} feedbackData.howBlessed - Open-ended response
 * @param {string} feedbackData.godDidInMe - Open-ended response
 * @param {string} feedbackData.smartGoal - Open-ended response
 * @param {string} feedbackData.programme - Open-ended response
 * @param {string} feedbackData.couldDoWithout - Open-ended response
 * @param {string} feedbackData.couldDoMoreOf - Open-ended response
 * @param {string} feedbackData.bestDoneWas - Open-ended response
 * @param {string} feedbackData.otherComments - Open-ended response
 * @returns {Promise<string>} The ID of the created feedback document
 * @throws {Error} If the Firestore operation fails or validation fails
 */
export async function submitFeedback(feedbackData) {
  const {
    isAnonymous,
    submitterName,
    age,
    growthGroup,
    receivedJesus,
    commitmentToGrow,
    commitmentToRelationship,
    commitmentToGroup,
    commitmentToMinistry,
    seekCounselling,
    counsellingName,
    counsellingPhone,
    howBlessed,
    godDidInMe,
    smartGoal,
    programme,
    couldDoWithout,
    couldDoMoreOf,
    bestDoneWas,
    otherComments,
  } = feedbackData;

  // Validate counselling contact info if seeking counselling
  if (seekCounselling) {
    if (!counsellingName || !counsellingName.trim()) {
      throw new Error('Name is required when seeking counselling');
    }
    if (!counsellingPhone || !counsellingPhone.trim()) {
      throw new Error('Phone number is required when seeking counselling');
    }
  }

  const feedbackRef = collection(db, COLLECTIONS.FEEDBACK);

  const docRef = await addDoc(feedbackRef, {
    isAnonymous: Boolean(isAnonymous),
    submitterName: isAnonymous ? null : (submitterName?.trim() || null),
    age: age?.trim() || null,
    growthGroup: growthGroup?.trim() || null,
    // Spiritual impact
    receivedJesus: Boolean(receivedJesus),
    commitmentToGrow: Boolean(commitmentToGrow),
    commitmentToRelationship: Boolean(commitmentToRelationship),
    commitmentToGroup: Boolean(commitmentToGroup),
    commitmentToMinistry: Boolean(commitmentToMinistry),
    seekCounselling: Boolean(seekCounselling),
    // Counselling contact
    counsellingName: seekCounselling ? (counsellingName?.trim() || null) : null,
    counsellingPhone: seekCounselling ? (counsellingPhone?.trim() || null) : null,
    // Open-ended responses
    howBlessed: howBlessed?.trim() || null,
    godDidInMe: godDidInMe?.trim() || null,
    smartGoal: smartGoal?.trim() || null,
    programme: programme?.trim() || null,
    couldDoWithout: couldDoWithout?.trim() || null,
    couldDoMoreOf: couldDoMoreOf?.trim() || null,
    bestDoneWas: bestDoneWas?.trim() || null,
    otherComments: otherComments?.trim() || null,
    // Metadata
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}
