import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  WORKSHOP_CATEGORY_LABELS,
  WORKSHOP_CATEGORY_COLORS,
  WORKSHOP_CATEGORIES,
  WORKSHOP_TIME_SLOT_LABELS,
} from '../../constants';
import {
  groupWorkshopsByTimeSlot,
  hasAvailableCapacity,
  getRemainingCapacity,
} from '../../services/workshops';
import styles from './WorkshopSelector.module.css';

/**
 * WorkshopSelector Component
 * Allows attendees to select workshops during registration.
 * Workshops are grouped by time slot, and attendees can select one workshop per slot.
 *
 * @param {Object} props - Component props
 * @param {Array} props.workshops - Array of available workshop objects
 * @param {Array} props.selections - Current workshop selections (array of { sessionId, timeSlot })
 * @param {Function} props.onSelectionChange - Callback when selection changes
 * @param {boolean} [props.disabled=false] - Whether selection is disabled
 * @returns {JSX.Element} The workshop selector component
 */
function WorkshopSelector({ workshops, selections, onSelectionChange, disabled = false }) {
  /**
   * Groups workshops by time slot for display
   */
  const groupedWorkshops = useMemo(() => {
    return groupWorkshopsByTimeSlot(workshops);
  }, [workshops]);

  /**
   * Gets the currently selected workshop ID for a time slot
   *
   * @param {string} timeSlot - The time slot identifier
   * @returns {string} The selected workshop ID or empty string
   */
  const getSelectedWorkshopId = (timeSlot) => {
    const selection = selections.find((s) => s.timeSlot === timeSlot);
    return selection?.sessionId || '';
  };

  /**
   * Handles workshop selection change
   *
   * @param {string} timeSlot - The time slot identifier
   * @param {string} workshopId - The selected workshop ID
   */
  const handleSelectionChange = (timeSlot, workshopId) => {
    if (disabled) return;

    const selectedWorkshop = workshops.find((w) => w.id === workshopId);

    if (workshopId === '') {
      // Deselect
      const newSelections = selections.filter((s) => s.timeSlot !== timeSlot);
      onSelectionChange(newSelections);
    } else if (selectedWorkshop) {
      // Select or update
      const newSelections = selections.filter((s) => s.timeSlot !== timeSlot);
      newSelections.push({
        sessionId: workshopId,
        sessionTitle: selectedWorkshop.title,
        track: selectedWorkshop.track,
        timeSlot,
      });
      onSelectionChange(newSelections);
    }
  };

  /**
   * Gets category colors for styling
   *
   * @param {string} category - The category identifier
   * @returns {Object} Color object with background, border, and text
   */
  const getCategoryColors = (category) => {
    return WORKSHOP_CATEGORY_COLORS[category] || WORKSHOP_CATEGORY_COLORS[WORKSHOP_CATEGORIES.OTHER];
  };

  const timeSlotKeys = Object.keys(groupedWorkshops);

  if (timeSlotKeys.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No workshops available for selection.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Workshop Selection</h3>
        <p className={styles.description}>
          Select your preferred workshop for each time slot. Track 2 workshops require pre-registration.
        </p>
      </div>

      {timeSlotKeys.map((timeSlot) => {
        const slotWorkshops = groupedWorkshops[timeSlot];
        const selectedId = getSelectedWorkshopId(timeSlot);
        const slotLabel = WORKSHOP_TIME_SLOT_LABELS[timeSlot] || timeSlot;

        return (
          <div key={timeSlot} className={styles.timeSlotSection}>
            <h4 className={styles.timeSlotLabel}>{slotLabel}</h4>

            <div className={styles.workshopOptions}>
              {/* No selection option */}
              <label
                className={`${styles.workshopOption} ${selectedId === '' ? styles.selected : ''}`}
              >
                <input
                  type="radio"
                  name={`workshop-${timeSlot}`}
                  value=""
                  checked={selectedId === ''}
                  onChange={() => handleSelectionChange(timeSlot, '')}
                  disabled={disabled}
                  className={styles.radioInput}
                />
                <div className={styles.optionContent}>
                  <span className={styles.optionTitle}>No workshop selection</span>
                  <span className={styles.optionDescription}>
                    I will choose a Track 1 workshop on the day of the event
                  </span>
                </div>
              </label>

              {/* Workshop options */}
              {slotWorkshops.map((workshop) => {
                const isAvailable = hasAvailableCapacity(workshop);
                const remaining = getRemainingCapacity(workshop);
                const colors = getCategoryColors(workshop.category);
                const isSelected = selectedId === workshop.id;
                const isDisabled = disabled || (!isSelected && !isAvailable);

                return (
                  <label
                    key={workshop.id}
                    className={`
                      ${styles.workshopOption}
                      ${isSelected ? styles.selected : ''}
                      ${isDisabled ? styles.disabled : ''}
                    `}
                  >
                    <input
                      type="radio"
                      name={`workshop-${timeSlot}`}
                      value={workshop.id}
                      checked={isSelected}
                      onChange={() => handleSelectionChange(timeSlot, workshop.id)}
                      disabled={isDisabled}
                      className={styles.radioInput}
                    />
                    <div className={styles.optionContent}>
                      <div className={styles.optionHeader}>
                        <span
                          className={styles.categoryBadge}
                          style={{
                            backgroundColor: colors.background,
                            color: colors.text,
                            borderColor: colors.border,
                          }}
                        >
                          {WORKSHOP_CATEGORY_LABELS[workshop.category] || 'Workshop'}
                        </span>
                        {workshop.capacity !== null && workshop.capacity !== undefined && (
                          <span
                            className={`${styles.capacityBadge} ${
                              !isAvailable ? styles.full : remaining <= 10 ? styles.limited : ''
                            }`}
                          >
                            {!isAvailable ? 'Full' : `${remaining} spots left`}
                          </span>
                        )}
                      </div>
                      <span className={styles.optionTitle}>{workshop.title}</span>
                      {workshop.speakerNames && workshop.speakerNames.length > 0 && (
                        <span className={styles.optionSpeaker}>
                          {workshop.speakerNames.join(', ')}
                        </span>
                      )}
                      <span className={styles.optionVenue}>
                        {workshop.venue} | {workshop.time}
                        {workshop.endTime && ` - ${workshop.endTime}`}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

WorkshopSelector.propTypes = {
  workshops: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      time: PropTypes.string.isRequired,
      endTime: PropTypes.string,
      venue: PropTypes.string,
      track: PropTypes.string,
      category: PropTypes.string,
      capacity: PropTypes.number,
      registeredCount: PropTypes.number,
      timeSlot: PropTypes.string,
      speakerNames: PropTypes.arrayOf(PropTypes.string),
    })
  ).isRequired,
  selections: PropTypes.arrayOf(
    PropTypes.shape({
      sessionId: PropTypes.string.isRequired,
      sessionTitle: PropTypes.string,
      track: PropTypes.string,
      timeSlot: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSelectionChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default WorkshopSelector;
