/**
 * Downloads Service
 * Manages downloadable conference materials.
 *
 * @module services/downloads
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS, DOWNLOAD_STATUS, DOWNLOAD_CATEGORIES } from '../constants';

/**
 * Fetches all downloads ordered by display order
 *
 * @returns {Promise<Array>} Array of download objects
 */
export async function getAllDownloads() {
  try {
    const downloadsRef = collection(db, COLLECTIONS.DOWNLOADS);
    const downloadsQuery = query(downloadsRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(downloadsQuery);

    return snapshot.docs.map((downloadDoc) => ({
      id: downloadDoc.id,
      ...downloadDoc.data(),
    }));
  } catch (error) {
    console.error('Failed to fetch downloads:', error);
    return [];
  }
}

/**
 * Fetches only published downloads for public display
 *
 * @returns {Promise<Array>} Array of published download objects
 */
export async function getPublishedDownloads() {
  try {
    const downloads = await getAllDownloads();
    return downloads.filter((download) => download.status === DOWNLOAD_STATUS.PUBLISHED);
  } catch (error) {
    console.error('Failed to fetch published downloads:', error);
    return [];
  }
}

/**
 * Fetches a single download by ID
 *
 * @param {string} downloadId - Download ID
 * @returns {Promise<Object|null>} Download object or null if not found
 */
export async function getDownloadById(downloadId) {
  try {
    const downloadRef = doc(db, COLLECTIONS.DOWNLOADS, downloadId);
    const downloadDoc = await getDoc(downloadRef);

    if (downloadDoc.exists()) {
      return {
        id: downloadDoc.id,
        ...downloadDoc.data(),
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch download:', error);
    return null;
  }
}

/**
 * Creates or updates a download
 *
 * @param {string} downloadId - Download ID
 * @param {Object} downloadData - Download data
 * @returns {Promise<Object>} Saved download object
 */
export async function saveDownload(downloadId, downloadData) {
  try {
    const downloadRef = doc(db, COLLECTIONS.DOWNLOADS, downloadId);
    const existingDoc = await getDoc(downloadRef);

    const data = {
      title: downloadData.title,
      description: downloadData.description,
      fileName: downloadData.fileName || '',
      fileSize: downloadData.fileSize || '',
      fileType: downloadData.fileType || 'PDF',
      category: downloadData.category || DOWNLOAD_CATEGORIES.BOOKLET,
      downloadUrl: downloadData.downloadUrl || '',
      order: downloadData.order || 1,
      status: downloadData.status || DOWNLOAD_STATUS.DRAFT,
      updatedAt: serverTimestamp(),
    };

    if (existingDoc.exists()) {
      await updateDoc(downloadRef, data);
    } else {
      await setDoc(downloadRef, {
        ...data,
        createdAt: serverTimestamp(),
      });
    }

    return {
      id: downloadId,
      ...data,
    };
  } catch (error) {
    console.error('Failed to save download:', error);
    throw error;
  }
}

/**
 * Updates an existing download
 *
 * @param {string} downloadId - Download ID
 * @param {Object} updateData - Partial download data to update
 * @returns {Promise<Object>} Updated download object
 */
export async function updateDownload(downloadId, updateData) {
  try {
    const downloadRef = doc(db, COLLECTIONS.DOWNLOADS, downloadId);

    const data = {
      ...updateData,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(downloadRef, data);

    return {
      id: downloadId,
      ...data,
    };
  } catch (error) {
    console.error('Failed to update download:', error);
    throw error;
  }
}

/**
 * Deletes a download
 *
 * @param {string} downloadId - Download ID
 * @returns {Promise<void>}
 */
export async function deleteDownload(downloadId) {
  try {
    const downloadRef = doc(db, COLLECTIONS.DOWNLOADS, downloadId);
    await deleteDoc(downloadRef);
  } catch (error) {
    console.error('Failed to delete download:', error);
    throw error;
  }
}

/**
 * Formats file size in human-readable format
 *
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size (e.g., "2.5 MB")
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(1));

  return `${size} ${units[i]}`;
}
