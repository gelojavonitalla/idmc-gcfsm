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
  createAdmin,
  updateAdmin,
  updateAdminRole,
  activateAdmin,
  deactivateAdmin,
  hasPermission,
  isSuperAdmin,
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
