import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  UserCheck,
  Scissors,
  CheckCircle2,
  PlayCircle,
  AlertCircle,
  Coffee,
  Sparkles,
  ChevronRight,
  UserPlus,
  HelpCircle,
  Ban
} from 'lucide-react';
import AppointmentDetailsModal from './AppointmentDetailsModal';

export default function TodayScheduleTimeline({ todaysSchedule, businessId, onNavigate, onRefresh }) {
  const [selectedBooking, setSelectedBooking] = useState(null);

  const items = todaysSchedule?.items || [];
  const hasStaff = todaysSchedule?.hasStaff !== false;
  const summary = todaysSchedule?.summary || {};

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full text-[11px] font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Completed</span>
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-[#123A32] text-white rounded-full text-[11px] font-extrabold animate-pulse shadow-2xs">
            <PlayCircle className="w-3 h-3 text-emerald-300" />
            <span>In Progress</span>
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200/80 rounded-full text-[11px] font-bold">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>Confirmed</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-full text-[11px] font-bold">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            <span>Pending</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200/80 rounded-full text-[11px] font-semibold line-through">
            <Ban className="w-3 h-3 text-slate-400" />
            <span>Cancelled</span>
          </span>
        );
      case 'NO_SHOW':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-rose-50 text-rose-800 border border-rose-200/80 rounded-full text-[11px] font-bold">
            <HelpCircle className="w-3 h-3 text-rose-600" />
            <span>No Show</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#D5E4DC] p-5 sm:p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-black text-[#102C26] font-heading">
              Today's Schedule
            </h3>
            {summary.inProgressCount > 0 && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                {summary.inProgressCount} Active Now
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Chronological operational timeline of today's bookings & team availability.
          </p>
        </div>

        <button
          onClick={() => onNavigate && onNavigate('calendar')}
          className="inline-flex items-center space-x-1 text-xs font-bold text-[#123A32] hover:text-[#1A4B41] transition-colors cursor-pointer group"
        >
          <span>View Calendar</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Timeline List */}
      {items.length === 0 ? (
        /* Empty State */
        <div className="p-8 text-center bg-[#F8FAF9] rounded-2xl border border-dashed border-[#CBDCD3] space-y-3">
          <div className="w-12 h-12 mx-auto bg-[#EEF6F1] rounded-2xl flex items-center justify-center text-[#123A32]">
            <Calendar className="w-6 h-6" />
          </div>
          {!hasStaff ? (
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#102C26]">No staff members yet.</h4>
              <p className="text-xs text-slate-500">
                Add your first team member to set schedules and accept appointments.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate && onNavigate('staff')}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-[#123A32] text-white text-xs font-bold rounded-xl hover:bg-[#1A4B41] transition-all shadow-2xs cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Staff Member</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#102C26]">No appointments scheduled today.</h4>
              <p className="text-xs text-slate-500">Your team has no bookings for today.</p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate && onNavigate('bookings')}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-[#123A32] text-white text-xs font-bold rounded-xl hover:bg-[#1A4B41] transition-all shadow-2xs cursor-pointer"
                >
                  <span>View Calendar</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Timeline Items */
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#D5E4DC]">
          {items.map((item) => {
            const itemKey = item.key || `${item.type}-${item.id}`;

            if (item.type === 'BOOKING') {
              const isCompleted = item.status === 'COMPLETED';
              const isCancelled = item.status === 'CANCELLED';

              return (
                <div key={itemKey} className="relative group">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-6 sm:-left-8 top-3 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                    item.isNow
                      ? 'border-emerald-600 ring-4 ring-emerald-100 bg-emerald-600'
                      : isCompleted
                      ? 'border-emerald-500 bg-emerald-50'
                      : isCancelled
                      ? 'border-slate-300 bg-slate-100'
                      : 'border-[#123A32]'
                  }`}>
                    {item.isNow && <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />}
                  </div>

                  {/* Booking Card */}
                  <div
                    onClick={() => setSelectedBooking(item)}
                    className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      item.isNow
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-md ring-1 ring-emerald-400/30'
                        : isCompleted
                        ? 'bg-slate-50/60 border-slate-200/80 opacity-85 hover:opacity-100'
                        : isCancelled
                        ? 'bg-slate-50/40 border-slate-200/50 opacity-60'
                        : 'bg-white border-[#E5EDE7] hover:border-[#123A32] shadow-2xs hover:shadow-sm'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 mb-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-[#123A32] flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-[#123A32]" />
                          <span>{item.startTimeFormatted}</span>
                        </span>
                        {item.isNow && (
                          <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-black tracking-wide animate-pulse">
                            ● NOW
                          </span>
                        )}
                      </div>
                      <div>{getStatusBadge(item.status)}</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {/* Service */}
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-[#EEF6F1] rounded-lg text-[#123A32]">
                          <Scissors className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Service</p>
                          <p className="font-bold text-slate-900 truncate">{item.serviceName}</p>
                        </div>
                      </div>

                      {/* Customer */}
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-blue-50 rounded-lg text-blue-700">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Customer</p>
                          <p className="font-bold text-slate-900 truncate">{item.customerName}</p>
                        </div>
                      </div>

                      {/* Staff */}
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-purple-50 rounded-lg text-purple-700">
                          <UserCheck className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Staff</p>
                          <p className="font-bold text-slate-900 truncate">{item.staffName}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            if (item.type === 'BREAK') {
              return (
                <div key={itemKey} className="relative">
                  <div className="absolute -left-6 sm:-left-8 top-3 w-4 h-4 rounded-full border-2 border-amber-400 bg-amber-50" />
                  <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5 text-amber-900 font-bold">
                      <Coffee className="w-4 h-4 text-amber-700" />
                      <span>{item.startTimeFormatted} — {item.endTimeFormatted}</span>
                      <span className="font-normal text-amber-800">({item.label})</span>
                    </div>
                    <span className="text-[11px] text-amber-700 font-medium">
                      {item.staffName}
                    </span>
                  </div>
                </div>
              );
            }

            if (item.type === 'TIMEOFF') {
              return (
                <div key={itemKey} className="relative">
                  <div className="absolute -left-6 sm:-left-8 top-3 w-4 h-4 rounded-full border-2 border-purple-400 bg-purple-50" />
                  <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5 text-purple-900 font-bold">
                      <Clock className="w-4 h-4 text-purple-700" />
                      <span>{item.startTimeFormatted} — {item.endTimeFormatted}</span>
                      <span className="font-normal text-purple-800">({item.reason})</span>
                    </div>
                    <span className="text-[11px] text-purple-700 font-extrabold">
                      {item.staffName} • Time Off
                    </span>
                  </div>
                </div>
              );
            }

            if (item.type === 'FREE_SLOT') {
              return (
                <div key={itemKey} className="relative">
                  <div className="absolute -left-6 sm:-left-8 top-3 w-4 h-4 rounded-full border-2 border-dashed border-[#AEC5B8] bg-[#EEF6F1]" />
                  <div className="p-3 bg-[#F4F9F6] border border-dashed border-[#AEC5B8] rounded-2xl flex items-center justify-between text-xs text-[#123A32]">
                    <div className="flex items-center space-x-2 font-bold">
                      <Sparkles className="w-4 h-4 text-[#123A32]" />
                      <span>{item.startTimeFormatted}</span>
                      <span className="font-medium text-slate-600">— Free Slot</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#123A32] bg-[#AEC5B8]/30 px-2 py-0.5 rounded-full">
                      {item.availableStaffCount} staff available
                    </span>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <AppointmentDetailsModal
          booking={selectedBooking}
          businessId={businessId}
          onClose={() => setSelectedBooking(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}
