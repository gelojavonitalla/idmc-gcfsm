import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, ScrollToTop } from './components/layout';
import { ProtectedRoute } from './components/auth';
import { AdminProtectedRoute, AdminLoadingFallback } from './components/admin';
import { AuthProvider, AdminAuthProvider, SettingsProvider, ToastProvider } from './context';
import ToastContainer from './components/ui/Toast';
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
  FeedbackPage,
} from './pages';
import { ROUTES, ADMIN_ROUTES, IDMC_TEAM_ROLES } from './constants';
import './index.css';

/**
 * Lazy-loaded admin pages for code splitting.
 * These pages are only loaded when the user navigates to admin routes,
 * reducing initial bundle size for public website visitors.
 */
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminPasswordSetupPage = lazy(() => import('./pages/admin/AdminPasswordSetupPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminActivityPage = lazy(() => import('./pages/admin/AdminActivityPage'));
const AdminSpeakersPage = lazy(() => import('./pages/admin/AdminSpeakersPage'));
const AdminSchedulePage = lazy(() => import('./pages/admin/AdminSchedulePage'));
const AdminFAQPage = lazy(() => import('./pages/admin/AdminFAQPage'));
const AdminDownloadsPage = lazy(() => import('./pages/admin/AdminDownloadsPage'));
const AdminAboutPage = lazy(() => import('./pages/admin/AdminAboutPage'));
const AdminLegalPage = lazy(() => import('./pages/admin/AdminLegalPage'));
const AdminRegistrationsPage = lazy(() => import('./pages/admin/AdminRegistrationsPage'));
const AdminVenuePage = lazy(() => import('./pages/admin/AdminVenuePage'));
const AdminCheckInPage = lazy(() => import('./pages/admin/AdminCheckInPage'));
const AdminCheckInMonitorPage = lazy(() => import('./pages/admin/AdminCheckInMonitorPage'));
const AdminInquiriesPage = lazy(() => import('./pages/admin/AdminInquiriesPage'));
const AdminBankAccountsPage = lazy(() => import('./pages/admin/AdminBankAccountsPage'));
const AdminInvoicesPage = lazy(() => import('./pages/admin/AdminInvoicesPage'));
const AdminFinanceDashboardPage = lazy(() => import('./pages/admin/AdminFinanceDashboardPage'));
const AdminWorkshopsPage = lazy(() => import('./pages/admin/AdminWorkshopsPage'));
const AdminFoodMenuPage = lazy(() => import('./pages/admin/AdminFoodMenuPage'));
const AdminWhatToBringPage = lazy(() => import('./pages/admin/AdminWhatToBringPage'));
const AdminChurchesPage = lazy(() => import('./pages/admin/AdminChurchesPage'));
const AdminFeedbackPage = lazy(() => import('./pages/admin/AdminFeedbackPage'));

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
        <SettingsProvider>
          <ToastProvider>
            <BrowserRouter>
              <ScrollToTop />
              <ToastContainer />
              <Routes>
            {/* Admin Routes - Lazy loaded for code splitting */}
            <Route
              path={ADMIN_ROUTES.LOGIN}
              element={
                <Suspense fallback={<AdminLoadingFallback />}>
                  <AdminLoginPage />
                </Suspense>
              }
            />
            <Route
              path={ADMIN_ROUTES.PASSWORD_SETUP}
              element={
                <Suspense fallback={<AdminLoadingFallback />}>
                  <AdminPasswordSetupPage />
                </Suspense>
              }
            />
            <Route
              path={ADMIN_ROUTES.ROOT}
              element={<Navigate to={ADMIN_ROUTES.DASHBOARD} replace />}
            />
            <Route
              path={ADMIN_ROUTES.DASHBOARD}
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminDashboardPage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.SETTINGS}
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminSettingsPage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.USERS}
              element={
                <AdminProtectedRoute requiredRole="superadmin">
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminUsersPage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.ACTIVITY}
              element={
                <AdminProtectedRoute requiredPermission="viewActivityLog">
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminActivityPage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.SPEAKERS}
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminSpeakersPage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.SCHEDULE}
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminSchedulePage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.WORKSHOPS}
              element={
                <AdminProtectedRoute requiredPermission="manageWorkshops">
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminWorkshopsPage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.FAQ}
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminFAQPage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.DOWNLOADS}
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminDownloadsPage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.ABOUT_CONTENT}
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminAboutPage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.LEGAL}
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminLegalPage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.REGISTRATIONS}
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminRegistrationsPage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.VENUE}
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminVenuePage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.CHECKIN}
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminCheckInPage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.CHECKIN_MONITOR}
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminCheckInMonitorPage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.INQUIRIES}
              element={
                <AdminProtectedRoute requiredPermission="manageInquiries">
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminInquiriesPage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.BANK_ACCOUNTS}
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminBankAccountsPage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.INVOICES}
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminInvoicesPage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.FINANCE_DASHBOARD}
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminFinanceDashboardPage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.FOOD_MENU}
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminFoodMenuPage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.WHAT_TO_BRING}
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminWhatToBringPage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.CHURCHES_BREAKDOWN}
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminChurchesPage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path={ADMIN_ROUTES.FEEDBACK}
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminFeedbackPage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            {/* Fallback admin route */}
            <Route
              path={`${ADMIN_ROUTES.ROOT}/*`}
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminDashboardPage />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />

            {/* Public Routes - With public layout */}
            <Route
              path="*"
              element={
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
                    <Route path={ROUTES.FEEDBACK} element={<FeedbackPage />} />
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
              }
            />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </SettingsProvider>
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
