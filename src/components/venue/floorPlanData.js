/**
 * Floor Plan Room Data
 * Contains configuration for all rooms displayed in the interactive floor plan.
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
});

/**
 * Room type display labels
 */
export const ROOM_TYPE_LABELS = {
  [ROOM_TYPES.MAIN]: 'Main Venue',
  [ROOM_TYPES.WORKSHOP]: 'Workshop Room',
  [ROOM_TYPES.SERVICE]: 'Service Area',
};

/**
 * Floor plan room definitions
 * Each room contains metadata for display and integration with schedule data
 */
export const FLOOR_PLAN_ROOMS = [
  {
    id: 'worship-hall',
    name: 'Worship Hall',
    type: ROOM_TYPES.MAIN,
    floor: 'Ground Floor',
    capacity: 500,
    description: 'The main venue for plenary sessions, keynotes, and worship. Also hosts the Next Generation workshop track.',
    features: ['Stage', 'Sound System', 'Projector', 'Air Conditioning', 'Accessible Seating'],
    sessionTypes: ['Plenary', 'Worship', 'Keynote', 'Workshop'],
    workshopTrack: 'Next Generation',
  },
  {
    id: 'ydt',
    name: 'YDT',
    type: ROOM_TYPES.WORKSHOP,
    floor: 'Second Floor',
    capacity: 60,
    description: 'Workshop venue for the Men\'s track. Focused on practical strategies for mentoring men in faith.',
    features: ['Projector', 'Sound System', 'Whiteboard', 'Air Conditioning'],
    sessionTypes: ['Workshop'],
    workshopTrack: 'Men',
  },
  {
    id: 'cdc',
    name: 'CDC',
    type: ROOM_TYPES.WORKSHOP,
    floor: 'Second Floor',
    capacity: 80,
    description: 'Workshop venue for the Women\'s track. A space designed for mentoring and discipling women.',
    features: ['Projector', 'Sound System', 'Comfortable Seating', 'Air Conditioning'],
    sessionTypes: ['Workshop'],
    workshopTrack: 'Women',
  },
  {
    id: 'library',
    name: 'Library',
    type: ROOM_TYPES.WORKSHOP,
    floor: 'Second Floor',
    capacity: 50,
    description: 'Workshop venue for the Senior Citizens track. Dedicated to ministering to seasoned citizens.',
    features: ['Projector', 'Sound System', 'Comfortable Seating', 'Air Conditioning', 'Easy Access'],
    sessionTypes: ['Workshop'],
    workshopTrack: 'Senior Citizens',
  },
  {
    id: '2nd-floor-lobby',
    name: '2nd Floor Lobby',
    type: ROOM_TYPES.WORKSHOP,
    floor: 'Second Floor',
    capacity: 60,
    description: 'Workshop venue for the Couples track. A space designed for couples ministry.',
    features: ['Projector', 'Sound System', 'Comfortable Seating', 'Air Conditioning'],
    sessionTypes: ['Workshop'],
    workshopTrack: 'Couples',
  },
  {
    id: '1st-floor-lobby',
    name: '1st Floor Lobby',
    type: ROOM_TYPES.SERVICE,
    floor: 'Ground Floor',
    capacity: 100,
    description: 'The main entrance and registration area. Information desk and welcome team stationed here.',
    features: ['Registration Desk', 'Information Booth', 'Waiting Area'],
    sessionTypes: ['Registration'],
  },
];

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
 * Gets all rooms on a specific floor
 *
 * @param {string} floor - The floor name (e.g., 'Ground Floor', 'Second Floor')
 * @returns {Array} Array of rooms on the floor
 */
export function getRoomsByFloor(floor) {
  return FLOOR_PLAN_ROOMS.filter(room => room.floor === floor);
}
