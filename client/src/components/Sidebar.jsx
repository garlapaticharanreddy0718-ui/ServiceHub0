import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Users,
  Scissors,
  UserCheck,
  Star,
  TrendingUp,
  Sparkles,
  Settings,
  LogOut,
  Building2,
  MapPin,
  ChevronRight,
  Plus
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  selectedBusiness,
  onNewBusiness,
  currentUser,
  onLogout
}) {
  const sections = [
    {
      title: 'OWNER WORKSPACE',
      items: [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'bookings', label: 'Appointments', icon: Calendar },
        { id: 'calendar', label: 'Calendar', icon: CalendarDays },
      ],
    },
    {
      title: 'BUSINESS',
      items: [
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'services', label: 'Services', icon: Scissors },
        { id: 'team', label: 'Team', icon: UserCheck },
        { id: 'reviews', label: 'Reviews', icon: Star },
      ],
    },
    {
      title: 'INSIGHTS',
      items: [
        { id: 'performance', label: 'Performance', icon: TrendingUp },
        { id: 'opportunities', label: 'Opportunities', icon: Sparkles },
      ],
    },
    {
      title: 'SETUP',
      items: [
        { id: 'settings', label: 'Business Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-full md:w-80 md:min-w-[320px] md:max-w-[320px] bg-[#0C2920] text-white border-r border-[#174336] shadow-xl flex-shrink-0 flex flex-col justify-between h-auto md:h-screen sticky top-0 overflow-y-auto select-none z-40">
      <div className="p-5 space-y-6">
        {/* Header: ServiceHub logo + Owner Portal badge */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <span className="text-base font-black tracking-wider text-white uppercase font-heading">
              SERVICEHUB
            </span>
          </div>
          <span className="text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#153E32] text-[#86C2AE] border border-[#205545]">
            OWNER PORTAL
          </span>
        </div>

        {/* Business Card */}
        {selectedBusiness ? (
          <div className="p-3.5 bg-[#13382D] border border-[#1E4E40] hover:border-[#2C6A58] rounded-2xl transition-all duration-200 space-y-1.5 shadow-xs">
            <div className="flex items-center space-x-1.5 text-[10px] font-bold text-[#7EAAA0] uppercase tracking-wider truncate">
              <Building2 className="w-3.5 h-3.5 text-[#7EAAA0] flex-shrink-0" />
              <span className="truncate">
                {selectedBusiness.category ? selectedBusiness.category.toUpperCase() : 'TUITION AND TRAINING'}
              </span>
            </div>
            <p className="text-sm sm:text-base font-bold text-white tracking-tight truncate font-heading">
              {selectedBusiness.name || 'DP Tutors'}
            </p>
            <p className="text-xs text-[#8BB7AC] flex items-center space-x-1 truncate">
              <span>📍</span>
              <span className="truncate">{selectedBusiness.city || 'Mumbai'}</span>
            </p>
          </div>
        ) : (
          <div className="p-3.5 bg-[#13382D] border border-[#1E4E40] rounded-2xl space-y-2">
            <div className="flex items-center space-x-1.5 text-[10px] font-bold text-[#7EAAA0] uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-[#7EAAA0]" />
              <span>TUITION AND TRAINING</span>
            </div>
            <p className="text-sm font-bold text-white font-heading">DP Tutors</p>
            <p className="text-xs text-[#8BB7AC]">📍 Mumbai</p>
            <button
              onClick={onNewBusiness}
              className="w-full mt-2 py-2 px-3 bg-[#1B4D3E] hover:bg-[#225E4D] border border-[#2A6C58] text-white rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>+ Create Business</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#8BB7AC]" />
            </button>
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="space-y-6">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="px-3 text-[10px] font-bold text-[#648D80] uppercase tracking-wider">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`group w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-[13px] transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-[#184F3F] text-white font-semibold shadow-xs'
                          : 'text-[#B2D0C6] hover:bg-[#13382D] hover:text-white font-medium'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-[#8BAEA3] group-hover:text-white'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Area: Divider + Logout */}
      <div className="p-5 pt-3 border-t border-[#174336] bg-[#0C2920]">
        <button
          onClick={onLogout}
          className="group w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-[13px] font-medium text-[#B2D0C6] hover:bg-[#13382D] hover:text-rose-300 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-[#8BAEA3] group-hover:text-rose-300 transition-colors flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
