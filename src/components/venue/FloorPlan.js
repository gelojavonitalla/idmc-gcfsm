/**
 * FloorPlan Component
 * Interactive SVG-based floor plan with multiple floors, clickable rooms,
 * and session information display.
 *
 * @module components/venue/FloorPlan
 */

import { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import RoomDetailPanel from './RoomDetailPanel';
import {
  FLOORS,
  FLOOR_CONFIG,
  ROOM_TYPES,
  getRoomsByFloor,
  getRoomById,
  getEnabledFloors,
} from './floorPlanData';
import styles from './FloorPlan.module.css';

/**
 * FloorPlan Component
 * Renders an interactive SVG floor plan with floor selector and clickable rooms.
 *
 * @param {Object} props - Component props
 * @param {Array} [props.schedule] - Schedule data to show sessions in rooms
 * @param {Array} [props.workshops] - Workshop data to show in rooms
 * @param {boolean} [props.showEventRoomsOnly] - Only show rooms used for the event
 * @param {Array} [props.enabledFloors] - Override which floors to show
 * @returns {JSX.Element} The interactive floor plan component
 */
function FloorPlan({ schedule, workshops, showEventRoomsOnly = false, enabledFloors: enabledFloorsProp }) {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [hoveredRoom, setHoveredRoom] = useState(null);
  const [activeFloor, setActiveFloor] = useState(FLOORS.GROUND);

  /**
   * Get available floors based on props or config
   */
  const availableFloors = useMemo(() => {
    if (enabledFloorsProp) {
      return FLOOR_CONFIG.filter(f => enabledFloorsProp.includes(f.id));
    }
    return getEnabledFloors();
  }, [enabledFloorsProp]);

  /**
   * Get rooms for the active floor
   */
  const activeFloorRooms = useMemo(() => {
    const rooms = getRoomsByFloor(activeFloor);
    if (showEventRoomsOnly) {
      return rooms.filter(room => room.isEventRoom);
    }
    return rooms;
  }, [activeFloor, showEventRoomsOnly]);

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
   * Handles floor tab change
   *
   * @param {string} floorId - Floor identifier
   */
  const handleFloorChange = useCallback((floorId) => {
    setActiveFloor(floorId);
    setSelectedRoom(null);
    setHoveredRoom(null);
  }, []);

  /**
   * Gets sessions/workshops for a specific room
   *
   * @param {string} roomId - The room identifier
   * @returns {Array} Sessions in this room
   */
  const getSessionsForRoom = useCallback((roomId) => {
    const room = getRoomById(roomId);
    if (!room) return [];

    const roomSessions = [];

    if (schedule) {
      const scheduleSessions = schedule.filter(s => s.venue === room.name || s.venue === room.fullName);
      roomSessions.push(...scheduleSessions);
    }

    if (workshops) {
      const workshopSessions = workshops.filter(w => w.venue === room.name || w.venue === room.fullName);
      roomSessions.push(...workshopSessions);
    }

    return roomSessions;
  }, [schedule, workshops]);

  /**
   * Get gradient ID based on room type
   *
   * @param {string} type - Room type
   * @returns {string} Gradient ID
   */
  const getGradientId = (type) => {
    switch (type) {
      case ROOM_TYPES.MAIN:
        return 'url(#mainGradient)';
      case ROOM_TYPES.WORKSHOP:
        return 'url(#workshopGradient)';
      case ROOM_TYPES.SERVICE:
        return 'url(#serviceGradient)';
      case ROOM_TYPES.ADMIN:
        return 'url(#adminGradient)';
      case ROOM_TYPES.UTILITY:
        return 'url(#utilityGradient)';
      default:
        return 'url(#workshopGradient)';
    }
  };

  /**
   * Render a room group in SVG
   *
   * @param {Object} room - Room data
   * @returns {JSX.Element} SVG group for the room
   */
  const renderRoom = (room) => {
    const { coordinates } = room;
    if (!coordinates) return null;

    const centerX = coordinates.x + coordinates.width / 2;
    const centerY = coordinates.y + coordinates.height / 2;
    const isSmall = coordinates.width < 120 || coordinates.height < 80;

    return (
      <g
        key={room.id}
        className={`${styles.room} ${hoveredRoom === room.id ? styles.roomHovered : ''} ${selectedRoom?.id === room.id ? styles.roomSelected : ''}`}
        onClick={() => handleRoomClick(room)}
        onMouseEnter={() => setHoveredRoom(room.id)}
        onMouseLeave={() => setHoveredRoom(null)}
        onKeyDown={(e) => handleKeyDown(e, room)}
        tabIndex={0}
        role="button"
        aria-label={`${room.fullName || room.name} - Click for details`}
      >
        <rect
          x={coordinates.x}
          y={coordinates.y}
          width={coordinates.width}
          height={coordinates.height}
          rx="6"
          fill={getGradientId(room.type)}
          filter="url(#shadow)"
          className={styles.roomRect}
        />
        <text
          x={centerX}
          y={centerY - (isSmall ? 0 : 10)}
          className={isSmall ? styles.roomNameSmall : styles.roomName}
        >
          {room.name}
        </text>
        {!isSmall && room.workshopTrack && (
          <text x={centerX} y={centerY + 15} className={styles.roomCapacity}>
            {room.workshopTrack}
          </text>
        )}
      </g>
    );
  };

  /**
   * Render SVG definitions (gradients, filters)
   */
  const renderDefs = () => (
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
      <linearGradient id="adminGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#6d28d9" />
      </linearGradient>
      <linearGradient id="utilityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6b7280" />
        <stop offset="100%" stopColor="#4b5563" />
      </linearGradient>
    </defs>
  );

  /**
   * Get current floor config
   */
  const currentFloorConfig = FLOOR_CONFIG.find(f => f.id === activeFloor);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Interactive Floor Plan</h3>
        <p className={styles.subtitle}>Select a floor and click on a room to see details</p>
        <p className={styles.safetyNote}>
          <span className={styles.safetyIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
          Please familiarize yourself with the floor layout to easily locate your session rooms, restrooms, and emergency exits.
        </p>
      </div>

      <div className={styles.floorPlanWrapper}>
        {/* Floor Tabs */}
        <div className={styles.floorTabs}>
          {availableFloors.map((floor) => (
            <button
              key={floor.id}
              className={`${styles.floorTab} ${activeFloor === floor.id ? styles.floorTabActive : ''}`}
              onClick={() => handleFloorChange(floor.id)}
              aria-pressed={activeFloor === floor.id}
            >
              <span className={styles.floorTabLabel}>{floor.label}</span>
              <span className={styles.floorTabShort}>{floor.shortLabel}</span>
            </button>
          ))}
        </div>

        {/* Floor Description */}
        {currentFloorConfig && (
          <p className={styles.floorDescription}>{currentFloorConfig.description}</p>
        )}

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
          viewBox="0 0 800 600"
          className={styles.floorPlan}
          role="img"
          aria-label={`Interactive floor plan - ${currentFloorConfig?.label || 'Floor'}`}
        >
          {renderDefs()}

          {/* Background */}
          <rect width="800" height="600" fill="url(#grid)" />

          {/* Building Outline */}
          <rect
            x="40"
            y="30"
            width="720"
            height="540"
            fill="none"
            stroke="#374151"
            strokeWidth="3"
            rx="8"
          />

          {/* Floor Label */}
          <text x="60" y="60" className={styles.floorLabel}>
            {currentFloorConfig?.label || 'Floor Plan'}
          </text>

          {/* Render rooms for active floor */}
          {activeFloorRooms.map(renderRoom)}

          {/* Stairs indicator */}
          <g className={styles.stairs}>
            <rect x="60" y="520" width="40" height="40" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" rx="4" />
            <path d="M 65 550 L 65 530 L 70 530 L 70 535 L 75 535 L 75 540 L 80 540 L 80 545 L 85 545 L 85 550 Z" fill="#9ca3af" />
            <text x="80" y="575" className={styles.stairsLabel}>Stairs</text>
          </g>

          {/* Exit indicators for emergency */}
          <g className={styles.exitIndicator}>
            <text x="760" y="550" className={styles.exitLabel}>EXIT</text>
            <path d="M 750 555 L 770 555" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrow)" />
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
  showEventRoomsOnly: PropTypes.bool,
  enabledFloors: PropTypes.arrayOf(PropTypes.string),
};

export default FloorPlan;
