import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout, ScrollToTop } from './components/layout';
import {
  HomePage,
  RegisterPage,
  SpeakersPage,
  SchedulePage,
  FAQPage,
  AboutPage,
  VenuePage,
  ContactPage,
  DownloadsPage,
  PrivacyPolicyPage,
  TermsOfServicePage,
} from './pages';
import { ROUTES } from './constants';
import './index.css';

/**
 * App Component
 * Root component that sets up routing and layout for the IDMC Event Site.
 *
 * @returns {JSX.Element} The application root component
 */
function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.SPEAKERS} element={<SpeakersPage />} />
          <Route path={ROUTES.SCHEDULE} element={<SchedulePage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path={ROUTES.FAQ} element={<FAQPage />} />
          <Route path={ROUTES.ABOUT} element={<AboutPage />} />
          <Route path={ROUTES.VENUE} element={<VenuePage />} />
          <Route path={ROUTES.CONTACT} element={<ContactPage />} />
          <Route path={ROUTES.DOWNLOADS} element={<DownloadsPage />} />
          <Route path={ROUTES.PRIVACY} element={<PrivacyPolicyPage />} />
          <Route path={ROUTES.TERMS} element={<TermsOfServicePage />} />
          <Route path="*" element={<PlaceholderPage title="404 - Page Not Found" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

/**
 * PlaceholderPage Component
 * Temporary placeholder for pages not yet implemented.
 *
 * @param {Object} props - Component props
 * @param {string} props.title - The page title to display
 * @returns {JSX.Element} A placeholder page component
 */
function PlaceholderPage({ title }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '2rem',
        textAlign: 'center',
        paddingTop: 'calc(var(--header-height) + 2rem)',
      }}
    >
      <h1>{title}</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginTop: '1rem' }}>
        This page is coming soon.
      </p>
    </div>
  );
}

export default App;
