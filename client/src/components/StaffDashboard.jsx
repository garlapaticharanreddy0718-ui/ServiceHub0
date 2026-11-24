import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';
import {
  Calendar,
  Clock,
  UserCheck,
  Scissors,
  Users,
  CheckCircle2,
  AlertCircle,
  Building2,
  RefreshCw,
  Search,
  ChevronRight,
  User,
  LogOut,
  Bell,
  Sparkles,
  Briefcase,
  X,
  FileText,
  CalendarCheck,
  ShieldCheck,
  Check,
  Palmtree,
  ArrowRight,
  TrendingUp,
  MapPin,
  ChevronDown,
  Layers,
  Quote,
  Filter,
  CheckSquare,
  Coffee,
  Plus,
  Edit3,
  Trash2,
  CalendarOff,
  History,
  Mail,
  Phone,
  Save,
  Shield
} from 'lucide-react';
import Badge from './ui/Badge';
import LoadingState from './ui/LoadingState';

export default function StaffDashboard({ business, currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem('servicehub_staff_tab');
    const valid = ['dashboard', 'appointments', 'schedule', 'clients', 'time-off', 'profile'];
    return saved && valid.includes(saved) ? saved : 'dashboard';
  });

  useEffect(() => {
    sessionStorage.setItem('servicehub_staff_tab', activeTab);
  }, [activeTab]);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [staffProfiles, setStaffProfiles] = useState([]);
  const [myStaffProfile, setMyStaffProfile] = useState(null);
  const [timeOffList, setTimeOffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Appointment Details Modal State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter & Search states for My Appointments tab
  const [appointmentTabFilter, setAppointmentTabFilter] = useState('TODAY'); // 'TODAY' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'ALL'
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [appointmentServiceFilter, setAppointmentServiceFilter] = useState('ALL');
  const [appointmentDateFilter, setAppointmentDateFilter] = useState('');

  // Filter & Search states for Clients Directory tab
  const [clientSearch, setClientSearch] = useState('');
  const [clientServiceFilter, setClientServiceFilter] = useState('ALL');
  const [clientStatusFilter, setClientStatusFilter] = useState('ALL');
  const [selectedClientDetail, setSelectedClientDetail] = useState(null);

  // Break Management Modal / Form state
  const [breakModalOpen, setBreakModalOpen] = useState(false);
  const [editingBreak, setEditingBreak] = useState(null);
  const [breakDayOfWeek, setBreakDayOfWeek] = useState(1);
  const [breakStartTime, setBreakStartTime] = useState('13:00');
  const [breakEndTime, setBreakEndTime] = useState('14:00');
  const [breakLabel, setBreakLabel] = useState('Lunch');
  const [breakSubmitting, setBreakSubmitting] = useState(false);
  const [breakError, setBreakError] = useState(null);

  // Time Off Modal & Form State
  const [timeOffModalOpen, setTimeOffModalOpen] = useState(false);
  const [timeOffDate, setTimeOffDate] = useState('');
  const [timeOffFullDay, setTimeOffFullDay] = useState(true);
  const [timeOffStartTime, setTimeOffStartTime] = useState('09:00');
  const [timeOffEndTime, setTimeOffEndTime] = useState('17:00');
  const [timeOffReason, setTimeOffReason] = useState('');
  const [timeOffSubmitting, setTimeOffSubmitting] = useState(false);
  const [timeOffError, setTimeOffError] = useState(null);
  const [timeOffSuccessMsg, setTimeOffSuccessMsg] = useState(null);
  const [cancellingTimeOffId, setCancellingTimeOffId] = useState(null);

  // Staff Profile Form States
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(null);

  const loadStaffData = useCallback(async () => {
    if (!business?.id) return;
    setLoading(true);
    setError(null);

    try {
      const [bookingsRes, servicesRes, customersRes, staffRes] = await Promise.all([
        apiRequest(`/businesses/${business.id}/bookings`).catch(() => null),
        apiRequest(`/businesses/${business.id}/services`).catch(() => null),
        apiRequest(`/businesses/${business.id}/customers`).catch(() => null),
        apiRequest(`/businesses/${business.id}/staff`).catch(() => null),
      ]);

      if (bookingsRes && bookingsRes.ok) {
        const bData = await bookingsRes.json();
        setBookings(bData.data || []);
      }

      if (servicesRes && servicesRes.ok) {
        const sData = await servicesRes.json();
        setServices(sData.data || []);
      }

      if (customersRes && customersRes.ok) {
        const cData = await customersRes.json();
        setCustomers(cData.data || []);
      }

      if (staffRes && staffRes.ok) {
        const stData = await staffRes.json();
        const staffList = stData.data || [];
        setStaffProfiles(staffList);
        
        // Find staff profile associated with currentUser
        const matched = staffList.find(
          (s) =>
            (currentUser?.id && s.businessMember?.userId === currentUser.id) ||
            (currentUser?.email && (s.businessMember?.user?.email === currentUser.email || s.email === currentUser.email)) ||
            (currentUser?.name && (s.displayName === currentUser.name || s.businessMember?.user?.name === currentUser.name))
        );
        const myProf = matched || null;
        setMyStaffProfile(myProf);

        if (myProf) {
          try {
            const toRes = await apiRequest(`/businesses/${business.id}/staff/${myProf.id}/time-off`);
            if (toRes && toRes.ok) {
              const toData = await toRes.json();
              setTimeOffList(toData.data || []);
            }
          } catch (toErr) {
            console.error('Failed to fetch time off records:', toErr);
          }
        } else {
          try {
            const toRes = await apiRequest(`/businesses/${business.id}/time-off`);
            if (toRes && toRes.ok) {
              const toData = await toRes.json();
              setTimeOffList(toData.data || []);
            }
          } catch (toErr) {
            console.error('Failed to fetch time off records:', toErr);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load staff dashboard data:', err);
      setError('Unable to load staff records. Please check connection.');
    } finally {
      setLoading(false);
    }
  }, [business?.id, currentUser]);

  useEffect(() => {
    loadStaffData();

    // Auto-refresh when tab/window gains focus (e.g. after owner updates services/schedule)
    const handleFocus = () => {
      loadStaffData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadStaffData]);

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfileEmail(currentUser.email || '');
      setProfilePhone(currentUser.phone || '');
    }
    if (myStaffProfile) {
      setProfileDisplayName(myStaffProfile.displayName || currentUser?.name || '');
      setProfileBio(myStaffProfile.bio || '');
    }
  }, [currentUser, myStaffProfile]);

  // Handle Booking Status Update via Backend API
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await apiRequest(`/businesses/${business.id}/bookings/${bookingId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await loadStaffData();
        setSelectedBooking(null);
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to update booking status.');
      }
    } catch (err) {
      console.error('Failed to update booking status:', err);
      alert('Error updating status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // -------------------------------------------------------------
  // BREAK MANAGEMENT HANDLERS
  // -------------------------------------------------------------
  const handleOpenAddBreak = (dayIdx = 1) => {
    setEditingBreak(null);
    setBreakDayOfWeek(dayIdx);
    setBreakStartTime('13:00');
    setBreakEndTime('14:00');
    setBreakLabel('Lunch');
    setBreakError(null);
    setBreakModalOpen(true);
  };

  const handleOpenEditBreak = (b) => {
    setEditingBreak(b);
    setBreakDayOfWeek(b.dayOfWeek);
    setBreakStartTime(b.startTime);
    setBreakEndTime(b.endTime);
    setBreakLabel(b.label || '');
    setBreakError(null);
    setBreakModalOpen(true);
  };

  const handleSaveBreak = async (e) => {
    e.preventDefault();
    if (!business?.id || !myStaffProfile?.id || breakSubmitting) return;
    setBreakSubmitting(true);
    setBreakError(null);

    try {
      const url = editingBreak
        ? `/businesses/${business.id}/staff/${myStaffProfile.id}/breaks/${editingBreak.id}`
        : `/businesses/${business.id}/staff/${myStaffProfile.id}/breaks`;
      const method = editingBreak ? 'PUT' : 'POST';

      const res = await apiRequest(url, {
        method,
        body: JSON.stringify({
          dayOfWeek: Number(breakDayOfWeek),
          startTime: breakStartTime,
          endTime: breakEndTime,
          label: breakLabel || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'Failed to save staff break.');
      }

      setBreakModalOpen(false);
      await loadStaffData();
    } catch (err) {
      setBreakError(err.message || 'Failed to save staff break.');
    } finally {
      setBreakSubmitting(false);
    }
  };

  const handleDeleteBreak = async (breakId) => {
    if (!business?.id || !myStaffProfile?.id || !breakId) return;
    if (!window.confirm('Are you sure you want to remove this recurring break?')) return;

    try {
      const res = await apiRequest(`/businesses/${business.id}/staff/${myStaffProfile.id}/breaks/${breakId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadStaffData();
      } else {
        const resData = await res.json();
        alert(resData.message || 'Failed to delete break.');
      }
    } catch (err) {
      console.error('Delete break failed:', err);
      alert('Failed to delete break.');
    }
  };

  // -------------------------------------------------------------
  // TIME OFF HANDLERS
  // -------------------------------------------------------------
  const handleOpenRequestTimeOff = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    setTimeOffDate(dateStr);
    setTimeOffFullDay(true);
    setTimeOffStartTime('09:00');
    setTimeOffEndTime('17:00');
    setTimeOffReason('');
    setTimeOffError(null);
    setTimeOffModalOpen(true);
  };

  const handleSaveTimeOff = async (e) => {
    e.preventDefault();
    if (!business?.id) return;
    if (!timeOffDate) {
      setTimeOffError('Please select a date.');
      return;
    }

    let startIso, endIso;
    try {
      const [year, month, day] = timeOffDate.split('-').map(Number);
      if (timeOffFullDay) {
        const startLocal = new Date(year, month - 1, day, 0, 0, 0, 0);
        const endLocal = new Date(year, month - 1, day, 23, 59, 59, 999);
        startIso = startLocal.toISOString();
        endIso = endLocal.toISOString();
      } else {
        if (!timeOffStartTime || !timeOffEndTime) {
          setTimeOffError('Please specify start and end times.');
          return;
        }
        if (timeOffStartTime >= timeOffEndTime) {
          setTimeOffError('Start time must be strictly before end time.');
          return;
        }
        const [sH, sM] = timeOffStartTime.split(':').map(Number);
        const [eH, eM] = timeOffEndTime.split(':').map(Number);

        const startLocal = new Date(year, month - 1, day, sH, sM, 0, 0);
        const endLocal = new Date(year, month - 1, day, eH, eM, 0, 0);
        startIso = startLocal.toISOString();
        endIso = endLocal.toISOString();
      }
    } catch (parseErr) {
      setTimeOffError('Invalid date or time format.');
      return;
    }

    if (new Date(endIso) <= new Date()) {
      setTimeOffError('Time off cannot be requested for past dates or times.');
      return;
    }

    setTimeOffSubmitting(true);
    setTimeOffError(null);

    try {
      const endpoint = myStaffProfile?.id
        ? `/businesses/${business.id}/staff/${myStaffProfile.id}/time-off`
        : `/businesses/${business.id}/time-off`;

      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          startDateTime: startIso,
          endDateTime: endIso,
          reason: timeOffReason.trim() || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'Unable to request time off. Please try again.');
      }

      setTimeOffModalOpen(false);
      setTimeOffSuccessMsg('Time off requested successfully.');
      setTimeout(() => setTimeOffSuccessMsg(null), 4000);
      await loadStaffData();
    } catch (err) {
      setTimeOffError(err.message || 'Unable to request time off. Please try again.');
    } finally {
      setTimeOffSubmitting(false);
    }
  };

  const handleCancelTimeOff = async (timeOffId) => {
    if (!business?.id || !timeOffId) return;
    if (!window.confirm('Are you sure you want to cancel this scheduled time off?')) return;

    setCancellingTimeOffId(timeOffId);
    try {
      const endpoint = myStaffProfile?.id
        ? `/businesses/${business.id}/staff/${myStaffProfile.id}/time-off/${timeOffId}`
        : `/businesses/${business.id}/time-off/${timeOffId}`;

      const res = await apiRequest(endpoint, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadStaffData();
      } else {
        const resData = await res.json();
        alert(resData.message || 'Failed to cancel time off.');
      }
    } catch (err) {
      console.error('Cancel time off failed:', err);
      alert('Failed to cancel time off.');
    } finally {
      setCancellingTimeOffId(null);
    }
  };

  // -------------------------------------------------------------
  // PROFILE HANDLER
  // -------------------------------------------------------------
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccessMsg(null);

    const trimmedName = profileName.trim();
    const trimmedEmail = profileEmail.trim();
    const trimmedPhone = profilePhone.trim();
    const trimmedDisplayName = profileDisplayName.trim();
    const trimmedBio = profileBio.trim();

    if (!trimmedName) {
      setProfileError('Full Name cannot be empty.');
      return;
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setProfileError('Please enter a valid email address.');
      return;
    }

    if (trimmedBio.length > 500) {
      setProfileError('Bio cannot exceed 500 characters.');
      return;
    }

    setProfileSubmitting(true);

    try {
      // 1. Update Personal User Info via PATCH /auth/me
      const userRes = await apiRequest('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone || null,
        }),
      });

      const userResData = await userRes.json();
      if (!userRes.ok) {
        throw new Error(userResData.message || 'Failed to update personal information.');
      }

      // 2. Update Staff Profile (displayName, bio) if staff profile exists
      if (business?.id && myStaffProfile?.id) {
        const staffRes = await apiRequest(`/businesses/${business.id}/staff/${myStaffProfile.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            displayName: trimmedDisplayName || trimmedName,
            bio: trimmedBio || undefined,
          }),
        });

        const staffResData = await staffRes.json();
        if (!staffRes.ok) {
          throw new Error(staffResData.message || 'Failed to update staff profile details.');
        }
      }

      setProfileSuccessMsg('Profile updated successfully.');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
      await loadStaffData();
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setProfileSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // DATA COMPUTATIONS FOR CURRENT LOGGED-IN STAFF MEMBER
  // -------------------------------------------------------------
  
  // Filter bookings strictly assigned to current staff profile
  const myBookings = myStaffProfile
    ? bookings.filter((b) => b.staffId === myStaffProfile.id)
    : [];

  // Filter services assigned to current staff profile via staffServices
  const myServices = myStaffProfile && myStaffProfile.staffServices && myStaffProfile.staffServices.length > 0
    ? services.filter((svc) => myStaffProfile.staffServices.some((ss) => ss.serviceId === svc.id))
    : [];

  // Date Logic Computations
  const now = new Date();
  const todayY = now.getFullYear();
  const todayM = now.getMonth();
  const todayD = now.getDate();

  const todayStart = new Date(todayY, todayM, todayD, 0, 0, 0, 0);
  const todayEnd = new Date(todayY, todayM, todayD, 23, 59, 59, 999);

  // Today's assigned bookings
  const todaysBookings = myBookings.filter((b) => {
    const bDate = new Date(b.startTime);
    return bDate >= todayStart && bDate <= todayEnd;
  }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  // 4 Summary Metrics (Strictly derived from real DB data)
  const todayAppointmentsCount = todaysBookings.length;
  const completedTodayCount = todaysBookings.filter((b) => b.status === 'COMPLETED').length;
  const remainingTodayCount = todaysBookings.filter((b) =>
    ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)
  ).length;
  const myServicesCount = myServices.length;

  // Dynamic comparison sub-labels
  const yesterdayStart = new Date(todayY, todayM, todayD - 1, 0, 0, 0, 0);
  const yesterdayEnd = new Date(todayY, todayM, todayD - 1, 23, 59, 59, 999);
  const yesterdayCount = myBookings.filter((b) => {
    const bDate = new Date(b.startTime);
    return bDate >= yesterdayStart && bDate <= yesterdayEnd;
  }).length;
  const apptDiff = todayAppointmentsCount - yesterdayCount;
  const apptDiffLabel = apptDiff > 0
    ? `↗ +${apptDiff} vs yesterday`
    : apptDiff < 0
    ? `↘ ${apptDiff} vs yesterday`
    : `Scheduled for today`;

  const completionRate = todayAppointmentsCount > 0
    ? Math.round((completedTodayCount / todayAppointmentsCount) * 100)
    : 0;

  // Prominent Next Appointment
  const upcomingBookings = myBookings
    .filter((b) => {
      const bDate = new Date(b.startTime);
      const isActiveStatus = ['CONFIRMED', 'PENDING', 'IN_PROGRESS'].includes(b.status);
      return bDate >= now && isActiveStatus;
    })
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  const nextAppointment = upcomingBookings[0] || null;

  // Appointments Overview - Last 7 Days (Bar Chart Data)
  const last7DaysData = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    
    const count = myBookings.filter((b) => {
      const bDate = new Date(b.startTime);
      return bDate >= dayStart && bDate <= dayEnd && b.status !== 'CANCELLED';
    }).length;

    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    return {
      dayName,
      dateStr: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
      count
    };
  });
  const maxChartCount = Math.max(...last7DaysData.map((d) => d.count), 5);

  // Recent Activity Feed derived dynamically from bookings
  const recentActivities = [...myBookings]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || b.startTime) - new Date(a.updatedAt || a.createdAt || a.startTime))
    .slice(0, 4)
    .map((b) => {
      const customerName = b.customer?.name || 'Customer';
      const serviceName = b.service?.name || 'Service';
      let title = '';
      if (b.status === 'COMPLETED') {
        title = `You marked ${serviceName} as completed`;
      } else if (b.status === 'CONFIRMED') {
        title = `${customerName} booked ${serviceName}`;
      } else if (b.status === 'CANCELLED') {
        title = `${customerName} cancelled ${serviceName}`;
      } else {
        title = `${customerName} booked ${serviceName}`;
      }
      return {
        id: b.id,
        title,
        status: b.status,
        customerName,
        serviceName,
        time: new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date(b.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      };
    });

  // Dynamic Time Greeting
  const currentHour = now.getHours();
  let timeGreeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 17) {
    timeGreeting = 'Good afternoon';
  } else if (currentHour >= 17) {
    timeGreeting = 'Good evening';
  }

  const formattedCurrentDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const staffDisplayName = myStaffProfile?.displayName || currentUser?.name || 'Staff Member';
  const staffFirstName = staffDisplayName.split(' ')[0] || 'Staff';

  // Navigation Items Specification
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: CalendarCheck },
    { id: 'appointments', label: 'My Appointments', icon: Calendar },
    { id: 'schedule', label: 'My Schedule', icon: Clock },
    { id: 'services', label: 'My Services', icon: Scissors },
    { id: 'clients', label: 'Clients Directory', icon: Users },
    { id: 'time-off', label: 'Time Off', icon: Calendar },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  // -------------------------------------------------------------
  // MY APPOINTMENTS WORKSPACE FILTERED APPOINTMENTS COMPUTATION
  // -------------------------------------------------------------
  const filteredAppointments = myBookings
    .filter((b) => {
      const bDate = new Date(b.startTime);

      // Search Filter
      if (appointmentSearch.trim()) {
        const q = appointmentSearch.toLowerCase();
        const cMatch = b.customer?.name?.toLowerCase().includes(q);
        const sMatch = b.service?.name?.toLowerCase().includes(q);
        if (!cMatch && !sMatch) return false;
      }

      // Service Filter
      if (appointmentServiceFilter !== 'ALL' && b.serviceId !== appointmentServiceFilter) {
        return false;
      }

      // Specific Date Picker Filter
      if (appointmentDateFilter) {
        const selDate = new Date(appointmentDateFilter);
        const isSameDay =
          bDate.getFullYear() === selDate.getFullYear() &&
          bDate.getMonth() === selDate.getMonth() &&
          bDate.getDate() === selDate.getDate();
        if (!isSameDay) return false;
      }

      // Main Category Tab Filter
      if (appointmentTabFilter === 'TODAY') {
        return bDate >= todayStart && bDate <= todayEnd;
      }
      if (appointmentTabFilter === 'UPCOMING') {
        return bDate > now && ['CONFIRMED', 'PENDING', 'IN_PROGRESS'].includes(b.status);
      }
      if (appointmentTabFilter === 'COMPLETED') {
        return b.status === 'COMPLETED' || (bDate < now && b.status !== 'CANCELLED');
      }
      if (appointmentTabFilter === 'CANCELLED') {
        return b.status === 'CANCELLED';
      }

      return true;
    })
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  // -------------------------------------------------------------
  // CLIENTS DIRECTORY DATA AGGREGATION (STAFF SCOPED)
  // -------------------------------------------------------------
  const staffClientsMap = new Map();

  myBookings.forEach((b) => {
    const custId = b.customerId || b.customer?.id;
    if (!custId) return;

    const custObj = b.customer || customers.find((c) => c.id === custId) || {
      id: custId,
      name: 'Customer',
      email: null,
      phone: null,
    };

    if (!staffClientsMap.has(custId)) {
      staffClientsMap.set(custId, {
        id: custObj.id,
        name: custObj.name || 'Customer',
        email: custObj.email || null,
        phone: custObj.phone || null,
        address: custObj.address || null,
        notes: custObj.notes || [],
        bookings: [],
      });
    }

    const clientEntry = staffClientsMap.get(custId);
    clientEntry.bookings.push(b);
  });

  const staffClients = Array.from(staffClientsMap.values()).map((client) => {
    const validBookings = client.bookings.filter((b) => b.status !== 'CANCELLED');
    const completedVisits = validBookings.filter((b) => b.status === 'COMPLETED');
    const futureBookings = validBookings.filter((b) => ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status));

    const visitsCount = completedVisits.length;
    const appointmentsCount = validBookings.length;
    const isReturning = visitsCount >= 2;

    const lastBooking = completedVisits.sort((a, b) => new Date(b.startTime) - new Date(a.startTime))[0] || null;
    const nextBooking = futureBookings.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0] || null;

    const displayBooking = nextBooking || lastBooking;

    return {
      ...client,
      appointmentsCount,
      visitsCount,
      isReturning,
      nextBookingObj: nextBooking,
      recentBookingObj: lastBooking,
      currentService: displayBooking?.service?.name || 'Service',
      currentAppointmentStr: displayBooking
        ? `${new Date(displayBooking.startTime).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })} • ${new Date(displayBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : '—',
      currentStatus: displayBooking?.status || 'Active',
      status: 'Active',
    };
  });

  const filteredStaffClients = staffClients.filter((client) => {
    if (clientSearch.trim()) {
      const q = clientSearch.toLowerCase();
      const nameMatch = client.name.toLowerCase().includes(q);
      const emailMatch = client.email?.toLowerCase().includes(q);
      const phoneMatch = client.phone?.toLowerCase().includes(q);
      if (!nameMatch && !emailMatch && !phoneMatch) return false;
    }

    if (clientServiceFilter !== 'ALL') {
      const matchesService = client.bookings.some((b) => b.serviceId === clientServiceFilter);
      if (!matchesService) return false;
    }

    if (clientStatusFilter !== 'ALL') {
      if (clientStatusFilter === 'TODAY') {
        const hasToday = client.bookings.some((b) => {
          const d = new Date(b.startTime);
          return d >= todayStart && d <= todayEnd;
        });
        if (!hasToday) return false;
      } else if (clientStatusFilter === 'UPCOMING') {
        if (!client.nextBookingObj) return false;
      } else if (clientStatusFilter === 'COMPLETED') {
        const hasCompleted = client.bookings.some((b) => b.status === 'COMPLETED');
        if (!hasCompleted) return false;
      } else if (clientStatusFilter === 'CANCELLED') {
        const hasCancelled = client.bookings.some((b) => b.status === 'CANCELLED');
        if (!hasCancelled) return false;
      }
    }

    return true;
  });

  // -------------------------------------------------------------
  // MY SCHEDULE TIMELINE & STATUS COMPUTATION
  // -------------------------------------------------------------
  const todayDayIndex = now.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat
  const todayDayName = now.toLocaleDateString('en-US', { weekday: 'short' }); // e.g. "Sun" or "Mon"

  // Check if today has active time-off
  const isTimeOffToday = timeOffList.some((to) => {
    const s = new Date(to.startDateTime);
    const e = new Date(to.endDateTime);
    return s <= todayEnd && e >= todayStart;
  });

  // Upcoming vs Previous Time Off splitting
  const upcomingTimeOff = timeOffList
    .filter((to) => new Date(to.endDateTime) > now)
    .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

  const previousTimeOff = timeOffList
    .filter((to) => new Date(to.endDateTime) <= now)
    .sort((a, b) => new Date(b.startDateTime) - new Date(a.startDateTime));

  const todayScheduleObj = myStaffProfile?.schedules?.find((s) => s.dayOfWeek === todayDayIndex);
  const isWorkingToday = (todayScheduleObj ? todayScheduleObj.isAvailable : true) && !isTimeOffToday;

  // Construct Today's Shift & Timeline Events (Interleaving Bookings & Breaks)
  const shiftStartHour = 9;
  const shiftEndHour = 18;
  const shiftStartMs = new Date(todayY, todayM, todayD, shiftStartHour, 0, 0, 0).getTime();
  const shiftEndMs = new Date(todayY, todayM, todayD, shiftEndHour, 0, 0, 0).getTime();

  // Collect today's recurring breaks
  const todaysBreaks = (myStaffProfile?.breaks || []).filter((b) => b.dayOfWeek === todayDayIndex);

  // Combine Bookings and Breaks into busy events sorted chronologically
  const busyEvents = [
    ...todaysBookings.map((b) => {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime || bStart.getTime() + (b.service?.durationMinutes || 60) * 60000);
      return { type: 'BOOKING', booking: b, startTime: bStart, endTime: bEnd };
    }),
    ...todaysBreaks.map((br) => {
      const [sh, sm] = br.startTime.split(':').map(Number);
      const [eh, em] = br.endTime.split(':').map(Number);
      const brStart = new Date(todayY, todayM, todayD, sh, sm, 0, 0);
      const brEnd = new Date(todayY, todayM, todayD, eh, em, 0, 0);
      return { type: 'BREAK', breakItem: br, startTime: brStart, endTime: brEnd };
    }),
  ].sort((a, b) => a.startTime - b.startTime);

  const timelineItems = [];
  let currMs = shiftStartMs;

  if (isWorkingToday) {
    busyEvents.forEach((item) => {
      const itemStart = item.startTime.getTime();
      const itemEnd = item.endTime.getTime();

      // Free Available period before item inside shift
      if (itemStart > currMs && currMs < shiftEndMs) {
        const freeStart = new Date(currMs);
        const freeEnd = new Date(Math.min(itemStart, shiftEndMs));
        const diffMins = Math.round((freeEnd.getTime() - freeStart.getTime()) / 60000);
        if (diffMins > 0) {
          timelineItems.push({
            type: 'AVAILABLE',
            startTime: freeStart,
            endTime: freeEnd,
            durationMins: diffMins,
          });
        }
      }

      timelineItems.push(item);
      currMs = Math.max(currMs, itemEnd);
    });

    // Trailing free time after last event until shiftEnd
    if (currMs < shiftEndMs) {
      const freeStart = new Date(currMs);
      const freeEnd = new Date(shiftEndMs);
      const diffMins = Math.round((freeEnd.getTime() - freeStart.getTime()) / 60000);
      if (diffMins > 0) {
        timelineItems.push({
          type: 'AVAILABLE',
          startTime: freeStart,
          endTime: freeEnd,
          durationMins: diffMins,
        });
      }
    }
  }

  return (
    <div className="w-full h-screen bg-[#EAEFEA] text-[#102C26] font-sans flex flex-col md:flex-row antialiased selection:bg-[#AEC5B8] selection:text-[#102C26] overflow-hidden">
      {/* ------------------------------------------------------------- */}
      {/* 1. SIDEBAR (STAFF WORKSPACE) */}
      {/* ------------------------------------------------------------- */}
      <aside className={`w-full md:w-64 bg-[#E2ECE7] text-[#102C26] border-r border-[#D3E0D9] flex-shrink-0 flex flex-col justify-between p-6 relative overflow-hidden transition-all duration-200 z-30 ${
        mobileMenuOpen ? 'block' : 'hidden md:flex'
      }`}>
        <div className="absolute -bottom-16 -left-16 w-64 h-64 pointer-events-none z-0 opacity-70">
          <svg viewBox="0 0 300 300" className="w-full h-full text-[#CBDCD3] fill-current">
            <path d="M 0 300 L 250 300 C 200 200, 150 100, 50 150 C 0 170, 0 300, 0 300 Z" />
          </svg>
        </div>

        <div className="flex flex-col space-y-6 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#1D4439] text-white flex items-center justify-center font-bold shadow-2xs">
              <Layers className="w-5.5 h-5.5 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-[#102C26] font-heading tracking-tight">ServiceHub</span>
          </div>

          <div className="space-y-0.5 pl-0.5">
            <h3 className="text-sm font-bold text-[#102C26] font-heading">Staff Portal</h3>
            <p className="text-xs text-[#52665F] font-medium">{business?.name || 'Glow & Style Beauty Studio'}</p>
          </div>

          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1D4439] text-white font-bold shadow-2xs'
                      : 'text-[#3B5249] hover:bg-[#D5E4DC] hover:text-[#102C26] font-semibold'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#3B5249]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 relative z-10 space-y-8">
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center space-x-3 text-xs font-bold text-[#3B5249] hover:text-[#102C26] transition-colors cursor-pointer px-1"
          >
            <LogOut className="w-4 h-4 text-[#3B5249]" />
            <span>Log out</span>
          </button>

          <div className="space-y-2 pt-2">
            <p className="text-xs font-bold text-[#102C26] leading-snug font-heading">
              Great services create happier people.
            </p>
            <div className="w-6 h-0.5 bg-[#1D4439] rounded-full" />
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* MAIN WORKSPACE CONTENT */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="px-6 md:px-8 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[#102C26] bg-white border border-[#D3E0D9]"
            >
              <Building2 className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 px-4 py-2 bg-white/90 rounded-full border border-[#D3E0D9] shadow-2xs">
              <Building2 className="w-4 h-4 text-[#102C26]" />
              <span className="text-xs font-bold text-[#102C26]">
                {business?.name || 'Glow & Style Beauty Studio'}
              </span>
              <span className="text-[10px] font-bold bg-[#E2ECE7] text-[#1D4439] px-2.5 py-0.5 rounded-full border border-[#CBDCD3]">
                Staff View
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2.5 px-3.5 py-1.5 bg-white/90 rounded-full border border-[#D3E0D9] shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-[#1D4439] text-white text-xs font-bold flex items-center justify-center">
                {staffDisplayName.charAt(0)}
              </div>
              <span className="text-xs font-bold text-[#102C26]">{staffDisplayName}</span>
              <span className="text-[10px] font-extrabold bg-[#DFF2E9] text-[#0B8F6A] px-2 py-0.5 rounded-full border border-[#0B8F6A]/30">
                STAFF
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#52665F]" />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2.5 rounded-full bg-white/90 border border-[#D3E0D9] text-[#102C26] hover:bg-white transition-colors cursor-pointer shadow-2xs"
              >
                <Bell className="w-4.5 h-4.5 text-[#102C26]" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>

              {notificationsOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#D3E0D9] p-4 z-50 animate-fade-in-scale space-y-3"
                  onMouseLeave={() => setNotificationsOpen(false)}
                >
                  <div className="flex items-center justify-between border-b border-[#E5EDE7] pb-2">
                    <span className="text-xs font-extrabold text-[#102C26]">Staff Notifications</span>
                    <span className="text-[10px] font-bold text-[#0B8F6A] font-mono">{todaysBookings.length} Today</span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {todaysBookings.slice(0, 3).map((b) => (
                      <div key={b.id} className="p-2.5 bg-[#F4F8F5] rounded-xl text-xs space-y-1 border border-[#D3E0D9]">
                        <p className="font-bold text-[#102C26]">{b.customer?.name || 'Client'} — {b.service?.name}</p>
                        <p className="text-[11px] text-[#52665F] font-mono">
                          {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {b.status}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-6 md:p-8 space-y-7 flex-1">
          {loading ? (
            <LoadingState message="Loading staff schedule..." />
          ) : error ? (
            <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-4 shadow-2xs max-w-lg mx-auto my-12">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#102C26]">Unable to load your schedule</h3>
                <p className="text-xs text-[#52665F]">{error}</p>
              </div>
              <button
                type="button"
                onClick={loadStaffData}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#1D4439] text-white text-xs font-bold hover:bg-[#15342B] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          ) : (
            <>
              {/* TAB 1: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-7 animate-fade-in-up">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#102C26] tracking-tight font-heading">
                        {timeGreeting}, {staffFirstName} 👋
                      </h1>
                      <p className="text-sm text-[#52665F] font-medium">
                        Here's your schedule and activity for today.
                      </p>
                    </div>

                    <div className="px-4 py-2.5 bg-white rounded-2xl border border-[#D3E0D9] shadow-2xs flex items-center space-x-2.5 text-xs font-bold text-[#102C26] self-start sm:self-auto">
                      <Calendar className="w-4 h-4 text-[#1D4439]" />
                      <span>{formattedCurrentDate}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="bg-white rounded-3xl border border-[#D3E0D9] p-6 space-y-3 shadow-2xs">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-[#DFF2E9] text-[#0B8F6A] flex items-center justify-center font-bold">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-[#52665F]">Today's Appointments</span>
                      </div>
                      <div className="space-y-1 pl-1">
                        <p className="text-4xl font-extrabold text-[#102C26] font-heading">{todayAppointmentsCount}</p>
                        <p className="text-[11px] font-bold text-[#0B8F6A]">{apptDiffLabel}</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-[#D3E0D9] p-6 space-y-3 shadow-2xs">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-[#E0EDFF] text-[#2563EB] flex items-center justify-center font-bold">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-[#52665F]">Completed Today</span>
                      </div>
                      <div className="space-y-1 pl-1">
                        <p className="text-4xl font-extrabold text-[#102C26] font-heading">{completedTodayCount}</p>
                        <p className="text-[11px] font-bold text-[#2563EB]">
                          {todayAppointmentsCount > 0 ? `↗ ${completionRate}% completion rate` : 'No appointments today'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-[#D3E0D9] p-6 space-y-3 shadow-2xs">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-bold">
                          <Clock className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-[#52665F]">Remaining Today</span>
                      </div>
                      <div className="space-y-1 pl-1">
                        <p className="text-4xl font-extrabold text-[#102C26] font-heading">{remainingTodayCount}</p>
                        <p className="text-[11px] font-bold text-[#D97706]">
                          {nextAppointment
                            ? `Next at ${new Date(nextAppointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : remainingTodayCount > 0
                            ? `${remainingTodayCount} active work`
                            : 'No remaining work'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-[#D3E0D9] p-6 space-y-3 shadow-2xs">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center font-bold">
                          <Users className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-[#52665F]">My Services</span>
                      </div>
                      <div className="space-y-1 pl-1">
                        <p className="text-4xl font-extrabold text-[#102C26] font-heading">{myServicesCount}</p>
                        <p className="text-[11px] font-bold text-[#7C3AED]">
                          {myServicesCount > 0 ? 'Actively assigned' : 'No services assigned'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
                    <div className="lg:col-span-6 space-y-5">
                      <div className="bg-white rounded-3xl border border-[#D3E0D9] p-6 sm:p-7 space-y-5 shadow-2xs relative overflow-hidden flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between pb-2 border-b border-[#E5EDE7] relative z-10">
                          <h3 className="text-base font-extrabold text-[#102C26] font-heading">Next Appointment</h3>
                          <button
                            type="button"
                            onClick={() => setActiveTab('appointments')}
                            className="inline-flex items-center space-x-1 text-xs font-bold text-[#102C26] hover:text-[#0B8F6A] transition-colors cursor-pointer"
                          >
                            <span>View All</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {nextAppointment ? (
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center relative z-10 py-1">
                            <div className="sm:col-span-4 bg-[#EEF4F1] rounded-2xl p-5 flex flex-col items-center justify-center text-center border border-[#D3E0D9]/80 min-h-[110px]">
                              <span className="text-2xl font-extrabold text-[#102C26] font-mono leading-none">
                                {new Date(nextAppointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[0]}
                              </span>
                              <span className="text-base font-extrabold text-[#102C26] font-mono mt-1">
                                {new Date(nextAppointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[1] || ''}
                              </span>
                            </div>

                            <div className="sm:col-span-8 space-y-2.5">
                              <div className="flex items-center space-x-2">
                                <h4 className="text-lg font-extrabold text-[#102C26] font-heading">
                                  {nextAppointment.service?.name || 'Service Booking'}
                                </h4>
                                <span className="bg-[#DFF2E9] text-[#0B8F6A] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-[#0B8F6A]/30">
                                  {nextAppointment.status}
                                </span>
                              </div>

                              <div className="space-y-1.5 text-xs text-[#52665F] font-medium">
                                <div className="flex items-center space-x-2">
                                  <User className="w-3.5 h-3.5 text-[#102C26]" />
                                  <span className="font-bold text-[#102C26]">{nextAppointment.customer?.name || 'Customer'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-3.5 h-3.5 text-[#102C26]" />
                                  <span>{nextAppointment.service?.durationMinutes || 60} minutes</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="py-8 text-center space-y-2 bg-[#F4F8F5] rounded-2xl border border-dashed border-[#D3E0D9] my-auto">
                            <Calendar className="w-8 h-8 text-[#AEC5B8] mx-auto" />
                            <p className="text-sm font-extrabold text-[#102C26] font-heading">No upcoming appointment</p>
                            <p className="text-xs text-[#52665F]">You have no active upcoming bookings at this time.</p>
                          </div>
                        )}

                        <div className="pt-2 flex justify-end relative z-10">
                          {nextAppointment && (
                            <button
                              type="button"
                              onClick={() => setSelectedBooking(nextAppointment)}
                              className="inline-flex items-center space-x-2 bg-[#1D4439] hover:bg-[#15342B] text-white text-xs font-bold py-2.5 px-5 rounded-full shadow-2xs transition-all cursor-pointer"
                            >
                              <span>View Details</span>
                              <ArrowRight className="w-3.5 h-3.5 text-[#AEC5B8]" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-6 space-y-5">
                      <div className="bg-white rounded-3xl border border-[#D3E0D9] p-6 sm:p-7 space-y-5 shadow-2xs h-full flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-2 border-b border-[#E5EDE7]">
                          <h3 className="text-base font-extrabold text-[#102C26] font-heading">Today's Schedule</h3>
                          <button
                            type="button"
                            onClick={() => setActiveTab('schedule')}
                            className="inline-flex items-center space-x-1 text-xs font-bold text-[#102C26] hover:text-[#0B8F6A] transition-colors cursor-pointer"
                          >
                            <span>Open Calendar</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {todaysBookings.length === 0 ? (
                          <div className="py-12 text-center space-y-2 bg-[#F4F8F5] rounded-2xl border border-dashed border-[#D3E0D9] my-auto">
                            <Clock className="w-8 h-8 text-[#AEC5B8] mx-auto" />
                            <p className="text-sm font-extrabold text-[#102C26] font-heading">No appointments scheduled for today</p>
                            <p className="text-xs text-[#52665F]">Your shift is clear or no bookings assigned today.</p>
                          </div>
                        ) : (
                          <div className="space-y-3 relative py-1 max-h-72 overflow-y-auto pr-1">
                            <div className="absolute top-3 bottom-3 left-16 w-0.5 bg-[#E5EDE7]" />
                            {todaysBookings.map((b) => {
                              const bTime = new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              const isCurrent = b.id === nextAppointment?.id || b.status === 'IN_PROGRESS';
                              
                              let badgeClass = 'bg-[#DFF2E9] text-[#0B8F6A]';
                              if (b.status === 'PENDING') badgeClass = 'bg-[#FEF3C7] text-[#D97706]';
                              if (b.status === 'IN_PROGRESS') badgeClass = 'bg-[#E0EDFF] text-[#2563EB]';
                              if (b.status === 'CANCELLED') badgeClass = 'bg-[#FFE4E6] text-[#E11D48]';

                              return (
                                <div
                                  key={b.id}
                                  onClick={() => setSelectedBooking(b)}
                                  className={`flex items-center justify-between py-2 px-3 rounded-xl transition-all cursor-pointer hover:bg-[#EEF4F1] ${
                                    isCurrent ? 'bg-[#EEF4F1] ring-1 ring-[#1D4439]/30' : ''
                                  }`}
                                >
                                  <div className="flex items-center space-x-4 min-w-0">
                                    <span className="font-mono text-xs font-bold text-[#52665F] w-14 text-right flex-shrink-0">{bTime}</span>
                                    <div className={`w-3 h-3 rounded-full z-10 flex-shrink-0 ${isCurrent ? 'bg-[#1D4439] ring-4 ring-[#1D4439]/20' : 'bg-[#C5D8CE]'}`} />
                                    <span className="font-bold text-xs text-[#102C26] truncate">{b.service?.name || 'Service'}</span>
                                  </div>
                                  <div className="flex items-center space-x-3 flex-shrink-0 pl-2">
                                    <span className="text-xs font-semibold text-[#52665F] hidden sm:inline truncate max-w-[100px]">{b.customer?.name || 'Customer'}</span>
                                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${badgeClass}`}>{b.status}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <div className="flex items-center space-x-3 bg-white/80 border border-[#D3E0D9] rounded-2xl px-5 py-3 shadow-2xs">
                      <Quote className="w-4 h-4 text-[#0B8F6A] rotate-180 flex-shrink-0" />
                      <p className="text-xs font-semibold text-[#102C26] italic font-sans">
                        "Every appointment is an opportunity to make someone feel better."
                      </p>
                    </div>
                    <p className="text-xs font-bold text-[#52665F] font-heading">
                      Keep up the great work, {staffFirstName}!
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: MY APPOINTMENTS */}
              {activeTab === 'appointments' && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="bg-white rounded-3xl border border-[#D3E0D9] p-6 space-y-5 shadow-2xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EDE7]">
                      <div>
                        <h1 className="text-2xl font-extrabold text-[#102C26] font-heading tracking-tight">My Appointments</h1>
                        <p className="text-xs text-[#52665F] font-medium">Manage and track your assigned appointments.</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 bg-[#EEF4F1] p-1.5 rounded-full border border-[#D3E0D9]">
                        {[
                          { id: 'TODAY', label: 'Today' },
                          { id: 'UPCOMING', label: 'Upcoming' },
                          { id: 'COMPLETED', label: 'Completed' },
                          { id: 'CANCELLED', label: 'Cancelled' },
                          { id: 'ALL', label: 'All' },
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setAppointmentTabFilter(t.id)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              appointmentTabFilter === t.id
                                ? 'bg-[#1D4439] text-white shadow-2xs'
                                : 'text-[#52665F] hover:text-[#102C26] hover:bg-white/60'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1">
                      <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 text-[#52665F] absolute left-3.5 top-3" />
                        <input
                          type="text"
                          placeholder="Search customer or service..."
                          value={appointmentSearch}
                          onChange={(e) => setAppointmentSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-[#F4F8F5] border border-[#D3E0D9] rounded-full text-xs font-medium focus:outline-none focus:border-[#1D4439]"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                        <select
                          value={appointmentServiceFilter}
                          onChange={(e) => setAppointmentServiceFilter(e.target.value)}
                          className="px-3.5 py-2 bg-[#F4F8F5] border border-[#D3E0D9] rounded-full text-xs font-bold text-[#102C26] focus:outline-none focus:border-[#1D4439]"
                        >
                          <option value="ALL">All Services</option>
                          {myServices.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>

                        <input
                          type="date"
                          value={appointmentDateFilter}
                          onChange={(e) => setAppointmentDateFilter(e.target.value)}
                          className="px-3.5 py-1.5 bg-[#F4F8F5] border border-[#D3E0D9] rounded-full text-xs font-mono font-bold text-[#102C26] focus:outline-none focus:border-[#1D4439]"
                        />
                      </div>
                    </div>
                  </div>

                  {filteredAppointments.length === 0 ? (
                    <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-[#D3E0D9] p-8 shadow-2xs">
                      <Calendar className="w-12 h-12 text-[#AEC5B8] mx-auto" />
                      <div className="space-y-1">
                        <h3 className="text-base font-extrabold text-[#102C26] font-heading">
                          {appointmentTabFilter === 'TODAY' && 'No appointments scheduled for today.'}
                          {appointmentTabFilter === 'UPCOMING' && 'No upcoming appointments.'}
                          {appointmentTabFilter === 'COMPLETED' && 'No completed appointments yet.'}
                          {appointmentTabFilter === 'CANCELLED' && 'No cancelled appointments.'}
                          {appointmentTabFilter === 'ALL' && 'No appointments found.'}
                        </h3>
                        <p className="text-xs text-[#52665F]">
                          {appointmentSearch || appointmentDateFilter ? 'Try clearing your search query or filters.' : 'Check back later for assigned shift bookings.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredAppointments.map((b) => {
                        const bDate = new Date(b.startTime);
                        const endDate = new Date(b.endTime || bDate.getTime() + (b.service?.durationMinutes || 60) * 60000);
                        const isToday = bDate >= todayStart && bDate <= todayEnd;

                        let badgeClass = 'bg-[#DFF2E9] text-[#0B8F6A] border-[#0B8F6A]/30';
                        if (b.status === 'PENDING') badgeClass = 'bg-[#FEF3C7] text-[#D97706] border-[#F59E0B]/30';
                        if (b.status === 'IN_PROGRESS') badgeClass = 'bg-[#E0EDFF] text-[#2563EB] border-[#2563EB]/30';
                        if (b.status === 'CANCELLED') badgeClass = 'bg-[#FFE4E6] text-[#E11D48] border-[#F43F5E]/30';
                        if (b.status === 'NO_SHOW') badgeClass = 'bg-[#FEE2E2] text-[#991B1B] border-[#991B1B]/30';

                        return (
                          <div
                            key={b.id}
                            className={`p-5 rounded-3xl border transition-all space-y-4 shadow-2xs hover:shadow-md ${
                              isToday
                                ? 'bg-[#EEF4F1] border-[#0B8F6A]/60 ring-1 ring-[#0B8F6A]/20'
                                : 'bg-white border-[#D3E0D9] hover:border-[#AEC5B8]'
                            }`}
                          >
                            <div className="flex items-center justify-between pb-3 border-b border-[#E5EDE7]">
                              <div className="flex items-center space-x-2 font-mono text-xs font-extrabold text-[#102C26]">
                                <Calendar className="w-4 h-4 text-[#1D4439]" />
                                <span>
                                  {bDate.toLocaleDateString([], { month: 'short', day: '2-digit' })} • {bDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <div className="flex items-center space-x-2">
                                {isToday && (
                                  <span className="text-[10px] font-extrabold bg-[#1D4439] text-white px-2 py-0.5 rounded-full uppercase">
                                    TODAY
                                  </span>
                                )}
                                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border font-mono ${badgeClass}`}>
                                  {b.status}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h3 className="text-base font-extrabold text-[#102C26] font-heading">
                                {b.service?.name || 'Service Booking'}
                              </h3>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs text-[#52665F]">
                                <div className="flex items-center space-x-1.5">
                                  <User className="w-3.5 h-3.5 text-[#102C26]" />
                                  <span className="font-bold text-[#102C26] truncate">{b.customer?.name || 'Customer'}</span>
                                </div>
                                <div className="flex items-center space-x-1.5">
                                  <Clock className="w-3.5 h-3.5 text-[#102C26]" />
                                  <span>{b.service?.durationMinutes || 60} mins</span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-[#E5EDE7] flex items-center justify-between">
                              <span className="text-[11px] font-mono text-[#52665F]">
                                End Time: {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedBooking(b)}
                                className="px-4 py-2 bg-[#1D4439] hover:bg-[#15342B] text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-2xs"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 3: MY SCHEDULE WORKSPACE (REDESIGNED FULL DAY WORKSPACE) */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'schedule' && (
                <div className="space-y-7 animate-fade-in-up">
                  {/* Page Header */}
                  <div className="bg-white rounded-3xl border border-[#D3E0D9] p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                    <div className="space-y-1">
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102C26] font-heading tracking-tight">
                        My Schedule
                      </h1>
                      <p className="text-xs sm:text-sm text-[#52665F] font-medium">
                        View your working hours, availability, and today's appointments.
                      </p>
                    </div>

                    <div className="px-4 py-2.5 bg-[#EEF4F1] rounded-full border border-[#D3E0D9] text-xs font-mono font-bold text-[#102C26] flex items-center space-x-2 self-start sm:self-auto shadow-2xs">
                      <Calendar className="w-4 h-4 text-[#1D4439]" />
                      <span>{formattedCurrentDate}</span>
                    </div>
                  </div>

                  {/* Today's Working Status Banner Card */}
                  <div className="bg-white rounded-3xl border border-[#D3E0D9] p-6 sm:p-7 space-y-4 shadow-2xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EDE7]">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-extrabold text-[#52665F] uppercase tracking-widest block">
                          TODAY'S WORKING STATUS
                        </span>
                        <h2 className="text-lg sm:text-xl font-extrabold text-[#102C26] font-heading">
                          {formattedCurrentDate}
                        </h2>
                      </div>

                      <div className="flex items-center space-x-3">
                        {isTimeOffToday ? (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase font-mono">
                            ON TIME OFF
                          </span>
                        ) : isWorkingToday ? (
                          <span className="bg-[#DFF2E9] text-[#0B8F6A] border border-[#0B8F6A]/30 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase font-mono flex items-center space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>WORKING TODAY</span>
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-700 border border-gray-300 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase font-mono">
                            OFF DAY
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-medium text-[#52665F] pt-1">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-4 h-4 text-[#1D4439]" />
                        <span>Shift Hours: <strong className="text-[#102C26] font-bold font-mono">{todayScheduleObj ? `${todayScheduleObj.startTime} – ${todayScheduleObj.endTime}` : '09:00 AM – 06:00 PM'}</strong></span>
                      </div>
                      <div className="flex items-center space-x-3 font-mono">
                        <span className="bg-[#EEF4F1] px-3 py-1 rounded-full text-[#102C26] font-bold border border-[#D3E0D9]">
                          {todaysBookings.length} Appointments Assigned Today
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Two-Column Grid: Left (Timeline), Right (Weekly Matrix & Time Off) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
                    {/* Left Column (Lg: col-span-7): Chronological Working Day Timeline */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="bg-white rounded-3xl border border-[#D3E0D9] p-6 sm:p-7 space-y-6 shadow-2xs">
                        <div className="flex items-center justify-between pb-3 border-b border-[#E5EDE7]">
                          <div className="space-y-0.5">
                            <h3 className="text-base font-extrabold text-[#102C26] font-heading">
                              Today's Timeline & Shift Roster
                            </h3>
                            <p className="text-xs text-[#52665F]">Chronological working hours, assigned bookings & free availability</p>
                          </div>
                          <span className="text-[10px] font-mono font-bold bg-[#EEF4F1] text-[#1D4439] px-2.5 py-1 rounded-full border border-[#D3E0D9]">
                            {isWorkingToday ? 'Working Shift Active' : 'Scheduled Off Day'}
                          </span>
                        </div>

                        {!isWorkingToday ? (
                          <div className="py-12 text-center text-xs text-[#52665F] space-y-2 bg-[#F4F8F5] rounded-2xl border border-[#D3E0D9]">
                            <Palmtree className="w-10 h-10 text-[#AEC5B8] mx-auto" />
                            <p className="font-extrabold text-[#102C26] text-sm font-heading">Today is your scheduled day off.</p>
                            <p>Enjoy your break or check upcoming shifts below.</p>
                          </div>
                        ) : (
                          <div className="space-y-4 relative">
                            {/* Shift Start Marker */}
                            <div className="flex items-center space-x-3 text-xs font-mono font-extrabold text-[#1D4439] pb-1">
                              <span className="w-14 text-right">09:00 AM</span>
                              <div className="w-3 h-3 rounded-full bg-[#1D4439] ring-4 ring-[#1D4439]/20" />
                              <span className="bg-[#E2ECE7] text-[#1D4439] px-3 py-1 rounded-full text-[11px] font-bold">
                                Shift Start (09:00 AM)
                              </span>
                            </div>

                            {/* Timeline Items List */}
                            {timelineItems.map((item, idx) => {
                              if (item.type === 'AVAILABLE') {
                                return (
                                  <div key={`free-${idx}`} className="pl-14 pr-2 py-3 bg-[#DFF2E9]/40 border border-[#0B8F6A]/20 rounded-2xl flex items-center justify-between text-xs transition-colors">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-2 h-2 rounded-full bg-[#0B8F6A]" />
                                      <div>
                                        <span className="font-extrabold text-[#0B8F6A] font-mono">AVAILABLE PERIOD</span>
                                        <p className="text-[11px] text-[#52665F] font-mono">
                                          {item.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {item.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({item.durationMins} min free time)
                                        </p>
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-[#0B8F6A] bg-white px-2.5 py-0.5 rounded-full border border-[#0B8F6A]/20">
                                      FREE TIME
                                    </span>
                                  </div>
                                );
                              } else if (item.type === 'BREAK') {
                                const br = item.breakItem;
                                return (
                                  <div
                                    key={`break-${br.id || idx}`}
                                    className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                  >
                                    <div className="flex items-center space-x-4">
                                      <div className="w-14 font-mono text-xs font-extrabold text-amber-900 text-right flex-shrink-0">
                                        {item.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                      <div className="space-y-0.5">
                                        <div className="flex items-center space-x-2">
                                          <Coffee className="w-4 h-4 text-amber-700" />
                                          <h4 className="font-extrabold text-sm text-amber-950 font-heading">
                                            BREAK — {br.label || 'Staff Break'}
                                          </h4>
                                        </div>
                                        <p className="text-xs text-amber-800 font-mono">
                                          {br.startTime} – {br.endTime} • Scheduled Recurring Break
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-3 self-end sm:self-auto">
                                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border font-mono bg-amber-100 text-amber-900 border-amber-300">
                                        BREAK
                                      </span>
                                    </div>
                                  </div>
                                );
                              } else {
                                const b = item.booking;
                                let badgeClass = 'bg-[#DFF2E9] text-[#0B8F6A] border-[#0B8F6A]/30';
                                if (b.status === 'PENDING') badgeClass = 'bg-[#FEF3C7] text-[#D97706] border-[#F59E0B]/30';
                                if (b.status === 'IN_PROGRESS') badgeClass = 'bg-[#E0EDFF] text-[#2563EB] border-[#2563EB]/30';
                                if (b.status === 'CANCELLED') badgeClass = 'bg-[#FFE4E6] text-[#E11D48] border-[#F43F5E]/30';

                                return (
                                  <div
                                    key={b.id}
                                    onClick={() => setSelectedBooking(b)}
                                    className="p-4 bg-white border border-[#D3E0D9] hover:border-[#1D4439] rounded-2xl shadow-2xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                                  >
                                    <div className="flex items-center space-x-4">
                                      <div className="w-14 font-mono text-xs font-extrabold text-[#102C26] text-right flex-shrink-0">
                                        {item.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                      <div className="space-y-0.5">
                                        <h4 className="font-extrabold text-sm text-[#102C26] font-heading group-hover:text-[#0B8F6A] transition-colors">
                                          {b.service?.name}
                                        </h4>
                                        <p className="text-xs text-[#52665F]">
                                          Client: <strong className="text-[#102C26] font-semibold">{b.customer?.name || 'Customer'}</strong> • {b.service?.durationMinutes || 60} mins
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-3 self-end sm:self-auto">
                                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border font-mono ${badgeClass}`}>
                                        {b.status}
                                      </span>
                                      <ChevronRight className="w-4 h-4 text-[#AEC5B8] group-hover:text-[#1D4439] transition-colors" />
                                    </div>
                                  </div>
                                );
                              }
                            })}

                            {/* Shift End Marker */}
                            <div className="flex items-center space-x-3 text-xs font-mono font-extrabold text-[#1D4439] pt-2">
                              <span className="w-14 text-right">06:00 PM</span>
                              <div className="w-3 h-3 rounded-full bg-[#1D4439] ring-4 ring-[#1D4439]/20" />
                              <span className="bg-[#E2ECE7] text-[#1D4439] px-3 py-1 rounded-full text-[11px] font-bold">
                                Shift End (06:00 PM)
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column (Lg: col-span-5): Weekly Working Hours Matrix & Upcoming Time Off */}
                    <div className="lg:col-span-5 space-y-6">
                      {/* Weekly Working Hours Matrix Card */}
                      <div className="bg-white rounded-3xl border border-[#D3E0D9] p-6 space-y-5 shadow-2xs">
                        <div className="flex items-center justify-between pb-3 border-b border-[#E5EDE7]">
                          <div className="space-y-0.5">
                            <h3 className="text-base font-extrabold text-[#102C26] font-heading">
                              Weekly Working Hours
                            </h3>
                            <p className="text-xs text-[#52665F]">Standard weekly shift schedule roster & breaks</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenAddBreak(1)}
                            className="px-3 py-1 bg-[#EEF4F1] hover:bg-[#DFF2E9] text-[#1D4439] text-xs font-bold rounded-full border border-[#D3E0D9] flex items-center space-x-1.5 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Break</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          {[
                            { dayIdx: 1, dayName: 'Mon', fullDay: 'Monday' },
                            { dayIdx: 2, dayName: 'Tue', fullDay: 'Tuesday' },
                            { dayIdx: 3, dayName: 'Wed', fullDay: 'Wednesday' },
                            { dayIdx: 4, dayName: 'Thu', fullDay: 'Thursday' },
                            { dayIdx: 5, dayName: 'Fri', fullDay: 'Friday' },
                            { dayIdx: 6, dayName: 'Sat', fullDay: 'Saturday' },
                            { dayIdx: 0, dayName: 'Sun', fullDay: 'Sunday' }
                          ].map((day, idx) => {
                            const sched = myStaffProfile?.schedules?.find((s) => s.dayOfWeek === day.dayIdx);
                            const isAvail = sched ? sched.isAvailable : true;
                            const isToday = todayDayIndex === day.dayIdx;
                            const dayBreaks = (myStaffProfile?.breaks || []).filter((b) => b.dayOfWeek === day.dayIdx);

                            return (
                              <div
                                key={idx}
                                className={`p-3 rounded-2xl border flex flex-col space-y-2 text-xs transition-all ${
                                  isToday
                                    ? 'bg-[#EEF4F1] border-[#1D4439] ring-2 ring-[#1D4439]/30 font-bold shadow-2xs'
                                    : 'bg-[#F4F8F5] border-[#D3E0D9] text-[#52665F]'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <span className="font-mono font-bold text-[#102C26] w-10">{day.dayName}</span>
                                    {isToday && (
                                      <span className="text-[9px] font-extrabold bg-[#1D4439] text-white px-2 py-0.5 rounded-full uppercase">
                                        TODAY
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className={`font-mono text-xs font-bold ${isAvail ? 'text-[#102C26]' : 'text-rose-600'}`}>
                                      {isAvail ? `${sched?.startTime || '09:00 AM'} – ${sched?.endTime || '06:00 PM'}` : 'OFF DAY'}
                                    </span>
                                    {isAvail && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAddBreak(day.dayIdx)}
                                        className="text-[10px] text-[#0B8F6A] hover:underline font-bold"
                                      >
                                        + Break
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {isAvail && dayBreaks.length > 0 && (
                                  <div className="pt-1.5 border-t border-[#D3E0D9]/60 space-y-1">
                                    {dayBreaks.map((br) => (
                                      <div
                                        key={br.id}
                                        className="flex items-center justify-between text-[11px] bg-amber-50 text-amber-900 px-2.5 py-1 rounded-xl border border-amber-200/80 font-mono"
                                      >
                                        <div className="flex items-center space-x-1.5">
                                          <Coffee className="w-3 h-3 text-amber-700 flex-shrink-0" />
                                          <span>
                                            Break: <strong>{br.startTime} – {br.endTime}</strong> {br.label && `(${br.label})`}
                                          </span>
                                        </div>
                                        <div className="flex items-center space-x-2 font-sans">
                                          <button
                                            type="button"
                                            onClick={() => handleOpenEditBreak(br)}
                                            className="text-[10px] text-[#1D4439] hover:underline font-bold"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteBreak(br.id)}
                                            className="text-[10px] text-rose-600 hover:underline font-bold"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Upcoming Time Off Section */}
                      <div className="bg-white rounded-3xl border border-[#D3E0D9] p-6 space-y-4 shadow-2xs">
                        <div className="flex items-center justify-between pb-3 border-b border-[#E5EDE7]">
                          <div className="space-y-0.5">
                            <h3 className="text-base font-extrabold text-[#102C26] font-heading">
                              Upcoming Time Off
                            </h3>
                            <p className="text-xs text-[#52665F]">Scheduled leaves and absence approvals</p>
                          </div>
                          <Palmtree className="w-4 h-4 text-[#0B8F6A]" />
                        </div>

                        {timeOffList.length === 0 ? (
                          <p className="text-xs text-[#52665F] text-center py-4">No upcoming time off scheduled.</p>
                        ) : (
                          <div className="space-y-3">
                            {timeOffList.map((to) => (
                              <div key={to.id} className="p-3.5 bg-[#F4F8F5] rounded-2xl border border-[#D3E0D9] space-y-1 text-xs">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-bold text-[#102C26]">{to.reason || 'Staff Leave'}</h4>
                                  <span className="text-[10px] font-extrabold bg-[#DFF2E9] text-[#0B8F6A] px-2 py-0.5 rounded-full">
                                    APPROVED
                                  </span>
                                </div>
                                <p className="text-[#52665F] font-mono text-[11px]">
                                  {new Date(to.startDateTime).toLocaleDateString()} — {new Date(to.endDateTime).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="pt-2 text-right">
                          <button
                            type="button"
                            onClick={() => setActiveTab('time-off')}
                            className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#102C26] hover:text-[#0B8F6A] transition-colors cursor-pointer"
                          >
                            <span>View Time Off</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#0B8F6A]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* OTHER SUB-TABS */}
              {activeTab === 'services' && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="bg-white rounded-3xl border border-[#D3E0D9] p-6 space-y-6 shadow-2xs">
                    <div className="flex items-center justify-between pb-4 border-b border-[#E5EDE7]">
                      <div>
                        <h2 className="text-xl font-extrabold text-[#102C26] font-heading">
                          My Assigned Services
                        </h2>
                        <p className="text-xs text-[#52665F]">Services assigned to you by your business owner.</p>
                      </div>
                      <span className="bg-[#EEF4F1] text-[#1D4439] border border-[#D3E0D9] text-xs font-mono font-extrabold px-3 py-1 rounded-full">
                        {myServices.length} Services
                      </span>
                    </div>

                    {myServices.length === 0 ? (
                      <div className="py-16 text-center space-y-3 bg-[#F4F8F5] rounded-3xl border border-dashed border-[#D3E0D9] p-8">
                        <Scissors className="w-12 h-12 text-[#AEC5B8] mx-auto" />
                        <div className="space-y-1">
                          <h3 className="text-base font-extrabold text-[#102C26] font-heading">No services assigned yet</h3>
                          <p className="text-xs text-[#52665F]">Your business owner has not assigned any services to your profile.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myServices.map((svc) => (
                          <div key={svc.id} className="p-6 bg-[#F4F8F5] rounded-3xl border border-[#D3E0D9] space-y-4 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <Scissors className="w-5 h-5 text-[#0B8F6A]" />
                              <span className="text-sm font-mono font-extrabold text-[#0B8F6A]">
                                ₹{Number(svc.price).toFixed(0)}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-extrabold text-[#102C26] text-base font-heading">{svc.name}</h3>
                              <p className="text-xs text-[#52665F] leading-relaxed line-clamp-2">{svc.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'clients' && (
                <div className="space-y-6 animate-fade-in-up">
                  {/* Page Header */}
                  <div className="bg-white rounded-3xl border border-[#D3E0D9] p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102C26] font-heading tracking-tight">
                          Clients Directory
                        </h1>
                        <span className="bg-[#EEF4F1] text-[#1D4439] border border-[#D3E0D9] text-xs font-mono font-extrabold px-3 py-1 rounded-full">
                          {staffClients.length} Clients
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#52665F] font-medium">
                        Customers you've worked with through your appointments.
                      </p>
                    </div>
                  </div>

                  {/* Search + Filter Bar */}
                  <div className="bg-white rounded-3xl border border-[#D3E0D9] p-4 sm:p-5 space-y-4 shadow-2xs">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      {/* Search Input */}
                      <div className="sm:col-span-6 relative">
                        <Search className="w-4 h-4 text-[#AEC5B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          placeholder="Search clients by name, phone, or email..."
                          className="w-full pl-10 pr-4 py-2.5 bg-[#F4F8F5] border border-[#D3E0D9] rounded-2xl text-xs text-[#102C26] placeholder-[#819B91] focus:outline-none focus:border-[#1D4439] transition-colors font-medium"
                        />
                        {clientSearch && (
                          <button
                            onClick={() => setClientSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52665F] hover:text-[#102C26]"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Service Filter */}
                      <div className="sm:col-span-3">
                        <select
                          value={clientServiceFilter}
                          onChange={(e) => setClientServiceFilter(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#F4F8F5] border border-[#D3E0D9] rounded-2xl text-xs font-bold text-[#102C26] focus:outline-none focus:border-[#1D4439]"
                        >
                          <option value="ALL">All Services</option>
                          {myServices.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Status Filter */}
                      <div className="sm:col-span-3">
                        <select
                          value={clientStatusFilter}
                          onChange={(e) => setClientStatusFilter(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#F4F8F5] border border-[#D3E0D9] rounded-2xl text-xs font-bold text-[#102C26] focus:outline-none focus:border-[#1D4439]"
                        >
                          <option value="ALL">All Appointment Statuses</option>
                          <option value="TODAY">Today's Clients</option>
                          <option value="UPCOMING">Has Upcoming Appointment</option>
                          <option value="COMPLETED">Has Completed Service</option>
                          <option value="CANCELLED">Has Cancelled Appointment</option>
                        </select>
                      </div>
                    </div>

                    {(clientSearch || clientServiceFilter !== 'ALL' || clientStatusFilter !== 'ALL') && (
                      <div className="flex items-center justify-between pt-2 border-t border-[#E5EDE7] text-xs">
                        <span className="text-[#52665F] font-mono text-[11px]">
                          Showing {filteredStaffClients.length} of {staffClients.length} clients
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setClientSearch('');
                            setClientServiceFilter('ALL');
                            setClientStatusFilter('ALL');
                          }}
                          className="text-[#0B8F6A] font-bold hover:underline"
                        >
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Client List */}
                  {staffClients.length === 0 ? (
                    <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-[#D3E0D9] p-8 shadow-2xs">
                      <Users className="w-12 h-12 text-[#AEC5B8] mx-auto" />
                      <div className="space-y-1">
                        <h3 className="text-base font-extrabold text-[#102C26] font-heading">Your client list is empty</h3>
                        <p className="text-xs text-[#52665F]">Clients will appear here when appointments are assigned to you.</p>
                      </div>
                    </div>
                  ) : filteredStaffClients.length === 0 ? (
                    <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-[#D3E0D9] p-8 shadow-2xs">
                      <Search className="w-12 h-12 text-[#AEC5B8] mx-auto" />
                      <div className="space-y-1">
                        <h3 className="text-base font-extrabold text-[#102C26] font-heading">No clients found</h3>
                        <p className="text-xs text-[#52665F]">Try a different search.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setClientSearch('');
                          setClientServiceFilter('ALL');
                          setClientStatusFilter('ALL');
                        }}
                        className="px-4 py-2 bg-[#1D4439] text-white text-xs font-bold rounded-full hover:bg-[#15342B] transition-colors"
                      >
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden md:block bg-white rounded-3xl border border-[#D3E0D9] shadow-2xs overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-[#F4F8F5] border-b border-[#D3E0D9] text-[#102C26] font-extrabold font-mono uppercase text-[11px]">
                              <th className="py-3.5 px-5">Client</th>
                              <th className="py-3.5 px-5">Phone</th>
                              <th className="py-3.5 px-5">Email</th>
                              <th className="py-3.5 px-5">Current / Next Appointment</th>
                              <th className="py-3.5 px-5">Service</th>
                              <th className="py-3.5 px-5">Appointment Status</th>
                              <th className="py-3.5 px-5 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E5EDE7]">
                            {filteredStaffClients.map((client) => {
                              let badgeClass = 'bg-[#DFF2E9] text-[#0B8F6A] border-[#0B8F6A]/30';
                              if (client.currentStatus === 'PENDING') badgeClass = 'bg-[#FEF3C7] text-[#D97706] border-[#F59E0B]/30';
                              if (client.currentStatus === 'IN_PROGRESS') badgeClass = 'bg-[#E0EDFF] text-[#2563EB] border-[#2563EB]/30';
                              if (client.currentStatus === 'CANCELLED') badgeClass = 'bg-[#FFE4E6] text-[#E11D48] border-[#F43F5E]/30';

                              return (
                                <tr key={client.id} className="hover:bg-[#F8FAFC] transition-colors group">
                                  <td className="py-4 px-5">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-9 h-9 rounded-full bg-[#E2ECE7] text-[#1D4439] font-bold text-sm flex items-center justify-center font-heading border border-[#D3E0D9]">
                                        {client.name.charAt(0)}
                                      </div>
                                      <span className="font-extrabold text-sm text-[#102C26] font-heading group-hover:text-[#0B8F6A] transition-colors">
                                        {client.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-5 font-mono text-[11px] text-[#102C26] font-semibold">
                                    {client.phone || 'No phone'}
                                  </td>
                                  <td className="py-4 px-5 font-mono text-[11px] text-[#52665F]">
                                    {client.email || 'No email'}
                                  </td>
                                  <td className="py-4 px-5 font-mono text-[11px] font-medium text-[#102C26]">
                                    {client.currentAppointmentStr}
                                  </td>
                                  <td className="py-4 px-5">
                                    <span className="px-2.5 py-1 bg-[#EEF4F1] text-[#1D4439] rounded-full text-[11px] font-bold border border-[#D3E0D9]">
                                      {client.currentService}
                                    </span>
                                  </td>
                                  <td className="py-4 px-5">
                                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border font-mono ${badgeClass}`}>
                                      {client.currentStatus}
                                    </span>
                                  </td>
                                  <td className="py-4 px-5 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedClientDetail(client)}
                                      className="px-3.5 py-1.5 bg-[#1D4439] hover:bg-[#15342B] text-white text-xs font-bold rounded-full transition-colors cursor-pointer shadow-2xs inline-flex items-center space-x-1"
                                    >
                                      <span>View</span>
                                      <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Responsive Cards */}
                      <div className="md:hidden space-y-4">
                        {filteredStaffClients.map((client) => (
                          <div key={client.id} className="p-5 bg-white rounded-3xl border border-[#D3E0D9] space-y-4 shadow-2xs">
                            <div className="flex items-center justify-between pb-3 border-b border-[#E5EDE7]">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-[#E2ECE7] text-[#1D4439] font-bold text-base flex items-center justify-center font-heading border border-[#D3E0D9]">
                                  {client.name.charAt(0)}
                                </div>
                                <h3 className="font-extrabold text-base text-[#102C26] font-heading">{client.name}</h3>
                              </div>
                              <span className="text-[10px] font-extrabold bg-[#DFF2E9] text-[#0B8F6A] px-2.5 py-0.5 rounded-full border border-[#0B8F6A]/30 uppercase font-mono">
                                {client.currentStatus}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#52665F]">
                              <div>
                                <span className="text-[10px] text-[#AEC5B8] uppercase block">Phone</span>
                                <span className="text-[#102C26] font-bold">{client.phone || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[#AEC5B8] uppercase block">Service</span>
                                <span className="text-[#1D4439] font-bold">{client.currentService}</span>
                              </div>
                            </div>

                            <div className="p-2.5 bg-[#EEF4F1] rounded-2xl border border-[#D3E0D9] text-xs font-mono text-[#102C26]">
                              <span className="text-[10px] text-[#52665F] uppercase font-bold block">Appointment</span>
                              <span className="font-bold">{client.currentAppointmentStr}</span>
                            </div>

                            <div className="pt-2 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedClientDetail(client)}
                                className="w-full py-2 bg-[#1D4439] hover:bg-[#15342B] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'time-off' && (
                <div className="space-y-6 animate-fade-in-up">
                  {/* Page Header */}
                  <div className="bg-white rounded-3xl border border-[#D3E0D9] p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102C26] font-heading tracking-tight">
                          Time Off
                        </h1>
                        <span className="bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B]/30 text-xs font-mono font-extrabold px-3 py-1 rounded-full flex items-center space-x-1">
                          <Palmtree className="w-3.5 h-3.5" />
                          <span>{upcomingTimeOff.length} Scheduled</span>
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#52665F] font-medium">
                        Manage the days and hours you're unavailable.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenRequestTimeOff}
                      className="px-5 py-3 bg-[#1D4439] hover:bg-[#15342B] text-white text-xs font-extrabold rounded-2xl transition-colors cursor-pointer shadow-2xs flex items-center justify-center space-x-2 self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4 text-white" />
                      <span>Request Time Off</span>
                    </button>
                  </div>

                  {timeOffSuccessMsg && (
                    <div className="p-4 bg-[#DFF2E9] border border-[#0B8F6A]/30 text-[#0B8F6A] text-xs font-bold rounded-2xl flex items-center justify-between animate-fade-in shadow-2xs">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4.5 h-4.5 text-[#0B8F6A]" />
                        <span>{timeOffSuccessMsg}</span>
                      </div>
                      <button onClick={() => setTimeOffSuccessMsg(null)} className="text-[#0B8F6A] hover:opacity-70">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* SECTION 1 — UPCOMING TIME OFF */}
                  <div className="bg-white rounded-3xl border border-[#D3E0D9] p-6 sm:p-7 space-y-5 shadow-2xs">
                    <div className="flex items-center justify-between pb-4 border-b border-[#E5EDE7]">
                      <div className="space-y-0.5">
                        <h2 className="text-lg font-extrabold text-[#102C26] font-heading flex items-center space-x-2">
                          <span>Upcoming Time Off</span>
                        </h2>
                        <p className="text-xs text-[#52665F]">Your scheduled absences and approved leave entries</p>
                      </div>
                      <CalendarOff className="w-5 h-5 text-[#D97706]" />
                    </div>

                    {upcomingTimeOff.length === 0 ? (
                      <div className="py-12 text-center space-y-3 bg-[#F4F8F5] rounded-3xl border border-dashed border-[#D3E0D9] p-6">
                        <Palmtree className="w-10 h-10 text-[#AEC5B8] mx-auto" />
                        <div className="space-y-1">
                          <h3 className="text-sm font-extrabold text-[#102C26] font-heading">No upcoming time off</h3>
                          <p className="text-xs text-[#52665F]">You don't have any scheduled absences.</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleOpenRequestTimeOff}
                          className="mt-2 px-4 py-2 bg-[#EEF4F1] hover:bg-[#E2ECE7] text-[#102C26] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          + Request Time Off
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {upcomingTimeOff.map((to) => {
                          const start = new Date(to.startDateTime);
                          const end = new Date(to.endDateTime);
                          const isFullDay =
                            (start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 23 && end.getMinutes() >= 58) ||
                            (start.getHours() === 9 && end.getHours() === 18 && start.getMinutes() === 0 && end.getMinutes() === 0);

                          const dateDisplay = start.toLocaleDateString('en-US', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          });
                          const timeDisplay = isFullDay
                            ? 'Full Day'
                            : `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

                          return (
                            <div
                              key={to.id}
                              className="p-5 bg-[#FFFDF7] rounded-3xl border border-[#FDE68A] hover:border-[#F59E0B] transition-all space-y-4 shadow-2xs relative group"
                            >
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-extrabold text-[#102C26] font-heading">
                                      {dateDisplay}
                                    </span>
                                  </div>
                                  <span className="inline-block px-2.5 py-0.5 bg-[#FEF3C7] text-[#B45309] text-[11px] font-extrabold font-mono rounded-full border border-[#FCD34D]">
                                    {timeDisplay}
                                  </span>
                                </div>
                                <span className="text-[10px] font-extrabold bg-[#DFF2E9] text-[#0B8F6A] px-2.5 py-1 rounded-full border border-[#0B8F6A]/30 uppercase font-mono">
                                  Scheduled
                                </span>
                              </div>

                              <div className="pt-2 border-t border-[#FEF3C7] flex items-center justify-between text-xs">
                                <span className="text-[#52665F] font-medium italic">
                                  {to.reason ? `"${to.reason}"` : 'Personal Leave'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCancelTimeOff(to.id)}
                                  disabled={cancellingTimeOffId === to.id}
                                  className="text-rose-600 hover:text-rose-800 text-xs font-bold transition-colors cursor-pointer hover:underline disabled:opacity-50"
                                >
                                  {cancellingTimeOffId === to.id ? 'Cancelling...' : 'Cancel'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* SECTION 3 — PREVIOUS TIME OFF */}
                  <div className="bg-white rounded-3xl border border-[#D3E0D9] p-6 sm:p-7 space-y-5 shadow-2xs">
                    <div className="flex items-center justify-between pb-4 border-b border-[#E5EDE7]">
                      <div className="space-y-0.5">
                        <h2 className="text-base font-extrabold text-[#102C26] font-heading">
                          Previous Time Off
                        </h2>
                        <p className="text-xs text-[#52665F]">History of past absences and completed leaves</p>
                      </div>
                      <History className="w-4 h-4 text-[#AEC5B8]" />
                    </div>

                    {previousTimeOff.length === 0 ? (
                      <div className="py-8 text-center bg-[#F4F8F5] rounded-2xl border border-dashed border-[#D3E0D9]">
                        <p className="text-xs text-[#52665F]">No previous time off</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {previousTimeOff.map((to) => {
                          const start = new Date(to.startDateTime);
                          const end = new Date(to.endDateTime);
                          const isFullDay =
                            (start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 23 && end.getMinutes() >= 58) ||
                            (start.getHours() === 9 && end.getHours() === 18 && start.getMinutes() === 0 && end.getMinutes() === 0);

                          const dateDisplay = start.toLocaleDateString('en-US', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          });
                          const timeDisplay = isFullDay
                            ? 'Full Day'
                            : `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

                          return (
                            <div
                              key={to.id}
                              className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] flex items-center justify-between text-xs hover:bg-[#F1F5F9] transition-colors"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-8 h-8 rounded-full bg-[#E2E8F0] text-[#64748B] flex items-center justify-center font-bold">
                                  <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-extrabold text-[#334155]">{dateDisplay}</span>
                                    <span className="text-[#64748B] font-mono text-[11px]">• {timeDisplay}</span>
                                  </div>
                                  <p className="text-[11px] text-[#64748B] italic">
                                    {to.reason ? to.reason : 'Personal Leave'}
                                  </p>
                                </div>
                              </div>
                              <span className="px-2.5 py-0.5 bg-[#E2E8F0] text-[#475569] rounded-full text-[10px] font-bold font-mono">
                                Completed
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="space-y-6 animate-fade-in-up">
                  {/* Page Header */}
                  <div className="bg-white rounded-3xl border border-[#D3E0D9] p-6 sm:p-7 shadow-2xs">
                    <div className="space-y-1">
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102C26] font-heading tracking-tight">
                        Profile
                      </h1>
                      <p className="text-xs sm:text-sm text-[#52665F] font-medium">
                        Manage your personal information and staff profile.
                      </p>
                    </div>
                  </div>

                  {/* PROFILE HEADER CARD */}
                  <div className="bg-white rounded-3xl border border-[#D3E0D9] p-6 sm:p-7 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
                      <div className="flex items-center space-x-5">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1D4439] text-white font-extrabold text-2xl sm:text-3xl flex items-center justify-center font-heading border-2 border-[#D3E0D9] shadow-sm">
                          {(profileDisplayName || profileName || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-3">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#102C26] font-heading">
                              {profileDisplayName || profileName || 'Staff Specialist'}
                            </h2>
                            <span className="bg-[#DFF2E9] text-[#0B8F6A] border border-[#0B8F6A]/30 text-[10px] font-extrabold font-mono px-2.5 py-0.5 rounded-full uppercase">
                              Active
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-[#0B8F6A] font-mono flex items-center space-x-2">
                            <span>Senior Specialist</span>
                            <span>•</span>
                            <span className="bg-[#EEF4F1] text-[#1D4439] px-2 py-0.5 rounded-md text-[10px] font-bold">STAFF</span>
                          </p>
                          <p className="text-xs text-[#52665F] font-medium flex items-center space-x-1.5 pt-0.5">
                            <Building2 className="w-3.5 h-3.5 text-[#819B91]" />
                            <span>{business?.name || 'Glow & Style Beauty Studio'}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Banners */}
                  {profileSuccessMsg && (
                    <div className="p-4 bg-[#DFF2E9] border border-[#0B8F6A]/30 text-[#0B8F6A] text-xs font-bold rounded-2xl flex items-center justify-between shadow-2xs animate-fade-in">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4.5 h-4.5 text-[#0B8F6A]" />
                        <span>{profileSuccessMsg}</span>
                      </div>
                      <button onClick={() => setProfileSuccessMsg(null)} className="text-[#0B8F6A] hover:opacity-70">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {profileError && (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center justify-between shadow-2xs animate-fade-in">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4.5 h-4.5 text-rose-600" />
                        <span>{profileError}</span>
                      </div>
                      <button onClick={() => setProfileError(null)} className="text-rose-700 hover:opacity-70">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* PROFILE EDIT FORM */}
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left Column: Editable Information */}
                      <div className="lg:col-span-7 space-y-6">
                        {/* SECTION 1 — PERSONAL INFORMATION */}
                        <div className="bg-white rounded-3xl border border-[#D3E0D9] p-6 sm:p-7 space-y-5 shadow-2xs">
                          <div className="pb-3 border-b border-[#E5EDE7] space-y-0.5">
                            <h3 className="text-base font-extrabold text-[#102C26] font-heading flex items-center space-x-2">
                              <User className="w-4 h-4 text-[#0B8F6A]" />
                              <span>Personal Information</span>
                            </h3>
                            <p className="text-xs text-[#52665F]">Your account identity and contact information</p>
                          </div>

                          <div className="space-y-4 text-xs font-sans">
                            <div>
                              <label className="block text-[11px] font-extrabold text-[#102C26] uppercase font-mono mb-1.5">
                                Full Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={profileName}
                                onChange={(e) => setProfileName(e.target.value)}
                                placeholder="Enter your full name"
                                className="w-full px-4 py-2.5 bg-[#F4F8F5] border border-[#D3E0D9] rounded-2xl text-xs font-bold text-[#102C26] focus:outline-none focus:border-[#1D4439] transition-colors"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-extrabold text-[#102C26] uppercase font-mono mb-1.5">
                                Email Address *
                              </label>
                              <div className="relative">
                                <Mail className="w-4 h-4 text-[#819B91] absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                  type="email"
                                  required
                                  value={profileEmail}
                                  onChange={(e) => setProfileEmail(e.target.value)}
                                  placeholder="name@servicehub.local"
                                  className="w-full pl-10 pr-4 py-2.5 bg-[#F4F8F5] border border-[#D3E0D9] rounded-2xl text-xs font-bold text-[#102C26] focus:outline-none focus:border-[#1D4439] transition-colors"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-extrabold text-[#102C26] uppercase font-mono mb-1.5">
                                Phone Number
                              </label>
                              <div className="relative">
                                <Phone className="w-4 h-4 text-[#819B91] absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  value={profilePhone}
                                  onChange={(e) => setProfilePhone(e.target.value)}
                                  placeholder="+91 98765 43210"
                                  className="w-full pl-10 pr-4 py-2.5 bg-[#F4F8F5] border border-[#D3E0D9] rounded-2xl text-xs font-mono font-bold text-[#102C26] focus:outline-none focus:border-[#1D4439] transition-colors"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* SECTION 2 — STAFF PROFILE */}
                        <div className="bg-white rounded-3xl border border-[#D3E0D9] p-6 sm:p-7 space-y-5 shadow-2xs">
                          <div className="pb-3 border-b border-[#E5EDE7] space-y-0.5">
                            <h3 className="text-base font-extrabold text-[#102C26] font-heading flex items-center space-x-2">
                              <Sparkles className="w-4 h-4 text-[#0B8F6A]" />
                              <span>Staff Profile</span>
                            </h3>
                            <p className="text-xs text-[#52665F]">Your display title and public bio</p>
                          </div>

                          <div className="space-y-4 text-xs font-sans">
                            <div>
                              <label className="block text-[11px] font-extrabold text-[#102C26] uppercase font-mono mb-1.5">
                                Display Name
                              </label>
                              <input
                                type="text"
                                value={profileDisplayName}
                                onChange={(e) => setProfileDisplayName(e.target.value)}
                                placeholder="Public display name for clients"
                                className="w-full px-4 py-2.5 bg-[#F4F8F5] border border-[#D3E0D9] rounded-2xl text-xs font-bold text-[#102C26] focus:outline-none focus:border-[#1D4439] transition-colors"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-[11px] font-extrabold text-[#102C26] uppercase font-mono">
                                  Bio / Description
                                </label>
                                <span className="text-[10px] font-mono text-[#52665F]">
                                  {profileBio.length}/500 chars
                                </span>
                              </div>
                              <textarea
                                rows={4}
                                maxLength={500}
                                value={profileBio}
                                onChange={(e) => setProfileBio(e.target.value)}
                                placeholder="Briefly describe your experience, specialities, or client care philosophy..."
                                className="w-full p-4 bg-[#F4F8F5] border border-[#D3E0D9] rounded-2xl text-xs text-[#102C26] placeholder-[#819B91] focus:outline-none focus:border-[#1D4439] transition-colors leading-relaxed resize-none font-sans"
                              />
                            </div>
                          </div>
                        </div>

                        {/* SECTION 4 — SAVE BUTTON */}
                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={profileSubmitting}
                            className="px-6 py-3.5 bg-[#1D4439] hover:bg-[#15342B] text-white text-xs font-extrabold rounded-2xl transition-colors cursor-pointer shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                          >
                            <Save className="w-4 h-4 text-white" />
                            <span>{profileSubmitting ? 'Saving Changes...' : 'Save Changes'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Right Column: SECTION 3 — ACCOUNT INFORMATION (READ-ONLY) */}
                      <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white rounded-3xl border border-[#D3E0D9] p-6 sm:p-7 space-y-5 shadow-2xs">
                          <div className="pb-3 border-b border-[#E5EDE7] space-y-0.5">
                            <h3 className="text-base font-extrabold text-[#102C26] font-heading flex items-center space-x-2">
                              <Shield className="w-4 h-4 text-[#0B8F6A]" />
                              <span>Account Information</span>
                            </h3>
                            <p className="text-xs text-[#52665F]">System role and business permissions</p>
                          </div>

                          <div className="space-y-4 text-xs font-mono">
                            <div className="p-3.5 bg-[#F4F8F5] rounded-2xl border border-[#D3E0D9] space-y-1">
                              <span className="text-[10px] text-[#819B91] uppercase block font-bold">System Role</span>
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-[#102C26] text-xs">Staff Member</span>
                                <span className="bg-[#EEF4F1] text-[#1D4439] border border-[#D3E0D9] text-[10px] font-bold px-2 py-0.5 rounded-md">
                                  STAFF
                                </span>
                              </div>
                            </div>

                            <div className="p-3.5 bg-[#F4F8F5] rounded-2xl border border-[#D3E0D9] space-y-1">
                              <span className="text-[10px] text-[#819B91] uppercase block font-bold">Business</span>
                              <span className="font-extrabold text-[#102C26] text-xs block">
                                {business?.name || 'Glow & Style Beauty Studio'}
                              </span>
                            </div>

                            <div className="p-3.5 bg-[#F4F8F5] rounded-2xl border border-[#D3E0D9] space-y-1">
                              <span className="text-[10px] text-[#819B91] uppercase block font-bold">Account Status</span>
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-[#102C26] text-xs">Active</span>
                                <span className="bg-[#DFF2E9] text-[#0B8F6A] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#0B8F6A]/30">
                                  VERIFIED
                                </span>
                              </div>
                            </div>

                            <div className="p-3.5 bg-[#F4F8F5] rounded-2xl border border-[#D3E0D9] space-y-1">
                              <span className="text-[10px] text-[#819B91] uppercase block font-bold">Member Since</span>
                              <span className="font-extrabold text-[#102C26] text-xs block">
                                {currentUser?.createdAt
                                  ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: '2-digit',
                                      year: 'numeric',
                                    })
                                  : 'Sep 05, 2026'}
                              </span>
                            </div>
                          </div>

                          <div className="p-4 bg-[#EEF4F1] rounded-2xl border border-[#D3E0D9] text-[11px] text-[#52665F] leading-relaxed">
                            <p className="font-medium">
                              Role permissions, business affiliation, and service capabilities are strictly managed by your business Owner/Admin.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* APPOINTMENT DETAILS MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-[#102C26]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#D3E0D9] shadow-2xl max-w-lg w-full p-6 space-y-6 animate-fade-in-scale">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EDE7]">
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold text-[#52665F] uppercase font-mono tracking-wider">
                  APPOINTMENT DETAILS
                </span>
                <h3 className="text-lg font-extrabold text-[#102C26] font-heading">
                  {selectedBooking.service?.name || 'Service Appointment'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="p-2 rounded-full text-[#52665F] hover:bg-[#EEF5F1] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="p-4 bg-[#F4F8F5] rounded-2xl border border-[#D3E0D9] space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[#52665F] font-medium">Customer:</span>
                  <span className="font-extrabold text-[#102C26]">{selectedBooking.customer?.name || 'Client'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#52665F] font-medium">Service:</span>
                  <span className="font-bold text-[#102C26]">{selectedBooking.service?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#52665F] font-medium">Date & Start Time:</span>
                  <span className="font-mono font-bold text-[#102C26]">
                    {new Date(selectedBooking.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#52665F] font-medium">Duration:</span>
                  <span className="font-mono font-bold text-[#102C26]">{selectedBooking.service?.durationMinutes || 60} mins</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#52665F] font-medium">Payment Status:</span>
                  <span className="text-[10px] font-extrabold bg-[#DFF2E9] text-[#0B8F6A] px-2.5 py-0.5 rounded-full border border-[#0B8F6A]/30 font-mono">
                    {selectedBooking.paymentStatus || 'PAID'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-[#D3E0D9]/60">
                  <span className="text-[#52665F] font-medium">Current Status:</span>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full font-mono bg-[#1D4439] text-white">
                    {selectedBooking.status}
                  </span>
                </div>
              </div>

              {selectedBooking.notes && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider font-mono">Special Client Instructions</span>
                  <p className="text-amber-900 font-sans italic">"{selectedBooking.notes}"</p>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-[#E5EDE7]">
                <label className="text-xs font-bold text-[#102C26] uppercase font-mono block mb-1">
                  Available Actions
                </label>

                {selectedBooking.status === 'PENDING' && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'CONFIRMED')}
                      className="py-2.5 px-4 bg-[#DFF2E9] hover:bg-[#CCEADF] text-[#0B8F6A] rounded-xl font-bold border border-[#0B8F6A]/30 text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Booking</span>
                    </button>
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'CANCELLED')}
                      className="py-2.5 px-4 bg-[#FFE4E6] hover:bg-[#FECDD3] text-[#E11D48] rounded-xl font-bold border border-[#F43F5E]/30 text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel Booking</span>
                    </button>
                  </div>
                )}

                {selectedBooking.status === 'CONFIRMED' && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'IN_PROGRESS')}
                      className="py-2.5 px-4 bg-[#E0EDFF] hover:bg-[#CBDDF9] text-[#2563EB] rounded-xl font-bold border border-[#2563EB]/30 text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Start Appointment</span>
                    </button>
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'CANCELLED')}
                      className="py-2.5 px-4 bg-[#FFE4E6] hover:bg-[#FECDD3] text-[#E11D48] rounded-xl font-bold border border-[#F43F5E]/30 text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel Booking</span>
                    </button>
                  </div>
                )}

                {selectedBooking.status === 'IN_PROGRESS' && (
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'COMPLETED')}
                    className="w-full py-2.5 px-4 bg-[#DFF2E9] hover:bg-[#CCEADF] text-[#0B8F6A] rounded-xl font-bold border border-[#0B8F6A]/30 text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Completed</span>
                  </button>
                )}

                {selectedBooking.status === 'COMPLETED' && (
                  <div className="p-3 bg-[#DFF2E9]/70 border border-[#0B8F6A]/30 rounded-xl text-center text-xs font-bold text-[#0B8F6A] flex items-center justify-center space-x-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#0B8F6A]" />
                    <span>✓ Appointment Completed</span>
                  </div>
                )}

                {selectedBooking.status === 'CANCELLED' && (
                  <div className="p-3 bg-[#FFE4E6]/70 border border-[#F43F5E]/30 rounded-xl text-center text-xs font-bold text-[#E11D48] flex items-center justify-center space-x-2">
                    <X className="w-4.5 h-4.5 text-[#E11D48]" />
                    <span>Booking Cancelled</span>
                  </div>
                )}

                {selectedBooking.status === 'NO_SHOW' && (
                  <div className="p-3 bg-[#FEE2E2]/70 border border-[#991B1B]/30 rounded-xl text-center text-xs font-bold text-[#991B1B] flex items-center justify-center space-x-2">
                    <AlertCircle className="w-4.5 h-4.5 text-[#991B1B]" />
                    <span>Customer marked as no-show</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5EDE7] text-right">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2.5 bg-[#F4F8F5] text-[#102C26] rounded-full text-xs font-bold hover:bg-[#E5EDE7] transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
      {/* BREAK MANAGEMENT MODAL */}
      {breakModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#102C26]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#D3E0D9] shadow-2xl max-w-md w-full p-6 space-y-5 animate-fade-in-scale">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EDE7]">
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold text-[#52665F] uppercase font-mono tracking-wider">
                  STAFF SCHEDULING
                </span>
                <h3 className="text-lg font-extrabold text-[#102C26] font-heading">
                  {editingBreak ? 'Edit Recurring Break' : 'Add Recurring Break'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBreakModalOpen(false)}
                className="p-2 rounded-full text-[#52665F] hover:bg-[#EEF5F1] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {breakError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{breakError}</span>
              </div>
            )}

            <form onSubmit={handleSaveBreak} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-bold text-[#102C26]">Day of Week</label>
                <select
                  value={breakDayOfWeek}
                  onChange={(e) => setBreakDayOfWeek(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#F4F8F5] border border-[#D3E0D9] rounded-xl font-mono text-[#102C26] focus:outline-none focus:border-[#1D4439]"
                >
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                  <option value={0}>Sunday</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#102C26]">Start Time (HH:MM)</label>
                  <input
                    type="text"
                    value={breakStartTime}
                    onChange={(e) => setBreakStartTime(e.target.value)}
                    placeholder="13:00"
                    className="w-full px-3.5 py-2.5 bg-[#F4F8F5] border border-[#D3E0D9] rounded-xl font-mono text-[#102C26] focus:outline-none focus:border-[#1D4439]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#102C26]">End Time (HH:MM)</label>
                  <input
                    type="text"
                    value={breakEndTime}
                    onChange={(e) => setBreakEndTime(e.target.value)}
                    placeholder="14:00"
                    className="w-full px-3.5 py-2.5 bg-[#F4F8F5] border border-[#D3E0D9] rounded-xl font-mono text-[#102C26] focus:outline-none focus:border-[#1D4439]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#102C26]">Label / Reason</label>
                <input
                  type="text"
                  value={breakLabel}
                  onChange={(e) => setBreakLabel(e.target.value)}
                  placeholder="e.g. Lunch, Tea Break"
                  className="w-full px-3.5 py-2.5 bg-[#F4F8F5] border border-[#D3E0D9] rounded-xl text-[#102C26] focus:outline-none focus:border-[#1D4439]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3 border-t border-[#E5EDE7]">
                <button
                  type="button"
                  onClick={() => setBreakModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={breakSubmitting}
                  className="px-5 py-2 bg-[#1D4439] hover:bg-[#15342B] text-white font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
                >
                  {breakSubmitting ? 'Saving...' : 'Save Break'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CLIENT DETAILS DRAWER / MODAL */}
      {selectedClientDetail && (
        <div className="fixed inset-0 z-50 bg-[#102C26]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#D3E0D9] shadow-2xl max-w-lg w-full p-6 space-y-5 animate-fade-in-scale max-h-[90vh] overflow-y-auto">
            {/* 1. CLIENT HEADER */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EDE7]">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-[#1D4439] text-white font-bold text-lg flex items-center justify-center font-heading">
                  {selectedClientDetail.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#102C26] font-heading">
                    {selectedClientDetail.name}
                  </h3>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="text-[10px] font-extrabold bg-[#DFF2E9] text-[#0B8F6A] px-2.5 py-0.5 rounded-full border border-[#0B8F6A]/30 uppercase font-mono">
                      Appts: {selectedClientDetail.appointmentsCount ?? (selectedClientDetail.bookings || []).length}
                    </span>
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300 uppercase font-mono">
                      Visits: {selectedClientDetail.visitsCount ?? 0}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase font-mono ${
                      selectedClientDetail.isReturning
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      Returning: {selectedClientDetail.isReturning ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClientDetail(null)}
                className="p-2 rounded-full text-[#52665F] hover:bg-[#EEF5F1] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              {/* 2. CONTACT */}
              <div className="p-4 bg-[#F4F8F5] rounded-2xl border border-[#D3E0D9] space-y-2.5">
                <h4 className="font-extrabold text-[#102C26] uppercase font-mono text-[11px] tracking-wider">
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#52665F] text-[11px] block">Phone</span>
                    <strong className="text-[#102C26] font-mono">{selectedClientDetail.phone || 'Not provided'}</strong>
                  </div>
                  <div>
                    <span className="text-[#52665F] text-[11px] block">Email</span>
                    <strong className="text-[#102C26] font-mono">{selectedClientDetail.email || 'Not provided'}</strong>
                  </div>
                  {selectedClientDetail.address && (
                    <div className="sm:col-span-2">
                      <span className="text-[#52665F] text-[11px] block">Address</span>
                      <strong className="text-[#102C26]">{selectedClientDetail.address}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. NEXT APPOINTMENT */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-[#102C26] uppercase font-mono text-[11px] tracking-wider">
                  Next Appointment
                </h4>
                {selectedClientDetail.nextBookingObj ? (
                  <div className="p-4 bg-[#DFF2E9]/70 border border-[#0B8F6A]/30 rounded-2xl space-y-2 font-mono">
                    <div className="flex items-center justify-between font-bold text-[#0B8F6A]">
                      <span className="font-sans font-extrabold">{selectedClientDetail.nextBookingObj.service?.name}</span>
                      <span className="text-[10px] bg-white px-2.5 py-0.5 rounded-full border border-[#0B8F6A]/20">
                        {selectedClientDetail.nextBookingObj.status}
                      </span>
                    </div>
                    <div className="text-xs text-[#102C26]">
                      <span>{new Date(selectedClientDetail.nextBookingObj.startTime).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(selectedClientDetail.nextBookingObj.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-[#52665F] block text-[11px]">Duration: {selectedClientDetail.nextBookingObj.service?.durationMinutes || 60} mins</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-[#F4F8F5] rounded-2xl border border-[#D3E0D9] text-[#52665F] text-center font-medium">
                    No upcoming appointments
                  </div>
                )}
              </div>

              {/* 4. APPOINTMENT NOTES */}
              {selectedClientDetail.nextBookingObj?.notes && (
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-[#102C26] uppercase font-mono text-[11px] tracking-wider">
                    Appointment Notes
                  </h4>
                  <div className="p-3.5 bg-[#FEF3C7]/40 border border-[#F59E0B]/30 rounded-2xl text-xs text-[#92400E]">
                    <Quote className="w-3.5 h-3.5 text-[#D97706] mb-1 inline mr-1.5" />
                    <span>{selectedClientDetail.nextBookingObj.notes}</span>
                  </div>
                </div>
              )}

              {/* 5. RECENT APPOINTMENT CONTEXT (SINGLE RECENT APPOINTMENT ONLY) */}
              {selectedClientDetail.recentBookingObj && (
                <div className="space-y-2">
                  <h4 className="font-extrabold text-[#102C26] uppercase font-mono text-[11px] tracking-wider">
                    Recent Appointment
                  </h4>
                  <div className="p-3.5 bg-white rounded-2xl border border-[#D3E0D9] flex items-center justify-between text-xs font-mono">
                    <div className="space-y-0.5">
                      <span className="font-sans font-bold text-[#102C26] block">
                        {selectedClientDetail.recentBookingObj.service?.name}
                      </span>
                      <span className="text-[11px] text-[#52665F]">
                        {new Date(selectedClientDetail.recentBookingObj.startTime).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date(selectedClientDetail.recentBookingObj.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#EEF4F1] text-[#1D4439] border border-[#D3E0D9]">
                      {selectedClientDetail.recentBookingObj.status}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#E5EDE7] text-right">
              <button
                type="button"
                onClick={() => setSelectedClientDetail(null)}
                className="px-5 py-2.5 bg-[#F4F8F5] text-[#102C26] rounded-full text-xs font-bold hover:bg-[#E5EDE7] transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2 — REQUEST TIME OFF MODAL */}
      {timeOffModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#102C26]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#D3E0D9] shadow-2xl max-w-md w-full p-6 space-y-6 animate-fade-in-scale">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EDE7]">
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold text-[#D97706] uppercase font-mono tracking-wider">
                  STAFF AVAILABILITY
                </span>
                <h3 className="text-lg font-extrabold text-[#102C26] font-heading">
                  Request Time Off
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTimeOffModalOpen(false)}
                className="text-[#819B91] hover:text-[#102C26] p-1 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {timeOffError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium">
                {timeOffError}
              </div>
            )}

            <form onSubmit={handleSaveTimeOff} className="space-y-4 text-xs">
              {/* Date Field */}
              <div>
                <label className="block text-[11px] font-extrabold text-[#102C26] uppercase font-mono mb-1.5">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={timeOffDate}
                  onChange={(e) => setTimeOffDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F4F8F5] border border-[#D3E0D9] rounded-2xl text-xs font-bold text-[#102C26] focus:outline-none focus:border-[#1D4439]"
                />
              </div>

              {/* Full Day Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-[#F4F8F5] rounded-2xl border border-[#D3E0D9]">
                <div>
                  <span className="font-extrabold text-[#102C26] block">Full Day Absence</span>
                  <span className="text-[10px] text-[#52665F]">Entire working day unavailable</span>
                </div>
                <input
                  type="checkbox"
                  checked={timeOffFullDay}
                  onChange={(e) => setTimeOffFullDay(e.target.checked)}
                  className="w-4 h-4 accent-[#1D4439] cursor-pointer"
                />
              </div>

              {/* Start & End Time (Hidden if Full Day) */}
              {!timeOffFullDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-[#102C26] uppercase font-mono mb-1.5">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      required={!timeOffFullDay}
                      value={timeOffStartTime}
                      onChange={(e) => setTimeOffStartTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F4F8F5] border border-[#D3E0D9] rounded-2xl text-xs font-bold text-[#102C26] focus:outline-none focus:border-[#1D4439]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-[#102C26] uppercase font-mono mb-1.5">
                      End Time *
                    </label>
                    <input
                      type="time"
                      required={!timeOffFullDay}
                      value={timeOffEndTime}
                      onChange={(e) => setTimeOffEndTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F4F8F5] border border-[#D3E0D9] rounded-2xl text-xs font-bold text-[#102C26] focus:outline-none focus:border-[#1D4439]"
                    />
                  </div>
                </div>
              )}

              {/* Reason Field */}
              <div>
                <label className="block text-[11px] font-extrabold text-[#102C26] uppercase font-mono mb-1.5">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Personal Leave, Doctor Appointment"
                  value={timeOffReason}
                  onChange={(e) => setTimeOffReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F4F8F5] border border-[#D3E0D9] rounded-2xl text-xs text-[#102C26] placeholder-[#819B91] focus:outline-none focus:border-[#1D4439]"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E5EDE7]">
                <button
                  type="button"
                  onClick={() => setTimeOffModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-[#52665F] hover:text-[#102C26] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={timeOffSubmitting}
                  className="px-5 py-2.5 bg-[#1D4439] hover:bg-[#15342B] text-white text-xs font-extrabold rounded-2xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {timeOffSubmitting ? 'Submitting...' : 'Request Time Off'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
