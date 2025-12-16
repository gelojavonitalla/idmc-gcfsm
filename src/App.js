import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, ScrollToTop } from './components/layout';
import { ProtectedRoute } from './components/auth';
import { AdminProtectedRoute } from './components/admin';
import { AuthProvider, AdminAuthProvider, SettingsProvider } from './context';
import {
  HomePage,
  RegisterPage,
  RegistrationStatusPage,
  SpeakersPage,
  SchedulePage,
  FAQPage,
  AboutPage,
  VenuePage,
  ContactPage,
  DownloadsPage,
  PrivacyPolicyPage,
  TermsOfServicePage,
  IDMC2025Page,
  MaintenancePage,
} from './pages';
import { AdminLoginPage, AdminDashboardPage, AdminSettingsPage, AdminUsersPage, AdminActivityPage, AdminSpeakersPage, AdminSchedulePage, AdminFAQPage, AdminDownloadsPage, AdminAboutPage, AdminLegalPage, AdminRegistrationsPage, AdminVenuePage } from './pages/admin';
import { ROUTES, ADMIN_ROUTES, IDMC_TEAM_ROLES } from './constants';
import './index.css';

/**
 * App Component
 * Root component that sets up routing and layout for the IDMC Event Site.
 *
 * @returns {JSX.Element} The application root component
 */
function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Admin Routes - No public layout */}
            <Route path={ADMIN_ROUTES.LOGIN} element={<AdminLoginPage />} />
            <Route
              path={ADMIN_ROUTES.ROOT}
              element={<Navigate to={ADMIN_ROUTES.DASHBOARD} replace />}
            />
            <Route
              path={ADMIN_ROUTES.DASHBOARD}
              element={
                <AdminProtectedRoute>
                  <AdminDashboardPage />
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.SETTINGS}
              element={
                <AdminProtectedRoute>
                  <AdminSettingsPage />
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.USERS}
              element={
                <AdminProtectedRoute requiredRole="superadmin">
                  <AdminUsersPage />
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.ACTIVITY}
              element={
                <AdminProtectedRoute>
                  <AdminActivityPage />
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.SPEAKERS}
              element={
                <AdminProtectedRoute>
                  <AdminSpeakersPage />
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.SCHEDULE}
              element={
                <AdminProtectedRoute>
                  <AdminSchedulePage />
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.FAQ}
              element={
                <AdminProtectedRoute>
                  <AdminFAQPage />
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.DOWNLOADS}
              element={
                <AdminProtectedRoute>
                  <AdminDownloadsPage />
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.ABOUT_CONTENT}
              element={
                <AdminProtectedRoute>
                  <AdminAboutPage />
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.LEGAL}
              element={
                <AdminProtectedRoute>
                  <AdminLegalPage />
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.REGISTRATIONS}
              element={
                <AdminProtectedRoute>
                  <AdminRegistrationsPage />
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.VENUE}
              element={
                <AdminProtectedRoute>
                  <AdminVenuePage />
                </AdminProtectedRoute>
              }
            />
            {/* Placeholder admin routes - to be implemented in later phases */}
            <Route
              path={`${ADMIN_ROUTES.ROOT}/*`}
              element={
                <AdminProtectedRoute>
                  <AdminDashboardPage />
                </AdminProtectedRoute>
              }
            />

            {/* Public Routes - With public layout */}
            <Route
              path="*"
              element={
                <SettingsProvider>
                  <Layout>
                    <Routes>
                    <Route path={ROUTES.HOME} element={<HomePage />} />
                    <Route path={ROUTES.SPEAKERS} element={<SpeakersPage />} />
                    <Route path={ROUTES.SCHEDULE} element={<SchedulePage />} />
                    <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
                    <Route path={ROUTES.REGISTRATION_STATUS} element={<RegistrationStatusPage />} />
                    <Route path={ROUTES.FAQ} element={<FAQPage />} />
                    <Route path={ROUTES.ABOUT} element={<AboutPage />} />
                    <Route path={ROUTES.VENUE} element={<VenuePage />} />
                    <Route path={ROUTES.CONTACT} element={<ContactPage />} />
                    <Route path={ROUTES.DOWNLOADS} element={<DownloadsPage />} />
                    <Route path={ROUTES.PRIVACY} element={<PrivacyPolicyPage />} />
                    <Route path={ROUTES.TERMS} element={<TermsOfServicePage />} />
                    <Route path={ROUTES.IDMC_2025} element={<IDMC2025Page />} />
                    <Route
                      path={ROUTES.MAINTENANCE}
                      element={
                        <ProtectedRoute allowedRoles={IDMC_TEAM_ROLES}>
                          <MaintenancePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<PlaceholderPage title="404 - Page Not Found" />} />
                    </Routes>
                  </Layout>
                </SettingsProvider>
              }
            />
          </Routes>
        </BrowserRouter>
      </AdminAuthProvider>
    </AuthProvider>
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
