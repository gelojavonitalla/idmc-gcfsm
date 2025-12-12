import Header from './Header';
import Footer from './Footer';
import styles from './Layout.module.css';

/**
 * Layout Component
 * Wraps page content with Header and Footer components.
 * Provides consistent page structure across the application.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content to render
 * @returns {JSX.Element} The layout wrapper component
 */
function Layout({ children }) {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );
}

export default Layout;
