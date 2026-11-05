import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';
import { Users, UserCheck, Calendar, Clock, CheckCircle2, AlertCircle, Plus, Scissors, Trash2, Copy, Coffee, KeyRound } from 'lucide-react';
import PageHeader from './ui/PageHeader';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Select from './ui/Select';
import EmptyState from './ui/EmptyState';
import LoadingState from './ui/LoadingState';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getInitialStaffFormState = () => ({
  name: '',
  email: '',
  phone: '',
  displayName: '',
  bio: '',
  serviceIds: [],
  schedules: DAYS.map((_, index) => ({
    dayOfWeek: index,
    startTime: '09:00',
    endTime: '18:00',
    isAvailable: index >= 1 && index <= 6, // Mon-Sat default working
  })),
  breaks: [
    { id: 'b-1', startTime: '13:00', endTime: '14:00', label: 'Lunch Break' },
  ],
  timeOffs: [],
});

export default function StaffManagement({ business, currentUser }) {
  const [staffList, setStaffList] = useState([]);
  const [businessMembers, setBusinessMembers] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTempPasswordInfo, setCreatedTempPasswordInfo] = useState(null);

  // Modals
  const [createStaffModalOpen, setCreateStaffModalOpen] = useState(false);
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [timeOffModalOpen, setTimeOffModalOpen] = useState(false);

  // Forms
  const [staffForm, setStaffForm] = useState(getInitialStaffFormState());
  const [assignedServiceIds, setAssignedServiceIds] = useState([]);
  const [schedulesForm, setSchedulesForm] = useState(
    DAYS.map((_, index) => ({
      dayOfWeek: index,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: index >= 1 && index <= 5, // Mon-Fri default
    }))
  );
  const [timeOffForm, setTimeOffForm] = useState({
    startDateTime: '',
    endDateTime: '',
    reason: '',
  });

  const role = business?.currentUserRole || 'STAFF';
  const canManage = role === 'OWNER' || role === 'ADMIN';

  const fetchData = useCallback(async () => {
    if (!business?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [staffRes, svcRes] = await Promise.all([
        apiRequest(`/businesses/${business.id}/staff`),
        apiRequest(`/businesses/${business.id}/services`),
      ]);

      const [staffData, svcData] = await Promise.all([staffRes.json(), svcRes.json()]);

      if (staffRes.ok) setStaffList(staffData.data || []);
      if (svcRes.ok) setAllServices(svcData.data || []);

      if (canManage) {
        const memRes = await apiRequest(`/businesses/${business.id}/members`);
        if (memRes.ok) {
          const memData = await memRes.json();
          setBusinessMembers(memData.data || []);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [business?.id, canManage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenServicesModal = (staff) => {
    setSelectedStaff(staff);
    const existingIds = staff.staffServices ? staff.staffServices.map((s) => s.service.id) : [];
    setAssignedServiceIds(existingIds);
    setServicesModalOpen(true);
  };

  const handleSaveServices = async (e) => {
    e.preventDefault();
    try {
      const res = await apiRequest(`/businesses/${business.id}/staff/${selectedStaff.id}/services`, {
        method: 'PUT',
        body: JSON.stringify({ serviceIds: assignedServiceIds }),
      });
      if (res.ok) {
        setActionSuccess(`Service assignments updated for ${selectedStaff.displayName}`);
        setServicesModalOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        throw new Error(data.message);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenScheduleModal = async (staff) => {
    setSelectedStaff(staff);
    try {
      const res = await apiRequest(`/businesses/${business.id}/staff/${staff.id}/schedule`);
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0) {
          const updated = DAYS.map((_, index) => {
            const found = data.data.find((s) => s.dayOfWeek === index);
            return (
              found || {
                dayOfWeek: index,
                startTime: '09:00',
                endTime: '17:00',
                isAvailable: false,
              }
            );
          });
          setSchedulesForm(updated);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    try {
      const res = await apiRequest(`/businesses/${business.id}/staff/${selectedStaff.id}/schedule`, {
        method: 'PUT',
        body: JSON.stringify({ schedules: schedulesForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setActionSuccess(`Weekly schedule updated for ${selectedStaff.displayName}`);
      setScheduleModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await apiRequest(`/businesses/${business.id}/staff`, {
        method: 'POST',
        body: JSON.stringify(staffForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      if (data.data?.temporaryPassword) {
        setCreatedTempPasswordInfo({
          name: data.data?.displayName || staffForm.name,
          email: data.data?.businessMember?.user?.email || staffForm.email,
          tempPassword: data.data.temporaryPassword,
        });
      }

      setActionSuccess(`Staff member ${data.data?.displayName || staffForm.name} added successfully.`);
      setCreateStaffModalOpen(false);
      setStaffForm(getInitialStaffFormState());
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTimeOff = async (e) => {
    e.preventDefault();
    try {
      const res = await apiRequest(`/businesses/${business.id}/staff/${selectedStaff.id}/time-off`, {
        method: 'POST',
        body: JSON.stringify(timeOffForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setActionSuccess(`Time-off recorded for ${selectedStaff.displayName}`);
      setTimeOffModalOpen(false);
      setTimeOffForm({ startDateTime: '', endDateTime: '', reason: '' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        subtitle="Manage your team and availability"
        actions={
          canManage && (
            <Button size="sm" onClick={() => setCreateStaffModalOpen(true)} icon={Plus}>
              Add Staff
            </Button>
          )
        }
      />

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {createdTempPasswordInfo && (
        <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 shadow-2xs space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-amber-700" />
              <h4 className="text-sm font-bold text-amber-950">Staff Account Created — Temporary Password</h4>
            </div>
            <button
              onClick={() => setCreatedTempPasswordInfo(null)}
              className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-amber-900 font-medium">
            A new staff account was set up for <strong className="font-bold">{createdTempPasswordInfo.name}</strong> ({createdTempPasswordInfo.email}).
          </p>
          <div className="bg-white p-3 rounded-lg border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block font-mono">
                Temporary password — share securely with the staff member
              </span>
              <code className="text-sm font-extrabold font-mono text-slate-900 tracking-wider">
                {createdTempPasswordInfo.tempPassword}
              </code>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(createdTempPasswordInfo.tempPassword);
                alert('Temporary password copied to clipboard!');
              }}
              icon={Copy}
            >
              Copy Password
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-900 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Staff Roster Grid */}
      {loading ? (
        <LoadingState message="Loading staff directory..." />
      ) : staffList.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No staff yet"
          description="Add team members to start managing your staff."
          actionLabel="Add Staff"
          actionIcon={Plus}
          onAction={canManage ? () => setCreateStaffModalOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {staffList.map((st) => (
            <div key={st.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">{st.displayName}</h3>
                    <p className="text-xs text-slate-500 font-mono">{st.businessMember?.user?.email}</p>
                  </div>
                  <Badge variant={st.isActive ? 'emerald' : 'slate'}>
                    {st.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {st.bio && <p className="text-xs text-slate-600 mt-2 italic">"{st.bio}"</p>}

                {/* Assigned Services Tags */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 font-mono">Assigned Services:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {st.staffServices && st.staffServices.length > 0 ? (
                      st.staffServices.map((ss) => (
                        <Badge key={ss.service.id} variant="blue" size="sm">
                          {ss.service.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No services assigned</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                {canManage && (
                  <Button size="sm" variant="outline" onClick={() => handleOpenServicesModal(st)} icon={Scissors}>
                    Services ({st.staffServices?.length || 0})
                  </Button>
                )}

                <Button size="sm" variant="outline" onClick={() => handleOpenScheduleModal(st)} icon={Clock}>
                  Weekly Schedule
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedStaff(st);
                    setTimeOffModalOpen(true);
                  }}
                  icon={Calendar}
                >
                  Time Off
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Member Onboarding Modal */}
      <Modal
        isOpen={createStaffModalOpen}
        onClose={() => !isSubmitting && setCreateStaffModalOpen(false)}
        title="Add Staff Member"
        subtitle="Set up your team member and their availability."
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateStaff} className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
          {/* SECTION 1 — BASIC INFORMATION */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>1. Basic Information</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Full Name *"
                type="text"
                required
                value={staffForm.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setStaffForm((prev) => ({
                    ...prev,
                    name: val,
                    displayName: prev.displayName === prev.name || !prev.displayName ? val : prev.displayName,
                  }));
                }}
                placeholder="e.g. Kiran Kumar"
              />

              <Input
                label="Email *"
                type="email"
                required
                value={staffForm.email}
                onChange={(e) => setStaffForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="e.g. kiran.test@servicehub.local"
              />

              <Input
                label="Phone"
                type="tel"
                value={staffForm.phone}
                onChange={(e) => setStaffForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="e.g. 9000000000"
              />

              <Input
                label="Display Name (optional)"
                type="text"
                value={staffForm.displayName}
                onChange={(e) => setStaffForm((prev) => ({ ...prev, displayName: e.target.value }))}
                placeholder="Defaults to Full Name"
              />
            </div>

            <div className="space-y-1 pt-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">Bio</label>
              <textarea
                rows={2}
                value={staffForm.bio}
                onChange={(e) => setStaffForm((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="e.g. Hair and wellness specialist..."
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all resize-none"
              />
            </div>
          </div>

          {/* SECTION 2 — SERVICES */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <Scissors className="w-4 h-4 text-emerald-700" />
                <span>2. Services Provided</span>
              </h4>
              <span className="text-[11px] text-slate-500 italic">Select services this staff member can perform</span>
            </div>

            {allServices.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-2 bg-white rounded-lg border border-slate-200">
                No services registered in business catalog yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-slate-200 max-h-40 overflow-y-auto">
                {allServices.map((svc) => {
                  const isChecked = (staffForm.serviceIds || []).includes(svc.id);
                  return (
                    <label key={svc.id} className="flex items-center space-x-2.5 text-xs text-slate-800 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setStaffForm((prev) => ({ ...prev, serviceIds: [...(prev.serviceIds || []), svc.id] }));
                          } else {
                            setStaffForm((prev) => ({ ...prev, serviceIds: (prev.serviceIds || []).filter((id) => id !== svc.id) }));
                          }
                        }}
                        className="rounded text-emerald-700 focus:ring-emerald-600"
                      />
                      <span className="font-semibold">{svc.name}</span>
                      <span className="text-slate-400 font-mono text-[11px]">(₹{parseFloat(svc.price).toFixed(0)})</span>
                    </label>
                  );
                })}
              </div>
            )}

            {(!staffForm.serviceIds || staffForm.serviceIds.length === 0) && (
              <p className="text-[11px] text-amber-700 font-semibold bg-amber-50 border border-amber-200 p-2 rounded-lg">
                ⚠️ Assigning at least 1 service is recommended so customers can book this staff member.
              </p>
            )}
          </div>

          {/* SECTION 3 — WORKING HOURS */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>3. Working Hours</span>
              </h4>

              <button
                type="button"
                onClick={() => {
                  const mon = (staffForm.schedules || []).find((s) => s.dayOfWeek === 1);
                  if (!mon) return;
                  setStaffForm((prev) => ({
                    ...prev,
                    schedules: (prev.schedules || []).map((s) =>
                      s.isAvailable
                        ? { ...s, startTime: mon.startTime, endTime: mon.endTime }
                        : s
                    ),
                  }));
                }}
                className="text-[11px] text-emerald-800 font-bold hover:underline flex items-center space-x-1"
              >
                <Copy className="w-3 h-3" />
                <span>Copy Monday to all working days</span>
              </button>
            </div>

            <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
              {(staffForm.schedules || []).map((sch, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/60 border border-slate-100 text-xs">
                  <label className="flex items-center space-x-2 font-semibold text-slate-800 w-28 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sch.isAvailable}
                      onChange={(e) => {
                        const updated = [...(staffForm.schedules || [])];
                        updated[idx].isAvailable = e.target.checked;
                        setStaffForm((prev) => ({ ...prev, schedules: updated }));
                      }}
                      className="rounded text-emerald-700 focus:ring-emerald-600"
                    />
                    <span>{DAYS[sch.dayOfWeek]}</span>
                  </label>

                  {sch.isAvailable ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={sch.startTime}
                        onChange={(e) => {
                          const updated = [...(staffForm.schedules || [])];
                          updated[idx].startTime = e.target.value;
                          setStaffForm((prev) => ({ ...prev, schedules: updated }));
                        }}
                        className="bg-white border border-slate-200 rounded-md px-2 py-1 font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                      <span className="text-slate-400">—</span>
                      <input
                        type="time"
                        value={sch.endTime}
                        onChange={(e) => {
                          const updated = [...(staffForm.schedules || [])];
                          updated[idx].endTime = e.target.value;
                          setStaffForm((prev) => ({ ...prev, schedules: updated }));
                        }}
                        className="bg-white border border-slate-200 rounded-md px-2 py-1 font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                    </div>
                  ) : (
                    <span className="text-slate-400 italic px-3 py-1 bg-slate-100 rounded-md text-[11px]">Off Day</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4 — BREAKS */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <Coffee className="w-4 h-4 text-emerald-700" />
                <span>4. Recurring Breaks</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setStaffForm((prev) => ({
                    ...prev,
                    breaks: [
                      ...(prev.breaks || []),
                      { id: Date.now(), startTime: '13:00', endTime: '14:00', label: 'Lunch Break' },
                    ],
                  }));
                }}
                className="text-[11px] text-emerald-800 font-bold hover:underline flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Break</span>
              </button>
            </div>

            {(staffForm.breaks || []).length === 0 ? (
              <p className="text-xs text-slate-400 italic p-2 bg-white rounded-lg border border-slate-200">
                No breaks configured.
              </p>
            ) : (
              <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                {(staffForm.breaks || []).map((br, idx) => (
                  <div key={br.id || idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50/80 border border-slate-200 text-xs">
                    <input
                      type="text"
                      value={br.label}
                      onChange={(e) => {
                        const updated = [...(staffForm.breaks || [])];
                        updated[idx].label = e.target.value;
                        setStaffForm((prev) => ({ ...prev, breaks: updated }));
                      }}
                      placeholder="e.g. Lunch Break"
                      className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 flex-1 focus:ring-1 focus:ring-emerald-600"
                    />

                    <div className="flex items-center space-x-1 font-mono">
                      <input
                        type="time"
                        value={br.startTime}
                        onChange={(e) => {
                          const updated = [...(staffForm.breaks || [])];
                          updated[idx].startTime = e.target.value;
                          setStaffForm((prev) => ({ ...prev, breaks: updated }));
                        }}
                        className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs"
                      />
                      <span className="text-slate-400">—</span>
                      <input
                        type="time"
                        value={br.endTime}
                        onChange={(e) => {
                          const updated = [...(staffForm.breaks || [])];
                          updated[idx].endTime = e.target.value;
                          setStaffForm((prev) => ({ ...prev, breaks: updated }));
                        }}
                        className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setStaffForm((prev) => ({
                          ...prev,
                          breaks: (prev.breaks || []).filter((_, i) => i !== idx),
                        }));
                      }}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 5 — INITIAL TIME OFF (OPTIONAL) */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <span>5. Initial Time Off (Optional)</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setStaffForm((prev) => ({
                    ...prev,
                    timeOffs: [
                      ...(prev.timeOffs || []),
                      { id: Date.now(), startDateTime: '', endDateTime: '', reason: '' },
                    ],
                  }));
                }}
                className="text-[11px] text-emerald-800 font-bold hover:underline flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Time Off</span>
              </button>
            </div>

            {(staffForm.timeOffs || []).length === 0 ? (
              <p className="text-xs text-slate-400 italic p-2 bg-white rounded-lg border border-slate-200">
                No initial time off scheduled.
              </p>
            ) : (
              <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                {(staffForm.timeOffs || []).map((to, idx) => (
                  <div key={to.id || idx} className="space-y-2 p-2 rounded-lg bg-slate-50/80 border border-slate-200 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-sans font-semibold mb-0.5">Start Date & Time</label>
                        <input
                          type="datetime-local"
                          value={to.startDateTime}
                          onChange={(e) => {
                            const updated = [...(staffForm.timeOffs || [])];
                            updated[idx].startDateTime = e.target.value;
                            setStaffForm((prev) => ({ ...prev, timeOffs: updated }));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-sans font-semibold mb-0.5">End Date & Time</label>
                        <input
                          type="datetime-local"
                          value={to.endDateTime}
                          onChange={(e) => {
                            const updated = [...(staffForm.timeOffs || [])];
                            updated[idx].endDateTime = e.target.value;
                            setStaffForm((prev) => ({ ...prev, timeOffs: updated }));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={to.reason}
                        onChange={(e) => {
                          const updated = [...(staffForm.timeOffs || [])];
                          updated[idx].reason = e.target.value;
                          setStaffForm((prev) => ({ ...prev, timeOffs: updated }));
                        }}
                        placeholder="Reason (e.g. Vacation / Personal Leave)"
                        className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 flex-1 focus:ring-1 focus:ring-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setStaffForm((prev) => ({
                            ...prev,
                            timeOffs: (prev.timeOffs || []).filter((_, i) => i !== idx),
                          }));
                        }}
                        className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FORM FOOTER ACTIONS */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
            <Button
              variant="outline"
              type="button"
              disabled={isSubmitting}
              onClick={() => setCreateStaffModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#123A32] hover:bg-[#173F35] text-white"
            >
              {isSubmitting ? 'Creating Staff...' : 'Create Staff'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Staff Service Assignments Modal */}
      <Modal
        isOpen={servicesModalOpen}
        onClose={() => setServicesModalOpen(false)}
        title={`Assign Services: ${selectedStaff?.displayName}`}
        subtitle="Select services this staff member can perform."
      >
        <form onSubmit={handleSaveServices} className="space-y-4">
          <div className="max-h-60 overflow-y-auto space-y-2 p-3 border border-slate-200 rounded-xl bg-slate-50/70">
            {allServices.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No services registered in business catalog.</p>
            ) : (
              allServices.map((svc) => {
                const isChecked = assignedServiceIds.includes(svc.id);
                return (
                  <label key={svc.id} className="flex items-center space-x-2.5 text-xs text-slate-800 cursor-pointer p-1.5 rounded-lg hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAssignedServiceIds((prev) => [...prev, svc.id]);
                        } else {
                          setAssignedServiceIds((prev) => prev.filter((id) => id !== svc.id));
                        }
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold">{svc.name}</span>
                    <span className="text-emerald-700 font-mono font-bold">(₹{parseFloat(svc.price).toFixed(0)})</span>
                  </label>
                );
              })
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={() => setServicesModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Assignments
            </Button>
          </div>
        </form>
      </Modal>

      {/* Weekly Schedule Editor Modal */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title={`Weekly Schedule: ${selectedStaff?.displayName}`}
      >
        <form onSubmit={handleSaveSchedule} className="space-y-4">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {schedulesForm.map((sch, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 flex items-center justify-between text-xs">
                <label className="flex items-center space-x-2 font-semibold text-slate-800 w-28 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sch.isAvailable}
                    onChange={(e) => {
                      const updated = [...schedulesForm];
                      updated[idx].isAvailable = e.target.checked;
                      setSchedulesForm(updated);
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{DAYS[sch.dayOfWeek]}</span>
                </label>

                {sch.isAvailable ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="time"
                      value={sch.startTime}
                      onChange={(e) => {
                        const updated = [...schedulesForm];
                        updated[idx].startTime = e.target.value;
                        setSchedulesForm(updated);
                      }}
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
                    />
                    <span className="text-slate-400">—</span>
                    <input
                      type="time"
                      value={sch.endTime}
                      onChange={(e) => {
                        const updated = [...schedulesForm];
                        updated[idx].endTime = e.target.value;
                        setSchedulesForm(updated);
                      }}
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
                    />
                  </div>
                ) : (
                  <span className="text-slate-400 italic font-mono">Off</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={() => setScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Schedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Time-Off Manager Modal */}
      <Modal
        isOpen={timeOffModalOpen}
        onClose={() => setTimeOffModalOpen(false)}
        title={`Time-Off: ${selectedStaff?.displayName}`}
      >
        <form onSubmit={handleCreateTimeOff} className="space-y-4">
          <Input
            label="Start Date & Time"
            type="datetime-local"
            required
            value={timeOffForm.startDateTime}
            onChange={(e) => setTimeOffForm((prev) => ({ ...prev, startDateTime: e.target.value }))}
          />

          <Input
            label="End Date & Time"
            type="datetime-local"
            required
            value={timeOffForm.endDateTime}
            onChange={(e) => setTimeOffForm((prev) => ({ ...prev, endDateTime: e.target.value }))}
          />

          <Input
            label="Reason"
            type="text"
            value={timeOffForm.reason}
            onChange={(e) => setTimeOffForm((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="e.g. Vacation / Personal leave"
          />

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={() => setTimeOffModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Record Time Off
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
