import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';
import {
  Users,
  Search,
  Plus,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
  Trash2,
  Clock,
  UserCheck,
  Scissors,
  Star,
  RefreshCw,
  Filter,
  ArrowRight,
  History
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

export default function CustomerManagement({ selectedBusiness, currentUser, initialActivityFilter = 'all' }) {
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({
    totalCustomers: 0,
    newCustomers: 0,
    returningCustomers: 0,
    inactiveCustomers: 0,
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [activityFilter, setActivityFilter] = useState(initialActivityFilter || 'all');

  // Modals & Drawers
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewCustomerDrawerOpen, setViewCustomerDrawerOpen] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'notes' | 'reviews'

  // Forms
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
  });

  const [noteContent, setNoteContent] = useState('');

  const role = selectedBusiness?.currentUserRole || 'STAFF';
  const canDeleteCustomer = role === 'OWNER' || role === 'ADMIN';

  const fetchCustomers = useCallback(async (page = 1) => {
    if (!selectedBusiness?.id) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status: statusFilter,
        activity: activityFilter,
      });
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const res = await apiRequest(`/businesses/${selectedBusiness.id}/customers?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to fetch customer directory.');

      setCustomers(data.data || []);
      if (data.summary) setSummary(data.summary);
      if (data.pagination) setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedBusiness?.id, statusFilter, activityFilter, searchTerm]);

  useEffect(() => {
    fetchCustomers(1);
  }, [fetchCustomers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers(1);
  };

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setCustomerForm({ name: '', email: '', phone: '', address: '', dateOfBirth: '' });
    setCustomerModalOpen(true);
  };

  const handleOpenEditModal = (cust) => {
    setEditingCustomer(cust);
    setCustomerForm({
      name: cust.name,
      email: cust.email || '',
      phone: cust.phone || '',
      address: cust.address || '',
      dateOfBirth: cust.dateOfBirth ? cust.dateOfBirth.split('T')[0] : '',
    });
    setCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    setError(null);
    setActionSuccess(null);

    const payload = {
      name: customerForm.name,
      email: customerForm.email || undefined,
      phone: customerForm.phone || undefined,
      address: customerForm.address || undefined,
      dateOfBirth: customerForm.dateOfBirth || undefined,
    };

    try {
      const endpoint = editingCustomer
        ? `/businesses/${selectedBusiness.id}/customers/${editingCustomer.id}`
        : `/businesses/${selectedBusiness.id}/customers`;
      const method = editingCustomer ? 'PATCH' : 'POST';

      const res = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to save customer.');

      setActionSuccess(editingCustomer ? `Updated '${data.data.name}'` : `Created customer record for '${data.data.name}'`);
      setCustomerModalOpen(false);
      fetchCustomers(pagination.page);

      if (activeCustomer && activeCustomer.id === data.data.id) {
        setActiveCustomer((prev) => ({ ...prev, ...data.data }));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeactivateCustomer = async (cust) => {
    if (!confirm(`Deactivate customer '${cust.name}'?`)) return;
    try {
      const res = await apiRequest(`/businesses/${selectedBusiness.id}/customers/${cust.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setActionSuccess(`Customer '${cust.name}' deactivated.`);
        fetchCustomers(pagination.page);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewCustomerProfile = async (cust) => {
    try {
      const res = await apiRequest(`/businesses/${selectedBusiness.id}/customers/${cust.id}`);
      const data = await res.json();
      if (res.ok) {
        setActiveCustomer(data.data);
        setActiveTab('history');
        setViewCustomerDrawerOpen(true);
      } else {
        alert(data.message || 'Failed to load profile.');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim() || !activeCustomer) return;

    try {
      const res = await apiRequest(`/businesses/${selectedBusiness.id}/customers/${activeCustomer.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content: noteContent.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add note.');

      setNoteContent('');
      handleViewCustomerProfile(activeCustomer);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Delete this internal note?')) return;
    try {
      const res = await apiRequest(`/businesses/${selectedBusiness.id}/customers/${activeCustomer.id}/notes/${noteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        handleViewCustomerProfile(activeCustomer);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return 'No previous visit';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 text-[#173F35] font-sans pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D5E4DC]">
        <div>
          <h1 className="text-2xl font-black text-[#173F35] tracking-tight font-heading">
            Customers & CRM
          </h1>
          <p className="text-xs text-[#61766F] font-medium mt-0.5">
            Client directory, past appointment histories, upcoming visits, service preferences, and internal notes.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button size="sm" onClick={handleOpenAddModal} icon={Plus}>
            Add Customer
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
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchCustomers(1)} className="text-xs font-bold text-rose-700 underline cursor-pointer">
            Try Again
          </button>
        </div>
      )}

      {/* 4 Customer Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#D5E4DC] shadow-2xs space-y-1">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#61766F]">Total Customers</div>
          <div className="text-2xl font-black text-[#173F35] tracking-tight font-heading">{summary.totalCustomers}</div>
          <div className="text-[10px] text-[#61766F] font-semibold">Registered business client directory</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#D5E4DC] shadow-2xs space-y-1">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#61766F]">New Customers</div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight font-heading">{summary.newCustomers}</div>
          <div className="text-[10px] text-[#61766F] font-semibold">Single visit or recent sign-ups</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#D5E4DC] shadow-2xs space-y-1">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#61766F]">Returning Customers</div>
          <div className="text-2xl font-black text-[#123A32] tracking-tight font-heading">{summary.returningCustomers}</div>
          <div className="text-[10px] text-[#61766F] font-semibold">Repeat client visits ({summary.totalCustomers > 0 ? Math.round((summary.returningCustomers / summary.totalCustomers) * 100) : 0}%)</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#D5E4DC] shadow-2xs space-y-1">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#61766F]">Inactive Customers</div>
          <div className="text-2xl font-black text-amber-700 tracking-tight font-heading">{summary.inactiveCustomers}</div>
          <div className="text-[10px] text-[#61766F] font-semibold">No past visit in past 30 days</div>
        </div>
      </div>

      {/* Toolbar: Search, Activity Pills & Status Filters */}
      <div className="bg-white rounded-2xl border border-[#D5E4DC] shadow-2xs p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#61766F] absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customers by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2 bg-[#F7FAFA] border border-[#D5E4DC] rounded-xl text-xs text-[#173F35] placeholder-[#8C9E96] focus:outline-none focus:ring-2 focus:ring-[#123A32] transition-all"
            />
          </form>

          {/* Activity Pills Switcher */}
          <div className="inline-flex p-1 bg-[#EEF6F1] border border-[#D5E4DC] rounded-xl text-xs font-extrabold shadow-2xs w-full sm:w-auto justify-center">
            {['all', 'new', 'returning', 'inactive'].map((act) => (
              <button
                key={act}
                onClick={() => setActivityFilter(act)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  activityFilter === act ? 'bg-[#123A32] text-white shadow-2xs' : 'text-[#61766F] hover:text-[#173F35]'
                }`}
              >
                {act}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#E6EFEA] text-xs">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-[#61766F]" />
            <span className="font-bold text-[#61766F]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1 bg-white border border-[#D5E4DC] rounded-xl text-xs font-bold text-[#173F35] cursor-pointer focus:ring-2 focus:ring-[#123A32]"
            >
              <option value="active">Active Directory</option>
              <option value="inactive">Deactivated</option>
              <option value="all">All Records</option>
            </select>
          </div>

          {(activityFilter !== 'all' || statusFilter !== 'active' || searchTerm.trim() !== '') && (
            <button
              onClick={() => {
                setActivityFilter('all');
                setStatusFilter('active');
                setSearchTerm('');
              }}
              className="text-xs font-extrabold text-[#123A32] underline hover:text-emerald-800 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Customer Directory Roster Table */}
      <div className="bg-white rounded-2xl border border-[#D5E4DC] shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8">
            <LoadingState message="Loading customer directory..." />
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-[#AEC5B8] mx-auto opacity-70" />
            <h3 className="text-base font-extrabold text-[#173F35]">No customers yet.</h3>
            <p className="text-xs text-[#61766F] max-w-sm mx-auto">
              Customers will appear here as your business starts receiving bookings.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-[#123A32] text-white rounded-xl text-xs font-extrabold hover:bg-[#1A4B41] transition-all cursor-pointer shadow-2xs inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EEF6F1] border-b border-[#D5E4DC] text-xs font-bold text-[#123A32]">
                  <th className="py-3.5 px-5">Customer</th>
                  <th className="py-3.5 px-5">Contact</th>
                  <th className="py-3.5 px-5">Last Appointment</th>
                  <th className="py-3.5 px-5">Appointments / Visits</th>
                  <th className="py-3.5 px-5">Returning</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EFEA] text-xs font-sans">
                {customers.map((cust) => {
                  const lastBooking = cust.lastBooking;
                  const nextBooking = cust.nextBooking;
                  const apptsCount = cust.appointmentsCount ?? cust._count?.bookings ?? 0;
                  const visitsCount = cust.visitsCount ?? 0;

                  return (
                    <tr key={cust.id} className="hover:bg-[#F9FCFA] transition-colors">
                      {/* Customer Name & Address */}
                      <td className="py-3.5 px-5">
                        <div className="font-extrabold text-[#173F35] text-xs">{cust.name}</div>
                        {cust.address && (
                          <div className="text-[11px] text-[#61766F] font-medium truncate max-w-xs mt-0.5">
                            📍 {cust.address}
                          </div>
                        )}
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-5">
                        <div className="font-mono text-xs text-[#173F35] font-bold">
                          {cust.email || <span className="text-[#8C9E96] italic font-sans">No email</span>}
                        </div>
                        <div className="font-mono text-[11px] text-[#61766F] mt-0.5">
                          {cust.phone || <span className="text-[#8C9E96] italic font-sans">No phone</span>}
                        </div>
                      </td>

                      {/* Last Appointment Date (STRICTLY COMPLETED ONLY) */}
                      <td className="py-3.5 px-5">
                        {lastBooking ? (
                          <div>
                            <div className="font-bold text-xs text-[#173F35]">
                              📅 {formatDisplayDate(lastBooking.startTime)}
                            </div>
                            {lastBooking.staff?.displayName && (
                              <div className="text-[10px] text-[#61766F] font-medium mt-0.5">
                                with {lastBooking.staff.displayName}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="text-[#8C9E96] italic text-xs block">No previous visit</span>
                            {nextBooking && (
                              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block mt-1">
                                Next: {new Date(nextBooking.startTime).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Appointments & Completed Visits Count */}
                      <td className="py-3.5 px-5 font-mono">
                        <div className="font-bold text-[#173F35]">
                          Appts: <strong className="text-[#123A32]">{apptsCount}</strong>
                        </div>
                        <div className="text-[11px] font-semibold text-[#61766F]">
                          Visits: <strong className={visitsCount > 0 ? 'text-emerald-700 font-extrabold' : 'text-[#61766F]'}>{visitsCount}</strong>
                        </div>
                      </td>

                      {/* Returning Customer (>= 2 Completed Visits) */}
                      <td className="py-3.5 px-5 font-bold text-xs">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          cust.isReturning
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {cust.isReturning ? 'Yes' : 'No'}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          cust.isActive
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {cust.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right space-x-1.5">
                        <Button size="sm" variant="secondary" onClick={() => handleViewCustomerProfile(cust)}>
                          Profile
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleOpenEditModal(cust)}>
                          Edit
                        </Button>
                        {canDeleteCustomer && cust.isActive && (
                          <Button size="sm" variant="danger-light" onClick={() => handleDeactivateCustomer(cust)}>
                            Deactivate
                          </Button>
                        )}
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
          <div className="p-4 border-t border-[#D5E4DC] flex items-center justify-between text-xs text-[#61766F] bg-[#F7FAFA]">
            <div>Showing {customers.length} of {pagination.total} customer records</div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchCustomers(pagination.page - 1)}
              >
                Previous
              </Button>
              <span className="font-extrabold font-mono text-[#173F35]">{pagination.page} / {pagination.totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchCustomers(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Create/Edit Modal */}
      <Modal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        title={editingCustomer ? 'Edit Customer Record' : 'Add New Customer'}
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <Input
            label="Full Name *"
            type="text"
            required
            value={customerForm.name}
            onChange={(e) => setCustomerForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Eleanor Vance"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              value={customerForm.email}
              onChange={(e) => setCustomerForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="client@example.com"
            />

            <Input
              label="Phone Number"
              type="tel"
              value={customerForm.phone}
              onChange={(e) => setCustomerForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="+91 98765 43210"
            />
          </div>

          <Input
            label="Address"
            type="text"
            value={customerForm.address}
            onChange={(e) => setCustomerForm((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="123 Main St, Hyderabad"
          />

          <Input
            label="Date of Birth"
            type="date"
            value={customerForm.dateOfBirth}
            onChange={(e) => setCustomerForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
          />

          <div className="flex justify-end space-x-2 pt-2 border-t border-[#E6EFEA]">
            <Button variant="outline" onClick={() => setCustomerModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Customer Profile CRM Drawer */}
      <Drawer
        isOpen={viewCustomerDrawerOpen}
        onClose={() => setViewCustomerDrawerOpen(false)}
        title={activeCustomer?.name || 'Customer Profile'}
        subtitle={activeCustomer ? `Client Record • ID: ${activeCustomer.id.substring(0, 8)}` : ''}
      >
        {activeCustomer && (
          <div className="space-y-6 text-xs text-[#173F35]">
            {/* Account Info Header */}
            <div className="p-4 bg-[#EEF6F1] rounded-2xl border border-[#D5E4DC] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-[#173F35]">{activeCustomer.name}</h3>
                  <p className="text-xs text-[#61766F] font-bold">
                    {activeCustomer.isReturning ? 'Returning Client' : 'New Client'} • {activeCustomer.appointmentsCount ?? (activeCustomer.bookings || []).length} Appointments • {activeCustomer.visitsCount ?? 0} Visits
                  </p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeCustomer.isActive
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {activeCustomer.isActive ? 'Active Directory' : 'Inactive'}
                </span>
              </div>

              {/* Distinct Last Visit & Next Appointment Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-white rounded-xl border border-[#D5E4DC] space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-[#61766F] flex items-center space-x-1">
                    <History className="w-3 h-3 text-[#123A32]" />
                    <span>Last Visit</span>
                  </span>
                  {activeCustomer.lastBooking ? (
                    <div>
                      <div className="font-bold text-xs text-[#173F35]">{activeCustomer.lastBooking.service?.name}</div>
                      <div className="text-[10px] text-[#61766F]">
                        {new Date(activeCustomer.lastBooking.startTime).toLocaleDateString()} with {activeCustomer.lastBooking.staff?.displayName || 'Staff'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-[#8C9E96] italic">No previous visit</div>
                  )}
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-800 flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-emerald-700" />
                    <span>Next Appointment</span>
                  </span>
                  {activeCustomer.nextBooking ? (
                    <div>
                      <div className="font-bold text-xs text-[#173F35]">{activeCustomer.nextBooking.service?.name}</div>
                      <div className="text-[10px] text-emerald-900 font-medium">
                        {new Date(activeCustomer.nextBooking.startTime).toLocaleDateString()} at {new Date(activeCustomer.nextBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} with {activeCustomer.nextBooking.staff?.displayName || 'Staff'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-800/70 italic">No upcoming appointment</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#D5E4DC] text-xs">
                <div>
                  <span className="text-[#61766F] font-medium block">Email:</span>
                  <span className="font-mono font-bold text-[#173F35]">{activeCustomer.email || 'Not recorded'}</span>
                </div>
                <div>
                  <span className="text-[#61766F] font-medium block">Phone:</span>
                  <span className="font-mono font-bold text-[#173F35]">{activeCustomer.phone || 'Not recorded'}</span>
                </div>
                <div>
                  <span className="text-[#61766F] font-medium block">Address:</span>
                  <span className="font-bold text-[#173F35]">{activeCustomer.address || 'Not recorded'}</span>
                </div>
                <div>
                  <span className="text-[#61766F] font-medium block">Client Since:</span>
                  <span className="font-mono font-bold text-[#173F35]">{new Date(activeCustomer.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Profile Navigation Tabs */}
            <div className="inline-flex p-1 bg-[#EEF6F1] border border-[#D5E4DC] rounded-xl text-xs font-extrabold w-full">
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'history' ? 'bg-[#123A32] text-white shadow-2xs' : 'text-[#61766F] hover:text-[#173F35]'
                }`}
              >
                Appointment History ({(activeCustomer.bookings || []).length})
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'notes' ? 'bg-[#123A32] text-white shadow-2xs' : 'text-[#61766F] hover:text-[#173F35]'
                }`}
              >
                Internal Notes ({(activeCustomer.notes || []).length})
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'reviews' ? 'bg-[#123A32] text-white shadow-2xs' : 'text-[#61766F] hover:text-[#173F35]'
                }`}
              >
                Reviews ({(activeCustomer.reviews || []).length})
              </button>
            </div>

            {/* TAB 1: APPOINTMENT HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                {(activeCustomer.bookings || []).length === 0 ? (
                  <p className="text-xs text-[#8C9E96] italic text-center py-6">No appointments recorded for this client yet.</p>
                ) : (
                  (activeCustomer.bookings || []).map((b) => (
                    <div key={b.id} className="p-3.5 bg-white rounded-xl border border-[#D5E4DC] shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs font-black">
                        <span className="text-[#173F35] font-heading">{b.service?.name}</span>
                        <span className="uppercase text-[9px] px-2 py-0.5 rounded font-extrabold bg-[#EEF6F1] text-[#123A32] border border-[#D5E4DC]">
                          {b.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#61766F] font-medium">
                        <span>📅 {new Date(b.startTime).toLocaleDateString()} at {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>👤 {b.staff?.displayName || 'Staff Specialist'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E6EFEA]">
                        <span className="text-[#61766F]">Duration: {b.service?.durationMinutes || 45} mins</span>
                        <span className="font-black text-emerald-800">₹{Number(b.totalAmount || b.service?.price || 0).toFixed(0)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: INTERNAL NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={2}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Record an internal note about client preferences or history..."
                    className="w-full px-3.5 py-2.5 bg-[#F7FAFA] border border-[#D5E4DC] rounded-xl text-xs text-[#173F35] placeholder-[#8C9E96] focus:outline-none focus:ring-2 focus:ring-[#123A32] resize-none"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={!noteContent.trim()}>
                      + Add Internal Note
                    </Button>
                  </div>
                </form>

                <div className="space-y-2.5">
                  {(activeCustomer.notes || []).length === 0 ? (
                    <p className="text-xs text-[#8C9E96] italic text-center py-4">No internal notes recorded yet.</p>
                  ) : (
                    (activeCustomer.notes || []).map((note) => {
                      const isAuthor = note.authorUserId === currentUser?.id;
                      const canManageNote = isAuthor || role === 'OWNER' || role === 'ADMIN';

                      return (
                        <div key={note.id} className="p-3.5 bg-white rounded-xl border border-[#D5E4DC] text-xs space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between text-[#61766F]">
                            <span className="font-bold text-[#173F35]">{note.author?.name || 'Staff Member'}</span>
                            <div className="flex items-center space-x-2 font-mono">
                              <span>{new Date(note.createdAt).toLocaleString()}</span>
                              {canManageNote && (
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="text-rose-600 hover:text-rose-800 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-[#173F35] font-medium whitespace-pre-wrap">{note.content}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: CUSTOMER REVIEWS */}
            {activeTab === 'reviews' && (
              <div className="space-y-3">
                {(activeCustomer.reviews || []).length === 0 ? (
                  <p className="text-xs text-[#8C9E96] italic text-center py-6">No reviews submitted by this client yet.</p>
                ) : (
                  (activeCustomer.reviews || []).map((rev) => (
                    <div key={rev.id} className="p-3.5 bg-white rounded-xl border border-[#D5E4DC] shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-amber-500 font-bold">
                          {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                          <span className="text-xs text-[#173F35] ml-1">{rev.rating}/5</span>
                        </div>
                        <span className="text-[10px] text-[#61766F] font-mono">{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                      {rev.comment && <p className="text-xs text-[#173F35] font-medium italic">"{rev.comment}"</p>}
                      <div className="text-[10px] text-[#61766F] font-bold">Service: {rev.booking?.service?.name || 'Service'}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
