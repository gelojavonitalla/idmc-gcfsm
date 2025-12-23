/**
 * StatsCard Component
 * Displays a single statistic with icon, value, and label.
 *
 * @module components/admin/StatsCard
 */

import PropTypes from 'prop-types';
import styles from './StatsCard.module.css';

/**
 * Icon components for stats cards
 */
const ICONS = {
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  confirmed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  pending: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  revenue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  checkin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
};

/**
 * Color variants for stats cards
 */
const VARIANTS = {
  primary: {
    background: 'rgba(6, 184, 75, 0.1)',
    iconBg: 'rgba(6, 184, 75, 0.2)',
    iconColor: '#06b84b',
  },
  blue: {
    background: 'rgba(59, 130, 246, 0.1)',
    iconBg: 'rgba(59, 130, 246, 0.2)',
    iconColor: '#3b82f6',
  },
  amber: {
    background: 'rgba(245, 158, 11, 0.1)',
    iconBg: 'rgba(245, 158, 11, 0.2)',
    iconColor: '#f59e0b',
  },
  purple: {
    background: 'rgba(139, 92, 246, 0.1)',
    iconBg: 'rgba(139, 92, 246, 0.2)',
    iconColor: '#8b5cf6',
  },
  teal: {
    background: 'rgba(20, 184, 166, 0.1)',
    iconBg: 'rgba(20, 184, 166, 0.2)',
    iconColor: '#14b8a6',
  },
};

/**
 * Formats a number with thousand separators
 *
 * @param {number} value - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(value) {
  if (value === null || value === undefined) {
    return '—';
  }
  return value.toLocaleString();
}

/**
 * Formats currency value
 *
 * @param {number} value - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency
 */
function formatCurrency(value, currency = 'PHP') {
  if (value === null || value === undefined) {
    return '—';
  }
  return `${currency} ${value.toLocaleString()}`;
}

/**
 * StatsCard Component
 *
 * @param {Object} props - Component props
 * @param {string} props.label - Stat label
 * @param {number} props.value - Stat value
 * @param {string} [props.icon] - Icon name
 * @param {string} [props.variant] - Color variant
 * @param {boolean} [props.isCurrency] - Format as currency
 * @param {string} [props.currency] - Currency code
 * @param {string} [props.change] - Change indicator (e.g., "+12%")
 * @param {boolean} [props.changePositive] - Is change positive
 * @param {boolean} [props.isLoading] - Show loading state
 * @returns {JSX.Element} The stats card component
 */
function StatsCard({
  label,
  value,
  icon = 'users',
  variant = 'primary',
  isCurrency = false,
  currency = 'PHP',
  change,
  changePositive,
  isLoading = false,
}) {
  const variantStyles = VARIANTS[variant] || VARIANTS.primary;
  const IconComponent = ICONS[icon] || ICONS.users;

  return (
    <div
      className={styles.card}
      style={{ backgroundColor: variantStyles.background }}
    >
      <div
        className={styles.iconWrapper}
        style={{
          backgroundColor: variantStyles.iconBg,
          color: variantStyles.iconColor,
        }}
      >
        {IconComponent}
      </div>
      <div className={styles.content}>
        <p className={styles.label}>{label}</p>
        {isLoading ? (
          <div className={styles.skeleton} />
        ) : (
          <p className={styles.value}>
            {isCurrency ? formatCurrency(value, currency) : formatNumber(value)}
          </p>
        )}
        {change && !isLoading && (
          <p
            className={`${styles.change} ${
              changePositive ? styles.changePositive : styles.changeNegative
            }`}
          >
            {changePositive ? '↑' : '↓'} {change}
          </p>
        )}
      </div>
    </div>
  );
}

StatsCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number,
  icon: PropTypes.oneOf(['users', 'confirmed', 'pending', 'revenue', 'checkin']),
  variant: PropTypes.oneOf(['primary', 'blue', 'amber', 'purple', 'teal']),
  isCurrency: PropTypes.bool,
  currency: PropTypes.string,
  change: PropTypes.string,
  changePositive: PropTypes.bool,
  isLoading: PropTypes.bool,
};

export default StatsCard;
