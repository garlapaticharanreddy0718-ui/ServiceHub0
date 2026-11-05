import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  UserCheck,
  Scissors,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Award,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import LoadingState from './ui/LoadingState';

export default function OwnerPerformance({ selectedBusiness }) {
  const [period, setPeriod] = useState('month'); // 'today' | 'week' | 'month'
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPerformanceData = useCallback(async () => {
    if (!selectedBusiness?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest(`/owner/dashboard?businessId=${selectedBusiness.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load business performance analytics.');
      setDashboardData(data.data);
    } catch (err) {
      console.error('Performance fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedBusiness?.id]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  if (loading) {
    return (
      <div className="h-80 bg-white rounded-2xl border border-[#D5E4DC] p-8 flex items-center justify-center">
        <LoadingState message="Calculating business performance metrics..." />
      </div>
    );
  }

  const {
    revenueSummary = { today: { expected: 0, completed: 0 }, week: { expected: 0, completed: 0 }, month: { expected: 0, completed: 0 } },
    businessPulse = {},
    teamWorkload = [],
    popularServices = [],
    customerActivity = {},
  } = dashboardData || {};

  const currentRevenue =
    period === 'today'
      ? revenueSummary.today
      : period === 'week'
      ? revenueSummary.week
      : revenueSummary.month;

  return (
    <div className="space-y-8 text-[#173F35] font-sans pb-12">
      {/* Header & Period Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D5E4DC]">
        <div>
          <h1 className="text-2xl font-black text-[#173F35] tracking-tight font-heading">
            Business Performance & Analytics
          </h1>
          <p className="text-xs text-[#61766F] font-medium mt-0.5">
            Key growth indicators, revenue breakdown, team efficiency, and customer retention metrics.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Period selector */}
          <div className="inline-flex p-1 bg-white border border-[#D5E4DC] rounded-xl text-xs font-bold shadow-2xs">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === 'today' ? 'bg-[#123A32] text-white' : 'text-[#61766F] hover:text-[#173F35]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === 'week' ? 'bg-[#123A32] text-white' : 'text-[#61766F] hover:text-[#173F35]'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === 'month' ? 'bg-[#123A32] text-white' : 'text-[#61766F] hover:text-[#173F35]'
              }`}
            >
              Last 30 Days
            </button>
          </div>

          <button
            onClick={fetchPerformanceData}
            className="p-2 bg-white text-[#123A32] border border-[#D5E4DC] rounded-xl hover:bg-[#EEF6F1] transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchPerformanceData} className="text-xs font-bold text-rose-700 underline">
            Retry
          </button>
        </div>
      )}

      {/* 1. Executive Performance Questions Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* What is performing best? */}
        <div className="bg-white border border-[#D5E4DC] rounded-2xl p-5 shadow-2xs space-y-2 border-l-4 border-l-emerald-600">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800">
            <Award className="w-4 h-4 text-emerald-600" />
            <span className="uppercase tracking-wider">What is performing best?</span>
          </div>
          <p className="text-sm font-extrabold text-[#173F35]">
            {popularServices[0] ? popularServices[0].name : 'Primary Services'}
          </p>
          <p className="text-xs text-[#61766F] font-medium">
            Generated {popularServices[0]?.bookingsCount || 0} completed bookings recently.
          </p>
        </div>

        {/* What is improving? */}
        <div className="bg-white border border-[#D5E4DC] rounded-2xl p-5 shadow-2xs space-y-2 border-l-4 border-l-teal-600">
          <div className="flex items-center space-x-2 text-xs font-bold text-teal-800">
            <ArrowUpRight className="w-4 h-4 text-teal-600" />
            <span className="uppercase tracking-wider">What is improving?</span>
          </div>
          <p className="text-sm font-extrabold text-[#173F35]">
            Client Retention ({businessPulse.returningCustomersPercent || 0}%)
          </p>
          <p className="text-xs text-[#61766F] font-medium">
            {customerActivity.returningCustomers || 0} returning clients (2+ completed visits).
          </p>
        </div>

        {/* What is slowing down? */}
        <div className="bg-white border border-[#D5E4DC] rounded-2xl p-5 shadow-2xs space-y-2 border-l-4 border-l-amber-600">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-800">
            <TrendingDown className="w-4 h-4 text-amber-600" />
            <span className="uppercase tracking-wider">What needs re-engagement?</span>
          </div>
          <p className="text-sm font-extrabold text-[#173F35]">
            {customerActivity.inactiveCustomers || 0} Inactive Clients
          </p>
          <p className="text-xs text-[#61766F] font-medium">
            Have not booked an appointment in over 30 days.
          </p>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="bg-white border border-[#D5E4DC] rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#61766F]">
            <span>Expected Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-[#173F35] font-heading">
            ₹{currentRevenue?.expected?.toLocaleString() || '0'}
          </div>
          <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
            Completed: ₹{currentRevenue?.completed?.toLocaleString() || '0'}
          </div>
        </div>

        {/* Capacity Card */}
        <div className="bg-white border border-[#D5E4DC] rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#61766F]">
            <span>Booked Capacity</span>
            <Calendar className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-[#173F35] font-heading">
            {businessPulse.bookedCapacityPercent || 0}%
          </div>
          <p className="text-[11px] text-[#61766F] font-medium">
            Based on team schedules & appointments
          </p>
        </div>

        {/* Total Customers */}
        <div className="bg-white border border-[#D5E4DC] rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#61766F]">
            <span>Total Customers</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-[#173F35] font-heading">
            {customerActivity.totalCustomers || 0}
          </div>
          <p className="text-[11px] text-[#61766F] font-medium">
            +{customerActivity.newCustomersMonth || 0} new this month
          </p>
        </div>

        {/* Average Rating */}
        <div className="bg-white border border-[#D5E4DC] rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#61766F]">
            <span>Client Satisfaction</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-[#173F35] font-heading">
            {dashboardData?.customerFeedback?.averageRating || '0.0'} ★
          </div>
          <p className="text-[11px] text-[#61766F] font-medium">
            From {dashboardData?.customerFeedback?.totalReviews || 0} verified reviews
          </p>
        </div>
      </div>

      {/* 3. Deep Performance Breakdown Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Services Breakdown */}
        <div className="bg-white border border-[#D5E4DC] rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6EFEA]">
            <div className="flex items-center space-x-2 text-xs font-black text-[#123A32]">
              <Scissors className="w-4 h-4 text-[#123A32]" />
              <span>TOP PERFORMING SERVICES</span>
            </div>
            <span className="text-[10px] font-extrabold bg-[#EEF6F1] text-[#123A32] px-2 py-0.5 rounded-full border border-[#D5E4DC]">
              BY BOOKINGS
            </span>
          </div>

          <div className="space-y-3">
            {popularServices.length === 0 ? (
              <p className="text-xs text-[#8C9E96] italic text-center py-6">No service analytics recorded yet.</p>
            ) : (
              popularServices.map((svc, idx) => (
                <div
                  key={svc.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#F7FAFA] border border-[#E6EFEA]"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-[#123A32] text-white font-black text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#173F35]">{svc.name}</h4>
                      <p className="text-[10px] text-[#61766F] font-medium">
                        ₹{svc.price} • {svc.durationMinutes} mins
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-[#173F35]">{svc.bookingsCount} bookings</span>
                    <p className="text-[10px] font-bold text-emerald-700">₹{svc.revenueContribution?.toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Team Workload Breakdown */}
        <div className="bg-white border border-[#D5E4DC] rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6EFEA]">
            <div className="flex items-center space-x-2 text-xs font-black text-[#123A32]">
              <UserCheck className="w-4 h-4 text-[#123A32]" />
              <span>TEAM WORKLOAD & CAPACITY</span>
            </div>
            <span className="text-[10px] font-extrabold bg-[#EEF6F1] text-[#123A32] px-2 py-0.5 rounded-full border border-[#D5E4DC]">
              TODAY
            </span>
          </div>

          <div className="space-y-4">
            {teamWorkload.length === 0 ? (
              <p className="text-xs text-[#8C9E96] italic text-center py-6">No staff members registered.</p>
            ) : (
              teamWorkload.map((st) => (
                <div key={st.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#173F35]">{st.displayName}</span>
                    <span className="text-[#61766F]">
                      {st.bookingsCount} appointments ({st.capacityPercent}%)
                    </span>
                  </div>

                  <div className="h-2.5 bg-[#EEF6F1] rounded-full overflow-hidden border border-[#D5E4DC]/60">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        st.capacityPercent >= 75
                          ? 'bg-amber-500'
                          : st.capacityPercent >= 40
                          ? 'bg-emerald-600'
                          : 'bg-teal-600'
                      }`}
                      style={{ width: `${Math.max(5, st.capacityPercent)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
