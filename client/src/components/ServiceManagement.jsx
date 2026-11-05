import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiRequest } from '../services/api';
import {
  Scissors,
  Tag,
  Plus,
  Edit2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  Filter,
  Sparkles,
  Power,
  Grid,
  List,
  IndianRupee
} from 'lucide-react';
import PageHeader from './ui/PageHeader';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Select from './ui/Select';
import EmptyState from './ui/EmptyState';
import LoadingState from './ui/LoadingState';

export default function ServiceManagement({ business }) {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filters & Views
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // Modals
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // Forms
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: '',
    durationMinutes: '',
    categoryId: '',
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
  });

  const role = business?.currentUserRole || 'STAFF';
  const canManage = role === 'OWNER' || role === 'ADMIN';

  const fetchData = useCallback(async () => {
    if (!business?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [svcRes, catRes] = await Promise.all([
        apiRequest(`/businesses/${business.id}/services`),
        apiRequest(`/businesses/${business.id}/service-categories`),
      ]);

      const [svcData, catData] = await Promise.all([svcRes.json(), catRes.json()]);

      if (svcRes.ok) setServices(svcData.data || []);
      if (catRes.ok) setCategories(catData.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [business?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAddService = () => {
    setEditingService(null);
    setServiceForm({ name: '', description: '', price: '', durationMinutes: '30', categoryId: '' });
    setServiceModalOpen(true);
  };

  const handleOpenEditService = (service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      durationMinutes: service.durationMinutes.toString(),
      categoryId: service.categoryId || '',
    });
    setServiceModalOpen(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    setError(null);
    setActionSuccess(null);

    const payload = {
      name: serviceForm.name,
      description: serviceForm.description || undefined,
      price: parseFloat(serviceForm.price),
      durationMinutes: parseInt(serviceForm.durationMinutes, 10),
      categoryId: serviceForm.categoryId || null,
    };

    try {
      const endpoint = editingService
        ? `/businesses/${business.id}/services/${editingService.id}`
        : `/businesses/${business.id}/services`;
      const method = editingService ? 'PATCH' : 'POST';

      const res = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to save service.');

      setActionSuccess(editingService ? `Updated '${data.data.name}'` : `Created service '${data.data.name}'`);
      setServiceModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (service) => {
    try {
      const res = await apiRequest(`/businesses/${business.id}/services/${service.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !service.isActive }),
      });
      if (res.ok) {
        setActionSuccess(`Service '${service.name}' ${service.isActive ? 'deactivated' : 'activated'}`);
        fetchData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await apiRequest(`/businesses/${business.id}/service-categories`, {
        method: 'POST',
        body: JSON.stringify(categoryForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create category.');

      setActionSuccess(`Category '${data.data.name}' created`);
      setCategoryModalOpen(false);
      setCategoryForm({ name: '', description: '' });
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Filtered Services Calculation
  const filteredServices = useMemo(() => {
    return services.filter((svc) => {
      const matchesCategory =
        selectedCategory === 'ALL'
          ? true
          : selectedCategory === 'UNCATEGORIZED'
          ? !svc.categoryId
          : svc.categoryId === selectedCategory;

      const matchesSearch =
        searchQuery.trim() === '' ||
        svc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (svc.description && svc.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [services, selectedCategory, searchQuery]);

  // Metrics
  const activeCount = services.filter((s) => s.isActive).length;
  const avgPrice =
    services.length > 0
      ? Math.round(services.reduce((sum, s) => sum + parseFloat(s.price || 0), 0) / services.length)
      : 0;

  return (
    <div className="space-y-6 font-sans text-[#102C26]">
      <PageHeader
        title="Services"
        subtitle="Manage the services offered by your business"
        actions={
          canManage && (
            <div className="flex items-center space-x-2.5">
              <Button variant="outline" size="sm" onClick={() => setCategoryModalOpen(true)} icon={Tag}>
                Category
              </Button>
              <Button size="sm" onClick={handleOpenAddService} icon={Plus}>
                Add Service
              </Button>
            </div>
          )
        }
      />

      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-[#DFF2E9] border border-[#0B8F6A]/30 text-xs font-bold text-[#0B8F6A] flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#0B8F6A] flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-xs font-bold opacity-60 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-900 flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs font-bold opacity-60 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Stat Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-[#CBDCD3] shadow-2xs space-y-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#52665F]">Total Services</span>
          <div className="text-2xl font-black text-[#102C26] font-heading">{services.length}</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#CBDCD3] shadow-2xs space-y-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#52665F]">Active Services</span>
          <div className="text-2xl font-black text-[#0B8F6A] font-heading">{activeCount}</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#CBDCD3] shadow-2xs space-y-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#52665F]">Average Price</span>
          <div className="text-2xl font-black text-[#102C26] font-heading">₹{avgPrice}</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#CBDCD3] shadow-2xs space-y-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#52665F]">Categories</span>
          <div className="text-2xl font-black text-[#102C26] font-heading">{categories.length}</div>
        </div>
      </div>

      {/* Filter, Search & View Switcher Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#CBDCD3] shadow-2xs">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#52665F]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services by name or details..."
            className="w-full pl-9 pr-4 py-2 bg-[#F4F8F5] border border-[#CBDCD3] rounded-xl text-xs text-[#102C26] placeholder-[#52665F] focus:outline-none focus:ring-2 focus:ring-[#0B8F6A]/20 focus:border-[#0B8F6A] transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#52665F] hover:text-[#102C26]"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'ALL'
                  ? 'bg-[#1D4439] text-white shadow-2xs'
                  : 'bg-[#EEF6F1] text-[#52665F] hover:text-[#102C26] hover:bg-[#E2ECE7]'
              }`}
            >
              All ({services.length})
            </button>

            {categories.map((cat) => {
              const count = services.filter((s) => s.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-[#1D4439] text-white shadow-2xs'
                      : 'bg-[#EEF6F1] text-[#52665F] hover:text-[#102C26] hover:bg-[#E2ECE7]'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#EEF6F1] p-1 rounded-xl border border-[#CBDCD3] shrink-0">
            <button
              onClick={() => setViewMode('cards')}
              title="Cards View"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-[#102C26] shadow-2xs' : 'text-[#52665F] hover:text-[#102C26]'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-[#102C26] shadow-2xs' : 'text-[#52665F] hover:text-[#102C26]'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="Loading service catalog..." />
      ) : filteredServices.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#CBDCD3] p-8">
          <EmptyState
            icon={Scissors}
            title={searchQuery ? 'No matching services found' : 'No services available'}
            description={
              searchQuery
                ? `No services match your search "${searchQuery}".`
                : 'Start building your service menu to accept client bookings.'
            }
            actionLabel={canManage ? 'Add Service' : undefined}
            actionIcon={Plus}
            onAction={canManage ? handleOpenAddService : undefined}
          />
        </div>
      ) : viewMode === 'cards' ? (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((svc) => (
            <div
              key={svc.id}
              className={`bg-white rounded-3xl border transition-all duration-200 p-5 flex flex-col justify-between space-y-4 hover:shadow-[0_12px_30px_rgba(16,44,38,0.08)] group relative overflow-hidden ${
                svc.isActive
                  ? 'border-[#CBDCD3] hover:border-[#0B8F6A]'
                  : 'border-slate-200 bg-slate-50/50 opacity-80'
              }`}
            >
              {/* Subtle Ambient Color Pill Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="p-2 rounded-xl bg-[#EEF6F1] text-[#0B8F6A] border border-[#0B8F6A]/10 group-hover:bg-[#DFF2E9] transition-colors">
                      <Scissors className="w-4 h-4" />
                    </span>
                    {svc.category ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-1 bg-[#DFF2E9] text-[#0B8F6A] rounded-full border border-[#0B8F6A]/20">
                        {svc.category.name}
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full border border-slate-200 italic">
                        Uncategorized
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-black text-[#102C26] font-heading tracking-tight pt-1">
                    {svc.name}
                  </h3>
                </div>

                {/* Status Indicator Pill */}
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center space-x-1.5 shrink-0 ${
                    svc.isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      svc.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  <span>{svc.isActive ? 'Active' : 'Inactive'}</span>
                </span>
              </div>

              {/* Service Description */}
              <p className="text-xs text-[#52665F] leading-relaxed font-medium line-clamp-2 min-h-[2.25rem]">
                {svc.description || 'No detailed description provided.'}
              </p>

              {/* Price & Duration Feature Box */}
              <div className="p-3.5 rounded-2xl bg-[#F4F8F5] border border-[#CBDCD3]/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#52665F] block">
                    Price
                  </span>
                  <span className="text-lg font-black text-[#0B8F6A] font-heading">
                    ₹{parseFloat(svc.price).toFixed(0)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#52665F] block">
                    Duration
                  </span>
                  <span className="text-xs font-black text-[#102C26] font-mono inline-flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-[#0B8F6A]" />
                    <span>{svc.durationMinutes} mins</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons Footer */}
              {canManage && (
                <div className="pt-2 flex items-center space-x-2 border-t border-[#CBDCD3]/50">
                  <button
                    type="button"
                    onClick={() => handleOpenEditService(svc)}
                    className="flex-1 py-2 px-3 bg-[#EEF6F1] hover:bg-[#DFF2E9] text-[#102C26] text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer border border-[#CBDCD3]"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#0B8F6A]" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(svc)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer border ${
                      svc.isActive
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{svc.isActive ? 'Deactivate' : 'Activate'}</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW FALLBACK */
        <div className="bg-white rounded-3xl border border-[#CBDCD3] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F4F8F5] border-b border-[#CBDCD3] text-[11px] font-bold text-[#52665F] uppercase tracking-wider">
                  <th className="py-3.5 px-6">Service</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Price</th>
                  <th className="py-3.5 px-6">Duration</th>
                  <th className="py-3.5 px-6">Status</th>
                  {canManage && <th className="py-3.5 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CBDCD3]/50 text-xs text-[#102C26]">
                {filteredServices.map((svc) => (
                  <tr key={svc.id} className="hover:bg-[#F4F8F5]/60 transition-colors">
                    <td className="py-4 px-6 font-bold">
                      <div className="text-sm font-black font-heading text-[#102C26]">{svc.name}</div>
                      {svc.description && (
                        <div className="text-[#52665F] font-normal text-xs mt-0.5 truncate max-w-xs">
                          {svc.description}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {svc.category ? (
                        <span className="text-[10px] font-extrabold px-2.5 py-1 bg-[#DFF2E9] text-[#0B8F6A] rounded-full border border-[#0B8F6A]/20">
                          {svc.category.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Uncategorized</span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-[#0B8F6A] text-sm">
                      ₹{parseFloat(svc.price).toFixed(0)}
                    </td>
                    <td className="py-4 px-6 font-medium font-mono">
                      <span className="inline-flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-[#0B8F6A]" />
                        <span>{svc.durationMinutes} mins</span>
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                          svc.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {svc.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canManage && (
                      <td className="py-4 px-6 text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleOpenEditService(svc)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={svc.isActive ? 'danger-light' : 'secondary'}
                          onClick={() => handleToggleActive(svc)}
                        >
                          {svc.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Service Create/Edit Modal */}
      <Modal
        isOpen={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        title={editingService ? 'Edit Service' : 'Add New Service'}
      >
        <form onSubmit={handleSaveService} className="space-y-4 font-sans text-[#102C26]">
          <Input
            label="Service Name"
            type="text"
            required
            value={serviceForm.name}
            onChange={(e) => setServiceForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Signature Haircut & Styling"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (₹)"
              type="number"
              step="1"
              min="0"
              required
              value={serviceForm.price}
              onChange={(e) => setServiceForm((prev) => ({ ...prev, price: e.target.value }))}
              placeholder="500"
            />

            <Input
              label="Duration (Minutes)"
              type="number"
              min="1"
              required
              value={serviceForm.durationMinutes}
              onChange={(e) => setServiceForm((prev) => ({ ...prev, durationMinutes: e.target.value }))}
              placeholder="45"
            />
          </div>

          <Select
            label="Category"
            value={serviceForm.categoryId}
            onChange={(e) => setServiceForm((prev) => ({ ...prev, categoryId: e.target.value }))}
          >
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <div className="space-y-1">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#52665F]">
              Description
            </label>
            <textarea
              rows={3}
              value={serviceForm.description}
              onChange={(e) => setServiceForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Optional service details..."
              className="w-full px-3.5 py-2.5 bg-[#F4F8F5] border border-[#CBDCD3] rounded-2xl text-xs text-[#102C26] placeholder-[#52665F] focus:outline-none focus:ring-2 focus:ring-[#0B8F6A]/20 focus:border-[#0B8F6A] transition-all resize-none font-medium"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={() => setServiceModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Service
            </Button>
          </div>
        </form>
      </Modal>

      {/* Category Create Modal */}
      <Modal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Add Service Category"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4 font-sans text-[#102C26]">
          <Input
            label="Category Name"
            type="text"
            required
            value={categoryForm.name}
            onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Haircuts & Styling"
          />

          <div className="space-y-1">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#52665F]">
              Description
            </label>
            <textarea
              rows={2}
              value={categoryForm.description}
              onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Optional category description..."
              className="w-full px-3.5 py-2.5 bg-[#F4F8F5] border border-[#CBDCD3] rounded-2xl text-xs text-[#102C26] placeholder-[#52665F] focus:outline-none focus:ring-2 focus:ring-[#0B8F6A]/20 focus:border-[#0B8F6A] transition-all resize-none font-medium"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={() => setCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

