import React, { useState } from 'react';
import {
  Calendar,
  Users,
  Scissors,
  UserCheck,
  ChevronRight,
  Sparkles,
  Building2,
  Check,
  ArrowRight,
  Stethoscope,
  Dumbbell,
  Briefcase,
  Wrench,
  UserPlus,
  CalendarCheck,
  GraduationCap,
  Sparkles as SparklesIcon,
  LayoutDashboard,
  UserCircle
} from 'lucide-react';

export default function LandingPage({ onGetStarted, onSignIn }) {
  const [activeEcosystemNode, setActiveEcosystemNode] = useState('business');

  return (
    <div className="bg-[#EEF5F1] text-[#173F35] font-sans selection:bg-[#AEC5B8] selection:text-[#173F35] space-y-12 sm:space-y-20 pb-16 relative overflow-hidden -mt-[76px] pt-[76px]">
      {/* Decorative Organic Left Background Shape (Extending to absolute top of viewport behind navbar) */}
      <div className="absolute top-0 left-0 w-[550px] sm:w-[700px] lg:w-[800px] h-[800px] pointer-events-none z-0 overflow-hidden">
        <svg viewBox="0 0 800 800" className="w-full h-full text-[#D8E6DF] fill-current opacity-85">
          <path d="M 0 0 L 360 0 C 310 90, 260 200, 240 360 C 220 500, 120 640, 0 720 Z" />
        </svg>
      </div>

      {/* Decorative Bottom Right Organic Background Shape (Confined strictly to lower right section) */}
      <div className="absolute bottom-0 right-0 w-[400px] sm:w-[500px] h-[400px] pointer-events-none z-0 overflow-hidden">
        <svg viewBox="0 0 500 400" className="w-full h-full text-[#D4E5DC]/40 fill-current">
          <path d="M 500 400 L 200 400 C 300 340, 420 280, 500 180 Z" />
        </svg>
      </div>

      {/* 1. HERO SECTION (2-COLUMN SPLIT HERO MATCHING REFERENCE IMAGE IN 1ST VIEWPORT) */}
      <section className="pt-3 lg:pt-6 pb-2 px-4 sm:px-6 max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Eyebrow, Headline, Subtitle, Action Buttons, Benefits */}
          <div className="lg:col-span-6 space-y-5 text-left animate-fade-in-up">
            {/* Eyebrow Pill Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/90 border border-[#B5CFC1] text-[#173F35] text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#173F35]" />
              <span>Service Operations Platform</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#173F35]" />
            </div>

            {/* Large Bold Headline (Exact Line Breaks matching Reference Image) */}
            <h1 className="text-4xl sm:text-5xl lg:text-[48px] font-black text-[#173F35] tracking-tight leading-[1.08] font-heading">
              Run your service<br className="hidden sm:inline" /> business, all in one<br className="hidden sm:inline" /> place.
            </h1>

            {/* Subtitle Description */}
            <p className="text-xs sm:text-sm text-[#61766F] leading-relaxed max-w-md font-medium font-sans">
              ServiceHub connects your services, staff schedules, customer records, and bookings into one simple platform.
            </p>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onGetStarted}
                className="inline-flex items-center justify-center space-x-2 bg-[#173F35] hover:bg-[#102D26] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full shadow-2xs transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
              >
                <span>Get Started Free</span>
                <span className="text-[#AEC5B8] font-bold">→</span>
              </button>
              <button
                type="button"
                onClick={onSignIn}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full text-xs sm:text-sm font-bold text-[#173F35] bg-white hover:bg-[#F4F8F5] border border-[#B5CFC1] shadow-2xs transition-colors cursor-pointer"
              >
                Sign In to Workspace
              </button>
            </div>

            {/* Horizontal Benefits Checklist (Circular Badges Matching Image 2) */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[#173F35] pt-1">
              <div className="flex items-center space-x-1.5">
                <div className="w-4.5 h-4.5 rounded-full bg-[#173F35]/15 text-[#173F35] flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-[#173F35] stroke-[3]" />
                </div>
                <span>Easy Online Booking</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-4.5 h-4.5 rounded-full bg-[#173F35]/15 text-[#173F35] flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-[#173F35] stroke-[3]" />
                </div>
                <span>Customer Management</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-4.5 h-4.5 rounded-full bg-[#173F35]/15 text-[#173F35] flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-[#173F35] stroke-[3]" />
                </div>
                <span>Staff Scheduling</span>
              </div>
            </div>
          </div>

          {/* Right Column: Large White Product Preview Panel (Matching Image 2 Reference) */}
          <div className="lg:col-span-6 animate-fade-in-up delay-100">
            <div className="bg-white rounded-[26px] border border-[#D5E4DC] shadow-[0_6px_24px_rgba(23,63,53,0.06)] p-5 sm:p-6 space-y-4">
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-2.5 border-b border-[#E5EDE7]">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#173F35]" />
                  <span className="text-xs font-black text-[#173F35] uppercase tracking-wider font-heading">
                    SERVICEHUB ECOSYSTEM
                  </span>
                </div>
                <span className="text-[11px] font-bold bg-[#E4EFE8] text-[#173F35] px-3 py-0.5 rounded-full border border-[#C6DCD0]">
                  Everything Connected
                </span>
              </div>

              {/* Workflow Breadcrumb Bar */}
              <div className="flex items-center justify-between px-4 py-2 bg-[#F2F7F4] rounded-full border border-[#D5E4DC] text-[11px] font-bold text-[#61766F]">
                <span className={activeEcosystemNode === 'business' ? 'text-[#173F35] font-extrabold' : ''}>Business</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#9CB5A8]" />
                <span className={activeEcosystemNode === 'services' ? 'text-[#173F35] font-extrabold' : ''}>Services</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#9CB5A8]" />
                <span className={activeEcosystemNode === 'staff' ? 'text-[#173F35] font-extrabold' : ''}>Staff</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#9CB5A8]" />
                <span className={activeEcosystemNode === 'customers' ? 'text-[#173F35] font-extrabold' : ''}>Customers</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#9CB5A8]" />
                <span className={activeEcosystemNode === 'bookings' ? 'text-[#173F35] font-extrabold' : ''}>Bookings</span>
              </div>

              {/* Selector Tabs Grid */}
              <div className="grid grid-cols-5 gap-2 text-center text-xs font-bold">
                {[
                  { id: 'business', label: 'Business', icon: Building2 },
                  { id: 'services', label: 'Services', icon: Scissors },
                  { id: 'staff', label: 'Staff', icon: UserCheck },
                  { id: 'customers', label: 'Customers', icon: Users },
                  { id: 'bookings', label: 'Bookings', icon: Calendar },
                ].map((node) => {
                  const IconComp = node.icon;
                  const isActive = activeEcosystemNode === node.id;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setActiveEcosystemNode(node.id)}
                      className={`py-3 px-2 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-[#173F35] text-white border-[#173F35] shadow-xs font-extrabold'
                          : 'bg-[#F2F7F4] text-[#61766F] border-[#D5E4DC] hover:bg-[#E4EFE8]'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                      <span className="truncate w-full text-[11px]">{node.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Showcase Card */}
              <div className="bg-[#F2F7F4] p-5 rounded-2xl border border-[#D5E4DC] space-y-4">
                {activeEcosystemNode === 'business' && (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex space-x-3.5">
                        {/* Real Luxury Salon Image Thumbnail Matching Image 2 */}
                        <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-2xs border border-white bg-[#D5E4DC]">
                          <img
                            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&auto=format&fit=crop&q=80"
                            alt="Glow & Style Beauty Studio"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.parentElement.innerHTML = '<div class="w-full h-full bg-[#173F35] text-[#AEC5B8] flex items-center justify-center font-bold text-sm">G&S</div>';
                            }}
                          />
                        </div>
                        <div>
                          <h4 className="font-black text-[#173F35] text-base font-heading">Glow & Style Beauty Studio</h4>
                          <p className="text-xs text-[#61766F] font-medium mt-0.5 flex items-center space-x-1">
                            <span>Beauty & Salon</span>
                            <span>•</span>
                            <span className="flex items-center text-[#173F35] font-semibold">📍 Hyderabad</span>
                          </p>
                          <p className="text-xs text-[#61766F] mt-1 font-sans leading-relaxed">
                            Professional beauty and styling services for a more confident you.
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 tracking-wider">
                        ACTIVE
                      </span>
                    </div>

                    {/* Stats Layout with Icons & Vertical Dividers Matching Image 2 */}
                    <div className="bg-white p-3 rounded-xl border border-[#D5E4DC] grid grid-cols-4 items-center text-center text-xs divide-x divide-[#D5E4DC]">
                      <div className="space-y-0.5 px-1">
                        <div className="flex items-center justify-center space-x-1">
                          <Building2 className="w-3.5 h-3.5 text-[#173F35]" />
                          <span className="font-mono font-black text-[#173F35] text-sm">5</span>
                        </div>
                        <div className="text-[10px] font-semibold text-[#61766F]">Services</div>
                      </div>
                      <div className="space-y-0.5 px-1">
                        <div className="flex items-center justify-center space-x-1">
                          <UserCheck className="w-3.5 h-3.5 text-[#173F35]" />
                          <span className="font-mono font-black text-[#173F35] text-sm">3</span>
                        </div>
                        <div className="text-[10px] font-semibold text-[#61766F]">Staff Members</div>
                      </div>
                      <div className="space-y-0.5 px-1">
                        <div className="flex items-center justify-center space-x-1">
                          <Users className="w-3.5 h-3.5 text-[#173F35]" />
                          <span className="font-mono font-black text-[#173F35] text-sm">124</span>
                        </div>
                        <div className="text-[10px] font-semibold text-[#61766F]">Customers</div>
                      </div>
                      <div className="space-y-0.5 px-1">
                        <div className="flex items-center justify-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-[#173F35]" />
                          <span className="font-mono font-black text-[#173F35] text-sm">28</span>
                        </div>
                        <div className="text-[10px] font-semibold text-[#61766F]">Bookings</div>
                      </div>
                    </div>
                  </div>
                )}
                {activeEcosystemNode === 'services' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Scissors className="w-4 h-4 text-[#173F35]" />
                        <h4 className="font-extrabold text-[#173F35] text-sm">Service Menu & Pricing</h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200">3 OFFERINGS</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5 text-xs font-mono">
                      <div className="p-2.5 bg-white rounded-xl border border-[#D5E4DC] text-center">
                        <div className="font-bold text-[#173F35]">Haircut</div>
                        <div className="text-[#173F35] font-extrabold">₹1,200</div>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-[#D5E4DC] text-center">
                        <div className="font-bold text-[#173F35]">Facial</div>
                        <div className="text-[#173F35] font-extrabold">₹2,500</div>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-[#D5E4DC] text-center">
                        <div className="font-bold text-[#173F35]">Gel Polish</div>
                        <div className="text-[#173F35] font-extrabold">₹1,800</div>
                      </div>
                    </div>
                  </div>
                )}
                {activeEcosystemNode === 'staff' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <UserCheck className="w-4 h-4 text-[#173F35]" />
                        <h4 className="font-extrabold text-[#173F35] text-sm">Assigned Staff Specialists</h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200">3 ON DUTY</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 bg-white rounded-xl border border-[#D5E4DC] flex justify-between items-center">
                        <span className="font-bold text-[#173F35]">Priya Sharma</span>
                        <span className="text-[10px] font-mono font-semibold text-[#61766F]">Senior Stylist</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-[#D5E4DC] flex justify-between items-center">
                        <span className="font-bold text-[#173F35]">Rahul Verma</span>
                        <span className="text-[10px] font-mono font-semibold text-[#61766F]">Master Therapist</span>
                      </div>
                    </div>
                  </div>
                )}
                {activeEcosystemNode === 'customers' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-[#173F35]" />
                        <h4 className="font-extrabold text-[#173F35] text-sm">Client Directory & Profiles</h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200">CRM CONNECTED</span>
                    </div>
                    <p className="text-xs text-[#61766F] leading-relaxed">
                      Centralized customer records track appointment history, contact preferences, and special service notes.
                    </p>
                  </div>
                )}
                {activeEcosystemNode === 'bookings' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-[#173F35]" />
                        <h4 className="font-extrabold text-[#173F35] text-sm">Real-time Schedule Timeline</h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200">CONFIRMED</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 bg-white rounded-xl border border-[#D5E4DC] flex justify-between items-center">
                        <span className="font-mono font-bold text-[#173F35]">10:00 AM</span>
                        <span className="font-bold text-[#173F35]">Ananya Roy (Haircut & Styling)</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">CONFIRMED</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-[#D5E4DC] flex justify-between items-center">
                        <span className="font-mono font-bold text-[#173F35]">11:30 AM</span>
                        <span className="font-bold text-[#173F35]">Lokesh Malhotra (Facial)</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">IN_PROGRESS</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 4 FEATURE CARDS GRID */}
      <section id="services" className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Manage Appointments */}
          <div className="bg-white rounded-3xl border border-[#DCE7E1] p-7 sm:p-8 space-y-5 shadow-2xs hover:shadow-md hover:border-[#AEC5B8] transition-all duration-300 transform hover:-translate-y-1 group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-36 h-36 pointer-events-none opacity-60">
              <svg viewBox="0 0 200 200" className="w-full h-full text-[#E5EDE7] fill-current">
                <path d="M 200 0 L 200 180 C 140 120, 80 160, 20 0 Z" />
              </svg>
            </div>
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F7F3] border border-[#0B8F6A]/20 text-[#0B8F6A] flex items-center justify-center shadow-2xs group-hover:bg-[#0B8F6A] group-hover:text-white transition-all duration-300 group-hover:scale-105">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-[#102C26] tracking-tight font-heading group-hover:text-[#0B8F6A] transition-colors duration-200">
                  Manage Appointments
                </h3>
                <p className="text-xs text-[#52665F] leading-relaxed font-sans font-normal">
                  Keep bookings and schedules organized without double-booking overlaps.
                </p>
              </div>
            </div>
            <div className="pt-2 flex items-center text-xs font-bold text-[#102C26] opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-x-1 relative z-10">
              <span>Learn more</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200 text-[#0B8F6A]" />
            </div>
          </div>

          {/* Card 2: Manage Customers */}
          <div className="bg-white rounded-3xl border border-[#DCE7E1] p-7 sm:p-8 space-y-5 shadow-2xs hover:shadow-md hover:border-[#AEC5B8] transition-all duration-300 transform hover:-translate-y-1 group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-36 h-36 pointer-events-none opacity-60">
              <svg viewBox="0 0 200 200" className="w-full h-full text-[#E5EDE7] fill-current">
                <path d="M 200 0 L 200 180 C 140 120, 80 160, 20 0 Z" />
              </svg>
            </div>
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F7F3] border border-[#0B8F6A]/20 text-[#0B8F6A] flex items-center justify-center shadow-2xs group-hover:bg-[#0B8F6A] group-hover:text-white transition-all duration-300 group-hover:scale-105">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-[#102C26] tracking-tight font-heading group-hover:text-[#0B8F6A] transition-colors duration-200">
                  Manage Customers
                </h3>
                <p className="text-xs text-[#52665F] leading-relaxed font-sans font-normal">
                  Keep customer details, contact history, and notes in one place.
                </p>
              </div>
            </div>
            <div className="pt-2 flex items-center text-xs font-bold text-[#102C26] opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-x-1 relative z-10">
              <span>Learn more</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200 text-[#0B8F6A]" />
            </div>
          </div>

          {/* Card 3: Manage Services */}
          <div className="bg-white rounded-3xl border border-[#DCE7E1] p-7 sm:p-8 space-y-5 shadow-2xs hover:shadow-md hover:border-[#AEC5B8] transition-all duration-300 transform hover:-translate-y-1 group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-36 h-36 pointer-events-none opacity-60">
              <svg viewBox="0 0 200 200" className="w-full h-full text-[#EFF4FF] fill-current">
                <path d="M 200 0 L 200 180 C 140 120, 80 160, 20 0 Z" />
              </svg>
            </div>
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] border border-[#3B82F6]/20 text-[#3B82F6] flex items-center justify-center shadow-2xs group-hover:bg-[#3B82F6] group-hover:text-white transition-all duration-300 group-hover:scale-105">
                <Scissors className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-[#102C26] tracking-tight font-heading group-hover:text-[#3B82F6] transition-colors duration-200">
                  Manage Services
                </h3>
                <p className="text-xs text-[#52665F] leading-relaxed font-sans font-normal">
                  Catalog your service offerings, prices, durations, and availability.
                </p>
              </div>
            </div>
            <div className="pt-2 flex items-center text-xs font-bold text-[#3B82F6] opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-x-1 relative z-10">
              <span>Learn more</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>

          {/* Card 4: Manage Staff */}
          <div className="bg-white rounded-3xl border border-[#DCE7E1] p-7 sm:p-8 space-y-5 shadow-2xs hover:shadow-md hover:border-[#AEC5B8] transition-all duration-300 transform hover:-translate-y-1 group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-36 h-36 pointer-events-none opacity-60">
              <svg viewBox="0 0 200 200" className="w-full h-full text-[#F3E8FF] fill-current">
                <path d="M 200 0 L 200 180 C 140 120, 80 160, 20 0 Z" />
              </svg>
            </div>
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#F5F3FF] border border-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center shadow-2xs group-hover:bg-[#8B5CF6] group-hover:text-white transition-all duration-300 group-hover:scale-105">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-[#102C26] tracking-tight font-heading group-hover:text-[#8B5CF6] transition-colors duration-200">
                  Manage Staff
                </h3>
                <p className="text-xs text-[#52665F] leading-relaxed font-sans font-normal">
                  Manage your team, schedules, assigned services, and daily rosters.
                </p>
              </div>
            </div>
            <div className="pt-2 flex items-center text-xs font-bold text-[#8B5CF6] opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-x-1 relative z-10">
              <span>Learn more</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS WORKFLOW */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 space-y-10 relative z-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#102C26] font-mono bg-[#DCE7E1] px-3.5 py-1 rounded-full border border-[#AEC5B8]/60 shadow-2xs">
            Simple 4-Step Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#102C26] tracking-tight font-heading">
            How ServiceHub works.
          </h2>
          <p className="text-sm text-[#52665F]">
            Get up and running in minutes with a simple, streamlined workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl border border-[#DCE7E1] p-6 space-y-4 shadow-2xs hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-xl bg-[#E5EDE7] text-[#102C26] font-mono font-extrabold text-sm flex items-center justify-center group-hover:bg-[#102C26] group-hover:text-white transition-colors duration-200">
                01
              </span>
              <Building2 className="w-5 h-5 text-[#102C26]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-[#102C26] tracking-tight font-heading">Set up your business</h4>
              <p className="text-xs text-[#52665F] leading-relaxed">
                Create your business profile and workspace settings.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#DCE7E1] p-6 space-y-4 shadow-2xs hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-xl bg-[#E5EDE7] text-[#102C26] font-mono font-extrabold text-sm flex items-center justify-center group-hover:bg-[#102C26] group-hover:text-white transition-colors duration-200">
                02
              </span>
              <Scissors className="w-5 h-5 text-[#102C26]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-[#102C26] tracking-tight font-heading">Add services & staff</h4>
              <p className="text-xs text-[#52665F] leading-relaxed">
                Catalog your service offerings, set pricing, and invite staff.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#DCE7E1] p-6 space-y-4 shadow-2xs hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-xl bg-[#E5EDE7] text-[#102C26] font-mono font-extrabold text-sm flex items-center justify-center group-hover:bg-[#102C26] group-hover:text-white transition-colors duration-200">
                03
              </span>
              <UserPlus className="w-5 h-5 text-[#102C26]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-[#102C26] tracking-tight font-heading">Customers book</h4>
              <p className="text-xs text-[#52665F] leading-relaxed">
                Clients pick a service, specialist, and available time slot.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#DCE7E1] p-6 space-y-4 shadow-2xs hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-xl bg-[#E5EDE7] text-[#102C26] font-mono font-extrabold text-sm flex items-center justify-center group-hover:bg-[#102C26] group-hover:text-white transition-colors duration-200">
                04
              </span>
              <CalendarCheck className="w-5 h-5 text-[#102C26]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-[#102C26] tracking-tight font-heading">Manage appointments</h4>
              <p className="text-xs text-[#52665F] leading-relaxed">
                Track status, organize staff schedules, and fulfill bookings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHO IS SERVICEHUB FOR? */}
      <section id="for-businesses" className="max-w-7xl mx-auto px-4 space-y-10 relative z-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#102C26] font-mono bg-[#DCE7E1] px-3.5 py-1 rounded-full border border-[#AEC5B8]/60 shadow-2xs">
            Industry Verticals
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#102C26] tracking-tight font-heading">
            Who is ServiceHub for?
          </h2>
          <p className="text-sm text-[#52665F]">
            Designed to support a wide range of service-based businesses.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl border border-[#DCE7E1] p-5 flex items-center space-x-3.5 shadow-2xs hover:shadow-sm transition-all duration-200">
            <div className="w-10 h-10 rounded-xl bg-[#E5EDE7] text-[#102C26] flex items-center justify-center flex-shrink-0 border border-[#AEC5B8]/40">
              <Scissors className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-sm text-[#102C26]">Salons & Beauty</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#DCE7E1] p-5 flex items-center space-x-3.5 shadow-2xs hover:shadow-sm transition-all duration-200">
            <div className="w-10 h-10 rounded-xl bg-[#E5EDE7] text-[#102C26] flex items-center justify-center flex-shrink-0 border border-[#AEC5B8]/40">
              <Dumbbell className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-sm text-[#102C26]">Fitness Centers</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#DCE7E1] p-5 flex items-center space-x-3.5 shadow-2xs hover:shadow-sm transition-all duration-200">
            <div className="w-10 h-10 rounded-xl bg-[#E5EDE7] text-[#102C26] flex items-center justify-center flex-shrink-0 border border-[#AEC5B8]/40">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-sm text-[#102C26]">Tutors & Coaching</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#DCE7E1] p-5 flex items-center space-x-3.5 shadow-2xs hover:shadow-sm transition-all duration-200">
            <div className="w-10 h-10 rounded-xl bg-[#E5EDE7] text-[#102C26] flex items-center justify-center flex-shrink-0 border border-[#AEC5B8]/40">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-sm text-[#102C26]">Consultants</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#DCE7E1] p-5 flex items-center space-x-3.5 shadow-2xs hover:shadow-sm transition-all duration-200">
            <div className="w-10 h-10 rounded-xl bg-[#E5EDE7] text-[#102C26] flex items-center justify-center flex-shrink-0 border border-[#AEC5B8]/40">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-sm text-[#102C26]">Cleaning Services</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#DCE7E1] p-5 flex items-center space-x-3.5 shadow-2xs hover:shadow-sm transition-all duration-200">
            <div className="w-10 h-10 rounded-xl bg-[#E5EDE7] text-[#102C26] flex items-center justify-center flex-shrink-0 border border-[#AEC5B8]/40">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-sm text-[#102C26]">Repair & Maintenance</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#DCE7E1] p-5 flex items-center space-x-3.5 shadow-2xs hover:shadow-sm transition-all duration-200">
            <div className="w-10 h-10 rounded-xl bg-[#E5EDE7] text-[#102C26] flex items-center justify-center flex-shrink-0 border border-[#AEC5B8]/40">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-sm text-[#102C26]">Wellness Businesses</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#DCE7E1] p-5 flex items-center space-x-3.5 shadow-2xs hover:shadow-sm transition-all duration-200">
            <div className="w-10 h-10 rounded-xl bg-[#E5EDE7] text-[#102C26] flex items-center justify-center flex-shrink-0 border border-[#AEC5B8]/40">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-sm text-[#102C26]">Other Service Businesses</span>
          </div>
        </div>
      </section>

      {/* 5. EXPERIENCES BY ROLE */}
      <section id="experiences" className="max-w-7xl mx-auto px-4 space-y-10 relative z-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#102C26] font-mono bg-[#DCE7E1] px-3.5 py-1 rounded-full border border-[#AEC5B8]/60 shadow-2xs">
            Role-Tailored Portals
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#102C26] tracking-tight font-heading">
            Built for everyone in your operation.
          </h2>
          <p className="text-sm text-[#52665F]">
            Dedicated portals tailored for customers, staff members, and business owners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-[#DCE7E1] p-8 space-y-4 shadow-2xs hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-[#E5EDE7] text-[#102C26] flex items-center justify-center font-bold border border-[#AEC5B8]/50">
              <UserCircle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <span className="sh-badge-primary">CUSTOMERS</span>
              <h3 className="text-xl font-extrabold text-[#102C26] tracking-tight font-heading">Seamless Booking</h3>
              <p className="text-xs text-[#52665F] leading-relaxed font-medium">
                Discover local service businesses and book appointments with instant slot reservation.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#DCE7E1] p-8 space-y-4 shadow-2xs hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center font-bold border border-[#3B82F6]/30">
              <UserCheck className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <span className="sh-badge-purple">STAFF</span>
              <h3 className="text-xl font-extrabold text-[#102C26] tracking-tight font-heading">Organized Workday</h3>
              <p className="text-xs text-[#52665F] leading-relaxed font-medium">
                Manage appointments, services, schedules, and client records with staff-scoped RBAC.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#DCE7E1] p-8 space-y-4 shadow-2xs hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-[#E5EDE7] text-[#102C26] flex items-center justify-center font-bold border border-[#AEC5B8]/50">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <span className="sh-badge-emerald">OWNERS</span>
              <h3 className="text-xl font-extrabold text-[#102C26] tracking-tight font-heading">Full Operations Control</h3>
              <p className="text-xs text-[#52665F] leading-relaxed font-medium">
                Manage the entire business from one place — from service catalogs to multi-tenant venues.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA SECTION */}
      <section className="max-w-5xl mx-auto px-4 relative z-10">
        <div className="bg-white border border-[#DCE7E1] text-[#102C26] rounded-3xl p-8 sm:p-14 text-center space-y-6 shadow-sm relative overflow-hidden">
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#102C26] tracking-tight font-heading">
              Ready to simplify your service business?
            </h2>
            <p className="text-xs sm:text-sm text-[#52665F] leading-relaxed font-normal">
              Bring appointments, customers, services, and staff together with ServiceHub.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onGetStarted}
              className="group inline-flex items-center justify-center space-x-2 bg-[#102C26] hover:bg-[#0B1E1A] text-white font-bold text-sm px-9 py-4 rounded-full shadow-2xs hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] cursor-pointer"
            >
              <span>Get Started Free</span>
              <ChevronRight className="w-4 h-4 text-[#AEC5B8] group-hover:translate-x-0.5 transition-transform duration-200" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
