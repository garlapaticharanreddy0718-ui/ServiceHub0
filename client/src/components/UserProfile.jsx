import React, { useState, useEffect } from 'react';
import { apiRequest, setAccessToken } from '../services/api';
import { User, LogOut, Mail, Phone, MapPin, Calendar, ShieldCheck, Edit3, Check, X, Loader2, AlertCircle } from 'lucide-react';

export default function UserProfile({ user, onLogout, onUserUpdate }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  // Sync form state when prop user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
    });
    setErrorMessage(null);
    setEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const nameTrimmed = formData.name.trim();
    const emailTrimmed = formData.email.trim();
    const phoneTrimmed = formData.phone ? formData.phone.trim() : '';
    const addressTrimmed = formData.address ? formData.address.trim() : '';

    if (!nameTrimmed) {
      setErrorMessage('Full Name is required.');
      return;
    }

    if (!emailTrimmed) {
      setErrorMessage('Email address is required.');
      return;
    }

    setSaving(true);

    try {
      const response = await apiRequest('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: nameTrimmed,
          email: emailTrimmed,
          phone: phoneTrimmed || null,
          address: addressTrimmed || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update your profile. Please try again.');
      }

      const updatedUser = data.data?.user || {
        ...user,
        name: nameTrimmed,
        email: emailTrimmed,
        phone: phoneTrimmed || null,
        address: addressTrimmed || null,
      };

      if (onUserUpdate) onUserUpdate(updatedUser);
      setSuccessMessage('Profile updated successfully.');
      setEditing(false);

      // Auto-clear success message after 4 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err) {
      console.error('Profile update error:', err);
      setErrorMessage(err.message || 'Unable to update your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutClick = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setAccessToken(null);
      if (onLogout) onLogout();
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-8 space-y-4 text-center animate-pulse">
        <div className="h-8 bg-[#D5E4DC] rounded-xl w-1/3 mx-auto"></div>
        <div className="h-32 bg-white rounded-3xl border border-[#D5E4DC]"></div>
      </div>
    );
  }

  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* 1. Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-[#173F35] tracking-tight font-heading">
          My Profile
        </h1>
        <p className="text-sm text-[#61766F] font-medium font-sans">
          Manage your personal information and account details.
        </p>
      </div>

      {/* Alert Notifications */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-900 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Profile Header Card */}
      <div className="bg-white rounded-3xl border border-[#D5E4DC] shadow-[0_4px_20px_rgba(23,63,53,0.05)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-[#173F35] text-[#AEC5B8] flex items-center justify-center font-black text-2xl shadow-xs shrink-0">
            {initial}
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <h2 className="text-xl font-black text-[#173F35] font-heading">{user.name}</h2>
              <span className="bg-[#E4EFE8] text-[#173F35] border border-[#C6DCD0] font-bold text-[10px] px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                CUSTOMER
              </span>
            </div>
            <p className="text-xs font-semibold text-[#61766F]">{user.email}</p>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleLogoutClick}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* 3. Personal Information Card */}
      <div className="bg-white rounded-3xl border border-[#D5E4DC] shadow-[0_4px_20px_rgba(23,63,53,0.05)] p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5EDE7]">
          <div>
            <h3 className="text-base font-black text-[#173F35] font-heading">
              Personal Information
            </h3>
            <p className="text-xs text-[#61766F] mt-0.5 font-medium">
              Your contact details used for appointments and bookings.
            </p>
          </div>

          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold text-[#173F35] bg-[#EEF5F1] hover:bg-[#E4EFE8] border border-[#D5E4DC] transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 rounded-full text-xs font-bold text-[#61766F] bg-white hover:bg-slate-50 border border-[#D5E4DC] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-full text-xs font-bold text-white bg-[#173F35] hover:bg-[#102D26] shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {!editing ? (
          /* View Mode Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-4 rounded-2xl bg-[#F4F8F6] border border-[#D5E4DC]/70 space-y-1">
              <span className="text-[#61766F] text-[11px] font-bold flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-[#173F35]" />
                <span>Full Name</span>
              </span>
              <p className="text-sm font-extrabold text-[#173F35]">{user.name}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F8F6] border border-[#D5E4DC]/70 space-y-1">
              <span className="text-[#61766F] text-[11px] font-bold flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-[#173F35]" />
                <span>Email Address</span>
              </span>
              <p className="text-sm font-extrabold text-[#173F35]">{user.email}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F8F6] border border-[#D5E4DC]/70 space-y-1">
              <span className="text-[#61766F] text-[11px] font-bold flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-[#173F35]" />
                <span>Phone Number</span>
              </span>
              <p className={`text-sm font-extrabold ${user.phone ? 'text-[#173F35]' : 'text-[#61766F]/70 font-normal italic'}`}>
                {user.phone || 'Not added yet'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F8F6] border border-[#D5E4DC]/70 space-y-1">
              <span className="text-[#61766F] text-[11px] font-bold flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#173F35]" />
                <span>Address</span>
              </span>
              <p className={`text-sm font-extrabold ${user.address ? 'text-[#173F35]' : 'text-[#61766F]/70 font-normal italic'}`}>
                {user.address || 'Not added yet'}
              </p>
            </div>
          </div>
        ) : (
          /* Edit Mode Form */
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#173F35] block">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5E4DC] focus:outline-none focus:ring-2 focus:ring-[#173F35] text-xs font-medium text-[#173F35] bg-white"
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#173F35] block">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5E4DC] focus:outline-none focus:ring-2 focus:ring-[#173F35] text-xs font-medium text-[#173F35] bg-white"
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#173F35] block">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5E4DC] focus:outline-none focus:ring-2 focus:ring-[#173F35] text-xs font-medium text-[#173F35] bg-white"
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#173F35] block">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5E4DC] focus:outline-none focus:ring-2 focus:ring-[#173F35] text-xs font-medium text-[#173F35] bg-white"
                placeholder="Street address, City, State"
              />
            </div>
          </form>
        )}
      </div>

      {/* 4. Account Information Card */}
      <div className="bg-white rounded-3xl border border-[#D5E4DC] shadow-[0_4px_20px_rgba(23,63,53,0.05)] p-6 sm:p-8 space-y-4">
        <div>
          <h3 className="text-base font-black text-[#173F35] font-heading">
            Account Information
          </h3>
          <p className="text-xs text-[#61766F] mt-0.5 font-medium">
            System metadata regarding your ServiceHub platform membership.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3.5 rounded-2xl bg-[#F4F8F6] border border-[#D5E4DC]/70 space-y-0.5">
            <span className="text-[#61766F] text-[10px] font-bold uppercase tracking-wider block">
              Account Type
            </span>
            <span className="text-xs font-extrabold text-[#173F35]">Customer Account</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F4F8F6] border border-[#D5E4DC]/70 space-y-0.5">
            <span className="text-[#61766F] text-[10px] font-bold uppercase tracking-wider block">
              Registered Email
            </span>
            <span className="text-xs font-extrabold text-[#173F35] truncate block">
              {user.email}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F4F8F6] border border-[#D5E4DC]/70 space-y-0.5">
            <span className="text-[#61766F] text-[10px] font-bold uppercase tracking-wider block">
              Member Since
            </span>
            <span className="text-xs font-extrabold text-[#173F35] block">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Verified Member'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
