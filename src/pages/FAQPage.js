/**
 * FAQPage Component
 * Public-facing page that displays frequently asked questions.
 * Features search functionality, category filtering, and accordion display.
 *
 * @module pages/FAQPage
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FAQAccordion, FAQSearch, FAQCategoryTabs } from '../components/faq';
import { getPublishedFAQs } from '../services/faq';
import {
  FAQ_SEED_DATA,
  FAQ_CATEGORIES,
  FAQ_CATEGORY_LABELS,
  CONFERENCE,
  ROUTES,
} from '../constants';
import styles from './FAQPage.module.css';

/**
 * All categories filter value
 */
const ALL_CATEGORIES = 'all';

/**
 * FAQPage Component
 * Renders the FAQ page with search, category filtering, and accordion display.
 *
 * @returns {JSX.Element} The FAQ page component
 */
function FAQPage() {
  const [faqs, setFaqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);

  /**
   * Fetches published FAQs from Firestore on component mount
   */
  useEffect(() => {
    async function fetchFAQs() {
      try {
        setIsLoading(true);
        const fetchedFAQs = await getPublishedFAQs();
        if (fetchedFAQs.length > 0) {
          setFaqs(fetchedFAQs);
        } else {
          setFaqs(FAQ_SEED_DATA);
        }
      } catch (error) {
        console.error('Failed to fetch FAQs from database:', error);
        setFaqs(FAQ_SEED_DATA);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFAQs();
  }, []);

  /**
   * Filters FAQs based on search term and selected category
   */
  const filteredFAQs = useMemo(() => {
    let filtered = faqs;

    if (selectedCategory !== ALL_CATEGORIES) {
      filtered = filtered.filter((faq) => faq.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (faq) =>
          faq.question.toLowerCase().includes(term) ||
          faq.answer.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [faqs, selectedCategory, searchTerm]);

  /**
   * Groups FAQs by category for display.
   * Uses 'search' as key when search is active to indicate cross-category results.
   */
  const groupedFAQs = useMemo(() => {
    if (searchTerm.trim()) {
      return { search: filteredFAQs };
    }

    if (selectedCategory !== ALL_CATEGORIES) {
      return { [selectedCategory]: filteredFAQs };
    }

    const groups = {};
    Object.values(FAQ_CATEGORIES).forEach((category) => {
      groups[category] = filteredFAQs.filter((faq) => faq.category === category);
    });
    return groups;
  }, [filteredFAQs, selectedCategory, searchTerm]);

  /**
   * Counts FAQs per category for display in tabs
   */
  const categoryCounts = useMemo(() => {
    const counts = {};
    Object.values(FAQ_CATEGORIES).forEach((category) => {
      counts[category] = faqs.filter((faq) => faq.category === category).length;
    });
    return counts;
  }, [faqs]);

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    if (value.trim()) {
      setSelectedCategory(ALL_CATEGORIES);
    }
  }, []);

  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
    setSearchTerm('');
  }, []);

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className="container">
          <h1 className={styles.heroTitle}>Frequently Asked Questions</h1>
          <p className={styles.heroSubtitle}>
            Find answers to common questions about IDMC {CONFERENCE.YEAR}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className={styles.contentSection}>
        <div className="container">
          {/* Search Box */}
          <FAQSearch
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search questions..."
          />

          {/* Category Tabs */}
          <FAQCategoryTabs
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            categoryCounts={categoryCounts}
          />

          {/* Loading State */}
          {isLoading && (
            <div className={styles.loadingState}>
              <p>Loading FAQs...</p>
            </div>
          )}

          {/* FAQ Content */}
          {!isLoading && (
            <>
              {filteredFAQs.length === 0 ? (
                <div className={styles.emptyState}>
                  {searchTerm ? (
                    <>
                      <p className={styles.emptyTitle}>No results found</p>
                      <p className={styles.emptyText}>
                        No questions match &quot;{searchTerm}&quot;. Try different keywords
                        or browse by category.
                      </p>
                      <button
                        type="button"
                        className={styles.clearButton}
                        onClick={() => handleSearchChange('')}
                      >
                        Clear Search
                      </button>
                    </>
                  ) : (
                    <p className={styles.emptyText}>
                      No questions in this category yet.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {searchTerm && (
                    <p className={styles.resultsCount}>
                      Found {filteredFAQs.length} result
                      {filteredFAQs.length !== 1 ? 's' : ''}
                    </p>
                  )}

                  {Object.entries(groupedFAQs).map(([category, categoryFaqs]) => {
                    if (categoryFaqs.length === 0) {
                      return null;
                    }

                    const showCategoryHeader =
                      selectedCategory === ALL_CATEGORIES && !searchTerm.trim();

                    return (
                      <div key={category} className={styles.categorySection}>
                        {showCategoryHeader && (
                          <h2 className={styles.categoryTitle}>
                            {FAQ_CATEGORY_LABELS[category] || category}
                          </h2>
                        )}
                        <div className={styles.faqList}>
                          {categoryFaqs.map((faq) => (
                            <FAQAccordion
                              key={faq.id}
                              faq={faq}
                              searchTerm={searchTerm}
                              defaultExpanded={!!searchTerm && filteredFAQs.length === 1}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className="container">
          <h2 className={styles.ctaTitle}>Still have questions?</h2>
          <p className={styles.ctaText}>
            Can&apos;t find what you&apos;re looking for? Feel free to reach out to us.
          </p>
          <Link to={ROUTES.CONTACT} className={styles.ctaButton}>
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}

export default FAQPage;
