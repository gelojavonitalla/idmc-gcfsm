/**
 * RegistrationChart Component
 * Displays registration trends over time using a line/area chart.
 *
 * @module components/admin/RegistrationChart
 */

import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import styles from './RegistrationChart.module.css';

/**
 * Custom tooltip component for the chart
 *
 * @param {Object} props - Tooltip props
 * @returns {JSX.Element|null} Tooltip element
 */
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipLabel}>{label}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            className={styles.tooltipValue}
            style={{ color: entry.color }}
          >
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
};

/**
 * RegistrationChart Component
 *
 * @param {Object} props - Component props
 * @param {Array} props.data - Chart data array
 * @param {string} [props.title] - Chart title
 * @param {string} [props.period] - Time period label
 * @param {boolean} [props.isLoading] - Loading state
 * @param {boolean} [props.showRevenue] - Show revenue line
 * @returns {JSX.Element} The registration chart component
 */
function RegistrationChart({
  data = [],
  title = 'Registration Trends',
  period = 'Last 30 Days',
  isLoading = false,
  showRevenue = false,
}) {
  /**
   * Generate sample data if no data provided
   */
  const chartData = useMemo(() => {
    if (data && data.length > 0) {
      return data;
    }

    const sampleData = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      sampleData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        registrations: Math.floor(Math.random() * 15) + 2,
        revenue: (Math.floor(Math.random() * 15) + 2) * 500,
      });
    }
    return sampleData;
  }, [data]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <span className={styles.period}>{period}</span>
        </div>
        <div className={styles.chartSkeleton}>
          <div className={styles.skeletonBar} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <span className={styles.period}>{period}</span>
      </div>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b84b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b84b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              dy={10}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="registrations"
              name="Registrations"
              stroke="#06b84b"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRegistrations)"
            />
            {showRevenue && (
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ backgroundColor: '#06b84b' }} />
          <span>Registrations</span>
        </div>
        {showRevenue && (
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: '#3b82f6' }} />
            <span>Revenue</span>
          </div>
        )}
      </div>
    </div>
  );
}

RegistrationChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      registrations: PropTypes.number.isRequired,
      revenue: PropTypes.number,
    })
  ),
  title: PropTypes.string,
  period: PropTypes.string,
  isLoading: PropTypes.bool,
  showRevenue: PropTypes.bool,
};

export default RegistrationChart;
