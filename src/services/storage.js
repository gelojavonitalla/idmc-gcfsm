/**
 * Storage Service
 * Handles file uploads to Firebase Storage for the IDMC Conference.
 *
 * @module services/storage
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '../lib/firebase';
import {
  STORAGE_PATHS,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZES,
  THUMBNAIL_DIMENSIONS,
} from '../constants';

/**
 * File type mapping for human-readable names
 */
const FILE_TYPE_NAMES = {
  image: 'JPEG, PNG, GIF, or WebP',
  video: 'MP4, WebM, or QuickTime',
  document: 'PDF',
  thumbnail: 'JPEG, PNG, GIF, or WebP',
};

/**
 * Generates a unique filename with timestamp
 *
 * @param {string} originalName - Original file name
 * @returns {string} Unique filename with timestamp
 */
function generateUniqueFilename(originalName) {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '-');
  return `${baseName}-${timestamp}.${extension}`;
}

/**
 * Gets allowed file types based on type string
 *
 * @param {string} type - Type of file ('image', 'video', 'document', or 'thumbnail')
 * @returns {string[]} Array of allowed MIME types
 */
function getAllowedTypes(type) {
  switch (type) {
    case 'video':
      return ALLOWED_FILE_TYPES.VIDEOS;
    case 'document':
      return ALLOWED_FILE_TYPES.DOCUMENTS;
    case 'thumbnail':
      return ALLOWED_FILE_TYPES.IMAGES;
    case 'image':
    default:
      return ALLOWED_FILE_TYPES.IMAGES;
  }
}

/**
 * Gets maximum file size based on type string
 *
 * @param {string} type - Type of file ('image', 'video', 'document', or 'thumbnail')
 * @returns {number} Maximum file size in bytes
 */
function getMaxSize(type) {
  switch (type) {
    case 'video':
      return MAX_FILE_SIZES.VIDEO;
    case 'document':
      return MAX_FILE_SIZES.DOCUMENT;
    case 'thumbnail':
      return MAX_FILE_SIZES.THUMBNAIL;
    case 'image':
    default:
      return MAX_FILE_SIZES.IMAGE;
  }
}

/**
 * Validates a file before upload
 *
 * @param {File} file - File to validate
 * @param {string} type - Type of file ('image', 'video', or 'document')
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
export function validateFile(file, type) {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  const allowedTypes = getAllowedTypes(type);
  const maxSize = getMaxSize(type);

  if (!allowedTypes.includes(file.type)) {
    const typeNames = FILE_TYPE_NAMES[type] || FILE_TYPE_NAMES.image;
    return { valid: false, error: `Invalid file type. Please upload ${typeNames} files.` };
  }

  if (file.size > maxSize) {
    const maxMB = maxSize / (1024 * 1024);
    return { valid: false, error: `File too large. Maximum size is ${maxMB}MB.` };
  }

  return { valid: true };
}

/**
 * Uploads a hero image for the conference
 *
 * @param {File} file - Image file to upload
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<string>} Download URL of uploaded image
 */
export async function uploadHeroImage(file, onProgress) {
  const validation = validateFile(file, 'image');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const filename = generateUniqueFilename(file.name);
  const storagePath = `${STORAGE_PATHS.CONFERENCE_HERO_IMAGES}/${filename}`;
  const storageRef = ref(storage, storagePath);

  return uploadFile(storageRef, file, onProgress);
}

/**
 * Uploads a hero video for the conference
 *
 * @param {File} file - Video file to upload
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<string>} Download URL of uploaded video
 */
export async function uploadHeroVideo(file, onProgress) {
  const validation = validateFile(file, 'video');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const filename = generateUniqueFilename(file.name);
  const storagePath = `${STORAGE_PATHS.CONFERENCE_HERO_VIDEOS}/${filename}`;
  const storageRef = ref(storage, storagePath);

  return uploadFile(storageRef, file, onProgress);
}

/**
 * Uploads a speaker photo
 *
 * @param {File} file - Image file to upload
 * @param {string} speakerId - Speaker ID for organizing the file
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<string>} Download URL of uploaded photo
 */
export async function uploadSpeakerPhoto(file, speakerId, onProgress) {
  const validation = validateFile(file, 'image');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (!speakerId) {
    throw new Error('Speaker ID is required for photo upload');
  }

  const filename = generateUniqueFilename(file.name);
  const storagePath = `${STORAGE_PATHS.SPEAKER_PHOTOS}/${speakerId}/${filename}`;
  const storageRef = ref(storage, storagePath);

  return uploadFile(storageRef, file, onProgress);
}

/**
 * Uploads a download file (PDF document)
 *
 * @param {File} file - Document file to upload
 * @param {string} downloadId - Download ID for organizing the file
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<string>} Download URL of uploaded file
 */
export async function uploadDownloadFile(file, downloadId, onProgress) {
  const validation = validateFile(file, 'document');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (!downloadId) {
    throw new Error('Download ID is required for file upload');
  }

  const filename = generateUniqueFilename(file.name);
  const storagePath = `${STORAGE_PATHS.DOWNLOAD_FILES}/${downloadId}/${filename}`;
  const storageRef = ref(storage, storagePath);

  return uploadFile(storageRef, file, onProgress);
}

/**
 * Uploads a thumbnail image for a download
 * Recommended size: 400x300 pixels (defined in THUMBNAIL_DIMENSIONS)
 *
 * @param {File} file - Image file to upload (JPEG, PNG, GIF, or WebP)
 * @param {string} downloadId - Download ID for organizing the file
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<string>} Download URL of uploaded thumbnail
 */
export async function uploadDownloadThumbnail(file, downloadId, onProgress) {
  const validation = validateFile(file, 'thumbnail');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (!downloadId) {
    throw new Error('Download ID is required for thumbnail upload');
  }

  const filename = generateUniqueFilename(file.name);
  const storagePath = `${STORAGE_PATHS.DOWNLOAD_THUMBNAILS}/${downloadId}/${filename}`;
  const storageRef = ref(storage, storagePath);

  return uploadFile(storageRef, file, onProgress);
}

/**
 * Gets the recommended thumbnail dimensions
 *
 * @returns {{ width: number, height: number }} Recommended thumbnail dimensions
 */
export function getThumbnailDimensions() {
  return {
    width: THUMBNAIL_DIMENSIONS.WIDTH,
    height: THUMBNAIL_DIMENSIONS.HEIGHT,
  };
}

/**
 * Generic file upload function with progress tracking
 *
 * @param {Object} storageRef - Firebase Storage reference
 * @param {File} file - File to upload
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<string>} Download URL of uploaded file
 */
async function uploadFile(storageRef, file, onProgress) {
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        console.error('Upload error:', error);
        let errorMessage = 'Failed to upload file. Please try again.';

        switch (error.code) {
          case 'storage/unauthorized':
            errorMessage = 'You do not have permission to upload files.';
            break;
          case 'storage/canceled':
            errorMessage = 'Upload was cancelled.';
            break;
          case 'storage/quota-exceeded':
            errorMessage = 'Storage quota exceeded. Please contact support.';
            break;
          default:
            break;
        }

        reject(new Error(errorMessage));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (error) {
          reject(new Error('Failed to get download URL. Please try again.'));
        }
      }
    );
  });
}

/**
 * Uploads an invoice file (PDF or image)
 *
 * @param {File} file - Invoice file to upload
 * @param {string} storagePath - Full storage path for the file
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<string>} Download URL of uploaded invoice
 */
export async function uploadInvoiceFile(file, storagePath, onProgress) {
  // Validate file is PDF or image
  const allowedTypes = ALLOWED_FILE_TYPES.INVOICES;
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a PDF, JPEG, or PNG file.');
  }

  // Check file size (10MB max)
  const maxSize = MAX_FILE_SIZES.IMAGE;
  if (file.size > maxSize) {
    throw new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit.`);
  }

  const storageRef = ref(storage, storagePath);
  return uploadFile(storageRef, file, onProgress);
}

/**
 * Deletes a file from Firebase Storage
 *
 * @param {string} fileUrl - Full URL of the file to delete
 * @returns {Promise<void>}
 */
export async function deleteFile(fileUrl) {
  if (!fileUrl) {
    return;
  }

  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
  } catch (error) {
    // File may not exist or already deleted - that's okay
    if (error.code !== 'storage/object-not-found') {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file.');
    }
  }
}

/**
 * Extracts the storage path from a Firebase Storage URL
 *
 * @param {string} url - Full Firebase Storage URL
 * @returns {string|null} Storage path or null if invalid
 */
export function getStoragePathFromUrl(url) {
  if (!url) {
    return null;
  }

  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    // Extract path after /o/ and decode
    const match = path.match(/\/o\/(.+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
    return null;
  } catch {
    return null;
  }
}
