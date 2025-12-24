/**
 * QRScanner Component
 * Camera-based QR code scanner using html5-qrcode library.
 * Supports camera permission handling, flashlight toggle, and camera switching.
 *
 * @module components/checkin/QRScanner
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import styles from './QRScanner.module.css';

/**
 * QR Scanner configuration
 */
const SCANNER_CONFIG = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
  aspectRatio: 1.0,
  disableFlip: false,
};

/**
 * QRScanner Component
 *
 * @param {Object} props - Component props
 * @param {Function} props.onScan - Callback when QR code is scanned
 * @param {Function} props.onError - Callback for scanner errors
 * @param {boolean} [props.isActive=true] - Whether scanner should be active
 * @returns {JSX.Element} The QR scanner component
 */
function QRScanner({ onScan, onError, isActive = true }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [userInitiated, setUserInitiated] = useState(false);
  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);
  const scannerElementId = 'qr-scanner-container';

  /**
   * Starts the QR code scanning
   */
  const startScanning = useCallback(async (cameraId) => {
    if (!scannerRef.current || isScanningRef.current) {
      return;
    }

    try {
      await scannerRef.current.start(
        cameraId,
        SCANNER_CONFIG,
        (decodedText) => {
          if (onScan) {
            onScan(decodedText);
          }
        },
        () => {
          // QR code parse error - ignore (happens when no QR is in view)
        }
      );
      isScanningRef.current = true;
      setIsScanning(true);
      setError(null);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Failed to start camera. Please try again.');
    }
  }, [onScan]);

  /**
   * Stops the QR code scanning
   */
  const stopScanning = useCallback(async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      } finally {
        // Always reset state even if stop() fails
        isScanningRef.current = false;
        setIsScanning(false);
      }
    }
  }, []);

  /**
   * Checks if camera permission is already granted using the Permissions API.
   * This allows skipping the "requesting" UI when permission was previously granted.
   *
   * @returns {Promise<string|null>} Permission state ('granted', 'denied', 'prompt') or null if API unavailable
   */
  const checkExistingPermission = useCallback(async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'camera' });
        return result.state;
      }
    } catch (err) {
      // Permissions API not supported or query failed - proceed with normal flow
      console.debug('Permissions API not available:', err.message);
    }
    return null;
  }, []);

  /**
   * Requests camera permission and gets available cameras.
   * This is separated from scanner creation to avoid DOM timing issues.
   *
   * Note: We don't rely solely on the Permissions API for the 'denied' state
   * because it can be unreliable (cached/stale) after the user resets or
   * re-grants permission through browser settings. Instead, we always attempt
   * to access the camera and let the actual camera access determine the result.
   */
  const requestCameraPermission = useCallback(async () => {
    if (!isActive || !userInitiated) {
      return;
    }

    try {
      // Check if permission is already granted to skip "requesting" UI
      // Note: We only use this as a hint for 'granted' state, not for 'denied'
      // because the Permissions API can report stale 'denied' state even after
      // the user has reset/re-granted permission through browser settings
      const existingPermission = await checkExistingPermission();

      if (existingPermission === 'granted') {
        // Permission already granted - set hasPermission immediately to skip "requesting" UI
        setHasPermission(true);
      }
      // For 'denied' or 'prompt' states, we still try to access the camera
      // because the user may have reset the permission since the last check

      // Get available cameras (this triggers permission prompt if needed)
      // This is the authoritative check - it will fail with NotAllowedError
      // if permission is actually denied
      const devices = await Html5Qrcode.getCameras();

      if (devices && devices.length > 0) {
        setCameras(devices);

        // Prefer back camera on mobile
        const backCameraIndex = devices.findIndex(
          (device) =>
            device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('rear')
        );
        const initialIndex = backCameraIndex >= 0 ? backCameraIndex : 0;
        setCurrentCameraIndex(initialIndex);

        // Mark permission granted - this will trigger re-render with scanner container
        setHasPermission(true);
      } else {
        setHasPermission(false);
        setError('No cameras found on this device');
      }
    } catch (err) {
      console.error('Camera permission error:', err);
      setHasPermission(false);
      setError(getCameraErrorMessage(err));
      if (onError) {
        onError(err);
      }
    }
  }, [isActive, userInitiated, onError, checkExistingPermission]);

  /**
   * Creates scanner instance and starts scanning.
   * Must be called AFTER the scanner container element exists in DOM.
   */
  const initializeScanner = useCallback(async () => {
    if (!isActive || !hasPermission || cameras.length === 0) {
      return;
    }

    // Small delay to ensure DOM is ready (helps with Safari/Mac timing issues)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify DOM element exists
    const element = document.getElementById(scannerElementId);
    if (!element) {
      console.error('Scanner container element not found in DOM');
      return;
    }

    try {
      // Create scanner instance if not exists
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerElementId);
      }

      // Start scanning
      await startScanning(cameras[currentCameraIndex].id);
      setIsReady(true);
    } catch (err) {
      console.error('Scanner initialization error:', err);
      setError(getCameraErrorMessage(err));
      if (onError) {
        onError(err);
      }
    }
  }, [isActive, hasPermission, cameras, currentCameraIndex, onError, startScanning]);

  /**
   * Switches between available cameras
   */
  const switchCamera = useCallback(async () => {
    if (cameras.length <= 1) {
      return;
    }

    try {
      await stopScanning();

      // Small delay to ensure camera is fully released before switching
      await new Promise((resolve) => setTimeout(resolve, 100));

      const nextIndex = (currentCameraIndex + 1) % cameras.length;
      setCurrentCameraIndex(nextIndex);

      // Reset paused state when switching cameras
      setIsPaused(false);

      await startScanning(cameras[nextIndex].id);
    } catch (err) {
      console.error('Failed to switch camera:', err);
      setError('Failed to switch camera. Please try again.');
    }
  }, [cameras, currentCameraIndex, stopScanning, startScanning]);

  /**
   * Handles user clicking Start Scanning button
   */
  const handleStartScanning = async () => {
    setUserInitiated(true);
    setError(null);
    setIsReady(false);
    await requestCameraPermission();
  };

  /**
   * Requests camera permission (retry handler for Try Again button)
   */
  const requestPermission = async () => {
    setError(null);
    setIsReady(false);
    setUserInitiated(true);
    await requestCameraPermission();
  };

  /**
   * Returns user-friendly camera error message.
   * Handles browser-specific error types including Safari/Mac.
   *
   * @param {Error} err - The error object from camera access attempt
   * @returns {string} User-friendly error message
   */
  const getCameraErrorMessage = (err) => {
    const errorName = err.name || '';
    const errorMessage = err.message || '';

    // Permission explicitly denied
    if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
      return 'Camera access denied. Please allow camera access in your browser settings.';
    }

    // No camera found
    if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
      return 'No camera found on this device.';
    }

    // Camera in use by another application
    if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
      return 'Camera is in use by another application. Please close other apps using the camera.';
    }

    // Camera constraints cannot be satisfied (common on Mac/Safari)
    if (errorName === 'OverconstrainedError' || errorName === 'ConstraintNotSatisfiedError') {
      return 'Camera settings not supported. Please try a different browser or camera.';
    }

    // User cancelled the permission dialog (Safari)
    if (errorName === 'AbortError') {
      return 'Camera access was cancelled. Please try again.';
    }

    // Security error (insecure context or blocked by browser policy)
    if (errorName === 'SecurityError') {
      return 'Camera access blocked by browser security settings.';
    }

    // TypeError - usually means getUserMedia is not supported
    if (errorName === 'TypeError') {
      return 'Camera not supported in this browser.';
    }

    // Check for specific error messages that might give more context
    if (errorMessage.toLowerCase().includes('permission')) {
      return 'Camera permission issue. Please check your browser and system settings.';
    }

    if (errorMessage.toLowerCase().includes('not found')) {
      return 'Camera not found. Please ensure a camera is connected.';
    }

    // Default fallback with error details for debugging
    console.debug('Unhandled camera error:', { name: errorName, message: errorMessage });
    return 'Failed to access camera. Please check your device settings and try again.';
  };

  /**
   * Request camera permission when user initiates scanning
   */
  useEffect(() => {
    if (userInitiated) {
      requestCameraPermission();
    }
  }, [userInitiated, requestCameraPermission]);

  /**
   * Cleanup scanner on unmount
   */
  useEffect(() => {
    return () => {
      const cleanup = async () => {
        if (scannerRef.current) {
          try {
            // Only stop if scanner is currently running
            if (isScanningRef.current) {
              await scannerRef.current.stop();
            }
            // Clear releases all resources (camera, DOM elements, etc.)
            await scannerRef.current.clear();
          } catch (err) {
            // Log cleanup errors for debugging (common during hot reload or navigation)
            console.debug('Scanner cleanup:', err.message || err);
          }
        }
        scannerRef.current = null;
        isScanningRef.current = false;
      };
      cleanup();
    };
  }, []);

  /**
   * Initialize scanner after permission is granted and component re-renders with container
   */
  useEffect(() => {
    if (hasPermission && cameras.length > 0 && !isReady) {
      initializeScanner();
    }
  }, [hasPermission, cameras, isReady, initializeScanner]);

  /**
   * Handle isActive prop changes
   */
  useEffect(() => {
    if (!isActive && isScanning) {
      stopScanning();
    } else if (isActive && !isScanning && !isPaused && hasPermission && cameras.length > 0 && isReady) {
      startScanning(cameras[currentCameraIndex].id);
    }
  }, [isActive, isScanning, isPaused, hasPermission, cameras, currentCameraIndex, isReady, startScanning, stopScanning]);

  // User hasn't initiated scanning yet
  if (!userInitiated) {
    return (
      <div className={styles.container}>
        <div className={styles.permissionDenied}>
          <svg
            className={styles.cameraIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <h3>QR Code Scanner</h3>
          <p>Tap the button below to start scanning QR codes</p>
          <button className={styles.retryButton} onClick={handleStartScanning}>
            Start Scanning
          </button>
        </div>
      </div>
    );
  }

  // Permission pending state
  if (hasPermission === null) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Requesting camera access...</p>
        </div>
      </div>
    );
  }

  // Permission denied state
  if (hasPermission === false) {
    return (
      <div className={styles.container}>
        <div className={styles.permissionDenied}>
          <svg
            className={styles.cameraIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
          <h3>Camera Access Required</h3>
          <p>{error || 'Please allow camera access to scan QR codes.'}</p>
          <button className={styles.retryButton} onClick={requestPermission}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Scanner viewport */}
      <div className={styles.scannerWrapper}>
        <div id={scannerElementId} className={styles.scanner}></div>
        <div className={styles.scannerOverlay}>
          <div className={styles.scannerFrame}>
            <div className={styles.cornerTL}></div>
            <div className={styles.cornerTR}></div>
            <div className={styles.cornerBL}></div>
            <div className={styles.cornerBR}></div>
          </div>
          <p className={styles.scannerHint}>Position QR code within the frame</p>
        </div>
      </div>

      {/* Camera controls */}
      <div className={styles.controls}>
        {cameras.length > 1 && (
          <button
            className={styles.controlButton}
            onClick={switchCamera}
            title="Switch camera"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
              <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
              <polyline points="8 12 12 16 16 12" />
              <polyline points="16 12 12 8 8 12" />
            </svg>
            <span>Switch</span>
          </button>
        )}
        {isScanning && (
          <button
            className={styles.controlButton}
            onClick={() => {
              setIsPaused(true);
              stopScanning();
            }}
            title="Pause scanner"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
            <span>Pause</span>
          </button>
        )}
        {!isScanning && hasPermission && cameras.length > 0 && (
          <button
            className={styles.controlButton}
            onClick={() => {
              setIsPaused(false);
              startScanning(cameras[currentCameraIndex].id);
            }}
            title="Resume scanner"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Resume</span>
          </button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

export default QRScanner;
