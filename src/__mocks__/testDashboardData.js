/**
 * Test Mock Data for Dashboard Statistics and Charts
 *
 * This file contains mock data specifically for testing dashboard components.
 * DO NOT use this data in production - it is only for development and testing
 * to verify graphs and stats are rendering correctly.
 *
 * @module __mocks__/testDashboardData
 */

import { REGISTRATION_STATUS } from '../constants';

/**
 * Sample first names for generating mock registrations
 */
const FIRST_NAMES = [
  'Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlos', 'Elena',
  'Miguel', 'Sofia', 'Antonio', 'Isabella', 'Francisco', 'Gabriela',
  'Roberto', 'Carmen', 'Daniel', 'Lucia', 'Manuel', 'Patricia',
  'Ricardo', 'Teresa', 'Fernando', 'Angela', 'Luis', 'Beatriz',
  'Eduardo', 'Claudia', 'Andres', 'Diana', 'Rafael', 'Monica',
];

/**
 * Sample last names for generating mock registrations
 */
const LAST_NAMES = [
  'Santos', 'Reyes', 'Cruz', 'Garcia', 'Mendoza', 'Torres', 'Flores',
  'Rivera', 'Gonzales', 'Ramos', 'Bautista', 'Villanueva', 'De Leon',
  'Aquino', 'Castro', 'Morales', 'Lopez', 'Hernandez', 'Martinez',
  'Perez', 'Rodriguez', 'Sanchez', 'Ramirez', 'Dela Cruz', 'Pascual',
  'Soriano', 'Aguilar', 'Espino', 'Navarro', 'Valdez', 'Ocampo',
];

/**
 * Email domains for generating mock email addresses
 */
const EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
  'icloud.com', 'mail.com', 'proton.me',
];

/**
 * Generates a random integer between min and max (inclusive)
 *
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Picks a random element from an array
 *
 * @param {Array} array - Source array
 * @returns {*} Random element
 */
function randomPick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generates a mock email address
 *
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} Mock email address
 */
function generateEmail(firstName, lastName) {
  const domain = randomPick(EMAIL_DOMAINS);
  const separator = randomPick(['.', '_', '']);
  const suffix = randomInt(1, 99);
  return `${firstName.toLowerCase()}${separator}${lastName.toLowerCase()}${suffix}@${domain}`;
}

/**
 * Generates a random date within a range
 *
 * @param {number} daysAgo - Maximum days in the past
 * @returns {Date} Random date
 */
function randomDate(daysAgo) {
  const now = new Date();
  const pastDate = new Date(now.getTime() - randomInt(0, daysAgo) * 24 * 60 * 60 * 1000);
  pastDate.setHours(randomInt(6, 22), randomInt(0, 59), randomInt(0, 59));
  return pastDate;
}

/**
 * Generates a single mock registration
 *
 * @param {number} index - Registration index (for ID generation)
 * @param {Object} options - Generation options
 * @param {string} [options.status] - Force specific status
 * @param {Date} [options.createdAt] - Force specific date
 * @returns {Object} Mock registration object
 */
function generateMockRegistration(index, options = {}) {
  const firstName = randomPick(FIRST_NAMES);
  const lastName = randomPick(LAST_NAMES);
  const email = generateEmail(firstName, lastName);

  const statuses = [
    REGISTRATION_STATUS.CONFIRMED,
    REGISTRATION_STATUS.CONFIRMED,
    REGISTRATION_STATUS.CONFIRMED,
    REGISTRATION_STATUS.PENDING_VERIFICATION,
    REGISTRATION_STATUS.PENDING_PAYMENT,
    REGISTRATION_STATUS.CANCELLED,
  ];

  const status = options.status || randomPick(statuses);
  const isConfirmed = status === REGISTRATION_STATUS.CONFIRMED;
  const isPendingVerification = status === REGISTRATION_STATUS.PENDING_VERIFICATION;

  const pricingTiers = [1500, 2000, 2500, 3000];
  const totalAmount = randomPick(pricingTiers);

  return {
    id: `test-reg-${String(index).padStart(4, '0')}`,
    primaryAttendee: {
      firstName,
      lastName,
      email,
    },
    status,
    totalAmount: (isConfirmed || isPendingVerification) ? totalAmount : 0,
    checkedIn: isConfirmed ? Math.random() > 0.6 : false,
    createdAt: options.createdAt || randomDate(30),
  };
}

/**
 * Generates an array of mock registrations
 *
 * @param {number} count - Number of registrations to generate
 * @returns {Array} Array of mock registration objects
 */
export function generateMockRegistrations(count) {
  const registrations = [];
  for (let i = 0; i < count; i++) {
    registrations.push(generateMockRegistration(i + 1));
  }
  return registrations.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Calculates dashboard stats from mock registrations
 *
 * @param {Array} registrations - Array of registration objects
 * @returns {Object} Dashboard stats object
 */
export function calculateMockStats(registrations) {
  let totalRegistrations = 0;
  let confirmedRegistrations = 0;
  let pendingPayment = 0;
  let pendingVerification = 0;
  let totalRevenue = 0;
  let checkedIn = 0;

  registrations.forEach((reg) => {
    totalRegistrations++;

    switch (reg.status) {
      case REGISTRATION_STATUS.CONFIRMED:
        confirmedRegistrations++;
        totalRevenue += reg.totalAmount || 0;
        if (reg.checkedIn) {
          checkedIn++;
        }
        break;
      case REGISTRATION_STATUS.PENDING_PAYMENT:
        pendingPayment++;
        break;
      case REGISTRATION_STATUS.PENDING_VERIFICATION:
        pendingVerification++;
        totalRevenue += reg.totalAmount || 0;
        break;
      default:
        break;
    }
  });

  return {
    totalRegistrations,
    confirmedRegistrations,
    pendingPayment,
    pendingVerification,
    totalRevenue,
    checkedIn,
  };
}

/**
 * Generates chart data from mock registrations
 *
 * @param {Array} registrations - Array of registration objects
 * @param {number} [days=30] - Number of days to include
 * @returns {Array} Array of daily chart data points
 */
export function generateMockChartData(registrations, days = 30) {
  const dailyData = {};
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - (days - 1 - i));
    const dateKey = date.toISOString().split('T')[0];
    dailyData[dateKey] = { registrations: 0, revenue: 0 };
  }

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  registrations.forEach((reg) => {
    const createdAt = reg.createdAt instanceof Date ? reg.createdAt : new Date(reg.createdAt);
    if (createdAt >= startDate) {
      const dateKey = createdAt.toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].registrations++;
        if (
          reg.status === REGISTRATION_STATUS.CONFIRMED ||
          reg.status === REGISTRATION_STATUS.PENDING_VERIFICATION
        ) {
          dailyData[dateKey].revenue += reg.totalAmount || 0;
        }
      }
    }
  });

  return Object.entries(dailyData).map(([date, stats]) => ({
    date: new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    registrations: stats.registrations,
    revenue: stats.revenue,
  }));
}

// =============================================================================
// PRE-BUILT TEST SCENARIOS
// =============================================================================

/**
 * Scenario: Empty state - no registrations yet
 */
export const EMPTY_SCENARIO = {
  name: 'Empty State',
  description: 'No registrations - useful for testing empty states',
  stats: {
    totalRegistrations: 0,
    confirmedRegistrations: 0,
    pendingPayment: 0,
    pendingVerification: 0,
    totalRevenue: 0,
    checkedIn: 0,
  },
  registrations: [],
  chartData: Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      registrations: 0,
      revenue: 0,
    };
  }),
};

/**
 * Scenario: Low registration count - early stage
 */
export const LOW_REGISTRATIONS_SCENARIO = {
  name: 'Low Registrations',
  description: 'Early stage with few registrations (25 total)',
  stats: {
    totalRegistrations: 25,
    confirmedRegistrations: 12,
    pendingPayment: 8,
    pendingVerification: 3,
    totalRevenue: 30000,
    checkedIn: 0,
  },
  registrations: [
    {
      id: 'test-001',
      primaryAttendee: { firstName: 'Juan', lastName: 'Santos', email: 'juan.santos@gmail.com' },
      status: REGISTRATION_STATUS.CONFIRMED,
      totalAmount: 2000,
      checkedIn: false,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
      id: 'test-002',
      primaryAttendee: { firstName: 'Maria', lastName: 'Reyes', email: 'maria.reyes@yahoo.com' },
      status: REGISTRATION_STATUS.PENDING_VERIFICATION,
      totalAmount: 2000,
      checkedIn: false,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
    {
      id: 'test-003',
      primaryAttendee: { firstName: 'Pedro', lastName: 'Cruz', email: 'pedro.cruz@outlook.com' },
      status: REGISTRATION_STATUS.PENDING_PAYMENT,
      totalAmount: 0,
      checkedIn: false,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      id: 'test-004',
      primaryAttendee: { firstName: 'Ana', lastName: 'Garcia', email: 'ana.garcia@gmail.com' },
      status: REGISTRATION_STATUS.CONFIRMED,
      totalAmount: 2500,
      checkedIn: false,
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    },
    {
      id: 'test-005',
      primaryAttendee: { firstName: 'Carlos', lastName: 'Mendoza', email: 'carlos.m@hotmail.com' },
      status: REGISTRATION_STATUS.CONFIRMED,
      totalAmount: 2000,
      checkedIn: false,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  ],
  chartData: generateLowVolumeChartData(),
};

/**
 * Scenario: Medium registration count - active registration period
 */
export const MEDIUM_REGISTRATIONS_SCENARIO = {
  name: 'Medium Registrations',
  description: 'Active registration period (150 total)',
  stats: {
    totalRegistrations: 150,
    confirmedRegistrations: 95,
    pendingPayment: 35,
    pendingVerification: 15,
    totalRevenue: 220000,
    checkedIn: 0,
  },
  registrations: generateStaticRegistrations(10, 'medium'),
  chartData: generateMediumVolumeChartData(),
};

/**
 * Scenario: High registration count - near capacity
 */
export const HIGH_REGISTRATIONS_SCENARIO = {
  name: 'High Registrations',
  description: 'Near capacity with high registration count (450 total)',
  stats: {
    totalRegistrations: 450,
    confirmedRegistrations: 380,
    pendingPayment: 45,
    pendingVerification: 20,
    totalRevenue: 800000,
    checkedIn: 0,
  },
  registrations: generateStaticRegistrations(10, 'high'),
  chartData: generateHighVolumeChartData(),
};

/**
 * Scenario: Event day - check-in active
 */
export const EVENT_DAY_SCENARIO = {
  name: 'Event Day',
  description: 'Conference day with active check-ins (500 total, 320 checked in)',
  stats: {
    totalRegistrations: 500,
    confirmedRegistrations: 485,
    pendingPayment: 5,
    pendingVerification: 8,
    totalRevenue: 970000,
    checkedIn: 320,
  },
  registrations: generateStaticRegistrations(10, 'event-day'),
  chartData: generateEventDayChartData(),
};

/**
 * Scenario: Mixed statuses - various registration states
 */
export const MIXED_STATUS_SCENARIO = {
  name: 'Mixed Statuses',
  description: 'Various registration statuses including cancelled and refunded',
  stats: {
    totalRegistrations: 100,
    confirmedRegistrations: 50,
    pendingPayment: 20,
    pendingVerification: 10,
    totalRevenue: 120000,
    checkedIn: 15,
  },
  registrations: [
    {
      id: 'mix-001',
      primaryAttendee: { firstName: 'Elena', lastName: 'Torres', email: 'elena.torres@gmail.com' },
      status: REGISTRATION_STATUS.CONFIRMED,
      totalAmount: 2000,
      checkedIn: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: 'mix-002',
      primaryAttendee: { firstName: 'Roberto', lastName: 'Flores', email: 'roberto.f@yahoo.com' },
      status: REGISTRATION_STATUS.CANCELLED,
      totalAmount: 0,
      checkedIn: false,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
    {
      id: 'mix-003',
      primaryAttendee: { firstName: 'Sofia', lastName: 'Rivera', email: 'sofia.rivera@outlook.com' },
      status: REGISTRATION_STATUS.REFUNDED,
      totalAmount: 0,
      checkedIn: false,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
    {
      id: 'mix-004',
      primaryAttendee: { firstName: 'Miguel', lastName: 'Gonzales', email: 'miguel.g@gmail.com' },
      status: REGISTRATION_STATUS.PENDING_VERIFICATION,
      totalAmount: 2500,
      checkedIn: false,
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    },
    {
      id: 'mix-005',
      primaryAttendee: { firstName: 'Isabella', lastName: 'Ramos', email: 'isabella.r@hotmail.com' },
      status: REGISTRATION_STATUS.PENDING_PAYMENT,
      totalAmount: 0,
      checkedIn: false,
      createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
    },
    {
      id: 'mix-006',
      primaryAttendee: { firstName: 'Antonio', lastName: 'Bautista', email: 'antonio.b@gmail.com' },
      status: REGISTRATION_STATUS.CONFIRMED,
      totalAmount: 3000,
      checkedIn: true,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
    {
      id: 'mix-007',
      primaryAttendee: { firstName: 'Gabriela', lastName: 'Villanueva', email: 'gabi.v@yahoo.com' },
      status: REGISTRATION_STATUS.CONFIRMED,
      totalAmount: 2000,
      checkedIn: false,
      createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000),
    },
    {
      id: 'mix-008',
      primaryAttendee: { firstName: 'Francisco', lastName: 'De Leon', email: 'francisco.dl@outlook.com' },
      status: REGISTRATION_STATUS.CANCELLED,
      totalAmount: 0,
      checkedIn: false,
      createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
    },
    {
      id: 'mix-009',
      primaryAttendee: { firstName: 'Carmen', lastName: 'Aquino', email: 'carmen.a@gmail.com' },
      status: REGISTRATION_STATUS.PENDING_PAYMENT,
      totalAmount: 0,
      checkedIn: false,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      id: 'mix-010',
      primaryAttendee: { firstName: 'Daniel', lastName: 'Castro', email: 'daniel.castro@hotmail.com' },
      status: REGISTRATION_STATUS.CONFIRMED,
      totalAmount: 1500,
      checkedIn: true,
      createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
    },
  ],
  chartData: generateMixedStatusChartData(),
};

// =============================================================================
// HELPER FUNCTIONS FOR CHART DATA GENERATION
// =============================================================================

/**
 * Generates low volume chart data (early registration period)
 *
 * @returns {Array} Chart data array
 */
function generateLowVolumeChartData() {
  const data = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const registrations = i > 20 ? 0 : randomInt(0, 3);
    const revenue = registrations * randomPick([1500, 2000, 2500]);

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      registrations,
      revenue,
    });
  }

  return data;
}

/**
 * Generates medium volume chart data (active registration)
 *
 * @returns {Array} Chart data array
 */
function generateMediumVolumeChartData() {
  const data = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const baseRegistrations = 3 + Math.floor((29 - i) / 5);
    const registrations = baseRegistrations + randomInt(-2, 4);
    const revenue = registrations * randomPick([1500, 2000, 2500, 3000]);

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      registrations: Math.max(0, registrations),
      revenue,
    });
  }

  return data;
}

/**
 * Generates high volume chart data (near deadline rush)
 *
 * @returns {Array} Chart data array
 */
function generateHighVolumeChartData() {
  const data = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const baseRegistrations = 8 + Math.floor((29 - i) / 3);
    const spike = i < 7 ? randomInt(5, 15) : 0;
    const registrations = baseRegistrations + spike + randomInt(-3, 5);
    const revenue = registrations * randomPick([2000, 2500, 3000]);

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      registrations: Math.max(0, registrations),
      revenue,
    });
  }

  return data;
}

/**
 * Generates event day chart data (registration complete)
 *
 * @returns {Array} Chart data array
 */
function generateEventDayChartData() {
  const data = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    let registrations;
    if (i > 14) {
      registrations = randomInt(10, 25);
    } else if (i > 7) {
      registrations = randomInt(15, 35);
    } else if (i > 3) {
      registrations = randomInt(5, 15);
    } else {
      registrations = randomInt(0, 3);
    }

    const revenue = registrations * randomPick([2000, 2500, 3000]);

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      registrations,
      revenue,
    });
  }

  return data;
}

/**
 * Generates chart data with various patterns
 *
 * @returns {Array} Chart data array
 */
function generateMixedStatusChartData() {
  const data = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const weekday = date.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const baseRegistrations = isWeekend ? 2 : 5;
    const registrations = baseRegistrations + randomInt(-2, 4);
    const revenue = registrations * randomPick([1500, 2000, 2500]) * 0.7;

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      registrations: Math.max(0, registrations),
      revenue: Math.round(revenue),
    });
  }

  return data;
}

/**
 * Generates static registrations for a scenario
 *
 * @param {number} count - Number of registrations
 * @param {string} scenario - Scenario type
 * @returns {Array} Array of registration objects
 */
function generateStaticRegistrations(count, scenario) {
  const registrations = [];
  const names = [
    { first: 'Juan', last: 'Santos' },
    { first: 'Maria', last: 'Reyes' },
    { first: 'Pedro', last: 'Cruz' },
    { first: 'Ana', last: 'Garcia' },
    { first: 'Carlos', last: 'Mendoza' },
    { first: 'Elena', last: 'Torres' },
    { first: 'Roberto', last: 'Flores' },
    { first: 'Sofia', last: 'Rivera' },
    { first: 'Miguel', last: 'Gonzales' },
    { first: 'Isabella', last: 'Ramos' },
  ];

  const statusDistribution = {
    medium: [
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.PENDING_VERIFICATION,
      REGISTRATION_STATUS.PENDING_PAYMENT,
      REGISTRATION_STATUS.PENDING_PAYMENT,
      REGISTRATION_STATUS.PENDING_PAYMENT,
      REGISTRATION_STATUS.CANCELLED,
    ],
    high: [
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.PENDING_VERIFICATION,
      REGISTRATION_STATUS.PENDING_PAYMENT,
      REGISTRATION_STATUS.CONFIRMED,
    ],
    'event-day': [
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.PENDING_VERIFICATION,
      REGISTRATION_STATUS.CONFIRMED,
    ],
  };

  const statuses = statusDistribution[scenario] || statusDistribution.medium;
  const checkedInDistribution = scenario === 'event-day' ? 0.65 : 0;

  for (let i = 0; i < count; i++) {
    const name = names[i];
    const status = statuses[i];
    const isConfirmed = status === REGISTRATION_STATUS.CONFIRMED;
    const isPendingVerification = status === REGISTRATION_STATUS.PENDING_VERIFICATION;
    const totalAmount = (isConfirmed || isPendingVerification) ? randomPick([2000, 2500, 3000]) : 0;

    registrations.push({
      id: `${scenario}-${String(i + 1).padStart(3, '0')}`,
      primaryAttendee: {
        firstName: name.first,
        lastName: name.last,
        email: `${name.first.toLowerCase()}.${name.last.toLowerCase()}@gmail.com`,
      },
      status,
      totalAmount,
      checkedIn: isConfirmed && Math.random() < checkedInDistribution,
      createdAt: new Date(Date.now() - (i + 1) * 3 * 60 * 60 * 1000),
    });
  }

  return registrations;
}

// =============================================================================
// DEFAULT EXPORT - ALL SCENARIOS
// =============================================================================

/**
 * All available test scenarios
 */
export const TEST_SCENARIOS = {
  empty: EMPTY_SCENARIO,
  low: LOW_REGISTRATIONS_SCENARIO,
  medium: MEDIUM_REGISTRATIONS_SCENARIO,
  high: HIGH_REGISTRATIONS_SCENARIO,
  eventDay: EVENT_DAY_SCENARIO,
  mixed: MIXED_STATUS_SCENARIO,
};

/**
 * Default scenario for quick testing
 */
export const DEFAULT_TEST_DATA = MEDIUM_REGISTRATIONS_SCENARIO;

export default TEST_SCENARIOS;
