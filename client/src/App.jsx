import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import LandingPage from './components/LandingPage';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import UserProfile from './components/UserProfile';
import BusinessOnboardingForm from './components/BusinessOnboardingForm';
import BusinessDashboardPlaceholder from './components/BusinessDashboardPlaceholder';
import CustomerManagement from './components/CustomerManagement';
import ServiceManagement from './components/ServiceManagement';
import StaffManagement from './components/StaffManagement';
import BookingManagement from './components/BookingManagement';
import StaffDashboard from './components/StaffDashboard';
import CustomerPortal from './components/CustomerPortal';
import OwnerCalendar from './components/OwnerCalendar';
import OwnerReviews from './components/OwnerReviews';
import OwnerPerformance from './components/OwnerPerformance';
import OwnerOpportunities from './components/OwnerOpportunities';
import BusinessSettings from './components/BusinessSettings';
import BusinessSetupModal from './components/BusinessSetupModal';
import ChangePasswordForm from './components/ChangePasswordForm';
import LoadingState from './components/ui/LoadingState';
import { apiRequest, getAccessToken, refreshAccessToken, setAccessToken } from './services/api';
import {
  getTabFromPath,
  getPathFromTab,
  normalizePathname,
  VALID_CUSTOMER_TABS,
  VALID_OWNER_TABS,
  VALID_STAFF_TABS,
} from './utils/routing';

// Coalesce initial session restoration across React.StrictMode double-mounts
// so single-use refresh token rotation is never triggered twice on refresh.
let activeRestorePromise = null;

export default function App() {
  const [activeTab, setActiveTabState] = useState(() => getTabFromPath(window.location.pathname) || 'landing');
  const [activeRole, setActiveRole] = useState('customer'); // 'customer' | 'staff' | 'owner'
  const [currentUser, setCurrentUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [loginRoleError, setLoginRoleError] = useState(null);
  const [authRoleMode, setAuthRoleMode] = useState('customer');
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [customerBrowseKey, setCustomerBrowseKey] = useState(0);

  const setActiveTab = useCallback((tab, { replace = false } = {}) => {
    setActiveTabState(tab);
    const targetPath = getPathFromTab(tab);
    if (normalizePathname(window.location.pathname) !== targetPath) {
      if (replace) {
        window.history.replaceState({ tab }, '', targetPath);
      } else {
        window.history.pushState({ tab }, '', targetPath);
      }
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const tabFromUrl = getTabFromPath(window.location.pathname) || 'landing';
      setActiveTabState(tabFromUrl);
      if (VALID_OWNER_TABS.includes(tabFromUrl) && tabFromUrl !== 'account') {
        setActiveRole('owner');
      } else if (tabFromUrl === 'staff-dashboard') {
        setActiveRole('staff');
      } else if (VALID_CUSTOMER_TABS.includes(tabFromUrl) && tabFromUrl !== 'account') {
        setActiveRole('customer');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const fetchUserBusinesses = useCallback(async () => {
    try {
      const response = await apiRequest('/businesses', { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        const bizList = data.data || [];
        setBusinesses(bizList);
        if (bizList.length > 0) {
          const savedBizId = sessionStorage.getItem('servicehub_selected_business_id');
          const matchedBiz = savedBizId ? bizList.find((b) => b.id === savedBizId) : null;
          setSelectedBusiness(matchedBiz || bizList[0]);
          return bizList;
        }
      }
    } catch (err) {
      console.error('Failed to fetch user businesses:', err);
    }
    return [];
  }, []);

  // Persist current tab, role, and selected business in sessionStorage for page refresh restoration
  useEffect(() => {
    if (!initializing && currentUser) {
      sessionStorage.setItem('servicehub_active_tab', activeTab);
      sessionStorage.setItem('servicehub_active_role', activeRole);
    }
  }, [activeTab, activeRole, currentUser, initializing]);

  useEffect(() => {
    if (!initializing && currentUser && selectedBusiness?.id) {
      sessionStorage.setItem('servicehub_selected_business_id', selectedBusiness.id);
    }
  }, [selectedBusiness?.id, currentUser, initializing]);

  // Silent session restore on initial page load
  useEffect(() => {
    let isMounted = true;
    const urlTab = getTabFromPath(window.location.pathname);

    async function performSessionRestore() {
      const token = getAccessToken() || (await refreshAccessToken());
      if (!token) {
        return { authenticated: false };
      }

      const meResponse = await apiRequest('/auth/me', { method: 'GET' });
      if (!meResponse.ok) {
        return { authenticated: false };
      }

      const meData = await meResponse.json();
      const user = meData?.data?.user;
      if (!user) {
        return { authenticated: false };
      }

      let bizList = [];
      try {
        const bizResponse = await apiRequest('/businesses', { method: 'GET' });
        if (bizResponse.ok) {
          const bizData = await bizResponse.json();
          bizList = bizData.data || [];
        }
      } catch (err) {
        console.error('Failed to fetch user businesses:', err);
      }

      return { authenticated: true, user, bizList };
    }

    if (!activeRestorePromise) {
      activeRestorePromise = performSessionRestore().finally(() => {
        activeRestorePromise = null;
      });
    }

    activeRestorePromise
      .then((result) => {
        if (!isMounted) return;

        if (!result?.authenticated) {
          const isPublicUrl = !urlTab || ['landing', 'login', 'register'].includes(urlTab);
          if (isPublicUrl) {
            setActiveTabState(urlTab || 'landing');
          } else {
            sessionStorage.setItem('servicehub_redirect_tab', urlTab);
            setAuthRoleMode(
              VALID_OWNER_TABS.includes(urlTab) && urlTab !== 'account'
                ? 'owner'
                : urlTab === 'staff-dashboard'
                ? 'staff'
                : 'customer'
            );
            setActiveTab('login', { replace: true });
          }
          return;
        }

        const { user, bizList } = result;
        setBusinesses(bizList);
        if (bizList.length > 0) {
          const savedBizId = sessionStorage.getItem('servicehub_selected_business_id');
          const matchedBiz = savedBizId ? bizList.find((b) => b.id === savedBizId) : null;
          setSelectedBusiness(matchedBiz || bizList[0]);
        }

        const savedRole = sessionStorage.getItem('servicehub_active_role');
        const savedTab = sessionStorage.getItem('servicehub_active_tab');

        const hasOwnerRole = bizList.some((b) => b.currentUserRole === 'OWNER' || b.currentUserRole === 'ADMIN');
        const hasStaffRole = bizList.some((b) => b.currentUserRole === 'STAFF');
        const isPublicEntryUrl = !urlTab || ['landing', 'login', 'register'].includes(urlTab);

        if (hasOwnerRole) {
          if (urlTab && VALID_CUSTOMER_TABS.includes(urlTab) && urlTab !== 'account') {
            setActiveRole('customer');
            setActiveTab(urlTab, { replace: true });
          } else if (urlTab === 'staff-dashboard' && hasStaffRole) {
            setActiveRole('staff');
            setActiveTab('staff-dashboard', { replace: true });
          } else if (urlTab && VALID_OWNER_TABS.includes(urlTab)) {
            const resolvedOwnerTab = bizList.length > 0 && urlTab === 'onboarding' ? 'dashboard' : urlTab;
            setActiveRole('owner');
            setActiveTab(resolvedOwnerTab, { replace: true });
          } else if (isPublicEntryUrl) {
            if (savedRole === 'customer' && savedTab && VALID_CUSTOMER_TABS.includes(savedTab)) {
              setActiveRole('customer');
              setActiveTab(savedTab, { replace: true });
            } else if (savedRole === 'staff' && hasStaffRole) {
              setActiveRole('staff');
              setActiveTab(savedTab && VALID_STAFF_TABS.includes(savedTab) ? savedTab : 'staff-dashboard', { replace: true });
            } else {
              let resolvedOwnerTab = savedTab && VALID_OWNER_TABS.includes(savedTab) ? savedTab : 'dashboard';
              if (bizList.length > 0 && resolvedOwnerTab === 'onboarding') {
                resolvedOwnerTab = 'dashboard';
              }
              setActiveRole('owner');
              setActiveTab(resolvedOwnerTab, { replace: true });
            }
          } else {
            setActiveRole('owner');
            setActiveTab('dashboard', { replace: true });
          }
        } else if (hasStaffRole) {
          if (urlTab && VALID_CUSTOMER_TABS.includes(urlTab) && urlTab !== 'account') {
            setActiveRole('customer');
            setActiveTab(urlTab, { replace: true });
          } else if (urlTab && VALID_STAFF_TABS.includes(urlTab)) {
            setActiveRole('staff');
            setActiveTab(urlTab, { replace: true });
          } else if (savedRole === 'customer' && savedTab && VALID_CUSTOMER_TABS.includes(savedTab)) {
            setActiveRole('customer');
            setActiveTab(savedTab, { replace: true });
          } else {
            setActiveRole('staff');
            setActiveTab(savedTab && VALID_STAFF_TABS.includes(savedTab) ? savedTab : 'staff-dashboard', { replace: true });
          }
        } else {
          // Pure Customer (No business staff/owner memberships)
          setActiveRole('customer');
          const targetCustomerTab =
            urlTab && VALID_CUSTOMER_TABS.includes(urlTab)
              ? urlTab
              : savedTab && VALID_CUSTOMER_TABS.includes(savedTab)
              ? savedTab
              : 'customer-portal';
          setActiveTab(targetCustomerTab, { replace: true });
        }

        setCurrentUser(user);
      })
      .catch(() => {
        if (!isMounted) return;
        const isPublicUrl = !urlTab || ['landing', 'login', 'register'].includes(urlTab);
        if (isPublicUrl) {
          setActiveTabState(urlTab || 'landing');
        } else {
          sessionStorage.setItem('servicehub_redirect_tab', urlTab);
          setActiveTab('login', { replace: true });
        }
      })
      .finally(() => {
        if (isMounted) {
          setInitializing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [setActiveTab]);

  const handleLoginSuccess = async (user, selectedRole) => {
    setLoginRoleError(null);
    const userBizs = await fetchUserBusinesses();
    const urlTab = getTabFromPath(window.location.pathname);
    const savedRedirectTab = sessionStorage.getItem('servicehub_redirect_tab');
    sessionStorage.removeItem('servicehub_redirect_tab');
    const intendedTab = savedRedirectTab || (urlTab && !['landing', 'login', 'register'].includes(urlTab) ? urlTab : null);

    const hasOwnerRole = userBizs.some((b) => b.currentUserRole === 'OWNER' || b.currentUserRole === 'ADMIN');
    const hasStaffRole = userBizs.some((b) => b.currentUserRole === 'STAFF');

    if (selectedRole === 'owner') {
      if (userBizs.length > 0 && !hasOwnerRole) {
        setLoginRoleError('Your account does not have Owner permissions for any business. Please select the Staff role.');
        return;
      }
      setCurrentUser(user);
      setActiveRole('owner');
      const requestedOwnerTab = intendedTab && VALID_OWNER_TABS.includes(intendedTab) ? intendedTab : null;
      const targetTab = userBizs.length === 0 ? 'onboarding' : (requestedOwnerTab && requestedOwnerTab !== 'onboarding' ? requestedOwnerTab : 'dashboard');
      setActiveTab(targetTab);
      sessionStorage.setItem('servicehub_active_role', 'owner');
      sessionStorage.setItem('servicehub_active_tab', targetTab);
    } else if (selectedRole === 'staff') {
      if (!hasStaffRole && !hasOwnerRole) {
        setLoginRoleError('Your account is not registered as staff for any business. Staff accounts are created or invited by a business owner.');
        return;
      }
      setCurrentUser(user);
      setActiveRole('staff');
      const targetTab = intendedTab && VALID_STAFF_TABS.includes(intendedTab) ? intendedTab : 'staff-dashboard';
      setActiveTab(targetTab);
      sessionStorage.setItem('servicehub_active_role', 'staff');
      sessionStorage.setItem('servicehub_active_tab', targetTab);
    } else {
      // Customer login
      setCurrentUser(user);
      if (!hasOwnerRole && !hasStaffRole) {
        setActiveRole('customer');
        const targetTab = intendedTab && VALID_CUSTOMER_TABS.includes(intendedTab) ? intendedTab : 'customer-portal';
        setActiveTab(targetTab);
        sessionStorage.setItem('servicehub_active_role', 'customer');
        sessionStorage.setItem('servicehub_active_tab', targetTab);
      } else if (hasStaffRole && !hasOwnerRole) {
        // Staff credentials entered under Customer tab -> Backend authority says STAFF -> route to Staff Portal
        setActiveRole('staff');
        setActiveTab('staff-dashboard');
        sessionStorage.setItem('servicehub_active_role', 'staff');
        sessionStorage.setItem('servicehub_active_tab', 'staff-dashboard');
      } else if (hasOwnerRole) {
        setActiveRole('owner');
        const requestedOwnerTab = intendedTab && VALID_OWNER_TABS.includes(intendedTab) ? intendedTab : null;
        const targetTab = requestedOwnerTab && requestedOwnerTab !== 'onboarding' ? requestedOwnerTab : 'dashboard';
        setActiveTab(targetTab);
        sessionStorage.setItem('servicehub_active_role', 'owner');
        sessionStorage.setItem('servicehub_active_tab', targetTab);
      }
    }
  };

  const handleRegisterSuccess = (user, selectedRole) => {
    setCurrentUser(user);
    if (selectedRole === 'owner') {
      setActiveRole('owner');
      setActiveTab('onboarding');
    } else if (selectedRole === 'customer') {
      setActiveRole('customer');
      setActiveTab('customer-portal');
    } else {
      setActiveRole('staff');
      setActiveTab('login');
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setAccessToken(null);
    setCurrentUser(null);
    setBusinesses([]);
    setSelectedBusiness(null);
    setActiveRole('customer');
    setActiveTab('landing');
    setShowSetupModal(false);
    sessionStorage.removeItem('servicehub_active_tab');
    sessionStorage.removeItem('servicehub_active_role');
    sessionStorage.removeItem('servicehub_redirect_tab');
    sessionStorage.removeItem('servicehub_selected_business_id');
    sessionStorage.removeItem('servicehub_customer_subtab');
    sessionStorage.removeItem('servicehub_customer_selected_biz');
    sessionStorage.removeItem('servicehub_customer_selected_service');
    sessionStorage.removeItem('servicehub_staff_tab');
  };

  const handleBusinessCreated = async (newBusiness) => {
    const userBizs = await fetchUserBusinesses();
    const found = userBizs.find((b) => b.id === newBusiness.id) || newBusiness;
    setSelectedBusiness(found);
    setActiveRole('owner');
    setActiveTab('dashboard');
    setShowSetupModal(true); // Open setup popup modal immediately over clean light background!
  };

  const handleSwitchToRegister = (role = 'customer') => {
    setAuthRoleMode(role);
    setLoginRoleError(null);
    setActiveTab('register');
  };

  const handleSwitchToLogin = (role = 'customer') => {
    setAuthRoleMode(role);
    setLoginRoleError(null);
    setActiveTab('login');
  };

  // Determine if current tab uses the Owner Sidebar layout
  const isOwnerShellTab =
    currentUser &&
    activeRole === 'owner' &&
    ['dashboard', 'bookings', 'calendar', 'customers', 'services', 'team', 'staff', 'reviews', 'reports', 'performance', 'opportunities', 'settings'].includes(activeTab);

  if (initializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#EEF5F1] font-sans antialiased text-[#102C26]">
        <LoadingState message="Loading ServiceHub..." />
      </div>
    );
  }

  // Force Password Change Screen on First Login
  if (currentUser?.mustChangePassword === true) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#EEF5F1] font-sans antialiased text-[#102C26] p-4">
        <ChangePasswordForm
          currentUser={currentUser}
          onChangeSuccess={(updatedUser) => {
            setCurrentUser(updatedUser);
            setActiveRole('staff');
            setActiveTab('staff-dashboard');
            sessionStorage.setItem('servicehub_active_role', 'staff');
            sessionStorage.setItem('servicehub_active_tab', 'staff-dashboard');
          }}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#EEF5F1] font-sans antialiased text-[#102C26] selection:bg-[#AEC5B8] selection:text-[#102C26] relative overflow-x-hidden">
      {/* Organic Top Left & Top Right Background Waves behind Navbar */}
      {activeTab === 'landing' && (
        <>
          {/* Top Left Fluid Organic Wave */}
          <div className="absolute top-0 left-0 w-[550px] sm:w-[750px] lg:w-[850px] h-[650px] pointer-events-none z-0 overflow-hidden">
            <svg viewBox="0 0 850 650" className="w-full h-full text-[#CBDCD3] fill-current opacity-75">
              <path d="M 0 0 L 340 0 C 280 120, 360 220, 300 380 C 240 500, 120 560, 0 600 Z" />
            </svg>
          </div>

          {/* Top Right Subtle Organic Wash */}
          <div className="absolute top-0 right-0 w-[400px] sm:w-[600px] h-[500px] pointer-events-none z-0 overflow-hidden">
            <svg viewBox="0 0 600 500" className="w-full h-full text-[#CBDCD3] fill-current opacity-40">
              <path d="M 600 0 L 380 0 C 450 120, 520 250, 600 360 Z" />
            </svg>
          </div>
        </>
      )}

      {/* Subtle Single Accent Glow */}
      <div className="fixed top-0 left-1/3 w-[35rem] h-[35rem] bg-[#AEC5B8]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Render Staff Dashboard full-screen if active */}
      {activeTab === 'staff-dashboard' && currentUser && selectedBusiness ? (
        <div className="w-screen h-screen overflow-hidden bg-[#EAEFEA] fixed inset-0 z-50">
          <StaffDashboard
            business={selectedBusiness}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        </div>
      ) : isOwnerShellTab ? (
        /* Owner Authenticated App Shell with Sidebar - Full Page Width & Height */
        <div className="h-screen w-full flex flex-col md:flex-row bg-[#EEF6F1] overflow-hidden">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedBusiness={selectedBusiness}
            onNewBusiness={() => setActiveTab('onboarding')}
            currentUser={currentUser}
            onLogout={handleLogout}
          />

          <main className="flex-1 h-screen overflow-y-auto p-4 sm:p-6 lg:p-8">
            {activeTab === 'dashboard' && selectedBusiness && (
              <BusinessDashboardPlaceholder
                business={selectedBusiness}
                currentUser={currentUser}
                onNavigate={setActiveTab}
                onOpenSetupModal={() => setShowSetupModal(true)}
              />
            )}

            {activeTab === 'bookings' && selectedBusiness && (
              <BookingManagement
                selectedBusiness={selectedBusiness}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'calendar' && selectedBusiness && (
              <OwnerCalendar
                selectedBusiness={selectedBusiness}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'customers' && selectedBusiness && (
              <CustomerManagement
                selectedBusiness={selectedBusiness}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'services' && selectedBusiness && (
              <ServiceManagement
                business={selectedBusiness}
                currentUser={currentUser}
              />
            )}

            {(activeTab === 'team' || activeTab === 'staff') && selectedBusiness && (
              <StaffManagement
                business={selectedBusiness}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'reviews' && selectedBusiness && (
              <OwnerReviews selectedBusiness={selectedBusiness} />
            )}

            {(activeTab === 'performance' || activeTab === 'reports') && selectedBusiness && (
              <OwnerPerformance selectedBusiness={selectedBusiness} />
            )}

            {activeTab === 'opportunities' && selectedBusiness && (
              <OwnerOpportunities selectedBusiness={selectedBusiness} onNavigate={setActiveTab} />
            )}

            {activeTab === 'settings' && selectedBusiness && (
              <BusinessSettings
                selectedBusiness={selectedBusiness}
                currentUser={currentUser}
                onBusinessUpdated={(updatedBiz) => setSelectedBusiness(updatedBiz)}
              />
            )}
          </main>
        </div>
      ) : (
        <>
          <Header
            activeTab={activeTab}
            setActiveTab={(tab) => {
              if (tab === 'customer-portal') {
                setCustomerBrowseKey((k) => k + 1);
              }
              setActiveTab(tab);
            }}
            currentUser={currentUser}
            businesses={businesses}
            selectedBusiness={selectedBusiness}
            onSelectBusiness={setSelectedBusiness}
            onLogout={handleLogout}
            activeRole={activeRole}
            setActiveRole={setActiveRole}
          />

          {/* Standalone & Role Portal Views */}
          <main className={`flex-1 w-full mx-auto ${activeTab === 'landing' ? '' : 'max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10'}`}>
              {activeTab === 'landing' && (
                <LandingPage
                  onGetStarted={() => handleSwitchToRegister('customer')}
                  onSignIn={() => handleSwitchToLogin('customer')}
                />
              )}

              {activeTab === 'login' && (
                <LoginForm
                  onLoginSuccess={handleLoginSuccess}
                  switchToRegister={handleSwitchToRegister}
                  initialRole={authRoleMode}
                  externalError={loginRoleError}
                />
              )}

              {activeTab === 'register' && (
                <RegisterForm
                  onRegisterSuccess={handleRegisterSuccess}
                  switchToLogin={handleSwitchToLogin}
                  initialRole={authRoleMode}
                />
              )}

              {['customer-portal', 'customer-discover', 'customer-appointments', 'customer-reviews'].includes(activeTab) && (
                currentUser ? (
                  <CustomerPortal
                    currentUser={currentUser}
                    onLogout={handleLogout}
                    browseResetKey={customerBrowseKey}
                    activeTabProp={
                      activeTab === 'customer-appointments'
                        ? 'my-bookings'
                        : activeTab === 'customer-reviews'
                        ? 'reviews'
                        : 'browse'
                    }
                    onNavigateTab={(targetTab) => {
                      if (targetTab === 'my-bookings') setActiveTab('customer-appointments');
                      else if (targetTab === 'reviews') setActiveTab('customer-reviews');
                      else setActiveTab('customer-portal');
                    }}
                  />
                ) : (
                  <LoginForm
                    onLoginSuccess={handleLoginSuccess}
                    switchToRegister={handleSwitchToRegister}
                    initialRole={authRoleMode}
                    externalError={loginRoleError}
                  />
                )
              )}

              {activeTab === 'onboarding' && (
                currentUser ? (
                  <BusinessOnboardingForm onBusinessCreated={handleBusinessCreated} />
                ) : (
                  <LoginForm
                    onLoginSuccess={handleLoginSuccess}
                    switchToRegister={handleSwitchToRegister}
                    initialRole="owner"
                    externalError={loginRoleError}
                  />
                )
              )}

              {!currentUser && !['landing', 'login', 'register', 'customer-portal', 'customer-discover', 'customer-appointments', 'customer-reviews', 'onboarding', 'account'].includes(activeTab) && (
                <LoginForm
                  onLoginSuccess={handleLoginSuccess}
                  switchToRegister={handleSwitchToRegister}
                  initialRole={VALID_OWNER_TABS.includes(activeTab) ? 'owner' : activeTab === 'staff-dashboard' ? 'staff' : 'customer'}
                  externalError={loginRoleError}
                />
              )}

              {activeTab === 'account' && (
                currentUser ? (
                  <UserProfile
                    user={currentUser}
                    onLogout={handleLogout}
                    onUserUpdate={setCurrentUser}
                  />
                ) : (
                  <LoginForm
                    onLoginSuccess={handleLoginSuccess}
                    switchToRegister={handleSwitchToRegister}
                    initialRole="customer"
                    externalError={loginRoleError}
                  />
                )
              )}
            </main>

            <Footer />
          </>
        )}

      {showSetupModal && selectedBusiness && (
        <BusinessSetupModal
          business={selectedBusiness}
          onNavigate={(tab) => {
            setShowSetupModal(false);
            setActiveTab(tab);
          }}
          onClose={() => setShowSetupModal(false)}
        />
      )}
    </div>
  );
}
