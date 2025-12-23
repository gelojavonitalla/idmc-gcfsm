/**
 * Services Barrel Export
 * Central export point for all service modules.
 *
 * @module services
 */

export {
  getPublishedSpeakers,
  getSpeakerById,
  getFeaturedSpeakers,
} from './speakers';

export {
  getPublishedSessions,
  getSessionById,
  getSessionsByType,
} from './sessions';

export {
  getPublishedWorkshops,
  getWorkshopById,
  getWorkshopsByCategory,
  getWorkshopsByTimeSlot,
  hasAvailableCapacity,
  getRemainingCapacity,
  groupWorkshopsByTimeSlot,
} from './workshops';

export {
  getPublishedFAQs,
  getFAQsByCategory,
  getFAQById,
} from './faq';

export { submitContactInquiry } from './contactInquiries';

export {
  signInAdmin,
  signOutAdmin,
  sendAdminPasswordReset,
  getAdminProfile,
  subscribeToAuthState,
  getCurrentUser,
} from './auth';

export {
  getAllAdmins,
  getAdmin,
  getAdminByEmail,
  isEmailRegistered,
  createAdmin,
  updateAdmin,
  updateAdminRole,
  activateAdmin,
  deactivateAdmin,
  resendInvitation,
  revokeInvitation,
  hasPermission,
  isSuperAdmin,
  ADMIN_ERROR_CODES,
} from './admin';

export {
  getDashboardStats,
  getRecentRegistrations,
  getRegistrationChartData,
  getActivePricingTier,
  getChurchStats,
  getFoodStats,
  getDownloadStats,
} from './analytics';

export {
  getConferenceSettings,
  updateConferenceSettings,
  getPricingTiers,
  createPricingTier,
  updatePricingTier,
  deletePricingTier,
  getActivePricingTierFromDb,
} from './settings';

export {
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABELS,
  ENTITY_TYPES,
  logActivity,
  getActivityLogs,
  getActivityLogsCount,
  getAdminRecentActivity,
  getEntityActivityLogs,
} from './activityLog';

export {
  REGISTRATION_ERROR_CODES,
  getRegistrationByEmail,
  getRegistrationById,
  getRegistrationByShortCode,
  getRegistrationByPhone,
  uploadPaymentProof,
  createRegistration,
  updatePaymentProof,
  verifyPayment,
  confirmPayment,
  cancelRegistration,
  markEmailSent,
  lookupRegistration,
  incrementWorkshopCount,
  getTotalConfirmedAttendeeCount,
} from './registration';

export {
  ROOM_TYPES,
  ROOM_TYPE_LABELS,
  getVenueRooms,
  getVenueRoomById,
  createVenueRoom,
  updateVenueRoom,
  deleteVenueRoom,
  getVenueTransport,
  createVenueTransport,
  updateVenueTransport,
  deleteVenueTransport,
  getVenueAmenities,
  createVenueAmenity,
  updateVenueAmenity,
  deleteVenueAmenity,
} from './venue';

export {
  CHECK_IN_METHODS,
  CHECK_IN_ERROR_CODES,
  validateCheckInEligibility,
  validateAttendeeCheckInEligibility,
  parseQRCode,
  getRegistrationForCheckIn,
  searchRegistrations,
  checkInAttendee,
  checkInSingleAttendee,
  getCheckInStats,
  getRecentCheckIns,
  subscribeToCheckInStats,
  subscribeToCheckInStatsFromCollection,
  subscribeToRecentCheckIns,
  getCheckInsByHour,
  undoCheckIn,
  getAttendeeByIndex,
  getAttendeeCheckInStatus,
  areAllAttendeesCheckedIn,
  getCheckedInAttendeeCount,
} from './checkin';

export {
  BANK_ACCOUNT_ERROR_CODES,
  getAllBankAccounts,
  getBankAccountById,
  getActiveBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  toggleBankAccountStatus,
  getRegistrationsByBankAccount,
} from './bankAccounts';

export {
  INVOICE_ERROR_CODES,
  getInvoiceRequests,
  getRegistrationWithInvoice,
  updateInvoiceUpload,
  markInvoiceSent,
  markInvoiceFailed,
  generateAndReserveInvoiceNumber,
  getInvoiceRequestCounts,
  searchInvoiceRequests,
} from './invoice';

export {
  getConferenceStats,
  subscribeToConferenceStats,
} from './stats';
