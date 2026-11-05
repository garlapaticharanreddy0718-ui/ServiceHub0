import React, { useState } from 'react';
import { Layers, Building2, User, LogOut, ChevronDown, Plus, UserCheck, Menu, X, Search, Bell } from 'lucide-react';
import Badge from './ui/Badge';

export default function Header({
  activeTab,
  setActiveTab,
  currentUser,
  businesses = [],
  selectedBusiness,
  onSelectBusiness,
  onLogout,
  activeRole = 'customer',
  setActiveRole,
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check user capabilities from server-authenticated business memberships
  const isOwnerOrAdmin = businesses.some((b) => b.currentUserRole === 'OWNER' || b.currentUserRole === 'ADMIN');
  const isStaffMember = businesses.some((b) => b.currentUserRole === 'STAFF');

  const handleBrandClick = () => {
    if (!currentUser) {
      setActiveTab('landing');
      return;
    }

    if (activeRole === 'owner') {
      setActiveTab(selectedBusiness ? 'dashboard' : 'onboarding');
    } else if (activeRole === 'staff') {
      setActiveTab('staff-dashboard');
    } else {
      setActiveTab('customer-portal');
    }
  };

  const scrollToSection = (sectionId) => {
    setMobileMenuOpen(false);
    if (activeTab !== 'landing') {
      setActiveTab('landing');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 pt-4 pb-2 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto bg-white/75 backdrop-blur-md border border-[#D5E4DC] rounded-full shadow-[0_4px_24px_-4px_rgba(23,63,53,0.06)] px-5 sm:px-8 py-2.5 flex items-center justify-between transition-all duration-300 min-h-[56px]">
        {/* Left: Visually Strong Brand Logo & Title */}
        <div
          className="flex items-center space-x-3 cursor-pointer select-none group"
          onClick={handleBrandClick}
        >
          <div className="w-9 h-9 rounded-xl bg-[#173F35] text-[#AEC5B8] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform duration-200">
            <Layers className="w-5 h-5 text-[#AEC5B8]" />
          </div>
          <span className="text-xl font-black text-[#173F35] tracking-tight font-heading">ServiceHub</span>
        </div>

        {/* Center: Editorial Navigation Links */}
        {activeTab === 'landing' && !currentUser && (
          <nav className="hidden md:flex items-center space-x-1 sm:space-x-2 text-xs font-semibold text-[#173F35]/80">
            <button
              type="button"
              onClick={() => scrollToSection('services')}
              className="px-3.5 py-1.5 rounded-full hover:text-[#173F35] hover:bg-[#B5CFC1]/40 transition-all duration-200 cursor-pointer"
            >
              Services
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('for-businesses')}
              className="px-3.5 py-1.5 rounded-full hover:text-[#173F35] hover:bg-[#B5CFC1]/40 transition-all duration-200 cursor-pointer"
            >
              For Businesses
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="px-3.5 py-1.5 rounded-full hover:text-[#173F35] hover:bg-[#B5CFC1]/40 transition-all duration-200 cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('experiences')}
              className="px-3.5 py-1.5 rounded-full hover:text-[#173F35] hover:bg-[#B5CFC1]/40 transition-all duration-200 cursor-pointer"
            >
              Experiences
            </button>
          </nav>
        )}

        {/* Business Selector / Context Bar for Authenticated Users */}
        {currentUser && (
          <div className="hidden sm:flex items-center space-x-3">
            {activeRole === 'owner' && (
              businesses.length > 0 ? (
                <div className="relative inline-block text-left">
                  <div className="flex items-center space-x-2 px-3.5 py-1.5 bg-white/80 hover:bg-white rounded-full text-xs font-semibold text-[#173F35] border border-[#B5CFC1]/50 transition-colors shadow-2xs">
                    <Building2 className="w-4 h-4 text-[#173F35]" />
                    <select
                      value={selectedBusiness?.id || ''}
                      onChange={(e) => {
                        if (e.target.value === 'new') {
                          setActiveTab('onboarding');
                        } else {
                          const found = businesses.find((b) => b.id === e.target.value);
                          if (found) {
                            onSelectBusiness(found);
                            setActiveTab('dashboard');
                          }
                        }
                      }}
                      className="bg-transparent focus:outline-none cursor-pointer pr-2 font-semibold text-[#173F35]"
                    >
                      {businesses.map((b) => (
                        <option key={b.id} value={b.id} className="bg-white text-[#173F35]">
                          {b.name} ({b.currentUserRole})
                        </option>
                      ))}
                      <option value="new" className="bg-white text-[#173F35]">+ Register New Business</option>
                    </select>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('onboarding')}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#173F35] text-white rounded-full text-xs font-semibold hover:bg-[#102D26] transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Business</span>
                </button>
              )
            )}

            {activeRole === 'staff' && selectedBusiness && (
              <div className="flex items-center space-x-2 px-3.5 py-1.5 bg-white/80 rounded-full text-xs font-semibold text-[#173F35] border border-[#B5CFC1]/50">
                <Building2 className="w-4 h-4 text-[#173F35]" />
                <span>{selectedBusiness.name}</span>
                <span className="text-[10px] bg-[#B5CFC1]/30 text-[#173F35] border border-[#B5CFC1]/60 px-2 py-0.5 rounded-full font-semibold">Staff View</span>
              </div>
            )}

            {activeRole === 'customer' && (
              <nav className="hidden md:flex items-center space-x-1 sm:space-x-2 text-xs font-semibold text-[#173F35]/80">
                <button
                  type="button"
                  onClick={() => setActiveTab('customer-portal')}
                  className={`px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                    activeTab === 'customer-portal' || activeTab === 'customer-discover' ? 'bg-[#173F35] text-white font-bold' : 'hover:text-[#173F35] hover:bg-[#B5CFC1]/40'
                  }`}
                >
                  Discover
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('customer-appointments')}
                  className={`px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                    activeTab === 'customer-appointments' ? 'bg-[#173F35] text-white font-bold' : 'hover:text-[#173F35] hover:bg-[#B5CFC1]/40'
                  }`}
                >
                  My Appointments
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('customer-reviews')}
                  className={`px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                    activeTab === 'customer-reviews' ? 'bg-[#173F35] text-white font-bold' : 'hover:text-[#173F35] hover:bg-[#B5CFC1]/40'
                  }`}
                >
                  Reviews
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('account')}
                  className={`px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                    activeTab === 'account' ? 'bg-[#173F35] text-white font-bold' : 'hover:text-[#173F35] hover:bg-[#B5CFC1]/40'
                  }`}
                >
                  Profile
                </button>
              </nav>
            )}
          </div>
        )}

        {/* Right Section: Sign In (Secondary) & Get Started → (Primary CTA) */}
        <div className="flex items-center space-x-3">
          {!currentUser ? (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                aria-label="Search"
                className="p-2 rounded-full text-[#173F35] hover:bg-[#B5CFC1]/40 transition-all duration-200 cursor-pointer hidden sm:flex items-center justify-center"
              >
                <Search className="w-4 h-4 text-[#173F35]" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="px-4 py-2 rounded-full text-xs font-bold text-[#173F35] hover:bg-[#B5CFC1]/40 transition-all duration-200 cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#173F35] hover:bg-[#102D26] hover:-translate-y-0.5 transition-all duration-200 shadow-2xs active:scale-[0.98] cursor-pointer"
              >
                <span>Get Started</span>
                <span className="text-[#AEC5B8] font-bold">→</span>
              </button>

              {/* Mobile Hamburger Menu Toggle */}
              {activeTab === 'landing' && (
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-full text-[#18352B] hover:bg-[#AEC5B8]/30 transition-colors"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              {/* Notification Icon */}
              <button
                type="button"
                aria-label="Notifications"
                className="p-2 rounded-full text-[#18352B] hover:bg-[#AEC5B8]/30 transition-all duration-200 cursor-pointer relative"
              >
                <Bell className="w-4 h-4 text-[#18352B]" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-[#DCE8E1]"></span>
              </button>

              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-3.5 py-1.5 bg-white/80 hover:bg-white rounded-full text-xs font-medium text-[#18352B] transition-colors border border-[#AEC5B8]/50 shadow-2xs"
                >
                  <div className="w-6 h-6 rounded-full bg-[#18352B] text-[#AEC5B8] font-bold text-[10px] flex items-center justify-center">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="font-semibold text-[#18352B] hidden sm:inline">{currentUser.name}</span>
                  <Badge variant={activeRole.toUpperCase()} size="sm">
                    {activeRole.toUpperCase()}
                  </Badge>
                  <ChevronDown className="w-3.5 h-3.5 text-[#18352B]/60" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#AEC5B8]/60 py-1.5 z-50 animate-fade-in-scale"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-[#AEC5B8]/30 text-xs">
                      <p className="font-bold text-[#18352B] truncate">{currentUser.name}</p>
                      <p className="text-[#18352B]/60 text-[11px] truncate font-mono">{currentUser.email}</p>
                    </div>

                    <div className="px-4 py-2 border-b border-[#AEC5B8]/30 space-y-1">
                      <p className="text-[10px] font-bold text-[#AEC5B8] uppercase tracking-wider">Switch View</p>

                      <button
                        onClick={() => {
                          setActiveRole('customer');
                          setActiveTab('customer-portal');
                          setUserMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center space-x-2 transition-colors ${
                          activeRole === 'customer' ? 'bg-[#DCE8E1] text-[#18352B] font-bold' : 'text-[#18352B]/80 hover:bg-[#EEF4F0]'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Customer Portal</span>
                      </button>

                      {isStaffMember && (
                        <button
                          onClick={() => {
                            setActiveRole('staff');
                            setActiveTab('staff-dashboard');
                            setUserMenuOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center space-x-2 transition-colors ${
                            activeRole === 'staff' ? 'bg-[#DCE8E1] text-[#18352B] font-bold' : 'text-[#18352B]/80 hover:bg-[#EEF4F0]'
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Staff Dashboard</span>
                        </button>
                      )}

                      {isOwnerOrAdmin && (
                        <button
                          onClick={() => {
                            setActiveRole('owner');
                            setActiveTab(selectedBusiness ? 'dashboard' : 'onboarding');
                            setUserMenuOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center space-x-2 transition-colors ${
                            activeRole === 'owner' ? 'bg-[#DCE8E1] text-[#18352B] font-bold' : 'text-[#18352B]/80 hover:bg-[#EEF4F0]'
                          }`}
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Owner Dashboard</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('account');
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-[#18352B] hover:bg-[#EEF4F0] flex items-center space-x-2"
                    >
                      <User className="w-3.5 h-3.5 text-[#18352B]/60" />
                      <span>Account Settings</span>
                    </button>

                    <div className="border-t border-[#AEC5B8]/30 my-1"></div>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Dropdown Menu for Landing Page */}
      {mobileMenuOpen && activeTab === 'landing' && !currentUser && (
        <div className="md:hidden mt-2 max-w-6xl mx-auto rounded-3xl bg-[#DCE8E1] border border-[#AEC5B8]/60 p-4 space-y-1 animate-fade-in-up text-xs font-bold text-[#18352B] shadow-md">
          <button
            type="button"
            onClick={() => scrollToSection('services')}
            className="block w-full text-left px-3 py-2 rounded-xl hover:bg-[#AEC5B8]/30 transition-colors"
          >
            Services
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('for-businesses')}
            className="block w-full text-left px-3 py-2 rounded-xl hover:bg-[#AEC5B8]/30 transition-colors"
          >
            For Businesses
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('how-it-works')}
            className="block w-full text-left px-3 py-2 rounded-xl hover:bg-[#AEC5B8]/30 transition-colors"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('experiences')}
            className="block w-full text-left px-3 py-2 rounded-xl hover:bg-[#AEC5B8]/30 transition-colors"
          >
            Experiences
          </button>
        </div>
      )}
    </header>
  );
}
