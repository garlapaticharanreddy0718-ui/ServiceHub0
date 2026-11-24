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
import { apiRequest, setAccessToken } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [activeRole, setActiveRole] = useState('customer'); // 'customer' | 'staff' | 'owner'
  const [currentUser, setCurrentUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [loginRoleError, setLoginRoleError] = useState(null);
  const [authRoleMode, setAuthRoleMode] = useState('customer');
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [customerBrowseKey, setCustomerBrowseKey] = useState(0);

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
    async function restoreSession() {
      try {
        const savedRole = sessionStorage.getItem('servicehub_active_role');
        const savedTab = sessionStorage.getItem('servicehub_active_tab');

        const refreshResponse = await apiRequest('/auth/refresh', { method: 'POST' });
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setAccessToken(refreshData.data.accessToken);

          const meResponse = await apiRequest('/auth/me', { method: 'GET' });
          if (meResponse.ok) {
            const meData = await meResponse.json();
            const user = meData.data.user;

            const userBizs = await fetchUserBusinesses();

            // Determine actual backend roles from user business memberships
            const hasOwnerRole = userBizs.some((b) => b.currentUserRole === 'OWNER' || b.currentUserRole === 'ADMIN');
            const hasStaffRole = userBizs.some((b) => b.currentUserRole === 'STAFF');

            const validCustomerTabs = ['customer-portal', 'customer-discover', 'customer-appointments', 'customer-reviews', 'account'];
            const validOwnerTabs = ['dashboard', 'bookings', 'calendar', 'customers', 'services', 'team', 'staff', 'reviews', 'reports', 'performance', 'opportunities', 'settings', 'onboarding', 'account'];
            const validStaffTabs = ['staff-dashboard', 'account'];

            if (hasOwnerRole) {
              if (savedRole === 'customer' && savedTab && validCustomerTabs.includes(savedTab)) {
                setActiveRole('customer');
                setActiveTab(savedTab);
              } else if (savedRole === 'staff' && hasStaffRole) {
                setActiveRole('staff');
                setActiveTab(savedTab && validStaffTabs.includes(savedTab) ? savedTab : 'staff-dashboard');
              } else {
                let resolvedOwnerTab = savedTab && validOwnerTabs.includes(savedTab) ? savedTab : 'dashboard';
                if (userBizs.length > 0 && resolvedOwnerTab === 'onboarding') {
                  resolvedOwnerTab = 'dashboard';
                }
                setActiveRole('owner');
                setActiveTab(resolvedOwnerTab);
              }
            } else if (hasStaffRole) {
              if (savedRole === 'customer' && savedTab && validCustomerTabs.includes(savedTab)) {
                setActiveRole('customer');
                setActiveTab(savedTab);
              } else {
                setActiveRole('staff');
                setActiveTab(savedTab && validStaffTabs.includes(savedTab) ? savedTab : 'staff-dashboard');
              }
            } else {
              // Pure Customer (No business staff/owner memberships)
              setActiveRole('customer');
              setActiveTab(savedTab && validCustomerTabs.includes(savedTab) ? savedTab : 'customer-portal');
            }

            setCurrentUser(user);
          }
        }
      } catch (err) {
        // No active session -> stay on landing page
        setActiveTab('landing');
      } finally {
        setInitializing(false);
      }
    }

    restoreSession();
  }, [fetchUserBusinesses]);

  const handleLoginSuccess = async (user, selectedRole) => {
    setLoginRoleError(null);
    const userBizs = await fetchUserBusinesses();

    const hasOwnerRole = userBizs.some((b) => b.currentUserRole === 'OWNER' || b.currentUserRole === 'ADMIN');
    const hasStaffRole = userBizs.some((b) => b.currentUserRole === 'STAFF');

    if (selectedRole === 'owner') {
      if (userBizs.length > 0 && !hasOwnerRole) {
        setLoginRoleError('Your account does not have Owner permissions for any business. Please select the Staff role.');
        return;
      }
      setCurrentUser(user);
      setActiveRole('owner');
      const targetTab = userBizs.length === 0 ? 'onboarding' : 'dashboard';
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
      setActiveTab('staff-dashboard');
      sessionStorage.setItem('servicehub_active_role', 'staff');
      sessionStorage.setItem('servicehub_active_tab', 'staff-dashboard');
    } else {
      // Customer login
      setCurrentUser(user);
      if (!hasOwnerRole && !hasStaffRole) {
        setActiveRole('customer');
        setActiveTab('customer-portal');
        sessionStorage.setItem('servicehub_active_role', 'customer');
        sessionStorage.setItem('servicehub_active_tab', 'customer-portal');
      } else if (hasStaffRole && !hasOwnerRole) {
        // Staff credentials entered under Customer tab -> Backend authority says STAFF -> route to Staff Portal
        setActiveRole('staff');
        setActiveTab('staff-dashboard');
        sessionStorage.setItem('servicehub_active_role', 'staff');
        sessionStorage.setItem('servicehub_active_tab', 'staff-dashboard');
      } else if (hasOwnerRole) {
        setActiveRole('owner');
        setActiveTab('dashboard');
        sessionStorage.setItem('servicehub_active_role', 'owner');
        sessionStorage.setItem('servicehub_active_tab', 'dashboard');
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
