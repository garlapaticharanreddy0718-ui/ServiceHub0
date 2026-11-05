import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Users,
  Scissors,
  UserCheck,
  Coffee,
  AlertCircle,
  RefreshCw,
  Plus,
  Filter,
  CheckCircle2,
  PlayCircle,
  Ban,
  HelpCircle
} from 'lucide-react';
import PageHeader from './ui/PageHeader';
import AppointmentDetailsModal from './AppointmentDetailsModal';
import LoadingState from './ui/LoadingState';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Select from './ui/Select';
import Button from './ui/Button';

export default function OwnerCalendar({ selectedBusiness, currentUser, onNavigate }) {
  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [viewMode, setViewMode] = useState('day'); // 'day' | 'week'
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Reference & Data Lists
  const [staffList, setStaffList] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);

  // Filters
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [activeBooking, setActiveBooking] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New Booking Form State
  const [createForm, setCreateForm] = useState({
    customerId: '',
    serviceId: '',
    staffId: '',
    date: '',
    time: '09:00',
    notes: '',
  });

  // Current Time State for indicator line
  const [nowDate, setNowDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNowDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchReferenceData = useCallback(async () => {
    if (!selectedBusiness?.id) return;
    try {
      const [custRes, svcRes] = await Promise.all([
        apiRequest(`/businesses/${selectedBusiness.id}/customers?limit=100&status=active`),
        apiRequest(`/businesses/${selectedBusiness.id}/services`),
      ]);
      const [custData, svcData] = await Promise.all([custRes.json(), svcRes.json()]);
      if (custRes.ok) setCustomers(custData.data || []);
      if (svcRes.ok) setServices(svcData.data || []);
    } catch (err) {
      console.error('Failed to load calendar reference data:', err);
    }
  }, [selectedBusiness?.id]);

  const fetchCalendarData = useCallback(async () => {
    if (!selectedBusiness?.id) return;
    setLoading(true);
    setError(null);
    try {
      let startDateStr = selectedDate;
      let endDateStr = selectedDate;

      if (viewMode === 'week') {
        const [y, m, d] = selectedDate.split('-').map(Number);
        const curr = new Date(y, m - 1, d);
        const firstDay = new Date(curr);
        firstDay.setDate(firstDay.getDate() - firstDay.getDay());
        const lastDay = new Date(curr);
        lastDay.setDate(lastDay.getDate() - lastDay.getDay() + 6);

        startDateStr = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(firstDay.getDate()).padStart(2, '0')}`;
        endDateStr = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
      }

      const [staffRes, bookingRes] = await Promise.all([
        apiRequest(`/businesses/${selectedBusiness.id}/staff`),
        apiRequest(`/businesses/${selectedBusiness.id}/bookings?startDate=${startDateStr}&endDate=${endDateStr}&limit=300`),
      ]);

      const staffData = await staffRes.json();
      const bookingData = await bookingRes.json();

      if (!staffRes.ok) throw new Error(staffData.message || 'Failed to fetch staff members.');
      if (!bookingRes.ok) throw new Error(bookingData.message || 'Failed to fetch business bookings.');

      setStaffList(staffData.data || []);

      // Deduplicate bookings by b.id
      const uniqueMap = new Map();
      (bookingData.data || []).forEach((b) => {
        if (!uniqueMap.has(b.id)) uniqueMap.set(b.id, b);
      });
      setBookings(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error('Calendar data error:', err);
      setError(err.message || 'Unable to load your calendar.');
    } finally {
      setLoading(false);
    }
  }, [selectedBusiness?.id, selectedDate, viewMode]);

  useEffect(() => {
    fetchReferenceData();
    fetchCalendarData();
  }, [fetchReferenceData, fetchCalendarData]);

  // Date Navigation Steppers
  const handlePrevDate = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (viewMode === 'day') dateObj.setDate(dateObj.getDate() - 1);
    else dateObj.setDate(dateObj.getDate() - 7);

    const ny = dateObj.getFullYear();
    const nm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const nd = String(dateObj.getDate()).padStart(2, '0');
    setSelectedDate(`${ny}-${nm}-${nd}`);
  };

  const handleNextDate = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (viewMode === 'day') dateObj.setDate(dateObj.getDate() + 1);
    else dateObj.setDate(dateObj.getDate() + 7);

    const ny = dateObj.getFullYear();
    const nm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const nd = String(dateObj.getDate()).padStart(2, '0');
    setSelectedDate(`${ny}-${nm}-${nd}`);
  };

  const handleToday = () => {
    setSelectedDate(getTodayDateString());
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-').map(Number);
    if (parts.length < 3 || isNaN(parts[0])) return dateStr;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleBookingClick = (booking) => {
    setActiveBooking(booking);
    setDetailsModalOpen(true);
  };

  const handleOpenCreateModal = (staffId = '', time = '09:00') => {
    setCreateForm({
      customerId: customers[0]?.id || '',
      serviceId: services[0]?.id || '',
      staffId: staffId || staffList[0]?.id || '',
      date: selectedDate,
      time,
      notes: '',
    });
    setCreateModalOpen(true);
  };

  const handleCreateBookingSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setActionSuccess(null);

    const startIso = new Date(`${createForm.date}T${createForm.time}:00`).toISOString();

    const payload = {
      customerId: createForm.customerId,
      serviceId: createForm.serviceId,
      staffId: createForm.staffId,
      startTime: startIso,
      notes: createForm.notes || undefined,
    };

    try {
      const res = await apiRequest(`/businesses/${selectedBusiness.id}/bookings`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to schedule appointment.');

      setActionSuccess(`Appointment scheduled successfully!`);
      setCreateModalOpen(false);
      fetchCalendarData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Operating Hours Grid (09:00 to 18:00)
  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  // Active Staff Filtered List
  const visibleStaff = staffFilter === 'ALL'
    ? staffList
    : staffList.filter((st) => st.id === staffFilter);

  // Booking Status Filtered List
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    return true;
  });

  // Status Style Helper
  const getStatusStyle = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 shadow-2xs';
      case 'IN_PROGRESS':
        return 'bg-[#123A32] text-white border-[#123A32] shadow-sm animate-pulse';
      case 'COMPLETED':
        return 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200';
      case 'CANCELLED':
        return 'bg-[#F0F4F2] text-[#8C9E96] border-dashed border-[#CBDCD3] line-through opacity-60';
      case 'NO_SHOW':
        return 'bg-rose-50 text-rose-800 border-rose-200 opacity-70';
      case 'PENDING':
      default:
        return 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-2xs';
    }
  };

  const selectedServiceObj = services.find((s) => s.id === createForm.serviceId);

  // Check Current Time Indicator
  const isTodaySelected = selectedDate === getTodayDateString();
  const currentHour = nowDate.getHours();
  const currentMinute = nowDate.getMinutes();

  return (
    <div className="space-y-6 text-[#173F35] font-sans pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D5E4DC]">
        <div>
          <h1 className="text-2xl font-black text-[#173F35] tracking-tight font-heading">
            Business Calendar
          </h1>
          <p className="text-xs text-[#61766F] font-medium mt-0.5">
            Business-wide visual schedule across team members, Working hours, breaks, and time off.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCalendarData}
            icon={RefreshCw}
          >
            Refresh
          </Button>

          <Button size="sm" onClick={() => handleOpenCreateModal()} icon={Plus}>
            + New Booking
          </Button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchCalendarData} className="text-xs font-bold text-rose-700 underline cursor-pointer">
            Try Again
          </button>
        </div>
      )}

      {/* Calendar Toolbar: View Switcher, Date Stepper, Filters */}
      <div className="bg-white rounded-2xl border border-[#D5E4DC] shadow-2xs p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* View Switcher: Day | Week */}
          <div className="inline-flex p-1 bg-[#EEF6F1] border border-[#D5E4DC] rounded-xl text-xs font-extrabold shadow-2xs">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'day' ? 'bg-[#123A32] text-white shadow-2xs' : 'text-[#61766F] hover:text-[#173F35]'
              }`}
            >
              Day View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'week' ? 'bg-[#123A32] text-white shadow-2xs' : 'text-[#61766F] hover:text-[#173F35]'
              }`}
            >
              Week View
            </button>
          </div>

          {/* Date Navigation Bar */}
          <div className="flex items-center space-x-1.5 bg-[#EEF6F1] border border-[#D5E4DC] rounded-xl px-2.5 py-1">
            <button
              onClick={handlePrevDate}
              className="px-2 py-1 text-xs font-bold text-[#123A32] hover:bg-[#CBDCD3] rounded-lg transition-colors cursor-pointer"
            >
              ◀ Prev
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-extrabold text-[#123A32] bg-white border border-[#D5E4DC] rounded-lg shadow-2xs cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNextDate}
              className="px-2 py-1 text-xs font-bold text-[#123A32] hover:bg-[#CBDCD3] rounded-lg transition-colors cursor-pointer"
            >
              Next ▶
            </button>

            {/* Date Display Pill */}
            <div className="relative flex items-center bg-white border border-[#D5E4DC] px-3 py-1 rounded-lg text-xs font-extrabold text-[#173F35] shadow-2xs cursor-pointer">
              <span>📅 {formatDisplayDate(selectedDate)}</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* Filters Bar: Staff & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-[#E6EFEA]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#61766F]" />
              <span className="font-bold text-[#61766F]">Staff:</span>
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="px-3 py-1 bg-white border border-[#D5E4DC] rounded-xl text-xs font-bold text-[#173F35] cursor-pointer focus:ring-2 focus:ring-[#123A32]"
              >
                <option value="ALL">All Staff Specialists</option>
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.displayName || st.businessMember?.user?.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-[#61766F]" />
              <span className="font-bold text-[#61766F]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1 bg-white border border-[#D5E4DC] rounded-xl text-xs font-bold text-[#173F35] cursor-pointer focus:ring-2 focus:ring-[#123A32]"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="NO_SHOW">NO_SHOW</option>
              </select>
            </div>
          </div>

          {(staffFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setStaffFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="text-xs font-extrabold text-[#123A32] underline hover:text-emerald-800 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Calendar View Container */}
      {loading ? (
        <div className="h-96 bg-white rounded-2xl border border-[#D5E4DC] p-8 flex items-center justify-center">
          <LoadingState message="Loading business schedule..." />
        </div>
      ) : visibleStaff.length === 0 ? (
        /* Empty Staff State */
        <div className="bg-white border border-[#D5E4DC] rounded-2xl p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-[#AEC5B8] mx-auto opacity-70" />
          <h3 className="text-base font-extrabold text-[#173F35]">Add your first staff member to start scheduling</h3>
          <p className="text-xs text-[#61766F] max-w-sm mx-auto">
            Once staff members are added to your team, their schedules, breaks, and client appointments will appear on this calendar.
          </p>
          <button
            onClick={() => onNavigate && onNavigate('team')}
            className="px-4 py-2 bg-[#123A32] text-white rounded-xl text-xs font-extrabold hover:bg-[#1A4B41] transition-all cursor-pointer shadow-2xs inline-flex items-center space-x-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>+ Add Staff Member</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#D5E4DC] rounded-2xl shadow-2xs overflow-hidden relative">
          {/* Day View Schedule Grid */}
          {viewMode === 'day' ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#EEF6F1] border-b border-[#D5E4DC] text-xs font-bold text-[#123A32]">
                    <th className="w-24 p-3.5 text-center border-r border-[#D5E4DC] font-mono">Time</th>
                    {visibleStaff.map((st) => {
                      const staffName = st.displayName || st.businessMember?.user?.name || 'Staff';
                      const staffBookingsToday = filteredBookings.filter((b) => b.staffId === st.id);
                      const activeCount = staffBookingsToday.filter((b) => b.status !== 'CANCELLED' && b.status !== 'NO_SHOW').length;

                      return (
                        <th key={st.id} className="p-3.5 text-left border-r border-[#D5E4DC] min-w-[220px]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-7 h-7 rounded-full bg-[#123A32] text-white flex items-center justify-center text-xs font-black shadow-2xs">
                                {staffName.charAt(0)}
                              </div>
                              <div>
                                <span className="font-extrabold text-xs block text-[#173F35] truncate">{staffName}</span>
                                <span className="text-[10px] text-[#61766F] font-bold block">
                                  {activeCount} {activeCount === 1 ? 'appointment' : 'appointments'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6EFEA] text-xs font-sans relative">
                  {hours.map((hour) => {
                    const hourStr = `${hour.toString().padStart(2, '0')}:00`;
                    const hourFormatted = new Date(`2000-01-01T${hourStr}`).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    const isCurrentHourRow = isTodaySelected && currentHour === hour;

                    return (
                      <tr key={hour} className="hover:bg-[#F9FCFA] transition-colors relative">
                        {/* Time Column */}
                        <td className="p-3 font-bold text-center text-[#61766F] bg-[#F7FAFA] border-r border-[#D5E4DC] font-mono relative">
                          <span>{hourFormatted}</span>
                          {isCurrentHourRow && (
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-rose-500 z-10 pointer-events-none">
                              <span className="absolute -top-2 left-1 bg-rose-600 text-white text-[9px] font-black px-1 rounded">
                                ● {nowDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Staff Columns */}
                        {visibleStaff.map((st) => {
                          const staffName = st.displayName || st.businessMember?.user?.name || 'Staff';

                          // 1. Check Staff Working Hours for selected date (0 = Sunday, 1 = Monday, ...)
                          const [sy, sm, sd] = selectedDate.split('-').map(Number);
                          const dateObj = new Date(sy, sm - 1, sd);
                          const dayOfWeek = dateObj.getDay();

                          const scheduleToday = (st.schedules || []).find((sch) => sch.dayOfWeek === dayOfWeek);
                          let isWorkingDay = true;
                          let isWorkingHour = true;

                          if (!scheduleToday || scheduleToday.isAvailable === false) {
                            isWorkingDay = false;
                            isWorkingHour = false;
                          } else if (scheduleToday.startTime && scheduleToday.endTime) {
                            const [sh] = scheduleToday.startTime.split(':').map(Number);
                            const [eh] = scheduleToday.endTime.split(':').map(Number);
                            if (hour < sh || hour >= eh) isWorkingHour = false;
                          }

                          // 2. Check Staff Time Off
                          const hasTimeOff = (st.timeOffs || []).some((to) => {
                            const toStart = new Date(to.startDateTime);
                            const toEnd = new Date(to.endDateTime);
                            const slotStart = new Date(sy, sm - 1, sd, hour, 0, 0);
                            const slotEnd = new Date(sy, sm - 1, sd, hour + 1, 0, 0);
                            return toStart < slotEnd && toEnd > slotStart;
                          });

                          // 3. Check Staff Break
                          const activeBreak = (st.breaks || []).find((brk) => {
                            if (brk.dayOfWeek !== dayOfWeek) return false;
                            const [sh] = brk.startTime.split(':').map(Number);
                            const [eh] = brk.endTime.split(':').map(Number);
                            return hour >= sh && hour < eh;
                          });

                          // 4. Check Bookings for this staff & hour
                          const hourBookings = filteredBookings.filter((b) => {
                            if (b.staffId !== st.id) return false;
                            const bStart = new Date(b.startTime);
                            return bStart.getFullYear() === sy && bStart.getMonth() === sm - 1 && bStart.getDate() === sd && bStart.getHours() === hour;
                          });

                          // State Priority Order: 1. Time Off -> 2. Break -> 3. Active Booking -> 4. Working / Available -> 5. Off-Hours
                          return (
                            <td key={st.id} className="p-2 align-top border-r border-[#E6EFEA] min-w-[220px] relative">
                              {hasTimeOff ? (
                                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[10px] font-bold text-center">
                                  🏖️ TIME OFF
                                </div>
                              ) : activeBreak ? (
                                <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-[10px] font-bold text-center flex items-center justify-center space-x-1">
                                  <Coffee className="w-3.5 h-3.5 text-amber-700" />
                                  <span>{activeBreak.label || 'Lunch Break'}</span>
                                </div>
                              ) : hourBookings.length > 0 ? (
                                <div className="space-y-1.5">
                                  {hourBookings.map((b) => {
                                    const startT = new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    const endT = new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                    return (
                                      <button
                                        key={b.id}
                                        onClick={() => handleBookingClick(b)}
                                        className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer shadow-2xs ${getStatusStyle(
                                          b.status
                                        )}`}
                                      >
                                        <div className="flex items-center justify-between text-[10px] font-black mb-1">
                                          <span>{startT} - {endT}</span>
                                          <span className="uppercase text-[9px] px-1.5 py-0.2 rounded font-extrabold bg-white/80 border border-current">
                                            {b.status}
                                          </span>
                                        </div>
                                        <div className="font-extrabold truncate text-xs">{b.service?.name}</div>
                                        <div className="text-[11px] font-medium opacity-90 truncate mt-0.5">
                                          👤 {b.customer?.name || 'Client'}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : isWorkingHour ? (
                                <div
                                  onClick={() => handleOpenCreateModal(st.id, hourStr)}
                                  className="w-full h-full min-h-[44px] rounded-xl hover:bg-[#EEF6F1]/70 transition-all cursor-pointer flex items-center justify-center group border border-transparent hover:border-[#D5E4DC]"
                                  title={`Click to schedule at ${hourFormatted} with ${staffName}`}
                                >
                                  <span className="text-[10px] font-bold text-[#123A32] opacity-0 group-hover:opacity-100 transition-opacity">
                                    + Book
                                  </span>
                                </div>
                              ) : (
                                <div className="p-2.5 bg-[#F0F4F2]/70 text-[#8C9E96] rounded-xl text-[10px] font-bold italic text-center border border-dashed border-[#D5E4DC]">
                                  {!isWorkingDay ? 'OFF DAY' : 'Off-Hours'}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Week View Grid (7 Days) */
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
                  const [y, m, d] = selectedDate.split('-').map(Number);
                  const currDate = new Date(y, m - 1, d);
                  currDate.setDate(currDate.getDate() - currDate.getDay() + dayOffset);

                  const yearStr = currDate.getFullYear();
                  const monthStr = String(currDate.getMonth() + 1).padStart(2, '0');
                  const dateNumStr = String(currDate.getDate()).padStart(2, '0');
                  const dateIso = `${yearStr}-${monthStr}-${dateNumStr}`;

                  const dayName = currDate.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

                  const dayBookings = filteredBookings.filter((b) => {
                    const bStart = new Date(b.startTime);
                    const bYear = bStart.getFullYear();
                    const bMonth = String(bStart.getMonth() + 1).padStart(2, '0');
                    const bDay = String(bStart.getDate()).padStart(2, '0');
                    return `${bYear}-${bMonth}-${bDay}` === dateIso;
                  });

                  return (
                    <div key={dayOffset} className="bg-[#F7FAFA] border border-[#D5E4DC] rounded-2xl p-3.5 space-y-3">
                      <div className="text-xs font-black text-[#123A32] pb-2 border-b border-[#D5E4DC] flex items-center justify-between">
                        <span>{dayName}</span>
                        <span className="text-[10px] bg-white px-2 py-0.5 rounded-full font-bold border border-[#D5E4DC]">
                          {dayBookings.length}
                        </span>
                      </div>

                      <div className="space-y-2 min-h-[220px]">
                        {dayBookings.length === 0 ? (
                          <div className="text-[11px] text-[#8C9E96] italic text-center pt-12">No bookings</div>
                        ) : (
                          dayBookings.map((b) => (
                            <button
                              key={b.id}
                              onClick={() => handleBookingClick(b)}
                              className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer text-xs shadow-2xs ${getStatusStyle(
                                b.status
                              )}`}
                            >
                              <div className="font-extrabold truncate text-xs">{b.service?.name}</div>
                              <div className="text-[10px] opacity-90 truncate font-medium">👤 {b.customer?.name}</div>
                              <div className="text-[10px] font-bold text-[#61766F] mt-1">
                                {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {b.staff?.displayName || 'Staff'}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Appointment Details Modal */}
      {detailsModalOpen && activeBooking && (
        <AppointmentDetailsModal
          booking={activeBooking}
          businessId={selectedBusiness.id}
          onClose={() => setDetailsModalOpen(false)}
          onStatusUpdated={() => {
            setDetailsModalOpen(false);
            fetchCalendarData();
          }}
        />
      )}

      {/* Schedule New Appointment Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Schedule New Appointment"
        subtitle="Select customer, service, staff specialist, date and start time."
      >
        <form onSubmit={handleCreateBookingSubmit} className="space-y-4">
          <Select
            label="Customer *"
            required
            value={createForm.customerId}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, customerId: e.target.value }))}
          >
            <option value="" disabled>-- Select Customer --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email || c.phone || 'Client'})
              </option>
            ))}
          </Select>

          <Select
            label="Service *"
            required
            value={createForm.serviceId}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, serviceId: e.target.value }))}
          >
            <option value="" disabled>-- Select Service --</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (₹{Number(s.price).toFixed(0)} — {s.durationMinutes} min)
              </option>
            ))}
          </Select>

          <Select
            label="Staff Specialist *"
            required
            value={createForm.staffId}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, staffId: e.target.value }))}
          >
            <option value="" disabled>-- Select Staff Member --</option>
            {staffList.map((st) => (
              <option key={st.id} value={st.id}>
                {st.displayName || st.businessMember?.user?.name}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date *"
              type="date"
              required
              value={createForm.date}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, date: e.target.value }))}
            />

            <Input
              label="Start Time *"
              type="time"
              required
              value={createForm.time}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, time: e.target.value }))}
            />
          </div>

          {selectedServiceObj && (
            <div className="p-3 bg-[#EEF6F1] rounded-xl border border-[#D5E4DC] text-xs flex justify-between items-center text-[#173F35] font-bold">
              <span>Duration: <strong>{selectedServiceObj.durationMinutes} mins</strong></span>
              <span>Total Price: <strong className="text-emerald-700">₹{Number(selectedServiceObj.price).toFixed(0)}</strong></span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#173F35]">
              Notes
            </label>
            <textarea
              rows={2}
              value={createForm.notes}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Special instructions or client notes..."
              className="w-full px-3.5 py-2 bg-[#F7FAFA] border border-[#D5E4DC] rounded-xl text-xs text-[#173F35] focus:outline-none focus:ring-2 focus:ring-[#123A32] resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-[#E6EFEA]">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Schedule Appointment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
