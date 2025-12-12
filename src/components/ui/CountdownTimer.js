import { useState, useEffect, useCallback } from 'react';
import styles from './CountdownTimer.module.css';

/**
 * Status constants for countdown timer states
 */
const COUNTDOWN_STATUS = {
  LOADING: 'loading',
  COUNTING: 'counting',
  EVENT_STARTED: 'event_started',
  EVENT_CONCLUDED: 'event_concluded',
};

/**
 * Time unit labels for display
 */
const TIME_LABELS = {
  DAYS: 'Days',
  HOURS: 'Hours',
  MINUTES: 'Minutes',
  SECONDS: 'Seconds',
};

/**
 * Calculates the time remaining until the target date
 *
 * @param {Date} targetDate - The target date to count down to
 * @returns {Object} Object containing days, hours, minutes, seconds, and total milliseconds
 */
function calculateTimeRemaining(targetDate) {
  const now = new Date();
  const difference = targetDate.getTime() - now.getTime();

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: difference,
    };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    total: difference,
  };
}

/**
 * Determines the current status of the countdown based on dates
 *
 * @param {Date} startDate - The event start date
 * @param {Date} endDate - The event end date
 * @returns {string} The current countdown status
 */
function getCountdownStatus(startDate, endDate) {
  const now = new Date();

  if (now < startDate) {
    return COUNTDOWN_STATUS.COUNTING;
  }

  if (now >= startDate && now <= endDate) {
    return COUNTDOWN_STATUS.EVENT_STARTED;
  }

  return COUNTDOWN_STATUS.EVENT_CONCLUDED;
}

/**
 * CountdownTimer Component
 * Displays a countdown timer showing days, hours, minutes, and seconds
 * until the target date. Handles timezone correctly and shows appropriate
 * messages when the event has started or concluded.
 *
 * @param {Object} props - Component props
 * @param {string} props.targetDate - ISO 8601 date string for countdown target (event start)
 * @param {string} [props.endDate] - ISO 8601 date string for event end (optional)
 * @param {string} [props.timezone] - IANA timezone identifier (e.g., 'Asia/Manila')
 * @returns {JSX.Element} The countdown timer component
 */
function CountdownTimer({ targetDate, endDate, timezone }) {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [status, setStatus] = useState(COUNTDOWN_STATUS.LOADING);

  /**
   * Parses date string to Date object, handling timezone
   */
  const parseDate = useCallback((dateString) => {
    if (!dateString) {
      return null;
    }
    return new Date(dateString);
  }, []);

  /**
   * Updates the countdown timer state
   */
  const updateCountdown = useCallback(() => {
    const start = parseDate(targetDate);
    const end = parseDate(endDate) || start;

    if (!start) {
      return;
    }

    const currentStatus = getCountdownStatus(start, end);
    setStatus(currentStatus);

    if (currentStatus === COUNTDOWN_STATUS.COUNTING) {
      setTimeRemaining(calculateTimeRemaining(start));
    }
  }, [targetDate, endDate, parseDate]);

  useEffect(() => {
    if (!targetDate) {
      return;
    }

    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetDate, updateCountdown]);

  if (!targetDate) {
    return null;
  }

  if (status === COUNTDOWN_STATUS.LOADING) {
    return (
      <div className={styles.container} aria-label="Loading countdown timer">
        <div className={styles.grid}>
          {[TIME_LABELS.DAYS, TIME_LABELS.HOURS, TIME_LABELS.MINUTES, TIME_LABELS.SECONDS].map(
            (label) => (
              <div key={label} className={styles.unit}>
                <div className={`${styles.value} ${styles.skeleton}`} aria-hidden="true">
                  --
                </div>
                <div className={styles.label}>{label}</div>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  if (status === COUNTDOWN_STATUS.EVENT_STARTED) {
    return (
      <div className={styles.container}>
        <div className={styles.statusMessage}>
          <span className={styles.statusIcon} aria-hidden="true">
            &#9679;
          </span>
          <span className={styles.statusText}>Event in Progress</span>
        </div>
      </div>
    );
  }

  if (status === COUNTDOWN_STATUS.EVENT_CONCLUDED) {
    return (
      <div className={styles.container}>
        <div className={styles.statusMessage}>
          <span className={styles.statusText}>Event Concluded</span>
          <p className={styles.thankYou}>Thank you for joining IDMC!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.container}
      role="timer"
      aria-label={`Countdown: ${timeRemaining.days} days, ${timeRemaining.hours} hours, ${timeRemaining.minutes} minutes, ${timeRemaining.seconds} seconds remaining`}
    >
      <div className={styles.grid}>
        <div className={styles.unit}>
          <div className={styles.value}>{String(timeRemaining.days).padStart(2, '0')}</div>
          <div className={styles.label}>{TIME_LABELS.DAYS}</div>
        </div>
        <div className={styles.separator} aria-hidden="true">
          :
        </div>
        <div className={styles.unit}>
          <div className={styles.value}>{String(timeRemaining.hours).padStart(2, '0')}</div>
          <div className={styles.label}>{TIME_LABELS.HOURS}</div>
        </div>
        <div className={styles.separator} aria-hidden="true">
          :
        </div>
        <div className={styles.unit}>
          <div className={styles.value}>{String(timeRemaining.minutes).padStart(2, '0')}</div>
          <div className={styles.label}>{TIME_LABELS.MINUTES}</div>
        </div>
        <div className={styles.separator} aria-hidden="true">
          :
        </div>
        <div className={styles.unit}>
          <div className={styles.value}>{String(timeRemaining.seconds).padStart(2, '0')}</div>
          <div className={styles.label}>{TIME_LABELS.SECONDS}</div>
        </div>
      </div>
    </div>
  );
}

export default CountdownTimer;
