/**
 * Seed Venue Script
 * Populates Firestore with initial venue rooms, transportation, and amenities data.
 *
 * Usage:
 *   node scripts/seed-venue.js
 *
 * Prerequisites:
 *   - Firebase CLI installed and logged in
 *   - GOOGLE_APPLICATION_CREDENTIALS env var set to service account key path
 *     OR run with: firebase emulators:exec "node scripts/seed-venue.js"
 *
 * For local emulator:
 *   export FIRESTORE_EMULATOR_HOST="localhost:8080"
 *   node scripts/seed-venue.js
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Collection name constants
const COLLECTIONS = {
  VENUE_ROOMS: 'venueRooms',
  VENUE_TRANSPORT: 'venueTransport',
  VENUE_AMENITIES: 'venueAmenities',
};

// Firestore database ID (named database)
const DATABASE_ID = 'idmc-2026';

/**
 * Room type identifiers
 */
const ROOM_TYPES = {
  MAIN: 'main',
  WORKSHOP: 'workshop',
  SERVICE: 'service',
};

/**
 * Venue rooms seed data
 * Based on GCF South Metro floor plan
 */
const VENUE_ROOMS_DATA = [
  {
    roomId: 'worship-hall',
    name: 'Worship Hall',
    type: ROOM_TYPES.MAIN,
    floor: '2nd Floor',
    capacity: 800,
    description: 'The main venue for plenary sessions, keynotes, and worship. Features a large stage and seating for all conference attendees.',
    features: ['Stage', 'Sound System', 'Projector', 'Air Conditioning', 'Accessible Seating'],
    sessionTypes: ['Plenary', 'Worship', 'Keynote', 'Workshop'],
    workshopTrack: 'Next Generation',
    order: 1,
  },
  {
    roomId: 'youth-center',
    name: 'Youth Center',
    type: ROOM_TYPES.WORKSHOP,
    floor: 'Ground Floor',
    capacity: 100,
    description: "Workshop venue for the Men's track. Focused on practical strategies for mentoring men in faith.",
    features: ['Projector', 'Sound System', 'Whiteboard', 'Air Conditioning'],
    sessionTypes: ['Workshop'],
    workshopTrack: 'Men',
    order: 2,
  },
  {
    roomId: 'cdc',
    name: 'CDC',
    type: ROOM_TYPES.WORKSHOP,
    floor: 'Ground Floor',
    capacity: 80,
    description: "Workshop venue for the Women's track. A space designed for mentoring and discipling women.",
    features: ['Projector', 'Sound System', 'Comfortable Seating', 'Air Conditioning'],
    sessionTypes: ['Workshop'],
    workshopTrack: 'Women',
    order: 3,
  },
  {
    roomId: 'library',
    name: 'Library',
    type: ROOM_TYPES.WORKSHOP,
    floor: 'Ground Floor',
    capacity: 50,
    description: 'Workshop venue for the Senior Citizens track. Dedicated to ministering to seasoned citizens.',
    features: ['Projector', 'Sound System', 'Comfortable Seating', 'Air Conditioning', 'Easy Access'],
    sessionTypes: ['Workshop'],
    workshopTrack: 'Senior Citizens',
    order: 4,
  },
  {
    roomId: '2nd-floor-lobby',
    name: '2nd Floor Lobby',
    type: ROOM_TYPES.WORKSHOP,
    floor: 'Second Floor',
    capacity: 60,
    description: 'Workshop venue for the Couples track. A space designed for couples ministry.',
    features: ['Projector', 'Sound System', 'Comfortable Seating', 'Air Conditioning'],
    sessionTypes: ['Workshop'],
    workshopTrack: 'Couples',
    order: 5,
  },
  {
    roomId: 'ground-floor-lobby',
    name: 'Ground Floor Lobby',
    type: ROOM_TYPES.SERVICE,
    floor: 'Ground Floor',
    capacity: 100,
    description: 'The main entrance and registration area. Information desk and welcome team stationed here.',
    features: ['Registration Desk', 'Information Booth', 'Waiting Area'],
    sessionTypes: ['Registration'],
    workshopTrack: null,
    order: 6,
  },
];

/**
 * Transportation options seed data
 */
const VENUE_TRANSPORT_DATA = [
  {
    transportId: 'by-car',
    title: 'By Car',
    icon: 'car',
    items: [
      'Take Daang Hari Road towards Las Piñas',
      'Look for Versailles Village on your right',
      'GCF South Metro is located within the Versailles area',
      'Free parking available on-site (first-come, first-served)',
    ],
    order: 1,
  },
  {
    transportId: 'public-transport',
    title: 'By Public Transport',
    icon: 'bus',
    items: [
      'Take a jeepney or bus to Daang Hari Road, Las Piñas',
      'Alight at Versailles Village',
      'GCF South Metro is a short walk from the main road',
      'Ride-sharing (Grab) is also available in the area',
    ],
    order: 2,
  },
  {
    transportId: 'parking',
    title: 'Parking',
    icon: 'parking',
    items: [
      'Free parking available at the venue',
      'Additional parking at Versailles Town Plaza (500m away)',
      'Limited spots - arrive early to secure parking',
      'Carpooling with church groups is encouraged',
    ],
    order: 3,
  },
];

/**
 * Nearby amenities seed data
 */
const VENUE_AMENITIES_DATA = [
  {
    amenityId: 'restaurants',
    title: 'Restaurants & Cafes',
    description: 'Various dining options are available along Daang Hari Road, including fast food chains and local restaurants.',
    order: 1,
  },
  {
    amenityId: 'hotels',
    title: 'Hotels',
    description: 'Several hotels in Alabang and along the South Superhighway are within 15-20 minutes drive from the venue.',
    order: 2,
  },
  {
    amenityId: 'shopping',
    title: 'Shopping',
    description: 'Evia Lifestyle Center and other malls along Daang Hari are nearby for any last-minute needs.',
    order: 3,
  },
];

/**
 * Initialize Firebase Admin SDK
 * Will use emulator if FIRESTORE_EMULATOR_HOST is set
 */
function initializeFirebase() {
  // Check if already initialized
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Initialize with default credentials (will use emulator if env var is set)
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT || 'idmc-gcfsm-dev',
  });

  return admin.app();
}

/**
 * Seed venue rooms to Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function seedVenueRooms(db) {
  const roomsRef = db.collection(COLLECTIONS.VENUE_ROOMS);
  const now = admin.firestore.Timestamp.now();

  console.log(`\nSeeding ${VENUE_ROOMS_DATA.length} venue room(s)...`);

  for (const room of VENUE_ROOMS_DATA) {
    const docRef = roomsRef.doc(room.roomId);

    await docRef.set({
      name: room.name,
      type: room.type,
      floor: room.floor,
      capacity: room.capacity,
      description: room.description,
      features: room.features,
      sessionTypes: room.sessionTypes,
      workshopTrack: room.workshopTrack,
      order: room.order,
      createdAt: now,
      updatedAt: now,
      createdBy: 'seed-script',
    });

    console.log(`  - ${room.name} (${room.roomId})`);
    console.log(`    Type: ${room.type}, Floor: ${room.floor}, Capacity: ${room.capacity}`);
  }

  console.log(`\nSuccessfully seeded ${VENUE_ROOMS_DATA.length} venue room(s)!`);
}

/**
 * Seed transportation options to Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function seedVenueTransport(db) {
  const transportRef = db.collection(COLLECTIONS.VENUE_TRANSPORT);
  const now = admin.firestore.Timestamp.now();

  console.log(`\nSeeding ${VENUE_TRANSPORT_DATA.length} transportation option(s)...`);

  for (const transport of VENUE_TRANSPORT_DATA) {
    const docRef = transportRef.doc(transport.transportId);

    await docRef.set({
      title: transport.title,
      icon: transport.icon,
      items: transport.items,
      order: transport.order,
      createdAt: now,
      updatedAt: now,
      createdBy: 'seed-script',
    });

    console.log(`  - ${transport.title} (${transport.transportId})`);
    console.log(`    Items: ${transport.items.length} directions`);
  }

  console.log(`\nSuccessfully seeded ${VENUE_TRANSPORT_DATA.length} transportation option(s)!`);
}

/**
 * Seed nearby amenities to Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function seedVenueAmenities(db) {
  const amenitiesRef = db.collection(COLLECTIONS.VENUE_AMENITIES);
  const now = admin.firestore.Timestamp.now();

  console.log(`\nSeeding ${VENUE_AMENITIES_DATA.length} nearby amenity(ies)...`);

  for (const amenity of VENUE_AMENITIES_DATA) {
    const docRef = amenitiesRef.doc(amenity.amenityId);

    await docRef.set({
      title: amenity.title,
      description: amenity.description,
      order: amenity.order,
      createdAt: now,
      updatedAt: now,
      createdBy: 'seed-script',
    });

    console.log(`  - ${amenity.title} (${amenity.amenityId})`);
  }

  console.log(`\nSuccessfully seeded ${VENUE_AMENITIES_DATA.length} nearby amenity(ies)!`);
}

/**
 * Clear existing venue data (optional, for clean re-seed)
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function clearVenueData(db) {
  console.log('\nClearing existing venue data...');

  // Clear rooms
  const roomsSnapshot = await db.collection(COLLECTIONS.VENUE_ROOMS).get();
  if (!roomsSnapshot.empty) {
    const batch = db.batch();
    roomsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`  - Cleared ${roomsSnapshot.size} existing room(s).`);
  } else {
    console.log('  - No existing rooms to clear.');
  }

  // Clear transport
  const transportSnapshot = await db.collection(COLLECTIONS.VENUE_TRANSPORT).get();
  if (!transportSnapshot.empty) {
    const batch = db.batch();
    transportSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`  - Cleared ${transportSnapshot.size} existing transport option(s).`);
  } else {
    console.log('  - No existing transport options to clear.');
  }

  // Clear amenities
  const amenitiesSnapshot = await db.collection(COLLECTIONS.VENUE_AMENITIES).get();
  if (!amenitiesSnapshot.empty) {
    const batch = db.batch();
    amenitiesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`  - Cleared ${amenitiesSnapshot.size} existing amenity(ies).`);
  } else {
    console.log('  - No existing amenities to clear.');
  }
}

/**
 * Count existing venue data
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<Object>} Counts of existing data
 */
async function countExistingData(db) {
  const roomsSnapshot = await db.collection(COLLECTIONS.VENUE_ROOMS).get();
  const transportSnapshot = await db.collection(COLLECTIONS.VENUE_TRANSPORT).get();
  const amenitiesSnapshot = await db.collection(COLLECTIONS.VENUE_AMENITIES).get();

  return {
    rooms: roomsSnapshot.size,
    transport: transportSnapshot.size,
    amenities: amenitiesSnapshot.size,
  };
}

/**
 * Main function to run the seed script
 */
async function main() {
  console.log('='.repeat(50));
  console.log('IDMC Venue Seed Script');
  console.log('='.repeat(50));

  // Check for emulator and CI environment
  const isEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
  const isCI = !!process.env.CI || !!process.env.GITHUB_ACTIONS;
  console.log(`\nMode: ${isEmulator ? 'EMULATOR' : 'PRODUCTION'}`);
  console.log(`Environment: ${isCI ? 'CI/CD' : 'Local'}`);

  if (isEmulator) {
    console.log(`Emulator host: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  } else if (!isCI) {
    console.log('\n⚠️  WARNING: Running against PRODUCTION database!');
    console.log('Press Ctrl+C within 5 seconds to cancel...\n');
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  try {
    const app = initializeFirebase();
    // Use named database 'idmc-2026'
    const db = getFirestore(app, DATABASE_ID);
    console.log(`Database: ${DATABASE_ID}`);

    const shouldClear = process.argv.includes('--clear');
    const forceReseed = process.argv.includes('--force');

    // Check for existing data
    const counts = await countExistingData(db);
    const hasData = counts.rooms > 0 || counts.transport > 0 || counts.amenities > 0;

    if (hasData && !shouldClear && !forceReseed) {
      console.log('\n📋 Found existing venue data in database:');
      console.log(`   - Rooms: ${counts.rooms}`);
      console.log(`   - Transport options: ${counts.transport}`);
      console.log(`   - Amenities: ${counts.amenities}`);
      console.log('Skipping seed to preserve existing data.');
      console.log('Use --clear to replace or --force to add anyway.');
      console.log('\n✅ No changes made.');
      console.log('='.repeat(50));
      process.exit(0);
    }

    // Clear existing data if requested
    if (shouldClear) {
      await clearVenueData(db);
    }

    // Seed all venue data
    await seedVenueRooms(db);
    await seedVenueTransport(db);
    await seedVenueAmenities(db);

    console.log('\n✅ Venue seed completed successfully!');
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();
