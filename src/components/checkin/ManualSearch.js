/**
 * ManualSearch Component
 * Search interface for manually finding registrations by name, email, phone, or code.
 *
 * @module components/checkin/ManualSearch
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { searchRegistrations } from '../../services';
import styles from './ManualSearch.module.css';

/**
 * Debounce function for search input
 */
function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * ManualSearch Component
 *
 * @param {Object} props - Component props
 * @param {Function} props.onSelect - Callback when a registration is selected
 * @param {boolean} [props.autoFocus=false] - Whether to auto-focus the search input
 * @returns {JSX.Element} The manual search component
 */
function ManualSearch({ onSelect, autoFocus = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  /**
   * Performs the search
   */
  const performSearch = useCallback(async (term) => {
    if (!term || term.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const searchResults = await searchRegistrations(term);
      setResults(searchResults);
      setHasSearched(true);
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  /**
   * Debounced search handler
   */
  const debouncedSearch = useDebounce(performSearch, 300);

  /**
   * Handles search input change
   */
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  /**
   * Handles form submission (immediate search)
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    performSearch(searchTerm);
  };

  /**
   * Clears the search
   */
  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
    setHasSearched(false);
    setError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  /**
   * Auto-focus on mount
   */
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  /**
   * Formats attendee name
   */
  const formatName = (attendee) => {
    if (!attendee) return 'Unknown';
    return `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim() || 'Unknown';
  };

  /**
   * Gets status badge class
   */
  const getStatusClass = (registration) => {
    if (registration.checkedIn) return styles.statusCheckedIn;
    if (registration.status === 'confirmed') return styles.statusConfirmed;
    if (registration.status === 'cancelled') return styles.statusCancelled;
    return styles.statusPending;
  };

  /**
   * Gets status label
   */
  const getStatusLabel = (registration) => {
    if (registration.checkedIn) return 'Checked In';
    if (registration.status === 'confirmed') return 'Confirmed';
    if (registration.status === 'cancelled') return 'Cancelled';
    return 'Pending';
  };

  return (
    <div className={styles.container}>
      {/* Search Form */}
      <form className={styles.searchForm} onSubmit={handleSubmit}>
        <div className={styles.inputWrapper}>
          <svg
            className={styles.searchIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Search by name, email, phone, or code..."
            value={searchTerm}
            onChange={handleInputChange}
            aria-label="Search registrations"
          />
          {searchTerm && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <button
          type="submit"
          className={styles.searchButton}
          disabled={isSearching || !searchTerm.trim()}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Search hints */}
      {!hasSearched && !searchTerm && (
        <div className={styles.hints}>
          <p>Search by:</p>
          <ul>
            <li>Full name (e.g., "Juan dela Cruz")</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Registration code (e.g., "A7K3")</li>
            <li>Registration ID (e.g., "REG-2026-A7K3")</li>
          </ul>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      {/* Loading state */}
      {isSearching && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Searching...</p>
        </div>
      )}

      {/* Results list */}
      {!isSearching && hasSearched && (
        <div className={styles.results}>
          {results.length === 0 ? (
            <div className={styles.noResults}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8" />
              </svg>
              <p>No registrations found for "{searchTerm}"</p>
              <span>Try a different search term</span>
            </div>
          ) : (
            <>
              <p className={styles.resultCount}>
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </p>
              <ul className={styles.resultsList}>
                {results.map((registration) => (
                  <li key={registration.id}>
                    <button
                      className={styles.resultItem}
                      onClick={() => onSelect(registration)}
                    >
                      <div className={styles.resultMain}>
                        <div className={styles.resultName}>
                          {formatName(registration.primaryAttendee)}
                        </div>
                        <div className={styles.resultDetails}>
                          <span>{registration.primaryAttendee?.email || 'No email'}</span>
                          {registration.shortCode && (
                            <span className={styles.shortCode}>{registration.shortCode}</span>
                          )}
                        </div>
                        {registration.church?.name && (
                          <div className={styles.resultChurch}>
                            {registration.church.name}
                          </div>
                        )}
                      </div>
                      <div className={styles.resultMeta}>
                        <span className={`${styles.statusBadge} ${getStatusClass(registration)}`}>
                          {getStatusLabel(registration)}
                        </span>
                        {(registration.additionalAttendees?.length || 0) > 0 && (
                          <span className={styles.attendeeCount}>
                            +{registration.additionalAttendees.length} guest
                            {registration.additionalAttendees.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ManualSearch;
