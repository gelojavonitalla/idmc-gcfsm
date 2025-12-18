/**
 * Floor Plan Room Data
 * Contains configuration for all rooms displayed in the interactive floor plan.
 * Supports multiple floors with configurable visibility.
 *
 * @module components/venue/floorPlanData
 */

/**
 * Room type identifiers for categorization and styling
 */
export const ROOM_TYPES = Object.freeze({
  MAIN: 'main',
  WORKSHOP: 'workshop',
  SERVICE: 'service',
  ADMIN: 'admin',
  UTILITY: 'utility',
});

/**
 * Room type display labels
 */
export const ROOM_TYPE_LABELS = {
  [ROOM_TYPES.MAIN]: 'Main Venue',
  [ROOM_TYPES.WORKSHOP]: 'Workshop Room',
  [ROOM_TYPES.SERVICE]: 'Service Area',
  [ROOM_TYPES.ADMIN]: 'Administration',
  [ROOM_TYPES.UTILITY]: 'Utility',
};

/**
 * Floor identifiers
 */
export const FLOORS = Object.freeze({
  GROUND: 'ground',
  SECOND: 'second',
  THIRD: 'third',
});

/**
 * Floor display labels
 */
export const FLOOR_LABELS = {
  [FLOORS.GROUND]: 'Ground Floor',
  [FLOORS.SECOND]: '2nd Floor',
  [FLOORS.THIRD]: '3rd Floor',
};

/**
 * Floor configuration with order and default visibility
 */
export const FLOOR_CONFIG = [
  {
    id: FLOORS.GROUND,
    label: 'Ground Floor',
    shortLabel: 'GF',
    order: 1,
    enabled: true,
    description: 'Main entrance, registration, and workshop rooms',
  },
  {
    id: FLOORS.SECOND,
    label: '2nd Floor',
    shortLabel: '2F',
    order: 2,
    enabled: true,
    description: 'Main worship hall and additional workshop rooms',
  },
  {
    id: FLOORS.THIRD,
    label: '3rd Floor',
    shortLabel: '3F',
    order: 3,
    enabled: false,
    description: 'Overflow space for large events',
  },
];

/**
 * Ground Floor room definitions with SVG coordinates
 * Based on actual GCF South Metro floor plan
 */
export const GROUND_FLOOR_ROOMS = [
  {
    id: 'cdc',
    name: 'CDC',
    fullName: 'Children Discipleship Center',
    type: ROOM_TYPES.WORKSHOP,
    floor: FLOORS.GROUND,
    capacity: 80,
    description: "Workshop venue for the Women's track. A space designed for mentoring and discipling women.",
    features: ['Projector', 'Sound System', 'Comfortable Seating', 'Air Conditioning'],
    sessionTypes: ['Workshop'],
    workshopTrack: 'Women',
    isEventRoom: true,
    coordinates: { x: 420, y: 380, width: 140, height: 100 },
  },
  {
    id: 'sen-gg-room',
    name: 'SEN/GG Room',
    fullName: 'Senior Citizens / Growth Group Room',
    type: ROOM_TYPES.WORKSHOP,
    floor: FLOORS.GROUND,
    capacity: 50,
    description: 'Workshop venue for the Senior Citizens track. Dedicated to ministering to seasoned citizens.',
    features: ['Projector', 'Sound System', 'Comfortable Seating', 'Air Conditioning', 'Easy Access'],
    sessionTypes: ['Workshop'],
    workshopTrack: 'Senior Citizens',
    isEventRoom: true,
    coordinates: { x: 420, y: 490, width: 140, height: 80 },
  },
  {
    id: 'youth-center',
    name: 'Youth Center',
    fullName: 'Youth Center',
    type: ROOM_TYPES.WORKSHOP,
    floor: FLOORS.GROUND,
    capacity: 60,
    description: 'Multi-purpose room that can be used for youth activities and overflow workshops.',
    features: ['Projector', 'Sound System', 'Flexible Seating', 'Air Conditioning'],
    sessionTypes: ['Workshop'],
    workshopTrack: null,
    isEventRoom: false,
    coordinates: { x: 570, y: 330, width: 100, height: 80 },
  },
  {
    id: 'library',
    name: 'Library',
    fullName: 'Library',
    type: ROOM_TYPES.WORKSHOP,
    floor: FLOORS.GROUND,
    capacity: 40,
    description: 'Quiet space that can be used for small group sessions or breakout discussions.',
    features: ['Projector', 'Whiteboard', 'Air Conditioning'],
    sessionTypes: ['Workshop', 'Breakout'],
    workshopTrack: null,
    isEventRoom: false,
    coordinates: { x: 540, y: 100, width: 100, height: 70 },
  },
  {
    id: 'cafeteria',
    name: 'Cafeteria',
    fullName: 'Cafeteria',
    type: ROOM_TYPES.SERVICE,
    floor: FLOORS.GROUND,
    capacity: 150,
    description: 'Main dining area for meals and refreshments during the event.',
    features: ['Tables', 'Kitchen Access', 'Air Conditioning'],
    sessionTypes: ['Meals', 'Fellowship'],
    workshopTrack: null,
    isEventRoom: true,
    coordinates: { x: 680, y: 420, width: 100, height: 160 },
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    fullName: 'Kitchen',
    type: ROOM_TYPES.SERVICE,
    floor: FLOORS.GROUND,
    capacity: 20,
    description: 'Food preparation area.',
    features: ['Cooking Equipment', 'Storage'],
    sessionTypes: [],
    workshopTrack: null,
    isEventRoom: false,
    coordinates: { x: 680, y: 330, width: 60, height: 80 },
  },
  {
    id: 'music-room',
    name: 'Music Room',
    fullName: 'Music Room',
    type: ROOM_TYPES.UTILITY,
    floor: FLOORS.GROUND,
    capacity: 30,
    description: 'Room for worship team preparation and practice.',
    features: ['Sound System', 'Instruments'],
    sessionTypes: [],
    workshopTrack: null,
    isEventRoom: false,
    coordinates: { x: 680, y: 220, width: 60, height: 100 },
  },
  {
    id: 'counseling-room',
    name: 'Counseling Room',
    fullName: 'Counseling Room',
    type: ROOM_TYPES.SERVICE,
    floor: FLOORS.GROUND,
    capacity: 10,
    description: 'Private space for counseling and prayer ministry.',
    features: ['Private', 'Air Conditioning'],
    sessionTypes: ['Counseling'],
    workshopTrack: null,
    isEventRoom: true,
    coordinates: { x: 140, y: 80, width: 80, height: 60 },
  },
  {
    id: 'registration-lobby',
    name: 'Main Lobby',
    fullName: 'Registration / Main Lobby',
    type: ROOM_TYPES.SERVICE,
    floor: FLOORS.GROUND,
    capacity: 100,
    description: 'Main entrance and registration area. Information desk and welcome team stationed here.',
    features: ['Registration Desk', 'Information Booth', 'Waiting Area', 'Ramp Access'],
    sessionTypes: ['Registration'],
    workshopTrack: null,
    isEventRoom: true,
    coordinates: { x: 140, y: 480, width: 120, height: 100 },
  },
];

/**
 * Second Floor room definitions
 */
export const SECOND_FLOOR_ROOMS = [
  {
    id: 'worship-hall',
    name: 'Worship Hall',
    fullName: 'Worship Hall',
    type: ROOM_TYPES.MAIN,
    floor: FLOORS.SECOND,
    capacity: 500,
    description: 'The main venue for plenary sessions, keynotes, and worship. Also hosts the Next Generation workshop track.',
    features: ['Stage', 'Sound System', 'Projector', 'Air Conditioning', 'Accessible Seating'],
    sessionTypes: ['Plenary', 'Worship', 'Keynote', 'Workshop'],
    workshopTrack: 'Next Generation',
    isEventRoom: true,
    coordinates: { x: 100, y: 100, width: 500, height: 250 },
  },
  {
    id: 'ydt',
    name: 'YDT',
    fullName: 'Youth Discipleship Training Room',
    type: ROOM_TYPES.WORKSHOP,
    floor: FLOORS.SECOND,
    capacity: 60,
    description: "Workshop venue for the Men's track. Focused on practical strategies for mentoring men in faith.",
    features: ['Projector', 'Sound System', 'Whiteboard', 'Air Conditioning'],
    sessionTypes: ['Workshop'],
    workshopTrack: 'Men',
    isEventRoom: true,
    coordinates: { x: 100, y: 380, width: 140, height: 100 },
  },
  {
    id: '2nd-floor-lobby',
    name: '2nd Floor Lobby',
    fullName: '2nd Floor Lobby',
    type: ROOM_TYPES.WORKSHOP,
    floor: FLOORS.SECOND,
    capacity: 60,
    description: 'Workshop venue for the Couples track. A space designed for couples ministry.',
    features: ['Projector', 'Sound System', 'Comfortable Seating', 'Air Conditioning'],
    sessionTypes: ['Workshop'],
    workshopTrack: 'Couples',
    isEventRoom: true,
    coordinates: { x: 260, y: 380, width: 140, height: 100 },
  },
];

/**
 * Third Floor room definitions (overflow)
 */
export const THIRD_FLOOR_ROOMS = [
  {
    id: '3rd-floor-hall',
    name: '3rd Floor Hall',
    fullName: '3rd Floor Multi-Purpose Hall',
    type: ROOM_TYPES.WORKSHOP,
    floor: FLOORS.THIRD,
    capacity: 200,
    description: 'Overflow space for large events when additional capacity is needed.',
    features: ['Projector', 'Sound System', 'Flexible Seating', 'Air Conditioning'],
    sessionTypes: ['Workshop', 'Overflow'],
    workshopTrack: null,
    isEventRoom: false,
    coordinates: { x: 100, y: 100, width: 400, height: 200 },
  },
];

/**
 * Combined floor plan rooms for backward compatibility
 */
export const FLOOR_PLAN_ROOMS = [
  ...GROUND_FLOOR_ROOMS,
  ...SECOND_FLOOR_ROOMS,
  ...THIRD_FLOOR_ROOMS,
];

/**
 * Get rooms by floor
 *
 * @param {string} floorId - Floor identifier from FLOORS
 * @returns {Array} Rooms on the specified floor
 */
export function getRoomsByFloor(floorId) {
  switch (floorId) {
    case FLOORS.GROUND:
      return GROUND_FLOOR_ROOMS;
    case FLOORS.SECOND:
      return SECOND_FLOOR_ROOMS;
    case FLOORS.THIRD:
      return THIRD_FLOOR_ROOMS;
    default:
      return [];
  }
}

/**
 * Get only event-related rooms (rooms used for IDMC conference)
 *
 * @param {string} [floorId] - Optional floor filter
 * @returns {Array} Event rooms
 */
export function getEventRooms(floorId = null) {
  const allRooms = floorId ? getRoomsByFloor(floorId) : FLOOR_PLAN_ROOMS;
  return allRooms.filter(room => room.isEventRoom);
}

/**
 * Gets a room by its ID
 *
 * @param {string} roomId - The room identifier
 * @returns {Object|undefined} The room object or undefined if not found
 */
export function getRoomById(roomId) {
  return FLOOR_PLAN_ROOMS.find(room => room.id === roomId);
}

/**
 * Gets all rooms of a specific type
 *
 * @param {string} type - The room type from ROOM_TYPES
 * @returns {Array} Array of rooms matching the type
 */
export function getRoomsByType(type) {
  return FLOOR_PLAN_ROOMS.filter(room => room.type === type);
}

/**
 * Get enabled floors based on configuration
 *
 * @returns {Array} Enabled floor configurations
 */
export function getEnabledFloors() {
  return FLOOR_CONFIG.filter(floor => floor.enabled);
}
