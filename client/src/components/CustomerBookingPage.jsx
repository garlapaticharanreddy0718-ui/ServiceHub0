import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest } from '../services/api';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  UserCheck,
  Check,
  AlertCircle,
  Building2,
  ShieldCheck,
  Sparkles,
  Sun,
  SunMedium,
  Moon,
  Info,
  CheckCircle2,
  Star,
  User,
  MapPin
} from 'lucide-react';
import LoadingState from './ui/LoadingState';
import { formatLocalDateISO, toLocalISOStringWithOffset } from '../utils/dateUtils';

const SERVICE_PLACEHOLDER_IMAGES = {
  'Beauty & Salon': '/images/businesses/glow_style_beauty_studio.jpg',
  'Fitness': '/images/businesses/fitzone_fitness_center.jpg',
  'Home Services': '/images/businesses/quickfix_home_services.jpg',
  default: '/images/businesses/glow_style_beauty_studio.jpg'
};

export default function CustomerBookingPage({
  business,
  service,
  currentUser,
  onBack,
  onTabChange,
  onBookingSuccess,
}) {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => formatLocalDateISO(new Date()));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [notes, setNotes] = useState('');

  const [loadingStaff, setLoadingStaff] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [groupedTimeSlots, setGroupedTimeSlots] = useState({ morning: [], afternoon: [], evening: [] });
  const [availabilityError, setAvailabilityError] = useState(null);

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [confirmedBookingData, setConfirmedBookingData] = useState(null);
  const availabilityReqIdRef = useRef(0);

  // 1. Fetch eligible staff for the service
  const loadEligibleStaff = useCallback(async () => {
    if (!business?.id || !service?.id) return;
    setLoadingStaff(true);
    try {
      const response = await apiRequest(`/businesses/${business.id}/staff`);
      const data = await response.json();

      if (response.ok) {
        const allStaff = data.data || [];
        const eligible = allStaff.filter((st) => {
          if (!st || !st.staffServices || st.staffServices.length === 0) return true;
          return st.staffServices.some((ss) => ss && ss.serviceId === service.id);
        });

        const finalStaff = eligible.length > 0 ? eligible : allStaff;
        setStaffList(finalStaff);

        if (finalStaff.length > 0) {
          const defaultStaff = finalStaff[0];
          setSelectedStaffId(defaultStaff.id);
          fetchAvailability(business.id, defaultStaff.id, service.id, selectedDate, service.durationMinutes);
        }
      }
    } catch (err) {
      console.error('Failed to load eligible staff:', err);
    } finally {
      setLoadingStaff(false);
    }
  }, [business?.id, service?.id]);

  useEffect(() => {
    loadEligibleStaff();
  }, [loadEligibleStaff]);

  // 2. Fetch Availability according to business logic & schedule
  const fetchAvailability = async (bizId, staffId, serviceId, dateStr, durationMins) => {
    if (!bizId || !staffId || !serviceId || !dateStr) return;

    const requestId = ++availabilityReqIdRef.current;

    setAvailabilityLoading(true);
    setAvailabilityError(null);
    setGroupedTimeSlots({ morning: [], afternoon: [], evening: [] });
    setSelectedTimeSlot('');

    const now = new Date();
    const todayISO = formatLocalDateISO(now);
    const tzOffset = now.getTimezoneOffset();

    // Past date check
    if (dateStr < todayISO) {
      setAvailabilityError('Bookings are not available for past dates.');
      setAvailabilityLoading(false);
      return;
    }

    try {
      const response = await apiRequest(
        `/businesses/${bizId}/availability?staffId=${staffId}&serviceId=${serviceId}&date=${dateStr}&tzOffset=${tzOffset}`
      );
      const resData = await response.json();

      if (requestId !== availabilityReqIdRef.current) return;

      if (!response.ok) {
        throw new Error(resData.message || 'Failed to fetch backend availability');
      }

      const { schedule, timeOff, breaks, bookings, isPastDate, slots: serverSlots } = resData.data;

      if (isPastDate) {
        setAvailabilityError('Bookings are not available for past dates.');
        return;
      }

      if (!schedule || !schedule.isAvailable) {
        setAvailabilityError('Staff member is not scheduled to work on this date.');
        return;
      }

      const [yStr, mStr, dStr] = dateStr.split('-').map(Number);
      const morning = [];
      const afternoon = [];
      const evening = [];

      if (Array.isArray(serverSlots)) {
        serverSlots.forEach((slot) => {
          const [hh, mm] = slot.value.split(':').map(Number);
          const slotDate = new Date(yStr, mStr - 1, dStr, hh, mm, 0, 0);
          const displayTime = slotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
          const slotObj = { display: displayTime, value: slot.value, isoStart: slot.isoStart };

          if (hh < 12) {
            morning.push(slotObj);
          } else if (hh >= 12 && hh < 17) {
            afternoon.push(slotObj);
          } else {
            evening.push(slotObj);
          }
        });
      } else {
        const [startH, startM] = schedule.startTime.split(':').map(Number);
        const [endH, endM] = schedule.endTime.split(':').map(Number);

        const dayStart = new Date(yStr, mStr - 1, dStr, startH, startM, 0, 0);
        const dayEnd = new Date(yStr, mStr - 1, dStr, endH, endM, 0, 0);
        const slotDurationMs = (durationMins || 30) * 60 * 1000;

        let current = new Date(dayStart);

        while (current.getTime() + slotDurationMs <= dayEnd.getTime()) {
          const slotEnd = new Date(current.getTime() + slotDurationMs);

          // 1. PAST TIME SLOT CHECK:
          if (dateStr <= todayISO && current.getTime() <= now.getTime()) {
            current = new Date(current.getTime() + 30 * 60 * 1000);
            continue;
          }

          // 2. TIME OFF CONFLICT CHECK
          const isTimeOffConflict = (timeOff || []).some((to) => {
            const toStart = new Date(to.startDateTime);
            const toEnd = new Date(to.endDateTime);
            return current < toEnd && slotEnd > toStart;
          });

          // 3. BREAK CONFLICT CHECK
          const isBreakConflict = (breaks || []).some((br) => {
            const [bStartH, bStartM] = br.startTime.split(':').map(Number);
            const [bEndH, bEndM] = br.endTime.split(':').map(Number);
            const brStart = new Date(yStr, mStr - 1, dStr, bStartH, bStartM, 0, 0);
            const brEnd = new Date(yStr, mStr - 1, dStr, bEndH, bEndM, 0, 0);
            return current < brEnd && slotEnd > brStart;
          });

          // 4. BOOKING CONFLICT CHECK (active bookings: PENDING, CONFIRMED, IN_PROGRESS)
          const isBookingConflict = (bookings || []).some((b) => {
            if (b.status && !['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)) return false;
            const bStart = new Date(b.startTime);
            const bEnd = new Date(b.endTime);
            return current < bEnd && slotEnd > bStart;
          });

          if (!isTimeOffConflict && !isBreakConflict && !isBookingConflict) {
            const hour = current.getHours();
            const displayTime = current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            const rawHHMM = `${String(hour).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}`;

            const slotObj = { display: displayTime, value: rawHHMM, isoStart: current.toISOString() };

            if (hour < 12) {
              morning.push(slotObj);
            } else if (hour >= 12 && hour < 17) {
              afternoon.push(slotObj);
            } else {
              evening.push(slotObj);
            }
          }

          current = new Date(current.getTime() + 30 * 60 * 1000);
        }
      }

      setGroupedTimeSlots({ morning, afternoon, evening });

      const allAvailable = [...morning, ...afternoon, ...evening];
      if (allAvailable.length > 0) {
        setSelectedTimeSlot(allAvailable[0].value);
      } else {
        if (dateStr === todayISO) {
          setAvailabilityError('No more appointments available today.');
        } else {
          setAvailabilityError('No open time slots available for the selected date.');
        }
      }
    } catch (err) {
      if (requestId !== availabilityReqIdRef.current) return;
      console.error('Availability calculation failed:', err);
      setAvailabilityError(err.message || 'Unable to load available time slots.');
    } finally {
      if (requestId === availabilityReqIdRef.current) {
        setAvailabilityLoading(false);
      }
    }
  };

  const handleStaffSelect = (staffId) => {
    setBookingError(null);
    setSelectedStaffId(staffId);
    if (business && service && staffId && selectedDate) {
      fetchAvailability(business.id, staffId, service.id, selectedDate, service.durationMinutes);
    }
  };

  const handleDateChange = (newDateStr) => {
    setBookingError(null);
    setSelectedDate(newDateStr);
    if (business && service && selectedStaffId && newDateStr) {
      fetchAvailability(business.id, selectedStaffId, service.id, newDateStr, service.durationMinutes);
    }
  };

  // 3. Confirm Reservation Handler
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!business || !service || !selectedStaffId || !selectedDate || !selectedTimeSlot) {
      setBookingError('Please select a staff specialist, date, and valid time slot to continue.');
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      let customerId = undefined;
      try {
        const custRes = await apiRequest(`/businesses/${business.id}/customers`);
        if (custRes.ok) {
          const custData = await custRes.json();
          const matchedCust = (custData.data || []).find(
            (c) => c.userId === currentUser?.id || c.email === currentUser?.email
          );
          if (matchedCust) {
            customerId = matchedCust.id;
          }
        }
      } catch (e) {}

      const startTimeISO = toLocalISOStringWithOffset(selectedDate, selectedTimeSlot);

      const bookingRes = await apiRequest(`/businesses/${business.id}/bookings`, {
        method: 'POST',
        body: JSON.stringify({
          customerId,
          serviceId: service.id,
          staffId: selectedStaffId,
          startTime: startTimeISO,
          timezoneOffset: new Date().getTimezoneOffset(),
          notes: notes || undefined,
        }),
      });

      const resData = await bookingRes.json();

      if (!bookingRes.ok) {
        if (resData.message?.toLowerCase().includes('already booked') || resData.message?.toLowerCase().includes('conflict') || bookingRes.status === 409) {
          throw new Error('That time slot is no longer available. Please select another time slot.');
        }
        throw new Error(resData.message || 'Failed to confirm booking.');
      }

      // Successful Booking State
      const staffObj = staffList.find((s) => s.id === selectedStaffId);
      const allSlots = [...groupedTimeSlots.morning, ...groupedTimeSlots.afternoon, ...groupedTimeSlots.evening];
      const foundSlot = allSlots.find((s) => s.value === selectedTimeSlot);
      const displayTimeStr = foundSlot ? foundSlot.display : selectedTimeSlot;

      const formattedDateStr = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });

      setConfirmedBookingData({
        business,
        service,
        staff: staffObj,
        date: formattedDateStr,
        time: displayTimeStr,
      });

      if (onBookingSuccess) {
        onBookingSuccess(`Appointment reserved for ${service.name} on ${formattedDateStr} at ${displayTimeStr}!`);
      }
    } catch (err) {
      if (err.message?.includes('already booked') || err.message?.includes('conflict') || err.message?.includes('409')) {
        setBookingError('That time slot is no longer available.');
      } else {
        setBookingError(err.message || 'Failed to submit booking reservation.');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const selectedStaffObj = staffList.find((s) => s.id === selectedStaffId);
  const allSlotsList = [...groupedTimeSlots.morning, ...groupedTimeSlots.afternoon, ...groupedTimeSlots.evening];
  const matchedTimeSlot = allSlotsList.find((s) => s.value === selectedTimeSlot);
  const displaySelectedTime = matchedTimeSlot ? matchedTimeSlot.display : selectedTimeSlot;

  const formattedSummaryDate = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      })
    : '';

  const generateUpcomingDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = formatLocalDateISO(d);
      const dayName = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dates.push({ iso, dayName, monthDay });
    }
    return dates;
  };

  const upcomingDates = generateUpcomingDates();

  const getBusinessCatName = (c) => {
    if (!c) return 'Beauty & Salon';
    if (typeof c === 'string') return c;
    if (typeof c === 'object') return c.name || 'Beauty & Salon';
    return String(c);
  };

  const heroImageSrc =
    service?.imageUrl ||
    SERVICE_PLACEHOLDER_IMAGES[getBusinessCatName(business?.category)] ||
    SERVICE_PLACEHOLDER_IMAGES.default;

  // ==================================================
  // POLISHED CONFIRMATION SUCCESS STATE
  // ==================================================
  if (confirmedBookingData) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up py-4">
        <div className="bg-white rounded-3xl border border-[#D3E0D9] p-8 sm:p-10 shadow-2xs space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#EAEFEA] border border-[#D3E0D9] text-[#1D4439] flex items-center justify-center mx-auto shadow-2xs">
            <CheckCircle2 className="w-9 h-9 text-[#1D4439]" />
          </div>

          <div>
            <span className="text-xs font-bold text-[#1D4439] uppercase tracking-wider bg-[#EAEFEA] px-3.5 py-1 rounded-full border border-[#D3E0D9] font-mono">
              Reservation Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#112C24] font-heading mt-3">
              Booking Confirmed
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Your appointment has been reserved and synced with the business schedule.
            </p>
          </div>

          {/* CONFIRMATION SUMMARY CARD */}
          <div className="bg-[#F4F7F5] rounded-2xl border border-[#D3E0D9] p-6 text-left space-y-4 font-sans text-xs">
            <div className="border-b border-[#D3E0D9] pb-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Business</span>
                <p className="font-extrabold text-[#112C24] text-base">{confirmedBookingData.business?.name}</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-[#D3E0D9] text-[11px] font-extrabold text-[#1D4439]">
                ✓ Confirmed
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Service</span>
                <p className="font-extrabold text-[#112C24] text-sm mt-0.5">{confirmedBookingData.service?.name}</p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Staff Specialist</span>
                <p className="font-extrabold text-[#1D4439] text-sm mt-0.5">
                  {confirmedBookingData.staff?.displayName || 'Any Available Specialist'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#D3E0D9]/70">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Date</span>
                <p className="font-bold text-slate-800 mt-0.5">{confirmedBookingData.date}</p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Time</span>
                <p className="font-bold text-slate-800 mt-0.5">{confirmedBookingData.time}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#D3E0D9]/70 font-mono">
              <span className="text-xs text-slate-600">
                Duration: <strong>{confirmedBookingData.service?.durationMinutes || 30} mins</strong>
              </span>
              <span className="text-base font-extrabold text-[#1D4439]">
                ₹{Number(confirmedBookingData.service?.price || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* NAVIGATION BUTTONS */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                if (onTabChange) onTabChange('my-bookings');
                else if (onBookingSuccess) onBookingSuccess('');
              }}
              className="w-full sm:w-auto bg-[#1D4439] hover:bg-[#143229] text-white font-bold px-6 py-3 rounded-xl text-xs transition-all shadow-2xs cursor-pointer flex items-center justify-center space-x-2"
            >
              <CalendarIcon className="w-4 h-4 text-emerald-300" />
              <span>View My Appointments</span>
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto bg-white hover:bg-slate-50 text-[#112C24] border border-[#D3E0D9] font-bold px-6 py-3 rounded-xl text-xs transition-all shadow-2xs cursor-pointer"
            >
              <span>Back to Discover</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================================================
  // MAIN BOOKING FORM VIEW
  // ==================================================
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. PAGE HEADER */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs font-bold text-[#112C24] bg-white hover:bg-slate-50 px-4 py-2.5 rounded-xl border border-[#D3E0D9] shadow-2xs transition-all mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#112C24]" />
          <span>← Back to {business?.name || 'Discover'}</span>
        </button>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#112C24] font-heading tracking-tight">
          Book Your Appointment
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-sans">
          Select your preferred specialist, date, and available time slot.
        </p>
      </div>

      {/* 2. SERVICE HERO CARD */}
      <div className="bg-white rounded-3xl border border-[#D3E0D9] shadow-2xs p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 w-full md:w-auto">
          <img
            src={heroImageSrc}
            alt={service?.name || 'Service'}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover flex-shrink-0 bg-slate-100 border border-[#D3E0D9] shadow-2xs"
          />
          <div className="space-y-1.5 text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1D4439] font-mono bg-[#EAEFEA] px-3 py-1 rounded-full border border-[#D3E0D9]">
              {getBusinessCatName(business?.category).toUpperCase()}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#112C24] font-heading tracking-tight">
              {service?.name}
            </h2>
            {service?.description && (
              <p className="text-xs text-slate-600 max-w-xl leading-relaxed font-sans">
                {service.description}
              </p>
            )}
          </div>
        </div>

        <div className="bg-[#F4F7F5] border border-[#D3E0D9] px-6 py-4 rounded-2xl text-center md:text-right flex flex-col items-center md:items-end flex-shrink-0 min-w-[170px] w-full md:w-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Service Price</span>
          <span className="text-2xl font-extrabold text-[#1D4439] font-mono mt-0.5">
            ₹{Number(service?.price || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-xs font-semibold text-slate-600 flex items-center space-x-1 mt-1 font-mono">
            <Clock className="w-3.5 h-3.5 text-[#1D4439]" />
            <span>{service?.durationMinutes || 30} minutes</span>
          </span>
        </div>
      </div>

      {bookingError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center space-x-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{bookingError}</span>
        </div>
      )}

      {/* 3. MAIN TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Booking Steps */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1 — SELECT YOUR SPECIALIST */}
          <div className="bg-white p-6 rounded-3xl border border-[#D3E0D9] shadow-2xs space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-lg bg-[#1D4439] text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                    1
                  </span>
                  <h2 className="text-base font-extrabold text-[#112C24] font-heading tracking-tight">
                    Select Your Specialist
                  </h2>
                </div>
                <span className="text-xs font-mono font-semibold text-[#1D4439] bg-[#EAEFEA] px-2.5 py-1 rounded-md border border-[#D3E0D9]">
                  {staffList.length} Qualified
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 pl-10 font-sans">
                Choose from our qualified team members
              </p>
            </div>

            {loadingStaff ? (
              <LoadingState message="Loading staff specialists..." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {staffList.map((st) => {
                  const isSelected = selectedStaffId === st.id;
                  const initial = st.displayName ? st.displayName.charAt(0).toUpperCase() : 'S';

                  return (
                    <div
                      key={st.id}
                      onClick={() => handleStaffSelect(st.id)}
                      className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 hover:-translate-y-0.5 ${
                        isSelected
                          ? 'bg-[#EAEFEA] border-[#1D4439] ring-2 ring-[#1D4439]/30 shadow-xs'
                          : 'bg-white border-[#D3E0D9] hover:border-[#1D4439]/50 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-full bg-[#1D4439] text-white font-extrabold text-sm flex items-center justify-center shadow-xs flex-shrink-0">
                          {initial}
                        </div>
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-extrabold text-[#112C24] text-sm truncate font-heading">
                              {st.displayName}
                            </h3>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                                isSelected ? 'border-[#1D4439] bg-[#1D4439]' : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 font-sans font-medium">Specialist</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* STEP 2 — SELECT DATE */}
          <div className="bg-white p-6 rounded-3xl border border-[#D3E0D9] shadow-2xs space-y-5">
            <div>
              <div className="flex items-center space-x-3">
                <span className="w-7 h-7 rounded-lg bg-[#1D4439] text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                  2
                </span>
                <h2 className="text-base font-extrabold text-[#112C24] font-heading tracking-tight">
                  Select Date
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {upcomingDates.map((item) => {
                const isSelected = selectedDate === item.iso;
                return (
                  <button
                    key={item.iso}
                    type="button"
                    onClick={() => handleDateChange(item.iso)}
                    className={`p-3 rounded-2xl border text-center transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#1D4439] text-white border-[#1D4439] shadow-2xs ring-2 ring-[#1D4439]/30'
                        : 'bg-[#F4F7F5] border-[#D3E0D9] text-[#112C24] hover:bg-white hover:border-[#1D4439]/50'
                    }`}
                  >
                    <span className="block text-[11px] font-bold uppercase tracking-wider opacity-80 font-mono">
                      {item.dayName}
                    </span>
                    <span className="block text-xs font-extrabold mt-0.5 font-mono">
                      {item.monthDay}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3 — SELECT TIME */}
          <div className="bg-white p-6 rounded-3xl border border-[#D3E0D9] shadow-2xs space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-lg bg-[#1D4439] text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                    3
                  </span>
                  <h2 className="text-base font-extrabold text-[#112C24] font-heading tracking-tight">
                    Select Available Time
                  </h2>
                </div>
              </div>
            </div>

            {availabilityLoading ? (
              <div className="py-8 text-center text-xs text-slate-500 font-mono flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-[#1D4439] border-t-transparent rounded-full animate-spin"></div>
                <span>Checking real-time schedule availability...</span>
              </div>
            ) : availabilityError ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center space-x-2.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{availabilityError}</span>
              </div>
            ) : (
              <div className="space-y-6 pt-1">
                {groupedTimeSlots.morning.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#1D4439] uppercase tracking-wider font-mono">
                      <Sun className="w-4 h-4 text-amber-600" />
                      <span>Morning Slots</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                      {groupedTimeSlots.morning.map((slot) => {
                        const isSelected = selectedTimeSlot === slot.value;
                        return (
                          <button
                            key={slot.isoStart}
                            type="button"
                            onClick={() => {
                              setBookingError(null);
                              setSelectedTimeSlot(slot.value);
                            }}
                            className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
                              isSelected
                                ? 'bg-[#1D4439] text-white border-[#1D4439] shadow-2xs ring-2 ring-[#1D4439]/30'
                                : 'bg-white text-slate-700 border-[#D3E0D9] hover:border-[#1D4439]/50 hover:bg-[#F4F7F5]'
                            }`}
                          >
                            {slot.display}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {groupedTimeSlots.afternoon.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#1D4439] uppercase tracking-wider font-mono">
                      <SunMedium className="w-4 h-4 text-amber-600" />
                      <span>Afternoon Slots</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                      {groupedTimeSlots.afternoon.map((slot) => {
                        const isSelected = selectedTimeSlot === slot.value;
                        return (
                          <button
                            key={slot.isoStart}
                            type="button"
                            onClick={() => {
                              setBookingError(null);
                              setSelectedTimeSlot(slot.value);
                            }}
                            className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
                              isSelected
                                ? 'bg-[#1D4439] text-white border-[#1D4439] shadow-2xs ring-2 ring-[#1D4439]/30'
                                : 'bg-white text-slate-700 border-[#D3E0D9] hover:border-[#1D4439]/50 hover:bg-[#F4F7F5]'
                            }`}
                          >
                            {slot.display}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {groupedTimeSlots.evening.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#1D4439] uppercase tracking-wider font-mono">
                      <Moon className="w-4 h-4 text-indigo-700" />
                      <span>Evening Slots</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                      {groupedTimeSlots.evening.map((slot) => {
                        const isSelected = selectedTimeSlot === slot.value;
                        return (
                          <button
                            key={slot.isoStart}
                            type="button"
                            onClick={() => {
                              setBookingError(null);
                              setSelectedTimeSlot(slot.value);
                            }}
                            className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
                              isSelected
                                ? 'bg-[#1D4439] text-white border-[#1D4439] shadow-2xs ring-2 ring-[#1D4439]/30'
                                : 'bg-white text-slate-700 border-[#D3E0D9] hover:border-[#1D4439]/50 hover:bg-[#F4F7F5]'
                            }`}
                          >
                            {slot.display}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE — STICKY BOOKING SUMMARY PANEL */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-5">
          <div className="bg-white p-6 rounded-3xl border border-[#D3E0D9] shadow-2xs space-y-5">
            <div className="border-b border-[#D3E0D9] pb-3">
              <h3 className="font-extrabold text-[#112C24] text-base font-heading tracking-tight uppercase">
                BOOKING SUMMARY
              </h3>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Business</span>
                <p className="font-extrabold text-[#112C24] text-sm mt-0.5">{business?.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Service</span>
                  <p className="font-extrabold text-[#112C24] mt-0.5">{service?.name}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Staff</span>
                  <p className="font-extrabold text-[#1D4439] mt-0.5">
                    {selectedStaffObj?.displayName || 'Any Specialist'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Date</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{formattedSummaryDate || 'Select date'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Time</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{displaySelectedTime || 'Select time'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#D3E0D9]">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Duration</span>
                  <p className="font-semibold text-slate-700 mt-0.5">{service?.durationMinutes || 30} minutes</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Price</span>
                  <p className="font-extrabold text-[#1D4439] text-lg font-mono mt-0.5">
                    ₹{Number(service?.price || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>

            {(!selectedStaffId || !selectedDate || !selectedTimeSlot) && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium flex items-center space-x-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Please select a specialist, date, and time slot to complete your reservation.</span>
              </div>
            )}

            <form onSubmit={handleConfirmBooking} className="pt-2">
              <button
                type="submit"
                disabled={!selectedStaffId || !selectedDate || !selectedTimeSlot || bookingLoading}
                className={`w-full font-bold py-3.5 rounded-xl text-xs transition-all shadow-2xs flex items-center justify-center space-x-2 cursor-pointer ${
                  !selectedStaffId || !selectedDate || !selectedTimeSlot || bookingLoading
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-[#1D4439] hover:bg-[#143229] text-white active:scale-[0.99]'
                }`}
              >
                <span>{bookingLoading ? 'Confirming Reservation...' : 'Confirm Reservation'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
