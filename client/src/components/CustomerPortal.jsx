import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { apiRequest } from '../services/api';
import {
  Building2,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Check,
  MapPin,
  Search,
  Navigation,
  Compass,
  Filter,
  Info,
  ArrowLeft,
  LayoutGrid,
  Sparkles,
  Activity,
  Home,
  Briefcase,
  Wrench,
  Star,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Award,
  X,
  CalendarDays,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import Badge from './ui/Badge';
import Button from './ui/Button';
import CustomerBookingPage from './CustomerBookingPage';
import { formatLocalDateISO, toLocalISOStringWithOffset } from '../utils/dateUtils';

const CATEGORY_ITEMS = [
  { name: 'All', icon: LayoutGrid },
  { name: 'Beauty & Salon', icon: Sparkles },
  { name: 'Fitness', icon: Activity },
  { name: 'Home Services', icon: Home },
  { name: 'Consulting', icon: Briefcase },
  { name: 'Cleaning', icon: Sparkles },
  { name: 'Repair', icon: Wrench },
];

const RATING_DESCRIPTIONS = {
  1: '1 — Poor',
  2: '2 — Fair',
  3: '3 — Good',
  4: '4 — Very Good',
  5: '5 — Excellent',
};

export default function CustomerPortal({ currentUser, onLogout, activeTabProp = 'browse', onNavigateTab }) {
  const [activeTab, setActiveTab] = useState(activeTabProp); // 'browse' | 'my-bookings' | 'reviews' | 'business-services' | 'book'
  const [businesses, setBusinesses] = useState([]);
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [myCustomerRecord, setMyCustomerRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState(false);
  const [selectedServiceCat, setSelectedServiceCat] = useState('All');
  const [error, setError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  // Location & Discovery State
  const [locationState, setLocationState] = useState('idle'); // 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'
  const [userCoords, setUserCoords] = useState({ lat: null, lng: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('nearest'); // 'nearest' | 'name' | 'price'
  const [radiusKm, setRadiusKm] = useState('25'); // '5' | '10' | '25' | '50'

  // My Appointments State
  const [myBookings, setMyBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState(null);
  const [bookingFilterTab, setBookingFilterTab] = useState('upcoming'); // 'upcoming' | 'today' | 'completed' | 'cancelled' | 'all'
  const [bookingSearchTerm, setBookingSearchTerm] = useState('');

  // Modal States
  const [selectedDetailBooking, setSelectedDetailBooking] = useState(null);

  const [cancelConfirmBooking, setCancelConfirmBooking] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(null);

  const [rescheduleBooking, setRescheduleBooking] = useState(null);
  const [rescheduleStaffList, setRescheduleStaffList] = useState([]);
  const [rescheduleStaffId, setRescheduleStaffId] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [rescheduleSlotLoading, setRescheduleSlotLoading] = useState(false);
  const [rescheduleSelectedTime, setRescheduleSelectedTime] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState(null);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(null);

  // Customer Reviews State
  const [reviewsData, setReviewsData] = useState({ reviewableBookings: [], submittedReviews: [] });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);

  // Review Modal & Submission State
  const [writeReviewBooking, setWriteReviewBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState(null);
  const [reviewSuccessData, setReviewSuccessData] = useState(null);

  const catalogSectionRef = useRef(null);
  const prevActiveTabPropRef = useRef(activeTabProp);

  useEffect(() => {
    if (activeTabProp !== prevActiveTabPropRef.current) {
      prevActiveTabPropRef.current = activeTabProp;
      setActiveTab(activeTabProp);
    }
  }, [activeTabProp]);

  // Scroll locking & Escape key listener for View Details modal
  useEffect(() => {
    if (!selectedDetailBooking) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedDetailBooking(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedDetailBooking]);

  // Scroll locking & Escape key listener for Cancel modal
  useEffect(() => {
    if (!cancelConfirmBooking) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setCancelConfirmBooking(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [cancelConfirmBooking]);

  // Scroll locking & Escape key listener for Reschedule modal
  useEffect(() => {
    if (!rescheduleBooking) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setRescheduleBooking(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [rescheduleBooking]);

  // Scroll locking & Escape key listener for Write Review Modal
  useEffect(() => {
    if (!writeReviewBooking && !reviewSuccessData) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !reviewSubmitLoading) {
        handleCloseReviewModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [writeReviewBooking, reviewSuccessData, reviewSubmitLoading]);

  // Fallback sync: if activeTab is business-services or book but selectedBiz is null
  useEffect(() => {
    if ((activeTab === 'business-services' || activeTab === 'book') && !selectedBiz) {
      if (businesses.length > 0) {
        setSelectedBiz(businesses[0]);
      } else if (!loading) {
        setActiveTab('browse');
      }
    }
  }, [activeTab, selectedBiz, businesses, loading]);

  // 1. Fetch Nearby / All Businesses
  const fetchNearbyCatalog = useCallback(
    async (
      coords = userCoords,
      category = selectedCategory,
      search = searchTerm,
      sort = sortBy,
      radius = radiusKm
    ) => {
      setLoading(true);
      setError(null);
      try {
        let url = `/businesses/nearby?sort=${sort}`;
        if (coords.lat !== null && coords.lng !== null) {
          url += `&lat=${coords.lat}&lng=${coords.lng}&radius=${radius}`;
        }
        if (category && category !== 'All') {
          url += `&category=${encodeURIComponent(category)}`;
        }
        if (search && search.trim() !== '') {
          url += `&search=${encodeURIComponent(search.trim())}`;
        }

        const response = await apiRequest(url);
        if (response.ok) {
          const data = await response.json();
          const bizList = data.data || [];
          setBusinesses(bizList);

          if (bizList.length > 0) {
            setSelectedBiz((prev) => {
              if (prev && bizList.some((b) => b.id === prev.id)) return prev;
              const first = bizList[0];
              loadBusinessDetails(first.id, false);
              return first;
            });
          }
        } else {
          setError('Unable to load businesses');
        }
      } catch (err) {
        console.error('Failed to load customer portal catalog:', err);
        setError('Unable to load businesses');
      } flex: {
        setLoading(false);
      }
    },
    [userCoords, selectedCategory, searchTerm, sortBy, radiusKm]
  );

  useEffect(() => {
    fetchNearbyCatalog(userCoords, selectedCategory, searchTerm, sortBy, radiusKm);
  }, []);

  // 2. Browser Geolocation Handler
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationState('unsupported');
      return;
    }

    setLocationState('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserCoords(coords);
        setLocationState('granted');
        fetchNearbyCatalog(coords, selectedCategory, searchTerm, sortBy, radiusKm);
      },
      (err) => {
        console.warn('Geolocation access denied or timed out:', err);
        setLocationState('denied');
        fetchNearbyCatalog({ lat: null, lng: null }, selectedCategory, searchTerm, sortBy, radiusKm);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // 3. Load Business Details
  const loadBusinessDetails = async (businessId, scrollToCatalog = false) => {
    setCatalogLoading(true);
    setCatalogError(false);
    setSelectedServiceCat('All');
    setServices([]);
    setStaff([]);
    try {
      const [svcRes, stRes, custRes] = await Promise.all([
        apiRequest(`/businesses/${businessId}/services`).catch(() => null),
        apiRequest(`/businesses/${businessId}/staff`).catch(() => null),
        apiRequest(`/businesses/${businessId}/customers`).catch(() => null),
      ]);

      if (svcRes && svcRes.ok) {
        const sData = await svcRes.json();
        setServices(sData.data || []);
      } else {
        setCatalogError(true);
      }

      if (stRes && stRes.ok) {
        const stData = await stRes.json();
        setStaff(stData.data || []);
      }

      if (custRes && custRes.ok) {
        const cData = await custRes.json();
        const cList = cData.data || [];
        const matched = cList.find((c) => c.userId === currentUser?.id || c.email === currentUser?.email);
        setMyCustomerRecord(matched || null);
      }

      if (scrollToCatalog && catalogSectionRef.current) {
        setTimeout(() => {
          catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch (err) {
      console.error('Failed to load business details:', err);
      setCatalogError(true);
    } finally {
      setCatalogLoading(false);
    }
  };

  // 4. Fetch All Customer Appointments Across Businesses
  const fetchAllCustomerBookings = useCallback(async () => {
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      let bizList = businesses;
      if (!bizList || bizList.length === 0) {
        const res = await apiRequest('/businesses/nearby?radius=500');
        if (res.ok) {
          const data = await res.json();
          bizList = data.data || [];
          setBusinesses(bizList);
        }
      }

      if (!bizList || bizList.length === 0) {
        setMyBookings([]);
        setBookingsLoading(false);
        return;
      }

      const results = await Promise.all(
        bizList.map((b) =>
          apiRequest(`/businesses/${b.id}/bookings`)
            .then(async (res) => {
              if (res.ok) {
                const d = await res.json();
                return (d.data || []).map((booking) => ({
                  ...booking,
                  business: booking.business || b,
                }));
              }
              return [];
            })
            .catch(() => [])
        )
      );

      const allCombined = results.flat();
      const bookingMap = new Map();
      allCombined.forEach((item) => {
        if (item && item.id && !bookingMap.has(item.id)) {
          bookingMap.set(item.id, item);
        }
      });

      const sorted = Array.from(bookingMap.values()).sort(
        (a, b) => new Date(b.startTime) - new Date(a.startTime)
      );

      setMyBookings(sorted);
    } catch (err) {
      console.error('Failed to fetch customer appointments:', err);
      setBookingsError('Unable to load your appointments.');
    } finally {
      setBookingsLoading(false);
    }
  }, [businesses]);

  useEffect(() => {
    if (activeTab === 'my-bookings') {
      fetchAllCustomerBookings();
    }
  }, [activeTab, fetchAllCustomerBookings]);

  // Fetch Customer Reviews & Reviewable Bookings
  const fetchCustomerReviews = useCallback(async () => {
    setReviewsLoading(true);
    setReviewsError(null);
    try {
      const res = await apiRequest('/reviews/me');
      if (res.ok) {
        const result = await res.json();
        setReviewsData({
          reviewableBookings: result.data?.reviewableBookings || [],
          submittedReviews: result.data?.submittedReviews || [],
        });
      } else {
        setReviewsError('Unable to load your reviews.');
      }
    } catch (err) {
      console.error('Failed to fetch customer reviews:', err);
      setReviewsError('Unable to load your reviews.');
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchCustomerReviews();
    }
  }, [activeTab, fetchCustomerReviews]);

  const handleOpenWriteReview = (booking) => {
    setWriteReviewBooking(booking);
    setReviewRating(0);
    setReviewHoverRating(0);
    setReviewComment('');
    setReviewSubmitError(null);
    setReviewSuccessData(null);
  };

  const handleCloseReviewModal = () => {
    setWriteReviewBooking(null);
    setReviewSuccessData(null);
    setReviewRating(0);
    setReviewHoverRating(0);
    setReviewComment('');
    setReviewSubmitError(null);
  };

  const handleSubmitReview = async (e) => {
    if (e) e.preventDefault();
    if (!writeReviewBooking) return;

    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      setReviewSubmitError('Please select a rating.');
      return;
    }

    setReviewSubmitLoading(true);
    setReviewSubmitError(null);

    try {
      const res = await apiRequest('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: writeReviewBooking.id,
          rating: reviewRating,
          comment: reviewComment.trim() || undefined,
        }),
      });

      const result = await res.json();

      if (res.ok && result.status === 'success') {
        const createdReview = result.data;
        setReviewSuccessData(createdReview);
        setWriteReviewBooking(null);
        await fetchCustomerReviews();
      } else {
        if (res.status === 409) {
          setReviewSubmitError('A review has already been submitted for this appointment.');
        } else if (res.status === 400) {
          setReviewSubmitError(result.message || 'This appointment is no longer available for review.');
        } else if (res.status === 403) {
          setReviewSubmitError('Access denied. You can only review your own appointments.');
        } else {
          setReviewSubmitError(result.message || 'Unable to submit your review. Please try again.');
        }
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
      setReviewSubmitError('Unable to submit your review. Please try again.');
    } finally {
      setReviewSubmitLoading(false);
    }
  };

  const getAssignedStaffForService = (serviceId) => {
    const safeStaff = Array.isArray(staff) ? staff : [];
    if (!serviceId || safeStaff.length === 0) return safeStaff;
    const filtered = safeStaff.filter((st) => {
      if (!st || typeof st !== 'object') return false;
      if (!st.staffServices || !Array.isArray(st.staffServices) || st.staffServices.length === 0) return true;
      return st.staffServices.some((ss) => ss && ss.serviceId === serviceId);
    });
    return filtered.length > 0 ? filtered : safeStaff;
  };

  const handleCardClick = async (biz) => {
    if (!biz) return;
    if (selectedBiz?.id === biz.id) return;
    setSelectedBiz(biz);
    await loadBusinessDetails(biz.id, false);
  };

  const handleSelectBusiness = async (biz) => {
    if (!biz) return;
    setSelectedBiz(biz);
    setActiveTab('business-services');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await loadBusinessDetails(biz.id, false);
  };

  const handleOpenBooking = (service) => {
    setSelectedService(service);
    setActiveTab('book');
  };

  const handleBookingSuccess = async (successMsg) => {
    setBookingSuccess(successMsg);
    if (selectedBiz) {
      await loadBusinessDetails(selectedBiz.id, false);
    }
    setActiveTab('my-bookings');
    if (onNavigateTab) onNavigateTab('my-bookings');
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    fetchNearbyCatalog(userCoords, cat, searchTerm, sortBy, radiusKm);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNearbyCatalog(userCoords, selectedCategory, searchTerm, sortBy, radiusKm);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    fetchNearbyCatalog(userCoords, selectedCategory, searchTerm, newSort, radiusKm);
  };

  const handleRadiusChange = (newRadius) => {
    setRadiusKm(newRadius);
    fetchNearbyCatalog(userCoords, selectedCategory, searchTerm, sortBy, newRadius);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setRadiusKm('25');
    setSortBy('nearest');
    fetchNearbyCatalog(userCoords, 'All', '', 'nearest', '25');
  };

  // Reschedule Availability Loader
  const fetchRescheduleAvailability = async (
    bizId,
    staffId,
    serviceId,
    dateStr,
    excludeBookingId = rescheduleBooking?.id,
    durationMinutes = rescheduleBooking?.service?.durationMinutes || 30
  ) => {
    if (!bizId || !staffId || !serviceId || !dateStr) return;
    setRescheduleSlotLoading(true);
    setRescheduleSlots([]);
    setRescheduleSelectedTime('');
    try {
      const now = new Date();
      const tzOffset = now.getTimezoneOffset();
      const excludeParam = excludeBookingId ? `&excludeBookingId=${excludeBookingId}` : '';
      const res = await apiRequest(
        `/businesses/${bizId}/availability?staffId=${staffId}&serviceId=${serviceId}&date=${dateStr}&tzOffset=${tzOffset}${excludeParam}`
      );
      if (res.ok) {
        const resData = await res.json();
        const { schedule, timeOff, breaks, bookings, isPastDate, slots: serverSlots } = resData.data || {};

        if (isPastDate || !schedule || !schedule.isAvailable) {
          setRescheduleSlots([]);
          return;
        }

        const todayISO = formatLocalDateISO(now);
        const [yStr, mStr, dStr] = dateStr.split('-').map(Number);
        const validSlots = [];

        if (Array.isArray(serverSlots)) {
          serverSlots.forEach((slot) => {
            const [hh, mm] = slot.value.split(':').map(Number);
            const slotDate = new Date(yStr, mStr - 1, dStr, hh, mm, 0, 0);
            const displayTime = slotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            validSlots.push({ startTime: slot.value, displayTime, isoStart: slot.isoStart });
          });
        } else {
          const [startH, startM] = schedule.startTime.split(':').map(Number);
          const [endH, endM] = schedule.endTime.split(':').map(Number);

          const dayStart = new Date(yStr, mStr - 1, dStr, startH, startM, 0, 0);
          const dayEnd = new Date(yStr, mStr - 1, dStr, endH, endM, 0, 0);

          const slotDurationMs = (durationMinutes || 30) * 60 * 1000;

          let current = new Date(dayStart);

          while (current.getTime() + slotDurationMs <= dayEnd.getTime()) {
            const slotEnd = new Date(current.getTime() + slotDurationMs);

            // 1. PAST TIME CHECK:
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

            // 4. BOOKING CONFLICT CHECK (The existing appointment being rescheduled MUST NOT block itself!)
            const isBookingConflict = (bookings || []).some((b) => {
              if (excludeBookingId && b.id === excludeBookingId) {
                return false;
              }
              const bStart = new Date(b.startTime);
              const bEnd = new Date(b.endTime);
              return current < bEnd && slotEnd > bStart;
            });

            if (!isTimeOffConflict && !isBreakConflict && !isBookingConflict) {
              const hour = current.getHours();
              const displayTime = current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
              const rawHHMM = `${String(hour).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}`;
              validSlots.push({ startTime: rawHHMM, displayTime, isoStart: current.toISOString() });
            }

            current = new Date(current.getTime() + 30 * 60 * 1000);
          }
        }

        setRescheduleSlots(validSlots);
      }
    } catch (err) {
      console.error('Failed to load reschedule availability:', err);
    } finally {
      setRescheduleSlotLoading(false);
    }
  };

  // Open Reschedule Modal
  const handleOpenReschedule = async (booking) => {
    setRescheduleBooking(booking);
    setRescheduleError(null);
    setRescheduleSuccess(null);
    setRescheduleSelectedTime('');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatLocalDateISO(tomorrow);
    setRescheduleDate(tomorrowStr);

    try {
      const res = await apiRequest(`/businesses/${booking.businessId}/staff`);
      if (res.ok) {
        const d = await res.json();
        const staffMembers = d.data || [];
        setRescheduleStaffList(staffMembers);
        const initialStaffId = booking.staffId || (staffMembers[0] ? staffMembers[0].id : '');
        setRescheduleStaffId(initialStaffId);

        if (initialStaffId) {
          const svcDuration = booking.service?.durationMinutes || 30;
          fetchRescheduleAvailability(
            booking.businessId,
            initialStaffId,
            booking.serviceId,
            tomorrowStr,
            booking.id,
            svcDuration
          );
        }
      }
    } catch (err) {
      console.error('Failed to load staff for reschedule:', err);
    }
  };

  // Confirm Reschedule
  const handleConfirmReschedule = async () => {
    if (!rescheduleBooking || !rescheduleStaffId || !rescheduleDate || !rescheduleSelectedTime) return;
    setRescheduleLoading(true);
    setRescheduleError(null);

    const newStartTimeStr = toLocalISOStringWithOffset(rescheduleDate, rescheduleSelectedTime);
    try {
      const res = await apiRequest(
        `/businesses/${rescheduleBooking.businessId}/bookings/${rescheduleBooking.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            staffId: rescheduleStaffId,
            startTime: newStartTimeStr,
            timezoneOffset: new Date().getTimezoneOffset(),
          }),
        }
      );

      if (res.ok) {
        setRescheduleSuccess('Appointment rescheduled successfully!');
        setTimeout(async () => {
          setRescheduleBooking(null);
          await fetchAllCustomerBookings();
        }, 1200);
      } else {
        const d = await res.json();
        setRescheduleError(d.message || 'That time slot is no longer available. Please choose another time.');
      }
    } catch (err) {
      console.error('Reschedule failed:', err);
      setRescheduleError('That time slot is no longer available. Please choose another time.');
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Open Cancel Modal
  const handleOpenCancel = (booking) => {
    setCancelConfirmBooking(booking);
    setCancelError(null);
    setCancelSuccess(null);
  };

  // Confirm Cancel
  const handleConfirmCancel = async () => {
    if (!cancelConfirmBooking) return;
    setCancelLoading(true);
    setCancelError(null);

    try {
      const res = await apiRequest(
        `/businesses/${cancelConfirmBooking.businessId}/bookings/${cancelConfirmBooking.id}/cancel`,
        { method: 'POST' }
      );

      if (res.ok) {
        setCancelSuccess('Appointment cancelled successfully.');
        setTimeout(async () => {
          setCancelConfirmBooking(null);
          await fetchAllCustomerBookings();
        }, 1000);
      } else {
        const d = await res.json();
        setCancelError(d.message || 'Unable to cancel this appointment. Please try again.');
      }
    } catch (err) {
      console.error('Cancellation failed:', err);
      setCancelError('Unable to cancel this appointment. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };

  // Date/Time Filter Helpers
  const getFilteredAppointments = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    return myBookings.filter((b) => {
      if (!b) return false;
      const startTime = new Date(b.startTime);
      const isToday = startTime >= startOfToday && startTime <= endOfToday;
      const isUpcomingDate = startTime > endOfToday;

      let matchesTab = true;
      if (bookingFilterTab === 'upcoming') {
        matchesTab = isUpcomingDate && b.status !== 'CANCELLED' && b.status !== 'COMPLETED';
      } else if (bookingFilterTab === 'today') {
        matchesTab = isToday;
      } else if (bookingFilterTab === 'completed') {
        matchesTab = b.status === 'COMPLETED';
      } else if (bookingFilterTab === 'cancelled') {
        matchesTab = b.status === 'CANCELLED';
      }

      if (!matchesTab) return false;

      if (bookingSearchTerm.trim() !== '') {
        const q = bookingSearchTerm.toLowerCase().trim();
        const bizName = (b.business?.name || '').toLowerCase();
        const svcName = (b.service?.name || '').toLowerCase();
        const staffName = (b.staff?.displayName || b.staff?.user?.name || '').toLowerCase();
        const catName = (b.business?.category || '').toLowerCase();

        return (
          bizName.includes(q) ||
          svcName.includes(q) ||
          staffName.includes(q) ||
          catName.includes(q)
        );
      }

      return true;
    });
  };

  const getTabCounts = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    let upcoming = 0;
    let today = 0;
    let completed = 0;
    let cancelled = 0;
    let all = myBookings.length;

    myBookings.forEach((b) => {
      if (!b) return;
      const startTime = new Date(b.startTime);
      const isToday = startTime >= startOfToday && startTime <= endOfToday;
      const isUpcomingDate = startTime > endOfToday;

      if (isUpcomingDate && b.status !== 'CANCELLED' && b.status !== 'COMPLETED') upcoming++;
      if (isToday) today++;
      if (b.status === 'COMPLETED') completed++;
      if (b.status === 'CANCELLED') cancelled++;
    });

    return { upcoming, today, completed, cancelled, all };
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>PENDING</span>
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>CONFIRMED</span>
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-ping" />
            <span>IN PROGRESS</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
            <span>COMPLETED</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>CANCELLED</span>
          </span>
        );
      case 'NO_SHOW':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200 shadow-2xs">
            <span>NO SHOW</span>
          </span>
        );
      default:
        return <Badge variant={status}>{status}</Badge>;
    }
  };

  // Helpers for category string formatting & images
  const formatCategoryName = (c) => {
    if (!c) return 'Service Business';
    if (typeof c === 'string') return c;
    if (typeof c === 'object') return c.name || c.title || 'Service Business';
    return String(c);
  };

  const getServiceCategoryName = (s) => {
    if (!s) return null;
    const c = s.category || s.serviceCategory;
    if (!c) return null;
    if (typeof c === 'string') return c;
    if (typeof c === 'object') return c.name || c.title || null;
    return String(c);
  };

  const getBusinessImage = (business) => {
    if (!business) return null;
    if (business.imageUrl) return business.imageUrl;
    const nameLower = (business.name || '').toLowerCase();
    const catLower = formatCategoryName(business.category).toLowerCase();

    if (nameLower.includes('glow') || catLower.includes('beauty') || catLower.includes('salon')) {
      return '/images/businesses/glow_style_beauty_studio.jpg';
    }
    if (nameLower.includes('fitzone') || catLower.includes('fitness') || catLower.includes('gym')) {
      return '/images/businesses/fitzone_fitness_center.jpg';
    }
    if (nameLower.includes('quickfix') || catLower.includes('home') || catLower.includes('repair')) {
      return '/images/businesses/quickfix_home_services.jpg';
    }
    return null;
  };

  const getBannerGradient = (category) => {
    const catLower = formatCategoryName(category).toLowerCase();
    if (catLower.includes('beauty') || catLower.includes('salon')) {
      return 'from-[#1D4439] to-[#2D5A4C]';
    }
    if (catLower.includes('fitness') || catLower.includes('gym')) {
      return 'from-[#1D4439] to-[#254F42]';
    }
    if (catLower.includes('home') || catLower.includes('repair')) {
      return 'from-[#1D4439] to-[#346254]';
    }
    return 'from-[#1D4439] to-[#2A5246]';
  };

  const filteredAppointments = getFilteredAppointments();
  const tabCounts = getTabCounts();
  const now = new Date();

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      {/* DISCOVERY HERO SECTION */}
      {activeTab === 'browse' && (
        <div className="bg-gradient-to-br from-[#EAEFEA] via-[#E4ECE6] to-[#DCE8E1] border border-[#D3E0D9] rounded-3xl p-6 sm:p-8 md:p-10 relative overflow-hidden shadow-2xs space-y-6">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-600/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-[#1D4439]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              {locationState === 'loading' ? (
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#1D4439] bg-white/80 border border-[#D3E0D9] shadow-2xs">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1D4439]" />
                  <span>Finding businesses near you...</span>
                </div>
              ) : locationState === 'granted' ? (
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#1D4439] bg-white/90 border border-[#D3E0D9] shadow-2xs">
                  <MapPin className="w-3.5 h-3.5 text-[#1D4439]" />
                  <span>📍 Hyderabad, Telangana</span>
                  <button
                    type="button"
                    onClick={handleRequestLocation}
                    className="ml-1 text-[11px] font-semibold text-emerald-800 hover:underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3 flex-wrap">
                  <span className="text-xs font-medium text-slate-600">
                    Use your location to find businesses near you.
                  </span>
                  <button
                    type="button"
                    onClick={handleRequestLocation}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-[#1D4439] hover:bg-[#143229] transition-all shadow-2xs cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>📍 Use My Location</span>
                  </button>
                </div>
              )}
            </div>

            <div className="max-w-3xl space-y-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#112C24] tracking-tight font-heading">
                Find the right service for you.
              </h1>
              <p className="text-sm sm:text-base text-[#112C24]/80 font-sans leading-relaxed">
                Discover local businesses, explore their services, and book an appointment in a few simple steps.
              </p>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-2xl pt-2">
              <Search className="w-5 h-5 text-[#1D4439]/60 absolute left-4 top-6" />
              <input
                type="text"
                placeholder="Search businesses or services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-white border border-[#D3E0D9] focus:outline-none focus:ring-2 focus:ring-[#1D4439]/30 focus:border-[#1D4439] text-sm text-[#112C24] placeholder-slate-400 shadow-2xs transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-4 bottom-2 px-5 bg-[#1D4439] hover:bg-[#143229] text-white font-bold text-xs rounded-xl transition-all shadow-2xs cursor-pointer flex items-center space-x-1"
              >
                <span>Search</span>
              </button>
            </form>
          </div>

          <div className="relative z-10 pt-2 border-t border-[#D3E0D9]/70">
            <div className="flex items-center space-x-2.5 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORY_ITEMS.map((catItem) => {
                const catName = catItem.name;
                const IconComp = catItem.icon;
                const isActive = selectedCategory === catName;
                return (
                  <button
                    key={catName}
                    type="button"
                    onClick={() => handleCategoryChange(catName)}
                    className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-[#1D4439] text-white shadow-2xs scale-[1.02]'
                        : 'bg-white text-slate-700 border border-[#D3E0D9] hover:bg-white/80 hover:border-[#1D4439]/40'
                    }`}
                  >
                    <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#1D4439]'}`} />
                    <span>{catName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Booking Success Banner */}
      {bookingSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center space-x-3 animate-fade-in-scale">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold font-heading">{bookingSuccess}</p>
            <p className="text-[11px] text-emerald-800 mt-0.5 font-sans">
              Your appointment has been reserved and added to "My Appointments".
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBookingSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      {loading ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-6 w-48 bg-slate-200/80 rounded-lg animate-pulse" />
            <div className="h-6 w-32 bg-slate-200/80 rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 animate-pulse"
              >
                <div className="h-28 bg-slate-100 rounded-xl w-full" />
                <div className="h-5 bg-slate-200/80 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-4 bg-slate-100 rounded w-5/6" />
                <div className="h-8 bg-slate-100 rounded-xl w-full mt-4" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl border border-rose-200 p-8 sm:p-12 text-center max-w-md mx-auto space-y-4 my-8 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Unable to load businesses</h3>
            <p className="text-xs text-slate-500 mt-1">Please try again.</p>
          </div>
          <button
            type="button"
            onClick={() => fetchNearbyCatalog(userCoords, selectedCategory, searchTerm, sortBy, radiusKm)}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1D4439] hover:bg-[#143229] transition-all shadow-2xs cursor-pointer inline-flex items-center space-x-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      ) : (
        <>
          {/* TAB 1: BROWSE DISCOVER PAGE */}
          {activeTab === 'browse' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#D3E0D9] pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-[#112C24] font-heading">
                    Businesses near you
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-sans">
                    Showing available businesses near your location
                  </p>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold text-slate-600">Radius:</span>
                    <select
                      value={radiusKm}
                      onChange={(e) => handleRadiusChange(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-[#D3E0D9] text-xs font-bold text-[#112C24] bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4439]/30 cursor-pointer shadow-2xs"
                    >
                      <option value="5">5 km</option>
                      <option value="10">10 km</option>
                      <option value="25">25 km</option>
                      <option value="50">50 km</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold text-slate-600 flex items-center space-x-1">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Sort by:</span>
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-[#D3E0D9] text-xs font-bold text-[#112C24] bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4439]/30 cursor-pointer shadow-2xs"
                    >
                      <option value="nearest">Nearest</option>
                      <option value="name">Name</option>
                      <option value="price">Starting Price</option>
                    </select>
                  </div>
                </div>
              </div>

              {businesses.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#D3E0D9] p-8 sm:p-12 text-center max-w-md mx-auto space-y-4 my-8 shadow-2xs">
                  <div className="w-12 h-12 rounded-full bg-[#EAEFEA] border border-[#D3E0D9] text-[#1D4439] flex items-center justify-center mx-auto">
                    <Building2 className="w-6 h-6 text-[#1D4439]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">No businesses found</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Try changing your search, category, or search radius.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1D4439] hover:bg-[#143229] transition-all shadow-2xs cursor-pointer inline-flex items-center space-x-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Filters</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {businesses.map((b) => {
                    const isSelected = selectedBiz?.id === b.id;
                    const bannerGradient = getBannerGradient(b.category);
                    const popularSvcs = b.services && b.services.length > 0 ? b.services.slice(0, 3) : [];

                    return (
                      <div
                        key={b.id}
                        onClick={() => handleCardClick(b)}
                        className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer group hover:-translate-y-1 ${
                          isSelected
                            ? 'border-[#1D4439] ring-2 ring-[#1D4439]/30 shadow-md'
                            : 'border-[#D3E0D9] hover:border-[#1D4439]/60 shadow-xs hover:shadow-md'
                        }`}
                      >
                        <div>
                          <div className={`h-36 bg-gradient-to-r ${bannerGradient} p-4 flex items-start justify-between relative overflow-hidden`}>
                            {getBusinessImage(b) ? (
                              <>
                                <img
                                  src={getBusinessImage(b)}
                                  alt={b.name}
                                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
                              </>
                            ) : (
                              <div className="absolute inset-0 bg-black/10" />
                            )}
                            <span className="relative z-10 px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-black/40 backdrop-blur-xs border border-white/30 tracking-wide uppercase font-mono shadow-2xs">
                              {b.category || 'Service Business'}
                            </span>
                            <span className="relative z-10 inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold text-amber-900 bg-amber-300 border border-amber-400 shadow-2xs">
                              <Star className="w-3 h-3 fill-current text-amber-900" />
                              <span>4.9</span>
                            </span>
                          </div>

                          <div className="p-5 space-y-3">
                            <div>
                              <h3 className="font-extrabold text-[#112C24] text-lg font-heading group-hover:text-[#1D4439] transition-colors leading-snug">
                                {b.name}
                              </h3>
                              {b.description && (
                                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mt-1 font-sans">
                                  {b.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-[#1D4439]" />
                              <span>{b.distanceKm !== null && b.distanceKm !== undefined ? `${b.distanceKm} km away` : 'Local Business'}</span>
                            </div>

                            {popularSvcs.length > 0 && (
                              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                  Popular services
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {popularSvcs.map((svc) => (
                                    <span
                                      key={svc.id || svc.name}
                                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F0F5F2] text-[#1D4439] border border-[#D3E0D9]/70"
                                    >
                                      {svc.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-5 pt-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectBusiness(b);
                            }}
                            className="w-full bg-[#1D4439] hover:bg-[#143229] text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-2xs cursor-pointer flex items-center justify-center space-x-1.5"
                          >
                            <span>View Services</span>
                            <ArrowRight className="w-3.5 h-3.5 text-emerald-300" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BUSINESS DETAILS & SERVICES CATALOG */}
          {activeTab === 'business-services' && selectedBiz && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex items-center justify-between pb-1">
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab('browse');
                    setActiveTab('browse');
                  }}
                  className="inline-flex items-center space-x-2 text-xs font-bold text-[#112C24] bg-white hover:bg-slate-50 px-4 py-2.5 rounded-xl border border-[#D3E0D9] shadow-2xs transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-[#112C24]" />
                  <span>← Back to Discover</span>
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-[#D3E0D9] overflow-hidden shadow-2xs">
                {getBusinessImage(selectedBiz) && (
                  <div className="h-48 sm:h-64 relative w-full overflow-hidden">
                    <img
                      src={getBusinessImage(selectedBiz)}
                      alt={selectedBiz.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  </div>
                )}

                <div className="p-6 sm:p-8 space-y-4 relative z-10">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold text-[#1D4439] uppercase tracking-wider bg-[#EAEFEA] px-3 py-1 rounded-full border border-[#D3E0D9] font-mono">
                        {selectedBiz.category || 'Service Business'}
                      </span>
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                        <Star className="w-3.5 h-3.5 fill-current text-amber-900" />
                        <span>{selectedBiz.avgRating || selectedBiz.rating ? `★ ${Number(selectedBiz.avgRating || selectedBiz.rating).toFixed(1)}` : 'New Studio'}</span>
                      </span>
                    </div>

                    {selectedBiz.distanceKm !== null && selectedBiz.distanceKm !== undefined && (
                      <span className="inline-flex items-center space-x-1 text-xs font-bold text-[#1D4439] bg-[#EAEFEA] px-3 py-1 rounded-full border border-[#D3E0D9]">
                        <span>📏 {selectedBiz.distanceKm} km away</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#112C24] font-heading">{selectedBiz.name}</h1>
                    {selectedBiz.description && (
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans max-w-3xl mt-1.5">
                        {selectedBiz.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center space-x-1.5 font-medium">
                      <MapPin className="w-4 h-4 text-[#1D4439]" />
                      <span>📍 {selectedBiz.address || selectedBiz.city || 'Hyderabad, Telangana'}</span>
                    </div>
                    {selectedBiz.phone && (
                      <div className="flex items-center space-x-1.5 font-medium">
                        <span className="text-slate-400">•</span>
                        <span>📞 {selectedBiz.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-[#F4F7F5] rounded-2xl border border-[#D3E0D9] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <h3 className="font-bold text-[#112C24] flex items-center space-x-1.5">
                    <Info className="w-4 h-4 text-[#1D4439]" />
                    <span>About {selectedBiz.name}</span>
                  </h3>
                  <p className="text-slate-600">
                    Verified service provider in {selectedBiz.city || 'Hyderabad'}. Appointments booked through ServiceHub receive instant schedule confirmation.
                  </p>
                </div>
                <div className="flex items-center space-x-3 shrink-0">
                  <span className="px-3 py-1.5 rounded-xl bg-white border border-[#D3E0D9] font-bold text-[#1D4439]">
                    ✓ Verified Provider
                  </span>
                </div>
              </div>

              <div className="space-y-5 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D3E0D9] pb-3">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#112C24] font-heading">Services</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Choose a service to book an appointment.</p>
                  </div>

                  {(() => {
                    const safeSvcs = Array.isArray(services) ? services : [];
                    const categories = Array.from(
                      new Set(
                        safeSvcs
                          .map(getServiceCategoryName)
                          .filter(Boolean)
                      )
                    );
                    if (categories.length <= 1) return null;
                    return (
                      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                        {['All', ...categories].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedServiceCat(cat)}
                            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                              selectedServiceCat === cat
                                ? 'bg-[#1D4439] text-white shadow-2xs'
                                : 'bg-white text-slate-700 border border-[#D3E0D9] hover:bg-slate-50'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {catalogLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map((idx) => (
                      <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 animate-pulse">
                        <div className="h-5 bg-slate-200 rounded w-2/3" />
                        <div className="h-4 bg-slate-100 rounded w-full" />
                        <div className="h-4 bg-slate-100 rounded w-4/5" />
                        <div className="h-10 bg-slate-100 rounded-xl w-full mt-4" />
                      </div>
                    ))}
                  </div>
                ) : catalogError ? (
                  <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center max-w-md mx-auto space-y-3 shadow-2xs">
                    <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Unable to load business</h3>
                      <p className="text-xs text-slate-500 mt-1">Please try again.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => loadBusinessDetails(selectedBiz?.id, false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1D4439] hover:bg-[#143229] transition-all shadow-2xs cursor-pointer inline-flex items-center space-x-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Try Again</span>
                    </button>
                  </div>
                ) : (!Array.isArray(services) || services.length === 0) ? (
                  <div className="bg-white rounded-3xl border border-[#D3E0D9] p-8 sm:p-12 text-center max-w-md mx-auto space-y-3 shadow-2xs">
                    <div className="w-12 h-12 rounded-full bg-[#EAEFEA] border border-[#D3E0D9] text-[#1D4439] flex items-center justify-center mx-auto">
                      <Building2 className="w-6 h-6 text-[#1D4439]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">No services available</h3>
                      <p className="text-xs text-slate-500 mt-1">This business hasn't added any services yet.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {(selectedServiceCat === 'All'
                      ? services
                      : services.filter((s) => s && getServiceCategoryName(s) === selectedServiceCat)
                    ).map((svc, sIdx) => {
                      if (!svc) return null;
                      const assignedStaff = getAssignedStaffForService(svc.id);
                      const displayPrice = Number(svc.price) || 0;
                      return (
                        <div
                          key={svc.id || sIdx}
                          className="bg-white p-6 rounded-2xl border border-[#D3E0D9] shadow-2xs hover:border-[#1D4439]/60 hover:-translate-y-0.5 transition-all flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-extrabold text-[#112C24] text-base font-heading leading-snug">{svc.name || 'Service'}</h3>
                              <span className="text-sm font-extrabold text-[#1D4439] font-mono bg-[#EAEFEA] border border-[#D3E0D9] px-2.5 py-1 rounded-md shrink-0">
                                ₹{displayPrice.toFixed(0)}
                              </span>
                            </div>

                            {svc.description && (
                              <p className="text-xs text-slate-600 leading-relaxed font-sans">{svc.description}</p>
                            )}

                            <div className="flex items-center space-x-1.5 text-xs text-slate-500 pt-0.5">
                              <Clock className="w-3.5 h-3.5 text-[#1D4439]" />
                              <span className="font-semibold">{svc.durationMinutes || 30} min</span>
                            </div>

                            <div className="pt-3 border-t border-slate-100 space-y-1.5">
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Available specialists
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {Array.isArray(assignedStaff) && assignedStaff.length > 0 ? (
                                  assignedStaff.map((st, stIdx) => {
                                    if (!st) return null;
                                    const staffName = st.displayName || st.name || st.user?.name || 'Specialist';
                                    return (
                                      <span
                                        key={st.id || stIdx}
                                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#F4F7F5] text-[#1D4439] border border-[#D3E0D9]/70 flex items-center space-x-1"
                                      >
                                        <User className="w-3 h-3 text-[#1D4439]" />
                                        <span>{staffName}</span>
                                      </span>
                                    );
                                  })
                                ) : (
                                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                                    Any Available Specialist
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleOpenBooking(svc)}
                              className="w-full bg-[#1D4439] hover:bg-[#143229] text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-2xs cursor-pointer flex items-center justify-center space-x-1.5"
                            >
                              <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                              <span>Book Service</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: BOOKING PAGE */}
          {activeTab === 'book' && selectedBiz && selectedService && (
            <CustomerBookingPage
              business={selectedBiz}
              service={selectedService}
              currentUser={currentUser}
              onBack={() => setActiveTab(selectedBiz ? 'business-services' : 'browse')}
              onTabChange={(tab) => setActiveTab(tab)}
              onBookingSuccess={handleBookingSuccess}
            />
          )}

          {/* TAB 4: MY APPOINTMENTS */}
          {activeTab === 'my-bookings' && (
            <div className="space-y-6 animate-fade-in-up">
              {/* PAGE HEADER */}
              <div className="bg-white rounded-3xl border border-[#D3E0D9] p-6 sm:p-8 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#112C24] font-heading tracking-tight">
                      My Appointments
                    </h1>
                    <span className="px-3 py-1 bg-[#EAEFEA] text-[#1D4439] font-extrabold text-xs rounded-full border border-[#D3E0D9]">
                      {filteredAppointments.length} {filteredAppointments.length === 1 ? 'appointment' : 'appointments'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 font-sans">
                    Manage your upcoming and past service appointments.
                  </p>
                </div>

                {/* SEARCH INPUT */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search appointments..."
                    value={bookingSearchTerm}
                    onChange={(e) => setBookingSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#D3E0D9] focus:outline-none focus:ring-2 focus:ring-[#1D4439]/30 text-xs text-[#112C24] placeholder-slate-400 shadow-2xs"
                  />
                  {bookingSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setBookingSearchTerm('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* APPOINTMENT FILTER TABS */}
              <div className="flex items-center space-x-2 border-b border-[#D3E0D9] pb-3 overflow-x-auto scrollbar-none">
                {[
                  { key: 'upcoming', label: 'Upcoming', count: tabCounts.upcoming },
                  { key: 'today', label: 'Today', count: tabCounts.today },
                  { key: 'completed', label: 'Completed', count: tabCounts.completed },
                  { key: 'cancelled', label: 'Cancelled', count: tabCounts.cancelled },
                  { key: 'all', label: 'All', count: tabCounts.all },
                ].map((tab) => {
                  const isActive = bookingFilterTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setBookingFilterTab(tab.key)}
                      className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-[#1D4439] text-white shadow-2xs scale-[1.02]'
                          : 'bg-white text-slate-700 border border-[#D3E0D9] hover:bg-slate-50'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* APPOINTMENT LIST OR STATES */}
              {bookingsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse"
                    >
                      <div className="flex justify-between items-center">
                        <div className="h-5 bg-slate-200 rounded w-1/3" />
                        <div className="h-6 bg-slate-100 rounded-full w-24" />
                      </div>
                      <div className="h-4 bg-slate-100 rounded w-1/2" />
                      <div className="h-4 bg-slate-100 rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ) : bookingsError ? (
                <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center max-w-md mx-auto space-y-4 shadow-2xs">
                  <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Unable to load your appointments.</h3>
                    <p className="text-xs text-slate-500 mt-1">Please try again.</p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchAllCustomerBookings}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1D4439] hover:bg-[#143229] transition-all shadow-2xs cursor-pointer inline-flex items-center space-x-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#D3E0D9] p-8 sm:p-12 text-center max-w-md mx-auto space-y-4 shadow-2xs my-4">
                  <div className="w-14 h-14 rounded-full bg-[#EAEFEA] border border-[#D3E0D9] text-[#1D4439] flex items-center justify-center mx-auto">
                    <Calendar className="w-7 h-7 text-[#1D4439]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-[#112C24] text-lg font-heading">
                      {bookingFilterTab === 'upcoming' && 'No upcoming appointments'}
                      {bookingFilterTab === 'today' && 'No appointments today'}
                      {bookingFilterTab === 'completed' && 'No completed appointments yet.'}
                      {bookingFilterTab === 'cancelled' && 'No cancelled appointments.'}
                      {bookingFilterTab === 'all' && "You haven't booked any appointments yet."}
                    </h3>
                    <p className="text-xs text-slate-500 font-sans">
                      {bookingFilterTab === 'upcoming' && 'Your future bookings will appear here.'}
                      {bookingFilterTab === 'today' && "You don't have any appointments scheduled for today."}
                      {bookingFilterTab === 'completed' && 'Your completed appointments will appear here after service delivery.'}
                      {bookingFilterTab === 'cancelled' && 'You don\'t have any cancelled appointments.'}
                      {bookingFilterTab === 'all' && 'Explore top local businesses and reserve your first service.'}
                    </p>
                  </div>

                  {(bookingFilterTab === 'upcoming' || bookingFilterTab === 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onNavigateTab) onNavigateTab('browse');
                        setActiveTab('browse');
                      }}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1D4439] hover:bg-[#143229] transition-all shadow-2xs cursor-pointer inline-flex items-center space-x-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Discover Services</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAppointments.map((b) => {
                    const startTime = new Date(b.startTime);
                    const endTime = new Date(b.endTime);

                    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

                    const isToday = startTime >= startOfToday && startTime <= endOfToday;
                    const isUpcomingDate = startTime > endOfToday;
                    const isPastDate = startTime < startOfToday;
                    const isPastTimeToday = isToday && startTime < now;

                    const dateFormatted = startTime.toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    const timeFormatted = startTime.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    const bizName = b.business?.name || 'Service Business';
                    const bizCategory = b.business?.category || 'Service Business';
                    const svcName = b.service?.name || 'Service';
                    const staffName = b.staff?.displayName || b.staff?.user?.name || 'Specialist';
                    const durationMins = b.service?.durationMinutes || 30;
                    const priceAmount = Number(b.totalAmount || b.service?.price || 0).toFixed(0);

                    const canReschedule =
                      (b.status === 'CONFIRMED' || b.status === 'PENDING') &&
                      (isUpcomingDate || (isToday && !isPastTimeToday));

                    const canCancel =
                      (b.status === 'PENDING' || b.status === 'CONFIRMED') &&
                      (isUpcomingDate || (isToday && !isPastTimeToday));

                    const isCompleted = b.status === 'COMPLETED';

                    return (
                      <div
                        key={b.id}
                        className="bg-white rounded-2xl border border-[#D3E0D9] p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-[#1D4439]/50 transition-all space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-[#EAEFEA] border border-[#D3E0D9] flex items-center justify-center shrink-0">
                              <Building2 className="w-5 h-5 text-[#1D4439]" />
                            </div>
                            <div>
                              <h3 className="font-extrabold text-[#112C24] text-base font-heading leading-snug">
                                {bizName}
                              </h3>
                              <span className="text-[11px] font-semibold text-[#1D4439] bg-[#EAEFEA] px-2 py-0.5 rounded-md border border-[#D3E0D9]/70 inline-block mt-0.5">
                                {bizCategory}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 self-start sm:self-center">
                            {renderStatusBadge(b.status)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Service
                            </p>
                            <p className="font-bold text-[#112C24] text-sm">{svcName}</p>
                            <div className="flex items-center space-x-1 text-slate-500 font-medium">
                              <Clock className="w-3.5 h-3.5 text-[#1D4439]" />
                              <span>{durationMins} minutes</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Staff Specialist
                            </p>
                            <p className="font-semibold text-slate-800 flex items-center space-x-1.5">
                              <User className="w-3.5 h-3.5 text-[#1D4439]" />
                              <span>{staffName}</span>
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Date & Time
                            </p>
                            <p className="font-bold text-[#112C24]">{dateFormatted}</p>
                            <p className="font-mono text-slate-600 font-semibold">{timeFormatted}</p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Total Amount
                            </p>
                            <p className="font-extrabold text-[#112C24] text-base font-mono">
                              ₹{priceAmount}
                            </p>
                          </div>
                        </div>

                        {b.status === 'PENDING' && (isPastDate || isPastTimeToday) && (
                          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                            <span>This appointment was scheduled for a past time. Rescheduling or cancellation is disabled for past appointments.</span>
                          </div>
                        )}

                        <div className="flex items-center justify-end flex-wrap gap-2 pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setSelectedDetailBooking(b)}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#112C24] bg-white hover:bg-slate-50 border border-[#D3E0D9] shadow-2xs transition-all cursor-pointer flex items-center space-x-1.5"
                          >
                            <Info className="w-3.5 h-3.5 text-[#1D4439]" />
                            <span>View Details</span>
                          </button>

                          {canReschedule && (
                            <button
                              type="button"
                              onClick={() => handleOpenReschedule(b)}
                              className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#1D4439] bg-[#EAEFEA] hover:bg-[#D3E0D9] border border-[#D3E0D9] shadow-2xs transition-all cursor-pointer flex items-center space-x-1.5"
                            >
                              <Calendar className="w-3.5 h-3.5 text-[#1D4439]" />
                              <span>Reschedule</span>
                            </button>
                          )}

                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => handleOpenCancel(b)}
                              className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 shadow-2xs transition-all cursor-pointer flex items-center space-x-1.5"
                            >
                              <X className="w-3.5 h-3.5 text-rose-600" />
                              <span>Cancel</span>
                            </button>
                          )}

                          {isCompleted && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onNavigateTab) onNavigateTab('reviews');
                                else setActiveTab('reviews');
                              }}
                              className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 shadow-2xs transition-all cursor-pointer flex items-center space-x-1.5"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-600 fill-current" />
                              <span>Write Review</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* PAGE HEADER */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#D3E0D9] pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-[#112C24] font-heading">
                    Your Reviews
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-sans">
                    Share your experience and help others choose the right service.
                  </p>
                </div>
                {reviewsData.reviewableBookings.length > 0 && (
                  <div className="px-3.5 py-1.5 rounded-full bg-[#EAEFEA] text-[#1D4439] border border-[#D3E0D9] text-xs font-semibold flex items-center space-x-1.5 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-[#1D4439]" />
                    <span>Your feedback helps local businesses improve.</span>
                  </div>
                )}
              </div>

              {/* SKELETON LOADING STATE */}
              {reviewsLoading ? (
                <div className="space-y-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 w-36 bg-slate-200 rounded-md"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="h-44 bg-slate-100 rounded-2xl border border-slate-200"></div>
                      <div className="h-44 bg-slate-100 rounded-2xl border border-slate-200"></div>
                    </div>
                  </div>
                </div>
              ) : reviewsError ? (
                /* ERROR STATE */
                <div className="bg-white rounded-3xl border border-rose-200 p-8 sm:p-12 text-center max-w-md mx-auto space-y-4 my-6 shadow-2xs">
                  <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Unable to load your reviews.</h3>
                    <p className="text-xs text-slate-500 mt-1">Please check your connection and try again.</p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchCustomerReviews}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1D4439] hover:bg-[#143229] transition-all shadow-2xs cursor-pointer inline-flex items-center space-x-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                </div>
              ) : reviewsData.reviewableBookings.length === 0 && reviewsData.submittedReviews.length === 0 ? (
                /* EMPTY STATE */
                <div className="bg-white rounded-3xl border border-[#D3E0D9] p-8 sm:p-12 text-center max-w-md mx-auto space-y-4 my-8 shadow-2xs">
                  <div className="w-12 h-12 rounded-full bg-[#EAEFEA] border border-[#D3E0D9] text-[#1D4439] flex items-center justify-center mx-auto">
                    <Star className="w-6 h-6 text-[#1D4439]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg font-heading">No reviews to write yet</h3>
                    <p className="text-xs text-slate-500 mt-1 font-sans">
                      Complete a service appointment and you'll be able to share your experience here.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateTab) onNavigateTab('browse');
                      else setActiveTab('browse');
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1D4439] hover:bg-[#143229] transition-all shadow-2xs cursor-pointer inline-flex items-center space-x-2"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Discover Services</span>
                  </button>
                </div>
              ) : (
                /* ACTIVE / MIXED STATE */
                <div className="space-y-8">
                  {/* READY TO REVIEW SECTION */}
                  {reviewsData.reviewableBookings.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xs font-extrabold text-[#112C24] uppercase tracking-wider font-heading">
                          Ready to review
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                          {reviewsData.reviewableBookings.length}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reviewsData.reviewableBookings.map((b) => {
                          const bizName = b.business?.name || 'Service Business';
                          const bizCat = b.business?.category || 'Service';
                          const svcName = b.service?.name || 'Service';
                          const staffName = b.staff?.displayName || b.staff?.user?.name || 'Specialist';
                          const dateStr = new Date(b.startTime).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          });
                          const timeStr = new Date(b.startTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          });
                          const price = b.totalAmount || b.service?.price;

                          return (
                            <div
                              key={b.id}
                              className="bg-white rounded-2xl border border-[#D3E0D9] p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-extrabold text-[#112C24] text-base font-heading">
                                      {bizName}
                                    </h4>
                                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                      {bizCat}
                                    </p>
                                  </div>
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                                    Completed
                                  </span>
                                </div>

                                <div className="bg-[#F8FAF9] p-3 rounded-xl border border-[#E3ECE7] space-y-1 text-xs">
                                  <p className="font-extrabold text-[#112C24]">{svcName}</p>
                                  <p className="text-slate-600 text-[11px]">with {staffName}</p>
                                </div>

                                <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                                  <div className="flex items-center space-x-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-[#1D4439]" />
                                    <span>{dateStr} • {timeStr}</span>
                                  </div>
                                  {price !== undefined && price !== null && (
                                    <span className="font-mono font-bold text-[#1D4439]">
                                      ₹{Number(price).toFixed(0)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleOpenWriteReview(b)}
                                className="w-full bg-[#1D4439] hover:bg-[#143229] text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-2xs cursor-pointer flex items-center justify-center space-x-1.5"
                              >
                                <Star className="w-3.5 h-3.5 text-emerald-300" />
                                <span>Write a Review</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SUBMITTED REVIEWS SECTION */}
                  {reviewsData.submittedReviews.length > 0 && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xs font-extrabold text-[#112C24] uppercase tracking-wider font-heading">
                          Your Reviews
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {reviewsData.submittedReviews.length}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reviewsData.submittedReviews.map((r) => {
                          const bizName = r.business?.name || 'Service Business';
                          const svcName = r.booking?.service?.name || 'Service';
                          const staffName = r.booking?.staff?.displayName || r.booking?.staff?.user?.name;
                          const reviewDate = new Date(r.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          });

                          return (
                            <div
                              key={r.id}
                              className="bg-white rounded-2xl border border-[#D3E0D9] p-5 shadow-2xs space-y-3"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-extrabold text-[#112C24] text-base font-heading">
                                    {bizName}
                                  </h4>
                                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                                    {svcName}{staffName ? ` with ${staffName}` : ''}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= r.rating
                                          ? 'text-[#1D4439] fill-[#1D4439]'
                                          : 'text-slate-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>

                              {r.comment && (
                                <p className="text-xs text-slate-700 bg-[#F8FAF9] p-3 rounded-xl border border-[#E3ECE7] italic font-sans">
                                  "{r.comment}"
                                </p>
                              )}

                              <div className="text-[11px] text-slate-400 font-medium">
                                Reviewed {reviewDate}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* APPOINTMENT DETAILS MODAL */}
      {selectedDetailBooking &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedDetailBooking(null);
            }}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
          >
            <div
              className="bg-white rounded-3xl border border-[#D3E0D9] max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] flex flex-col my-auto animate-fade-in-scale"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedDetailBooking(null)}
                className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors z-10 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="overflow-y-auto pr-1 space-y-6 flex-1 text-slate-800">
                <div className="space-y-1 border-b border-slate-100 pb-4 pr-8">
                  <div className="flex items-center space-x-3 flex-wrap gap-2">
                    <h2 className="text-xl font-extrabold text-[#112C24] font-heading">
                      Appointment Details
                    </h2>
                    {renderStatusBadge(selectedDetailBooking.status)}
                  </div>
                  <p className="text-xs text-slate-500">
                    Reservation confirmation and service metadata
                  </p>
                </div>

                <div className="space-y-2 bg-[#F4F7F5] rounded-2xl p-4 border border-[#D3E0D9]">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Business Information
                  </p>
                  <h3 className="font-extrabold text-[#112C24] text-base font-heading">
                    {selectedDetailBooking.business?.name || 'Service Business'}
                  </h3>
                  <p className="text-xs text-slate-600 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#1D4439] shrink-0" />
                    <span>
                      {selectedDetailBooking.business?.address || selectedDetailBooking.business?.city || 'Hyderabad, Telangana'} • {selectedDetailBooking.business?.category || 'Service'}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Service</p>
                    <p className="font-extrabold text-[#112C24] text-sm">{selectedDetailBooking.service?.name || 'Service'}</p>
                    {selectedDetailBooking.service?.description && (
                      <p className="text-slate-600 text-[11px] line-clamp-2">{selectedDetailBooking.service.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 font-semibold text-slate-700">
                      <span>Duration: {selectedDetailBooking.service?.durationMinutes || 30} min</span>
                      <span className="font-mono font-extrabold text-[#1D4439]">
                        ₹{Number(selectedDetailBooking.totalAmount || selectedDetailBooking.service?.price || 0).toFixed(0)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Staff Specialist</p>
                      <p className="font-bold text-[#112C24] text-sm flex items-center space-x-1.5 mt-1">
                        <User className="w-4 h-4 text-[#1D4439] shrink-0" />
                        <span>{selectedDetailBooking.staff?.displayName || selectedDetailBooking.staff?.user?.name || 'Specialist'}</span>
                      </p>
                    </div>
                    {selectedDetailBooking.staff?.user?.email && (
                      <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                        Contact: {selectedDetailBooking.staff.user.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Schedule & Time</p>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-bold text-[#112C24] text-sm">
                        {new Date(selectedDetailBooking.startTime).toLocaleDateString([], {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="font-mono text-slate-600 font-semibold mt-0.5">
                        {new Date(selectedDetailBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(selectedDetailBooking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#EAEFEA] text-[#1D4439] border border-[#D3E0D9]">
                        <Clock className="w-3.5 h-3.5 text-[#1D4439]" />
                        <span>{selectedDetailBooking.service?.durationMinutes || 30} mins</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Special Requests / Notes</p>
                  <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-sans italic">
                    {selectedDetailBooking.notes || 'No special requests provided.'}
                  </p>
                </div>
              </div>

              {(() => {
                const startTime = new Date(selectedDetailBooking.startTime);
                const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                const isToday = startTime >= startOfToday && startTime <= endOfToday;
                const isUpcomingDate = startTime > endOfToday;
                const isPastTimeToday = isToday && startTime < now;

                const canRescheduleDetail =
                  (selectedDetailBooking.status === 'CONFIRMED' || selectedDetailBooking.status === 'PENDING') &&
                  (isUpcomingDate || (isToday && !isPastTimeToday));

                const canCancelDetail =
                  (selectedDetailBooking.status === 'PENDING' || selectedDetailBooking.status === 'CONFIRMED') &&
                  (isUpcomingDate || (isToday && !isPastTimeToday));

                const isCompletedDetail = selectedDetailBooking.status === 'COMPLETED';

                return (
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end flex-wrap gap-2.5">
                    {canRescheduleDetail && (
                      <button
                        type="button"
                        onClick={() => {
                          const target = selectedDetailBooking;
                          setSelectedDetailBooking(null);
                          handleOpenReschedule(target);
                        }}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#1D4439] bg-[#EAEFEA] hover:bg-[#D3E0D9] border border-[#D3E0D9] transition-all cursor-pointer flex items-center space-x-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5 text-[#1D4439]" />
                        <span>Reschedule</span>
                      </button>
                    )}

                    {canCancelDetail && (
                      <button
                        type="button"
                        onClick={() => {
                          const target = selectedDetailBooking;
                          setSelectedDetailBooking(null);
                          handleOpenCancel(target);
                        }}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer flex items-center space-x-1.5"
                      >
                        <X className="w-3.5 h-3.5 text-rose-600" />
                        <span>Cancel</span>
                      </button>
                    )}

                    {isCompletedDetail && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDetailBooking(null);
                          if (onNavigateTab) onNavigateTab('reviews');
                          else setActiveTab('reviews');
                        }}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all cursor-pointer flex items-center space-x-1.5"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-600 fill-current" />
                        <span>Write Review</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedDetailBooking(null)}
                      className="px-5 py-2.5 bg-[#1D4439] hover:bg-[#143229] text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>,
          document.body
        )}

      {/* CANCEL CONFIRMATION MODAL */}
      {cancelConfirmBooking &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setCancelConfirmBooking(null);
            }}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          >
            <div
              className="bg-white rounded-3xl border border-[#D3E0D9] max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl relative my-auto animate-fade-in-scale"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setCancelConfirmBooking(null)}
                className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 text-rose-700">
                <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                </div>
                <h2 className="text-xl font-extrabold text-[#112C24] font-heading">
                  Cancel this appointment?
                </h2>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Business:</span>
                  <span className="font-bold text-[#112C24]">{cancelConfirmBooking.business?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Service:</span>
                  <span className="font-bold text-[#112C24]">{cancelConfirmBooking.service?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Date & Time:</span>
                  <span className="font-bold font-mono text-[#112C24]">
                    {new Date(cancelConfirmBooking.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              </div>

              {cancelError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {cancelError}
                </div>
              )}

              {cancelSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{cancelSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelConfirmBooking(null)}
                  disabled={cancelLoading}
                  className="px-4 py-2.5 rounded-xl border border-[#D3E0D9] text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Keep Appointment
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={cancelLoading}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  {cancelLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <span>Cancel Appointment</span>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* RESCHEDULE MODAL */}
      {rescheduleBooking &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setRescheduleBooking(null);
            }}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          >
            <div
              className="bg-white rounded-3xl border border-[#D3E0D9] max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto my-auto animate-fade-in-scale"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setRescheduleBooking(null)}
                className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-[#112C24] font-heading">
                  Reschedule Appointment
                </h2>
                <p className="text-xs text-slate-500">
                  {rescheduleBooking.service?.name} at {rescheduleBooking.business?.name}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#112C24] block">Select Specialist:</label>
                <select
                  value={rescheduleStaffId}
                  onChange={(e) => {
                    const newStaffId = e.target.value;
                    setRescheduleStaffId(newStaffId);
                    if (rescheduleDate && rescheduleBooking) {
                      const svcDuration = rescheduleBooking.service?.durationMinutes || 30;
                      fetchRescheduleAvailability(
                        rescheduleBooking.businessId,
                        newStaffId,
                        rescheduleBooking.serviceId,
                        rescheduleDate,
                        rescheduleBooking.id,
                        svcDuration
                      );
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D3E0D9] text-xs font-bold text-[#112C24] bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4439]/30"
                >
                  {rescheduleStaffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.displayName || st.user?.name || 'Specialist'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#112C24] block">Select Date:</label>
                <input
                  type="date"
                  min={formatLocalDateISO(new Date())}
                  value={rescheduleDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setRescheduleDate(newDate);
                    if (rescheduleStaffId && rescheduleBooking) {
                      const svcDuration = rescheduleBooking.service?.durationMinutes || 30;
                      fetchRescheduleAvailability(
                        rescheduleBooking.businessId,
                        rescheduleStaffId,
                        rescheduleBooking.serviceId,
                        newDate,
                        rescheduleBooking.id,
                        svcDuration
                      );
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D3E0D9] text-xs font-bold text-[#112C24] bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4439]/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#112C24] block">Select Available Time Slot:</label>
                {rescheduleSlotLoading ? (
                  <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#1D4439]" />
                    <span>Checking availability...</span>
                  </div>
                ) : rescheduleSlots.length === 0 ? (
                  <div className="p-4 text-center text-xs text-amber-800 bg-amber-50 rounded-xl border border-amber-200">
                    No available time slots on this date. Please select another date or specialist.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                    {rescheduleSlots.map((slot) => {
                      const isSelected = rescheduleSelectedTime === slot.startTime;
                      return (
                        <button
                          key={slot.startTime}
                          type="button"
                          onClick={() => setRescheduleSelectedTime(slot.startTime)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-[#1D4439] text-white border-[#1D4439] shadow-2xs'
                              : 'bg-white text-slate-700 border-[#D3E0D9] hover:bg-slate-50'
                          }`}
                        >
                          {slot.displayTime || slot.startTime}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {rescheduleError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {rescheduleError}
                </div>
              )}

              {rescheduleSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{rescheduleSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleBooking(null)}
                  disabled={rescheduleLoading}
                  className="px-4 py-2.5 rounded-xl border border-[#D3E0D9] text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReschedule}
                  disabled={rescheduleLoading || !rescheduleSelectedTime}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-2xs transition-all cursor-pointer flex items-center space-x-1.5 ${
                    !rescheduleSelectedTime || rescheduleLoading
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-[#1D4439] hover:bg-[#143229]'
                  }`}
                >
                  {rescheduleLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Rescheduling...</span>
                    </>
                  ) : (
                    <span>Confirm Reschedule</span>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }
      {/* WRITE REVIEW MODAL */}
      {writeReviewBooking &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget && !reviewSubmitLoading) handleCloseReviewModal();
            }}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
          >
            <div
              className="bg-white rounded-3xl border border-[#D3E0D9] max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] flex flex-col my-auto animate-fade-in-scale"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                disabled={reviewSubmitLoading}
                onClick={handleCloseReviewModal}
                className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors z-10 cursor-pointer disabled:opacity-50"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="overflow-y-auto pr-1 space-y-5 flex-1">
                <div>
                  <h2 className="text-xl font-extrabold text-[#112C24] font-heading">
                    How was your experience?
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-sans">
                    Your honest feedback helps businesses improve and helps other customers.
                  </p>
                </div>

                {/* Appointment Context Box */}
                <div className="bg-[#F4F7F5] rounded-2xl p-4 border border-[#D3E0D9] space-y-1 text-xs">
                  <div className="font-extrabold text-[#112C24] text-sm">
                    {writeReviewBooking.business?.name || 'Service Business'}
                  </div>
                  <div className="text-slate-600 font-medium">
                    {writeReviewBooking.service?.name || 'Service'}
                    {writeReviewBooking.staff?.displayName || writeReviewBooking.staff?.user?.name
                      ? ` with ${writeReviewBooking.staff.displayName || writeReviewBooking.staff.user.name}`
                      : ''}
                  </div>
                  <div className="text-slate-500 text-[11px] flex items-center space-x-1 pt-1">
                    <Calendar className="w-3 h-3 text-[#1D4439]" />
                    <span>
                      {new Date(writeReviewBooking.startTime).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Star Rating Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#112C24] uppercase tracking-wider">
                    Rating <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const activeStar = reviewHoverRating || reviewRating;
                        const isFilled = star <= activeStar;
                        return (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setReviewHoverRating(star)}
                            onMouseLeave={() => setReviewHoverRating(0)}
                            onClick={() => {
                              setReviewRating(star);
                              setReviewSubmitError(null);
                            }}
                            className="p-1 cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                          >
                            <Star
                              className={`w-7 h-7 transition-colors ${
                                isFilled
                                  ? 'text-[#1D4439] fill-[#1D4439]'
                                  : 'text-slate-300 hover:text-[#1D4439]/60'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    <span className="text-xs font-bold text-[#1D4439] min-w-[110px]">
                      {RATING_DESCRIPTIONS[reviewHoverRating || reviewRating] || (
                        <span className="text-slate-400 font-normal text-[11px]">Select 1–5 stars</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Comment Textarea */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#112C24] uppercase tracking-wider">
                    Tell us about your experience <span className="text-slate-400 font-normal text-[11px] lowercase">(optional)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share what you liked about the service..."
                    className="w-full p-3.5 rounded-2xl border border-[#D3E0D9] text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D4439]/30 bg-white resize-none font-sans"
                  />
                </div>

                {/* Error Banner */}
                {reviewSubmitError && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 flex items-start space-x-2 animate-shake">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{reviewSubmitError}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={reviewSubmitLoading}
                  onClick={handleCloseReviewModal}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={reviewSubmitLoading}
                  onClick={handleSubmitReview}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1D4439] hover:bg-[#143229] transition-all shadow-2xs cursor-pointer flex items-center space-x-2 disabled:opacity-50"
                >
                  {reviewSubmitLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Review</span>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }

      {/* REVIEW SUCCESS MODAL */}
      {reviewSuccessData &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) handleCloseReviewModal();
            }}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
          >
            <div
              className="bg-white rounded-3xl border border-[#D3E0D9] max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-fade-in-scale my-auto text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-emerald-700" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-[#112C24] font-heading">
                  Thank you for your review!
                </h2>
                <p className="text-xs text-slate-500">
                  Your feedback has been submitted successfully.
                </p>
              </div>

              <div className="bg-[#F4F7F5] rounded-2xl p-4 border border-[#D3E0D9] text-xs text-left space-y-2">
                <div className="font-extrabold text-[#112C24]">
                  {reviewSuccessData.business?.name || 'Service Business'}
                </div>
                <div className="text-slate-600 font-medium">
                  {reviewSuccessData.booking?.service?.name || 'Service'}
                </div>
                <div className="flex items-center space-x-1 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= reviewSuccessData.rating
                          ? 'text-[#1D4439] fill-[#1D4439]'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                {reviewSuccessData.comment && (
                  <p className="text-slate-700 italic pt-1 border-t border-slate-200 font-sans">
                    "{reviewSuccessData.comment}"
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleCloseReviewModal}
                className="w-full bg-[#1D4439] hover:bg-[#143229] text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-2xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>,
          document.body
        )
      }
    </div>
  );
}
