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
  hasPermission,
  isSuperAdmin,
  ADMIN_ERROR_CODES,
} from './admin';

export {
  getDashboardStats,
  getRecentRegistrations,
  getRegistrationChartData,
  getActivePricingTier,
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
  confirmPayment,
  cancelRegistration,
  markEmailSent,
  lookupRegistration,
  incrementWorkshopCount,
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
  parseQRCode,
  getRegistrationForCheckIn,
  searchRegistrations,
  checkInAttendee,
  getCheckInStats,
  getRecentCheckIns,
  subscribeToCheckInStats,
  subscribeToRecentCheckIns,
  getCheckInsByHour,
  undoCheckIn,
} from './checkin';
