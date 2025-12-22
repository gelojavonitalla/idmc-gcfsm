import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSettings } from '../../context';
import { NAV_ITEMS } from '../../constants';
import styles from './Header.module.css';

/**
 * Header Component
 * Displays the site navigation header with logo, navigation links, and mobile hamburger menu.
 * Becomes sticky on scroll for desktop devices.
 *
 * @returns {JSX.Element} The header navigation component
 */
function Header() {
  const { settings } = useSettings();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    /**
     * Handles scroll events to toggle sticky header state
     */
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Close mobile menu on route change
    setIsMenuOpen(false);
  }, [location.pathname]);

  /**
   * Toggles the mobile menu open/closed state
   */
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  /**
   * Closes the mobile menu
   */
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  /**
   * Checks if a navigation item is currently active
   * @param {string} path - The path to check
   * @returns {boolean} Whether the path is active
   */
  const isActive = (path) => {
    return location.pathname === path;
  };

  /**
   * Handles anchor link navigation with smooth scrolling
   * @param {Event} e - The click event
   * @param {string} path - The anchor path (e.g., '/#speakers')
   */
  const handleAnchorClick = (e, path) => {
    e.preventDefault();
    closeMenu();

    const hash = path.split('#')[1];
    const element = document.getElementById(hash);

    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <Link
          to="/"
          className={`${styles.logo} ${isHomePage && !isScrolled ? styles.logoHidden : ''}`}
          onClick={closeMenu}
        >
          <span className={styles.logoText}>IDMC</span>
          <span className={styles.logoYear}>{settings.year}</span>
        </Link>

        <button
          className={`${styles.hamburger} ${isMenuOpen ? styles.open : ''}`}
          onClick={toggleMenu}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
        >
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
        </button>

        <nav
          className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}
          aria-label="Main navigation"
        >
          <ul className={styles.navList}>
            {NAV_ITEMS.map((item) => (
              <li key={item.path} className={styles.navItem}>
                {item.isAnchor ? (
                  <a
                    href={item.path}
                    className={`${styles.navLink} ${
                      item.isPrimary ? styles.navLinkPrimary : ''
                    }`}
                    onClick={(e) => handleAnchorClick(e, item.path)}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    to={item.path}
                    className={`${styles.navLink} ${
                      item.isPrimary ? styles.navLinkPrimary : ''
                    } ${isActive(item.path) ? styles.navLinkActive : ''}`}
                    onClick={closeMenu}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;
