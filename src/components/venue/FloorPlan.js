/**
 * FloorPlan Component
 * Interactive SVG-based floor plan with clickable rooms that display
 * session information and visual feedback on hover/click.
 *
 * @module components/venue/FloorPlan
 */

import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import RoomDetailPanel from './RoomDetailPanel';
import { VenueMap } from '../contact';
import { FLOOR_PLAN_ROOMS } from './floorPlanData';
import { VENUE } from '../../constants';
import styles from './FloorPlan.module.css';

/**
 * FloorPlan Component
 * Renders an interactive SVG floor plan with clickable room areas.
 *
 * @param {Object} props - Component props
 * @param {Array} [props.schedule] - Schedule data to show sessions in rooms
 * @param {Array} [props.workshops] - Workshop data to show in rooms
 * @returns {JSX.Element} The interactive floor plan component
 */
function FloorPlan({ schedule, workshops }) {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [hoveredRoom, setHoveredRoom] = useState(null);

  /**
   * Handles room click to select and show details
   *
   * @param {Object} room - The room data object
   */
  const handleRoomClick = useCallback((room) => {
    setSelectedRoom(room);
  }, []);

  /**
   * Handles closing the room detail panel
   */
  const handleClosePanel = useCallback(() => {
    setSelectedRoom(null);
  }, []);

  /**
   * Handles keyboard navigation for accessibility
   *
   * @param {KeyboardEvent} event - Keyboard event
   * @param {Object} room - The room data object
   */
  const handleKeyDown = useCallback((event, room) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRoomClick(room);
    }
  }, [handleRoomClick]);

  /**
   * Gets sessions/workshops for a specific room
   *
   * @param {string} roomId - The room identifier
   * @returns {Array} Sessions in this room
   */
  const getSessionsForRoom = useCallback((roomId) => {
    const room = FLOOR_PLAN_ROOMS.find(r => r.id === roomId);
    if (!room) return [];

    const roomSessions = [];

    if (schedule) {
      const scheduleSessions = schedule.filter(s => s.venue === room.name);
      roomSessions.push(...scheduleSessions);
    }

    if (workshops) {
      const workshopSessions = workshops.filter(w => w.venue === room.name);
      roomSessions.push(...workshopSessions);
    }

    return roomSessions;
  }, [schedule, workshops]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Interactive Floor Plan</h3>
        <p className={styles.subtitle}>Click on a room to see what&apos;s happening there</p>
      </div>

      <div className={styles.floorPlanWrapper}>
        {/* Legend */}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={`${styles.legendColor} ${styles.legendMain}`} />
            <span>Main Venue</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendColor} ${styles.legendWorkshop}`} />
            <span>Workshop Room</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendColor} ${styles.legendService}`} />
            <span>Service Area</span>
          </div>
        </div>

        {/* SVG Floor Plan */}
        <svg
          viewBox="0 0 800 500"
          className={styles.floorPlan}
          role="img"
          aria-label="Interactive floor plan of GCF South Metro"
        >
          {/* Background */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
            </pattern>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
            <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="workshopGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
            <linearGradient id="serviceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>

          <rect width="800" height="500" fill="url(#grid)" />

          {/* Building Outline */}
          <rect
            x="40"
            y="30"
            width="720"
            height="440"
            fill="none"
            stroke="#374151"
            strokeWidth="3"
            rx="8"
          />

          {/* Ground Floor Label */}
          <text x="60" y="60" className={styles.floorLabel}>Ground Floor</text>

          {/* Main Hall - Large central room */}
          <g
            className={`${styles.room} ${hoveredRoom === 'main-hall' ? styles.roomHovered : ''} ${selectedRoom?.id === 'main-hall' ? styles.roomSelected : ''}`}
            onClick={() => handleRoomClick(FLOOR_PLAN_ROOMS.find(r => r.id === 'main-hall'))}
            onMouseEnter={() => setHoveredRoom('main-hall')}
            onMouseLeave={() => setHoveredRoom(null)}
            onKeyDown={(e) => handleKeyDown(e, FLOOR_PLAN_ROOMS.find(r => r.id === 'main-hall'))}
            tabIndex={0}
            role="button"
            aria-label="Main Hall - Click for details"
          >
            <rect
              x="60"
              y="80"
              width="360"
              height="220"
              rx="6"
              fill="url(#mainGradient)"
              filter="url(#shadow)"
              className={styles.roomRect}
            />
            <text x="240" y="180" className={styles.roomName}>Main Hall</text>
            <text x="240" y="210" className={styles.roomCapacity}>Plenary Sessions</text>
            <text x="240" y="240" className={styles.roomCapacity}>Capacity: 500</text>

            {/* Stage indicator */}
            <rect x="80" y="100" width="320" height="30" rx="4" fill="rgba(255,255,255,0.2)" />
            <text x="240" y="120" className={styles.stageLabel}>STAGE</text>
          </g>

          {/* Fellowship Hall - Adjacent to Main Hall */}
          <g
            className={`${styles.room} ${hoveredRoom === 'fellowship-hall' ? styles.roomHovered : ''} ${selectedRoom?.id === 'fellowship-hall' ? styles.roomSelected : ''}`}
            onClick={() => handleRoomClick(FLOOR_PLAN_ROOMS.find(r => r.id === 'fellowship-hall'))}
            onMouseEnter={() => setHoveredRoom('fellowship-hall')}
            onMouseLeave={() => setHoveredRoom(null)}
            onKeyDown={(e) => handleKeyDown(e, FLOOR_PLAN_ROOMS.find(r => r.id === 'fellowship-hall'))}
            tabIndex={0}
            role="button"
            aria-label="Fellowship Hall - Click for details"
          >
            <rect
              x="440"
              y="80"
              width="300"
              height="140"
              rx="6"
              fill="url(#serviceGradient)"
              filter="url(#shadow)"
              className={styles.roomRect}
            />
            <text x="590" y="145" className={styles.roomName}>Fellowship Hall</text>
            <text x="590" y="175" className={styles.roomCapacity}>Meals & Breaks</text>
          </g>

          {/* Main Lobby - Entry area */}
          <g
            className={`${styles.room} ${hoveredRoom === 'main-lobby' ? styles.roomHovered : ''} ${selectedRoom?.id === 'main-lobby' ? styles.roomSelected : ''}`}
            onClick={() => handleRoomClick(FLOOR_PLAN_ROOMS.find(r => r.id === 'main-lobby'))}
            onMouseEnter={() => setHoveredRoom('main-lobby')}
            onMouseLeave={() => setHoveredRoom(null)}
            onKeyDown={(e) => handleKeyDown(e, FLOOR_PLAN_ROOMS.find(r => r.id === 'main-lobby'))}
            tabIndex={0}
            role="button"
            aria-label="Main Lobby - Click for details"
          >
            <rect
              x="440"
              y="240"
              width="300"
              height="60"
              rx="6"
              fill="url(#serviceGradient)"
              filter="url(#shadow)"
              className={styles.roomRect}
            />
            <text x="590" y="278" className={styles.roomName}>Main Lobby</text>

            {/* Entry indicator */}
            <path d="M 740 255 L 760 270 L 740 285" fill="none" stroke="white" strokeWidth="2" />
            <text x="765" y="275" className={styles.entryLabel}>ENTRY</text>
          </g>

          {/* Second Floor Section */}
          <line x1="50" y1="320" x2="750" y2="320" stroke="#374151" strokeWidth="2" strokeDasharray="8,4" />
          <text x="60" y="345" className={styles.floorLabel}>Second Floor</text>

          {/* Worship Hall - Workshop Room 1 */}
          <g
            className={`${styles.room} ${hoveredRoom === 'worship-hall' ? styles.roomHovered : ''} ${selectedRoom?.id === 'worship-hall' ? styles.roomSelected : ''}`}
            onClick={() => handleRoomClick(FLOOR_PLAN_ROOMS.find(r => r.id === 'worship-hall'))}
            onMouseEnter={() => setHoveredRoom('worship-hall')}
            onMouseLeave={() => setHoveredRoom(null)}
            onKeyDown={(e) => handleKeyDown(e, FLOOR_PLAN_ROOMS.find(r => r.id === 'worship-hall'))}
            tabIndex={0}
            role="button"
            aria-label="Worship Hall - Click for details"
          >
            <rect
              x="60"
              y="360"
              width="170"
              height="90"
              rx="6"
              fill="url(#workshopGradient)"
              filter="url(#shadow)"
              className={styles.roomRect}
            />
            <text x="145" y="400" className={styles.roomNameSmall}>Worship Hall</text>
            <text x="145" y="425" className={styles.roomCapacitySmall}>Next Gen</text>
          </g>

          {/* 2nd Floor Lobby - Workshop Room 2 */}
          <g
            className={`${styles.room} ${hoveredRoom === '2nd-floor-lobby' ? styles.roomHovered : ''} ${selectedRoom?.id === '2nd-floor-lobby' ? styles.roomSelected : ''}`}
            onClick={() => handleRoomClick(FLOOR_PLAN_ROOMS.find(r => r.id === '2nd-floor-lobby'))}
            onMouseEnter={() => setHoveredRoom('2nd-floor-lobby')}
            onMouseLeave={() => setHoveredRoom(null)}
            onKeyDown={(e) => handleKeyDown(e, FLOOR_PLAN_ROOMS.find(r => r.id === '2nd-floor-lobby'))}
            tabIndex={0}
            role="button"
            aria-label="2nd Floor Lobby - Click for details"
          >
            <rect
              x="250"
              y="360"
              width="170"
              height="90"
              rx="6"
              fill="url(#workshopGradient)"
              filter="url(#shadow)"
              className={styles.roomRect}
            />
            <text x="335" y="400" className={styles.roomNameSmall}>2nd Floor Lobby</text>
            <text x="335" y="425" className={styles.roomCapacitySmall}>Women</text>
          </g>

          {/* CDC - Workshop Room 3 */}
          <g
            className={`${styles.room} ${hoveredRoom === 'cdc' ? styles.roomHovered : ''} ${selectedRoom?.id === 'cdc' ? styles.roomSelected : ''}`}
            onClick={() => handleRoomClick(FLOOR_PLAN_ROOMS.find(r => r.id === 'cdc'))}
            onMouseEnter={() => setHoveredRoom('cdc')}
            onMouseLeave={() => setHoveredRoom(null)}
            onKeyDown={(e) => handleKeyDown(e, FLOOR_PLAN_ROOMS.find(r => r.id === 'cdc'))}
            tabIndex={0}
            role="button"
            aria-label="CDC Room - Click for details"
          >
            <rect
              x="440"
              y="360"
              width="140"
              height="90"
              rx="6"
              fill="url(#workshopGradient)"
              filter="url(#shadow)"
              className={styles.roomRect}
            />
            <text x="510" y="400" className={styles.roomNameSmall}>CDC</text>
            <text x="510" y="425" className={styles.roomCapacitySmall}>Men</text>
          </g>

          {/* YDT - Workshop Room 4 */}
          <g
            className={`${styles.room} ${hoveredRoom === 'ydt' ? styles.roomHovered : ''} ${selectedRoom?.id === 'ydt' ? styles.roomSelected : ''}`}
            onClick={() => handleRoomClick(FLOOR_PLAN_ROOMS.find(r => r.id === 'ydt'))}
            onMouseEnter={() => setHoveredRoom('ydt')}
            onMouseLeave={() => setHoveredRoom(null)}
            onKeyDown={(e) => handleKeyDown(e, FLOOR_PLAN_ROOMS.find(r => r.id === 'ydt'))}
            tabIndex={0}
            role="button"
            aria-label="YDT Room - Click for details"
          >
            <rect
              x="600"
              y="360"
              width="140"
              height="90"
              rx="6"
              fill="url(#workshopGradient)"
              filter="url(#shadow)"
              className={styles.roomRect}
            />
            <text x="670" y="400" className={styles.roomNameSmall}>YDT</text>
            <text x="670" y="425" className={styles.roomCapacitySmall}>Senior Citizens</text>
          </g>

          {/* Stairs indicators */}
          <g className={styles.stairs}>
            <rect x="60" y="310" width="40" height="40" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" rx="4" />
            <path d="M 65 340 L 65 320 L 70 320 L 70 325 L 75 325 L 75 330 L 80 330 L 80 335 L 85 335 L 85 340 Z" fill="#9ca3af" />
            <text x="80" y="360" className={styles.stairsLabel}>Stairs</text>
          </g>
        </svg>

        {/* Hover tooltip */}
        {hoveredRoom && !selectedRoom && (
          <div className={styles.tooltip}>
            <span className={styles.tooltipIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </span>
            Click to view details
          </div>
        )}
      </div>

      {/* Location Map */}
      <div className={styles.mapSection}>
        <div className={styles.mapHeader}>
          <div className={styles.mapIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div className={styles.mapInfo}>
            <h4 className={styles.mapTitle}>Find Us</h4>
            <p className={styles.mapAddress}>{VENUE.ADDRESS}</p>
          </div>
          <a
            href={VENUE.MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.directionsLink}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
            Get Directions
          </a>
        </div>
        <div className={styles.mapWrapper}>
          <VenueMap height="200px" />
        </div>
      </div>

      {/* Room Detail Panel */}
      <RoomDetailPanel
        room={selectedRoom}
        sessions={selectedRoom ? getSessionsForRoom(selectedRoom.id) : []}
        isOpen={Boolean(selectedRoom)}
        onClose={handleClosePanel}
      />
    </div>
  );
}

FloorPlan.propTypes = {
  schedule: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      venue: PropTypes.string,
    })
  ),
  workshops: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      venue: PropTypes.string,
    })
  ),
};

export default FloorPlan;
