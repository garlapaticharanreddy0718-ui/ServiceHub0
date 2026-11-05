import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Building2, MapPin, Phone, FileText, CheckCircle2, AlertCircle, Save, Globe, Navigation, ChevronDown, ChevronUp } from 'lucide-react';
import Input from './ui/Input';
import Select from './ui/Select';
import Button from './ui/Button';
import Modal from './ui/Modal';

export default function BusinessSettings({ selectedBusiness, currentUser, onBusinessUpdated }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Beauty & Salon',
    description: '',
    phone: '',
    address: '',
    city: 'Hyderabad',
    latitude: '',
    longitude: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showAdvancedCoords, setShowAdvancedCoords] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    if (selectedBusiness) {
      setFormData({
        name: selectedBusiness.name || '',
        category: selectedBusiness.category || 'Beauty & Salon',
        description: selectedBusiness.description || '',
        phone: selectedBusiness.phone || '',
        address: selectedBusiness.address || '',
        city: selectedBusiness.city || 'Hyderabad',
        latitude: selectedBusiness.latitude !== null && selectedBusiness.latitude !== undefined ? String(selectedBusiness.latitude) : '',
        longitude: selectedBusiness.longitude !== null && selectedBusiness.longitude !== undefined ? String(selectedBusiness.longitude) : '',
      });
    }
  }, [selectedBusiness]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBusiness?.id) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      description: formData.description.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      address: formData.address.trim() || undefined,
      city: formData.city.trim() || undefined,
      latitude: formData.latitude !== '' ? Number(formData.latitude) : undefined,
      longitude: formData.longitude !== '' ? Number(formData.longitude) : undefined,
    };

    try {
      const res = await apiRequest(`/businesses/${selectedBusiness.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update business settings.');

      setSuccessMsg('Business settings updated successfully!');
      if (onBusinessUpdated) {
        onBusinessUpdated(data.data);
      }
    } catch (err) {
      console.error('Settings update error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPresetLocation = (preset) => {
    setFormData((prev) => ({
      ...prev,
      address: preset.address,
      city: preset.city,
      latitude: String(preset.latitude),
      longitude: String(preset.longitude),
    }));
    setLocationPickerOpen(false);
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        setFormData((prev) => ({
          ...prev,
          latitude: String(lat),
          longitude: String(lng),
        }));
        setGpsLoading(false);
        setLocationPickerOpen(false);
      },
      (err) => {
        setGpsLoading(false);
        alert('Could not retrieve device location. Please select a location preset or enter coordinates manually.');
      }
    );
  };

  const categoryOptions = [
    { value: 'Beauty & Salon', label: 'Beauty & Salon' },
    { value: 'Wellness & Spa', label: 'Wellness & Spa' },
    { value: 'Fitness Center', label: 'Fitness Center' },
    { value: 'Repair Business', label: 'Repair Business' },
    { value: 'Cleaning Business', label: 'Cleaning Business' },
    { value: 'Consulting', label: 'Consulting' },
    { value: 'Tutoring', label: 'Tutoring' },
    { value: 'Home Services', label: 'Home Services' },
    { value: 'Photography', label: 'Photography' },
  ];

  const popularLocationPresets = [
    { name: 'Jubilee Hills', city: 'Hyderabad', address: 'Road No. 36, Jubilee Hills', latitude: 17.4334, longitude: 78.4026 },
    { name: 'Banjara Hills', city: 'Hyderabad', address: 'Road No. 12, Banjara Hills', latitude: 17.4156, longitude: 78.4483 },
    { name: 'Hitech City', city: 'Hyderabad', address: 'Mindspace IT Park, Hitech City', latitude: 17.4435, longitude: 78.3772 },
    { name: 'Gachibowli', city: 'Hyderabad', address: 'Financial District, Gachibowli', latitude: 17.4401, longitude: 78.3489 },
    { name: 'Kondapur', city: 'Hyderabad', address: 'Botanical Garden Road, Kondapur', latitude: 17.4619, longitude: 78.3673 },
    { name: 'Begumpet', city: 'Hyderabad', address: 'SP Road, Begumpet', latitude: 17.4447, longitude: 78.4664 },
  ];

  return (
    <div className="space-y-6 text-[#173F35] font-sans pb-12 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-[#D5E4DC]">
        <h1 className="text-2xl font-black text-[#173F35] tracking-tight font-heading">
          Business Settings
        </h1>
        <p className="text-xs text-[#61766F] font-medium mt-0.5">
          Manage your business identity, contact details, location address, and map discovery coordinates.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-900 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-[#D5E4DC] rounded-2xl p-6 shadow-2xs space-y-6">
        {/* Basic Business Info */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#123A32] pb-2 border-b border-[#E6EFEA] flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-[#123A32]" />
            <span>BUSINESS IDENTITY</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Business Name *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Glow & Style Beauty Studio"
              required
            />

            <Select
              label="Business Category *"
              name="category"
              value={formData.category}
              onChange={handleChange}
              options={categoryOptions}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-[#173F35]">Business Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Brief description of your services, specialty, and environment..."
              className="w-full px-3.5 py-2.5 bg-[#F7FAFA] border border-[#D5E4DC] rounded-xl text-xs text-[#173F35] focus:outline-none focus:ring-2 focus:ring-[#123A32]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
            />
          </div>
        </div>

        {/* Business Location Section */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#E6EFEA] gap-2">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-[#123A32] flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#123A32]" />
                <span>BUSINESS LOCATION</span>
              </h2>
              <p className="text-xs text-[#61766F] font-medium mt-0.5">
                Help customers discover your business nearby.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setLocationPickerOpen(true)}
              className="px-3.5 py-1.5 bg-[#EEF6F1] text-[#123A32] border border-[#D5E4DC] rounded-xl text-xs font-extrabold hover:bg-[#CBDCD3] transition-all cursor-pointer shadow-2xs flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <MapPin className="w-3.5 h-3.5 text-[#123A32]" />
              <span>Pick Location</span>
            </button>
          </div>

          {/* Prominent Address Card Summary */}
          <div className="p-4 bg-[#EEF6F1] rounded-2xl border border-[#D5E4DC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="space-y-1">
              <div className="text-[10px] font-extrabold uppercase text-[#61766F] tracking-wider">
                Discovery Address & Map Pin
              </div>
              <div className="text-sm font-black text-[#173F35] font-heading">
                📍 {formData.address || 'Street Address'}, {formData.city}
              </div>
              <div className="text-xs font-mono text-[#61766F] font-bold">
                Map Coordinates: {formData.latitude || '0.0000'}° N, {formData.longitude || '0.0000'}° E
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLocationPickerOpen(true)}
              className="px-4 py-2 bg-[#123A32] text-white rounded-xl text-xs font-extrabold hover:bg-[#1A4B41] transition-all cursor-pointer shadow-2xs flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Pick Location</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Street Address *"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Plot No. 42, Road No. 36, Jubilee Hills"
              required
            />

            <Input
              label="City *"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Hyderabad"
              required
            />
          </div>

          {/* Advanced Location Coordinates Collapsible */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvancedCoords(!showAdvancedCoords)}
              className="text-xs font-extrabold text-[#123A32] underline hover:text-emerald-800 cursor-pointer flex items-center space-x-1"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>
                {showAdvancedCoords ? 'Hide Advanced Coordinates' : 'Show Advanced Location Coordinates (Lat/Lng)'}
              </span>
              {showAdvancedCoords ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showAdvancedCoords && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 p-4 bg-[#F7FAFA] border border-[#D5E4DC] rounded-2xl">
                <Input
                  label="Latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="17.4334"
                />

                <Input
                  label="Longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="78.4026"
                />
                <p className="text-[11px] text-[#61766F] font-medium col-span-full">
                  Coordinates enable customers to discover your studio on the Customer Discovery radius map.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-4 border-t border-[#E6EFEA] flex justify-end">
          <Button type="submit" variant="primary" loading={loading} icon={Save}>
            Save Changes
          </Button>
        </div>
      </form>

      {/* Pick Location Modal */}
      <Modal
        isOpen={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        title="Pick Business Location"
        subtitle="Select a landmark location preset or detect device GPS to position your business on the Customer Discovery map."
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3.5 bg-[#EEF6F1] rounded-xl border border-[#D5E4DC]">
            <div>
              <div className="text-xs font-extrabold text-[#173F35]">Automatic GPS Detection</div>
              <div className="text-[10px] text-[#61766F]">Set map coordinates using browser GPS</div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              loading={gpsLoading}
              onClick={handleDetectGPS}
              icon={Navigation}
            >
              Use My Device GPS
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-extrabold text-[#173F35] block">
              Popular Locality Presets (Click to Select)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {popularLocationPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPresetLocation(preset)}
                  className="p-3 bg-white border border-[#D5E4DC] hover:border-[#123A32] hover:bg-[#F9FCFA] rounded-xl text-left transition-all cursor-pointer shadow-2xs group space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-black text-[#173F35]">
                    <span>📍 {preset.name}</span>
                    <span className="text-[9px] font-mono font-bold text-[#123A32] bg-[#EEF6F1] px-1.5 py-0.5 rounded border border-[#D5E4DC]">
                      {preset.latitude}° N
                    </span>
                  </div>
                  <div className="text-[11px] text-[#61766F] font-medium truncate">{preset.address}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[#E6EFEA]">
            <Button variant="outline" onClick={() => setLocationPickerOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
