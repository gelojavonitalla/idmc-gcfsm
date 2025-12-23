/**
 * Application Constants
 * Central location for all magic strings and configuration values
 */

/**
 * Route paths for the application
 */
export const ROUTES = {
  HOME: '/',
  SPEAKERS: '/speakers',
  SCHEDULE: '/schedule',
  REGISTER: '/register',
  REGISTRATION_STATUS: '/registration/status',
  FAQ: '/faq',
  ABOUT: '/about',
  VENUE: '/venue',
  CONTACT: '/contact',
  DOWNLOADS: '/downloads',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  IDMC_2025: '/idmc-2025',
  MAINTENANCE: '/maintenance',
  FEEDBACK: '/feedback',
};

/**
 * Admin route paths for the admin dashboard
 */
export const ADMIN_ROUTES = {
  ROOT: '/admin',
  LOGIN: '/admin/login',
  PASSWORD_SETUP: '/admin/password-setup',
  DASHBOARD: '/admin/dashboard',
  REGISTRATIONS: '/admin/registrations',
  CHECKIN: '/admin/check-in',
  CHECKIN_MONITOR: '/admin/check-in-monitor',
  SPEAKERS: '/admin/speakers',
  SCHEDULE: '/admin/schedule',
  WORKSHOPS: '/admin/workshops',
  FAQ: '/admin/faq',
  DOWNLOADS: '/admin/downloads',
  ABOUT_CONTENT: '/admin/about-content',
  LEGAL: '/admin/legal',
  SETTINGS: '/admin/settings',
  USERS: '/admin/users',
  ACTIVITY: '/admin/activity',
  VENUE: '/admin/venue',
  INQUIRIES: '/admin/inquiries',
  BANK_ACCOUNTS: '/admin/bank-accounts',
  INVOICES: '/admin/invoices',
  FINANCE_DASHBOARD: '/admin/finance-dashboard',
  FOOD_MENU: '/admin/food-menu',
  WHAT_TO_BRING: '/admin/what-to-bring',
  CHURCHES_BREAKDOWN: '/admin/churches',
};

/**
 * Admin role identifiers for role-based access control
 */
export const ADMIN_ROLES = Object.freeze({
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  FINANCE: 'finance',
  MEDIA: 'media',
  VOLUNTEER: 'volunteer',
});

/**
 * Admin role labels for display
 */
export const ADMIN_ROLE_LABELS = {
  [ADMIN_ROLES.SUPERADMIN]: 'Super Admin',
  [ADMIN_ROLES.ADMIN]: 'Admin',
  [ADMIN_ROLES.FINANCE]: 'Finance',
  [ADMIN_ROLES.MEDIA]: 'Media',
  [ADMIN_ROLES.VOLUNTEER]: 'Volunteer',
};

/**
 * Admin role descriptions for UI display
 */
export const ADMIN_ROLE_DESCRIPTIONS = {
  [ADMIN_ROLES.SUPERADMIN]: 'Full access to all features and user management.',
  [ADMIN_ROLES.ADMIN]: 'Can manage conference content, registrations, and view analytics.',
  [ADMIN_ROLES.FINANCE]: 'Can verify payments, send official receipts, and view registrations.',
  [ADMIN_ROLES.MEDIA]: 'Can update content, upload hero images and videos.',
  [ADMIN_ROLES.VOLUNTEER]: 'Limited access for check-in duties only.',
};

/**
 * Default permissions by admin role
 */
export const ADMIN_ROLE_PERMISSIONS = {
  [ADMIN_ROLES.SUPERADMIN]: {
    manageConference: true,
    manageSpeakers: true,
    manageSchedule: true,
    manageRegistrations: true,
    manageCheckIn: true,
    manageUsers: true,
    viewAnalytics: true,
    viewActivityLog: true,
    manageContent: true,
    manageFinance: true,
    manageWorkshops: true,
    manageInquiries: true,
  },
  [ADMIN_ROLES.ADMIN]: {
    manageConference: true,
    manageSpeakers: true,
    manageSchedule: true,
    manageRegistrations: true,
    manageCheckIn: true,
    manageUsers: true,
    viewAnalytics: true,
    viewActivityLog: true,
    manageContent: true,
    manageFinance: true,
    manageWorkshops: true,
    manageInquiries: true,
  },
  [ADMIN_ROLES.FINANCE]: {
    manageConference: false,
    manageSpeakers: false,
    manageSchedule: false,
    manageRegistrations: true,
    manageCheckIn: true,
    manageUsers: false,
    viewAnalytics: true,
    viewActivityLog: false,
    manageContent: false,
    manageFinance: true,
    manageWorkshops: false,
    manageInquiries: false,
  },
  [ADMIN_ROLES.MEDIA]: {
    manageConference: true,
    manageSpeakers: true,
    manageSchedule: false,
    manageRegistrations: false,
    manageCheckIn: false,
    manageUsers: false,
    viewAnalytics: false,
    viewActivityLog: false,
    manageContent: true,
    manageFinance: false,
    manageWorkshops: false,
    manageInquiries: false,
  },
  [ADMIN_ROLES.VOLUNTEER]: {
    manageConference: false,
    manageSpeakers: false,
    manageSchedule: false,
    manageRegistrations: false,
    manageCheckIn: true,
    manageUsers: false,
    viewAnalytics: false,
    viewActivityLog: false,
    manageContent: false,
    manageFinance: false,
    manageWorkshops: false,
    manageInquiries: false,
  },
};

/**
 * Admin navigation groups for sidebar
 * Each group contains a label, optional icon, and array of items
 */
export const ADMIN_NAV_GROUPS = [
  {
    id: 'main',
    label: 'Main',
    items: [
      { label: 'Dashboard', path: ADMIN_ROUTES.DASHBOARD, icon: 'dashboard' },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    items: [
      { label: 'Site', path: ADMIN_ROUTES.SETTINGS, icon: 'globe', requiresPermission: 'manageContent' },
      { label: 'Speakers', path: ADMIN_ROUTES.SPEAKERS, icon: 'mic', requiresPermission: 'manageSpeakers' },
      { label: 'Schedule', path: ADMIN_ROUTES.SCHEDULE, icon: 'calendar', requiresPermission: 'manageSchedule' },
      { label: 'Venue', path: ADMIN_ROUTES.VENUE, icon: 'location', requiresPermission: 'manageContent' },
      { label: 'FAQ', path: ADMIN_ROUTES.FAQ, icon: 'question', requiresPermission: 'manageContent' },
      { label: 'Downloads', path: ADMIN_ROUTES.DOWNLOADS, icon: 'download', requiresPermission: 'manageContent' },
      { label: 'About', path: ADMIN_ROUTES.ABOUT_CONTENT, icon: 'church', requiresPermission: 'manageContent' },
      { label: 'Legal', path: ADMIN_ROUTES.LEGAL, icon: 'document', requiresPermission: 'manageContent' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { label: 'Registrations', path: ADMIN_ROUTES.REGISTRATIONS, icon: 'people', requiresPermission: 'manageRegistrations' },
      { label: 'Workshops', path: ADMIN_ROUTES.WORKSHOPS, icon: 'hammer', requiresPermission: 'manageWorkshops' },
      { label: 'Check-In', path: ADMIN_ROUTES.CHECKIN, icon: 'checkin', requiresPermission: 'manageCheckIn' },
      { label: 'Check-In Monitor', path: ADMIN_ROUTES.CHECKIN_MONITOR, icon: 'monitor', requiresPermission: 'manageCheckIn' },
      { label: 'Inquiries', path: ADMIN_ROUTES.INQUIRIES, icon: 'mail', requiresPermission: 'manageInquiries' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { label: 'Finance Dashboard', path: ADMIN_ROUTES.FINANCE_DASHBOARD, icon: 'dollar', requiresPermission: 'manageFinance' },
      { label: 'Invoices', path: ADMIN_ROUTES.INVOICES, icon: 'document', requiresPermission: 'manageFinance' },
      { label: 'Bank Accounts', path: ADMIN_ROUTES.BANK_ACCOUNTS, icon: 'bank', requiresPermission: 'manageFinance' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { label: 'Users', path: ADMIN_ROUTES.USERS, icon: 'admin', requiresPermission: 'manageUsers' },
      { label: 'Activity Log', path: ADMIN_ROUTES.ACTIVITY, icon: 'history', requiresPermission: 'viewActivityLog' },
    ],
  },
];

/**
 * Flat list of admin navigation items (for backward compatibility)
 * @deprecated Use ADMIN_NAV_GROUPS instead
 */
export const ADMIN_NAV_ITEMS = ADMIN_NAV_GROUPS.flatMap((group) => group.items);

/**
 * Firestore collection names
 */
export const COLLECTIONS = {
  CONFERENCES: 'conferences',
  SPEAKERS: 'speakers',
  SESSIONS: 'sessions',
  REGISTRATIONS: 'registrations',
  FAQ: 'faq',
  CONTACT_INQUIRIES: 'contactInquiries',
  ADMINS: 'admins',
  ACTIVITY_LOGS: 'activityLogs',
  DOWNLOADS: 'downloads',
  VENUE_ROOMS: 'venueRooms',
  VENUE_TRANSPORT: 'venueTransport',
  VENUE_AMENITIES: 'venueAmenities',
  CHECK_IN_LOGS: 'checkInLogs',
  BANK_ACCOUNTS: 'bankAccounts',
  FOOD_MENU: 'foodMenu',
  WHAT_TO_BRING: 'whatToBring',
  STATS: 'stats',
  FEEDBACK: 'feedback',
};

/**
 * Stats document ID (singleton for conference stats)
 */
export const STATS_DOC_ID = 'conference-stats';

/**
 * Firebase Storage path constants
 * These paths must match the storage.rules configuration
 */
export const STORAGE_PATHS = {
  CONFERENCE_HERO_IMAGES: 'conference/hero-images',
  CONFERENCE_HERO_VIDEOS: 'conference/hero-videos',
  SPEAKER_PHOTOS: 'speakers/photos',
  DOWNLOAD_FILES: 'downloads/files',
  DOWNLOAD_THUMBNAILS: 'downloads/thumbnails',
  PAYMENT_PROOFS: 'registrations/payment-proofs',
  INVOICES: 'registrations/invoices',
};

/**
 * Allowed file types for uploads
 */
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  VIDEOS: ['video/mp4', 'video/webm', 'video/quicktime'],
  DOCUMENTS: ['application/pdf'],
  INVOICES: ['application/pdf', 'image/jpeg', 'image/png'],
};

/**
 * Maximum file sizes in bytes
 */
export const MAX_FILE_SIZES = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  DOCUMENT: 50 * 1024 * 1024, // 50MB
  THUMBNAIL: 2 * 1024 * 1024, // 2MB
};

/**
 * Recommended thumbnail dimensions in pixels
 * Optimized for book cover style display (portrait orientation)
 */
export const THUMBNAIL_DIMENSIONS = {
  WIDTH: 300,
  HEIGHT: 400,
};

/**
 * Conference configuration
 */
export const CONFERENCE = {
  YEAR: 2026,
  THEME: 'All In for Jesus and His Kingdom',
  TAGLINE: 'Intentional Disciple-Making Churches Conference',
  START_DATE: '2026-03-28T09:00:00+08:00',
  END_DATE: '2026-03-28T17:00:00+08:00',
  TIMEZONE: 'Asia/Manila',
};

/**
 * Venue information
 */
export const VENUE = {
  NAME: 'GCF South Metro',
  ADDRESS: 'Daang Hari Road, Versailles, Almanza Dos, Las Piñas City 1750 Philippines',
  MAP_URL: 'https://maps.google.com/?q=GCF+South+Metro+Las+Pinas',
  MAP_EMBED_URL:
    'https://www.google.com/maps?q=GCF+South+Metro,+Daang+Hari+Road,+Las+Piñas,+Philippines&output=embed',
};

/**
 * Pricing configuration
 * Default pricing tier with Early Bird, Member, and Regular rates
 */
export const PRICING_TIERS = [
  {
    id: 'standard',
    name: 'Standard',
    earlyBirdPrice: 350,
    memberPrice: 350,
    regularPrice: 500,
    startDate: '2025-01-01',
    endDate: '2026-03-28',
    isActive: true,
  },
];

/**
 * Navigation menu items
 */
export const NAV_ITEMS = [
  { label: 'Home', path: ROUTES.HOME, isAnchor: false },
  { label: 'Speakers', path: ROUTES.SPEAKERS, isAnchor: false },
  { label: 'Schedule', path: ROUTES.SCHEDULE, isAnchor: false },
  { label: 'Downloads', path: ROUTES.DOWNLOADS, isAnchor: false },
  { label: 'IDMC 2025', path: ROUTES.IDMC_2025, isAnchor: false },
  { label: 'Check Status', path: ROUTES.REGISTRATION_STATUS, isAnchor: false },
  { label: 'Register', path: ROUTES.REGISTER, isAnchor: false, isPrimary: true },
];

/**
 * Social media links
 */
export const SOCIAL_LINKS = {
  FACEBOOK: 'https://facebook.com/gcfsouthmetro',
  INSTAGRAM: 'https://instagram.com/gcfsouthmetro',
  YOUTUBE: 'https://youtube.com/channel/UCJ36YX23P_yCjMzetI1s6Ag',
  VIBER_NUMBER: '0917 650 0011',
};

/**
 * Contact information
 */
export const CONTACT = {
  EMAIL: 'email@gcfsouthmetro.org',
  ORGANIZER: 'GCF South Metro',
  WEBSITE: 'https://gcfsouthmetro.org',
  PHONE: '(02) 8478 1271 / (02) 8478 1273',
  MOBILE: '0917 650 0011',
};

/**
 * Breakpoints for responsive design (in pixels)
 */
export const BREAKPOINTS = {
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1280,
};

/**
 * CSS class name prefixes
 */
export const CSS_PREFIX = 'idmc';

/**
 * GCF South Metro branding assets
 */
export const BRANDING = {
  GCF_LOGO_URL: 'https://gcfsouthmetro.org/wp-content/uploads/2020/06/gcfsm-main-compressor.png',
};

/**
 * Organization information for GCF South Metro
 */
export const ORGANIZATION = {
  NAME: 'GCF South Metro',
  MISSION: 'To love God, to love people and to make multiplying disciples.',
  VISION:
    'To be a disciple-making congregation that reaches local communities while impacting the broader region and world.',
  DESCRIPTION:
    'GCF South Metro is a disciple-making church focused on three interconnected activities: drawing individuals toward Christ, developing their faith, and deploying them for ministry purposes.',
  HISTORY:
    'The Intentional Disciple-Making Churches (IDMC) Conference began as a vision to equip and mobilize churches across the Philippines for intentional discipleship. What started as a local initiative by GCF South Metro has grown into an annual gathering that brings together pastors, church leaders, and believers committed to the Great Commission. The conference serves as a catalyst for churches to return to their disciple-making roots, providing practical training and inspiration for effective ministry.',
  CORE_VALUES: [
    'Truth grounded in Scripture',
    'Love demonstrated in relationships',
    'Empowerment through the Holy Spirit',
    'Excellence through dedicated effort',
  ],
};

/**
 * Session types for conference schedule
 */
export const SESSION_TYPES = Object.freeze({
  PLENARY: 'plenary',
  WORKSHOP: 'workshop',
  BREAK: 'break',
  REGISTRATION: 'registration',
  WORSHIP: 'worship',
  LUNCH: 'lunch',
  OTHER: 'other',
});

/**
 * Session type labels for display
 */
export const SESSION_TYPE_LABELS = {
  [SESSION_TYPES.PLENARY]: 'Plenary',
  [SESSION_TYPES.WORKSHOP]: 'Workshop',
  [SESSION_TYPES.BREAK]: 'Break',
  [SESSION_TYPES.REGISTRATION]: 'Registration',
  [SESSION_TYPES.WORSHIP]: 'Worship',
  [SESSION_TYPES.LUNCH]: 'Lunch',
  [SESSION_TYPES.OTHER]: 'Other',
};

/**
 * Session type colors for styling
 * Maps session types to color values
 */
export const SESSION_TYPE_COLORS = {
  [SESSION_TYPES.PLENARY]: {
    background: '#dbeafe',
    border: '#3b82f6',
    text: '#1e40af',
  },
  [SESSION_TYPES.WORKSHOP]: {
    background: '#dcfce7',
    border: '#22c55e',
    text: '#166534',
  },
  [SESSION_TYPES.BREAK]: {
    background: '#f3f4f6',
    border: '#9ca3af',
    text: '#4b5563',
  },
  [SESSION_TYPES.REGISTRATION]: {
    background: '#e0f2fe',
    border: '#0ea5e9',
    text: '#0369a1',
  },
  [SESSION_TYPES.WORSHIP]: {
    background: '#f3e8ff',
    border: '#a855f7',
    text: '#7c3aed',
  },
  [SESSION_TYPES.LUNCH]: {
    background: '#ffedd5',
    border: '#f97316',
    text: '#c2410c',
  },
  [SESSION_TYPES.OTHER]: {
    background: '#f3f4f6',
    border: '#6b7280',
    text: '#374151',
  },
};

/**
 * Session status values
 */
export const SESSION_STATUS = {
  PUBLISHED: 'published',
  DRAFT: 'draft',
};

/**
 * Speaker status values for visibility control
 */
export const SPEAKER_STATUS = {
  PUBLISHED: 'published',
  DRAFT: 'draft',
};

/**
 * Workshop tracks for the conference
 */
export const WORKSHOP_TRACKS = [
  'Next Generation',
  'Women',
  'Men',
  'Couples',
  'Senior Citizens',
];

/**
 * Registration categories for attendee pricing
 */
export const REGISTRATION_CATEGORIES = {
  EARLY_BIRD: 'early_bird',
  MEMBER: 'member',
  REGULAR: 'regular',
};

/**
 * Registration category labels for display
 */
export const REGISTRATION_CATEGORY_LABELS = {
  [REGISTRATION_CATEGORIES.EARLY_BIRD]: 'Early Bird',
  [REGISTRATION_CATEGORIES.MEMBER]: 'Member',
  [REGISTRATION_CATEGORIES.REGULAR]: 'Regular',
};

/**
 * Registration category descriptions
 */
export const REGISTRATION_CATEGORY_DESCRIPTIONS = {
  [REGISTRATION_CATEGORIES.EARLY_BIRD]: 'Discounted rate for early registrants',
  [REGISTRATION_CATEGORIES.MEMBER]: 'Special rate for GCF members',
  [REGISTRATION_CATEGORIES.REGULAR]: 'Standard registration rate',
};

/**
 * Registration status values
 */
export const REGISTRATION_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PENDING_VERIFICATION: 'pending_verification',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  WAITLISTED: 'waitlisted',
  WAITLIST_OFFERED: 'waitlist_offered',
  WAITLIST_EXPIRED: 'waitlist_expired',
};

/**
 * Registration status labels for display
 */
export const REGISTRATION_STATUS_LABELS = {
  [REGISTRATION_STATUS.PENDING_PAYMENT]: 'Pending Payment',
  [REGISTRATION_STATUS.PENDING_VERIFICATION]: 'Pending Verification',
  [REGISTRATION_STATUS.CONFIRMED]: 'Confirmed',
  [REGISTRATION_STATUS.CANCELLED]: 'Cancelled',
  [REGISTRATION_STATUS.REFUNDED]: 'Refunded',
  [REGISTRATION_STATUS.WAITLISTED]: 'Waitlisted',
  [REGISTRATION_STATUS.WAITLIST_OFFERED]: 'Slot Available',
  [REGISTRATION_STATUS.WAITLIST_EXPIRED]: 'Offer Expired',
};

/**
 * Registration status colors for styling
 */
export const REGISTRATION_STATUS_COLORS = {
  [REGISTRATION_STATUS.PENDING_PAYMENT]: {
    background: '#fef3c7',
    border: '#f59e0b',
    text: '#92400e',
    badge: 'bg-yellow-100 text-yellow-800',
  },
  [REGISTRATION_STATUS.PENDING_VERIFICATION]: {
    background: '#e0f2fe',
    border: '#0ea5e9',
    text: '#0369a1',
    badge: 'bg-blue-100 text-blue-800',
  },
  [REGISTRATION_STATUS.CONFIRMED]: {
    background: '#dcfce7',
    border: '#22c55e',
    text: '#166534',
    badge: 'bg-green-100 text-green-800',
  },
  [REGISTRATION_STATUS.CANCELLED]: {
    background: '#fee2e2',
    border: '#ef4444',
    text: '#991b1b',
    badge: 'bg-red-100 text-red-800',
  },
  [REGISTRATION_STATUS.REFUNDED]: {
    background: '#f3f4f6',
    border: '#6b7280',
    text: '#374151',
    badge: 'bg-gray-100 text-gray-800',
  },
  [REGISTRATION_STATUS.WAITLISTED]: {
    background: '#f3e8ff',
    border: '#a855f7',
    text: '#7c3aed',
    badge: 'bg-purple-100 text-purple-800',
  },
  [REGISTRATION_STATUS.WAITLIST_OFFERED]: {
    background: '#dbeafe',
    border: '#3b82f6',
    text: '#1e40af',
    badge: 'bg-blue-100 text-blue-800',
  },
  [REGISTRATION_STATUS.WAITLIST_EXPIRED]: {
    background: '#f3f4f6',
    border: '#9ca3af',
    text: '#4b5563',
    badge: 'bg-gray-100 text-gray-600',
  },
};

/**
 * Waitlist payment deadline hours based on time until conference
 * Used to calculate dynamic payment deadlines for waitlist offers
 */
export const WAITLIST_DEADLINE_HOURS = {
  DEFAULT: 48,           // > 48 hours until conference
  LESS_THAN_48H: 24,     // 24-48 hours until conference
  LESS_THAN_24H: 12,     // 12-24 hours until conference
  LESS_THAN_12H: 6,      // < 12 hours until conference
};

/**
 * Payment methods
 */
export const PAYMENT_METHODS = {
  GCASH: 'gcash',
  PAYMAYA: 'paymaya',
  BANK_TRANSFER: 'bank_transfer',
  CASH: 'cash',
};

/**
 * Invoice status values for tracking invoice requests and delivery
 */
export const INVOICE_STATUS = {
  PENDING: 'pending',
  UPLOADED: 'uploaded',
  SENT: 'sent',
  FAILED: 'failed',
};

/**
 * Invoice status labels for display
 */
export const INVOICE_STATUS_LABELS = {
  [INVOICE_STATUS.PENDING]: 'Pending',
  [INVOICE_STATUS.UPLOADED]: 'Uploaded',
  [INVOICE_STATUS.SENT]: 'Sent',
  [INVOICE_STATUS.FAILED]: 'Failed',
};

/**
 * Bank names matching logo files in /public/images/banks/
 */
export const BANK_NAMES = Object.freeze({
  BDO: 'bdo',
  BPI: 'bpi',
  METROBANK: 'metrobank',
  UNIONBANK: 'unionbank',
  CHINABANK: 'chinabank',
  LANDBANK: 'landbank',
  PNB: 'pnb',
  RCBC: 'rcbc',
  SECURITYBANK: 'securitybank',
  PSBANK: 'psbank',
  EASTWEST: 'eastwest',
  GCASH: 'gcash',
  MAYA: 'maya',
  CIMB: 'cimb',
  TONIK: 'tonik',
  MARIBANK: 'maribank',
});

/**
 * Bank display labels
 */
export const BANK_LABELS = {
  [BANK_NAMES.BDO]: 'BDO (Banco de Oro)',
  [BANK_NAMES.BPI]: 'Bank of the Philippine Islands (BPI)',
  [BANK_NAMES.METROBANK]: 'Metrobank',
  [BANK_NAMES.UNIONBANK]: 'UnionBank',
  [BANK_NAMES.CHINABANK]: 'China Bank',
  [BANK_NAMES.LANDBANK]: 'Land Bank of the Philippines',
  [BANK_NAMES.PNB]: 'Philippine National Bank (PNB)',
  [BANK_NAMES.RCBC]: 'RCBC (Rizal Commercial Banking Corporation)',
  [BANK_NAMES.SECURITYBANK]: 'Security Bank',
  [BANK_NAMES.PSBANK]: 'PS Bank',
  [BANK_NAMES.EASTWEST]: 'EastWest Bank',
  [BANK_NAMES.GCASH]: 'GCash',
  [BANK_NAMES.MAYA]: 'Maya',
  [BANK_NAMES.CIMB]: 'CIMB Bank',
  [BANK_NAMES.TONIK]: 'Tonik Digital Bank',
  [BANK_NAMES.MARIBANK]: 'Mari Bank',
};

/**
 * Bank account types
 */
export const BANK_ACCOUNT_TYPES = Object.freeze({
  SAVINGS: 'savings',
  CHECKING: 'checking',
  EWALLET: 'ewallet',
});

/**
 * Bank account type labels
 */
export const BANK_ACCOUNT_TYPE_LABELS = {
  [BANK_ACCOUNT_TYPES.SAVINGS]: 'Savings Account',
  [BANK_ACCOUNT_TYPES.CHECKING]: 'Checking Account',
  [BANK_ACCOUNT_TYPES.EWALLET]: 'E-Wallet',
};

/**
 * Safe characters for registration short code generation.
 * Excludes confusing characters: 0/O, 1/l/I, 5/S, 2/Z, 8/B
 */
export const SAFE_SHORT_CODE_CHARS = 'ACDEFGHJKMNPQRTUVWXY34679';

/**
 * Length of the registration short code.
 * 6 characters provides ~244 million unique combinations (25^6).
 */
export const SHORT_CODE_LENGTH = 6;

/**
 * Length of the short code suffix used for quick lookups.
 * Users can search using just the last 4 characters of the 6-char code.
 */
export const SHORT_CODE_SUFFIX_LENGTH = 4;

/**
 * Payment information for registration
 */
export const PAYMENT_INFO = {
  GCASH: {
    NAME: 'GCF South Metro',
    NUMBER: '0917 650 0011',
  },
  PAYMAYA: {
    NAME: 'GCF South Metro',
    NUMBER: '0917 650 0011',
  },
  BANK: {
    NAME: 'GCF South Metro',
    BANK_NAME: 'BDO (Banco de Oro)',
    ACCOUNT_NUMBER: '0012-3456-7890',
    BRANCH: 'Las Piñas Branch',
  },
  CURRENCY: 'PHP',
  PAYMENT_DEADLINE_DAYS: 7,
  PAYMENT_REMINDER_MINUTES: 5,
};

/**
 * Registration form step identifiers
 */
export const REGISTRATION_STEPS = {
  PERSONAL_INFO: 1,
  TICKET_SELECTION: 2,
  PAYMENT_UPLOAD: 3,
  CONFIRMATION: 4,
};

/**
 * Registration form step labels
 */
export const REGISTRATION_STEP_LABELS = {
  [REGISTRATION_STEPS.PERSONAL_INFO]: 'Personal Info',
  [REGISTRATION_STEPS.TICKET_SELECTION]: 'Ticket',
  [REGISTRATION_STEPS.PAYMENT_UPLOAD]: 'Payment',
  [REGISTRATION_STEPS.CONFIRMATION]: 'Confirm',
};

/**
 * Ministry role options for registration
 */
export const MINISTRY_ROLES = [
  'Pastor',
  'Elder',
  'Deacon/Deaconess',
  'Ministry Leader',
  'Small Group Leader',
  'Worship Team',
  'Youth Leader',
  'Children\'s Ministry',
  'Member',
  'Visitor',
  'Other',
];

/**
 * Workshop category identifiers
 * Categories for GCF IDMC workshops
 */
export const WORKSHOP_CATEGORIES = Object.freeze({
  NEXT_GENERATION: 'next_generation',
  WOMEN: 'women',
  MEN: 'men',
  COUPLES: 'couples',
  SENIOR_CITIZENS: 'senior_citizens',
});

/**
 * Workshop category labels for display
 */
export const WORKSHOP_CATEGORY_LABELS = {
  [WORKSHOP_CATEGORIES.NEXT_GENERATION]: 'Next Generation',
  [WORKSHOP_CATEGORIES.WOMEN]: 'Women',
  [WORKSHOP_CATEGORIES.MEN]: 'Men',
  [WORKSHOP_CATEGORIES.COUPLES]: 'Couples',
  [WORKSHOP_CATEGORIES.SENIOR_CITIZENS]: 'Senior Citizens',
};

/**
 * Workshop category colors for styling
 */
export const WORKSHOP_CATEGORY_COLORS = {
  [WORKSHOP_CATEGORIES.NEXT_GENERATION]: {
    background: '#dbeafe',
    border: '#3b82f6',
    text: '#1e40af',
  },
  [WORKSHOP_CATEGORIES.WOMEN]: {
    background: '#fce7f3',
    border: '#ec4899',
    text: '#9d174d',
  },
  [WORKSHOP_CATEGORIES.MEN]: {
    background: '#e0f2fe',
    border: '#0ea5e9',
    text: '#0369a1',
  },
  [WORKSHOP_CATEGORIES.COUPLES]: {
    background: '#fef3c7',
    border: '#f59e0b',
    text: '#92400e',
  },
  [WORKSHOP_CATEGORIES.SENIOR_CITIZENS]: {
    background: '#dcfce7',
    border: '#22c55e',
    text: '#166534',
  },
};

/**
 * Workshop time slot identifiers for registration selection
 */
export const WORKSHOP_TIME_SLOTS = Object.freeze({
  DAY1_AFTERNOON: 'day1_afternoon',
});

/**
 * Conference schedule data (static fallback)
 * Based on IDMC 2026 schedule format - single day conference
 */
export const SCHEDULE = [
  {
    id: 'registration',
    time: '7:00 AM',
    endTime: '9:00 AM',
    title: 'Registration',
    sessionType: SESSION_TYPES.REGISTRATION,
    venue: '1st Floor Lobby',
    description: 'Check-in and receive conference materials',
    speakerIds: [],
    speakerNames: [],
    order: 1,
  },
  {
    id: 'worship-opening',
    time: '9:00 AM',
    endTime: '9:25 AM',
    title: 'Worship & Opening Prayer',
    sessionType: SESSION_TYPES.WORSHIP,
    venue: 'Worship Hall',
    description: 'Corporate worship and opening prayer',
    speakerIds: [],
    speakerNames: [],
    order: 2,
  },
  {
    id: 'plenary-1',
    time: '9:25 AM',
    endTime: '10:50 AM',
    title: 'Plenary Session 1',
    sessionType: SESSION_TYPES.PLENARY,
    venue: 'Worship Hall',
    description: 'First plenary session',
    speakerIds: ['lito-villoria'],
    speakerNames: ['Rev. Dr. Lito Villoria'],
    order: 3,
  },
  {
    id: 'plenary-2',
    time: '10:50 AM',
    endTime: '12:00 PM',
    title: 'Plenary Session 2',
    sessionType: SESSION_TYPES.PLENARY,
    venue: 'Worship Hall',
    description: 'Second plenary session',
    speakerIds: ['lito-villoria'],
    speakerNames: ['Rev. Dr. Lito Villoria'],
    order: 4,
  },
  {
    id: 'lunch',
    time: '12:00 PM',
    endTime: '1:15 PM',
    title: 'Lunch Break',
    sessionType: SESSION_TYPES.LUNCH,
    venue: 'Worship Hall',
    description: 'Fellowship and meal time',
    speakerIds: [],
    speakerNames: [],
    order: 5,
  },
  {
    id: 'workshop-nextgen',
    time: '1:15 PM',
    endTime: '3:00 PM',
    title: 'Workshop: Next Generation',
    sessionType: SESSION_TYPES.WORKSHOP,
    category: WORKSHOP_CATEGORIES.NEXT_GENERATION,
    venue: 'Worship Hall',
    description: 'Overcoming Pitfalls in the Discipleship of the Next Generation',
    track: 'Next Generation',
    capacity: 100,
    registeredCount: 0,
    timeSlot: WORKSHOP_TIME_SLOTS.DAY1_AFTERNOON,
    speakerIds: ['karen-monroy'],
    speakerNames: ['Teacher Karen Monroy'],
    order: 6,
  },
  {
    id: 'workshop-women',
    time: '1:15 PM',
    endTime: '3:00 PM',
    title: 'Workshop: Women',
    sessionType: SESSION_TYPES.WORKSHOP,
    category: WORKSHOP_CATEGORIES.WOMEN,
    venue: 'CDC',
    description: 'Overcoming Pitfalls in the Discipleship of Women',
    track: 'Women',
    capacity: 80,
    registeredCount: 0,
    timeSlot: WORKSHOP_TIME_SLOTS.DAY1_AFTERNOON,
    speakerIds: ['carol-felipe'],
    speakerNames: ['Teacher Carol Felipe'],
    order: 7,
  },
  {
    id: 'workshop-men',
    time: '1:15 PM',
    endTime: '3:00 PM',
    title: 'Workshop: Men',
    sessionType: SESSION_TYPES.WORKSHOP,
    category: WORKSHOP_CATEGORIES.MEN,
    venue: 'Youth Center',
    description: 'Overcoming Pitfalls in the Discipleship of Men',
    track: 'Men',
    capacity: 60,
    registeredCount: 0,
    timeSlot: WORKSHOP_TIME_SLOTS.DAY1_AFTERNOON,
    speakerIds: ['gilbert-bayang'],
    speakerNames: ['Elder Capt. Gilbert Bayang'],
    order: 8,
  },
  {
    id: 'workshop-seniors',
    time: '1:15 PM',
    endTime: '3:00 PM',
    title: 'Workshop: Senior Citizens',
    sessionType: SESSION_TYPES.WORKSHOP,
    category: WORKSHOP_CATEGORIES.SENIOR_CITIZENS,
    venue: 'Library',
    description: 'Overcoming Pitfalls in the Discipleship of Senior Citizens',
    track: 'Senior Citizens',
    capacity: 50,
    registeredCount: 0,
    timeSlot: WORKSHOP_TIME_SLOTS.DAY1_AFTERNOON,
    speakerIds: ['jun-marivic-parcon'],
    speakerNames: ['Capt. Jun & Marivic Parcon'],
    order: 9,
  },
  {
    id: 'workshop-couples',
    time: '1:15 PM',
    endTime: '3:00 PM',
    title: 'Workshop: Couples',
    sessionType: SESSION_TYPES.WORKSHOP,
    category: WORKSHOP_CATEGORIES.COUPLES,
    venue: '2nd Floor Lobby',
    description: 'Overcoming Pitfalls in the Discipleship of Couples',
    track: 'Couples',
    capacity: 60,
    registeredCount: 0,
    timeSlot: WORKSHOP_TIME_SLOTS.DAY1_AFTERNOON,
    speakerIds: ['edwin-ea-sindayen'],
    speakerNames: ['Deacon Edwin & Ea Sindayen'],
    order: 10,
  },
  {
    id: 'plenary-3',
    time: '3:15 PM',
    endTime: '4:35 PM',
    title: 'Plenary Session 3',
    sessionType: SESSION_TYPES.PLENARY,
    venue: 'Worship Hall',
    description: 'Third plenary session',
    speakerIds: ['lito-villoria'],
    speakerNames: ['Rev. Dr. Lito Villoria'],
    order: 11,
  },
  {
    id: 'worship-closing',
    time: '4:35 PM',
    endTime: '5:30 PM',
    title: 'Worship & Closing Prayer',
    sessionType: SESSION_TYPES.WORSHIP,
    venue: 'Worship Hall',
    description: 'Corporate worship and closing prayer',
    speakerIds: [],
    speakerNames: [],
    order: 12,
  },
];

/**
 * Workshop time slot labels
 * For single-day events, day prefix is omitted
 */
export const WORKSHOP_TIME_SLOT_LABELS = {
  [WORKSHOP_TIME_SLOTS.DAY1_AFTERNOON]: 'Afternoon (1:15 PM - 3:00 PM)',
};

/**
 * Default capacity value when not specified (unlimited)
 */
export const WORKSHOP_UNLIMITED_CAPACITY = -1;

/**
 * Speaker data for IDMC Conference
 * Based on GCFSM leadership and conference presenters
 */
export const SPEAKERS = [
  {
    id: 'lito-villoria',
    name: 'Rev. Dr. Lito Villoria',
    title: 'Senior Pastor',
    organization: 'GCF South Metro',
    sessionType: SESSION_TYPES.PLENARY,
    sessionTitle: 'Plenary Session',
    bio: 'Rev. Dr. Lito Villoria is the Senior Pastor of GCF South Metro (GCFSM). He also serves as the Executive Chairman of the National Disciple-making Campaign Committee under the Philippine Council of Evangelical Churches. This ten-year campaign (2023-2033) seeks to transform the nation by leading churches back to their disciple-making roots. He is also the President of the Conservative Baptist Association of the Philippines, a task force member of the World Evangelical Alliance\'s Galilean Movement, and the Country Director of the Asia Biblical Theological Seminary. Pastor Lito is deeply passionate about intentional disciple-making, particularly investing in the Next Generation.',
    photoUrl: null,
    featured: true,
    order: 1,
    status: SPEAKER_STATUS.PUBLISHED,
  },
  {
    id: 'karen-monroy',
    name: 'Teacher Karen Monroy',
    title: 'NextGen Ministry Director',
    organization: 'GCF South Metro',
    sessionType: SESSION_TYPES.WORKSHOP,
    sessionTitle: 'Overcoming Pitfalls in the Discipleship of the Next Generation',
    bio: 'Teacher Karen Monroy is passionate about the NextGen of the church—the children, youth, and young adults. Her desire is to bring them to Jesus so that, even at an early age, they will choose to obey Him until the end. She serves as the NextGen Ministry Director at GCF South Metro, where her main responsibility is to provide discipleship venues for the children, youth, and young adults of the church. T. Karen is a registered nurse who answered the Lord\'s call to serve Him full-time in the church. She is soon completing her Master of Divinity at Grace School of Theology.',
    photoUrl: null,
    featured: true,
    order: 2,
    status: SPEAKER_STATUS.PUBLISHED,
  },
  {
    id: 'carol-felipe',
    name: 'Teacher Carol Felipe',
    title: 'School Discipleship Ministry Director',
    organization: 'GCFSM Christian School',
    sessionType: SESSION_TYPES.WORKSHOP,
    sessionTitle: 'Overcoming Pitfalls in the Discipleship of Women',
    bio: 'Teacher Carol Felipe has been part of the GCF South Metro staff for the past 13 years. Her passion in life after Jesus is to teach and mentor women so that they may experience the fullness of joy that only comes from the Lord. Teacher Carol is the Cluster Mentor of the Bacoor Growth Groups and also serves as the School Discipleship Ministry Director for GCFSM Christian School. She is a graduate of Asian Theological Seminary, where she earned her Master of Divinity, Major in Biblical Studies.',
    photoUrl: null,
    featured: true,
    order: 3,
    status: SPEAKER_STATUS.PUBLISHED,
  },
  {
    id: 'gilbert-bayang',
    name: 'Elder Capt. Gilbert Bayang',
    title: 'Airline Captain & Elder',
    organization: 'Philippine Airlines / GCF South Metro',
    sessionType: SESSION_TYPES.WORKSHOP,
    sessionTitle: 'Overcoming Pitfalls in the Discipleship of Men',
    bio: 'Captain Gilbert Bayang is a pilot by profession. He flies the Airbus A321, works in the Philippine Airlines (PAL) Safety Department, and deals with Human Factors in Aviation. E. Kap, as he is fondly called in church, is a passionate student of God\'s Word and is nearing the completion of his theological degree at Grace School of Theology. He mentors fellow pilots, cabin crew, and their spouses, helping them share Jesus with their peers both at home and at work. E. Gilbert is married to Gina Pacis and is blessed with two adult children: Benjo, a licensed pilot, and Dorothy, a licensed occupational therapist.',
    photoUrl: null,
    featured: true,
    order: 4,
    status: SPEAKER_STATUS.PUBLISHED,
  },
  {
    id: 'jun-marivic-parcon',
    name: 'Capt. Jun & Marivic Parcon',
    title: 'Seasoned Citizens Ministry Leaders',
    organization: 'GCF South Metro',
    sessionType: SESSION_TYPES.WORKSHOP,
    sessionTitle: 'Overcoming Pitfalls in the Discipleship of Senior Citizens',
    bio: 'Captain Jun and Marivic Parcon are mentors of mentors, with three children: Summer, Leo, and Len. Known as Kuya Jun and Ate Marivic in church, they are dedicated choir members and they serve as leaders of the Seasoned Citizens\' ministry at GCF South Metro Church. As leaders, they are passionate about ensuring that every senior enjoys God\'s presence, love, and blessings, guiding them in their faith and life journey.',
    photoUrl: null,
    featured: true,
    order: 5,
    status: SPEAKER_STATUS.PUBLISHED,
  },
];

/**
 * Workshop data for IDMC Conference (static fallback)
 * Based on GCF South Metro workshop structure
 */
export const WORKSHOPS = [
  {
    id: 'workshop-next-generation',
    title: 'Overcoming Pitfalls in the Discipleship of the Next Generation',
    description: 'A workshop focused on effectively discipling children, youth, and young adults. Learn how to navigate common challenges and help the next generation choose to follow Jesus.',
    sessionType: SESSION_TYPES.WORKSHOP,
    category: WORKSHOP_CATEGORIES.NEXT_GENERATION,
    time: '1:15 PM',
    endTime: '3:00 PM',
    timeSlot: WORKSHOP_TIME_SLOTS.DAY1_AFTERNOON,
    venue: 'Worship Hall',
    capacity: 100,
    registeredCount: 0,
    speakerIds: ['karen-monroy'],
    speakerNames: ['Teacher Karen Monroy'],
    order: 1,
    status: SESSION_STATUS.PUBLISHED,
  },
  {
    id: 'workshop-women',
    title: 'Overcoming Pitfalls in the Discipleship of Women',
    description: 'A workshop designed to equip leaders in mentoring and discipling women. Discover how to help women experience the fullness of joy that comes from the Lord.',
    sessionType: SESSION_TYPES.WORKSHOP,
    category: WORKSHOP_CATEGORIES.WOMEN,
    time: '1:15 PM',
    endTime: '3:00 PM',
    timeSlot: WORKSHOP_TIME_SLOTS.DAY1_AFTERNOON,
    venue: 'CDC',
    capacity: 80,
    registeredCount: 0,
    speakerIds: ['carol-felipe'],
    speakerNames: ['Teacher Carol Felipe'],
    order: 2,
    status: SESSION_STATUS.PUBLISHED,
  },
  {
    id: 'workshop-men',
    title: 'Overcoming Pitfalls in the Discipleship of Men',
    description: 'A workshop for those who are passionate about discipling men. Learn practical strategies for mentoring men in their faith journey.',
    sessionType: SESSION_TYPES.WORKSHOP,
    category: WORKSHOP_CATEGORIES.MEN,
    time: '1:15 PM',
    endTime: '3:00 PM',
    timeSlot: WORKSHOP_TIME_SLOTS.DAY1_AFTERNOON,
    venue: 'Youth Center',
    capacity: 60,
    registeredCount: 0,
    speakerIds: ['gilbert-bayang'],
    speakerNames: ['Elder Capt. Gilbert Bayang'],
    order: 3,
    status: SESSION_STATUS.PUBLISHED,
  },
  {
    id: 'workshop-senior-citizens',
    title: 'Overcoming Pitfalls in the Discipleship of Senior Citizens',
    description: 'A workshop dedicated to ministering to seasoned citizens. Learn how to guide seniors in their faith and life journey while ensuring they enjoy God\'s presence, love, and blessings.',
    sessionType: SESSION_TYPES.WORKSHOP,
    category: WORKSHOP_CATEGORIES.SENIOR_CITIZENS,
    time: '1:15 PM',
    endTime: '3:00 PM',
    timeSlot: WORKSHOP_TIME_SLOTS.DAY1_AFTERNOON,
    venue: 'Library',
    capacity: 50,
    registeredCount: 0,
    speakerIds: ['jun-marivic-parcon'],
    speakerNames: ['Capt. Jun & Marivic Parcon'],
    order: 4,
    status: SESSION_STATUS.PUBLISHED,
  },
  {
    id: 'workshop-couples',
    title: 'Overcoming Pitfalls in the Discipleship of Couples',
    description: 'A workshop for those involved in couples ministry. Learn how to effectively disciple married couples and help them grow together in their faith journey.',
    sessionType: SESSION_TYPES.WORKSHOP,
    category: WORKSHOP_CATEGORIES.COUPLES,
    time: '1:15 PM',
    endTime: '3:00 PM',
    timeSlot: WORKSHOP_TIME_SLOTS.DAY1_AFTERNOON,
    venue: '2nd Floor Lobby',
    capacity: 60,
    registeredCount: 0,
    speakerIds: ['edwin-ea-sindayen'],
    speakerNames: ['Deacon Edwin & Ea Sindayen'],
    order: 5,
    status: SESSION_STATUS.PUBLISHED,
  },
];

/**
 * FAQ category identifiers
 */
export const FAQ_CATEGORIES = Object.freeze({
  REGISTRATION: 'registration',
  PAYMENT: 'payment',
  VENUE: 'venue',
  ACCOMMODATION: 'accommodation',
  GENERAL: 'general',
});

/**
 * FAQ category labels for display
 */
export const FAQ_CATEGORY_LABELS = {
  [FAQ_CATEGORIES.REGISTRATION]: 'Registration',
  [FAQ_CATEGORIES.PAYMENT]: 'Payment',
  [FAQ_CATEGORIES.VENUE]: 'Venue',
  [FAQ_CATEGORIES.ACCOMMODATION]: 'Accommodation',
  [FAQ_CATEGORIES.GENERAL]: 'General',
};

/**
 * FAQ status values
 */
export const FAQ_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
});

/**
 * Contact inquiry status values
 */
export const CONTACT_INQUIRY_STATUS = Object.freeze({
  NEW: 'new',
  READ: 'read',
  REPLIED: 'replied',
});

/**
 * User roles for access control
 * IDMC team roles have access to maintenance features
 */
export const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  MEDIA_TEAM: 'media_team',
  FINANCE_TEAM: 'finance_team',
  PARTICIPANT: 'participant',
});

/**
 * User role labels for display
 */
export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Admin',
  [USER_ROLES.MEDIA_TEAM]: 'Media Team',
  [USER_ROLES.FINANCE_TEAM]: 'Finance Team',
  [USER_ROLES.PARTICIPANT]: 'Participant',
};

/**
 * Roles that are part of the IDMC team and have access to maintenance features
 */
export const IDMC_TEAM_ROLES = [
  USER_ROLES.ADMIN,
  USER_ROLES.MEDIA_TEAM,
  USER_ROLES.FINANCE_TEAM,
];

/**
 * Downloads data for attendees
 * Materials that can be downloaded during or after the conference
 *
 * Note: downloadUrl and thumbnailUrl should be Firebase Storage URLs
 * Format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encoded-path}?alt=media
 * Or use Firebase Storage download URLs from the Firebase Console
 */
export const DOWNLOADS = [
  {
    id: 'idmc-2026-booklet',
    title: 'IDMC 2026 Conference Booklet',
    description: 'Complete conference program, schedule, speaker information, and session outlines.',
    fileName: 'IDMC-2026-Booklet.pdf',
    fileSize: '2.5 MB',
    fileType: 'PDF',
    category: 'booklet',
    // Replace with actual Firebase Storage URLs when available
    downloadUrl: '',
    thumbnailUrl: '',
    order: 1,
    isAvailable: false,
  },
];

/**
 * Download category identifiers
 */
export const DOWNLOAD_CATEGORIES = Object.freeze({
  BOOKLET: 'booklet',
  PRESENTATION: 'presentation',
  HANDOUT: 'handout',
  RESOURCE: 'resource',
});

/**
 * Download category labels for display
 */
export const DOWNLOAD_CATEGORY_LABELS = {
  [DOWNLOAD_CATEGORIES.BOOKLET]: 'Conference Booklet',
  [DOWNLOAD_CATEGORIES.PRESENTATION]: 'Presentations',
  [DOWNLOAD_CATEGORIES.HANDOUT]: 'Handouts',
  [DOWNLOAD_CATEGORIES.RESOURCE]: 'Resources',
};

/**
 * Download status values
 */
export const DOWNLOAD_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
});

/**
 * Food menu item status values
 */
export const FOOD_MENU_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
});

/**
 * What to bring item status values
 */
export const WHAT_TO_BRING_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
});

/**
 * FAQ seed data for testing and initial content
 */
export const FAQ_SEED_DATA = [
  {
    id: 'faq-registration-1',
    question: 'How do I register for IDMC 2026?',
    answer: 'You can register online through our website by clicking the "Register" button. Fill out the registration form with your personal information, select your ticket type, and complete the payment process.',
    category: FAQ_CATEGORIES.REGISTRATION,
    order: 1,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    id: 'faq-registration-2',
    question: 'Can I register on-site?',
    answer: 'Yes, on-site registration is available, but we highly recommend registering in advance to secure your spot and avoid long queues on the day of the event. On-site registration is subject to availability.',
    category: FAQ_CATEGORIES.REGISTRATION,
    order: 2,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    id: 'faq-registration-3',
    question: 'Can I transfer my registration to someone else?',
    answer: 'Registration transfers are allowed up to 7 days before the event. Please contact us via the Contact page with the details of the original registrant and the new attendee.',
    category: FAQ_CATEGORIES.REGISTRATION,
    order: 3,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    id: 'faq-payment-1',
    question: 'What payment methods are accepted?',
    answer: 'We accept GCash and bank transfers (BDO). Payment instructions will be provided after you complete the registration form. Please upload your proof of payment to confirm your registration.',
    category: FAQ_CATEGORIES.PAYMENT,
    order: 1,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    id: 'faq-payment-2',
    question: 'Is there a refund policy?',
    answer: 'Refunds are available up to 14 days before the event, minus a processing fee. Within 14 days of the event, registrations are non-refundable but may be transferred to another person. Contact us for more details.',
    category: FAQ_CATEGORIES.PAYMENT,
    order: 2,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    id: 'faq-payment-3',
    question: 'Are there student or senior citizen discounts?',
    answer: 'Yes! Students and senior citizens (60 years and above) receive discounted rates. Please select the appropriate category during registration and bring a valid ID for verification at the event.',
    category: FAQ_CATEGORIES.PAYMENT,
    order: 3,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    id: 'faq-venue-1',
    question: 'Where is the conference held?',
    answer: 'IDMC 2026 will be held at GCF South Metro, located at Daang Hari Road, Versailles, Almanza Dos, Las Piñas City 1750, Philippines. Visit our Venue page for detailed directions and a map.',
    category: FAQ_CATEGORIES.VENUE,
    order: 1,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    id: 'faq-venue-2',
    question: 'Is parking available?',
    answer: 'Yes, free parking is available at the venue on a first-come, first-served basis. We recommend arriving early to secure a parking spot, or consider using public transportation.',
    category: FAQ_CATEGORIES.VENUE,
    order: 2,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    id: 'faq-venue-3',
    question: 'How do I get to the venue by public transport?',
    answer: 'You can take a jeepney or bus to Daang Hari Road in Las Piñas. GCF South Metro is located in the Versailles Village area. Ride-sharing services like Grab are also readily available in the area.',
    category: FAQ_CATEGORIES.VENUE,
    order: 3,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    id: 'faq-accommodation-1',
    question: 'Are there hotel recommendations near the venue?',
    answer: 'Yes, there are several hotels in Las Piñas and nearby areas. Some options include hotels in Alabang and along the South Superhighway. We recommend booking early for better rates.',
    category: FAQ_CATEGORIES.ACCOMMODATION,
    order: 1,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    id: 'faq-accommodation-2',
    question: 'Does the registration include accommodation?',
    answer: 'No, the registration fee does not include accommodation. Attendees are responsible for their own lodging arrangements. Please check with nearby hotels for group rates if you are attending with a church group.',
    category: FAQ_CATEGORIES.ACCOMMODATION,
    order: 2,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    id: 'faq-general-1',
    question: 'What should I bring to the conference?',
    answer: 'Please bring your registration confirmation (printed or on your phone), a valid ID, a Bible, a notebook for taking notes, and any personal items you may need throughout the day.',
    category: FAQ_CATEGORIES.GENERAL,
    order: 1,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    id: 'faq-general-2',
    question: 'Is there a dress code?',
    answer: 'We recommend smart casual attire. The venue is air-conditioned, so you may want to bring a light jacket. Comfortable shoes are recommended as you may be moving between sessions.',
    category: FAQ_CATEGORIES.GENERAL,
    order: 2,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    id: 'faq-general-3',
    question: 'Will meals be provided?',
    answer: 'Lunch is included in your registration. Snacks and refreshments will also be available during breaks. Please let us know during registration if you have any dietary restrictions.',
    category: FAQ_CATEGORIES.GENERAL,
    order: 3,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    id: 'faq-general-4',
    question: 'Can I attend only specific sessions?',
    answer: 'The conference is designed as a full-day experience and we encourage attendees to participate in all sessions. However, you are free to choose which workshops to attend during the afternoon breakout sessions.',
    category: FAQ_CATEGORIES.GENERAL,
    order: 4,
    status: FAQ_STATUS.PUBLISHED,
  },
];
