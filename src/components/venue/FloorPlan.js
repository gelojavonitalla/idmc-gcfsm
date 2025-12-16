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
import { FLOOR_PLAN_ROOMS } from './floorPlanData';
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
        <p className={styles.disclaimer}>Note: This is a mockup and does not reflect the actual floor plan yet.</p>
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

          {/* Worship Hall - Main venue (large central room) */}
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
              y="80"
              width="480"
              height="200"
              rx="6"
              fill="url(#mainGradient)"
              filter="url(#shadow)"
              className={styles.roomRect}
            />
            <text x="300" y="165" className={styles.roomName}>Worship Hall</text>
            <text x="300" y="195" className={styles.roomCapacity}>Plenary Sessions &amp; Next Gen Workshop</text>
            <text x="300" y="225" className={styles.roomCapacity}>Capacity: 500</text>

            {/* Stage indicator */}
            <rect x="80" y="100" width="440" height="30" rx="4" fill="rgba(255,255,255,0.2)" />
            <text x="300" y="120" className={styles.stageLabel}>STAGE</text>
          </g>

          {/* 1st Floor Lobby - Registration area */}
          <g
            className={`${styles.room} ${hoveredRoom === '1st-floor-lobby' ? styles.roomHovered : ''} ${selectedRoom?.id === '1st-floor-lobby' ? styles.roomSelected : ''}`}
            onClick={() => handleRoomClick(FLOOR_PLAN_ROOMS.find(r => r.id === '1st-floor-lobby'))}
            onMouseEnter={() => setHoveredRoom('1st-floor-lobby')}
            onMouseLeave={() => setHoveredRoom(null)}
            onKeyDown={(e) => handleKeyDown(e, FLOOR_PLAN_ROOMS.find(r => r.id === '1st-floor-lobby'))}
            tabIndex={0}
            role="button"
            aria-label="1st Floor Lobby - Click for details"
          >
            <rect
              x="560"
              y="80"
              width="180"
              height="200"
              rx="6"
              fill="url(#serviceGradient)"
              filter="url(#shadow)"
              className={styles.roomRect}
            />
            <text x="650" y="170" className={styles.roomName}>1st Floor Lobby</text>
            <text x="650" y="200" className={styles.roomCapacity}>Registration</text>

            {/* Entry indicator */}
            <path d="M 740 165 L 760 180 L 740 195" fill="none" stroke="white" strokeWidth="2" />
            <text x="765" y="185" className={styles.entryLabel}>ENTRY</text>
          </g>

          {/* Second Floor Section */}
          <line x1="50" y1="300" x2="750" y2="300" stroke="#374151" strokeWidth="2" strokeDasharray="8,4" />
          <text x="60" y="330" className={styles.floorLabel}>Second Floor</text>

          {/* YDT - Men's Workshop */}
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
              x="60"
              y="350"
              width="140"
              height="100"
              rx="6"
              fill="url(#workshopGradient)"
              filter="url(#shadow)"
              className={styles.roomRect}
            />
            <text x="130" y="395" className={styles.roomNameSmall}>YDT</text>
            <text x="130" y="420" className={styles.roomCapacitySmall}>Men</text>
          </g>

          {/* CDC - Women's Workshop */}
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
              x="220"
              y="350"
              width="140"
              height="100"
              rx="6"
              fill="url(#workshopGradient)"
              filter="url(#shadow)"
              className={styles.roomRect}
            />
            <text x="290" y="395" className={styles.roomNameSmall}>CDC</text>
            <text x="290" y="420" className={styles.roomCapacitySmall}>Women</text>
          </g>

          {/* Library - Senior Citizens Workshop */}
          <g
            className={`${styles.room} ${hoveredRoom === 'library' ? styles.roomHovered : ''} ${selectedRoom?.id === 'library' ? styles.roomSelected : ''}`}
            onClick={() => handleRoomClick(FLOOR_PLAN_ROOMS.find(r => r.id === 'library'))}
            onMouseEnter={() => setHoveredRoom('library')}
            onMouseLeave={() => setHoveredRoom(null)}
            onKeyDown={(e) => handleKeyDown(e, FLOOR_PLAN_ROOMS.find(r => r.id === 'library'))}
            tabIndex={0}
            role="button"
            aria-label="Library - Click for details"
          >
            <rect
              x="380"
              y="350"
              width="140"
              height="100"
              rx="6"
              fill="url(#workshopGradient)"
              filter="url(#shadow)"
              className={styles.roomRect}
            />
            <text x="450" y="395" className={styles.roomNameSmall}>Library</text>
            <text x="450" y="420" className={styles.roomCapacitySmall}>Senior Citizens</text>
          </g>

          {/* 2nd Floor Lobby - Couples Workshop */}
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
              x="540"
              y="350"
              width="200"
              height="100"
              rx="6"
              fill="url(#workshopGradient)"
              filter="url(#shadow)"
              className={styles.roomRect}
            />
            <text x="640" y="395" className={styles.roomNameSmall}>2nd Floor Lobby</text>
            <text x="640" y="420" className={styles.roomCapacitySmall}>Couples</text>
          </g>

          {/* Stairs indicators */}
          <g className={styles.stairs}>
            <rect x="60" y="295" width="40" height="40" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" rx="4" />
            <path d="M 65 325 L 65 305 L 70 305 L 70 310 L 75 310 L 75 315 L 80 315 L 80 320 L 85 320 L 85 325 Z" fill="#9ca3af" />
            <text x="80" y="345" className={styles.stairsLabel}>Stairs</text>
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
