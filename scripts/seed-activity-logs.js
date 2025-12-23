/**
 * Seed Activity Logs
 * Populates the activity logs collection with sample data for testing
 */

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  Timestamp,
} = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Activity types
const ACTIVITY_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  REJECT: 'reject',
  CHECKIN: 'checkin',
  EXPORT: 'export',
  SETTINGS: 'settings',
};

// Entity types
const ENTITY_TYPES = {
  USER: 'user',
  REGISTRATION: 'registration',
  SPEAKER: 'speaker',
  SESSION: 'session',
  WORKSHOP: 'workshop',
  FAQ: 'faq',
  SETTINGS: 'settings',
  PRICING: 'pricing',
};

// Sample admin users
const SAMPLE_ADMINS = [
  { id: 'admin1', email: 'john.doe@example.com', name: 'John Doe' },
  { id: 'admin2', email: 'jane.smith@example.com', name: 'Jane Smith' },
  { id: 'admin3', email: 'bob.wilson@example.com', name: 'Bob Wilson' },
];

// Sample activity logs
const SAMPLE_ACTIVITIES = [
  // Login/Logout activities
  {
    type: ACTIVITY_TYPES.LOGIN,
    entityType: ENTITY_TYPES.USER,
    entityId: 'admin1',
    description: 'Admin user logged in',
    hoursAgo: 1,
  },
  {
    type: ACTIVITY_TYPES.LOGOUT,
    entityType: ENTITY_TYPES.USER,
    entityId: 'admin2',
    description: 'Admin user logged out',
    hoursAgo: 2,
  },

  // User management activities
  {
    type: ACTIVITY_TYPES.CREATE,
    entityType: ENTITY_TYPES.USER,
    entityId: 'admin4',
    description: 'Created admin user: sarah.jones@example.com with role admin',
    hoursAgo: 3,
  },
  {
    type: ACTIVITY_TYPES.UPDATE,
    entityType: ENTITY_TYPES.USER,
    entityId: 'admin5',
    description: 'Updated admin user: mike.brown@example.com (fields: role)',
    hoursAgo: 4,
  },
  {
    type: ACTIVITY_TYPES.APPROVE,
    entityType: ENTITY_TYPES.USER,
    entityId: 'admin6',
    description: 'Activated admin user: lisa.taylor@example.com',
    hoursAgo: 5,
  },

  // Speaker activities
  {
    type: ACTIVITY_TYPES.CREATE,
    entityType: ENTITY_TYPES.SPEAKER,
    entityId: 'speaker1',
    description: 'Created speaker: Pastor David Chen',
    hoursAgo: 6,
  },
  {
    type: ACTIVITY_TYPES.UPDATE,
    entityType: ENTITY_TYPES.SPEAKER,
    entityId: 'speaker2',
    description: 'Updated speaker: Rev. Maria Santos',
    hoursAgo: 7,
  },
  {
    type: ACTIVITY_TYPES.DELETE,
    entityType: ENTITY_TYPES.SPEAKER,
    entityId: 'speaker3',
    description: 'Deleted speaker: Dr. James Lee',
    hoursAgo: 8,
  },

  // Session activities
  {
    type: ACTIVITY_TYPES.CREATE,
    entityType: ENTITY_TYPES.SESSION,
    entityId: 'session1',
    description: 'Created session: Kingdom Multiplication Through Discipleship',
    hoursAgo: 9,
  },
  {
    type: ACTIVITY_TYPES.UPDATE,
    entityType: ENTITY_TYPES.SESSION,
    entityId: 'session2',
    description: 'Updated session: Empowering Leaders for Mission',
    hoursAgo: 10,
  },

  // FAQ activities
  {
    type: ACTIVITY_TYPES.CREATE,
    entityType: ENTITY_TYPES.FAQ,
    entityId: 'faq1',
    description: 'Created FAQ: What is the conference schedule?',
    hoursAgo: 11,
  },
  {
    type: ACTIVITY_TYPES.UPDATE,
    entityType: ENTITY_TYPES.FAQ,
    entityId: 'faq2',
    description: 'Updated FAQ: How do I register for the conference?',
    hoursAgo: 12,
  },
  {
    type: ACTIVITY_TYPES.DELETE,
    entityType: ENTITY_TYPES.FAQ,
    entityId: 'faq3',
    description: 'Deleted FAQ: Are meals included?',
    hoursAgo: 13,
  },

  // Registration activities
  {
    type: ACTIVITY_TYPES.APPROVE,
    entityType: ENTITY_TYPES.REGISTRATION,
    entityId: 'REG-2026-ABC123',
    description: 'Confirmed payment for registration: Juan Dela Cruz',
    hoursAgo: 14,
  },
  {
    type: ACTIVITY_TYPES.UPDATE,
    entityType: ENTITY_TYPES.REGISTRATION,
    entityId: 'REG-2026-DEF456',
    description: 'Updated registration status to confirmed: Maria Garcia',
    hoursAgo: 15,
  },
  {
    type: ACTIVITY_TYPES.REJECT,
    entityType: ENTITY_TYPES.REGISTRATION,
    entityId: 'REG-2026-GHI789',
    description: 'Cancelled registration: Pedro Santos',
    hoursAgo: 16,
  },

  // Check-in activities
  {
    type: ACTIVITY_TYPES.CHECKIN,
    entityType: ENTITY_TYPES.REGISTRATION,
    entityId: 'REG-2026-JKL012',
    description: 'Checked in 2 attendee(s): Ana Reyes',
    hoursAgo: 17,
  },
  {
    type: ACTIVITY_TYPES.CHECKIN,
    entityType: ENTITY_TYPES.REGISTRATION,
    entityId: 'REG-2026-MNO345',
    description: 'Checked in attendee: Carlos Ramos',
    hoursAgo: 18,
  },

  // Settings activities
  {
    type: ACTIVITY_TYPES.SETTINGS,
    entityType: ENTITY_TYPES.SETTINGS,
    entityId: 'conference-settings',
    description: 'Updated conference settings',
    hoursAgo: 19,
  },
  {
    type: ACTIVITY_TYPES.CREATE,
    entityType: ENTITY_TYPES.PRICING,
    entityId: 'pricing1',
    description: 'Created pricing tier: Early Bird',
    hoursAgo: 20,
  },
  {
    type: ACTIVITY_TYPES.UPDATE,
    entityType: ENTITY_TYPES.PRICING,
    entityId: 'pricing2',
    description: 'Updated pricing tier: Regular Rate',
    hoursAgo: 21,
  },

  // Export activities
  {
    type: ACTIVITY_TYPES.EXPORT,
    entityType: ENTITY_TYPES.REGISTRATION,
    entityId: 'export1',
    description: 'Exported registration data to CSV',
    hoursAgo: 22,
  },

  // More recent activities for variety
  {
    type: ACTIVITY_TYPES.LOGIN,
    entityType: ENTITY_TYPES.USER,
    entityId: 'admin2',
    description: 'Admin user logged in',
    hoursAgo: 0.5,
  },
  {
    type: ACTIVITY_TYPES.UPDATE,
    entityType: ENTITY_TYPES.SPEAKER,
    entityId: 'speaker4',
    description: 'Updated speaker: Rev. Grace Martinez',
    hoursAgo: 0.75,
  },
  {
    type: ACTIVITY_TYPES.CHECKIN,
    entityType: ENTITY_TYPES.REGISTRATION,
    entityId: 'REG-2026-PQR678',
    description: 'Checked in 3 attendee(s): Isabel Torres',
    hoursAgo: 1.25,
  },
];

/**
 * Clears all existing activity logs
 */
async function clearActivityLogs() {
  const logsRef = collection(db, 'activityLogs');
  const snapshot = await getDocs(logsRef);

  console.log(`Deleting ${snapshot.size} existing activity logs...`);

  const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletePromises);

  console.log('✓ Existing activity logs cleared');
}

/**
 * Creates an activity log entry
 */
async function createActivityLog(activity, admin) {
  const logsRef = collection(db, 'activityLogs');

  // Calculate timestamp based on hoursAgo
  const now = new Date();
  const createdAt = new Date(now.getTime() - activity.hoursAgo * 60 * 60 * 1000);

  const logData = {
    type: activity.type,
    entityType: activity.entityType,
    entityId: activity.entityId,
    description: activity.description,
    adminId: admin.id,
    adminEmail: admin.email,
    metadata: {},
    createdAt: Timestamp.fromDate(createdAt),
  };

  await addDoc(logsRef, logData);
}

/**
 * Seeds activity logs
 */
async function seedActivityLogs() {
  console.log('🌱 Seeding activity logs...');

  let count = 0;

  for (const activity of SAMPLE_ACTIVITIES) {
    // Randomly assign an admin to each activity
    const admin = SAMPLE_ADMINS[Math.floor(Math.random() * SAMPLE_ADMINS.length)];

    await createActivityLog(activity, admin);
    count++;

    if (count % 5 === 0) {
      console.log(`  Created ${count} activity logs...`);
    }
  }

  console.log(`✓ Created ${count} activity logs`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');

  try {
    if (shouldClear) {
      await clearActivityLogs();
      console.log('\n✅ Activity logs cleared successfully\n');
      process.exit(0);
    }

    await clearActivityLogs();
    await seedActivityLogs();

    console.log('\n✅ Activity logs seeded successfully\n');
    console.log('📊 Summary:');
    console.log(`   - Total activities: ${SAMPLE_ACTIVITIES.length}`);
    console.log(`   - Date range: Last 24 hours`);
    console.log(`   - Activity types: ${Object.keys(ACTIVITY_TYPES).length}`);
    console.log(`   - Entity types: ${Object.keys(ENTITY_TYPES).length}`);
    console.log('\n💡 View the Activity Log at: /admin/activity\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding activity logs:', error);
    process.exit(1);
  }
}

main();
