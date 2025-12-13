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
  FAQ: '/faq',
  ABOUT: '/about',
  VENUE: '/venue',
  PRIVACY: '/privacy',
  TERMS: '/terms',
};

/**
 * Firestore collection names
 */
export const COLLECTIONS = {
  CONFERENCES: 'conferences',
  SPEAKERS: 'speakers',
  SESSIONS: 'sessions',
  REGISTRATIONS: 'registrations',
  FAQ: 'faq',
  ADMINS: 'admins',
  ACTIVITY_LOGS: 'activityLogs',
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
 * Single pricing tier with Regular and Student/Senior rates
 */
export const PRICING_TIERS = [
  {
    id: 'standard',
    name: 'Standard',
    regularPrice: 500,
    studentPrice: 300,
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
  { label: 'FAQ', path: ROUTES.FAQ, isAnchor: false },
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
 * Organization information for GCF South Metro
 */
export const ORGANIZATION = {
  NAME: 'GCF South Metro',
  MISSION: 'To love God, to love people and to make multiplying disciples.',
  VISION:
    'To be a disciple-making congregation that reaches local communities while impacting the broader region and world.',
  DESCRIPTION:
    'GCF South Metro is a disciple-making church focused on three interconnected activities: drawing individuals toward Christ, developing their faith, and deploying them for ministry purposes.',
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
  REGULAR: 'regular',
  STUDENT_SENIOR: 'student_senior',
};

/**
 * Registration category labels for display
 */
export const REGISTRATION_CATEGORY_LABELS = {
  [REGISTRATION_CATEGORIES.REGULAR]: 'Regular',
  [REGISTRATION_CATEGORIES.STUDENT_SENIOR]: 'Student / Senior Citizen',
};

/**
 * Registration category descriptions
 */
export const REGISTRATION_CATEGORY_DESCRIPTIONS = {
  [REGISTRATION_CATEGORIES.REGULAR]: 'For working professionals and general attendees',
  [REGISTRATION_CATEGORIES.STUDENT_SENIOR]: 'For students with valid ID and senior citizens (60+)',
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
};

/**
 * Payment methods
 */
export const PAYMENT_METHODS = {
  GCASH: 'gcash',
  BANK_TRANSFER: 'bank_transfer',
  CASH: 'cash',
};

/**
 * Payment information for registration
 */
export const PAYMENT_INFO = {
  GCASH: {
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
    venue: 'Main Lobby',
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
    venue: 'Main Hall',
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
    venue: 'Main Hall',
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
    venue: 'Main Hall',
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
    venue: 'Fellowship Hall',
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
    venue: 'Room A',
    description: 'Overcoming Pitfalls in the Discipleship of the Next Generation',
    track: 'Next Generation',
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
    venue: 'Room B',
    description: 'Overcoming Pitfalls in the Discipleship of Women',
    track: 'Women',
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
    venue: 'Room C',
    description: 'Overcoming Pitfalls in the Discipleship of Men',
    track: 'Men',
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
    venue: 'Room D',
    description: 'Overcoming Pitfalls in the Discipleship of Senior Citizens',
    track: 'Senior Citizens',
    speakerIds: ['jun-marivic-parcon'],
    speakerNames: ['Capt. Jun & Marivic Parcon'],
    order: 9,
  },
  {
    id: 'plenary-3',
    time: '3:15 PM',
    endTime: '4:35 PM',
    title: 'Plenary Session 3',
    sessionType: SESSION_TYPES.PLENARY,
    venue: 'Main Hall',
    description: 'Third plenary session',
    speakerIds: ['lito-villoria'],
    speakerNames: ['Rev. Dr. Lito Villoria'],
    order: 10,
  },
  {
    id: 'worship-closing',
    time: '4:35 PM',
    endTime: '5:30 PM',
    title: 'Worship & Closing Prayer',
    sessionType: SESSION_TYPES.WORSHIP,
    venue: 'Main Hall',
    description: 'Corporate worship and closing prayer',
    speakerIds: [],
    speakerNames: [],
    order: 11,
  },
];

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
