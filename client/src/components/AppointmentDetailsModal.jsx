import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  X,
  User,
  Scissors,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Ban,
  HelpCircle,
  History,
  FileText
} from 'lucide-react';
import { apiRequest } from '../services/api';

export default function AppointmentDetailsModal({ booking, businessId, onClose, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  if (!booking) return null;

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest(`/businesses/${businessId}/bookings/${booking.id}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status: newStatus,
          reason: `Status changed to ${newStatus} by business owner`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update booking status.');
      }

      onRefresh && onRefresh();
      onClose();
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message || 'Failed to update appointment status.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Completed</span>
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-extrabold animate-pulse shadow-sm">
            <PlayCircle className="w-3.5 h-3.5" />
            <span>In Progress</span>
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Confirmed</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Confirmation</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-bold">
            <Ban className="w-3.5 h-3.5 text-slate-400" />
            <span>Cancelled</span>
          </span>
        );
      case 'NO_SHOW':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-full text-xs font-bold">
            <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>No Show</span>
          </span>
        );
      default:
        return null;
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-[#D5E4DC] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#123A32] text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#AEC5B8]">
              APPOINTMENT DETAILS
            </span>
            <h3 className="text-lg font-bold text-white font-heading">
              {booking.serviceName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[#102C26]">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Status & Time Header */}
          <div className="flex items-center justify-between p-4 bg-[#F4F9F6] border border-[#D5E4DC] rounded-2xl">
            <div className="flex items-center space-x-2.5">
              <Clock className="w-5 h-5 text-[#123A32]" />
              <div>
                <p className="text-xs font-bold text-[#123A32]">
                  {booking.startTimeFormatted} — {booking.endTimeFormatted}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Duration: {booking.durationMinutes || 45} mins
                </p>
              </div>
            </div>
            <div>{getStatusBadge(booking.status)}</div>
          </div>

          {/* Customer & Staff Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Card */}
            <div className="p-4 bg-white border border-[#E5EDE7] rounded-2xl space-y-2 shadow-2xs">
              <div className="flex items-center space-x-2 text-xs font-extrabold text-[#123A32]">
                <User className="w-4 h-4 text-[#123A32]" />
                <span>Customer Info</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{booking.customerName}</p>
                {booking.customerPhone && (
                  <p className="text-xs text-slate-500 font-medium">📞 {booking.customerPhone}</p>
                )}
                {booking.customerEmail && (
                  <p className="text-xs text-slate-500 font-medium">✉️ {booking.customerEmail}</p>
                )}
              </div>
            </div>

            {/* Staff Specialist Card */}
            <div className="p-4 bg-white border border-[#E5EDE7] rounded-2xl space-y-2 shadow-2xs">
              <div className="flex items-center space-x-2 text-xs font-extrabold text-[#123A32]">
                <UserCheck className="w-4 h-4 text-[#123A32]" />
                <span>Assigned Staff</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{booking.staffName}</p>
                <p className="text-xs text-slate-500 font-medium">Service Specialist</p>
              </div>
            </div>
          </div>

          {/* Service & Price Summary */}
          <div className="p-4 bg-white border border-[#E5EDE7] rounded-2xl flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-[#EEF6F1] rounded-xl text-[#123A32]">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{booking.serviceName}</p>
                <p className="text-xs text-slate-500 font-medium">Standard Service</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-bold uppercase block">Total Price</span>
              <span className="text-lg font-black text-[#123A32]">₹{booking.totalAmount}</span>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-800">
                <FileText className="w-4 h-4" />
                <span>Customer Notes</span>
              </div>
              <p className="text-xs text-amber-900 font-medium leading-relaxed">
                "{booking.notes}"
              </p>
            </div>
          )}

          {/* Status History Timeline */}
          {booking.statusHistory && booking.statusHistory.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-extrabold text-[#123A32]">
                <History className="w-4 h-4" />
                <span>Audit History</span>
              </div>
              <div className="space-y-2 pl-2 border-l-2 border-[#D5E4DC]">
                {booking.statusHistory.map((sh) => (
                  <div key={sh.id} className="text-xs space-y-0.5">
                    <p className="font-bold text-slate-800">
                      Status changed to <span className="text-[#123A32]">{sh.toStatus}</span> by {sh.changedByName}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">{sh.createdAtFormatted}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-5 bg-[#F8FAF9] border-t border-[#E5EDE7] flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
          >
            Close
          </button>

          {/* Status Lifecycle Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {booking.status === 'PENDING' && (
              <>
                <button
                  disabled={loading}
                  onClick={() => handleStatusChange('CONFIRMED')}
                  className="px-4 py-2 bg-[#123A32] text-white rounded-xl text-xs font-extrabold hover:bg-[#1A4B41] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Confirm Booking
                </button>
                <button
                  disabled={loading}
                  onClick={() => handleStatusChange('CANCELLED')}
                  className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel Booking
                </button>
              </>
            )}

            {booking.status === 'CONFIRMED' && (
              <>
                <button
                  disabled={loading}
                  onClick={() => handleStatusChange('IN_PROGRESS')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-extrabold hover:bg-emerald-700 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Start Service
                </button>
                <button
                  disabled={loading}
                  onClick={() => handleStatusChange('NO_SHOW')}
                  className="px-4 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  Mark No Show
                </button>
                <button
                  disabled={loading}
                  onClick={() => handleStatusChange('CANCELLED')}
                  className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            )}

            {booking.status === 'IN_PROGRESS' && (
              <button
                disabled={loading}
                onClick={() => handleStatusChange('COMPLETED')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-extrabold hover:bg-emerald-700 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                Mark Completed
              </button>
            )}

            {['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(booking.status) && (
              <span className="text-xs text-slate-500 font-bold italic">
                Finalized appointment status
              </span>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
