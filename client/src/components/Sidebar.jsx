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
  ChevronRight,
  Plus
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, selectedBusiness, onNewBusiness, currentUser, onLogout }) {
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
    <aside className="w-full md:w-64 lg:w-72 bg-[#123A32] text-white border-r border-[#1F4D43] flex-shrink-0 flex flex-col justify-between p-5 h-auto md:h-screen sticky top-0 overflow-y-auto z-40">
      <div className="space-y-6">
        {/* Brand & Active Business Banner */}
        <div className="space-y-3">
          <div className="px-2 pt-1 flex items-center justify-between">
            <span className="text-xs font-black tracking-widest text-[#AEC5B8] uppercase font-heading">
              SERVICEHUB
            </span>
            <span className="text-[10px] font-extrabold bg-[#1F4D43] text-[#AEC5B8] px-2 py-0.5 rounded-full border border-[#2D6659]">
              OWNER PORTAL
            </span>
          </div>

          {selectedBusiness ? (
            <div className="p-3 bg-[#1A4B41] border border-[#2D6659] rounded-2xl space-y-1">
              <div className="flex items-center space-x-1.5 text-[10px] font-bold text-[#AEC5B8] uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-[#AEC5B8]" />
                <span className="truncate">{selectedBusiness.category || 'Beauty & Salon'}</span>
              </div>
              <p className="text-sm font-black text-white truncate font-heading">{selectedBusiness.name}</p>
              <p className="text-[11px] text-[#AEC5B8]/80 flex items-center space-x-1">
                <span>📍 {selectedBusiness.city || 'Hyderabad'}</span>
              </p>
            </div>
          ) : (
            <button
              onClick={onNewBusiness}
              className="w-full p-3 bg-white text-[#123A32] rounded-2xl text-xs font-extrabold hover:bg-[#E5EDE7] transition-all flex items-center justify-between shadow-2xs cursor-pointer"
            >
              <span>+ Create Business</span>
              <ChevronRight className="w-4 h-4 text-[#123A32]" />
            </button>
          )}
        </div>

        {/* Grouped Sidebar Sections */}
        <nav className="space-y-5">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[10px] font-black text-[#AEC5B8]/70 uppercase tracking-wider">
                {section.title}
              </div>
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={`${item.id}-${itemIdx}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-[#1A4B41] text-white font-extrabold border-l-3 border-[#AEC5B8] shadow-2xs'
                        : 'text-[#AEC5B8]/80 hover:bg-[#1A4B41]/60 hover:text-white font-medium'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#AEC5B8]/70'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Logout Action at Bottom */}
      <div className="pt-4 border-t border-[#1F4D43]">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-bold text-rose-300 hover:text-white hover:bg-rose-900/30 rounded-xl transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

