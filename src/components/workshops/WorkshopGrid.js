import PropTypes from 'prop-types';
import WorkshopCard from './WorkshopCard';
import styles from './WorkshopGrid.module.css';

/**
 * WorkshopGrid Component
 * Displays workshops in a responsive grid layout.
 *
 * @param {Object} props - Component props
 * @param {Array} props.workshops - Array of workshop objects to display
 * @param {Function} props.onWorkshopClick - Callback when a workshop card is clicked
 * @returns {JSX.Element} The workshop grid component
 */
function WorkshopGrid({ workshops, onWorkshopClick }) {
  if (!workshops || workshops.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No workshops found.</p>
      </div>
    );
  }

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

WorkshopGrid.propTypes = {
  workshops: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      time: PropTypes.string.isRequired,
      category: PropTypes.string,
    })
  ).isRequired,
  onWorkshopClick: PropTypes.func.isRequired,
};

export default WorkshopGrid;
