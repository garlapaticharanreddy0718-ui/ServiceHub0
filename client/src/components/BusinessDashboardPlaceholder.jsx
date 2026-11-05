import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';
import {
  Building2,
  Users,
  Calendar,
  Scissors,
  UserCheck,
  Plus,
  ArrowRight,
  Shield,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Star,
  TrendingUp,
  Sparkles,
  Bell,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Edit,
  Check,
  X
} from 'lucide-react';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Select from './ui/Select';
import LoadingState from './ui/LoadingState';
import TodayScheduleTimeline from './TodayScheduleTimeline';

export default function BusinessDashboardPlaceholder({ business, currentUser, onNavigate, onOpenSetupModal }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Owner Command Center Analytics from Backend API
  const fetchDashboardData = useCallback(async () => {
    if (!business?.id) return;
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest(`/owner/dashboard?businessId=${business.id}`, { method: 'GET' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load owner dashboard data.');
      }

      setDashboardData(data.data);
    } catch (err) {
      console.error('Owner dashboard error:', err);
      setError(err.message || 'Unable to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, [business?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading && !dashboardData) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-10 bg-[#D5E4DC] rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-28 bg-white rounded-2xl border border-[#D5E4DC]"></div>
          <div className="h-28 bg-white rounded-2xl border border-[#D5E4DC]"></div>
          <div className="h-28 bg-white rounded-2xl border border-[#D5E4DC]"></div>
          <div className="h-28 bg-white rounded-2xl border border-[#D5E4DC]"></div>
        </div>
      </div>
    );
  }

  const ownerName = currentUser?.name || dashboardData?.owner?.name || 'Lokesh Malhotra';
  const ownerFirstName = ownerName.split(' ')[0];
  const dateStr = dashboardData?.dateString || new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const pulse = dashboardData?.businessPulse || {
    todaysAppointmentsCount: 0,
    expectedRevenueToday: 0,
    completedRevenueToday: 0,
    bookedCapacityPercent: 0,
    returningCustomersPercent: 0,
  };

  const schedule = dashboardData?.todaysSchedule || [];
  const needsAttention = dashboardData?.needsAttention || [];
  const teamWorkload = dashboardData?.teamWorkload || [];
  const popularServices = dashboardData?.popularServices || [];
  const customerActivity = dashboardData?.customerActivity || {};
  const customerFeedback = dashboardData?.customerFeedback || {};
  const opportunities = dashboardData?.opportunities || [];
  const revenueSummary = dashboardData?.revenueSummary || {
    today: { expected: 0, completed: 0 },
    week: { expected: 0, completed: 0 },
    month: { expected: 0, completed: 0 },
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 text-[#173F35] font-sans">
      {/* 1. Header Greeting & Context Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#D5E4DC]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#173F35] tracking-tight font-heading">
            Good morning, {ownerFirstName}.
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#61766F] mt-0.5">
            Here's what's happening at <strong className="text-[#173F35] font-bold">{business.name}</strong> today.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-[#173F35] bg-white px-3 py-1.5 rounded-full border border-[#D5E4DC] shadow-2xs">
            📅 {dateStr}
          </span>
          <button
            type="button"
            aria-label="Notifications"
            className="p-2 rounded-full bg-white text-[#173F35] border border-[#D5E4DC] hover:bg-[#EEF5F1] transition-colors relative cursor-pointer"
          >
            <Bell className="w-4 h-4 text-[#173F35]" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white"></span>
          </button>
        </div>
      </div>

      {/* Complete Setup Reminder Banner (if setup is incomplete) */}
      {dashboardData?.setupStatus && !dashboardData.setupStatus.isSetupComplete && (
        <div className="p-4 rounded-2xl bg-[#E5EDE7] border border-[#CBDCD3] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#0B8F6A] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-sm text-[#102C26] font-heading">
                  Complete Your Business Setup
                </h3>
                <span className="text-[10px] font-extrabold bg-[#DFF2E9] text-[#0B8F6A] px-2 py-0.5 rounded-full border border-[#0B8F6A]/20">
                  {([dashboardData.setupStatus.steps?.services?.complete, dashboardData.setupStatus.steps?.team?.complete, dashboardData.setupStatus.steps?.availability?.complete].filter(Boolean).length)} of 3 completed
                </span>
              </div>
              <p className="text-xs text-[#52665F]">
                Add your services, team members and working hours to start accepting online appointments.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onOpenSetupModal) onOpenSetupModal();
              else if (onNavigate) onNavigate(!dashboardData.setupStatus.steps?.services?.complete ? 'services' : 'team');
            }}
            className="px-4 py-2.5 bg-[#1D4439] hover:bg-[#102C26] text-white text-xs font-extrabold rounded-xl transition-all shadow-2xs flex items-center space-x-2 flex-shrink-0 cursor-pointer self-end sm:self-auto"
          >
            <span>Resume Setup</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="text-xs font-bold text-rose-700 underline flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 2. Business Snapshot Card */}
      <div className="bg-white rounded-3xl border border-[#D5E4DC] p-6 shadow-[0_4px_20px_rgba(23,63,53,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-[#173F35] text-[#AEC5B8] flex items-center justify-center font-black text-xl shadow-2xs shrink-0">
            <Building2 className="w-7 h-7 text-[#AEC5B8]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <h2 className="text-xl font-black text-[#173F35] font-heading">{business.name}</h2>
              <span className="bg-[#E4EFE8] text-[#173F35] border border-[#C6DCD0] font-bold text-[10px] px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                {business.category || 'Beauty & Salon'}
              </span>
            </div>
            <p className="text-xs text-[#61766F] font-medium flex items-center space-x-1.5">
              <span>📍 {business.city || 'Hyderabad'}</span>
              <span>•</span>
              <span>{business.description || 'Professional service studio.'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('settings')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold text-[#173F35] bg-[#EEF5F1] hover:bg-[#E4EFE8] border border-[#D5E4DC] transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Business</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('customer-portal')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold text-[#173F35] bg-white hover:bg-slate-50 border border-[#D5E4DC] transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Profile</span>
          </button>
        </div>
      </div>

      {/* 3. Needs Your Attention Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-[#173F35] font-heading flex items-center space-x-2">
            <AlertCircle className="w-4.5 h-4.5 text-amber-600" />
            <span>Needs your attention</span>
          </h3>
        </div>

        {needsAttention.length === 0 ? (
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs font-bold text-emerald-900 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Everything looks good today. All operations are running smoothly.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {needsAttention.map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigate && onNavigate(item.targetTab)}
                className="p-4 bg-white rounded-2xl border border-amber-200 shadow-2xs hover:shadow-sm hover:border-amber-300 transition-all cursor-pointer space-y-2 group flex items-start space-x-3.5"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 font-mono font-black text-sm flex items-center justify-center shrink-0">
                  {item.count}
                </div>
                <div className="space-y-0.5 flex-1">
                  <p className="text-xs font-bold text-[#173F35] group-hover:text-amber-900 transition-colors">
                    {item.title}
                  </p>
                  <span className="text-[10px] font-semibold text-amber-700 flex items-center space-x-1">
                    <span>Review now</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Business Pulse Grid */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-black text-[#173F35] font-heading">
            Business Pulse
          </h3>
          <p className="text-xs text-[#61766F] font-medium">A snapshot of your business today.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div
            onClick={() => onNavigate && onNavigate('bookings')}
            className="p-5 bg-white rounded-3xl border border-[#D5E4DC] shadow-[0_4px_20px_rgba(23,63,53,0.04)] space-y-2 hover:border-[#173F35]/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[#61766F]">
              <span className="text-[11px] font-bold uppercase tracking-wider">Today's Appointments</span>
              <Calendar className="w-4 h-4 text-[#173F35]" />
            </div>
            <div className="text-3xl font-black font-heading text-[#173F35]">
              {pulse.todaysAppointmentsCount}
            </div>
            <p className="text-[11px] font-medium text-[#61766F]">Booked for today</p>
          </div>

          <div
            onClick={() => onNavigate && onNavigate('bookings')}
            className="p-5 bg-white rounded-3xl border border-[#D5E4DC] shadow-[0_4px_20px_rgba(23,63,53,0.04)] space-y-2 hover:border-[#173F35]/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[#61766F]">
              <span className="text-[11px] font-bold uppercase tracking-wider">Expected Revenue</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black font-heading text-[#173F35]">
              ₹{pulse.expectedRevenueToday.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] font-medium text-[#61766F]">
              Completed: ₹{pulse.completedRevenueToday.toLocaleString('en-IN')}
            </p>
          </div>

          <div
            onClick={() => onNavigate && onNavigate('staff')}
            className="p-5 bg-white rounded-3xl border border-[#D5E4DC] shadow-[0_4px_20px_rgba(23,63,53,0.04)] space-y-2 hover:border-[#173F35]/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[#61766F]">
              <span className="text-[11px] font-bold uppercase tracking-wider">Booked Capacity</span>
              <Clock className="w-4 h-4 text-[#173F35]" />
            </div>
            <div className="text-3xl font-black font-heading text-[#173F35]">
              {pulse.bookedCapacityPercent}%
            </div>
            <p className="text-[11px] font-medium text-[#61766F]">Schedule occupancy</p>
          </div>

          <div
            onClick={() => onNavigate && onNavigate('customers')}
            className="p-5 bg-white rounded-3xl border border-[#D5E4DC] shadow-[0_4px_20px_rgba(23,63,53,0.04)] space-y-2 hover:border-[#173F35]/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[#61766F]">
              <span className="text-[11px] font-bold uppercase tracking-wider">Returning Customers</span>
              <Users className="w-4 h-4 text-[#173F35]" />
            </div>
            <div className="text-3xl font-black font-heading text-[#173F35]">
              {pulse.returningCustomersPercent}%
            </div>
            <p className="text-[11px] font-medium text-[#61766F]">Repeat booking rate</p>
          </div>
        </div>
      </div>

      {/* 5. Today's Schedule Timeline */}
      <TodayScheduleTimeline
        todaysSchedule={dashboardData?.todaysSchedule}
        businessId={business?.id}
        onNavigate={onNavigate}
        onRefresh={fetchDashboardData}
      />

      {/* 6. Revenue at a Glance & Team Workload (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue at a Glance */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#D5E4DC] shadow-[0_4px_20px_rgba(23,63,53,0.04)] p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#173F35] font-heading flex items-center space-x-2">
              <TrendingUp className="w-4.5 h-4.5 text-emerald-600" />
              <span>Revenue at a Glance</span>
            </h3>
            <p className="text-xs text-[#61766F] font-medium">Expected revenue vs completed revenue from appointments.</p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-[#F4F8F6] border border-[#D5E4DC]/70 text-center space-y-1">
              <span className="text-[10px] font-bold text-[#61766F] uppercase tracking-wider block">Today</span>
              <p className="text-sm font-black text-[#173F35]">₹{revenueSummary.today.expected.toLocaleString('en-IN')}</p>
              <p className="text-[10px] font-semibold text-emerald-700">Done: ₹{revenueSummary.today.completed.toLocaleString('en-IN')}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F4F8F6] border border-[#D5E4DC]/70 text-center space-y-1">
              <span className="text-[10px] font-bold text-[#61766F] uppercase tracking-wider block">This Week</span>
              <p className="text-sm font-black text-[#173F35]">₹{revenueSummary.week.expected.toLocaleString('en-IN')}</p>
              <p className="text-[10px] font-semibold text-emerald-700">Done: ₹{revenueSummary.week.completed.toLocaleString('en-IN')}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F4F8F6] border border-[#D5E4DC]/70 text-center space-y-1">
              <span className="text-[10px] font-bold text-[#61766F] uppercase tracking-wider block">This Month</span>
              <p className="text-sm font-black text-[#173F35]">₹{revenueSummary.month.expected.toLocaleString('en-IN')}</p>
              <p className="text-[10px] font-semibold text-emerald-700">Done: ₹{revenueSummary.month.completed.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Team Workload */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#D5E4DC] shadow-[0_4px_20px_rgba(23,63,53,0.04)] p-6 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-[#173F35] font-heading flex items-center space-x-2">
                <UserCheck className="w-4.5 h-4.5 text-[#173F35]" />
                <span>Team Workload</span>
              </h3>
              <p className="text-xs text-[#61766F] font-medium">Capacity occupancy for active staff members today.</p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('staff')}
              className="text-xs font-bold text-[#173F35] hover:underline cursor-pointer"
            >
              View Team →
            </button>
          </div>

          <div className="space-y-3.5 pt-1">
            {teamWorkload.length === 0 ? (
              <p className="text-xs text-[#61766F] italic">No active staff members assigned.</p>
            ) : (
              teamWorkload.map((member) => (
                <div key={member.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#173F35]">{member.displayName}</span>
                    <span className="font-mono text-[#61766F]">{member.capacityPercent}% ({member.bookingsCount} bookings)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#EEF5F1] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${member.capacityPercent >= 75 ? 'bg-amber-500' : 'bg-[#173F35]'}`}
                      style={{ width: `${member.capacityPercent}%` }}
                    />
                  </div>
                  {member.warningMessage && (
                    <p className="text-[10px] font-bold text-amber-700 mt-0.5">{member.warningMessage}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 7. Popular Services & Customer Activity (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Popular Services */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#D5E4DC] shadow-[0_4px_20px_rgba(23,63,53,0.04)] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5EDE7] pb-3">
            <div>
              <h3 className="text-base font-black text-[#173F35] font-heading flex items-center space-x-2">
                <Scissors className="w-4.5 h-4.5 text-[#173F35]" />
                <span>Popular Services</span>
              </h3>
              <p className="text-xs text-[#61766F] font-medium">Top services ranked by booking volume.</p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('services')}
              className="text-xs font-bold text-[#173F35] hover:underline cursor-pointer"
            >
              View Services →
            </button>
          </div>

          <div className="space-y-3">
            {popularServices.length === 0 ? (
              <p className="text-xs text-[#61766F] italic">No service data available yet.</p>
            ) : (
              popularServices.map((svc, idx) => (
                <div key={svc.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#F4F8F6] border border-[#D5E4DC]/70 text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-lg bg-[#173F35] text-white font-mono font-bold text-xs flex items-center justify-center">
                      0{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-[#173F35] font-heading">{svc.name}</h4>
                      <p className="text-[11px] text-[#61766F]">₹{svc.price} • {svc.durationMinutes} mins</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-[#173F35] block">{svc.bookingsCount} bookings</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">₹{svc.revenueContribution.toLocaleString('en-IN')} rev</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Customer Activity & Feedback */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#D5E4DC] shadow-[0_4px_20px_rgba(23,63,53,0.04)] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5EDE7] pb-3">
            <div>
              <h3 className="text-base font-black text-[#173F35] font-heading flex items-center space-x-2">
                <Star className="w-4.5 h-4.5 text-amber-500 fill-amber-500" />
                <span>Customer Feedback</span>
              </h3>
              <p className="text-xs text-[#61766F] font-medium">Reputation and client reviews.</p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('reports')}
              className="text-xs font-bold text-[#173F35] hover:underline cursor-pointer"
            >
              View Reviews →
            </button>
          </div>

          <div className="flex items-center space-x-4 p-4 rounded-2xl bg-[#F4F8F6] border border-[#D5E4DC]/70">
            <div className="text-center px-4 border-r border-[#D5E4DC]">
              <div className="text-3xl font-black text-[#173F35] font-heading flex items-center justify-center space-x-1">
                <span>
                  {customerFeedback.totalReviews > 0
                    ? (customerFeedback.averageRating ? Number(customerFeedback.averageRating).toFixed(1) : '0.0')
                    : '0.0'}
                </span>
                <span className="text-amber-500 text-2xl">★</span>
              </div>
              <span className="text-[10px] font-bold text-[#61766F] uppercase">
                {customerFeedback.totalReviews || 0} Reviews
              </span>
            </div>

            <div className="flex-1 space-y-2">
              {customerFeedback.recentReviews && customerFeedback.recentReviews.length > 0 ? (
                customerFeedback.recentReviews.map((rev) => (
                  <div key={rev.id} className="text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#173F35]">{rev.customerName}</span>
                      <span className="text-amber-600 font-bold text-[11px]">{"★".repeat(rev.rating)}</span>
                    </div>
                    <p className="text-[11px] text-[#61766F] italic line-clamp-1">"{rev.comment || 'Great service!'}"</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#61766F] italic">No customer reviews recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 8. Business Growth Opportunities */}
      <div className="bg-white rounded-3xl border border-[#D5E4DC] shadow-[0_4px_20px_rgba(23,63,53,0.04)] p-6 space-y-4">
        <div>
          <h3 className="text-base font-black text-[#173F35] font-heading flex items-center space-x-2">
            <Sparkles className="w-4.5 h-4.5 text-emerald-600" />
            <span>Business Opportunities</span>
          </h3>
          <p className="text-xs text-[#61766F] font-medium">Useful insights to help your business grow.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              onClick={() => onNavigate && onNavigate(opp.targetTab)}
              className="p-4 rounded-2xl bg-[#F4F8F6] border border-[#D5E4DC] hover:border-[#173F35] transition-all cursor-pointer space-y-1.5 group flex items-start justify-between"
            >
              <div className="space-y-1 pr-3">
                <h4 className="text-xs font-bold text-[#173F35] font-heading group-hover:text-emerald-800 transition-colors">
                  {opp.title}
                </h4>
                <p className="text-[11px] text-[#61766F] font-medium leading-relaxed">
                  {opp.explanation}
                </p>
              </div>
              <span className="w-7 h-7 rounded-full bg-white border border-[#D5E4DC] flex items-center justify-center shrink-0 group-hover:bg-[#173F35] group-hover:text-white transition-colors">
                <ArrowRight className="w-3.5 h-3.5 text-[#173F35] group-hover:text-white" />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 9. Quick Actions Bar */}
      <div className="bg-[#173F35] text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-black font-heading">Quick Actions</h4>
          <p className="text-xs text-[#AEC5B8]">Fast shortcuts for daily business management.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('bookings')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold text-[#173F35] bg-white hover:bg-emerald-50 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Booking</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('customers')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold text-[#173F35] bg-white hover:bg-emerald-50 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('services')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold text-[#173F35] bg-white hover:bg-emerald-50 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Service</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('staff')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold text-[#173F35] bg-white hover:bg-emerald-50 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>
    </div>
  );
}
