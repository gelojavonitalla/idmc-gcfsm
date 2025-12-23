/**
 * Venue Service
 * Manages venue rooms, transportation, and amenities.
 *
 * @module services/venue
 */

import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS } from '../constants';

/**
 * Room type identifiers for categorization
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
 * Fetches all venue rooms
 *
 * @returns {Promise<Array>} Array of room objects
 */
export async function getVenueRooms() {
  try {
    const roomsRef = collection(db, COLLECTIONS.VENUE_ROOMS);
    const roomsQuery = query(roomsRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(roomsQuery);

    return snapshot.docs.map((roomDoc) => ({
      id: roomDoc.id,
      ...roomDoc.data(),
    }));
  } catch (error) {
    console.error('Failed to fetch venue rooms:', error);
    return [];
  }
}

/**
 * Gets a single venue room by ID
 *
 * @param {string} roomId - Room ID to fetch
 * @returns {Promise<Object|null>} Room object or null if not found
 */
export async function getVenueRoomById(roomId) {
  try {
    const roomRef = doc(db, COLLECTIONS.VENUE_ROOMS, roomId);
    const roomDoc = await getDoc(roomRef);

    if (roomDoc.exists()) {
      return {
        id: roomDoc.id,
        ...roomDoc.data(),
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch venue room:', error);
    return null;
  }
}

/**
 * Creates a new venue room
 *
 * @param {Object} roomData - Room data to create
 * @returns {Promise<Object>} Created room with ID
 */
export async function createVenueRoom(roomData) {
  try {
    const roomsRef = collection(db, COLLECTIONS.VENUE_ROOMS);

    const data = {
      name: roomData.name,
      type: roomData.type || ROOM_TYPES.WORKSHOP,
      floor: roomData.floor || '',
      capacity: Number(roomData.capacity) || 0,
      description: roomData.description || '',
      features: roomData.features || [],
      sessionTypes: roomData.sessionTypes || [],
      workshopTrack: roomData.workshopTrack || null,
      order: Number(roomData.order) || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(roomsRef, data);

    return {
      id: docRef.id,
      ...data,
    };
  } catch (error) {
    console.error('Failed to create venue room:', error);
    throw error;
  }
}

/**
 * Updates an existing venue room
 *
 * @param {string} roomId - Room ID to update
 * @param {Object} roomData - Updated room data
 * @returns {Promise<Object>} Updated room
 */
export async function updateVenueRoom(roomId, roomData) {
  try {
    const roomRef = doc(db, COLLECTIONS.VENUE_ROOMS, roomId);

    const updateData = {
      name: roomData.name,
      type: roomData.type,
      floor: roomData.floor || '',
      capacity: Number(roomData.capacity) || 0,
      description: roomData.description || '',
      features: roomData.features || [],
      sessionTypes: roomData.sessionTypes || [],
      workshopTrack: roomData.workshopTrack || null,
      order: Number(roomData.order) || 0,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(roomRef, updateData);

    return {
      id: roomId,
      ...updateData,
    };
  } catch (error) {
    console.error('Failed to update venue room:', error);
    throw error;
  }
}

/**
 * Deletes a venue room
 *
 * @param {string} roomId - Room ID to delete
 * @returns {Promise<void>}
 */
export async function deleteVenueRoom(roomId) {
  try {
    const roomRef = doc(db, COLLECTIONS.VENUE_ROOMS, roomId);
    await deleteDoc(roomRef);
  } catch (error) {
    console.error('Failed to delete venue room:', error);
    throw error;
  }
}

/**
 * Fetches all transportation options
 *
 * @returns {Promise<Array>} Array of transport options
 */
export async function getVenueTransport() {
  try {
    const transportRef = collection(db, COLLECTIONS.VENUE_TRANSPORT);
    const transportQuery = query(transportRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(transportQuery);

    return snapshot.docs.map((transportDoc) => ({
      id: transportDoc.id,
      ...transportDoc.data(),
    }));
  } catch (error) {
    console.error('Failed to fetch venue transport:', error);
    return [];
  }
}

/**
 * Creates a new transportation option
 *
 * @param {Object} transportData - Transport data to create
 * @returns {Promise<Object>} Created transport with ID
 */
export async function createVenueTransport(transportData) {
  try {
    const transportRef = collection(db, COLLECTIONS.VENUE_TRANSPORT);

    const data = {
      title: transportData.title,
      icon: transportData.icon || 'car',
      items: transportData.items || [],
      order: Number(transportData.order) || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(transportRef, data);

    return {
      id: docRef.id,
      ...data,
    };
  } catch (error) {
    console.error('Failed to create venue transport:', error);
    throw error;
  }
}

/**
 * Updates an existing transportation option
 *
 * @param {string} transportId - Transport ID to update
 * @param {Object} transportData - Updated transport data
 * @returns {Promise<Object>} Updated transport
 */
export async function updateVenueTransport(transportId, transportData) {
  try {
    const transportRef = doc(db, COLLECTIONS.VENUE_TRANSPORT, transportId);

    const updateData = {
      title: transportData.title,
      icon: transportData.icon || 'car',
      items: transportData.items || [],
      order: Number(transportData.order) || 0,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(transportRef, updateData);

    return {
      id: transportId,
      ...updateData,
    };
  } catch (error) {
    console.error('Failed to update venue transport:', error);
    throw error;
  }
}

/**
 * Deletes a transportation option
 *
 * @param {string} transportId - Transport ID to delete
 * @returns {Promise<void>}
 */
export async function deleteVenueTransport(transportId) {
  try {
    const transportRef = doc(db, COLLECTIONS.VENUE_TRANSPORT, transportId);
    await deleteDoc(transportRef);
  } catch (error) {
    console.error('Failed to delete venue transport:', error);
    throw error;
  }
}

/**
 * Fetches all nearby amenities
 *
 * @returns {Promise<Array>} Array of amenity objects
 */
export async function getVenueAmenities() {
  try {
    const amenitiesRef = collection(db, COLLECTIONS.VENUE_AMENITIES);
    const amenitiesQuery = query(amenitiesRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(amenitiesQuery);

    return snapshot.docs.map((amenityDoc) => ({
      id: amenityDoc.id,
      ...amenityDoc.data(),
    }));
  } catch (error) {
    console.error('Failed to fetch venue amenities:', error);
    return [];
  }
}

/**
 * Creates a new amenity
 *
 * @param {Object} amenityData - Amenity data to create
 * @returns {Promise<Object>} Created amenity with ID
 */
export async function createVenueAmenity(amenityData) {
  try {
    const amenitiesRef = collection(db, COLLECTIONS.VENUE_AMENITIES);

    const data = {
      title: amenityData.title,
      description: amenityData.description || '',
      order: Number(amenityData.order) || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(amenitiesRef, data);

    return {
      id: docRef.id,
      ...data,
    };
  } catch (error) {
    console.error('Failed to create venue amenity:', error);
    throw error;
  }
}

/**
 * Updates an existing amenity
 *
 * @param {string} amenityId - Amenity ID to update
 * @param {Object} amenityData - Updated amenity data
 * @returns {Promise<Object>} Updated amenity
 */
export async function updateVenueAmenity(amenityId, amenityData) {
  try {
    const amenityRef = doc(db, COLLECTIONS.VENUE_AMENITIES, amenityId);

    const updateData = {
      title: amenityData.title,
      description: amenityData.description || '',
      order: Number(amenityData.order) || 0,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(amenityRef, updateData);

    return {
      id: amenityId,
      ...updateData,
    };
  } catch (error) {
    console.error('Failed to update venue amenity:', error);
    throw error;
  }
}

/**
 * Deletes an amenity
 *
 * @param {string} amenityId - Amenity ID to delete
 * @returns {Promise<void>}
 */
export async function deleteVenueAmenity(amenityId) {
  try {
    const amenityRef = doc(db, COLLECTIONS.VENUE_AMENITIES, amenityId);
    await deleteDoc(amenityRef);
  } catch (error) {
    console.error('Failed to delete venue amenity:', error);
    throw error;
  }
}
