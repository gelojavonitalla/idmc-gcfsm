import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { HomePage, RegisterPage, SpeakersPage, SchedulePage } from './pages';
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
      <Layout>
        <Routes>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.SPEAKERS} element={<SpeakersPage />} />
          <Route path={ROUTES.SCHEDULE} element={<SchedulePage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path={ROUTES.FAQ} element={<PlaceholderPage title="FAQ" />} />
          <Route path={ROUTES.ABOUT} element={<PlaceholderPage title="About" />} />
          <Route path={ROUTES.VENUE} element={<PlaceholderPage title="Venue" />} />
          <Route path={ROUTES.PRIVACY} element={<PlaceholderPage title="Privacy Policy" />} />
          <Route path={ROUTES.TERMS} element={<PlaceholderPage title="Terms of Service" />} />
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
