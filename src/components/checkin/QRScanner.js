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
  const [cameras, setCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [error, setError] = useState(null);
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
        isScanningRef.current = false;
        setIsScanning(false);
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
    }
  }, []);

  /**
   * Initializes the QR scanner
   */
  const initializeScanner = useCallback(async () => {
    if (!isActive) {
      return;
    }

    try {
      // Get available cameras
      const devices = await Html5Qrcode.getCameras();

      if (devices && devices.length > 0) {
        setCameras(devices);
        setHasPermission(true);

        // Prefer back camera on mobile
        const backCameraIndex = devices.findIndex(
          (device) =>
            device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('rear')
        );
        const initialIndex = backCameraIndex >= 0 ? backCameraIndex : 0;
        setCurrentCameraIndex(initialIndex);

        // Create scanner instance
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode(scannerElementId);
        }

        // Start scanning
        await startScanning(devices[initialIndex].id);
      } else {
        setHasPermission(false);
        setError('No cameras found on this device');
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      setHasPermission(false);
      setError(getCameraErrorMessage(err));
      if (onError) {
        onError(err);
      }
    }
  }, [isActive, onError, startScanning]);

  /**
   * Switches between available cameras
   */
  const switchCamera = async () => {
    if (cameras.length <= 1) {
      return;
    }

    await stopScanning();
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    await startScanning(cameras[nextIndex].id);
  };

  /**
   * Requests camera permission
   */
  const requestPermission = async () => {
    setError(null);
    await initializeScanner();
  };

  /**
   * Returns user-friendly camera error message
   */
  const getCameraErrorMessage = (err) => {
    if (err.name === 'NotAllowedError') {
      return 'Camera access denied. Please allow camera access in your browser settings.';
    }
    if (err.name === 'NotFoundError') {
      return 'No camera found on this device.';
    }
    if (err.name === 'NotReadableError') {
      return 'Camera is in use by another application.';
    }
    return 'Failed to access camera. Please check your device settings.';
  };

  /**
   * Initialize scanner on mount
   */
  useEffect(() => {
    initializeScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch((err) => {
          // Log cleanup errors for debugging (common during hot reload)
          console.debug('Scanner cleanup:', err.message || err);
        });
        scannerRef.current = null;
      }
    };
  }, [initializeScanner]);

  /**
   * Handle isActive prop changes
   */
  useEffect(() => {
    if (!isActive && isScanning) {
      stopScanning();
    } else if (isActive && !isScanning && hasPermission && cameras.length > 0) {
      startScanning(cameras[currentCameraIndex].id);
    }
  }, [isActive, isScanning, hasPermission, cameras, currentCameraIndex, startScanning, stopScanning]);

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
            onClick={stopScanning}
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
            onClick={() => startScanning(cameras[currentCameraIndex].id)}
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
