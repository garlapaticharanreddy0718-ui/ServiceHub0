import React, { useState } from 'react';
import { apiRequest } from '../services/api';
import { Building2, Tag, Phone, MapPin, FileText, AlertCircle } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';

export default function BusinessOnboardingForm({ onBusinessCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    phone: '',
    city: '',
    address: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest('/businesses', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || 'Failed to create business.');
      }

      if (onBusinessCreated) {
        onBusinessCreated(resData.data);
      }
    } catch (err) {
      setError(err.message || 'Unable to register business.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
      <div className="text-center mb-6 space-y-2">
        <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-xs">
          <Building2 className="w-6 h-6 text-sky-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Create Your Business</h2>
        <p className="text-xs text-slate-500">Set up your business profile to start managing services, staff, and appointments</p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-3 text-red-800 text-xs">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Business Name"
          type="text"
          name="name"
          required
          icon={Building2}
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Apex Salon & Spa"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Category"
            type="text"
            name="category"
            icon={Tag}
            value={formData.category}
            onChange={handleChange}
            placeholder="e.g. Hair & Beauty"
          />

          <Input
            label="Phone Number"
            type="tel"
            name="phone"
            icon={Phone}
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="City"
            type="text"
            name="city"
            icon={MapPin}
            value={formData.city}
            onChange={handleChange}
            placeholder="New York"
          />

          <Input
            label="Address"
            type="text"
            name="address"
            icon={MapPin}
            value={formData.address}
            onChange={handleChange}
            placeholder="123 Main St, Suite 4B"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Description
          </label>
          <textarea
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of your business services..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-500 transition-all"
          />
        </div>

        <Button type="submit" fullWidth loading={loading} size="lg">
          Create Business
        </Button>
      </form>
    </div>
  );
}
