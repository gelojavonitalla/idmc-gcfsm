/**
 * FAQAccordion Component
 * Displays a single FAQ item as an expandable/collapsible accordion.
 * Supports text highlighting for search results.
 *
 * @module components/faq/FAQAccordion
 */

import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import styles from './FAQAccordion.module.css';

/**
 * Escapes special regex characters in a string.
 * Uses a comprehensive character class that handles all regex metacharacters.
 *
 * @param {string} string - The string to escape
 * @returns {string} The escaped string safe for use in a RegExp
 */
function escapeRegExp(string) {
  if (!string) {
    return '';
  }
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Highlights matching text in a string.
 *
 * @param {string} text - The text to search within
 * @param {string} searchTerm - The term to highlight
 * @returns {JSX.Element|string} Text with highlighted matches or original text
 */
function highlightText(text, searchTerm) {
  if (!searchTerm || !text) {
    return text;
  }

  const escapedTerm = escapeRegExp(searchTerm);
  const regex = new RegExp(`(${escapedTerm})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const key = `${index}-${part}`;
    if (part.toLowerCase() === searchTerm.toLowerCase()) {
      return (
        <mark key={key} className={styles.highlight}>
          {part}
        </mark>
      );
    }
    return part;
  });
}

/**
 * FAQAccordion Component
 * Renders an expandable FAQ item with question and answer.
 *
 * @param {Object} props - Component props
 * @param {Object} props.faq - The FAQ item data
 * @param {string} props.faq.id - Unique identifier
 * @param {string} props.faq.question - The question text
 * @param {string} props.faq.answer - The answer text (can contain HTML)
 * @param {string} [props.searchTerm] - Optional search term for highlighting
 * @param {boolean} [props.defaultExpanded] - Whether to start expanded
 * @returns {JSX.Element} The accordion component
 */
function FAQAccordion({ faq, searchTerm, defaultExpanded }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  return (
    <div className={`${styles.accordion} ${isExpanded ? styles.expanded : ''}`}>
      <div
        className={styles.header}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={`faq-answer-${faq.id}`}
      >
        <span className={styles.question}>
          {highlightText(faq.question, searchTerm)}
        </span>
        <span className={styles.icon} aria-hidden="true">
          {isExpanded ? '−' : '+'}
        </span>
      </div>
      <div
        id={`faq-answer-${faq.id}`}
        className={styles.content}
        role="region"
        aria-labelledby={`faq-question-${faq.id}`}
        hidden={!isExpanded}
      >
        <div className={styles.answer}>
          {highlightText(faq.answer, searchTerm)}
        </div>
      </div>
    </div>
  );
}

FAQAccordion.propTypes = {
  faq: PropTypes.shape({
    id: PropTypes.string.isRequired,
    question: PropTypes.string.isRequired,
    answer: PropTypes.string.isRequired,
  }).isRequired,
  searchTerm: PropTypes.string,
  defaultExpanded: PropTypes.bool,
};

FAQAccordion.defaultProps = {
  searchTerm: '',
  defaultExpanded: false,
};

export default FAQAccordion;
