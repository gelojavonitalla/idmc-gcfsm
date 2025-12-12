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
  THEME: 'All In For Jesus And His Kingdom',
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
 * Speaker session types
 */
export const SESSION_TYPES = {
  PLENARY: 'plenary',
  WORKSHOP: 'workshop',
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
 * Conference schedule data
 * Based on IDMC 2025 schedule format
 */
export const SCHEDULE = [
  {
    id: 'registration',
    time: '7:00 AM',
    title: 'Registration',
    type: 'general',
    description: 'Check-in and receive conference materials',
  },
  {
    id: 'worship-opening',
    time: '9:00 AM',
    title: 'Worship & Opening Prayer',
    type: 'worship',
    description: 'Corporate worship and opening prayer',
  },
  {
    id: 'plenary-1',
    time: '9:25 AM',
    title: 'Plenary Session 1',
    type: SESSION_TYPES.PLENARY,
    description: 'First plenary session',
  },
  {
    id: 'plenary-2',
    time: '10:50 AM',
    title: 'Plenary Session 2',
    type: SESSION_TYPES.PLENARY,
    description: 'Second plenary session',
  },
  {
    id: 'lunch',
    time: '12:00 PM',
    title: 'Lunch Break',
    type: 'break',
    description: 'Fellowship and meal time',
  },
  {
    id: 'workshops',
    time: '1:15 PM',
    title: 'Workshops',
    type: SESSION_TYPES.WORKSHOP,
    subtitle: 'Overcoming Discipleship Pitfalls in Every Generation',
    tracks: WORKSHOP_TRACKS,
    description: 'Breakout sessions by demographic focus',
  },
  {
    id: 'plenary-3',
    time: '3:15 PM',
    title: 'Plenary Session 3',
    type: SESSION_TYPES.PLENARY,
    description: 'Third plenary session',
  },
  {
    id: 'worship-closing',
    time: '4:35 PM',
    title: 'Worship & Closing Prayer',
    type: 'worship',
    description: 'Corporate worship and closing prayer',
  },
];

/**
 * Placeholder speaker data for Phase 3
 * These are temporary placeholders based on GCFSM leadership
 */
export const SPEAKERS = [
  {
    id: 'lito-villoria',
    name: 'Rev. Dr. Lito Villoria',
    title: 'Senior Pastor',
    organization: 'GCF South Metro',
    sessionType: SESSION_TYPES.PLENARY,
    sessionTitle: 'Plenary Session',
    bio: 'Rev. Dr. Lito Villoria is the Senior Pastor of GCF South Metro (GCFSM). He also serves as the Executive Chairman of the National Disciplemaking Campaign Committee under the Philippine Council of Evangelical Churches. This ten-year campaign (2023-2033) seeks to transform the nation by leading churches back to their disciplemaking roots. He is also the President of the Conservative Baptist Association of the Philippines, a task force member of the World Evangelical Alliance\'s Galilean Movement, and the Country Director of the Asia Biblical Theological Seminary. Pastor Lito is deeply passionate about intentional disciplemaking, particularly investing in the Next Generation.',
    featured: true,
    order: 1,
  },
  {
    id: 'karen-monroy',
    name: 'Teacher Karen Monroy',
    title: 'NextGen Ministry Director',
    organization: 'GCF South Metro',
    sessionType: SESSION_TYPES.WORKSHOP,
    sessionTitle: 'Overcoming Pitfalls in the Discipleship of the Next Generation',
    bio: 'Teacher Karen Monroy is passionate about the NextGen of the church—the children, youth, and young adults. Her desire is to bring them to Jesus so that, even at an early age, they will choose to obey Him until the end. She serves as the NextGen Ministry Director at GCF South Metro, where her main responsibility is to provide discipleship venues for the children, youth, and young adults of the church. T. Karen is a registered nurse who answered the Lord\'s call to serve Him full-time in the church. She is soon completing her Master of Divinity at Grace School of Theology.',
    featured: true,
    order: 2,
  },
  {
    id: 'carol-felipe',
    name: 'Teacher Carol Felipe',
    title: 'School Discipleship Ministry Director',
    organization: 'GCFSM Christian School',
    sessionType: SESSION_TYPES.WORKSHOP,
    sessionTitle: 'Overcoming Pitfalls in the Discipleship of Women',
    bio: 'Teacher Carol Felipe has been part of the GCF South Metro staff for the past 13 years. Her passion in life after Jesus is to teach and mentor women so that they may experience the fullness of joy that only comes from the Lord. Teacher Carol is the Cluster Mentor of the Bacoor Growth Groups and also serves as the School Discipleship Ministry Director for GCFSM Christian School. She is a graduate of Asian Theological Seminary, where she earned her Master of Divinity, Major in Biblical Studies.',
    featured: true,
    order: 3,
  },
  {
    id: 'gilbert-bayang',
    name: 'Elder Capt. Gilbert Bayang',
    title: 'Airline Captain & Elder',
    organization: 'Philippine Airlines / GCF South Metro',
    sessionType: SESSION_TYPES.WORKSHOP,
    sessionTitle: 'Overcoming Pitfalls in the Discipleship of Men',
    bio: 'Captain Gilbert Bayang is a pilot by profession. He flies the Airbus A321, works in the Philippine Airline\'s (PAL) Safety Department, and deals with Human Factors in Aviation. E. Kap, as he is fondly called in church, is a passionate student of God\'s Word and is nearing the completion of his theological degree at Grace School of Theology. He mentors fellow pilots, cabin crew, and their spouses, helping them share Jesus with their peers both at home and at work. E. Gilbert is married to Gina Pacis and is blessed with two adult children: Benjo, a licensed pilot, and Dorothy, a licensed occupational therapist.',
    featured: true,
    order: 4,
  },
  {
    id: 'jun-marivic-parcon',
    name: 'Capt. Jun & Marivic Parcon',
    title: 'Seasoned Citizens Ministry Leaders',
    organization: 'GCF South Metro',
    sessionType: SESSION_TYPES.WORKSHOP,
    sessionTitle: 'Overcoming Pitfalls in the Discipleship of Senior Citizens',
    bio: 'Captain Jun and Marivic Parcon are mentors of mentors, with three children: Summer, Leo, and Len. Known as Kuya Jun and Ate Marivic in church, they are dedicated choir members and they serve as leaders of the Seasoned Citizens\' ministry at GCF South Metro Church. As leaders, they are passionate about ensuring that every senior enjoys God\'s presence, love, and blessings, guiding them in their faith and life journey.',
    featured: true,
    order: 5,
  },
];
