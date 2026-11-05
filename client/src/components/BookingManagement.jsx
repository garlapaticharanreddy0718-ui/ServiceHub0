import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';
import {
  Calendar,
  Clock,
  User,
  Users,
  Scissors,
  Plus,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  History,
  Check,
  Play,
  XCircle,
} from 'lucide-react';
import PageHeader from './ui/PageHeader';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Drawer from './ui/Drawer';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Select from './ui/Select';
import EmptyState from './ui/EmptyState';
import LoadingState from './ui/LoadingState';
import AppointmentDetailsModal from './AppointmentDetailsModal';

export default function BookingManagement({ selectedBusiness, currentUser }) {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Dropdown reference lists
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [staffList, setStaffList] = useState([]);

  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(getTodayDateString());
  const [searchQuery, setSearchQuery] = useState('');
  const [summaryData, setSummaryData] = useState(null);

  // Modals & Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    customerId: '',
    serviceId: '',
    staffId: '',
    date: '',
    time: '09:00',
    notes: '',
  });

  const [rescheduleForm, setRescheduleForm] = useState({
    staffId: '',
    date: '',
    time: '09:00',
    notes: '',
  });

  const role = selectedBusiness?.currentUserRole || 'STAFF';

  const fetchReferenceData = useCallback(async () => {
    if (!selectedBusiness?.id) return;
    try {
      const [custRes, svcRes, stfRes] = await Promise.all([
        apiRequest(`/businesses/${selectedBusiness.id}/customers?limit=100&status=active`),
        apiRequest(`/businesses/${selectedBusiness.id}/services`),
        apiRequest(`/businesses/${selectedBusiness.id}/staff`),
      ]);

      const [custData, svcData, stfData] = await Promise.all([
        custRes.json(),
        svcRes.json(),
        stfRes.json(),
      ]);

      if (custRes.ok) setCustomers(custData.data || []);
      if (svcRes.ok) setServices(svcData.data || []);
      if (stfRes.ok) setStaffList(stfData.data || []);
    } catch (err) {
      console.error('Failed to load reference data:', err);
    }
  }, [selectedBusiness?.id]);

  const fetchBookings = useCallback(async (page = 1) => {
    if (!selectedBusiness?.id) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (statusFilter) params.append('status', statusFilter);
      if (staffFilter) params.append('staffId', staffFilter);
      if (serviceFilter) params.append('serviceId', serviceFilter);
      if (dateFilter) params.append('date', dateFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await apiRequest(`/businesses/${selectedBusiness.id}/bookings?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to fetch appointments.');

      // Deduplicate bookings by b.id
      const uniqueMap = new Map();
      (data.data || []).forEach((b) => {
        if (!uniqueMap.has(b.id)) uniqueMap.set(b.id, b);
      });
      setBookings(Array.from(uniqueMap.values()));

      if (data.pagination) setPagination(data.pagination);
      if (data.summary) setSummaryData(data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedBusiness?.id, statusFilter, staffFilter, serviceFilter, dateFilter, searchQuery]);

  useEffect(() => {
    fetchReferenceData();
    fetchBookings(1);
  }, [fetchReferenceData, fetchBookings]);

  const handleOpenCreateModal = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setCreateForm({
      customerId: customers[0]?.id || '',
      serviceId: services[0]?.id || '',
      staffId: staffList[0]?.id || '',
      date: todayStr,
      time: '09:00',
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

      if (!res.ok) throw new Error(data.message || 'Failed to create booking.');

      setActionSuccess(`Appointment created for '${data.data.customer?.name || 'Customer'}'`);
      setCreateModalOpen(false);
      fetchBookings(pagination.page);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenDetailDrawer = async (booking) => {
    try {
      const res = await apiRequest(`/businesses/${selectedBusiness.id}/bookings/${booking.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load booking details.');

      setActiveBooking(data.data);
      setDetailDrawerOpen(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChangeStatus = async (newStatus, reason = '') => {
    if (!activeBooking) return;
    try {
      const res = await apiRequest(`/businesses/${selectedBusiness.id}/bookings/${activeBooking.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update status.');

      setActionSuccess(`Updated appointment status to ${newStatus}`);
      setActiveBooking(data.data);
      setDetailDrawerOpen(false);
      fetchBookings(pagination.page);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancelBooking = async () => {
    if (!activeBooking) return;
    const reason = prompt('Cancellation reason (optional):');
    if (reason === null) return;

    try {
      const res = await apiRequest(`/businesses/${selectedBusiness.id}/bookings/${activeBooking.id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to cancel appointment.');

      setActionSuccess(`Appointment cancelled.`);
      setDetailDrawerOpen(false);
      fetchBookings(pagination.page);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenRescheduleModal = (booking) => {
    const d = new Date(booking.startTime);
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = d.toTimeString().substring(0, 5);

    setActiveBooking(booking);
    setRescheduleForm({
      staffId: booking.staffId || '',
      date: dateStr,
      time: timeStr,
      notes: booking.notes || '',
    });
    setRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!activeBooking) return;

    const startIso = new Date(`${rescheduleForm.date}T${rescheduleForm.time}:00`).toISOString();

    try {
      const res = await apiRequest(`/businesses/${selectedBusiness.id}/bookings/${activeBooking.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          staffId: rescheduleForm.staffId,
          startTime: startIso,
          notes: rescheduleForm.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reschedule appointment.');

      setActionSuccess(`Appointment rescheduled.`);
      setRescheduleModalOpen(false);
      setDetailDrawerOpen(false);
      fetchBookings(pagination.page);
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return 'All Dates';
    const parts = dateStr.split('-').map(Number);
    if (parts.length < 3 || isNaN(parts[0])) return dateStr;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Calculate Appointments Summary Stats from backend summary or bookings list
  const todaysCount = summaryData?.total ?? bookings.length;
  const pendingCount = summaryData?.pendingCount ?? bookings.filter((b) => b.status === 'PENDING').length;
  const upcomingCount = summaryData?.upcomingCount ?? bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS').length;
  const completedCount = summaryData?.completedCount ?? bookings.filter((b) => b.status === 'COMPLETED').length;

  // Client-side fallback search filtering if backend query didn't refine
  const filteredBookings = bookings.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const custName = (b.customer?.name || '').toLowerCase();
    const custPhone = (b.customer?.phone || '').toLowerCase();
    const custEmail = (b.customer?.email || '').toLowerCase();
    const serviceName = (b.service?.name || '').toLowerCase();
    return custName.includes(q) || custPhone.includes(q) || custEmail.includes(q) || serviceName.includes(q);
  });

  const handlePrevDay = () => {
    const baseDate = dateFilter ? dateFilter : getTodayDateString();
    const [y, m, d] = baseDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() - 1);
    const ny = dateObj.getFullYear();
    const nm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const nd = String(dateObj.getDate()).padStart(2, '0');
    setDateFilter(`${ny}-${nm}-${nd}`);
  };

  const handleNextDay = () => {
    const baseDate = dateFilter ? dateFilter : getTodayDateString();
    const [y, m, d] = baseDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + 1);
    const ny = dateObj.getFullYear();
    const nm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const nd = String(dateObj.getDate()).padStart(2, '0');
    setDateFilter(`${ny}-${nm}-${nd}`);
  };

  const handleTodayDate = () => {
    setDateFilter(getTodayDateString());
  };

  const selectedServiceObj = services.find((s) => s.id === createForm.serviceId);

  return (
    <div className="space-y-6 text-[#173F35] font-sans pb-12">
      <PageHeader
        title="Appointments"
        subtitle="Manage your business bookings, schedules, and appointment status."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchBookings(pagination.page)}
              icon={RefreshCw}
              title="Refresh"
            >
              Refresh
            </Button>
            <Button size="sm" onClick={handleOpenCreateModal} icon={Plus}>
              + New Booking
            </Button>
          </>
        }
      />

      {/* Appointment Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#D5E4DC] rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-[#61766F] uppercase tracking-wider">
            {dateFilter === getTodayDateString() ? "Today's Appointments" : "Selected Date Appointments"}
          </span>
          <div className="text-2xl font-black text-[#173F35] font-heading">{todaysCount}</div>
        </div>

        <div className="bg-white border border-[#D5E4DC] rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Confirmation</span>
          <div className="text-2xl font-black text-amber-800 font-heading">{pendingCount}</div>
        </div>

        <div className="bg-white border border-[#D5E4DC] rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Upcoming & Active</span>
          <div className="text-2xl font-black text-blue-900 font-heading">{upcomingCount}</div>
        </div>

        <div className="bg-white border border-[#D5E4DC] rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Completed</span>
          <div className="text-2xl font-black text-emerald-800 font-heading">{completedCount}</div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-900 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Date Navigation & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-[#D5E4DC] shadow-2xs p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E6EFEA]">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="Search by customer name, phone, or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3.5 pr-3 py-1.5 bg-[#F7FAFA] border border-[#D5E4DC] rounded-xl text-xs text-[#173F35] focus:outline-none focus:ring-2 focus:ring-[#123A32]"
            />
          </div>

          {/* Date Navigation */}
          <div className="flex items-center space-x-1.5 bg-[#EEF6F1] border border-[#D5E4DC] rounded-xl px-2.5 py-1">
            <button
              onClick={handlePrevDay}
              className="px-2 py-1 text-xs font-bold text-[#123A32] hover:bg-[#CBDCD3] rounded-lg transition-colors cursor-pointer"
            >
              ◀ Prev
            </button>
            <button
              onClick={handleTodayDate}
              className="px-2.5 py-1 text-xs font-extrabold text-[#123A32] bg-white border border-[#D5E4DC] rounded-lg shadow-2xs cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNextDay}
              className="px-2 py-1 text-xs font-bold text-[#123A32] hover:bg-[#CBDCD3] rounded-lg transition-colors cursor-pointer"
            >
              Next ▶
            </button>

            {/* Clear Selected Date Display: e.g. "07 Sep 2026" */}
            <div className="relative flex items-center bg-white border border-[#D5E4DC] px-2.5 py-1 rounded-lg text-xs font-extrabold text-[#173F35] shadow-2xs cursor-pointer">
              <span>📅 {formatDisplayDate(dateFilter)}</span>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-[#61766F]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#D5E4DC] rounded-xl text-xs font-bold text-[#173F35] cursor-pointer focus:ring-2 focus:ring-[#123A32]"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="NO_SHOW">NO_SHOW</option>
              </select>
            </div>

            {role !== 'STAFF' && (
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-[#61766F]">Staff:</span>
                <select
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-[#D5E4DC] rounded-xl text-xs font-bold text-[#173F35] cursor-pointer focus:ring-2 focus:ring-[#123A32]"
                >
                  <option value="">All Staff</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName || s.businessMember?.user?.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-[#61766F]">Service:</span>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#D5E4DC] rounded-xl text-xs font-bold text-[#173F35] cursor-pointer focus:ring-2 focus:ring-[#123A32]"
              >
                <option value="">All Services</option>
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(statusFilter || staffFilter || serviceFilter || dateFilter || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setStaffFilter('');
                setServiceFilter('');
                setDateFilter('');
                setSearchQuery('');
              }}
              className="text-xs font-extrabold text-[#123A32] underline hover:text-emerald-800 cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-[#D5E4DC] shadow-2xs overflow-hidden">
        {loading ? (
          <LoadingState message="Loading appointments..." />
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No appointments found"
            description={
              statusFilter || staffFilter || dateFilter || searchQuery
                ? 'No bookings match your current filter parameters.'
                : 'Create your first appointment.'
            }
            actionLabel="New Booking"
            actionIcon={Plus}
            onAction={handleOpenCreateModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EEF6F1] border-b border-[#D5E4DC] text-[11px] font-black text-[#123A32] uppercase tracking-wider">
                  <th className="py-3 px-6">Time & Date</th>
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6">Service</th>
                  <th className="py-3 px-6">Staff</th>
                  <th className="py-3 px-6">Amount</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Status-Aware Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EFEA] text-xs font-sans">
                {filteredBookings.map((b) => {
                  const startTimeStr = new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const endTimeStr = new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateStr = new Date(b.startTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                  const isMuted = b.status === 'CANCELLED' || b.status === 'NO_SHOW';

                  return (
                    <tr
                      key={b.id}
                      className={`transition-colors ${
                        isMuted
                          ? 'bg-slate-50/60 text-slate-400 opacity-65 hover:bg-slate-100/70 line-through'
                          : 'hover:bg-[#F7FAFA]'
                      }`}
                    >
                      <td className="py-4 px-6 font-mono text-[#173F35] font-bold">
                        <div className="font-extrabold">{startTimeStr} - {endTimeStr}</div>
                        <div className="text-[11px] text-[#61766F] font-medium">{dateStr}</div>
                      </td>
                      <td className="py-4 px-6 font-bold text-[#173F35]">
                        <div className="font-extrabold">{b.customer?.name || 'Client'}</div>
                        <div className="text-[#61766F] font-mono text-[11px] font-normal">
                          {b.customer?.phone || b.customer?.email || 'N/A'}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-[#173F35]">
                        <div>{b.service?.name}</div>
                        <div className="text-[#61766F] text-[11px] font-normal">{b.service?.durationMinutes} mins</div>
                      </td>
                      <td className="py-4 px-6 text-[#173F35] font-medium">
                        {b.staff?.displayName || b.staff?.businessMember?.user?.name || 'Staff Specialist'}
                      </td>
                      <td className="py-4 px-6 font-mono font-black text-[#173F35]">
                        ₹{Number(b.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={b.status}>{b.status}</Badge>
                      </td>
                      <td className="py-4 px-6 text-right space-x-1.5">
                        {/* Status-aware Actions */}
                        {b.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => {
                                setActiveBooking(b);
                                handleChangeStatus('CONFIRMED', 'Confirmed by owner');
                              }}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-2xs cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => {
                                setActiveBooking(b);
                                handleCancelBooking();
                              }}
                              className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {b.status === 'CONFIRMED' && (
                          <>
                            <button
                              onClick={() => {
                                setActiveBooking(b);
                                handleChangeStatus('IN_PROGRESS', 'Service started');
                              }}
                              className="px-2.5 py-1 bg-[#123A32] text-white rounded-lg text-xs font-bold hover:bg-[#1A4B41] transition-all shadow-2xs cursor-pointer"
                            >
                              Start
                            </button>
                            <button
                              onClick={() => {
                                setActiveBooking(b);
                                handleChangeStatus('NO_SHOW', 'Customer missed appointment');
                              }}
                              className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-100 transition-all cursor-pointer"
                            >
                              No Show
                            </button>
                            <button
                              onClick={() => {
                                setActiveBooking(b);
                                handleCancelBooking();
                              }}
                              className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {b.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => {
                              setActiveBooking(b);
                              handleChangeStatus('COMPLETED', 'Service marked completed');
                            }}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-2xs cursor-pointer"
                          >
                            Complete
                          </button>
                        )}

                        {['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(b.status) && (
                          <button
                            onClick={() => {
                              setActiveBooking(b);
                              setDetailsModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-white text-[#123A32] border border-[#D5E4DC] rounded-lg text-xs font-bold hover:bg-[#EEF6F1] transition-all cursor-pointer shadow-2xs"
                          >
                            View Details
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setActiveBooking(b);
                            setDetailsModalOpen(true);
                          }}
                          className="px-2 py-1 text-[#61766F] hover:text-[#123A32] text-xs font-bold underline cursor-pointer"
                        >
                          Audit Log
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
            <div>Showing {bookings.length} of {pagination.total} records</div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchBookings(pagination.page - 1)}
              >
                Previous
              </Button>
              <span className="font-semibold font-mono">{pagination.page} / {pagination.totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchBookings(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Booking Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Schedule New Appointment"
        subtitle="Select customer, service, staff member, and date window."
      >
        <form onSubmit={handleCreateBookingSubmit} className="space-y-4">
          <Select
            label="Customer"
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
            label="Service"
            required
            value={createForm.serviceId}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, serviceId: e.target.value }))}
          >
            <option value="" disabled>-- Select Service --</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (₹{parseFloat(s.price).toFixed(0)} — {s.durationMinutes} min)
              </option>
            ))}
          </Select>

          <Select
            label="Staff Member"
            required
            value={createForm.staffId}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, staffId: e.target.value }))}
          >
            <option value="" disabled>-- Select Staff Member --</option>
            {staffList.map((st) => (
              <option key={st.id} value={st.id}>
                {st.displayName}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              required
              value={createForm.date}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, date: e.target.value }))}
            />

            <Input
              label="Start Time"
              type="time"
              required
              value={createForm.time}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, time: e.target.value }))}
            />
          </div>

          {selectedServiceObj && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center text-slate-700 font-medium">
              <span>Duration: <strong className="font-mono">{selectedServiceObj.durationMinutes} min</strong></span>
              <span>Total Amount: <strong className="font-mono text-emerald-700">₹{parseFloat(selectedServiceObj.price).toFixed(0)}</strong></span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Notes
            </label>
            <textarea
              rows={2}
              value={createForm.notes}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Special instructions or client notes..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Appointment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Appointment Detail Drawer */}
      <Drawer
        isOpen={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        title="Appointment Details"
        subtitle={activeBooking ? `Booking ID: ${activeBooking.id}` : ''}
      >
        {activeBooking && (
          <div className="space-y-6 text-xs">
            {/* Header Badge Row */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-700">Status</span>
              <Badge variant={activeBooking.status}>{activeBooking.status}</Badge>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-medium flex items-center space-x-1">
                  <User className="w-3.5 h-3.5" />
                  <span>Customer</span>
                </span>
                <p className="font-bold text-slate-900">{activeBooking.customer?.name}</p>
                <p className="text-slate-500 font-mono">{activeBooking.customer?.phone || activeBooking.customer?.email}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-medium flex items-center space-x-1">
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Service & Fee</span>
                </span>
                <p className="font-bold text-slate-900">{activeBooking.service?.name}</p>
                <p className="text-emerald-700 font-mono font-bold">₹{parseFloat(activeBooking.totalAmount).toFixed(0)} ({activeBooking.service?.durationMinutes} min)</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-medium flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>Staff Member</span>
                </span>
                <p className="font-bold text-slate-900">{activeBooking.staff?.displayName || 'Unassigned'}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-medium flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Time Window</span>
                </span>
                <p className="font-mono text-slate-900 font-bold">{new Date(activeBooking.startTime).toLocaleDateString()}</p>
                <p className="font-mono text-slate-600">
                  {new Date(activeBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(activeBooking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Status Actions */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h4 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider font-mono">Status Actions</h4>
              <div className="flex flex-wrap gap-2">
                {activeBooking.status === 'PENDING' && (
                  <>
                    <Button size="sm" variant="brand" onClick={() => handleChangeStatus('CONFIRMED', 'Confirmed')}>
                      Confirm Booking
                    </Button>
                    <Button size="sm" variant="danger-light" onClick={handleCancelBooking}>
                      Cancel Booking
                    </Button>
                  </>
                )}

                {activeBooking.status === 'CONFIRMED' && (
                  <>
                    <Button size="sm" variant="brand" onClick={() => handleChangeStatus('IN_PROGRESS', 'Service started')}>
                      Start Service
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleChangeStatus('NO_SHOW', 'Marked no-show')}>
                      Mark No-Show
                    </Button>
                    <Button size="sm" variant="danger-light" onClick={handleCancelBooking}>
                      Cancel Booking
                    </Button>
                  </>
                )}

                {activeBooking.status === 'IN_PROGRESS' && (
                  <Button size="sm" variant="brand" onClick={() => handleChangeStatus('COMPLETED', 'Service completed')}>
                    Complete Service
                  </Button>
                )}

                {activeBooking.status !== 'CANCELLED' && activeBooking.status !== 'COMPLETED' && (
                  <Button size="sm" variant="outline" onClick={() => handleOpenRescheduleModal(activeBooking)}>
                    Reschedule
                  </Button>
                )}
              </div>
            </div>

            {/* Status History Timeline */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h4 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <History className="w-4 h-4 text-indigo-600" />
                <span>Status Audit Log</span>
              </h4>

              <div className="space-y-2">
                {(activeBooking.statusHistory || []).map((h) => (
                  <div key={h.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-800">
                        {h.fromStatus ? `${h.fromStatus} → ` : ''}<span className="text-indigo-700">{h.toStatus}</span>
                      </div>
                      {h.reason && <div className="text-slate-500 text-[11px]">{h.reason}</div>}
                    </div>
                    <div className="text-right text-slate-400 text-[11px] font-mono">
                      <div>{h.changedByUser?.name || 'System'}</div>
                      <div>{new Date(h.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Reschedule Modal */}
      <Modal
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        title="Reschedule Appointment"
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <Select
            label="Staff Member"
            value={rescheduleForm.staffId}
            onChange={(e) => setRescheduleForm((prev) => ({ ...prev, staffId: e.target.value }))}
          >
            {staffList.map((st) => (
              <option key={st.id} value={st.id}>
                {st.displayName}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="New Date"
              type="date"
              required
              value={rescheduleForm.date}
              onChange={(e) => setRescheduleForm((prev) => ({ ...prev, date: e.target.value }))}
            />

            <Input
              label="New Time"
              type="time"
              required
              value={rescheduleForm.time}
              onChange={(e) => setRescheduleForm((prev) => ({ ...prev, time: e.target.value }))}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={() => setRescheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Confirm Reschedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Audit Log / Appointment Details Modal */}
      {detailsModalOpen && activeBooking && (
        <AppointmentDetailsModal
          booking={activeBooking}
          businessId={selectedBusiness.id}
          onClose={() => setDetailsModalOpen(false)}
          onRefresh={() => {
            setDetailsModalOpen(false);
            fetchBookings(pagination.page);
          }}
        />
      )}
    </div>
  );
}
