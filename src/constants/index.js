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
  YEAR: 2025,
  THEME: 'All In For Jesus And His Kingdom',
  TAGLINE: 'Intentional Disciple-Making Churches Conference',
  START_DATE: '2025-09-05T09:00:00+08:00',
  END_DATE: '2025-09-06T17:00:00+08:00',
  TIMEZONE: 'Asia/Singapore',
};

/**
 * Venue information
 */
export const VENUE = {
  NAME: 'Singapore EXPO Hall 1',
  ADDRESS: '1 Expo Drive, Singapore 486150',
  MAP_URL: 'https://maps.google.com/?q=Singapore+EXPO+Hall+1',
  DIRECTIONS: {
    MRT: 'Expo MRT Station (Downtown Line / East-West Line)',
    BUS: 'Bus services 12, 24, 38',
    PARKING: 'Carpark available at $1.20/hour',
  },
};

/**
 * Pricing tiers configuration
 */
export const PRICING_TIERS = [
  {
    id: 'super-early-bird',
    name: 'Super Early Bird',
    regularPrice: 170,
    studentPrice: 120,
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    isActive: false,
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    regularPrice: 210,
    studentPrice: 150,
    startDate: '2025-04-01',
    endDate: '2025-06-30',
    isActive: false,
  },
  {
    id: 'regular',
    name: 'Regular',
    regularPrice: 290,
    studentPrice: 200,
    startDate: '2025-07-01',
    endDate: '2025-09-04',
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
  FACEBOOK: 'https://facebook.com/idmcsingapore',
  INSTAGRAM: 'https://instagram.com/idmcsingapore',
  YOUTUBE: 'https://youtube.com/@idmcsingapore',
};

/**
 * Contact information
 */
export const CONTACT = {
  EMAIL: 'info@idmc.sg',
  ORGANIZER: 'Covenant Evangelical Free Church',
  WEBSITE: 'https://cefc.org.sg',
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
