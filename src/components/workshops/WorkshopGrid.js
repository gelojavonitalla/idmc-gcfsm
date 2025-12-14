import PropTypes from 'prop-types';
import { WORKSHOP_TRACK_IDS, WORKSHOP_TRACK_LABELS } from '../../constants';
import { groupWorkshopsByTrack } from '../../services/workshops';
import WorkshopCard from './WorkshopCard';
import styles from './WorkshopGrid.module.css';

/**
 * WorkshopGrid Component
 * Displays workshops in a grid layout, organized by track.
 * Shows Track 1 and Track 2 workshops in separate sections.
 *
 * @param {Object} props - Component props
 * @param {Array} props.workshops - Array of workshop objects to display
 * @param {Function} props.onWorkshopClick - Callback when a workshop card is clicked
 * @param {boolean} [props.groupByTrack=true] - Whether to group workshops by track
 * @returns {JSX.Element} The workshop grid component
 */
function WorkshopGrid({ workshops, onWorkshopClick, groupByTrack = true }) {
  if (!workshops || workshops.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No workshops found.</p>
      </div>
    );
  }

  if (!groupByTrack) {
    return (
      <div className={styles.grid}>
        {workshops.map((workshop) => (
          <WorkshopCard
            key={workshop.id}
            workshop={workshop}
            onClick={onWorkshopClick}
          />
        ))}
      </div>
    );
  }

  const groupedWorkshops = groupWorkshopsByTrack(workshops);
  const trackOrder = [WORKSHOP_TRACK_IDS.TRACK_1, WORKSHOP_TRACK_IDS.TRACK_2];

  return (
    <div className={styles.container}>
      {trackOrder.map((trackId) => {
        const trackWorkshops = groupedWorkshops[trackId];
        if (!trackWorkshops || trackWorkshops.length === 0) {
          return null;
        }

        return (
          <section key={trackId} className={styles.trackSection}>
            <h2 className={styles.trackTitle}>
              {WORKSHOP_TRACK_LABELS[trackId]}
            </h2>
            <p className={styles.trackDescription}>
              {trackId === WORKSHOP_TRACK_IDS.TRACK_1
                ? 'Open to all attendees - no pre-registration required'
                : 'Select your preferred workshop during registration'}
            </p>
            <div className={styles.grid}>
              {trackWorkshops.map((workshop) => (
                <WorkshopCard
                  key={workshop.id}
                  workshop={workshop}
                  onClick={onWorkshopClick}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

WorkshopGrid.propTypes = {
  workshops: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      time: PropTypes.string.isRequired,
      track: PropTypes.string,
      category: PropTypes.string,
    })
  ).isRequired,
  onWorkshopClick: PropTypes.func.isRequired,
  groupByTrack: PropTypes.bool,
};

export default WorkshopGrid;
